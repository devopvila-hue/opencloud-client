# Production API — `api.nexusaisys.com`

> How the OPENCloud frontend reaches the OPENCloud middleware in
> production, end-to-end.

**Last updated:** 2026-08-01

---

## 1. Architecture

```
┌──────────────────────┐
│      Browser         │  https://app.nexusaisys.com (Netlify)
│  (opencloud-client)  │  — SPA, served as static files
└──────────┬───────────┘
           │ fetch('/api/v1/*', { credentials: 'same-origin' })
           ▼
┌──────────────────────┐
│     Netlify CDN      │  https://*.netlify.app (or custom domain)
│  opencloud-client    │
│  netlify.toml rule:  │
│   /api/* → proxy     │  ← THIS RULE was missing in production
│                      │     and was the root cause of the outage
└──────────┬───────────┘
           │ HTTP redirect/rewrite (force=true, status=200)
           ▼
┌──────────────────────┐
│   DNS — A record     │  api.nexusaisys.com → 164.68.100.183
│   (cloudflare /      │  (auto-managed by Cloudflare; DNS-only
│    registrar DNS)    │   so Let's Encrypt can issue a cert)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  Caddy (systemd)     │  :443 — handles TLS termination
│  /etc/caddy/         │  Auto-provisions Let's Encrypt certs
│  conf.d/             │  Auto-renews every 60 days before expiry
│  api-nexusaisys.caddy│  HTTP/2, gzip, security headers
└──────────┬───────────┘
           │ reverse_proxy localhost:3210
           ▼
┌──────────────────────┐
│  OPENCloud           │  127.0.0.1:3210 (loopback ONLY)
│  Middleware          │  systemd unit: opencloud-middleware.service
│  (Fastify)           │  Talks to Supabase Cloud over TLS
└──────────┬───────────┘
           │ Postgres wire protocol (TLS)
           ▼
┌──────────────────────┐
│  Supabase Cloud      │  db.qygssfuqkqzrhwduafft.supabase.co
│  (managed Postgres)  │
└──────────────────────┘
```

**Key invariant:** the middleware listens **only on 127.0.0.1** — it is
never reachable from the public Internet. All traffic flows through
Caddy (TLS termination) and Netlify (`/api/*` rewrite).

---

## 2. DNS

| Record | Type | Value | TTL |
|--------|------|-------|-----|
| `api.nexusaisys.com` | A | `164.68.100.183` | Auto (Cloudflare) |
| `app.nexusaisys.com` | CNAME | `<netlify-site>.netlify.app` | Auto |
| `nexusaisys.com` | A / redirect | → `www.nexusaisys.com` | Auto |

**Verify:**
```bash
dig +short api.nexusaisys.com
# 164.68.100.183
```

⚠️ Cloudflare proxy MUST be **disabled (DNS-only, grey cloud)** for
`api.nexusaisys.com`. Let's Encrypt cannot issue a cert if Cloudflare
terminates TLS first.

---

## 3. Reverse proxy — Caddy

**File:** `/etc/caddy/conf.d/api-nexusaisys.caddy`

```caddy
api.nexusaisys.com {
    encode gzip

    request_body {
        max_size 50MB
    }

    reverse_proxy localhost:3210 {
        transport http {
            read_timeout 300s
            write_timeout 300s
        }
        header_up Host {host}
        header_up X-Real-IP {remote_host}
    }

    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }

    log {
        output file /var/log/caddy/api.nexusaisys.com.log {
            roll_size 100mb
            roll_keep 14
        }
        level INFO
    }
}
```

**Why Caddy and not Nginx:**
- Caddy is **already installed** (`/usr/bin/caddy`) and managed by
  Coolify — the same pattern is used for `radar.noxoiaempresas.com`
  and `oportuniaradar.com`.
- TLS / Let's Encrypt is **automatic** — no `certbot` cron, no
  manual renewal. Caddy renews when the cert is <30 days from expiry.
- The Caddyfile fragment lives in `/etc/caddy/conf.d/` and is
  auto-imported by the main `/etc/caddy/Caddyfile`:
  ```caddy
  import /etc/caddy/conf.d/*.caddy
  ```

**Reload after editing:**
```bash
# 1. Validate (catches typos before reload)
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

# 2. Reload (zero-downtime)
caddy reload --config /etc/caddy/Caddyfile --force

# 3. Verify
journalctl -u caddy --since "1 min ago" | tail -20
```

**Log file permissions:** Caddy runs as user `caddy` (uid 999). The
log file `/var/log/caddy/api.nexusaisys.com.log` must be owned by
`caddy:caddy`. If Caddy can't write to it, the reload fails with
`open ... permission denied`:

```bash
chown caddy:caddy /var/log/caddy/api.nexusaisys.com.log
chmod 644 /var/log/caddy/api.nexusaisys.com.log
```

---

## 4. SSL — Let's Encrypt (automatic via Caddy)

Caddy issues a Let's Encrypt cert for `api.nexusaisys.com` on first
request and stores it in `/var/lib/caddy/.local/share/caddy/`.

**Verify:**
```bash
echo | openssl s_client -servername api.nexusaisys.com \
  -connect api.nexusaisys.com:443 2>/dev/null \
  | openssl x509 -noout -subject -dates

# subject=CN = api.nexusaisys.com
# notBefore=Aug  1 06:01:14 2026 GMT
# notAfter=Oct 30 06:01:13 2026 GMT
```

**Renewal:** automatic. Caddy runs a background goroutine that checks
cert expiry and renews when <30 days remain. No cron required.

**Force renewal (debugging only):**
```bash
systemctl stop caddy
rm -rf /var/lib/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/api.nexusaisys.com*
systemctl start caddy
curl -I https://api.nexusaisys.com
```

---

## 5. Middleware — systemd unit

**File:** `/etc/systemd/system/opencloud-middleware.service`

```ini
[Unit]
Description=OPENCloud Middleware (API server on :3210)
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/opencloud-platform
EnvironmentFile=/opt/opencloud-platform/.env
ExecStart=/usr/bin/node /opt/opencloud-platform/apps/middleware/dist/server.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=20
LimitNOFILE=65536

StandardOutput=append:/var/log/opencloud-middleware.log
StandardError=append:/var/log/opencloud-middleware.log

[Install]
WantedBy=multi-user.target
```

**Manage:**
```bash
systemctl daemon-reload
systemctl enable opencloud-middleware.service
systemctl start  opencloud-middleware.service

# Status / logs
systemctl status opencloud-middleware.service
journalctl -u opencloud-middleware.service -f
tail -f /var/log/opencloud-middleware.log
```

**Verify loopback binding only:**
```bash
ss -tlnp | grep 3210
# LISTEN 0  511  127.0.0.1:3210  ...
```

If it ever shows `0.0.0.0:3210`, the middleware is publicly exposed —
investigate immediately.

---

## 6. Middleware — `.env` (CORS origins)

**File:** `/opt/opencloud-platform/.env`

```bash
MIDDLEWARE_PORT=3210
WEB_PORT=5173

# Allowed CORS origins — comma-separated. NEVER use "*" with
# credentials=true (browsers reject the combination).
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://app.nexusaisys.com,https://nexusaisys.com,https://www.nexusaisys.com,https://opencloud-client.netlify.app
```

The middleware reads this via `@opencloud/config` and uses it in the
CORS preflight handler:

```ts
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                  // same-origin / curl
    if (config.corsOrigins.includes('*')
        || config.corsOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Origin not allowed by CORS'), false);
  },
  credentials: true,                                    // cookie forwarding
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
});
```

**Test CORS:**
```bash
# Allowed → 200 + CORS headers
curl -I -H "Origin: https://app.nexusaisys.com" \
  https://api.nexusaisys.com/api/v1/me | grep -i "access-control"

# Disallowed → 500 (Origin not allowed by CORS)
curl -I -H "Origin: https://evil.com" \
  https://api.nexusaisys.com/api/v1/me
```

---

## 7. Netlify — `/api/*` rewrite

**File:** `netlify.toml` (in the `opencloud-client` repo)

```toml
[build]
  command = "npm run build"
  publish = "dist"
  node_version = "20"

# /api/* MUST come before the SPA fallback rule below.
[[redirects]]
  from = "/api/*"
  to = "https://api.nexusaisys.com/api/:splat"
  status = 200
  force = true

# SPA fallback — every non-API route serves index.html.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Rules:**
1. `from = "/api/*"` MUST appear **before** the `/*` SPA fallback —
   Netlify applies the first matching rule.
2. `force = true` makes Netlify rewrite the URL even when a static
   file matches (none does, but it's a defensive default).
3. `:splat` captures the wildcard and forwards it intact.
4. The destination URL is the **public hostname** (`api.nexusaisys.com`)
   — never the bare IP. Cloudflare's DNS-only mode + Let's Encrypt
   require the hostname.

**Deploy:**
```bash
# 1. Push the change
cd /tmp/opencloud-client
git add netlify.toml
git commit -m "fix: add /api/* rewrite to api.nexusaisys.com"
git push origin main

# 2. Netlify auto-builds + deploys (watch the build log)
# 3. Once deployed, smoke-test from the live domain:
curl -I https://app.nexusaisys.com/api/v1/health
# Expected: 200 OK (proxy to https://api.nexusaisys.com/api/v1/health)
```

---

## 8. Cookies — `opc_session`

The session cookie is set by the middleware via `@fastify/cookie` with
the following attributes (verified in `apps/middleware/src/server.ts`):

| Attribute | Value | Why |
|-----------|-------|-----|
| `HttpOnly` | ✅ true | JS cannot read it (XSS-safe) |
| `Secure` | ✅ true (in production via the `NODE_ENV` check) | Only sent over HTTPS |
| `SameSite` | `Lax` | Allows top-level navigations but not cross-site POSTs (CSRF-safe) |
| `Path` | `/` | Sent to every route on the API domain |
| `Domain` | unset → defaults to host | Browser sends it to `api.nexusaisys.com` |
| `Max-Age` | Session | Rotated on each refresh |

The middleware sets `Secure` automatically when it detects it's
running behind HTTPS. Verify:

```bash
# After a successful login, inspect the cookie
curl -sI -X POST -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}' \
  -c /tmp/cookies.txt \
  https://api.nexusaisys.com/api/v1/auth/login | grep -i "set-cookie"

# Expected:
# Set-Cookie: opc_session=...; Path=/; HttpOnly; Secure; SameSite=Lax
```

**Cross-domain cookie flow:**
1. Browser on `https://app.nexusaisys.com` (Netlify)
2. `fetch('/api/v1/auth/login', { credentials: 'same-origin' })`
3. Netlify rewrites to `https://api.nexusaisys.com/api/v1/auth/login`
4. Browser sees the response from a **different domain** → cookie
   belongs to `api.nexusaisys.com`, NOT to `app.nexusaisys.com`
5. Subsequent requests to `/api/*` are proxied by Netlify to
   `api.nexusaisys.com` → browser sends the `opc_session` cookie

⚠️ This means **the SPA cannot read the cookie** (correct — it's
HttpOnly) and **CORS credentials must be enabled** so the browser
attaches it (already configured in the middleware).

---

## 9. End-to-end verification

```bash
# 1. DNS resolves
dig +short api.nexusaisys.com
# → 164.68.100.183

# 2. SSL works
echo | openssl s_client -servername api.nexusaisys.com \
  -connect api.nexusaisys.com:443 2>/dev/null \
  | openssl x509 -noout -subject -dates

# 3. Public health endpoint
curl -sw "\nHTTP %{http_code}\n" https://api.nexusaisys.com/api/v1/health
# → {"data":{"status":"ok","service":"opencloud-middleware",...}}
# → HTTP 200

# 4. Authenticated endpoint reachable
curl -sw "\nHTTP %{http_code}\n" https://api.nexusaisys.com/api/v1/me
# → {"error":{"code":"AUTH_ERROR","message":"Not authenticated",...}}
# → HTTP 401  (NOT 200 with index.html)

# 5. Login validation (no auth yet)
curl -sw "\nHTTP %{http_code}\n" -X POST \
  -H "Content-Type: application/json" -d '{}' \
  https://api.nexusaisys.com/api/v1/auth/login
# → {"error":{"code":"VALIDATION_ERROR",...}}
# → HTTP 400  (proves the middleware parsed the body)

# 6. CORS allowed origin
curl -I -H "Origin: https://app.nexusaisys.com" \
  https://api.nexusaisys.com/api/v1/me | grep -i "access-control"
# → access-control-allow-origin: https://app.nexusaisys.com
# → access-control-allow-credentials: true

# 7. CORS disallowed origin
curl -I -H "Origin: https://evil.com" \
  https://api.nexusaisys.com/api/v1/me | head -1
# → HTTP/2 500  (Origin not allowed by CORS)

# 8. Port 3210 is loopback only
ss -tlnp | grep ":3210"
# → LISTEN ... 127.0.0.1:3210 ...
```

---

## 10. Deployment checklist

Run through this every time you change the proxy, the `.env`, or the
Netlify config:

- [ ] `dig +short api.nexusaisys.com` → `164.68.100.183`
- [ ] Caddy service: `systemctl status caddy` → `active (running)`
- [ ] Caddy config valid: `caddy validate --config /etc/caddy/Caddyfile`
- [ ] Caddy logs writable: `ls -la /var/log/caddy/api.nexusaisys.com.log`
- [ ] Middleware running: `systemctl status opencloud-middleware`
- [ ] Port 3210 bound to `127.0.0.1` only: `ss -tlnp | grep 3210`
- [ ] `/api/v1/health` returns 200 via `https://api.nexusaisys.com`
- [ ] SSL cert valid: openssl `notAfter` > 30 days from now
- [ ] CORS allowed for `https://app.nexusaisys.com`
- [ ] CORS rejects unknown origins
- [ ] Netlify `netlify.toml` includes the `/api/*` rule **before** the `/*` SPA fallback
- [ ] Netlify deploy log shows the new `netlify.toml` rules
- [ ] Browser DevTools → Network → `GET /api/v1/health` from the Netlify URL → status 200, no CORS error

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Browser shows `404 Not Found` for `/api/v1/health` | Netlify `netlify.toml` missing the `/api/*` rule, or the rule is **after** the SPA fallback | Add the `[[redirects]] /api/*` block above the `/*` block |
| Browser shows HTML instead of JSON | Same as above — Netlify served `index.html` | Same fix |
| `curl https://api.nexusaisys.com/api/v1/health` → connection refused | Caddy not running, or DNS doesn't resolve | `systemctl status caddy` + `dig +short api.nexusaisys.com` |
| Caddy log: `permission denied: /var/log/caddy/api.nexusaisys.com.log` | Caddy (uid 999) cannot write to the file | `chown caddy:caddy /var/log/caddy/api.nexusaisys.com.log && chmod 644` |
| Caddy log: `acme: error presenting challenge` | Cloudflare proxy is enabled (orange cloud) | Set `api.nexusaisys.com` to **DNS-only** (grey cloud) on Cloudflare |
| CORS error in browser console | Origin not in `CORS_ORIGINS` env var | Add the new origin to `/opt/opencloud-platform/.env`, then `systemctl restart opencloud-middleware` |
| `502 Bad Gateway` from Caddy | Middleware not running, or port changed | `systemctl status opencloud-middleware` |
| Middleware logs: `EADDRINUSE :::3210` | Another process bound to 3210 | `ss -tlnp | grep 3210` → kill the offending PID, then restart systemd unit |
| Middleware logs: `SUPABASE_URL not configured` | `.env` file missing or malformed | Verify `/opt/opencloud-platform/.env` has `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Middleware logs: `Postgres connection refused` | Supabase Cloud credentials wrong or network blocked | Test with `psql "<SUPABASE_URL>"` from the VPS; check firewall outbound to `5432` |
| Cookie not being sent on subsequent requests | `Secure` flag set but page loaded over HTTP, OR `SameSite=None` not used for cross-site | Verify the cookie was set: `Set-Cookie: opc_session=...; Secure; HttpOnly; SameSite=Lax` |
| Browser shows `opc_session=…; SameSite=None` warning | SameSite=None requires Secure | Don't downgrade SameSite; use `Lax` (current setup) |

---

## 12. Files involved

| File | Purpose |
|------|---------|
| `/etc/caddy/Caddyfile` | Caddy master config (imports `conf.d/*.caddy`) |
| `/etc/caddy/conf.d/api-nexusaisys.caddy` | Reverse-proxy block for the API |
| `/etc/systemd/system/opencloud-middleware.service` | Middleware unit |
| `/opt/opencloud-platform/.env` | Middleware env vars (CORS origins, Supabase, OpenClaw) |
| `/opt/opencloud-platform/apps/middleware/dist/server.js` | Compiled middleware (run by systemd) |
| `/var/log/opencloud-middleware.log` | Middleware stdout/stderr |
| `/var/log/caddy/api.nexusaisys.com.log` | Per-domain access log |
| `netlify.toml` (in `opencloud-client` repo) | `/api/*` rewrite rule |

---

## 13. What NOT to do

- ❌ **Don't bind the middleware to `0.0.0.0:3210`.** It MUST stay on `127.0.0.1` so only Caddy can reach it.
- ❌ **Don't use the bare IP in `netlify.toml`.** Use `https://api.nexusaisys.com/api/:splat` — Cloudflare's DNS + Let's Encrypt require a hostname.
- ❌ **Don't enable Cloudflare proxy on `api.nexusaisys.com`** (orange cloud). It must be DNS-only (grey cloud) so Let's Encrypt can reach the Caddy server on `:80`/`:443`.
- ❌ **Don't use `CORS_ORIGINS=*` with `credentials: true`.** Browsers reject the combination. List every origin explicitly.
- ❌ **Don't use HTTP cookies (`Secure` flag missing).** The middleware sets `Secure` automatically when behind HTTPS — keep it that way.
- ❌ **Don't add the `[[redirects]] /api/*` rule AFTER `/*`.** Netlify applies the first match, so the SPA fallback would win every time.
- ❌ **Don't expose the OpenClaw Gateway port (`:18789`) publicly.** It's bound to `127.0.0.1` only on purpose.
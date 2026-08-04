// Recorrido Playwright del Business Brain.
// Como el OnboardingGuard requiere sesión, abrimos el flujo
// inyectando un snapshot pre-poblado en localStorage y un token
// stub para que las queries devuelvan datos. Esto es solo para
// validar la EXPERIENCIA — no la integración con auth real.

import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:5180";
const OUT = "/tmp/opencloud-client/screenshots/brain-walkthrough";
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const SNAPSHOT_PHASES = [
  { name: "01-welcome", phase: "welcome" },
  { name: "03-analyzing", phase: "analyzing" },
  { name: "04-conversation", phase: "conversation" },
  { name: "05-integrations", phase: "integrations" },
  { name: "06-diagnosis", phase: "diagnosis" },
];

function makeSnapshot(phase) {
  const base = {
    phase,
    identity: { name: "Acme Industries", domain: "https://acme-marketing.com", country: "ES", employees: "11-50" },
    market: {
      sector: "Marketing / Media",
      detectedAt: new Date().toISOString(),
      valueProposition: "Acme Industries opera en marketing / media desde acme-marketing.com.",
      competitors: [],
      digitalPresence: [{ platform: "LinkedIn" }, { platform: "Twitter/X" }],
    },
    processes: [
      { description: "Actualizar las hojas de cálculo cada lunes.", category: "operations", signal: "time-sink" },
      { description: "Cruzar datos de ventas con inventario a mano.", category: "operations", signal: "pain" },
    ],
    tools: { primary: "google_workspace", connected: [], rejected: [] },
    objectives: { raw: "Quiero captar 30 clientes nuevos antes de fin de trimestre.", reformulation: "Quiero captar 30 clientes nuevos antes de fin de trimestre.", quarter: "current" },
    priorities: { worriedAbout: "Marketing", successDefinition: null },
    signals: {
      empresa: "complete",
      mercado: "complete",
      procesos: "complete",
      herramientas: "partial",
      objetivos: "complete",
      prioridades: "partial",
    },
    recommendations: {
      primary: { department: "marketing", reason: "Porque concentras el mayor peso de fricción operativa ahí, y coincide con tu objetivo de captar clientes.", priority: "primary" },
      secondary: { department: "operaciones", reason: "Lo haría en cuanto Marketing esté rodado, porque desbloquea fricciones distintas pero relacionadas.", priority: "secondary" },
      optional: [],
      avoid: [
        { department: "finanzas", reason: "no empezaría por aquí hasta tener operativo Marketing; suele generar dependencias sin retorno inmediato." },
        { department: "rrhh", reason: "me parece prematuro mientras tu foco es crecer; lo abordaríamos cuando la operación esté estabilizada." },
      ],
      rationale: "Ya trabajáis con Google Workspace, así que arrancar con Marketing será especialmente fluido.",
    },
    chosenDepartment: null,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  return base;
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  for (const vp of VIEWPORTS) {
    for (const sp of SNAPSHOT_PHASES) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      page.on("pageerror", (e) => errors.push(`[${vp.name}/${sp.name}] ${e.message}`));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`[${vp.name}/${sp.name}] ${msg.text()}`);
      });

      // Inyecta snapshot ANTES de cargar la página
      await page.addInitScript((snapshotJson) => {
        try {
          window.localStorage.setItem("departify.business_brain.v1", snapshotJson);
        } catch {}
      }, JSON.stringify(makeSnapshot(sp.phase)));

      try {
        await page.goto(`${BASE}/brain-demo`, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(2500);
        await page.screenshot({ path: `${OUT}/${vp.name}-${sp.name}.png`, fullPage: false });
        console.log(`✅ ${vp.name}/${sp.name}`);
      } catch (e) {
        console.log(`❌ ${vp.name}/${sp.name}: ${e.message?.slice(0, 100)}`);
      }
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`\nCapturas en: ${OUT}`);
  console.log(`Errores: ${errors.length}`);
  errors.slice(0, 10).forEach((e) => console.log("  -", e));
})();
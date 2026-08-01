import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  Check,
  ChevronLeft,
  Copy,
  MessageSquare,
  Paperclip,
  PenLine,
  Plus,
  RotateCcw,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { conversationsApi } from '@/api/endpoints';
import { useConversations, useCreateConversation, useDeleteConversation, useMessages } from '@/api/queries';
import type { ChatMessageRecord } from '@/api/endpoints';
import { useDepartmentCatalog } from '@/api/queries';
import { getDepartment } from '@/design-system/departments';
import { cn } from '@/design-system/cn';
import { formatRelativeTime, truncate } from '@/utils/format';
import { streamPost, type SseEvent } from '@/api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'pending' | 'streaming' | 'completed' | 'error' | 'cancelled' | 'thinking';
  created_at: string;
  error?: string;
  attachments?: { name: string; size: number }[];
  departmentKey?: string;
  sources?: { title: string; url?: string }[];
}

export default function ChatPage() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !params.id || params.id === 'new';
  const [conversationId, setConversationId] = useState<string | null>(isNew ? null : params.id ?? null);

  // Sync route param
  useEffect(() => {
    if (isNew) {
      setConversationId(null);
    } else if (params.id && params.id !== conversationId) {
      setConversationId(params.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const conversations = useConversations();
  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();
  const persistedMessages = useMessages(conversationId);
  const catalog = useDepartmentCatalog();

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; size: number }[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate persisted messages when conversation changes
  useEffect(() => {
    if (!conversationId || !persistedMessages.data) return;
    setMessages(
      (persistedMessages.data as ChatMessageRecord[]).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        status: 'completed',
        created_at: m.created_at,
      })),
    );
    setPendingAssistantId(null);
    setStreaming(false);
    abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, persistedMessages.data]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  async function send(content: string) {
    if (!content.trim() || streaming) return;
    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      status: 'completed',
      created_at: new Date().toISOString(),
      attachments,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    setAttachments([]);
    setAutoScroll(true);

    let convoId = conversationId;
    if (!convoId) {
      const created = await createConv.mutateAsync({ title: content.slice(0, 80), departmentKey: 'executive-office' });
      convoId = created.id;
      setConversationId(convoId);
      navigate(`/chat/${convoId}`, { replace: true });
    }
    void convoId;

    setStreaming(true);
    const ac = new AbortController();
    abortRef.current = ac;

    let assistantId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        status: 'thinking',
        created_at: new Date().toISOString(),
        departmentKey: department?.key ?? 'executive-office',
      },
    ]);
    setPendingAssistantId(assistantId);

    // Simulate a brief "thinking" phase before streaming starts
    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, status: 'streaming' } : m)),
    );

    await streamPost(`/conversations/${convoId}/messages`, { content }, {
      signal: ac.signal,
      onEvent: (e: SseEvent) => {
        const data = e.data as Record<string, unknown>;
        if (e.event === 'ready') {
          assistantId = (data.assistant_message_id as string) ?? assistantId;
          setPendingAssistantId(assistantId);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, id: (data.assistant_message_id as string) ?? m.id } : m)),
          );
        } else if (e.event === 'token') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + (data.content as string) } : m,
            ),
          );
        } else if (e.event === 'done') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: (data.content as string) || m.content,
                    status: 'completed',
                    departmentKey: (data.department_key as string) ?? m.departmentKey,
                    sources: (data.sources as { title: string; url?: string }[]) ?? m.sources,
                  }
                : m,
            ),
          );
        } else if (e.event === 'error') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, status: 'error', error: (data.error as string) ?? 'Stream failed' }
                : m,
            ),
          );
        } else if (e.event === 'cancelled') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, status: 'cancelled' } : m)),
          );
        }
      },
    });
    setStreaming(false);
    setPendingAssistantId(null);
    // Refresh conversation list in background
    conversations.refetch();
  }

  async function stop() {
    abortRef.current?.abort();
    if (conversationId) {
      await conversationsApi.stop(conversationId).catch(() => undefined);
    }
    setStreaming(false);
  }

  async function retryLastUser() {
    const last = [...messages].reverse().find((m) => m.role === 'user');
    if (!last) return;
    setMessages((prev) => prev.filter((m) => m.id !== last.id && m.role !== 'assistant' || m.id === last.id));
    await send(last.content);
  }

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setAutoScroll(atBottom);
  }

  async function newChat() {
    setMessages([]);
    setConversationId(null);
    navigate('/chat/new', { replace: true });
  }

  async function attach(file: File) {
    setAttachments((prev) => [...prev, { name: file.name, size: file.size }]);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await send(draft);
  }

  const department =
    (catalog.data ?? []).find((d) => d.key === 'executive-office') ??
    (catalog.data ?? [])[0];

  return (
    <div className="flex h-full w-full">
      {/* Sidebar — conversations */}
      <aside className="hidden w-64 shrink-0 border-r border-[color:var(--color-line)] bg-[color:var(--color-bg-0)] lg:flex lg:flex-col">
        <div className="flex items-center justify-between gap-2 p-3">
          <h2 className="text-xs uppercase tracking-wider text-[color:var(--color-fg-3)]">Conversations</h2>
          <Button size="icon" variant="ghost" aria-label="New conversation" onClick={newChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <ul className="space-y-0.5">
            {(conversations.data ?? []).map((c) => {
              const isActive = c.id === conversationId;
              const pres = getDepartment(c.department_key);
              return (
                <li key={c.id}>
                  <Link
                    to={`/chat/${c.id}`}
                    className={cn(
                      'group flex items-start gap-2 rounded-[var(--radius-md)] px-2 py-2 text-sm',
                      isActive
                        ? 'bg-[color:var(--color-bg-3)] text-[color:var(--color-fg-1)]'
                        : 'text-[color:var(--color-fg-2)] hover:bg-[color:var(--color-bg-3)]',
                    )}
                  >
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-fg-3)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{c.title || 'Untitled'}</div>
                      <div className="truncate text-[11px] text-[color:var(--color-fg-3)]">
                        {pres?.name ?? c.department_key} · {formatRelativeTime(c.updated_at)}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Delete conversation"
                      className="hidden text-[color:var(--color-fg-3)] hover:text-[color:var(--color-rose)] group-hover:inline-flex"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm('Delete this conversation?')) {
                          deleteConv.mutate(c.id);
                          if (isActive) newChat();
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </li>
              );
            })}
            {(conversations.data ?? []).length === 0 && (
              <li className="px-2 py-3 text-xs text-[color:var(--color-fg-3)]">No conversations yet.</li>
            )}
          </ul>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-[color:var(--color-line)] px-3">
          <div className="flex items-center gap-2">
            <Link to="/chat" className="text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)] lg:hidden">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-sm font-medium text-[color:var(--color-fg-1)]">
                {department?.name ?? 'Executive Director'}
              </div>
              <div className="text-[11px] text-[color:var(--color-fg-3)]">
                {streaming ? 'streaming…' : 'ready'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={streaming ? 'cyan' : 'emerald'} size="xs" icon={<span className={streaming ? 'live-dot' : ''} />}>
              {streaming ? 'live' : 'idle'}
            </Badge>
          </div>
        </header>

        {/* Scrollable messages */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8"
        >
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl">
              <EmptyState
                icon={<PenLine className="h-5 w-5" />}
                title="Start a conversation"
                description={`Talk to the ${department?.name ?? 'Executive Director'} about goals, plans, reports and approvals.`}
              />
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  'Summarise what my departments did this week',
                  'Draft a plan to launch the new pricing page',
                  'Approve the open tasks waiting for me',
                  'Show me the latest corporate memory files',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-3 text-left text-sm text-[color:var(--color-fg-2)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-fg-1)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  message={m}
                  onCopy={() => navigator.clipboard.writeText(m.content)}
                  onRetry={m.role === 'user' ? retryLastUser : undefined}
                  onCancel={
                    m.role === 'assistant' && m.status === 'streaming' ? stop : undefined
                  }
                />
              ))}
              {pendingAssistantId && streaming && messages.find((m) => m.id === pendingAssistantId)?.content === '' && (
                <div className="flex items-center gap-1 text-[color:var(--color-fg-3)]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                </div>
              )}
            </div>
          )}

          {!autoScroll && messages.length > 0 && (
            <button
              type="button"
              onClick={() => setAutoScroll(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-2)] px-3 py-1.5 text-xs text-[color:var(--color-fg-2)] shadow-[var(--shadow-soft)] hover:bg-[color:var(--color-bg-3)]"
            >
              <ArrowDown className="mr-1 inline h-3 w-3" /> Jump to latest
            </button>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          className="border-t border-[color:var(--color-line)] bg-[color:var(--color-bg-0)] p-3 md:p-4"
        >
          <div className="mx-auto max-w-3xl">
            {attachments.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <li
                    key={`${a.name}-${i}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-bg-3)] px-3 py-1 text-xs text-[color:var(--color-fg-2)]"
                  >
                    <Paperclip className="h-3 w-3" />
                    {truncate(a.name, 28)}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-end gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-2)] p-2 focus-within:border-[color:var(--color-accent)]">
              <label className="cursor-pointer rounded-md p-2 text-[color:var(--color-fg-3)] hover:bg-[color:var(--color-bg-3)]">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    Array.from(e.target.files ?? []).forEach(attach);
                    e.target.value = '';
                  }}
                />
              </label>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(draft);
                  }
                }}
                placeholder={`Message ${department?.name ?? 'the Executive Director'}…`}
                rows={1}
                className="flex-1 resize-none bg-transparent py-2 text-sm text-[color:var(--color-fg-1)] placeholder:text-[color:var(--color-fg-3)] focus:outline-none"
              />
              {streaming ? (
                <Button size="icon" variant="danger" onClick={stop} aria-label="Stop generation">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="primary"
                  type="submit"
                  aria-label="Send"
                  disabled={!draft.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-2 text-center text-[11px] text-[color:var(--color-fg-3)]">
              Enter to send · Shift+Enter for newline
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  onCopy,
  onRetry,
  onCancel,
}: {
  message: ChatMessage;
  onCopy?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const pres = message.departmentKey ? getDepartment(message.departmentKey) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={cn('group flex gap-3', isUser && 'flex-row-reverse')}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          isUser
            ? 'bg-[color:var(--color-accent)] text-white'
            : pres?.cssVar
              ? `text-white`
              : 'bg-[color:var(--color-dept-governance)] text-white',
          pres?.cssVar && !isUser && `shadow-[color-mix(in oklab,var(--accent)_40%,transparent)]`,
        )}
        style={{
          background:
            !isUser && pres?.cssVar
              ? `linear-gradient(135deg, color-mix(in oklab, var(${pres.cssVar}) 45%, #000), color-mix(in oklab, var(${pres.cssVar}) 60%, #000))`
              : undefined,
        }}
        aria-hidden
      >
        {isUser ? 'You' : pres?.shortName.slice(0, 2).toUpperCase() ?? 'ED'}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-[var(--radius-lg)] border px-3 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'border-[color:var(--color-accent-line)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-fg-1)]'
            : 'border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] text-[color:var(--color-fg-1)]',
        )}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {message.attachments.map((a) => (
              <span
                key={a.name}
                className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-bg-3)] px-2 py-0.5 text-[11px] text-[color:var(--color-fg-2)]"
              >
                <Paperclip className="h-3 w-3" /> {a.name}
              </span>
            ))}
          </div>
        )}

        {/* Department badge for assistant messages */}
        {!isUser && pres && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <Badge
              tone={pres.category === 'governance' ? 'violet' : pres.category === 'revenue' ? 'emerald' : 'amber'}
              size="xs"
              variant="outline"
            >
              {pres.shortName}
            </Badge>
            {message.status === 'thinking' && (
              <span className="text-[11px] text-[color:var(--color-fg-3)] animate-pulse">
                thinking…
              </span>
            )}
          </div>
        )}

        <div className="whitespace-pre-wrap break-words">
          {message.status === 'thinking' && message.content === '' ? (
            <div className="flex items-center gap-1 text-[color:var(--color-fg-3)]">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]"
                aria-hidden
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]"
                aria-hidden
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]"
                aria-hidden
              />
            </div>
          ) : message.status === 'streaming' && message.content === '' ? (
            <div className="flex items-center gap-1 text-[color:var(--color-fg-3)]">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]"
                aria-hidden
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]"
                aria-hidden
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]"
                aria-hidden
              />
            </div>
          ) : (
            <MarkdownLite text={message.content} />
          )}
          {message.status === 'streaming' && message.content !== '' && (
            <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-[color:var(--color-accent)]" />
          )}
        </div>

        {/* Sources panel */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 border-t border-[color:var(--color-line)] pt-2">
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)] mb-1.5">
              Sources used
            </div>
            <ul className="space-y-1">
              {message.sources.map((s, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)]">
                    {i + 1}
                  </span>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[color:var(--color-fg-2)] hover:text-[color:var(--color-accent)] hover:underline"
                    >
                      {truncate(s.title, 50)}
                    </a>
                  ) : (
                    <span className="truncate text-[color:var(--color-fg-2)]">{truncate(s.title, 50)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.status === 'error' && message.error && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-[color:var(--color-rose-soft)] px-2 py-1 text-xs text-[color:var(--color-rose)]">
            {message.error}
          </div>
        )}
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-[11px] text-[color:var(--color-fg-3)]',
            isUser ? 'justify-end' : 'justify-start',
          )}
        >
          <span>{formatRelativeTime(message.created_at)}</span>
          {onCopy && message.content && message.status !== 'thinking' && (
            <button
              type="button"
              onClick={() => {
                onCopy();
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              }}
              className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[color:var(--color-bg-3)]"
              aria-label="Copy message"
            >
              {copied ? <Check className="h-3 w-3 text-[color:var(--color-emerald)]" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[color:var(--color-bg-3)]"
              aria-label="Retry"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[color:var(--color-bg-3)]"
              aria-label="Cancel"
            >
              <Square className="h-3 w-3" /> Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Lightweight markdown renderer: bold (**), italic (*), inline code (`),
 * and paragraphs. Deliberately tiny — the product is the API contract,
 * not a markdown editor. No XSS risk because we never render raw HTML.
 */
function MarkdownLite({ text }: { text: string }) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const isList = lines.every((l) => /^\s*[-*]\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="my-2 list-disc pl-5">
              {lines.map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="my-1">
            {renderInline(block)}
          </p>
        );
      })}
    </>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('**')) out.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('*')) out.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    else if (token.startsWith('`')) out.push(<code key={match.index} className="rounded bg-[color:var(--color-bg-3)] px-1 py-0.5 font-mono text-[12px]">{token.slice(1, -1)}</code>);
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
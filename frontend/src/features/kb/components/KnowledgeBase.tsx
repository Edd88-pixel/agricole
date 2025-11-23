import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { KnowledgeArticle } from '../types/article';
import { startKnowledgeConversation } from '../services/chat';
import { subscribeToKnowledgeEvents, type KnowledgeEvent } from '../services/realtime';

type Props = {
  articles: KnowledgeArticle[];
  isLoading?: boolean;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const KnowledgeBase = ({ articles, isLoading = false }: Props) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: t('kb.welcome', "Bonjour, comment puis-je vous aider aujourd'hui ?") }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [aiLinks, setAiLinks] = useState<{ title?: string; url: string }[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isSendingRef = useRef(false);
  const cleanupRef = useRef<() => void>(() => {});
  const aggregatedRef = useRef('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const recommendedArticles = useMemo(() => articles.slice(0, 4), [articles]);

  const stopRealtime = () => {
    cleanupRef.current?.();
    cleanupRef.current = () => {};
  };

  const handleEvent = (event: KnowledgeEvent) => {
    if (event.event === 'start') {
      aggregatedRef.current = '';
      setStreamingContent('');
      setRealtimeStatus(null);
      setError(null);
      return;
    }

    if (event.event === 'chunk') {
      aggregatedRef.current += event.content ?? '';
      setStreamingContent(aggregatedRef.current);
      if (event.links && event.links.length > 0) {
        setAiLinks((previous) => dedupeLinks([...(previous ?? []), ...(event.links ?? [])]).slice(0, 6));
      }
      return;
    }

    if (event.event === 'end') {
      const content = (event.content ?? aggregatedRef.current).trim();
      if (content) {
        setMessages((previous) => [...previous, { role: 'assistant', content }]);
        const parsed = extractLinks(content);
        const merged = dedupeLinks([...(event.links ?? []), ...parsed]).slice(0, 6);
        setAiLinks(merged);
      }
      setStreamingContent('');
      setIsSending(false);
      isSendingRef.current = false;
      stopRealtime();
      return;
    }

    if (event.event === 'error') {
      const message = event.error || t('kb.error', 'Le service IA est momentanement indisponible.');
      setError(message);
      setStreamingContent('');
      setIsSending(false);
      isSendingRef.current = false;
      stopRealtime();
    }
  };

  const handleSend = async () => {
    if (isSendingRef.current || isSending) return;
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    stopRealtime();
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const history: ChatMessage[] = [...messages, userMessage];
    setMessages(history);
    setInput('');
    setIsSending(true);
    isSendingRef.current = true;
    setError(null);
    setRealtimeStatus(t('kb.connecting', 'Connexion au service en temps reel...'));

    try {
      const response = await startKnowledgeConversation({
        prompt: trimmed,
        history
      });

      aggregatedRef.current = '';
      setStreamingContent('');

      cleanupRef.current = subscribeToKnowledgeEvents(response.conversationId, {
        onReady: () => setRealtimeStatus(null),
        onEvent: handleEvent,
        onError: (message) => {
          setRealtimeStatus(null);
          setError(message);
          setIsSending(false);
          isSendingRef.current = false;
        }
      });
    } catch (err) {
      console.error('Knowledge assistant failed', err);
      setError(t('kb.error', 'Le service IA est momentanement indisponible.'));
      setIsSending(false);
      isSendingRef.current = false;
      setRealtimeStatus(null);
    }
  };

  useEffect(() => () => stopRealtime(), []);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card className="flex h-[70vh] flex-col overflow-hidden md:h-[580px]">
        <header className="relative border-b border-subtle/70 pb-4">
          <span
            className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-brand-primary/10 blur-2xl"
            aria-hidden
          />
          <h1 className="text-2xl font-semibold text-brand-text">{t('kb.title')}</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {t('kb.subtitle', "Discutez avec l'assistant et obtenez des conseils contextualises.")}
          </p>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto py-5 pr-1">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-300 motion-safe:animate-[fade-in-up_0.35s_ease-out] ${
                message.role === 'assistant'
                  ? 'self-start bg-brand-background text-brand-text font-serif text-[15px] leading-7 tracking-[0.01em]'
                  : 'ml-auto self-end bg-brand-primary text-white shadow-[0_12px_28px_rgba(11,110,79,0.25)]'
              }`}
            >
              {message.role === 'assistant' ? formatAssistantMessage(message.content) : message.content}
            </div>
          ))}
          {streamingContent && (
            <div className="max-w-[85%] whitespace-pre-line rounded-2xl bg-brand-background px-4 py-3 text-sm leading-relaxed text-brand-text shadow-sm">
              {formatAssistantMessage(streamingContent)}
            </div>
          )}
          {realtimeStatus && (
            <div className="max-w-[70%] rounded-2xl border border-dashed border-brand-secondary/30 bg-brand-background px-4 py-3 text-sm text-brand-muted shadow-sm">
              {realtimeStatus}
            </div>
          )}
          {isSending && !streamingContent && !realtimeStatus && (
            <div className="max-w-[70%] rounded-2xl border border-dashed border-brand-secondary/30 bg-brand-background px-4 py-3 text-sm text-brand-muted shadow-sm">
              {t('kb.typing', 'Analyse en cours...')}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <footer className="space-y-3 border-t border-subtle/70 bg-brand-background/60 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-subtle/70 bg-brand-background/80 px-4 py-3 shadow-inner">
              <textarea
                rows={2}
                className="h-16 flex-1 resize-none bg-transparent text-sm text-brand-text outline-none placeholder:text-brand-muted"
                placeholder={t('kb.placeholder', 'Posez une question sur vos cultures...') ?? ''}
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </div>
            <Button onClick={handleSend} isLoading={isSending} disabled={isSending || !input.trim()}>
              {t('kb.send', 'Envoyer')}
            </Button>
          </div>
          {error && (
            <p className="rounded-2xl border border-brand-danger/30 bg-brand-danger/10 px-3 py-2 text-sm text-brand-danger">
              {error}
            </p>
          )}
        </footer>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-text">
          {t('kb.recommended', 'Ressources recommandees')}
        </h2>
        {aiLinks.length > 0 ? (
          <ul className="space-y-3 text-sm text-brand-text">
            {aiLinks.map((link) => (
              <li
                key={link.url}
                className="group rounded-2xl border border-subtle/70 bg-brand-background p-3 transition-all duration-300 hover:border-brand-secondary/40"
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
                  <span className="rounded-md bg-brand-secondary/10 px-2 py-1 text-xs font-semibold text-brand-secondary">
                    Lien
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold truncate">{getHostname(link.url, link.title)}</span>
                    <span className="block text-xs text-brand-muted overflow-hidden text-ellipsis whitespace-nowrap">
                      {getPathname(link.url)}
                    </span>
                  </span>
                  <span aria-hidden>→</span>
                </a>
              </li>
            ))}
          </ul>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recommendedArticles.length === 0 ? (
          <p className="text-sm text-brand-muted">
            {t('kb.empty', 'Aucun article ne correspond a votre recherche.')}
          </p>
        ) : (
          <ul className="space-y-3 text-sm text-brand-text">
            {recommendedArticles.map((article) => (
              <li
                key={article.id}
                className="group rounded-2xl border border-subtle/70 bg-brand-background p-4 transition-all duration-300 hover:border-brand-secondary/40 hover:shadow-[0_18px_32px_rgba(16,124,140,0.12)]"
              >
                <p className="text-xs uppercase tracking-wide text-brand-secondary">{article.crop}</p>
                <p className="mt-1 font-semibold">{article.title}</p>
                <p className="mt-2 text-brand-muted">{article.summary}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-secondary transition motion-safe:group-hover:translate-x-1">
                  {t('kb.more', 'Voir article')}
                  <span aria-hidden>→</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

const sanitizeUrl = (raw: string): string => {
  let url = raw.trim();
  url = url.replace(/^\((.*)\)$/, '$1');
  url = url.replace(/[)\].,;!?]+$/g, '');
  return url;
};

const extractLinks = (text: string): { url: string }[] => {
  const re = /(https?:\/\/[\w.-]+(?:\/[\w\-.~:%/?#[\]@!$&'()*+,;=]*)?)/gi;
  const matches = text.match(re) ?? [];
  return matches.map((u) => ({ url: sanitizeUrl(u) }));
};

const dedupeLinks = (links: { url: string; title?: string }[]) => {
  const seen = new Set<string>();
  const out: { url: string; title?: string }[] = [];
  for (const l of links) {
    const u = sanitizeUrl(l.url);
    if (!seen.has(u)) {
      seen.add(u);
      out.push({ url: u, title: l.title });
    }
  }
  return out;
};

const stripMarkdownLinks = (text: string) => text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1');

const formatAssistantMessage = (raw: string): string => {
  const withBullets = stripMarkdownLinks(raw).replace(/^\s*[*-]\s+/gm, '- ');
  const withoutUrls = withBullets.replace(/https?:\/\/\S+/gi, '');
  const withoutBold = withoutUrls.replace(/\*\*([^*]+)\*\*/g, '$1');
  const withoutItalics = withoutBold.replace(/\*([^*]+)\*/g, '$1');
  const unwrappedBrackets = withoutItalics.replace(/\[([^\]]+)\]/g, '$1');
  const lines = unwrappedBrackets.split('\n');
  const cleaned: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (cleaned[cleaned.length - 1] !== '') {
        cleaned.push('');
      }
      continue;
    }
    const withoutMarker = trimmed.replace(/^-+\s*/, '').trim();
    if (!withoutMarker) continue;
    if (!/[A-Za-z0-9]/.test(withoutMarker)) continue;
    cleaned.push(trimmed);
  }
  return cleaned.join('\n').trim();
};

const getHostname = (raw: string, title?: string) => {
  try {
    const u = new URL(raw);
    return title ?? u.hostname.replace(/^www\./, '');
  } catch {
    return title ?? raw;
  }
};

const getPathname = (raw: string) => {
  try {
    const u = new URL(raw);
    const path = (u.pathname + u.search).replace(/\/+$/, '');
    return path || '/';
  } catch {
    return raw;
  }
};

export default KnowledgeBase;

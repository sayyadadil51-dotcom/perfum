import * as React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, EmptyState } from '@/components/ui/misc';
import { useAppStore } from '@/context/AppStore';
import { THREAD_ID } from '@/data/seed';
import { cn, timeAgo } from '@/lib/utils';

/**
 * Two-pane in-app chat between a seller and a dealer for a given listing.
 * In Supabase mode this subscribes to `messages` via Realtime; in demo mode it
 * simply reads/writes the local store (still feels instant).
 */
export function ChatPanel({
  listingId,
  otherUserId,
  height = 380,
  compact,
}: {
  listingId: string;
  otherUserId: string;
  height?: number;
  compact?: boolean;
}) {
  const { state, currentUser, sendMessage, markThreadRead } = useAppStore();
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const threadId = currentUser ? THREAD_ID(listingId, currentUser.id, otherUserId) : '';
  const messages = state.messages.filter((m) => m.threadId === threadId);
  const other = state.users.find((u) => u.id === otherUserId);
  const listing = state.listings.find((l) => l.id === listingId);

  React.useEffect(() => {
    if (threadId) markThreadRead(threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, messages.length]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // `scrollTo` is not available in every test/older browser environment.
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !currentUser) return;
    setSending(true);
    const res = sendMessage({ listingId, otherUserId, body: draft });
    setSending(false);
    if (res.ok) setDraft('');
  };

  if (!currentUser) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      {!compact && (
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback name={other?.name ?? 'Dealer'} />
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{other?.businessName ?? other?.name ?? 'Dealer'}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" />
              {other?.verificationStatus === 'approved' ? 'Verified dealer' : 'Verification pending'}
              {listing ? ` · ${listing.title}` : ''}
            </p>
          </div>
          {listing && (
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/listing/${listing.id}`}>View listing</Link>
            </Button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="space-y-2.5 overflow-y-auto p-4" style={{ maxHeight: height }}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm font-medium">Start the conversation</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Ask about condition, access to the pickup spot or the exact weight. Keep deals on ScrapKart
              so both sides stay protected.
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === currentUser.id;
          const showGap = i === 0 || messages[i - 1]?.senderId !== m.senderId;
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start', showGap && 'pt-2')}>
              <div
                className={cn(
                  'max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                  mine
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-muted text-foreground',
                )}
              >
                <p className="whitespace-pre-wrap break-words leading-snug">{m.body}</p>
                <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {timeAgo(m.createdAt)}
                  {mine && m.readAt ? ' · seen' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-border/60 p-2.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
          maxLength={500}
        />
        <Button type="submit" size="icon" disabled={!draft.trim()} loading={sending} aria-label="Send message">
          {!sending && <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

/** Thread list used by both dashboards' Messages page. */
export function ThreadList({
  role,
  basePath,
}: {
  role: 'seller' | 'buyer';
  basePath: string;
}) {
  const { state, currentUser } = useAppStore();
  if (!currentUser) return null;

  // Build threads from messages the user participates in.
  const threadIds = Array.from(
    new Set(
      state.messages
        .filter((m) => {
          const [listingId, a, b] = m.threadId.split(':');
          void listingId;
          return a === currentUser.id || b === currentUser.id;
        })
        .map((m) => m.threadId),
    ),
  );

  const threads = threadIds
    .map((tid) => {
      const [listingId, a, b] = tid.split(':');
      const otherId = a === currentUser.id ? b : a;
      const msgs = state.messages.filter((m) => m.threadId === tid);
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.senderId !== currentUser.id && !m.readAt).length;
      return {
        tid,
        listingId,
        other: state.users.find((u) => u.id === otherId),
        listing: state.listings.find((l) => l.id === listingId),
        last,
        unread,
      };
    })
    .sort((x, y) => (y.last?.createdAt ?? '').localeCompare(x.last?.createdAt ?? ''));

  if (!threads.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description={
          role === 'seller'
            ? 'When a dealer asks a question about your listing, the chat appears here.'
            : 'Ask a seller about condition or access before you send an offer.'
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card">
      {threads.map((t) => (
        <li key={t.tid}>
          <Link
            to={`${basePath}?thread=${encodeURIComponent(t.tid)}`}
            className="flex items-center gap-3 p-3.5 transition hover:bg-muted/60"
          >
            <Avatar>
              <AvatarFallback name={t.other?.name ?? 'SK'} />
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{t.other?.businessName ?? t.other?.name}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">{t.last ? timeAgo(t.last.createdAt) : ''}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{t.listing?.title ?? 'Listing removed'}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{t.last?.body}</p>
            </div>
            {t.unread > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {t.unread}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

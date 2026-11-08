import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { ChatPanel, ThreadList } from '@/components/ChatPanel';
import { PageHeader } from '@/components/DashboardShell';
import { useAppStore } from '@/context/AppStore';
import { cn } from '@/lib/utils';

/** Shared messages page for sellers and dealers. */
export default function MessagesPage({ role }: { role: 'seller' | 'buyer' }) {
  const [params, setParams] = useSearchParams();
  const { state, currentUser } = useAppStore();
  const thread = params.get('thread');

  const parsed = React.useMemo(() => {
    if (!thread) return null;
    const [listingId, a, b] = thread.split(':');
    const other = a === currentUser?.id ? b : a;
    return { listingId, other };
  }, [thread, currentUser]);

  const activeThread = parsed ? state.messages.filter((m) => m.threadId === thread) : [];
  const hasThread = activeThread.length > 0;

  return (
    <div>
      <PageHeader title="Messages" description="Chat with the other party about condition, weight or access" />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className={cn(thread && 'hidden lg:block')}>
          <ThreadList role={role} basePath={role === 'seller' ? '/seller/messages' : '/buyer/messages'} />
        </div>

        <div className={cn(!thread && 'hidden lg:block')}>
          {parsed && hasThread ? (
            <>
              <button
                onClick={() => setParams({})}
                className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary lg:hidden"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All chats
              </button>
              <ChatPanel listingId={parsed.listingId} otherUserId={parsed.other} height={460} />
            </>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p className="font-display text-base font-semibold">Select a conversation</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Choose a chat on the left to see messages. In-app chat keeps everything in one place if a
                dispute needs review.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

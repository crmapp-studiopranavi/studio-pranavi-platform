/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Phone, Mail, Users, FileText, GitBranch, CreditCard, Settings } from 'lucide-react';
import {
  useActivityTimeline,
  useAddActivity,
  type ActivityFilters,
} from '@/lib/hooks/use-activity-timeline';
import type { Enums } from '@platform/types';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';

const TYPE_ICON: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  status_change: GitBranch,
  payment: CreditCard,
};

export function ActivityTimeline({ entity }: { entity: ActivityFilters }) {
  const { data: activities = [], isLoading } = useActivityTimeline(entity);
  const { mutateAsync: addActivity } = useAddActivity();
  const { profile } = useAuth();
  const [type, setType] = useState<Enums<'activity_type'>>('note');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await addActivity({ activity_type: type, subject: subject || null, body, ...entity });
      setSubject('');
      setBody('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add activity form */}
      {profile && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Enums<'activity_type'>)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
            <input
              type="text"
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 text-sm border rounded px-2 py-1 bg-background"
            />
          </div>
          <textarea
            placeholder="Add a note..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="w-full text-sm border rounded px-2 py-1 bg-background resize-none"
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="text-sm px-3 py-1 rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {/* Timeline */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet.</p>
      )}

      <div className="space-y-3">
        {activities.map((a) => {
          const Icon = TYPE_ICON[a.activity_type] ?? Settings;
          const actor = (a as any).actor;
          return (
            <div key={a.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {actor?.full_name ?? 'System'}
                  </span>
                  <span>·</span>
                  <span>{a.occurred_at ? formatDate(a.occurred_at) : ''}</span>
                </div>
                {a.subject && <p className="text-sm font-medium mt-0.5">{a.subject}</p>}
                {a.body && <p className="text-sm text-muted-foreground mt-0.5">{a.body}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

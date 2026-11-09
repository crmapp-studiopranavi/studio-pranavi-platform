import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useUpdateTask } from '@/lib/hooks/use-lead-detail';
import { useAuth } from '@/lib/auth-context';
import { formatDate, isOverdue, relativeDays } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export function TasksPage() {
  const { profile } = useAuth();
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const { data: tasks = [], isLoading } = useTasks({
    assignedToMe: myTasksOnly,
    userId: profile?.id,
  });

  const updateTask = useUpdateTask();

  const handleComplete = (taskId: string, leadId: string | null) => {
    void updateTask.mutateAsync({
      taskId,
      leadId: leadId ?? undefined,
      update: { status: 'done', completed_at: new Date().toISOString() },
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={myTasksOnly}
            onChange={(e) => setMyTasksOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          My tasks only
        </label>
      </div>

      <div className="rounded border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="w-8 px-4 py-2" />
              <th className="px-4 py-2 text-left">Task</th>
              <th className="px-4 py-2 text-left">Related To</th>
              <th className="px-4 py-2 text-left">Assignee</th>
              <th className="px-4 py-2 text-left">Due</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading &&
              tasks.map((task) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assignee = (task as any).assignee as { full_name: string | null } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lead = (task as any).lead as {
                  id: string;
                  lead_number: number;
                  full_name: string;
                } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const customer = (task as any).customer as {
                  id: string;
                  display_name: string;
                } | null;
                const overdue = task.due_at && isOverdue(task.due_at);
                return (
                  <tr key={task.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleComplete(task.id, lead?.id ?? null)}
                        disabled={updateTask.isPending}
                        title="Mark complete"
                        className="h-5 w-5 rounded-full border-2 border-border hover:border-green-500 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-2 font-medium">{task.title}</td>
                    <td className="px-4 py-2">
                      {lead ? (
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-primary hover:underline text-xs"
                        >
                          Lead #{lead.lead_number} — {lead.full_name}
                        </Link>
                      ) : customer ? (
                        <Link
                          to={`/customers/${customer.id}`}
                          className="text-primary hover:underline text-xs"
                        >
                          {customer.display_name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {assignee?.full_name ?? '—'}
                    </td>
                    <td
                      className={`px-4 py-2 ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
                    >
                      {task.due_at ? (
                        <span title={formatDate(task.due_at)}>{relativeDays(task.due_at)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="capitalize text-muted-foreground text-xs">
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            {!isLoading && tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No active tasks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

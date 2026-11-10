
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/format';

// ── Types ─────────────────────────────────────────────────────────────────────

type AppRole = 'admin' | 'manager' | 'sales' | 'operations' | 'viewer';

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  role: AppRole;
  is_active: boolean;
  avatar_path: string | null;
  last_seen_at: string | null;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_ROLES: AppRole[] = ['admin', 'manager', 'sales', 'operations', 'viewer'];

const ROLE_BADGE: Record<AppRole, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  sales: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  operations: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  viewer: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
  operations: 'Operations',
  viewer: 'Viewer',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[0]?.[0]?.toUpperCase() ?? '?';
}

// ── Queries & mutations ───────────────────────────────────────────────────────

function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });
}

function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, role }: { profileId: string; role: AppRole }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

function useToggleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, isActive }: { profileId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      profileId,
      full_name,
      phone,
      email,
      currentEmail,
    }: {
      profileId: string;
      full_name: string;
      phone: string;
      email: string;
      currentEmail: string;
    }) => {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name, phone: phone || null })
        .eq('id', profileId);
      if (profileError) throw profileError;

      if (email !== currentEmail) {
        const { error: emailError } = await supabase.rpc('admin_update_user_email', {
          target_id: profileId,
          new_email: email,
        });
        if (emailError) throw emailError;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase.rpc('admin_delete_user', { target_id: profileId });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  member: ProfileRow;
  onClose: () => void;
}

function EditModal({ member, onClose }: EditModalProps) {
  const [fullName, setFullName] = useState(member.full_name);
  const [phone, setPhone] = useState(member.phone ?? '');
  const [email, setEmail] = useState(member.email);
  const [error, setError] = useState<string | null>(null);
  const updateProfile = useUpdateProfile();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError('Display name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    setError(null);
    try {
      await updateProfile.mutateAsync({
        profileId: member.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        currentEmail: member.email,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Edit User</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{member.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {error && (
            <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="user@example.com"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation ───────────────────────────────────────────────────────

interface DeleteDialogProps {
  member: ProfileRow;
  onClose: () => void;
}

function DeleteDialog({ member, onClose }: DeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteUser = useDeleteUser();

  async function handleDelete() {
    setError(null);
    try {
      await deleteUser.mutateAsync(member.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-destructive">Delete User</h2>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm">
            Are you sure you want to permanently delete{' '}
            <strong>{member.full_name}</strong> ({member.email})?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This removes the user and all their associated data. This cannot be undone.
          </p>

          {error && (
            <div className="mt-3 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className="rounded bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {deleteUser.isPending ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { profile: currentProfile } = useAuth();
  const { data, isLoading, isError } = useProfiles();
  const updateRole = useUpdateRole();
  const toggleActive = useToggleActive();
  const [roleError, setRoleError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<ProfileRow | null>(null);
  const [deletingMember, setDeletingMember] = useState<ProfileRow | null>(null);

  const profiles = data ?? [];

  async function handleRoleChange(profileId: string, role: AppRole) {
    setRoleError(null);
    try {
      await updateRole.mutateAsync({ profileId, role });
    } catch {
      setRoleError('Failed to update role. Please try again.');
    }
  }

  async function handleToggleActive(profileId: string, isActive: boolean) {
    setToggleError(null);
    try {
      await toggleActive.mutateAsync({ profileId, isActive });
    } catch {
      setToggleError('Failed to update status. Please try again.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Team Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage user roles, details, and account status.</p>
      </div>

      {/* Error banners */}
      {isError && (
        <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load team members. Please refresh and try again.
        </div>
      )}
      {roleError && (
        <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {roleError}
        </div>
      )}
      {toggleError && (
        <div className="mb-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {toggleError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Last Seen</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Skeleton rows */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <span className="block h-4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && profiles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No team members found</p>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!isLoading &&
              profiles.map((member) => {
                const isSelf = member.id === currentProfile?.id;
                const isPending = updateRole.isPending || toggleActive.isPending;

                return (
                  <tr key={member.id} className="transition-colors hover:bg-muted/30">
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(member.full_name)}
                        </span>
                        <div>
                          <span className="font-medium">{member.full_name}</span>
                          {isSelf && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              you
                            </span>
                          )}
                          {member.phone && (
                            <p className="text-xs text-muted-foreground">{member.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {member.email}
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[member.role] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </td>

                    {/* Active indicator */}
                    <td className="px-4 py-3">
                      <span
                        title={member.is_active ? 'Active' : 'Inactive'}
                        className={`inline-block h-2.5 w-2.5 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      />
                    </td>

                    {/* Last seen */}
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {member.last_seen_at ? formatDateTime(member.last_seen_at) : '—'}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                      {formatDateTime(member.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Role dropdown */}
                        <select
                          value={member.role}
                          disabled={isSelf || isPending}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as AppRole)}
                          className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Change role for ${member.full_name}`}
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>

                        {/* Toggle active button */}
                        <button
                          disabled={isSelf || isPending}
                          onClick={() => handleToggleActive(member.id, member.is_active)}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            member.is_active
                              ? 'border border-border hover:bg-destructive/10 hover:text-destructive'
                              : 'border border-border hover:bg-green-50 hover:text-green-700'
                          }`}
                          aria-label={
                            member.is_active
                              ? `Deactivate ${member.full_name}`
                              : `Activate ${member.full_name}`
                          }
                        >
                          {member.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => setEditingMember(member)}
                          className="rounded border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
                          aria-label={`Edit ${member.full_name}`}
                        >
                          Edit
                        </button>

                        {/* Delete button */}
                        {!isSelf && (
                          <button
                            onClick={() => setDeletingMember(member)}
                            className="rounded border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                            aria-label={`Delete ${member.full_name}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Info note */}
      <p className="mt-4 text-xs text-muted-foreground">
        To add a new team member, create their account in{' '}
        <strong>Supabase Authentication &rarr; Users</strong>. They will appear here after their
        first sign-in.
      </p>

      {/* Modals */}
      {editingMember && (
        <EditModal member={editingMember} onClose={() => setEditingMember(null)} />
      )}
      {deletingMember && (
        <DeleteDialog member={deletingMember} onClose={() => setDeletingMember(null)} />
      )}
    </div>
  );
}

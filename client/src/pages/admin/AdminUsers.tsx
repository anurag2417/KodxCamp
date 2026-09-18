import { useEffect, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { adminApi, type AdminUser } from '../../lib/admin.api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AdminTable } from '../../components/admin/AdminTable';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { UserRoleBadge } from '../../components/admin/UserRoleBadge';

const ROLES = ['student', 'instructor', 'admin'] as const;

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const reload = async () => {
    setLoading(true);
    const res = await adminApi.listUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      limit: 100,
    });
    setUsers(res.users);
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(reload, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const changeRole = async (u: AdminUser, role: 'student' | 'instructor' | 'admin') => {
    const updated = await adminApi.setUserRole(u._id, role);
    setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: updated.role } : x)));
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await adminApi.deleteUser(deleting._id);
    setUsers((prev) => prev.filter((u) => u._id !== deleting._id));
    setDeleting(null);
  };

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Users</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage roles and accounts across the platform.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <AdminTable headers={['Name', 'Email', 'Role', 'XP', 'Joined', 'Actions']}>
          {users.map((u) => (
            <tr key={u._id} className="hover:bg-surface-secondary">
              <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
              <td className="px-4 py-3 text-text-secondary">{u.email}</td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  onChange={(e) =>
                    changeRole(u, e.target.value as 'student' | 'instructor' | 'admin')
                  }
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-text-secondary">{u.xp}</td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleting(u)}
                  title="Delete user"
                >
                  <Trash2 size={14} className="text-[var(--color-error)]" />
                </Button>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        message={`This will permanently delete "${deleting?.name}". Their submissions, projects, and activity will also be removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};
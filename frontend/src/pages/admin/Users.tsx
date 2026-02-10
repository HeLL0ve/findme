import { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const current = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!current || current.role !== 'ADMIN') return setError('Требуется доступ администратора');
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/users');
        if (!mounted) return;
        setUsers(res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Ошибка');
      } finally { if (mounted) setLoading(false) }
    })();
    return () => { mounted = false };
  }, [current]);

  async function toggleBlock(u: any) {
    try {
      await api.post(`/users/${u.id}/block`, { block: !u.isBlocked });
      setUsers(users.map(x => x.id === u.id ? { ...x, isBlocked: !x.isBlocked } : x));
    } catch (e) { console.error(e) }
  }

  async function changeRole(u: any, role: 'USER' | 'ADMIN') {
    try {
      await api.post(`/users/${u.id}/role`, { role });
      setUsers(users.map(x => x.id === u.id ? { ...x, role } : x));
    } catch (e) { console.error(e) }
  }

  if (error) return <div className="container"><div className="error">{error}</div></div>;
  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <h1>Пользователи</h1>
      <div style={{ display: 'grid', gap: 8 }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{u.name || u.email}</div>
              <div className="muted">{u.email} • {u.role} {u.isBlocked ? '• заблокирован' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => toggleBlock(u)}>{u.isBlocked ? 'Разблокировать' : 'Блокировать'}</button>
              {u.role === 'ADMIN' ? (
                <button className="btn btn-ghost" onClick={() => changeRole(u, 'USER')}>Сделать USER</button>
              ) : (
                <button className="btn" onClick={() => changeRole(u, 'ADMIN')}>Сделать ADMIN</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

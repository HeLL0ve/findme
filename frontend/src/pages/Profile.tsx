import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useAuthStore } from '../shared/authStore';

type ProfileDto = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  role: 'USER' | 'ADMIN';
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ProfileDto>>({});
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/users/me');
        if (!mounted) return;
        setForm(res.data);
        setUser(res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Ошибка');
      } finally {
        setLoading(false);
      }
    })();

    return () => { mounted = false };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.put('/users/me', { name: form.name, phone: form.phone, telegramUsername: form.telegramUsername });
      setForm(res.data);
      setUser(res.data as any);
      alert('Сохранено');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка сохранения');
    }
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="container">
      <div className="card">
        <h1>Профиль</h1>

        {error && <div className="error">{error}</div>}

        <form onSubmit={save} className="form-root">
        <div>
          <label>Email</label>
          <div>{form.email}</div>
        </div>

        <div>
          <label>Имя</label>
          <input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label>Телефон</label>
          <input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div>
          <label>Telegram</label>
          <input value={form.telegramUsername ?? ''} onChange={e => setForm({ ...form, telegramUsername: e.target.value })} />
        </div>

        <div>Роль: {form.role}</div>

        <button type="submit" className="btn">Сохранить</button>
      </form>
    </div>
  </div>
  );
}

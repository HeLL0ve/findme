import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { useState } from 'react';
import { api } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.acceptTerms) {
      setError('Нужно принять пользовательское соглашение');
      return;
    }

    try {
      await api.post('/auth/register', form);

      // auto-login
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      setAccessToken(res.data.accessToken);

      try {
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch (_) {}

      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка регистрации');
    }
  }

  return (
    <div className="auth-container card">
      <h1>Создать аккаунт</h1>

      <form onSubmit={submit} className="form-root">
        <div className="form-control">
          <label>Имя (необязательно)</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="form-control">
          <label>Email</label>
          <input
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            type="email"
          />
        </div>

        <div className="form-control">
          <label>Пароль</label>
          <input
            type="password"
            placeholder="Пароль"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Checkbox.Root
            checked={form.acceptTerms}
            onCheckedChange={v => setForm({ ...form, acceptTerms: Boolean(v) })}
            id="accept"
          />
          <label htmlFor="accept" style={{ cursor: 'pointer' }}>
            Я принимаю <Dialog.Root>
              <Dialog.Trigger asChild>
                <span className="link">пользовательское соглашение</span>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay style={{ background: 'rgba(0,0,0,0.4)', position: 'fixed', inset: 0 }} />
                <Dialog.Content style={{ background: 'var(--surface)', padding: 20, borderRadius: 12, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', maxWidth: 600 }}>
                  <h2>Пользовательское соглашение</h2>
                  <div style={{ maxHeight: 340, overflow: 'auto' }}>
                    <p>Тут будет текст соглашения...</p>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn">Зарегистрироваться</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/login')}>Уже есть аккаунт</button>
        </div>
      </form>
    </div>
  );
}
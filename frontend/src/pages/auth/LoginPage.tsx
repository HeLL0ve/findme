import * as Form from '@radix-ui/react-form';
import { useState } from 'react';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await api.post('/auth/login', { email, password });
      setAccessToken(res.data.accessToken);
      // fetch profile
      try {
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch (_) {}
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Ошибка входа');
    }
  }

  return (
    <div className="auth-container card">
      <h1>Вход</h1>

      <Form.Root onSubmit={onSubmit} className="form-root">
        <Form.Field name="email">
          <Form.Label>Email</Form.Label>
          <Form.Control asChild>
            <input type="email" required />
          </Form.Control>
        </Form.Field>

        <Form.Field name="password">
          <Form.Label>Пароль</Form.Label>
          <Form.Control asChild>
            <input type="password" required />
          </Form.Control>
        </Form.Field>

        {error && <p className="error">{error}</p>}

        <Form.Submit asChild>
          <button className="btn">Войти</button>
        </Form.Submit>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <span className="muted">Нет аккаунта? </span>
          <a style={{ marginLeft: 6 }} href="/register">Зарегистрироваться</a>
        </div>
      </Form.Root>
    </div>
  );
}
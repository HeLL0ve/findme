import * as Form from '@radix-ui/react-form';
import { useState } from 'react';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';

export default function LoginPage() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
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
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Ошибка входа');
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <h1>Вход</h1>

      <Form.Root onSubmit={onSubmit}>
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

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <Form.Submit asChild>
          <button>Войти</button>
        </Form.Submit>
      </Form.Root>
    </div>
  );
}
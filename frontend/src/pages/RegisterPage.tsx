import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { useState } from 'react';
import axios from '../api/axios';

export function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await axios.post('/auth/register', form);
      alert('Регистрация успешна');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка регистрации');
    }
  }

  return (
    <form onSubmit={submit} className="register-form">
      <h1>Регистрация</h1>

      <input
        placeholder="Email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Пароль"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />

      <label className="terms">
        <Checkbox.Root
          checked={form.acceptTerms}
          onCheckedChange={v =>
            setForm({ ...form, acceptTerms: Boolean(v) })
          }
        />
        <span>
          Я принимаю{' '}
          <Dialog.Root>
            <Dialog.Trigger className="link">
              пользовательское соглашение
            </Dialog.Trigger>
            <Dialog.Content className="dialog">
              <h2>Пользовательское соглашение</h2>
              <p>Тут будет текст соглашения...</p>
            </Dialog.Content>
          </Dialog.Root>
        </span>
      </label>

      {error && <p className="error">{error}</p>}

      <button className="primary">Зарегистрироваться</button>
    </form>
  );
}
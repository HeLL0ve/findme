import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Flex, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';
import { AuthShell } from './AuthShell';

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const emailParam = searchParams.get('email') ?? '';

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState(emailParam);
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        if (!mounted) return;

        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken);
          setUser(response.data.user ?? null);
          navigate('/');
          return;
        }

        setSuccess('Email успешно подтвержден. Теперь можно войти.');
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось подтвердить email'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, navigate, setAccessToken, setUser]);

  useEffect(() => {
    if (!token && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [token]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    setCodeDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      setCodeDigits((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = '';
          return next;
        }
        if (index > 0) {
          next[index - 1] = '';
          inputRefs.current[index - 1]?.focus();
        }
        return next;
      });
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setCodeDigits(next);
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  async function verifyCode() {
    const code = codeDigits.join('');
    if (!email.trim() || code.length !== CODE_LENGTH) {
      setError('Введите email и полный 6-значный код');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/verify-email', {
        email: email.trim(),
        code,
      });

      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user ?? null);
        navigate('/');
        return;
      }

      setSuccess('Email успешно подтверждён. Теперь можно войти.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось подтвердить код'));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!email.trim()) {
      setError('Введите email');
      return;
    }

    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/auth/resend-verification', { email: email.trim() });
      setSuccess('Код отправлен повторно. Проверьте почту.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить код повторно'));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Подтвердите email"
      subtitle="Введите 6 отдельных цифр из письма, чтобы завершить вход."
      kicker="Вход"
      tone="violet"
    >
      <Flex direction="column" gap="3">
        {loading && (
          <div className="auth-alert">
            <Text size="2">Проверяем данные...</Text>
          </div>
        )}
        {!loading && success && (
          <div className="auth-alert auth-alert--success">
            <Text color="green" size="2">
              {success}
            </Text>
          </div>
        )}
        {!loading && error && (
          <div className="auth-alert auth-alert--error">
            <Text color="red" size="2">
              {error}
            </Text>
          </div>
        )}

        <TextField.Root
          type="email"
          placeholder="Email для подтверждения"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Flex gap="2" justify="center" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          {codeDigits.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              maxLength={1}
              placeholder="0"
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={{
                width: 56,
                minWidth: 56,
                height: 56,
                borderRadius: 14,
                border: '1px solid var(--gray-a6)',
                background: 'var(--surface)',
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                outline: 'none',
              }}
            />
          ))}
        </Flex>

        <Text size="1" color="gray">
          Код действителен 24 часа. Если не пришёл в течение минуты, нажмите «Отправить код повторно».
        </Text>

        <Button type="button" onClick={() => void verifyCode()} disabled={submitting || loading} style={{ fontWeight: 700 }}>
          {submitting ? 'Вход...' : 'Войти'}
        </Button>

        <Button type="button" variant="soft" onClick={() => void resend()} disabled={resending || loading} style={{ fontWeight: 700 }}>
          {resending ? 'Отправка...' : 'Отправить код повторно'}
        </Button>

        <div className="auth-links">
          <Text size="2" color="gray">
            <Link to="/login">Перейти ко входу</Link>
          </Text>
        </div>
      </Flex>
    </AuthShell>
  );
}

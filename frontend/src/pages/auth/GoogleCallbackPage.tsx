import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Text } from '@radix-ui/themes';
import { useAuthStore } from '../../shared/authStore';
import { api } from '../../api/axios';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=google_failed');
      return;
    }

    setAccessToken(token);

    api.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setUser(res.data);
        navigate('/');
      })
      .catch(() => {
        navigate('/login?error=google_failed');
      });
  }, [navigate, searchParams, setAccessToken, setUser]);

  return (
    <Flex align="center" justify="center" style={{ height: '100vh' }}>
      <Text color="gray">Выполняется вход через Google...</Text>
    </Flex>
  );
}

import { Link } from 'react-router-dom';
import { useAuthStore } from '../shared/authStore';
import * as Toggle from '@radix-ui/react-toggle';
import { Button, Container, Flex, Text } from '@radix-ui/themes';

type Props = {
  appearance: 'light' | 'dark';
  onToggleAppearance: () => void;
  accent: string;
  onCycleAccent: () => void;
};

export default function Header({ appearance, onToggleAppearance, accent, onCycleAccent }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Container size="3">
      <Flex align="center" justify="between" gap="3" style={{ padding: '16px 0' }}>
        <Flex align="center" gap="3" wrap="wrap">
          <Link to="/">Главная</Link>
          <Link to="/search">Поиск</Link>
          <Link to="/ads">Объявления</Link>
          {!accessToken && <Link to="/login">Вход</Link>}
          {!accessToken && <Link to="/register">Регистрация</Link>}
          {accessToken && <Link to="/profile">Профиль</Link>}
          {accessToken && <Link to="/my-ads">Мои объявления</Link>}
          {accessToken && <Link to="/chats">Чаты</Link>}
          {accessToken ? (
            <Link to="/create-ad">Добавить объявление</Link>
          ) : (
            <Link to="/register">Добавить объявление</Link>
          )}
          {accessToken && user?.role === 'ADMIN' && <Link to="/admin">Админ</Link>}
        </Flex>

        <Flex align="center" gap="2">
          {user && <Text size="2" color="gray">Роль: {user.role}</Text>}

          <Toggle.Root
            pressed={appearance === 'dark'}
            onPressedChange={() => onToggleAppearance()}
            aria-label="Toggle theme"
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {appearance === 'dark' ? 'Темная' : 'Светлая'}
          </Toggle.Root>

          <Button variant="soft" onClick={onCycleAccent}>
            {accent}
          </Button>

          {accessToken && (
            <Button variant="outline" onClick={() => void logout()}>
              Выйти
            </Button>
          )}
        </Flex>
      </Flex>
    </Container>
  );
}

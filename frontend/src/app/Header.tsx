import { useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Avatar, Badge, Box, Button, Card, Container, DropdownMenu, Flex, IconButton, Text } from '@radix-ui/themes';
import { config } from '../shared/config';
import { useAuthStore } from '../shared/authStore';
import { roleLabel } from '../shared/labels';
import { useUnreadNotifications } from '../shared/useUnreadNotifications';

type Props = {
  appearance: 'light' | 'dark';
  onToggleAppearance: () => void;
};

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 13.1A9 9 0 1 1 10.9 3a7 7 0 1 0 10.1 10.1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0m6 0H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function resolveAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  if (!config.apiUrl) return avatarUrl;
  return `${config.apiUrl}${avatarUrl}`;
}

export default function Header({ appearance, onToggleAppearance }: Props) {
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadNotifications = useUnreadNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const displayRole = useMemo(() => roleLabel(user?.role), [user?.role]);
  const avatarSrc = resolveAvatarSrc(user?.avatarUrl);
  const initials = (user?.name || user?.email || 'U').slice(0, 1).toUpperCase();

  const publicLinks = [
    { to: '/', label: 'Главная' },
    { to: '/search', label: 'Поиск' },
    { to: '/ads', label: 'Объявления' },
  ];
  const privateLinks = [
    { to: '/my-ads', label: 'Мои объявления' },
    { to: '/chats', label: 'Чаты' },
    { to: '/create-ad', label: 'Добавить объявление' },
  ];

  return (
    <Box style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(10px)' }}>
      <Container size="4">
        <Card style={{ marginTop: 10, marginBottom: 12, padding: 0 }}>
          <Flex align="center" justify="between" gap="3" style={{ padding: '10px 14px' }}>
            <Flex align="center" gap="3" style={{ minWidth: 0 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      background: 'linear-gradient(140deg, var(--violet-8), var(--iris-9))',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 800,
                    }}
                  >
                    F
                  </Box>
                  <Box display={{ initial: 'none', sm: 'block' }}>
                    <Text weight="bold" size="3">FindMe</Text>
                    <Text as="div" size="1" color="gray">поиск питомцев</Text>
                  </Box>
                </Flex>
              </Link>

              <Flex gap="3" display={{ initial: 'none', md: 'flex' }} style={{ minWidth: 0 }}>
                {publicLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="truncate">{link.label}</NavLink>
                ))}
                {token && privateLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="truncate">{link.label}</NavLink>
                ))}
                {token && user?.role === 'ADMIN' && <NavLink to="/admin">Админ</NavLink>}
              </Flex>
            </Flex>

            <Flex align="center" gap="2">
              <IconButton variant="soft" aria-label="Сменить тему" onClick={onToggleAppearance}>
                {appearance === 'dark' ? <SunIcon /> : <MoonIcon />}
              </IconButton>

              {token && (
                <Box style={{ position: 'relative' }}>
                  <IconButton asChild variant="soft" aria-label="Уведомления">
                    <Link to="/notifications">
                      <BellIcon />
                    </Link>
                  </IconButton>
                  {unreadNotifications > 0 && (
                    <Box
                      style={{
                        position: 'absolute',
                        right: 4,
                        bottom: 4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--red-9)',
                      }}
                    />
                  )}
                </Box>
              )}

              {token && user ? (
                <>
                  <Badge color="violet" variant="soft" className="truncate" style={{ maxWidth: 140 }}>
                    {displayRole}
                  </Badge>

                  <Box onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
                    <DropdownMenu.Root open={profileOpen} onOpenChange={setProfileOpen}>
                      <DropdownMenu.Trigger>
                        <IconButton variant="ghost" radius="full" aria-label="Меню профиля">
                          <Avatar src={avatarSrc} fallback={initials} radius="full" size="2" />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" onPointerEnter={() => setProfileOpen(true)} onPointerLeave={() => setProfileOpen(false)}>
                        <DropdownMenu.Label className="truncate" style={{ maxWidth: 220 }}>{user.name || user.email}</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item asChild><Link to="/profile">Профиль</Link></DropdownMenu.Item>
                        <DropdownMenu.Item asChild><Link to="/notifications">Уведомления</Link></DropdownMenu.Item>
                        <DropdownMenu.Item asChild><Link to="/my-ads">Мои объявления</Link></DropdownMenu.Item>
                        {user.role === 'ADMIN' && (
                          <DropdownMenu.Item asChild><Link to="/admin">Админ-панель</Link></DropdownMenu.Item>
                        )}
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item color="red" onClick={() => void logout()}>Выйти</DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Box>
                </>
              ) : (
                <Flex gap="2" display={{ initial: 'none', md: 'flex' }}>
                  <Button variant="soft" asChild><Link to="/login">Вход</Link></Button>
                  <Button asChild><Link to="/register">Регистрация</Link></Button>
                </Flex>
              )}

              <Box display={{ initial: 'block', md: 'none' }}>
                <IconButton variant="soft" onClick={() => setMobileOpen((v) => !v)} aria-label="Открыть меню">
                  {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
              </Box>
            </Flex>
          </Flex>

          {mobileOpen && (
            <Box display={{ initial: 'block', md: 'none' }} style={{ borderTop: '1px solid var(--gray-a5)', padding: 12 }}>
              <Flex direction="column" gap="2">
                {publicLinks.map((link) => (
                  <Button key={link.to} variant="soft" asChild onClick={() => setMobileOpen(false)}>
                    <Link to={link.to} className="truncate">{link.label}</Link>
                  </Button>
                ))}
                {token && privateLinks.map((link) => (
                  <Button key={link.to} variant="soft" asChild onClick={() => setMobileOpen(false)}>
                    <Link to={link.to} className="truncate">{link.label}</Link>
                  </Button>
                ))}
                {token && (
                  <Button variant="soft" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/notifications">Уведомления</Link>
                  </Button>
                )}
                {!token && (
                  <>
                    <Button variant="soft" asChild onClick={() => setMobileOpen(false)}><Link to="/login">Вход</Link></Button>
                    <Button asChild onClick={() => setMobileOpen(false)}><Link to="/register">Регистрация</Link></Button>
                  </>
                )}
                {token && user?.role === 'ADMIN' && (
                  <Button variant="soft" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/admin">Админ</Link>
                  </Button>
                )}
                {token && (
                  <Button color="red" variant="soft" onClick={() => void logout()}>
                    Выйти
                  </Button>
                )}
              </Flex>
            </Box>
          )}
        </Card>
      </Container>
    </Box>
  );
}

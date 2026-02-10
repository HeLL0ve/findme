import { Link } from 'react-router-dom';
import { useAuthStore } from '../shared/authStore';
import * as Toggle from '@radix-ui/react-toggle';
import { useState, useEffect } from 'react';

const styles = ['green', 'olive', 'teal'] as const;

export default function Header() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [dark, setDark] = useState(() => !!localStorage.getItem('dark'));
  const [style, setStyle] = useState<string>(() => localStorage.getItem('style') || 'green');

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    if (dark) localStorage.setItem('dark', '1');
    else localStorage.removeItem('dark');
  }, [dark]);

  useEffect(() => {
    document.documentElement.dataset.style = style;
    localStorage.setItem('style', style);
  }, [style]);

  function cycleStyle() {
    const idx = styles.indexOf(style as any);
    const next = styles[(idx + 1) % styles.length];
    setStyle(next);
  }

  return (
    <header className="header-bar container">
      <div className="header-left">
        <Link to="/">Главная</Link>
        <Link to="/ads">Объявления</Link>
        {!accessToken && <Link to="/login">Вход</Link>}
        {!accessToken && <Link to="/register">Регистрация</Link>}
        {accessToken && <Link to="/profile">Профиль</Link>}
        {/* Add 'Add ad' link that sends guests to register, users to create-ad */}
        {accessToken ? (
          <Link to="/create-ad">Добавить объявление</Link>
        ) : (
          <Link to="/register">Добавить объявление</Link>
        )}
        {accessToken && user?.role === 'ADMIN' && <Link to="/admin/users">Админ</Link>}
      </div>

      <div className="header-right">
        {user && <span className="muted">Роль: {user.role}</span>}

        <Toggle.Root pressed={dark} onPressedChange={(v) => setDark(!!v)} aria-label="Toggle theme" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {dark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} aria-hidden>
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }} aria-hidden>
              <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8L6.76 4.84zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm7.24-2.76l1.79 1.8 1.79-1.8-1.79-1.79-1.79 1.79zM20 11v2h3v-2h-3zM4.22 19.78l1.79-1.79-1.79-1.79-1.79 1.79 1.79 1.79zM12 6a6 6 0 100 12 6 6 0 000-12z" />
            </svg>
          )}
        </Toggle.Root>

        <button className="btn btn-ghost" onClick={cycleStyle}>{style}</button>

        {accessToken && (
          <button onClick={() => void logout()} className="btn btn-ghost">Выйти</button>
        )}
      </div>
    </header>
  );
}

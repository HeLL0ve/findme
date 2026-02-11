import Home from '../pages/Home';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import Header from './Header';
import ProtectedRoute from '../shared/ProtectedRoute';
import Profile from '../pages/Profile';
import AdsList from '../pages/ads/List';
import CreateAd from '../pages/ads/Create';
import AdDetail from '../pages/ads/Detail';
import AdminUsers from '../pages/admin/Users';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useAuthStore } from '../shared/authStore';
import Footer from './Footer';
import { Theme } from '@radix-ui/themes';
import SearchPage from '../pages/Search';
import MyAdsPage from '../pages/MyAds';
import ChatsPage from '../pages/chats/Chats';
import ChatDetailPage from '../pages/chats/ChatDetail';
import AdminAdsPage from '../pages/admin/Ads';
import AdminDashboard from '../pages/admin/Dashboard';
import { useWsConnection } from '../shared/useWsConnection';

const accents = ['green', 'teal', 'jade'] as const;

export default function App() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized!);
  const [appearance, setAppearance] = useState<'light' | 'dark'>(() => (localStorage.getItem('appearance') === 'dark' ? 'dark' : 'light'));
  const [accent, setAccent] = useState<typeof accents[number]>(() => (localStorage.getItem('accent') as any) || 'green');

  useWsConnection();

  useEffect(() => {
    document.documentElement.dataset.theme = appearance;
    localStorage.setItem('appearance', appearance);
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem('accent', accent);
  }, [accent]);

  function cycleAccent() {
    const idx = accents.indexOf(accent);
    const next = accents[(idx + 1) % accents.length];
    setAccent(next);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (!mounted) return;
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      } catch (_) {
        setAccessToken(null);
        setUser(null);
      } finally {
        if (mounted) setInitialized(true);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <Theme appearance={appearance} accentColor={accent} radius="large">
      <BrowserRouter>
        <Header
          appearance={appearance}
          onToggleAppearance={() => setAppearance((a) => (a === 'dark' ? 'light' : 'dark'))}
          accent={accent}
          onCycleAccent={cycleAccent}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ads" element={<AdsList />} />
          <Route path="/create-ad" element={<ProtectedRoute><CreateAd /></ProtectedRoute>} />
          <Route path="/ads/:id" element={<AdDetail />} />
          <Route path="/my-ads" element={<ProtectedRoute><MyAdsPage /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
          <Route path="/chats/:id" element={<ProtectedRoute><ChatDetailPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/ads" element={<ProtectedRoute requiredRole="ADMIN"><AdminAdsPage /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </Theme>
  );
}

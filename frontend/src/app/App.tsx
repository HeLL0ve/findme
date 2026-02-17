import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useAuthStore } from '../shared/authStore';
import { useWsConnection } from '../shared/useWsConnection';
import Header from './Header';
import Footer from './Footer';
import ProtectedRoute from '../shared/ProtectedRoute';
import Home from '../pages/Home';
import SearchPage from '../pages/Search';
import AdsList from '../pages/ads/List';
import AdDetail from '../pages/ads/Detail';
import CreateAd from '../pages/ads/Create';
import EditAd from '../pages/ads/Edit';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import Profile from '../pages/Profile';
import MyAdsPage from '../pages/MyAds';
import ChatsPage from '../pages/chats/Chats';
import ChatDetailPage from '../pages/chats/ChatDetail';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminAdsPage from '../pages/admin/Ads';
import AdminComplaintsPage from '../pages/admin/Complaints';
import NotificationsPage from '../pages/Notifications';

export default function App() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setInitialized = useAuthStore((state) => state.setInitialized!);

  const [appearance, setAppearance] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('appearance') === 'dark' ? 'dark' : 'light',
  );

  useWsConnection();

  useEffect(() => {
    document.documentElement.dataset.theme = appearance;
    localStorage.setItem('appearance', appearance);
  }, [appearance]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const existingToken = useAuthStore.getState().accessToken;

      try {
        if (existingToken) {
          const me = await api.get('/users/me');
          if (!mounted) return;
          setUser(me.data);
          return;
        }

        const refreshed = await api.post('/auth/refresh');
        if (!mounted) return;
        setAccessToken(refreshed.data.accessToken);
        setUser(refreshed.data.user);
      } catch (_error) {
        if (!mounted) return;
        setAccessToken(null);
        setUser(null);
      } finally {
        if (mounted) setInitialized(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [setAccessToken, setInitialized, setUser]);

  return (
    <Theme appearance={appearance} accentColor="violet" radius="large">
      <BrowserRouter>
        <Header
          appearance={appearance}
          onToggleAppearance={() => setAppearance((value) => (value === 'dark' ? 'light' : 'dark'))}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/ads" element={<AdsList />} />
          <Route path="/ads/:id" element={<AdDetail />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-ads" element={<ProtectedRoute><MyAdsPage /></ProtectedRoute>} />
          <Route path="/my-ads/:id/edit" element={<ProtectedRoute><EditAd /></ProtectedRoute>} />
          <Route path="/create-ad" element={<ProtectedRoute><CreateAd /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
          <Route path="/chats/:id" element={<ProtectedRoute><ChatDetailPage /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/ads" element={<ProtectedRoute requiredRole="ADMIN"><AdminAdsPage /></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute requiredRole="ADMIN"><AdminComplaintsPage /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </Theme>
  );
}

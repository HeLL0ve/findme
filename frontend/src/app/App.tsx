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
import { useEffect } from 'react';
import { api } from '../api/axios';
import { useAuthStore } from '../shared/authStore';
import Footer from './Footer';

export default function App() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized!);

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
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/ads" element={<AdsList />} />
        <Route path="/create-ad" element={<ProtectedRoute><CreateAd /></ProtectedRoute>} />
        <Route path="/ads/:id" element={<AdDetail />} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
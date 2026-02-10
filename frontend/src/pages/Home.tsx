import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { Link } from 'react-router-dom';

export default function Home() {
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/ads');
        if (!mounted) return;
        setAds(res.data.slice(0, 6));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div className="container">
      <section className="page-hero">
        <div className="card hero-card">
          <div style={{ flex: 1 }}>
            <h1>FindMe — найди потерянного питомца</h1>
            <p className="muted">Публикуйте объявления, общайтесь и помогайте находить домашних животных в вашем городе.</p>
            <div style={{ marginTop: 12 }}>
              <Link className="btn" to="/create-ad">Создать объявление</Link>
            </div>
          </div>
          <div style={{ width: 280 }}>
            <div className="card" style={{ padding: 12 }}>
              <h2>Онлайн участники</h2>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>12</div>
              <p className="muted">активных участников прямо сейчас</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Последние объявления</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {ads.map(a => (
            <Link key={a.id} to={`/ads/${a.id}`} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 120, height: 80, background: '#efefef', borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{a.petName || 'Без имени'}</div>
                <div className="muted">{a.animalType} — {a.status}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
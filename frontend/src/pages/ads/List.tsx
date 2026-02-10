import { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { Link } from 'react-router-dom';

function AdCard({ ad }: any) {
  return (
    <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 120, height: 80, background: '#efefef', borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <Link to={`/ads/${ad.id}`} style={{ fontWeight: 700 }}>{ad.petName || 'Без имени'}</Link>
        <div className="muted">{ad.animalType} — {ad.status}</div>
      </div>
    </div>
  );
}

export default function AdsList() {
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/ads');
        if (!mounted) return;
        setAds(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div className="container">
      <h1>Объявления</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {ads.map(a => <AdCard key={a.id} ad={a} />)}
      </div>
    </div>
  );
}

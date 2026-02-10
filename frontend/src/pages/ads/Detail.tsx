import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/axios';

export default function AdDetail() {
  const { id } = useParams();
  const [ad, setAd] = useState<any | null>(null);
  const [lightbox, setLightbox] = useState<{ idx: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/ads/${id}`);
        if (!mounted) return;
        setAd(res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Ошибка загрузки');
      }
    })();
    return () => { mounted = false };
  }, [id]);

  if (error) return <div className="container"><div className="error">{error}</div></div>;
  if (!ad) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <h1>{ad.petName || 'Питомец'}</h1>
            <div className="muted">{ad.animalType} — {ad.breed || ''}</div>
            <div style={{ marginTop: 12 }}>{ad.description}</div>

            {ad.location && (
              <div style={{ marginTop: 12 }}>
                <h3>Местоположение</h3>
                <div>{ad.location.address}</div>
                <div className="muted">{ad.location.latitude}, {ad.location.longitude}</div>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <h3>Контакты</h3>
              <div>{ad.user?.name || ad.user?.email}</div>
            </div>
          </div>

          <aside style={{ width: 260 }}>
            <div className="card small">
              <div className="muted">Статус</div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>{ad.status}</div>
              <div style={{ marginTop: 12 }} className="muted">Автор</div>
              <div>{ad.user?.name || ad.user?.email}</div>
            </div>

            <div style={{ marginTop: 12 }} className="card small">
              <h4>Фото</h4>
              {ad.photos?.map((p: string, i: number) => (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img key={p} src={p} alt={`photo-${i}`} onClick={() => setLightbox({ idx: i })} style={{ width: '100%', borderRadius: 8, marginTop: 8 }} />
              )) || <div className="muted">Нет фото</div>}
            </div>
          </aside>
        </div>
      </div>
        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={ad.photos[lightbox.idx]} alt="lightbox" />
          </div>
        )}
    </div>
  );
}

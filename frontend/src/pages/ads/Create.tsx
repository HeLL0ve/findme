import { useState, useRef } from 'react';
import { api } from '../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function CreateAd() {
  const [form, setForm] = useState({ type: 'LOST', petName: '', animalType: '', breed: '', color: '', description: '', photos: [] as string[], location: { address: '', city: '', latitude: 0, longitude: 0 } });
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || form.description.trim().length < 10) {
      alert('Пожалуйста, опишите питомца подробно (минимум 10 символов)');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/register';
      return;
    }

    setLoading(true);
    try {
      let photoUrls: string[] = form.photos || [];
      if (files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach(f => fd.append('photos', f));
        const up = await api.post('/ads/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        photoUrls = up.data.urls;
      }

      const payload = { ...form, photos: photoUrls, location: { address: form.location.address, latitude: form.location.latitude || undefined, longitude: form.location.longitude || undefined, city: form.location.city } };

      const res = await api.post('/ads', payload);
      navigate(`/ads/${res.data.id}`);
    } catch (e: any) {
      if (e.response?.status === 401) {
        window.location.href = '/login';
        return;
      }
      alert(e.response?.data?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Создать объявление</h1>
        <form onSubmit={submit} className="form-root">
          <label>Тип</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
            <option value="LOST">Потерялся</option>
            <option value="FOUND">Найден</option>
          </select>

          <input placeholder="Имя питомца" value={form.petName} onChange={e => setForm({ ...form, petName: e.target.value })} />
          <input placeholder="Вид" value={form.animalType} onChange={e => setForm({ ...form, animalType: e.target.value })} />
          <input placeholder="Порода" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
          <input placeholder="Цвет" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />

          <textarea placeholder="Описание" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          <label>Адрес / Город</label>
          <input placeholder="Город" value={form.location.city} onChange={e => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
          <input placeholder="Адрес" value={form.location.address} onChange={e => setForm({ ...form, location: { ...form.location, address: e.target.value } })} />

          <label>Фото (до 8)</label>
          <input ref={fileRef} type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />

          <button className="btn" type="submit" disabled={loading}>{loading ? 'Загрузка...' : 'Отправить на модерацию'}</button>
        </form>
      </div>
    </div>
  );
}

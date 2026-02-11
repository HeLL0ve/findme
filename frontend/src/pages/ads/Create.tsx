import { useState } from 'react';
import { api } from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Select, Text, TextArea, TextField } from '@radix-ui/themes';

export default function CreateAd() {
  const [form, setForm] = useState({
    type: 'LOST',
    petName: '',
    animalType: '',
    breed: '',
    color: '',
    description: '',
    photos: [] as string[],
    location: { address: '', city: '', latitude: 0, longitude: 0 },
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || form.description.trim().length < 10) {
      alert('Пожалуйста, опишите питомца подробно (минимум 10 символов)');
      return;
    }

    setLoading(true);
    try {
      let photoUrls: string[] = form.photos || [];
      if (files && files.length > 0) {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append('photos', f));
        const up = await api.post('/ads/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        photoUrls = up.data.urls;
      }

      const payload = {
        ...form,
        photos: photoUrls,
        location: {
          address: form.location.address || undefined,
          city: form.location.city || undefined,
          latitude: form.location.latitude || undefined,
          longitude: form.location.longitude || undefined,
        },
      };

      const res = await api.post('/ads', payload);
      navigate(`/ads/${res.data.id}`);
    } catch (e: any) {
      if (e.response?.status === 401) {
        navigate('/login');
        return;
      }
      alert(e.response?.data?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="3">
      <Card>
        <Heading size="8">Создать объявление</Heading>
        <form onSubmit={submit} className="form-root">
          <Flex direction="column" gap="3" style={{ marginTop: 16 }}>
            <Text size="2" color="gray">Тип</Text>
            <Select.Root value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="LOST">Потерялся</Select.Item>
                <Select.Item value="FOUND">Найден</Select.Item>
              </Select.Content>
            </Select.Root>

            <TextField.Root placeholder="Имя питомца" value={form.petName} onChange={(e) => setForm({ ...form, petName: e.target.value })} />
            <TextField.Root placeholder="Вид" value={form.animalType} onChange={(e) => setForm({ ...form, animalType: e.target.value })} />
            <TextField.Root placeholder="Порода" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
            <TextField.Root placeholder="Цвет" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />

            <TextArea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <Text size="2" color="gray">Адрес / город</Text>
            <TextField.Root placeholder="Город" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
            <TextField.Root placeholder="Адрес" value={form.location.address} onChange={(e) => setForm({ ...form, location: { ...form.location, address: e.target.value } })} />
            <Flex gap="2">
              <TextField.Root
                type="number"
                placeholder="Широта"
                value={form.location.latitude ? String(form.location.latitude) : ''}
                onChange={(e) => setForm({ ...form, location: { ...form.location, latitude: Number(e.target.value) } })}
              />
              <TextField.Root
                type="number"
                placeholder="Долгота"
                value={form.location.longitude ? String(form.location.longitude) : ''}
                onChange={(e) => setForm({ ...form, location: { ...form.location, longitude: Number(e.target.value) } })}
              />
            </Flex>

            <Text size="2" color="gray">Фото (до 8)</Text>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} />

            <Button type="submit" disabled={loading}>
              {loading ? 'Загрузка...' : 'Отправить на модерацию'}
            </Button>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}

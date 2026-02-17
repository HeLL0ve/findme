import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { adStatusLabel, adTypeLabel } from '../../shared/labels';
import { config } from '../../shared/config';

type EditAdDto = {
  id: string;
  userId: string;
  type: 'LOST' | 'FOUND';
  status: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  color?: string | null;
  description: string;
  location?: {
    address?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  photos?: Array<{ photoUrl: string }>;
};

type FormState = {
  type: 'LOST' | 'FOUND';
  petName: string;
  animalType: string;
  breed: string;
  color: string;
  description: string;
  location: {
    address: string;
    city: string;
    latitude: string;
    longitude: string;
  };
};

const MAX_FILES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateFiles(files: File[]) {
  if (files.length > MAX_FILES) return `Можно загрузить не более ${MAX_FILES} фотографий`;
  const invalidType = files.find((file) => !file.type.startsWith('image/'));
  if (invalidType) return 'Можно загружать только изображения';
  const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversized) return 'Размер каждой фотографии должен быть до 5 МБ';
  return null;
}

export default function EditAd() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ad, setAd] = useState<EditAdDto | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [form, setForm] = useState<FormState>({
    type: 'LOST',
    petName: '',
    animalType: '',
    breed: '',
    color: '',
    description: '',
    location: {
      address: '',
      city: '',
      latitude: '',
      longitude: '',
    },
  });

  const filePreviews = useMemo(
    () =>
      newFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [newFiles],
  );

  useEffect(
    () => () => {
      filePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [filePreviews],
  );

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const response = await api.get(`/ads/${id}`);
        if (!mounted) return;
        const data = response.data as EditAdDto;
        setAd(data);
        setPhotoUrls((data.photos || []).map((photo) => photo.photoUrl));
        setForm({
          type: data.type,
          petName: data.petName || '',
          animalType: data.animalType || '',
          breed: data.breed || '',
          color: data.color || '',
          description: data.description || '',
          location: {
            address: data.location?.address || '',
            city: data.location?.city || '',
            latitude: data.location?.latitude !== undefined && data.location?.latitude !== null ? String(data.location.latitude) : '',
            longitude: data.location?.longitude !== undefined && data.location?.longitude !== null ? String(data.location.longitude) : '',
          },
        });
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить объявление'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  function onSelectFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    const validationError = validateFiles(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setNewFiles(selected);
  }

  function removeExistingPhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((current) => current !== url));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setError(null);

    if (form.description.trim().length < 10) {
      setError('Описание должно содержать минимум 10 символов');
      return;
    }

    const validationError = validateFiles(newFiles);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const payload = new FormData();
        newFiles.forEach((file) => payload.append('photos', file));
        const uploadResponse = await api.post('/ads/upload', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrls = uploadResponse.data.urls;
      }

      const allPhotos = [...photoUrls, ...uploadedUrls];
      await api.patch(`/ads/${id}`, {
        type: form.type,
        petName: form.petName || undefined,
        animalType: form.animalType || undefined,
        breed: form.breed || undefined,
        color: form.color || undefined,
        description: form.description,
        photos: allPhotos,
        location: {
          address: form.location.address || undefined,
          city: form.location.city || undefined,
          latitude: form.location.latitude ? Number(form.location.latitude) : undefined,
          longitude: form.location.longitude ? Number(form.location.longitude) : undefined,
        },
      });

      navigate('/my-ads');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось сохранить изменения'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Container size="3"><Text>Загрузка...</Text></Container>;
  if (error && !ad) return <Container size="3"><Text color="red">{error}</Text></Container>;
  if (!ad) return <Container size="3"><Text color="red">Объявление не найдено</Text></Container>;

  return (
    <Container size="3">
      <Card>
        <Flex align="center" justify="between" wrap="wrap" gap="2">
          <Heading size="8">Редактирование объявления</Heading>
          <Flex gap="2">
            <Badge>{adTypeLabel(ad.type)}</Badge>
            <Badge color="gray">{adStatusLabel(ad.status)}</Badge>
          </Flex>
        </Flex>

        <form onSubmit={onSubmit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <Text size="2" color="gray">Тип</Text>
            <Select.Root value={form.type} onValueChange={(value) => setForm({ ...form, type: value as 'LOST' | 'FOUND' })}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="LOST">Потерян</Select.Item>
                <Select.Item value="FOUND">Найден</Select.Item>
              </Select.Content>
            </Select.Root>

            <TextField.Root placeholder="Кличка питомца" value={form.petName} onChange={(event) => setForm({ ...form, petName: event.target.value })} />
            <TextField.Root placeholder="Вид" value={form.animalType} onChange={(event) => setForm({ ...form, animalType: event.target.value })} />
            <TextField.Root placeholder="Порода" value={form.breed} onChange={(event) => setForm({ ...form, breed: event.target.value })} />
            <TextField.Root placeholder="Окрас" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />

            <TextArea
              placeholder="Описание"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />

            <Text size="2" color="gray">Адрес и город</Text>
            <TextField.Root placeholder="Город" value={form.location.city} onChange={(event) => setForm({ ...form, location: { ...form.location, city: event.target.value } })} />
            <TextField.Root placeholder="Адрес" value={form.location.address} onChange={(event) => setForm({ ...form, location: { ...form.location, address: event.target.value } })} />
            <Flex gap="2">
              <TextField.Root type="number" placeholder="Широта" value={form.location.latitude} onChange={(event) => setForm({ ...form, location: { ...form.location, latitude: event.target.value } })} />
              <TextField.Root type="number" placeholder="Долгота" value={form.location.longitude} onChange={(event) => setForm({ ...form, location: { ...form.location, longitude: event.target.value } })} />
            </Flex>

            {photoUrls.length > 0 && (
              <Flex direction="column" gap="2">
                <Text size="2" color="gray">Текущие фотографии</Text>
                <Grid columns={{ initial: '2', md: '4' }} gap="2">
                  {photoUrls.map((url) => (
                    <Card key={url} style={{ padding: 8 }}>
                      <img src={url.startsWith('http') ? url : `${config.apiUrl || ''}${url}`} alt="photo" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10 }} />
                      <Button size="1" variant="soft" color="red" type="button" onClick={() => removeExistingPhoto(url)}>
                        Удалить
                      </Button>
                    </Card>
                  ))}
                </Grid>
              </Flex>
            )}

            <Text size="2" color="gray">Добавить новые фотографии</Text>
            <input type="file" multiple accept="image/*" onChange={onSelectFiles} />
            {filePreviews.length > 0 && (
              <Grid columns={{ initial: '2', md: '4' }} gap="2">
                {filePreviews.map((preview) => (
                  <Card key={preview.url} style={{ padding: 8 }}>
                    <img src={preview.url} alt={preview.name} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 10 }} />
                    <Text size="1" color="gray">{preview.name}</Text>
                  </Card>
                ))}
              </Grid>
            )}

            {error && <Text color="red">{error}</Text>}

            <Flex gap="2">
              <Button type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить изменения'}</Button>
              <Button variant="soft" type="button" onClick={() => navigate('/my-ads')}>Отмена</Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}

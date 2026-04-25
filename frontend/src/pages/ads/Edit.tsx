import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import AdPhotoPicker from '../../components/ads/AdPhotoPicker';
import ConfirmActionDialog from '../../components/common/ConfirmActionDialog';
import { extractApiErrorMessage } from '../../shared/apiError';
import { config } from '../../shared/config';
import { LocationPickerMap } from '../../shared/LocationPickerMap';
import { usePageTitle } from '../../shared/usePageTitle';
import { PawIcon, ListIcon, AddIcon } from '../../components/common/Icons';

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
  location: { address: string; city: string; latitude: string; longitude: string };
};

const MAX_FILES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateFiles(files: File[]) {
  const invalidType = files.find((f) => !f.type.startsWith('image/'));
  if (invalidType) return 'Можно загружать только изображения';
  const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
  if (oversized) return 'Размер каждой фотографии должен быть до 5 МБ';
  return null;
}

function resolvePhotoSrc(url: string) {
  return url.startsWith('http') ? url : `${config.apiUrl || ''}${url}`;
}

export default function EditAd() {
  usePageTitle('Редактировать объявление');
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    location: { address: '', city: '', latitude: '', longitude: '' },
  });

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const response = await api.get(`/ads/${id}`);
        if (!mounted) return;
        const data = response.data as EditAdDto;
        setAd(data);
        setPhotoUrls((data.photos || []).map((p) => p.photoUrl));
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
            latitude: data.location?.latitude != null ? String(data.location.latitude) : '',
            longitude: data.location?.longitude != null ? String(data.location.longitude) : '',
          },
        });
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить объявление'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  function addNewFiles(selectedFiles: File[]) {
    const next = [...newFiles, ...selectedFiles].filter(
      (f, i, arr) => arr.findIndex((c) => c.name === f.name && c.size === f.size && c.lastModified === f.lastModified) === i,
    );
    if (photoUrls.length + next.length > MAX_FILES) {
      setError(`Можно сохранить не более ${MAX_FILES} фотографий`);
      return;
    }
    const err = validateFiles(next);
    if (err) { setError(err); return; }
    setError(null);
    setNewFiles(next);
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingPhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setError(null);

    if (form.description.trim().length < 10) {
      setError('Описание должно содержать минимум 10 символов');
      return;
    }
    if (photoUrls.length + newFiles.length > MAX_FILES) {
      setError(`Можно сохранить не более ${MAX_FILES} фотографий`);
      return;
    }
    const fileErr = validateFiles(newFiles);
    if (fileErr) { setError(fileErr); return; }

    setSaving(true);
    try {
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const payload = new FormData();
        newFiles.forEach((f) => payload.append('photos', f));
        const uploadResponse = await api.post('/ads/upload', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrls = uploadResponse.data.urls;
      }

      const latitude = form.location.latitude ? Number(form.location.latitude) : undefined;
      const longitude = form.location.longitude ? Number(form.location.longitude) : undefined;

      await api.patch(`/ads/${id}`, {
        type: form.type,
        petName: form.petName || undefined,
        animalType: form.animalType || undefined,
        breed: form.breed || undefined,
        color: form.color || undefined,
        description: form.description,
        photos: [...photoUrls, ...uploadedUrls],
        location: {
          address: form.location.address || undefined,
          city: form.location.city || undefined,
          latitude,
          longitude,
        },
      });

      // Check if user came from admin page
      const fromAdmin = searchParams.get('from') === 'admin';
      if (fromAdmin) {
        navigate('/admin/ads');
      } else {
        navigate('/my-ads');
      }
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
    <Flex direction="column" gap="0">
      {/* Header */}
      <Flex direction="column" gap="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
        padding: 'var(--space-4)',
      }}>
        <Container size="3">
          <Flex gap="2" align="center">
            <AddIcon width={28} height={28} />
            <Heading size="7" weight="bold" style={{ margin: 0 }}>Редактировать объявление</Heading>
          </Flex>
          <Text color="gray" size="2">Внесите изменения и сохраните объявление</Text>
        </Container>
      </Flex>

      <Container size="3" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <form onSubmit={onSubmit} className="form-root">
          <Flex direction="column" gap="6">
            {error && (
              <Card style={{ background: 'var(--red-2)', borderLeft: '3px solid var(--red-9)' }}>
                <Text color="red" size="2">{error}</Text>
              </Card>
            )}

            {/* Section 1: Type */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="4" weight="bold">Тип объявления</Heading>
                  <Text size="2" color="gray">Выберите, потерян ли питомец или вы его нашли</Text>
                </Flex>
                <Flex gap="3" direction={{ initial: 'column', sm: 'row' }}>
                  {([
                    { value: 'LOST' as const, label: 'Потерян питомец', description: 'Мой питомец потерялся' },
                    { value: 'FOUND' as const, label: 'Найден питомец', description: 'Я нашёл бездомного питомца' },
                  ]).map(({ value, label, description }) => (
                    <Card
                      key={value}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        background: form.type === value ? 'var(--violet-a2)' : 'var(--gray-a1)',
                        border: form.type === value ? '2px solid var(--violet-8)' : '1px solid var(--gray-a6)',
                        transition: 'all 0.2s ease',
                        padding: 'var(--space-3)',
                      }}
                      onClick={() => setForm({ ...form, type: value })}
                    >
                      <Flex direction="column" gap="2" align="start">
                        <Text weight="bold">{label}</Text>
                        <Text size="1" color="gray">{description}</Text>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              </Flex>
            </Card>

            {/* Section 2: Pet Info */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Flex gap="2" align="center">
                    <PawIcon width={20} height={20} />
                    <Heading size="4" weight="bold" style={{ margin: 0 }}>Информация о питомце</Heading>
                  </Flex>
                  <Text size="2" color="gray">Укажите основные характеристики</Text>
                </Flex>
                <Flex direction="column" gap="3">
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" color="gray">Кличка питомца</Text>
                    <TextField.Root
                      placeholder="Например: Мурзик, Шарик"
                      value={form.petName}
                      onChange={(e) => setForm({ ...form, petName: e.target.value })}
                    />
                  </Flex>
                  <Flex gap="3" direction={{ initial: 'column', md: 'row' }}>
                    <Flex direction="column" gap="2" style={{ flex: 1 }}>
                      <Text size="2" weight="bold" color="gray">Вид животного</Text>
                      <TextField.Root
                        placeholder="Например: Кот, Собака"
                        value={form.animalType}
                        onChange={(e) => setForm({ ...form, animalType: e.target.value })}
                      />
                    </Flex>
                    <Flex direction="column" gap="2" style={{ flex: 1 }}>
                      <Text size="2" weight="bold" color="gray">Порода</Text>
                      <TextField.Root
                        placeholder="Например: Персидский"
                        value={form.breed}
                        onChange={(e) => setForm({ ...form, breed: e.target.value })}
                      />
                    </Flex>
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" color="gray">Окрас</Text>
                    <TextField.Root
                      placeholder="Например: Белый с чёрными пятнами"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                  </Flex>
                </Flex>
              </Flex>
            </Card>

            {/* Section 3: Description */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Flex gap="2" align="center">
                    <ListIcon width={20} height={20} />
                    <Heading size="4" weight="bold" style={{ margin: 0 }}>Описание *</Heading>
                  </Flex>
                  <Text size="2" color="gray">Опишите обстоятельства и характерные приметы</Text>
                </Flex>
                <TextArea
                  placeholder="Когда и где пропал/найден, особые приметы..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: '140px' }}
                />
                <Text size="1" color="gray">Минимум 10 символов.</Text>
              </Flex>
            </Card>

            {/* Section 4: Location */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="4" weight="bold">📍 Местоположение</Heading>
                  <Text size="2" color="gray">Укажите место, где питомец был потерян или найден</Text>
                </Flex>
                <LocationPickerMap
                  value={{
                    latitude: form.location.latitude ? Number(form.location.latitude) : null,
                    longitude: form.location.longitude ? Number(form.location.longitude) : null,
                  }}
                  onChange={(next) =>
                    setForm((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        latitude: next ? String(next.latitude) : '',
                        longitude: next ? String(next.longitude) : '',
                      },
                    }))
                  }
                  height={320}
                />
                <Flex gap="3" direction={{ initial: 'column', md: 'row' }}>
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Text size="2" weight="bold" color="gray">Город</Text>
                    <TextField.Root
                      placeholder="Например: Минск"
                      value={form.location.city}
                      onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })}
                    />
                  </Flex>
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Text size="2" weight="bold" color="gray">Адрес</Text>
                    <TextField.Root
                      placeholder="Например: ул. Пушкина, дом 10"
                      value={form.location.address}
                      onChange={(e) => setForm({ ...form, location: { ...form.location, address: e.target.value } })}
                    />
                  </Flex>
                </Flex>
                <Text size="1" color="gray">
                  {form.location.latitude && form.location.longitude
                    ? `Координаты: ${form.location.latitude}, ${form.location.longitude}`
                    : 'Метка не выбрана'}
                </Text>
              </Flex>
            </Card>

            {/* Section 5: Photos */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="4" weight="bold">📸 Фотографии</Heading>
                  <Text size="2" color="gray">До 8 фотографий (до 5 МБ каждая)</Text>
                </Flex>

                {/* Existing photos */}
                {photoUrls.length > 0 && (
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" color="gray">Текущие фотографии</Text>
                    <div className="photo-grid">
                      {photoUrls.map((url) => (
                        <Card key={url} className="photo-card">
                          <img src={resolvePhotoSrc(url)} alt="photo" className="photo-card-image" />
                          <ConfirmActionDialog
                            title="Удалить фото?"
                            description="Фотография будет удалена после сохранения."
                            confirmText="Удалить"
                            color="red"
                            onConfirm={() => removeExistingPhoto(url)}
                            trigger={
                              <Button size="1" type="button" color="red" variant="solid" className="photo-card-remove" aria-label="Удалить фото">
                                ×
                              </Button>
                            }
                          />
                        </Card>
                      ))}
                    </div>
                  </Flex>
                )}

                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold" color="gray">Добавить новые фото</Text>
                  <AdPhotoPicker
                    files={newFiles}
                    onAddFiles={addNewFiles}
                    onRemoveFile={removeNewFile}
                    maxFiles={Math.max(0, MAX_FILES - photoUrls.length)}
                  />
                </Flex>
              </Flex>
            </Card>

            {/* Submit */}
            <Flex gap="3" direction={{ initial: 'column', sm: 'row' }}>
              <Button type="submit" disabled={saving} size="3" style={{ flex: 1, fontWeight: 600, cursor: 'pointer' }}>
                {saving ? '⏳ Сохранение...' : '💾 Сохранить изменения'}
              </Button>
              <Button type="button" variant="soft" size="3" onClick={() => {
                const fromAdmin = searchParams.get('from') === 'admin';
                if (fromAdmin) {
                  navigate('/admin/ads');
                } else {
                  navigate('/my-ads');
                }
              }} style={{ flex: 1, fontWeight: 600, cursor: 'pointer' }}>
                ← Отмена
              </Button>
            </Flex>
          </Flex>
        </form>
      </Container>
    </Flex>
  );
}

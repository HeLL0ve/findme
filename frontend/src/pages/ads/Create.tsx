import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import AdPhotoPicker from '../../components/ads/AdPhotoPicker';
import { extractApiErrorMessage } from '../../shared/apiError';

type CreateAdFormState = {
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

export default function CreateAd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState<CreateAdFormState>({
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

  function addFiles(newFiles: File[]) {
    const next = [...files, ...newFiles];
    const unique = next.filter(
      (file, index, arr) =>
        arr.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified,
        ) === index,
    );

    const validationError = validateFiles(unique);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFiles(unique);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.description.trim().length < 10) {
      setError('Описание должно содержать минимум 10 символов');
      return;
    }

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      let photoUrls: string[] = [];
      if (files.length > 0) {
        const payload = new FormData();
        files.forEach((file) => payload.append('photos', file));
        const uploadResponse = await api.post('/ads/upload', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        photoUrls = uploadResponse.data.urls;
      }

      const latitude = form.location.latitude ? Number(form.location.latitude) : undefined;
      const longitude = form.location.longitude ? Number(form.location.longitude) : undefined;

      const response = await api.post('/ads', {
        type: form.type,
        petName: form.petName || undefined,
        animalType: form.animalType || undefined,
        breed: form.breed || undefined,
        color: form.color || undefined,
        description: form.description,
        photos: photoUrls,
        location: {
          address: form.location.address || undefined,
          city: form.location.city || undefined,
          latitude,
          longitude,
        },
      });

      navigate(`/ads/${response.data.id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось создать объявление'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="3">
      <Card>
        <Heading size="8">Создать объявление</Heading>
        <form onSubmit={submit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <Text size="2" color="gray">
              Тип
            </Text>
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
              placeholder="Опишите обстоятельства и приметы питомца"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />

            <Text size="2" color="gray">
              Адрес и город
            </Text>
            <TextField.Root placeholder="Город" value={form.location.city} onChange={(event) => setForm({ ...form, location: { ...form.location, city: event.target.value } })} />
            <TextField.Root placeholder="Адрес" value={form.location.address} onChange={(event) => setForm({ ...form, location: { ...form.location, address: event.target.value } })} />
            <Flex gap="2">
              <TextField.Root
                type="number"
                placeholder="Широта"
                value={form.location.latitude}
                onChange={(event) => setForm({ ...form, location: { ...form.location, latitude: event.target.value } })}
              />
              <TextField.Root
                type="number"
                placeholder="Долгота"
                value={form.location.longitude}
                onChange={(event) => setForm({ ...form, location: { ...form.location, longitude: event.target.value } })}
              />
            </Flex>

            <Text size="2" color="gray">
              Фотографии (до 8, до 5 МБ)
            </Text>
            <AdPhotoPicker files={files} onAddFiles={addFiles} onRemoveFile={removeFile} />

            {error && <Text color="red">{error}</Text>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить на модерацию'}
            </Button>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}

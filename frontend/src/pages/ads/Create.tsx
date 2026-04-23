import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import AdPhotoPicker from '../../components/ads/AdPhotoPicker';
import { extractApiErrorMessage } from '../../shared/apiError';
import { AddIcon, PawIcon, ListIcon } from '../../components/common/Icons';

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
    <Flex direction="column" gap="0">
      {/* Header Section */}
      <Flex direction="column" gap="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
        padding: 'var(--space-4)',
      }}>
        <Container size="3">
          <Flex gap="2" align="center">
            <AddIcon width={28} height={28} />
            <Heading size="7" weight="bold" style={{margin:"0px"}}>Создать объявление</Heading>
          </Flex>
          <Text color="gray" size="2">
            Помогите вернуть потерянного питомца или дайте новый дом найденному в беде
          </Text>
        </Container>
      </Flex>

      <Container size="3" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <form onSubmit={submit} className="form-root">
          <Flex direction="column" gap="6">
            {error && (
              <Card style={{
                background: 'var(--red-2)',
                borderLeft: '3px solid var(--red-9)',
              }}>
                <Text color="red" size="2">{error}</Text>
              </Card>
            )}

            {/* Section 1: Type & Basic Info */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="4" weight="bold">Тип объявления</Heading>
                  <Text size="2" color="gray">Выберите, потерян ли питомец или вы его нашли</Text>
                </Flex>

                <Flex gap="3" direction={{ initial: 'column', sm: 'row' }}>
                  {[
                    { value: 'LOST' as const, label: 'Потерян питомец', description: 'Мой питомец потерялся' },
                    { value: 'FOUND' as const, label: 'Найден питомец', description: 'Я нашёл бездомного питомца' },
                  ].map(({ value, label, description }) => (
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

            {/* Section 2: Pet Basic Info */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Flex gap="2" align="center">
                    <PawIcon width={20} height={20} />
                    <Heading size="4" weight="bold" style={{margin:"0px"}}>Информация о питомце</Heading>
                  </Flex>
                  <Text size="2" color="gray">Укажите основные характеристики (отмечено * обязательно)</Text>
                </Flex>

                <Flex direction="column" gap="3">
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" color="gray">Кличка питомца</Text>
                    <TextField.Root
                      placeholder="Например: Мурзик, Шарик"
                      value={form.petName}
                      onChange={(event) => setForm({ ...form, petName: event.target.value })}
                    />
                    <Text size="1" color="gray">Помогает людям быстро узнать вашего питомца</Text>
                  </Flex>

                  <Flex gap="3" direction={{ initial: 'column', md: 'row' }}>
                    <Flex direction="column" gap="2" style={{ flex: 1 }}>
                      <Text size="2" weight="bold" color="gray">Вид животного *</Text>
                      <TextField.Root
                        placeholder="Например: Кот, Собака, Попугай"
                        value={form.animalType}
                        onChange={(event) => setForm({ ...form, animalType: event.target.value })}
                      />
                    </Flex>
                    <Flex direction="column" gap="2" style={{ flex: 1 }}>
                      <Text size="2" weight="bold" color="gray">Порода</Text>
                      <TextField.Root
                        placeholder="Например: Персидский, Немецкая овчарка"
                        value={form.breed}
                        onChange={(event) => setForm({ ...form, breed: event.target.value })}
                      />
                    </Flex>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold" color="gray">Окрас</Text>
                    <TextField.Root
                      placeholder="Например: Белый с чёрными пятнами"
                      value={form.color}
                      onChange={(event) => setForm({ ...form, color: event.target.value })}
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
                    <Heading size="4" weight="bold" style={{margin:"0px"}}> Описание *</Heading>
                  </Flex>              

                  <Text size="2" color="gray">Опишите обстоятельства и характерные приметы</Text>
                </Flex>

                <Flex direction="column" gap="2">
                  <TextArea
                    placeholder={`Например:\n- Когда питомец пропал/найден\n- Где это произошло\n- Особые приметы (шрамы, метки)\n- Что с собой был питомец (ошейник, чип)`}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    style={{ minHeight: '140px' }}
                  />
                  <Text size="1" color="gray">
                    Минимум 10 символов. Чем детальнее описание, тем выше вероятность найти питомца.
                  </Text>
                </Flex>
              </Flex>
            </Card>

            {/* Section 4: Location */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="4" weight="bold">📍 Местоположение</Heading>
                  <Text size="2" color="gray">Укажите место, где питомец был потерян или найден</Text>
                </Flex>

                <Flex direction="column" gap="3">
                  <Flex gap="3" direction={{ initial: 'column', md: 'row' }}>
                    <Flex direction="column" gap="2" style={{ flex: 1 }}>
                      <Text size="2" weight="bold" color="gray">Город</Text>
                      <TextField.Root
                        placeholder="Например: Москва"
                        value={form.location.city}
                        onChange={(event) => setForm({ ...form, location: { ...form.location, city: event.target.value } })}
                      />
                    </Flex>
                    <Flex direction="column" gap="2" style={{ flex: 1 }}>
                      <Text size="2" weight="bold" color="gray">Адрес</Text>
                      <TextField.Root
                        placeholder="Например: ул. Пушкина, дом 10"
                        value={form.location.address}
                        onChange={(event) => setForm({ ...form, location: { ...form.location, address: event.target.value } })}
                      />
                    </Flex>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="1" weight="bold" color="gray">Координаты GPS (опционально)</Text>
                    <Flex gap="3">
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="1" color="gray">Широта</Text>
                        <TextField.Root
                          type="number"
                          placeholder="55.7558"
                          step="0.00001"
                          value={form.location.latitude}
                          onChange={(event) => setForm({ ...form, location: { ...form.location, latitude: event.target.value } })}
                        />
                      </Flex>
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="1" color="gray">Долгота</Text>
                        <TextField.Root
                          type="number"
                          placeholder="37.6173"
                          step="0.00001"
                          value={form.location.longitude}
                          onChange={(event) => setForm({ ...form, location: { ...form.location, longitude: event.target.value } })}
                        />
                      </Flex>
                    </Flex>
                    <Text size="1" color="gray">Помогает другим видеть точное место на карте</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>

            {/* Section 5: Photos */}
            <Card>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="4" weight="bold">📸 Фотографии</Heading>
                  <Text size="2" color="gray">Загрузьте до 8 фотографий питомца (до 5 МБ каждая)</Text>
                </Flex>

                <AdPhotoPicker files={files} onAddFiles={addFiles} onRemoveFile={removeFile} />

                <Text size="1" color="gray">
                  💡 Совет: загружайте четкие фото с разных ракурсов. Хорошие фотографии увеличивают шансы найти питомца.
                </Text>
              </Flex>
            </Card>

            {/* Submit Button */}
            <Flex gap="3" direction={{ initial: 'column', sm: 'row' }}>
              <Button
                type="submit"
                disabled={loading}
                size="3"
                style={{ flex: 1, fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? '⏳ Отправка...' : '📤 Отправить на модерацию'}
              </Button>
              <Button
                type="button"
                variant="soft"
                size="3"
                onClick={() => navigate('/ads')}
                style={{ flex: 1, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Вернуться к объявлениям
              </Button>
            </Flex>

            <Card style={{
              background: 'var(--blue-a1)',
              border: '1px solid var(--blue-a6)',
            }}>
              <Flex gap="2" align="start">
                <Text size="4">ℹ️</Text>
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold">После отправки</Text>
                  <Text size="2" color="gray">
                    Ваше объявление попадет на модерацию. Когда оно одобрено, оно будет видно всем другим пользователям.
                    Следите за порталом и отвечайте на сообщения.
                  </Text>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </form>
      </Container>

      <style>{`
        .form-root input[type="number"]::-webkit-outer-spin-button,
        .form-root input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .form-root input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </Flex>
  );
}

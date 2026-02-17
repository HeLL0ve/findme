import { useEffect, useMemo, useRef } from 'react';
import { Card, Flex, IconButton, Text } from '@radix-ui/themes';

type AdPhotoPickerProps = {
  files: File[];
  maxFiles?: number;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
};

export default function AdPhotoPicker({
  files,
  maxFiles = 8,
  onAddFiles,
  onRemoveFile,
}: AdPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previews = useMemo(
    () =>
      files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews],
  );

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 0) onAddFiles(selected);
    event.target.value = '';
  }

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2" wrap="wrap">
        <button
          type="button"
          className="photo-picker-btn"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= maxFiles}
        >
          Добавить фото
        </button>
        <Text size="2" color="gray">
          {files.length} / {maxFiles}
        </Text>
      </Flex>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {previews.length > 0 && (
        <div className="photo-grid">
          {previews.map((preview, index) => (
            <Card key={preview.id} className="photo-card">
              <img src={preview.url} alt={preview.name} className="photo-card-image" />
              <IconButton
                type="button"
                size="1"
                variant="solid"
                color="red"
                className="photo-card-remove"
                onClick={() => onRemoveFile(index)}
                aria-label="Удалить фото"
              >
                ×
              </IconButton>
              <Text size="1" color="gray" className="truncate">
                {preview.name}
              </Text>
            </Card>
          ))}
        </div>
      )}
    </Flex>
  );
}

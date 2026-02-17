import { Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { useState, type ReactNode } from 'react';

type ConfirmActionDialogProps = {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'red' | 'gray' | 'violet' | 'orange';
  onConfirm: () => Promise<void> | void;
};

export default function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  color = 'red',
  onConfirm,
}: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>{trigger}</Dialog.Trigger>
      <Dialog.Content maxWidth="420px">
        <Dialog.Title>{title}</Dialog.Title>
        {description && <Text color="gray">{description}</Text>}
        <Flex justify="end" gap="2" mt="3">
          <Dialog.Close>
            <Button variant="soft" type="button">{cancelText}</Button>
          </Dialog.Close>
          <Button type="button" color={color} disabled={loading} onClick={() => void handleConfirm()}>
            {loading ? 'Выполняется...' : confirmText}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

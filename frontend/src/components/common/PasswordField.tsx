import { useId, useState } from 'react';
import { IconButton, TextField } from '@radix-ui/themes';

function EyeIcon(props: { open: boolean }) {
  return props.open ? (
    // 👁 ОТКРЫТЫЙ
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12C4 12 5.6 7 12 7M12 7C18.4 7 20 12 20 12M12 7V4M18 5L16 7.5M6 5L8 7.5M15 13C15 14.6569 13.6569 16 12 16C10.3431 16 9 14.6569 9 13C9 11.3431 10.3431 10 12 10C13.6569 10 15 11.3431 15 13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    // 🙈 ЗАКРЫТЫЙ
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10C4 10 5.6 15 12 15M12 15C18.4 15 20 10 20 10M12 15V18M18 17L16 14.5M6 17L8 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PasswordField(props: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  name?: string;
  disabled?: boolean;
}) {
  const {
    value,
    onChange,
    placeholder = 'Пароль',
    required,
    minLength,
    autoComplete,
    name,
    disabled,
  } = props;

  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <TextField.Root
      id={id}
      type={open ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      minLength={minLength}
      autoComplete={autoComplete}
      name={name}
      disabled={disabled}
    >
      <TextField.Slot side="right">
        <IconButton
          type="button"
          variant="ghost"
          color="gray"
          radius="full"
          aria-label={open ? 'Скрыть пароль' : 'Показать пароль'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((v) => !v)}
        >
          <EyeIcon open={open} />
        </IconButton>
      </TextField.Slot>
    </TextField.Root>
  );
}


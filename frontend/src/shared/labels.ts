export function roleLabel(role?: 'USER' | 'ADMIN' | null) {
  if (role === 'ADMIN') return 'Администратор';
  if (role === 'USER') return 'Пользователь';
  return 'Гость';
}

export function adTypeLabel(type?: 'LOST' | 'FOUND' | string | null) {
  if (type === 'LOST') return 'Потерян';
  if (type === 'FOUND') return 'Найден';
  return type || '—';
}

export function adStatusLabel(status?: string | null) {
  switch (status) {
    case 'PENDING':
      return 'На модерации';
    case 'APPROVED':
      return 'Опубликовано';
    case 'REJECTED':
      return 'Отклонено';
    case 'ARCHIVED':
      return 'В архиве';
    default:
      return status || '—';
  }
}

export function complaintStatusLabel(status?: string | null) {
  switch (status) {
    case 'PENDING':
      return 'Новая';
    case 'RESOLVED':
      return 'Решена';
    case 'REJECTED':
      return 'Отклонена';
    default:
      return status || '—';
  }
}

export function complaintTargetLabel(targetType?: string | null) {
  if (targetType === 'AD') return 'Объявление';
  if (targetType === 'USER') return 'Пользователь';
  return targetType || '—';
}

export function notificationTypeLabel(type?: string | null) {
  switch (type) {
    case 'CHAT_MESSAGE':
      return 'Сообщение';
    case 'AD_MODERATION_SUBMITTED':
      return 'Модерация';
    case 'AD_APPROVED':
      return 'Одобрение';
    case 'AD_REJECTED':
      return 'Отклонение';
    case 'COMPLAINT_SUBMITTED':
      return 'Жалоба';
    default:
      return type || 'Уведомление';
  }
}

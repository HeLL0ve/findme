import { Avatar, Flex, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { config } from '../../shared/config';

type UserAvatarLinkProps = {
  userId: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  subtitle?: string;
  size?: '1' | '2' | '3';
};

function resolveAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${config.apiUrl || ''}${avatarUrl}`;
}

export default function UserAvatarLink({
  userId,
  name,
  email,
  avatarUrl,
  subtitle,
  size = '2',
}: UserAvatarLinkProps) {
  const label = name || email || 'Пользователь';

  return (
    <Link to={`/users/${userId}`} style={{ textDecoration: 'none', minWidth: 0 }}>
      <Flex align="center" gap="2" style={{ minWidth: 0 }}>
        <Avatar
          src={resolveAvatarSrc(avatarUrl)}
          fallback={label.slice(0, 1).toUpperCase()}
          radius="full"
          size={size}
        />
        <Flex direction="column" style={{ minWidth: 0 }}>
          <Text weight="bold" className="truncate">{label}</Text>
          {subtitle && <Text size="1" color="gray" className="truncate">{subtitle}</Text>}
        </Flex>
      </Flex>
    </Link>
  );
}

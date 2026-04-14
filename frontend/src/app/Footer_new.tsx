import { Container, Flex, Text, Heading, Box, Link as RadixLink } from '@radix-ui/themes';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--gray-a1)',
      borderTop: '1px solid var(--gray-a6)',
      marginTop: '60px',
    }}>
      <Container size="4">
        <Box style={{ padding: 'var(--space-4) 0' }}>
          <Flex 
            gap={{ initial: '6', sm: '8' }} 
            direction={{ initial: 'column', sm: 'row' }} 
            justify="between" 
            mb="6"
          >
            {/* About Section */}
            <Flex direction="column" gap="3" style={{ minWidth: '180px', flex: '0 0 auto' }}>
              <Flex direction="column" gap="2">
                <Heading size="3" weight="bold">FindMe</Heading>
                <Text size="2" color="gray" style={{ maxWidth: '280px', lineHeight: '1.6' }}>
                  Платформа для поиска и возврата потерянных домашних животных
                </Text>
              </Flex>
              <Text size="1" color="gray">
                Вместе мы помогаем питомцам вернуться домой
              </Text>
            </Flex>

            {/* Links Sections - Grid on mobile */}
            <Flex 
              direction={{ initial: 'row', xs: 'row' }}
              gap={{ initial: '4', sm: '6' }}
              wrap="wrap"
              style={{ flex: 1 }}
            >
              {/* Quick Links */}
              <Flex direction="column" gap="2" style={{ minWidth: '150px' }}>
                <Heading size="3" weight="bold">Быстрые ссылки</Heading>
                <Flex direction="column" gap="1">
                  <RadixLink asChild underline="hover" size="2">
                    <Link to="/">Главная</Link>
                  </RadixLink>
                  <RadixLink asChild underline="hover" size="2">
                    <Link to="/ads">Поиск объявлений</Link>
                  </RadixLink>
                  <RadixLink asChild underline="hover" size="2">
                    <Link to="/create-ad">Создать объявление</Link>
                  </RadixLink>
                  <RadixLink asChild underline="hover" size="2">
                    <Link to="/chats">Сообщения</Link>
                  </RadixLink>
                </Flex>
              </Flex>

              {/* User Links */}
              <Flex direction="column" gap="2" style={{ minWidth: '150px' }}>
                <Heading size="3" weight="bold">Личное</Heading>
                <Flex direction="column" gap="1">
                  <RadixLink asChild underline="hover" size="2">
                    <Link to="/profile">Профиль</Link>
                  </RadixLink>
                  <RadixLink asChild underline="hover" size="2">
                    <Link to="/my-ads">Мои объявления</Link>
                  </RadixLink>
                  <RadixLink asChild underline="hover" size="2">
                    <Link to="/notifications">Уведомления</Link>
                  </RadixLink>
                </Flex>
              </Flex>

              {/* Info Links */}
              <Flex direction="column" gap="2" style={{ minWidth: '150px' }}>
                <Heading size="3" weight="bold">Информация</Heading>
                <Flex direction="column" gap="1">
                  <RadixLink href="https://github.com" target="_blank" underline="hover" size="2">
                    GitHub
                  </RadixLink>
                  <a href="/" style={{ textDecoration: 'none', color: 'var(--accent-11)' }}>
                    <Text size="2" color="blue" style={{ cursor: 'pointer' }}>Условия</Text>
                  </a>
                  <a href="/" style={{ textDecoration: 'none', color: 'var(--accent-11)' }}>
                    <Text size="2" color="blue" style={{ cursor: 'pointer' }}>Конфиденциальность</Text>
                  </a>
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Divider */}
          <Box style={{
            height: '1px',
            background: 'var(--gray-a6)',
            margin: 'var(--space-3) 0',
          }} />

          {/* Bottom Footer */}
          <Flex 
            justify={{ initial: 'center', sm: 'between' }} 
            align="center" 
            wrap="wrap" 
            gap="3" 
            direction={{ initial: 'column', sm: 'row' }}
            style={{ textAlign: 'center', fontSize: '12px' }}
          >
            <Text size="1" color="gray">
              © {currentYear} FindMe · Дипломный проект
            </Text>
            <Text size="1" color="gray">
              💛 Помогайте животам вернуться домой
            </Text>
          </Flex>
        </Box>
      </Container>

      <style>{`
        footer a {
          text-decoration: none;
          color: var(--accent-11);
          transition: color 0.2s ease;
        }
        footer a:hover {
          color: var(--accent-12);
          text-decoration: underline;
        }
        
        @media (max-width: 640px) {
          footer {
            margin-top: 40px;
          }
        }
      `}</style>
    </footer>
  );
}

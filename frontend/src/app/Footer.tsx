import { Container, Flex, Text } from '@radix-ui/themes';

export default function Footer() {
  return (
    <footer style={{ padding: '24px 0', marginTop: 32, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Container size="3">
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Text size="2" color="gray">© {new Date().getFullYear()} FindMe</Text>
          <Text size="2" color="gray">Проект для дипломной работы</Text>
        </Flex>
      </Container>
    </footer>
  );
}

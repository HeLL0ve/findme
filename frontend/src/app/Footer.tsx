import { Container, Flex, Text } from '@radix-ui/themes';

export default function Footer() {
  return (
    <footer style={{ padding: '24px 0', marginTop: 32 }}>
      <Container size="4">
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Text size="2" color="gray">© {new Date().getFullYear()} FindMe</Text>
          <Text size="2" color="gray">Дипломный проект по поиску потерянных питомцев</Text>
        </Flex>
      </Container>
    </footer>
  );
}

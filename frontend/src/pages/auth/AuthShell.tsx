import type { CSSProperties, ReactNode } from 'react';
import { Card, Container, Flex, Heading, Text } from '@radix-ui/themes';

type AuthTone = 'violet' | 'blue' | 'green' | 'orange';

function toneVars(tone: AuthTone): CSSProperties {
  switch (tone) {
    case 'green':
      return {
        ['--auth-glow-1' as never]: 'color-mix(in oklab, var(--green-a6) 55%, transparent)',
        ['--auth-glow-2' as never]: 'color-mix(in oklab, var(--violet-a6) 45%, transparent)',
        ['--auth-glow-3' as never]: 'color-mix(in oklab, var(--green-a5) 40%, transparent)',
        ['--auth-kicker-bg' as never]: 'var(--green-a3)',
        ['--auth-kicker-border' as never]: 'var(--green-a6)',
        ['--auth-kicker-text' as never]: 'var(--green-11)',
      };
    case 'blue':
      return {
        ['--auth-glow-1' as never]: 'color-mix(in oklab, var(--blue-a6) 55%, transparent)',
        ['--auth-glow-2' as never]: 'color-mix(in oklab, var(--iris-a6) 45%, transparent)',
        ['--auth-glow-3' as never]: 'color-mix(in oklab, var(--blue-a5) 40%, transparent)',
        ['--auth-kicker-bg' as never]: 'var(--blue-a3)',
        ['--auth-kicker-border' as never]: 'var(--blue-a6)',
        ['--auth-kicker-text' as never]: 'var(--blue-11)',
      };
    case 'orange':
      return {
        ['--auth-glow-1' as never]: 'color-mix(in oklab, var(--orange-a6) 55%, transparent)',
        ['--auth-glow-2' as never]: 'color-mix(in oklab, var(--violet-a6) 40%, transparent)',
        ['--auth-glow-3' as never]: 'color-mix(in oklab, var(--amber-a5) 35%, transparent)',
        ['--auth-kicker-bg' as never]: 'var(--orange-a3)',
        ['--auth-kicker-border' as never]: 'var(--orange-a6)',
        ['--auth-kicker-text' as never]: 'var(--orange-11)',
      };
    case 'violet':
    default:
      return {
        ['--auth-glow-1' as never]: 'color-mix(in oklab, var(--violet-a6) 55%, transparent)',
        ['--auth-glow-2' as never]: 'color-mix(in oklab, var(--iris-a6) 45%, transparent)',
        ['--auth-glow-3' as never]: 'color-mix(in oklab, var(--violet-a5) 40%, transparent)',
        ['--auth-kicker-bg' as never]: 'var(--violet-a3)',
        ['--auth-kicker-border' as never]: 'var(--violet-a6)',
        ['--auth-kicker-text' as never]: 'var(--violet-11)',
      };
  }
}

export function AuthShell(props: {
  title: string;
  subtitle?: string;
  kicker?: string;
  tone?: AuthTone;
  children: ReactNode;
}) {
  const { title, subtitle, kicker, tone = 'violet', children } = props;

  return (
    <div className="auth-shell" style={toneVars(tone)}>
      <Container size="2" className="auth-container">
        <Card className="auth-card">
          <div className="auth-card-header">
            <Flex direction="column" gap="2">
              {kicker && (
                <Text as="div" size="2">
                  <span className="auth-kicker">{kicker}</span>
                </Text>
              )}
              <Heading size="7">{title}</Heading>
              {subtitle && (
                <Text size="2" color="gray">
                  {subtitle}
                </Text>
              )}
            </Flex>
          </div>
          <div className="auth-card-body">{children}</div>
        </Card>
      </Container>
    </div>
  );
}


import { useEffect, useRef, useState } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { useAuthStore } from '../../shared/authStore';
import { api } from '../../api/axios';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: Date;
  senderName?: string;
};

const MessageIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load history once when opening
  useEffect(() => {
    if (isOpen && !initialized && user) {
      loadHistory();
      setInitialized(true);
    }
  }, [isOpen, initialized, user]);

  async function loadHistory() {
    setLoading(true);
    try {
      const response = await api.get('/support/with-admin/messages');
      if (response.data?.messages) {
        setMessages(response.data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.senderId === user?.id ? 'user' : 'admin',
          timestamp: new Date(msg.createdAt),
          senderName: msg.sender?.name || 'Администратор',
        })));
        setHasUnread(false);
      }
    } catch (err) {
      console.error('Load history error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user) return;
    const text = newMessage;
    setNewMessage('');

    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      text,
      sender: 'user',
      timestamp: new Date(),
      senderName: user.name || 'Вы',
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const response = await api.post('/support/with-admin/message', { text });
      setMessages(prev =>
        prev.map(m => m.id === tempMsg.id ? { ...m, id: response.data.id } : m)
      );
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(text);
    }
  }

  if (!user) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: 'var(--chat-user-bg)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '24px',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1.12) translateY(-4px)';
          el.style.boxShadow = '0 12px 32px rgba(124, 58, 237, 0.6)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.5)';
        }}
      >
        <MessageIcon size={28} />
        {hasUnread && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              animation: 'pulse 2s infinite',
            }}
          >
            ●
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '16px',
            left: '16px',
            maxWidth: '340px',
            marginLeft: 'auto',
            height: '70vh',
            maxHeight: '480px',
            background: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--gray-a5)',
            boxShadow: '0 20px 48px var(--gray-a6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1001,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--gray-a5)',
              background: 'var(--chat-user-bg)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text weight="bold" size="3">
              Поддержка
            </Text>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 12px',
              background: 'linear-gradient(to bottom, var(--surface) 0%, var(--gray-a1) 100%)',
            }}
          >
            {loading && (
              <Text size="2" color="gray" align="center" style={{ padding: '20px' }}>
                Загрузка...
              </Text>
            )}

            {messages.length === 0 && !loading && (
              <Text size="2" color="gray" align="center" style={{ padding: '40px 12px' }}>
                Нет сообщений
              </Text>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'slideUp 0.3s ease-out',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: msg.sender === 'user' ? 'var(--chat-user-bg)' : 'var(--chat-admin-bg)',
                    color: msg.sender === 'user' ? 'var(--chat-user-text)' : 'var(--chat-admin-text)',
                    boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(124, 58, 237, 0.2)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {msg.sender === 'admin' && (
                    <Text size="1" weight="bold" style={{ marginBottom: '4px', opacity: 0.7 }}>
                      {msg.senderName}
                    </Text>
                  )}
                  <Text size="2">{msg.text}</Text>
                  <Text
                    size="1"
                    style={{
                      marginTop: '4px',
                      opacity: 0.6,
                      fontSize: '11px',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--gray-a5)', background: 'var(--gray-2)' }}>
            <Flex gap="2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Сообщение..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid var(--gray-a5)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  backgroundColor: 'var(--gray-1)',
                  color: 'var(--gray-12)',
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--violet-a7)';
                  (e.currentTarget as HTMLInputElement).style.backgroundColor = 'var(--surface)';
                  (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--violet-a3)';
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--gray-a5)';
                  (e.currentTarget as HTMLInputElement).style.backgroundColor = 'var(--gray-1)';
                  (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                style={{
                  padding: '10px 16px',
                  background: newMessage.trim() ? 'var(--chat-user-bg)' : 'var(--gray-6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newMessage.trim() ? 'pointer' : 'default',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (newMessage.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                ОК
              </button>
            </Flex>
          </div>
        </div>
      )}
    </div>
  );
}

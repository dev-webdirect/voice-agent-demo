'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type VapiType from '@vapi-ai/web';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [];
const PILL_W = 36;
const PILL_H = 13;
const PILL_GAP = 5;
const COL_GAP = 9;
const MAX_ROWS = 14;
const C = {
  w: '#ffffff',
  p: '#c084fc',
  g: '#4ade80',
  b: '#38bdf8',
  y: '#facc15',
  o: '#fb923c',
  k: '#f472b6'
};
const ROW_PALETTES: string[][] = [[C.y, C.b, C.o, C.p, C.y, C.g, C.o, C.w, C.y, C.g, C.b, C.y, C.p, C.g, C.o, C.p, C.w, C.b, C.y, C.p, C.g, C.y, C.w], [C.b, C.w, C.p, C.b, C.w, C.p, C.w, C.g, C.b, C.p, C.w, C.y, C.b, C.w, C.g, C.y, C.p, C.g, C.b, C.w, C.y, C.b, C.g], [C.p, C.g, C.w, C.y, C.g, C.w, C.b, C.p, C.w, C.y, C.p, C.g, C.w, C.b, C.p, C.w, C.g, C.y, C.p, C.g, C.b, C.p, C.o], [C.g, C.p, C.b, C.w, C.b, C.y, C.w, C.b, C.g, C.w, C.y, C.b, C.g, C.p, C.b, C.g, C.w, C.p, C.g, C.b, C.w, C.g, C.y]];
const getUpperRowColor = (col: number, row: number): string => {
  const h = (col * 13 + row * 7) % 19;
  if (h === 2) return C.p;
  if (h === 6) return C.g;
  if (h === 12) return C.b;
  if (h === 15) return C.y;
  return C.w;
};
const getPillColor = (col: number, row: number): string => {
  if (row < ROW_PALETTES.length) return ROW_PALETTES[row][col % ROW_PALETTES[row].length];
  return getUpperRowColor(col, row);
};
type ColDef = {
  base: number;
  amp: number;
  freq: number;
  phase: number;
};
const COLS: ColDef[] = [{
  base: 12,
  amp: 2,
  freq: 0.7,
  phase: 0.0
}, {
  base: 11,
  amp: 2,
  freq: 0.9,
  phase: 0.8
}, {
  base: 13,
  amp: 1,
  freq: 0.6,
  phase: 1.5
}, {
  base: 9,
  amp: 2,
  freq: 1.1,
  phase: 2.3
}, {
  base: 8,
  amp: 2,
  freq: 0.8,
  phase: 0.4
}, {
  base: 8,
  amp: 2,
  freq: 1.0,
  phase: 1.2
}, {
  base: 6,
  amp: 2,
  freq: 0.75,
  phase: 2.0
}, {
  base: 5,
  amp: 2,
  freq: 1.2,
  phase: 0.7
}, {
  base: 4,
  amp: 2,
  freq: 0.9,
  phase: 1.9
}, {
  base: 4,
  amp: 1,
  freq: 0.6,
  phase: 3.0
}, {
  base: 3,
  amp: 1,
  freq: 1.1,
  phase: 0.2
}, {
  base: 3,
  amp: 1,
  freq: 0.8,
  phase: 1.5
}, {
  base: 3,
  amp: 1,
  freq: 0.7,
  phase: 2.8
}, {
  base: 3,
  amp: 1,
  freq: 1.0,
  phase: 0.6
}, {
  base: 4,
  amp: 2,
  freq: 0.9,
  phase: 2.1
}, {
  base: 4,
  amp: 2,
  freq: 0.6,
  phase: 0.9
}, {
  base: 5,
  amp: 2,
  freq: 1.1,
  phase: 1.7
}, {
  base: 6,
  amp: 2,
  freq: 0.8,
  phase: 3.1
}, {
  base: 8,
  amp: 2,
  freq: 0.75,
  phase: 0.5
}, {
  base: 8,
  amp: 2,
  freq: 1.0,
  phase: 1.3
}, {
  base: 9,
  amp: 2,
  freq: 0.9,
  phase: 2.5
}, {
  base: 11,
  amp: 2,
  freq: 0.6,
  phase: 0.1
}, {
  base: 13,
  amp: 1,
  freq: 1.1,
  phase: 1.0
}];
const UNIT = PILL_H + PILL_GAP;
const VIS_HEIGHT = MAX_ROWS * UNIT;
const BUTTON_BOTTOM_PX = UNIT * 6.5;

export default function Page() {
  const [time, setTime] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Idle');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const vapiRef = useRef<VapiType | null>(null);

  const appendMessage = (role: ChatMessage['role'], text: string) => {
    if (!text?.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, text }
    ]);
  };

  useEffect(() => {
    let rafId: number;
    const start = performance.now();
    const tick = () => {
      setTime((performance.now() - start) / 1000);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    return () => {
      if (vapiRef.current?.stop) {
        void vapiRef.current.stop();
      }
    };
  }, []);

  const getColHeight = (col: ColDef): number => {
    const h = col.base + col.amp * Math.sin(col.freq * time + col.phase);
    return Math.max(1, Math.min(MAX_ROWS, Math.round(h)));
  };

  const ensureVapiClient = async () => {
    if (vapiRef.current) return vapiRef.current;

    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY in .env');
    }

    const VapiModule = await import('@vapi-ai/web');
    const Vapi = VapiModule.default;
    const client = new Vapi(publicKey);

    client.on('call-start', () => {
      setIsInCall(true);
      setIsConnecting(false);
      setVoiceStatus('In call');
      appendMessage('system', 'Call started.');
    });

    client.on('call-end', () => {
      setIsInCall(false);
      setIsConnecting(false);
      setVoiceStatus('Call ended');
      appendMessage('system', 'Call ended.');
    });

    client.on('error', (error: { message?: string } | Error) => {
      const message = (error as { message?: string })?.message ?? 'Vapi error';
      setVoiceStatus(message);
    });

    client.on('message', (message: { type?: string; role?: string; transcript?: string; transcriptType?: string }) => {
      if (message?.type === 'transcript' && message?.transcriptType === 'final' && message?.transcript) {
        const role: ChatMessage['role'] = message.role === 'assistant' ? 'assistant' : 'user';
        appendMessage(role, message.transcript);
      }
    });

    vapiRef.current = client;
    return client;
  };

  const handleToggleCall = async () => {
    if (isInCall) {
      try {
        setVoiceStatus('Ending call...');
        await vapiRef.current?.stop();
      } catch (error) {
        setVoiceStatus(error instanceof Error ? error.message : 'Failed to stop call');
      }
      return;
    }

    setIsConnecting(true);
    setVoiceStatus('Requesting microphone...');

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      micStream.getTracks().forEach((track) => track.stop());

      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        throw new Error('Missing NEXT_PUBLIC_VAPI_ASSISTANT_ID in .env');
      }

      setVoiceStatus('Connecting to Vapi...');
      const client = await ensureVapiClient();
      await client.start(assistantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start call';
      if (message.toLowerCase().includes('notallowederror') || message.toLowerCase().includes('permission')) {
        setVoiceStatus('Microphone permission denied. Allow microphone access in browser settings.');
      } else {
        setVoiceStatus(message);
      }
      setIsConnecting(false);
    }
  };

  const previousChatIdRef = useRef<string | null>(null);
  const hasStartedChatRef = useRef(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const callChatApi = async (input: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input,
        previousChatId: previousChatIdRef.current ?? undefined
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Chat request failed');
    }

    if (data?.chatId) previousChatIdRef.current = data.chatId;
    return data?.reply ?? '';
  };

  const handleStartChat = async () => {
    if (hasStartedChatRef.current) return;
    hasStartedChatRef.current = true;

    setIsChatLoading(true);
    try {
      const reply = await callChatApi('Hello');
      if (reply) appendMessage('assistant', reply);
    } catch (error) {
      hasStartedChatRef.current = false;
      appendMessage(
        'system',
        `Failed to start chat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSendChat = async (text: string) => {
    const content = text.trim();
    if (!content) return;

    appendMessage('user', content);

    if (isInCall && vapiRef.current) {
      try {
        await vapiRef.current.send({
          type: 'add-message',
          message: { role: 'user', content }
        });
      } catch (error) {
        appendMessage(
          'system',
          `Failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      return;
    }

    setIsChatLoading(true);
    try {
      const reply = await callChatApi(content);
      appendMessage('assistant', reply || '…');
    } catch (error) {
      appendMessage(
        'system',
        `Failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  return <div className="landing-page relative w-full flex flex-col items-center overflow-hidden">
      {/* Subtle background grain */}
      <div className="landing-grain absolute inset-0 pointer-events-none z-0" />

      {/* VAPI Logo */}
      <div className="relative z-10 w-full flex justify-center pt-9">
        <span className="landing-logo">
          AXIS ORIGIN
        </span>
      </div>

      {/* Equalizer + Button */}
      <div className="relative flex-1 flex items-center justify-center w-full z-10">
        {/* Bar columns wrapper */}
        <div className="relative flex items-end" style={{ gap: `${COL_GAP}px`, height: `${VIS_HEIGHT}px` }}>
          {COLS.map((colDef, colIdx) => {
            const height = getColHeight(colDef);
            return <div key={colIdx} className="flex flex-col-reverse" style={{
              gap: `${PILL_GAP}px`,
              height: `${VIS_HEIGHT}px`,
              justifyContent: 'flex-start'
            }}>
                {Array.from({
                  length: MAX_ROWS
                }, (_, rowIdx) => {
                  const visible = rowIdx < height;
                  const color = visible ? getPillColor(colIdx, rowIdx) : 'transparent';
                  return <div key={rowIdx} style={{
                    width: `${PILL_W}px`,
                    height: `${PILL_H}px`,
                    borderRadius: `${PILL_H / 2}px`,
                    backgroundColor: color,
                    flexShrink: 0,
                    transition: 'background-color 0.12s ease'
                  }} />;
                })}
              </div>;
          })}

          {/* TALK TO VAPI Button - floating centered overlay */}
          <div className="absolute left-1/2 z-20" style={{
          transform: 'translateX(-50%)',
          bottom: `${BUTTON_BOTTOM_PX}px`
        }}>
            <button className="talk-button" type="button" onClick={handleToggleCall} disabled={isConnecting}>
              <span className="talk-button-text">
                {isInCall ? 'END CALL' : isConnecting ? 'CONNECTING...' : 'TALK TO AXIS'}
              </span>
              {/* Dot-grid / waveform icon */}
              <div className="talk-button-grid">
                {[1, 0, 1, 1, 1, 0, 1, 0, 1].map((on, i) => <div key={i} className={`talk-button-dot ${on ? 'is-on' : ''}`} />)}
              </div>
            </button>
          </div>
        </div>
      </div>
      <p className="status-line z-10 pb-8">Status: {voiceStatus}</p>

      <ChatWidget
        messages={messages}
        isInCall={isInCall}
        isLoading={isChatLoading}
        onOpen={handleStartChat}
        onSend={handleSendChat}
      />
    </div>;
}

type ChatWidgetProps = {
  messages: ChatMessage[];
  isInCall: boolean;
  isLoading?: boolean;
  onOpen?: () => void;
  onSend: (text: string) => void;
};

const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  isInCall,
  isLoading = false,
  onOpen,
  onSend
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) onOpen?.();
  };

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    onSend(text);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              width: 'clamp(300px, 90vw, 360px)',
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                padding: '16px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #61f5b4 0%, #4dcafa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#fffae9',
                    letterSpacing: '0.02em'
                  }}
                >
                  IVme Assistant
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: isInCall ? '#61f5b4' : 'rgba(255,255,255,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isInCall ? '#61f5b4' : 'rgba(255,255,255,0.35)',
                      display: 'inline-block'
                    }}
                  />
                  <span>{isInCall ? 'In call' : 'Idle'}</span>
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 14px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '280px',
                scrollbarWidth: 'none'
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '9px 13px',
                      borderRadius:
                        msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background:
                        msg.role === 'user'
                          ? 'linear-gradient(135deg, #61f5b4 0%, #4dcafa 100%)'
                          : msg.role === 'system'
                          ? 'rgba(252, 211, 77, 0.12)'
                          : 'rgba(255,255,255,0.07)',
                      color:
                        msg.role === 'user'
                          ? '#080808'
                          : msg.role === 'system'
                          ? '#fcd34d'
                          : '#e8e4d8',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      fontWeight: msg.role === 'user' ? 500 : 400,
                      fontStyle: msg.role === 'system' ? 'italic' : 'normal'
                    }}
                  >
                    <p style={{ margin: 0 }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: '9px 13px',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'rgba(255,255,255,0.07)',
                      color: '#e8e4d8',
                      fontSize: '13px'
                    }}
                  >
                    <span className="typing-dots">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                aria-label="Chat message input"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '9px 13px',
                  fontSize: '13px',
                  color: '#fffae9',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleSend}
                aria-label="Send message"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: inputValue.trim()
                    ? 'linear-gradient(135deg, #61f5b4 0%, #4dcafa 100%)'
                    : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  cursor: inputValue.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                  flexShrink: 0
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={inputValue.trim() ? '#080808' : 'rgba(255,255,255,0.3)'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleToggle}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="relative flex cursor-pointer select-none items-center justify-center gap-3 rounded-full border font-mono font-medium uppercase focus:outline-none"
        style={{
          width: 'clamp(10rem, 28vw, 14rem)',
          height: 'clamp(3rem, 6vw, 4.5rem)',
          letterSpacing: '0.07rem',
          fontSize: 'clamp(0.6rem, 1.2vw, 0.9rem)',
          lineHeight: '100%',
          background: '#080808',
          borderColor: 'rgba(255,250,233,0.2)',
          color: '#fffae9',
          flexShrink: 0
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: '-8px',
            border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: '9999px'
          }}
        />

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Close chat</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fffae9"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="open-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Chat with us</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fffae9"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
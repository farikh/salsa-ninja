'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { Send, Loader2, ArrowLeft, MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'
import type { BookingMessage } from '@/types/booking'

interface Conversation {
  booking_id: string
  instructor_id: string
  member_id: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  message_count: number
  latest_message: string | null
  latest_message_at: string | null
  latest_sender_name: string | null
  has_unread: boolean
}

interface Participant {
  display_name: string
  full_name: string
  avatar_url: string | null
}

interface ConversationsListProps {
  initialConversations: Conversation[]
  participants: Record<string, Participant>
  currentMemberId: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--primary-light)',
  confirmed: '#22c55e',
  completed: 'var(--muted-foreground)',
  declined: 'var(--primary)',
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ConversationsList({
  initialConversations,
  participants,
  currentMemberId,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<BookingMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedConvo = conversations.find(c => c.booking_id === selectedId)

  const getOtherName = useCallback((convo: Conversation) => {
    const otherId = convo.member_id === currentMemberId
      ? convo.instructor_id
      : convo.member_id
    const p = participants[otherId]
    return p?.display_name || p?.full_name || 'Unknown'
  }, [currentMemberId, participants])

  const getOtherAvatar = useCallback((convo: Conversation) => {
    const otherId = convo.member_id === currentMemberId
      ? convo.instructor_id
      : convo.member_id
    return participants[otherId]?.avatar_url ?? null
  }, [currentMemberId, participants])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false

    async function load() {
      setLoadingMessages(true)
      try {
        const res = await fetch(`/api/bookings/${selectedId}/messages`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setMessages(data.messages ?? [])
        }
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }
    }
    load()

    return () => { cancelled = true }
  }, [selectedId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const selectConvo = (convo: Conversation) => {
    setSelectedId(convo.booking_id)
    setMobileShowThread(true)
    // Mark as read locally
    setConversations(prev =>
      prev.map(c =>
        c.booking_id === convo.booking_id ? { ...c, has_unread: false } : c
      )
    )
  }

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !selectedId) return
    setSending(true)
    try {
      const res = await fetch(`/api/bookings/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.data])
        setMessageText('')
        // Update conversation preview
        setConversations(prev =>
          prev.map(c =>
            c.booking_id === selectedId
              ? {
                  ...c,
                  latest_message: messageText.trim(),
                  latest_message_at: new Date().toISOString(),
                  latest_sender_name: 'You',
                  message_count: c.message_count + 1,
                }
              : c
          )
        )
      }
    } finally {
      setSending(false)
    }
  }, [messageText, selectedId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  if (conversations.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        background: 'var(--card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--primary-light) 15%, transparent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <MessageSquare size={24} color="var(--primary)" />
        </div>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
          No conversations yet. Book a private lesson to start messaging.
        </p>
        <Link
          href="/private-sessions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Book a Private Lesson
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--card)',
      height: 'calc(100vh - 220px)',
      minHeight: '500px',
    }}>
      {/* Conversation List Panel */}
      <div style={{
        width: '340px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        ...(mobileShowThread ? { display: 'none' } : {}),
      }}
        className="conversations-list-panel"
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Messages</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {conversations.some(c => c.has_unread) && (
              <span style={{
                fontSize: '0.7rem',
                background: 'var(--primary)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 700,
              }}>
                {conversations.filter(c => c.has_unread).length} new
              </span>
            )}
            <Link
              href="/private-sessions"
              title="New conversation"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--foreground)',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              <Plus size={16} />
            </Link>
          </div>
        </div>

        {/* Conversation Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(convo => {
            const isSelected = convo.booking_id === selectedId
            const otherName = getOtherName(convo)
            const avatarUrl = getOtherAvatar(convo)

            return (
              <button
                key={convo.booking_id}
                onClick={() => selectConvo(convo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  width: '100%',
                  border: 'none',
                  background: isSelected ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {avatarUrl && isSafeUrl(avatarUrl) ? (
                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(otherName)
                  )}
                  {convo.has_unread && (
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      border: '2px solid var(--card)',
                    }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontWeight: convo.has_unread ? 700 : 500,
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {otherName}
                    </span>
                    {convo.latest_message_at && (
                      <span style={{
                        fontSize: '0.7rem',
                        color: convo.has_unread ? 'var(--primary)' : 'var(--muted-foreground)',
                        flexShrink: 0,
                        fontWeight: convo.has_unread ? 600 : 400,
                      }}>
                        {formatDistanceToNow(parseISO(convo.latest_message_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--muted-foreground)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: convo.has_unread ? 500 : 400,
                    }}>
                      {convo.latest_message
                        ? `${convo.latest_sender_name === 'You' || convo.latest_sender_name === participants[currentMemberId]?.display_name ? 'You' : convo.latest_sender_name}: ${convo.latest_message}`
                        : format(parseISO(convo.start_time), 'EEE, MMM d · h:mm a')
                      }
                    </p>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      border: `1px solid ${STATUS_COLORS[convo.status] ?? 'var(--border)'}`,
                      color: STATUS_COLORS[convo.status] ?? 'var(--muted-foreground)',
                      flexShrink: 0,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}>
                      {convo.status}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Message Thread Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...((!mobileShowThread && !selectedId) ? {} : {}),
      }}
        className="message-thread-panel"
      >
        {selectedConvo ? (
          <>
            {/* Thread Header */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              {/* Mobile back button */}
              <button
                onClick={() => { setMobileShowThread(false); setSelectedId(null) }}
                className="mobile-back-btn"
                style={{
                  display: 'none',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'inherit',
                }}
              >
                <ArrowLeft size={20} />
              </button>

              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                overflow: 'hidden',
              }}>
                {getOtherAvatar(selectedConvo) && isSafeUrl(getOtherAvatar(selectedConvo)!) ? (
                  <img src={getOtherAvatar(selectedConvo)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(getOtherName(selectedConvo))
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                  {getOtherName(selectedConvo)}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  {format(parseISO(selectedConvo.start_time), 'EEE, MMM d · h:mm a')} — {selectedConvo.status}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {loadingMessages ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      height: '40px',
                      borderRadius: '12px',
                      background: 'var(--muted)',
                      width: i % 2 === 0 ? '60%' : '75%',
                      marginLeft: i % 2 === 0 ? 'auto' : 0,
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  color: 'var(--muted-foreground)',
                }}>
                  <MessageSquare size={32} strokeWidth={1.5} />
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>No messages yet</p>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Send a message to start the conversation</p>
                </div>
              ) : (
                <>
                  {/* Booking context */}
                  <div style={{
                    textAlign: 'center',
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--muted-foreground)',
                      background: 'var(--muted)',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                    }}>
                      Private lesson · {format(parseISO(selectedConvo.start_time), 'MMMM d, yyyy')}
                    </span>
                  </div>

                  {messages.map(msg => {
                    const isOwn = msg.sender_id === currentMemberId
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{
                          maxWidth: '75%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          background: isOwn
                            ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                            : 'var(--muted)',
                          color: isOwn ? '#fff' : 'inherit',
                        }}>
                          <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                            {msg.content}
                          </p>
                          <p style={{
                            fontSize: '0.65rem',
                            margin: '0.25rem 0 0',
                            opacity: 0.7,
                            textAlign: 'right',
                          }}>
                            {format(parseISO(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            {/* Message Input */}
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-end',
            }}>
              <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={sending}
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.85rem',
                  background: 'var(--background)',
                  color: 'inherit',
                  outline: 'none',
                  minHeight: '40px',
                  maxHeight: '96px',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 96) + 'px'
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !messageText.trim()}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: 'none',
                  background: messageText.trim() ? 'var(--primary)' : 'var(--muted)',
                  color: messageText.trim() ? '#fff' : 'var(--muted-foreground)',
                  cursor: messageText.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            color: 'var(--muted-foreground)',
            padding: '2rem',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), color-mix(in srgb, var(--primary-light) 10%, transparent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MessageSquare size={28} strokeWidth={1.5} color="var(--primary)" />
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>
              Select a conversation
            </p>
            <p style={{ fontSize: '0.85rem', margin: 0, textAlign: 'center', maxWidth: '280px' }}>
              Choose a conversation from the list to view messages and reply
            </p>
          </div>
        )}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .conversations-list-panel {
            width: 100% !important;
            border-right: none !important;
            ${mobileShowThread ? 'display: none !important;' : 'display: flex !important;'}
          }
          .message-thread-panel {
            ${!mobileShowThread ? 'display: none !important;' : 'display: flex !important;'}
          }
          .mobile-back-btn {
            display: flex !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

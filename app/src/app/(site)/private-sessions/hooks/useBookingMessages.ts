'use client'

import { useState, useCallback } from 'react'
import type { BookingMessage } from '@/types/booking'

export function useBookingMessages(bookingId: string | null) {
  const [messages, setMessages] = useState<BookingMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!bookingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!bookingId || !content.trim()) return false
      setSending(true)
      try {
        const res = await fetch(`/api/bookings/${bookingId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        })
        if (res.ok) {
          const data = await res.json()
          setMessages((prev) => [...prev, data.data])
          return true
        }
        return false
      } finally {
        setSending(false)
      }
    },
    [bookingId]
  )

  const addMessage = useCallback((message: BookingMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev
      return [...prev, message]
    })
  }, [])

  return { messages, loading, sending, fetchMessages, sendMessage, addMessage }
}

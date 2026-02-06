'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { addDays, format, isSameDay, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import type {
  InstructorAvailability,
  PrivateLessonBooking,
  AvailabilityOverride,
} from '@/types/booking'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeeklyGridViewProps {
  weekStart: Date // Sunday of the current week
  availability: InstructorAvailability[]
  bookings: PrivateLessonBooking[]
  overrides: AvailabilityOverride[]
  onAddAvailability: (day: number, startTime: string, endTime: string) => void
  onDeleteAvailability: (id: string) => void
}

/** A positioned block ready to render on the grid. */
interface PositionedBlock {
  id: string
  dayIndex: number // 0-6
  startRow: number
  rowSpan: number
  label: string
  kind: 'availability' | 'booking-pending' | 'booking-confirmed' | 'override-unavailable' | 'override-available'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const START_HOUR = 10
const END_HOUR = 22
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2 // 32 half-hour slots
const ROW_HEIGHT_HOUR = 40 // px – hour rows
const ROW_HEIGHT_HALF = 32 // px – half-hour rows
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert "HH:MM" (or "HH:MM:SS") to a row index (06:00 = 0, 06:30 = 1). */
function timeToRow(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h - START_HOUR) * 2 + (m >= 30 ? 1 : 0)
}

/** Number of rows spanned between two times. */
function getBlockHeight(startTime: string, endTime: string): number {
  return timeToRow(endTime) - timeToRow(startTime)
}

/** Row index -> "HH:MM" string. */
function rowToTime(row: number): string {
  const totalMinutes = (START_HOUR * 60) + (row * 30)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/** Format "HH:MM" or "HH:MM:SS" to "2:00 PM" style. */
function formatTimeShort(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

/** Format a range like "2:00 - 6:00 PM". Omits first AM/PM if same period. */
function formatTimeRange(start: string, end: string): string {
  const [sh] = start.split(':').map(Number)
  const [eh] = end.split(':').map(Number)
  const startPeriod = sh >= 12 ? 'PM' : 'AM'
  const endPeriod = eh >= 12 ? 'PM' : 'AM'
  const s12 = sh % 12 || 12
  const e12 = eh % 12 || 12
  const sm = start.split(':')[1]
  const em = end.split(':')[1]

  if (startPeriod === endPeriod) {
    return `${s12}:${sm} - ${e12}:${em} ${endPeriod}`
  }
  return `${s12}:${sm} ${startPeriod} - ${e12}:${em} ${endPeriod}`
}

/** Time label for the left gutter. Full label on the hour, just ":30" on half. */
function formatGutterLabel(row: number): string {
  const totalMinutes = (START_HOUR * 60) + (row * 30)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (m === 0) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12} ${ampm}`
  }
  return ':30'
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/** Cumulative Y offset for a given row, accounting for hour/half-hour heights. */
function rowY(row: number): number {
  let y = 0
  for (let r = 0; r < row; r++) {
    y += r % 2 === 0 ? ROW_HEIGHT_HOUR : ROW_HEIGHT_HALF
  }
  return y
}

/** Total height of a span of rows starting at `startRow`. */
function spanHeight(startRow: number, count: number): number {
  let h = 0
  for (let r = startRow; r < startRow + count; r++) {
    h += r % 2 === 0 ? ROW_HEIGHT_HOUR : ROW_HEIGHT_HALF
  }
  return h
}

/** Total height of the grid body. */
const GRID_BODY_HEIGHT = rowY(TOTAL_SLOTS)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeeklyGridView({
  weekStart,
  availability,
  bookings,
  overrides,
  onAddAvailability,
  onDeleteAvailability,
}: WeeklyGridViewProps) {
  const [selectedDay, setSelectedDay] = useState(0) // mobile single-day index
  const [deletePopover, setDeletePopover] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Drag-to-select state
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    dayIndex: number
    startRow: number
    currentRow: number
  } | null>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!deletePopover) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setDeletePopover(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [deletePopover])

  // Build week dates (Sun-Sat)
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  // -------------------------------------------------------------------------
  // Compute positioned blocks
  // -------------------------------------------------------------------------

  const positionedBlocks = useMemo(() => {
    const blocks: PositionedBlock[] = []

    // --- Availability blocks (recurring weekly) ---
    for (const avail of availability) {
      if (!avail.is_active) continue
      const startRow = timeToRow(avail.start_time)
      const span = getBlockHeight(avail.start_time, avail.end_time)
      if (span <= 0) continue
      blocks.push({
        id: `avail-${avail.id}`,
        dayIndex: avail.day_of_week,
        startRow,
        rowSpan: span,
        label: formatTimeRange(avail.start_time, avail.end_time),
        kind: 'availability',
      })
    }

    // --- Booking overlays ---
    for (const booking of bookings) {
      if (
        booking.status === 'declined' ||
        booking.status === 'expired' ||
        booking.status === 'cancelled_by_member' ||
        booking.status === 'cancelled_by_instructor' ||
        booking.status === 'no_show'
      ) {
        continue
      }

      const startDt = parseISO(booking.start_time)
      const endDt = parseISO(booking.end_time)

      // Determine which day column this booking falls in
      const dayIdx = weekDates.findIndex((d) => isSameDay(d, startDt))
      if (dayIdx === -1) continue

      const startTimeStr = format(startDt, 'HH:mm')
      const endTimeStr = format(endDt, 'HH:mm')
      const startRow = timeToRow(startTimeStr)
      const span = getBlockHeight(startTimeStr, endTimeStr)
      if (span <= 0) continue

      const kind =
        booking.status === 'pending' ? 'booking-pending' : 'booking-confirmed'

      blocks.push({
        id: `booking-${booking.id}`,
        dayIndex: dayIdx,
        startRow,
        rowSpan: span,
        label: `${formatTimeShort(startTimeStr)} ${booking.status}`,
        kind,
      })
    }

    // --- Override indicators ---
    for (const ov of overrides) {
      const ovDate = parseISO(ov.override_date)
      const dayIdx = weekDates.findIndex((d) => isSameDay(d, ovDate))
      if (dayIdx === -1) continue

      if (!ov.is_available) {
        // Unavailable override -- full day or specific time
        if (ov.start_time && ov.end_time) {
          const startRow = timeToRow(ov.start_time)
          const span = getBlockHeight(ov.start_time, ov.end_time)
          if (span > 0) {
            blocks.push({
              id: `override-${ov.id}`,
              dayIndex: dayIdx,
              startRow,
              rowSpan: span,
              label: ov.reason || 'Unavailable',
              kind: 'override-unavailable',
            })
          }
        } else {
          // Full day unavailable
          blocks.push({
            id: `override-${ov.id}`,
            dayIndex: dayIdx,
            startRow: 0,
            rowSpan: TOTAL_SLOTS,
            label: ov.reason || 'Unavailable (all day)',
            kind: 'override-unavailable',
          })
        }
      } else {
        // Extra availability on a specific date
        if (ov.start_time && ov.end_time) {
          const startRow = timeToRow(ov.start_time)
          const span = getBlockHeight(ov.start_time, ov.end_time)
          if (span > 0) {
            blocks.push({
              id: `override-${ov.id}`,
              dayIndex: dayIdx,
              startRow,
              rowSpan: span,
              label: formatTimeRange(ov.start_time, ov.end_time),
              kind: 'override-available',
            })
          }
        }
      }
    }

    return blocks
  }, [availability, bookings, overrides, weekDates])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleDragStart = useCallback(
    (dayIndex: number, row: number) => {
      setDragState({ isDragging: true, dayIndex, startRow: row, currentRow: row })
    },
    [],
  )

  const handleDragMove = useCallback(
    (row: number) => {
      setDragState((prev) => {
        if (!prev || !prev.isDragging) return prev
        if (prev.currentRow === row) return prev
        return { ...prev, currentRow: row }
      })
    },
    [],
  )

  const handleDragEnd = useCallback(() => {
    if (!dragState || !dragState.isDragging) {
      setDragState(null)
      return
    }

    const minRow = Math.min(dragState.startRow, dragState.currentRow)
    // Add 1 to include the end row in the selection
    const maxRow = Math.max(dragState.startRow, dragState.currentRow) + 1
    const startTime = rowToTime(minRow)
    const endTime = rowToTime(maxRow)

    setDragState(null)
    onAddAvailability(dragState.dayIndex, startTime, endTime)
  }, [dragState, onAddAvailability])

  // Global mouseup to handle drag ending outside the grid
  useEffect(() => {
    if (!dragState?.isDragging) return
    const handleGlobalMouseUp = () => handleDragEnd()
    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [dragState?.isDragging, handleDragEnd])

  const handleBlockClick = useCallback(
    (block: PositionedBlock, e: React.MouseEvent) => {
      e.stopPropagation()
      if (block.kind === 'availability') {
        // Extract real availability id
        const realId = block.id.replace('avail-', '')
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setDeletePopover({
          id: realId,
          x: rect.left + rect.width / 2,
          y: rect.top,
        })
      }
    },
    [],
  )

  const handleDelete = useCallback(() => {
    if (deletePopover) {
      onDeleteAvailability(deletePopover.id)
      setDeletePopover(null)
    }
  }, [deletePopover, onDeleteAvailability])

  // -------------------------------------------------------------------------
  // Rendering helpers
  // -------------------------------------------------------------------------

  /** Render a positioned block on top of the grid. */
  function renderBlock(block: PositionedBlock) {
    const top = rowY(block.startRow)
    const height = spanHeight(block.startRow, block.rowSpan)

    let bgClass = ''
    let borderClass = ''
    let extraStyle: React.CSSProperties = {}

    switch (block.kind) {
      case 'availability':
        bgClass = 'bg-emerald-500/20'
        borderClass = 'border-l-2 border-emerald-500'
        break
      case 'booking-pending':
        bgClass = 'bg-amber-500/20'
        borderClass = 'border-l-2 border-amber-500'
        break
      case 'booking-confirmed':
        bgClass = 'bg-blue-500/20'
        borderClass = 'border-l-2 border-blue-500'
        break
      case 'override-unavailable':
        bgClass = 'bg-red-500/10'
        borderClass = 'border-l-2 border-red-400'
        extraStyle = {
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.08) 4px, rgba(239,68,68,0.08) 8px)',
        }
        break
      case 'override-available':
        bgClass = 'bg-emerald-400/15'
        borderClass = 'border-l-2 border-emerald-400 border-dashed'
        break
    }

    const isClickable =
      block.kind === 'availability' ||
      block.kind === 'override-available'

    return (
      <div
        key={block.id}
        className={`absolute left-0 right-0 mx-0.5 rounded-sm ${bgClass} ${borderClass} ${
          isClickable ? 'cursor-pointer hover:brightness-110' : ''
        }`}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          zIndex: block.kind.startsWith('booking') ? 20 : 10,
          ...extraStyle,
        }}
        onClick={(e) => handleBlockClick(block, e)}
      >
        <div
          className="px-1 py-0.5 text-[10px] leading-tight truncate"
          style={{ color: 'var(--foreground)', opacity: 0.85 }}
        >
          {block.label}
        </div>
      </div>
    )
  }

  /** Compute drag preview dimensions for a given day column. */
  function getDragPreview(dayIndex: number) {
    if (!dragState?.isDragging || dragState.dayIndex !== dayIndex) return null
    const minRow = Math.min(dragState.startRow, dragState.currentRow)
    const maxRow = Math.max(dragState.startRow, dragState.currentRow)
    const top = rowY(minRow)
    const height = spanHeight(minRow, maxRow - minRow + 1)
    return { top, height }
  }

  /** Render a single day column body (the time cells + overlaid blocks). */
  function renderDayColumn(dayIndex: number) {
    const dayBlocks = positionedBlocks.filter((b) => b.dayIndex === dayIndex)
    const dayDate = weekDates[dayIndex]
    const today = isToday(dayDate)
    const preview = getDragPreview(dayIndex)

    return (
      <div
        className="relative"
        style={{
          height: `${GRID_BODY_HEIGHT}px`,
          background: today ? 'var(--primary-5, rgba(239,68,68,0.05))' : undefined,
          userSelect: dragState?.isDragging ? 'none' : undefined,
        }}
      >
        {/* Grid row lines + draggable cells */}
        {Array.from({ length: TOTAL_SLOTS }, (_, row) => {
          const top = rowY(row)
          const height = row % 2 === 0 ? ROW_HEIGHT_HOUR : ROW_HEIGHT_HALF

          // Determine if this cell is occupied by any block
          const isOccupied = dayBlocks.some(
            (b) => row >= b.startRow && row < b.startRow + b.rowSpan,
          )

          return (
            <div
              key={row}
              className={`absolute left-0 right-0 border-b ${
                row % 2 === 0 ? 'border-border/30' : 'border-border/15'
              } ${!isOccupied ? 'hover:bg-muted/20 cursor-crosshair' : ''}`}
              style={{
                top: `${top}px`,
                height: `${height}px`,
              }}
              onMouseDown={(e) => {
                if (!isOccupied) {
                  e.preventDefault()
                  handleDragStart(dayIndex, row)
                }
              }}
              onMouseMove={() => {
                if (dragState?.isDragging) handleDragMove(row)
              }}
            />
          )
        })}

        {/* Drag preview overlay */}
        {preview && (
          <div
            className="absolute left-0 right-0 mx-0.5 rounded-sm bg-emerald-500/30 border-l-2 border-emerald-400 pointer-events-none"
            style={{
              top: `${preview.top}px`,
              height: `${preview.height}px`,
              zIndex: 30,
            }}
          >
            <div
              className="px-1 py-0.5 text-[10px] leading-tight"
              style={{ color: 'var(--foreground)', opacity: 0.85 }}
            >
              {formatTimeRange(
                rowToTime(Math.min(dragState!.startRow, dragState!.currentRow)),
                rowToTime(Math.max(dragState!.startRow, dragState!.currentRow) + 1),
              )}
            </div>
          </div>
        )}

        {/* Positioned blocks */}
        {dayBlocks.map(renderBlock)}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Desktop layout (md+)
  // -------------------------------------------------------------------------

  function renderDesktop() {
    return (
      <div className="hidden md:block overflow-x-auto">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px repeat(7, 1fr)',
            minWidth: '700px',
          }}
        >
          {/* Header row */}
          <div
            className="border-b border-border/50"
            style={{ padding: '8px 4px', textAlign: 'center' }}
          >
            {/* empty corner */}
          </div>
          {weekDates.map((date, i) => {
            const today = isToday(date)
            return (
              <div
                key={i}
                className={`border-b border-l border-border/50 text-center py-2 px-1 ${
                  today ? 'bg-primary/5' : ''
                }`}
              >
                <div
                  className="text-xs font-medium"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {DAY_NAMES_SHORT[i]}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    today ? 'text-primary' : ''
                  }`}
                >
                  {format(date, 'd')}
                </div>
              </div>
            )
          })}

          {/* Time gutter + day columns */}
          <div
            className="relative"
            style={{ height: `${GRID_BODY_HEIGHT}px` }}
          >
            {Array.from({ length: TOTAL_SLOTS }, (_, row) => {
              const top = rowY(row)
              const height = row % 2 === 0 ? ROW_HEIGHT_HOUR : ROW_HEIGHT_HALF
              const label = formatGutterLabel(row)
              const isHour = row % 2 === 0

              return (
                <div
                  key={row}
                  className="absolute left-0 right-0 flex items-start justify-end pr-2 border-b border-border/15"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                >
                  <span
                    className={`leading-none ${
                      isHour
                        ? 'text-[11px] font-medium'
                        : 'text-[10px] text-muted-foreground/60'
                    }`}
                    style={{
                      transform: 'translateY(-1px)',
                      color: isHour
                        ? 'var(--muted-foreground)'
                        : undefined,
                    }}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          {weekDates.map((_, i) => (
            <div key={i} className="border-l border-border/30">
              {renderDayColumn(i)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Mobile layout (<md)
  // -------------------------------------------------------------------------

  function renderMobile() {
    const dayDate = weekDates[selectedDay]

    return (
      <div className="md:hidden">
        {/* Day selector tabs */}
        <div
          className="flex border-b border-border/50 mb-2 overflow-x-auto"
          style={{ gap: 0 }}
        >
          {weekDates.map((date, i) => {
            const active = selectedDay === i
            const today = isToday(date)

            return (
              <button
                key={i}
                className={`flex-1 min-w-[44px] py-2 px-1 text-center transition-colors ${
                  active
                    ? 'border-b-2 border-primary'
                    : 'border-b-2 border-transparent'
                } ${today && !active ? 'bg-primary/5' : ''}`}
                style={{
                  background: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedDay(i)}
              >
                <div
                  className="text-[10px] font-medium"
                  style={{
                    color: active
                      ? 'var(--foreground)'
                      : 'var(--muted-foreground)',
                  }}
                >
                  {DAY_NAMES_SHORT[i]}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    today ? 'text-primary' : ''
                  } ${active ? 'opacity-100' : 'opacity-60'}`}
                >
                  {format(date, 'd')}
                </div>
              </button>
            )
          })}
        </div>

        {/* Day label */}
        <div className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
          {DAY_NAMES_FULL[selectedDay]}, {format(dayDate, 'MMM d')}
        </div>

        {/* Single day grid with time gutter */}
        <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr',
            }}
          >
            {/* Time gutter */}
            <div
              className="relative"
              style={{ height: `${GRID_BODY_HEIGHT}px` }}
            >
              {Array.from({ length: TOTAL_SLOTS }, (_, row) => {
                const top = rowY(row)
                const height =
                  row % 2 === 0 ? ROW_HEIGHT_HOUR : ROW_HEIGHT_HALF
                const label = formatGutterLabel(row)
                const isHour = row % 2 === 0

                return (
                  <div
                    key={row}
                    className="absolute left-0 right-0 flex items-start justify-end pr-1.5 border-b border-border/15"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                    }}
                  >
                    <span
                      className={`leading-none ${
                        isHour
                          ? 'text-[10px] font-medium'
                          : 'text-[9px] text-muted-foreground/60'
                      }`}
                      style={{
                        transform: 'translateY(-1px)',
                        color: isHour
                          ? 'var(--muted-foreground)'
                          : undefined,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Day column */}
            <div className="border-l border-border/30">
              {renderDayColumn(selectedDay)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="relative">
      {renderDesktop()}
      {renderMobile()}

      {/* Delete popover (portal-style fixed position) */}
      {deletePopover && (
        <div
          ref={popoverRef}
          className="fixed z-50 rounded-lg border border-border bg-popover shadow-lg"
          style={{
            left: `${deletePopover.x}px`,
            top: `${deletePopover.y - 8}px`,
            transform: 'translate(-50%, -100%)',
            padding: '8px 12px',
          }}
        >
          <p
            className="text-xs mb-2"
            style={{ color: 'var(--muted-foreground)', margin: '0 0 8px 0' }}
          >
            Remove this availability?
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              size="xs"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setDeletePopover(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

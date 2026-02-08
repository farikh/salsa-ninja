'use client'

import { useState } from 'react'
import type { PrivateLessonBooking } from '@/types/booking'
import type { Instructor } from '@/types/booking'
import { DashboardMessages } from './DashboardMessages'
import { DashboardBookings } from './DashboardBookings'
import UpcomingEventsWidget from './upcoming-events-widget'

type Role = {
  id: string
  name: string
  display_name: string
}

type TabId = 'home' | 'members' | 'private-lessons'

// Lazy-loaded tab content
import MembersManager from './admin/members/MembersManager'
import { PrivateLessonsTab } from './PrivateLessonsTab'

interface DashboardTabsProps {
  member: {
    id: string
    email: string
    full_name: string
    display_name: string | null
    dance_experience: string | null
    created_at: string
    enrollment_plan: string | null
    bootcamp_enrolled: boolean
  }
  bookings: PrivateLessonBooking[]
  events: { id: string; title: string; description: string | null; start_time: string; end_time: string }[]
  isAdmin: boolean
  isInstructor: boolean
  isStaff: boolean
  availableRoles: Role[]
  instructors: Instructor[]
}

export function DashboardTabs({
  member,
  bookings,
  events,
  isAdmin,
  isInstructor,
  isStaff,
  availableRoles,
  instructors,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('home')

  const tabs: { id: TabId; label: string; visible: boolean }[] = [
    { id: 'home', label: 'Home', visible: true },
    { id: 'members', label: 'Manage Members', visible: isAdmin },
    { id: 'private-lessons', label: 'Private Lessons', visible: isInstructor },
  ]

  return (
    <>
      {/* Tab Navigation */}
      {isStaff && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {tabs.filter(t => t.visible).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.15)',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #ef4444, #f59e0b)'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'home' && (
        <HomeTab
          member={member}
          bookings={bookings}
          events={events}
          isInstructor={isInstructor}
          isStaff={isStaff}
        />
      )}

      {activeTab === 'members' && isAdmin && (
        <div>
          <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>Member Management</h2>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Manage member roles and permissions
          </p>
          <MembersManager availableRoles={availableRoles} />
        </div>
      )}

      {activeTab === 'private-lessons' && isInstructor && (
        <PrivateLessonsTab instructors={instructors} memberId={member.id} />
      )}
    </>
  )
}

function HomeTab({
  member,
  bookings,
  events,
  isInstructor,
  isStaff,
}: {
  member: DashboardTabsProps['member']
  bookings: PrivateLessonBooking[]
  events: DashboardTabsProps['events']
  isInstructor: boolean
  isStaff: boolean
}) {
  return (
    <>
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Messages */}
        <DashboardMessages
          initialBookings={bookings}
          memberId={member.id}
        />

        {/* Upcoming Bookings */}
        <DashboardBookings
          initialBookings={bookings}
          memberId={member.id}
          isInstructor={isInstructor}
        />

        {/* My Enrollment */}
        <EnrollmentCard
          currentPlan={member.enrollment_plan}
          bootcampEnrolled={member.bootcamp_enrolled}
        />

        {/* Video Library */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <h3 style={{ fontWeight: 600 }}>Video Library</h3>
          </div>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
            Access class recordings and archived videos. Coming soon!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              Recent class videos
              <span style={{
                fontSize: '0.7rem',
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 600,
              }}>Soon</span>
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              Video archive
              <span style={{
                fontSize: '0.7rem',
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 600,
              }}>Soon</span>
            </span>
          </div>
        </div>
      </div>

      {/* Events & Announcements Row */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <UpcomingEventsWidget initialEvents={events} isStaff={isStaff} />

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Announcements</h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            No announcements at this time.
          </p>
        </div>
      </div>

      {/* Your Profile */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Your Profile</h3>
        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
          <div><span style={{ color: 'var(--muted-foreground)' }}>Email:</span> {member.email}</div>
          <div><span style={{ color: 'var(--muted-foreground)' }}>Name:</span> {member.full_name}</div>
          {member.dance_experience && (
            <div><span style={{ color: 'var(--muted-foreground)' }}>Experience:</span> {member.dance_experience}</div>
          )}
          <div><span style={{ color: 'var(--muted-foreground)' }}>Member since:</span> {new Date(member.created_at).toLocaleDateString()}</div>
        </div>
      </div>

    </>
  )
}

// ── Enrollment Card (app-u39) ──

const PLANS = [
  { id: 'classes_5', label: '5 Classes', price: 100, description: '5 classes per month' },
  { id: 'classes_8', label: '8 Classes', price: 139, description: '8 classes per month' },
  { id: 'unlimited', label: 'Unlimited', price: 179, description: 'Unlimited classes' },
] as const

function EnrollmentCard({
  currentPlan,
  bootcampEnrolled,
}: {
  currentPlan: string | null
  bootcampEnrolled: boolean
}) {
  const [plan, setPlan] = useState<string>(currentPlan || 'classes_5')
  const [saving, setSaving] = useState(false)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [bootcamp, setBootcamp] = useState(bootcampEnrolled)

  const activePlan = PLANS.find(p => p.id === plan) || PLANS[0]

  const handlePlanChange = async (newPlan: string) => {
    const prevPlan = plan
    setPlan(newPlan)
    setShowPlanPicker(false)
    setSaving(true)
    try {
      const res = await fetch('/api/member/enrollment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_plan: newPlan }),
      })
      if (!res.ok) setPlan(prevPlan)
    } catch {
      setPlan(prevPlan)
    } finally {
      setSaving(false)
    }
  }

  const handleBootcampToggle = async () => {
    const next = !bootcamp
    setBootcamp(next)
    try {
      await fetch('/api/member/enrollment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bootcamp_enrolled: next }),
      })
    } catch {
      setBootcamp(!next) // revert
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <polyline points="17 11 19 13 23 9"/>
          </svg>
        </div>
        <h3 style={{ fontWeight: 600 }}>My Enrollment</h3>
      </div>

      {/* Plan Selector */}
      <div
        onClick={() => setShowPlanPicker(!showPlanPicker)}
        style={{
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '0.75rem',
          cursor: 'pointer',
          marginBottom: '0.75rem',
          transition: 'border-color 0.2s',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
              {activePlan.label}
              {saving && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>Saving...</span>}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '0.15rem 0 0' }}>
              {activePlan.description} — ${activePlan.price}/mo
            </p>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{
              transform: showPlanPicker ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: 'var(--muted-foreground)',
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {showPlanPicker && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={(e) => { e.stopPropagation(); handlePlanChange(p.id) }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: p.id === plan ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  background: p.id === plan ? 'rgba(239,68,68,0.1)' : 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{p.label}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginLeft: '0.5rem' }}>
                    {p.description}
                  </span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: p.id === plan ? '#ef4444' : 'inherit' }}>
                  ${p.price}/mo
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Boot Camp Enrollment */}
      <div
        onClick={handleBootcampToggle}
        style={{
          border: bootcamp ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '0.75rem',
          cursor: 'pointer',
          background: bootcamp ? 'rgba(239,68,68,0.08)' : 'transparent',
          opacity: 1,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Boot Camp</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '0.15rem 0 0' }}>
              {bootcamp ? 'You are enrolled in the next boot camp' : 'Click to enroll in the next boot camp'}
            </p>
          </div>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: bootcamp ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.2)',
            background: bootcamp ? '#ef4444' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}>
            {bootcamp && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

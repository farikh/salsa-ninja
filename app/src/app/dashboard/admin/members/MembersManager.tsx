'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type Role = {
  id: string
  name: string
  display_name: string
}

type Member = {
  member_id: string
  email: string
  full_name: string
  display_name: string | null
  avatar_url: string | null
  roles: string[]
  created_at: string
  last_login_at: string | null
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  instructor: 'bg-blue-100 text-blue-800 border-blue-200',
  member_full: 'bg-green-100 text-green-800 border-green-200',
  member_limited: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  guest: 'bg-gray-100 text-gray-800 border-gray-200',
}

const ROLE_DISPLAY: Record<string, string> = {
  owner: 'Admin',
  instructor: 'Instructor',
  member_full: 'Student',
  member_limited: 'Limited',
  guest: 'Guest',
}

export default function MembersManager({ availableRoles }: { availableRoles: Role[] }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter)

    const res = await fetch(`/api/admin/members?${params}`)
    const data = await res.json()
    setMembers(data.members || [])
    setLoading(false)
  }, [search, roleFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchMembers, 300)
    return () => clearTimeout(debounce)
  }, [fetchMembers])

  const addRole = async (memberId: string, role: string) => {
    setUpdating(true)
    const res = await fetch(`/api/admin/members/${memberId}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })

    if (res.ok) {
      // Refresh the member data
      fetchMembers()
      // Update selected member if dialog is open
      if (selectedMember?.member_id === memberId) {
        const memberRes = await fetch(`/api/admin/members?search=${selectedMember.email}`)
        const data = await memberRes.json()
        const updated = data.members?.find((m: Member) => m.member_id === memberId)
        if (updated) setSelectedMember(updated)
      }
    }
    setUpdating(false)
  }

  const removeRole = async (memberId: string, role: string) => {
    setUpdating(true)
    const res = await fetch(`/api/admin/members/${memberId}/roles?role=${role}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      fetchMembers()
      if (selectedMember?.member_id === memberId) {
        const memberRes = await fetch(`/api/admin/members?search=${selectedMember.email}`)
        const data = await memberRes.json()
        const updated = data.members?.find((m: Member) => m.member_id === memberId)
        if (updated) setSelectedMember(updated)
      }
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to remove role')
    }
    setUpdating(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: '180px' }}>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role.name} value={role.name}>
                    {ROLE_DISPLAY[role.name] || role.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            No members found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 200px 100px',
                gap: '1rem',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border)',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)'
              }}
            >
              <div>Member</div>
              <div>Email</div>
              <div>Roles</div>
              <div>Actions</div>
            </div>

            {/* Rows */}
            <ScrollArea style={{ maxHeight: '600px' }}>
              {members.map((member) => (
                <div
                  key={member.member_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 200px 100px',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {/* Name + Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar style={{ width: '36px', height: '36px' }}>
                      {member.avatar_url ? (
                        <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      ) : null}
                      <AvatarFallback style={{ fontSize: '0.75rem' }}>
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 500 }}>{member.full_name}</div>
                      {member.display_name && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                          @{member.display_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                    {member.email}
                  </div>

                  {/* Roles */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {member.roles?.map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className={ROLE_COLORS[role] || 'bg-gray-100'}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {ROLE_DISPLAY[role] || role}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div>
                    <Dialog open={dialogOpen && selectedMember?.member_id === member.member_id} onOpenChange={(open) => {
                      setDialogOpen(open)
                      if (!open) setSelectedMember(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member)
                            setDialogOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Roles</DialogTitle>
                          <DialogDescription>
                            {selectedMember?.full_name} ({selectedMember?.email})
                          </DialogDescription>
                        </DialogHeader>

                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Current Roles</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {selectedMember?.roles?.map((role) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={ROLE_COLORS[role] || 'bg-gray-100'}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  {ROLE_DISPLAY[role] || role}
                                  <button
                                    onClick={() => removeRole(selectedMember.member_id, role)}
                                    disabled={updating || selectedMember.roles.length <= 1}
                                    style={{
                                      marginLeft: '0.25rem',
                                      cursor: selectedMember.roles.length <= 1 ? 'not-allowed' : 'pointer',
                                      opacity: selectedMember.roles.length <= 1 ? 0.5 : 1,
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      fontSize: '1rem',
                                      lineHeight: 1
                                    }}
                                    title={selectedMember.roles.length <= 1 ? 'Cannot remove last role' : 'Remove role'}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Add Role</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {availableRoles
                                .filter((r) => !selectedMember?.roles?.includes(r.name))
                                .map((role) => (
                                  <Button
                                    key={role.name}
                                    variant="outline"
                                    size="sm"
                                    disabled={updating}
                                    onClick={() => selectedMember && addRole(selectedMember.member_id, role.name)}
                                  >
                                    + {ROLE_DISPLAY[role.name] || role.display_name}
                                  </Button>
                                ))}
                            </div>
                            {availableRoles.filter((r) => !selectedMember?.roles?.includes(r.name)).length === 0 && (
                              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                                Member has all available roles
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Role Legend */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Role Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <Badge variant="outline" className={ROLE_COLORS.owner} style={{ marginBottom: '0.25rem' }}>
              Admin
            </Badge>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              Full access. Manage members, roles, events, videos, and all settings.
            </p>
          </div>
          <div>
            <Badge variant="outline" className={ROLE_COLORS.instructor} style={{ marginBottom: '0.25rem' }}>
              Instructor
            </Badge>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              Set availability, manage private lesson bookings, upload videos, create events.
            </p>
          </div>
          <div>
            <Badge variant="outline" className={ROLE_COLORS.member_full} style={{ marginBottom: '0.25rem' }}>
              Student
            </Badge>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              Book private lessons, access video library, full chat access, RSVP to events.
            </p>
          </div>
          <div>
            <Badge variant="outline" className={ROLE_COLORS.member_limited} style={{ marginBottom: '0.25rem' }}>
              Limited
            </Badge>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              Limited chat, RSVP to events. No video library access.
            </p>
          </div>
          <div>
            <Badge variant="outline" className={ROLE_COLORS.guest} style={{ marginBottom: '0.25rem' }}>
              Guest
            </Badge>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
              View schedule, purchase drop-ins. Cannot book private lessons.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { Instructor } from '@/types/booking'

interface InstructorSelectorProps {
  instructors: Instructor[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function InstructorSelector({
  instructors,
  selectedId,
  onSelect,
}: InstructorSelectorProps) {
  if (instructors.length <= 1 && instructors.length > 0) {
    // Single instructor — no selector needed, but show who it is
    const inst = instructors[0]
    return (
      <div className="flex items-center gap-3 px-1 py-2">
        <Avatar size="default">
          {inst.avatar_url ? (
            <AvatarImage src={inst.avatar_url} alt={inst.display_name} />
          ) : null}
          <AvatarFallback>{getInitials(inst.full_name)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{inst.display_name}</span>
      </div>
    )
  }

  return (
    <ScrollArea className="w-full">
      <div className="px-1 py-2">
        <ToggleGroup
          type="single"
          value={selectedId ?? ''}
          onValueChange={(value) => {
            if (value) onSelect(value)
          }}
          variant="outline"
          spacing={2}
          className="w-max"
        >
          {instructors.map((inst) => (
            <ToggleGroupItem
              key={inst.id}
              value={inst.id}
              aria-label={`Select ${inst.display_name}`}
              className="flex items-center gap-2 px-3 py-1.5 h-auto rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Avatar size="sm">
                {inst.avatar_url ? (
                  <AvatarImage src={inst.avatar_url} alt={inst.display_name} />
                ) : null}
                <AvatarFallback className="text-[10px]">
                  {getInitials(inst.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm whitespace-nowrap">{inst.display_name}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

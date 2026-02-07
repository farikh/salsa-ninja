'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TableSubscription {
  table: string;
  filter?: string;
}

interface UseRealtimeCalendarOptions {
  tables: TableSubscription[];
  onUpdate: () => void;
  channelName: string;
}

export function useRealtimeCalendar(options: UseRealtimeCalendarOptions): void {
  const onUpdateRef = useRef(options.onUpdate);
  onUpdateRef.current = options.onUpdate;

  const channelNameRef = useRef(options.channelName);
  channelNameRef.current = options.channelName;

  useEffect(() => {
    const supabase = createClient();
    const channelName = channelNameRef.current;

    let channel = supabase.channel(channelName);

    for (const sub of options.tables) {
      const config: Record<string, string> = {
        event: '*',
        schema: 'public',
        table: sub.table,
      };
      if (sub.filter) {
        config.filter = sub.filter;
      }
      channel = channel.on(
        'postgres_changes' as never,
        config as never,
        () => {
          onUpdateRef.current();
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.channelName, JSON.stringify(options.tables)]);
}

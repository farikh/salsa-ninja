import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CalendarShell } from '@/components/calendar/CalendarShell';
import { getTenantFromHeaders } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  const name = tenant?.name || 'Studio';
  return {
    title: `Events Calendar | ${name}`,
    description: `View classes, workshops, bootcamps, and events at ${name}.`,
  };
}

export default function CalendarPage() {
  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="badge">
              <span>Events</span>
            </span>
            <h1 className="heading-xl mt-4">
              Events <span className="gradient-text">Calendar</span>
            </h1>
            <p className="subtitle">Classes, workshops, and socials</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Suspense
            fallback={
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <div className="h-6 bg-muted rounded w-48 mx-auto mb-4 animate-pulse" />
                <div className="h-64 bg-muted rounded animate-pulse" />
              </div>
            }
          >
            <CalendarShell />
          </Suspense>
        </div>
      </section>
    </>
  );
}

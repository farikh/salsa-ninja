import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UnifiedSchedule } from '@/components/schedule/UnifiedSchedule';
import { getTenantFromHeaders } from '@/lib/tenant/server';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  const name = tenant?.name || 'Studio';
  return {
    title: `My Schedule | ${name}`,
    description: 'View your unified schedule — classes, private lessons, and bookings.',
  };
}

export default async function MySchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: member } = await supabase
    .from('member_profiles')
    .select('id, all_roles, role_name')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    redirect('/join/profile');
  }

  const allRoles: string[] = member.all_roles || [member.role_name];
  const primaryRole = allRoles[0];

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="badge">
              <span>Schedule</span>
            </span>
            <h1 className="heading-xl mt-4">
              My <span className="gradient-text">Schedule</span>
            </h1>
            <p className="subtitle">Classes, lessons, and bookings in one view</p>
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
            <UnifiedSchedule userId={member.id} userRole={primaryRole} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

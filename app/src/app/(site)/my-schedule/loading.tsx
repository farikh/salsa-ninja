export default function MyScheduleLoading() {
  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="h-6 bg-muted rounded w-24 mx-auto animate-pulse" />
            <div className="h-10 bg-muted rounded w-48 mx-auto mt-4 animate-pulse" />
            <div className="h-5 bg-muted rounded w-64 mx-auto mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="h-6 bg-muted rounded w-48 mx-auto mb-4 animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </section>
    </>
  );
}

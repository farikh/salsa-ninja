import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ScheduleGrid from "./schedule-grid";

export default async function SchedulePage() {
  const supabase = await createClient();

  const { data: slots } = await supabase
    .from("schedule_slots")
    .select("id, day, time_slot, class_name, class_level, color_key")
    .order("created_at");

  const pricing = [
    {
      name: "Drop In Class",
      price: "$25",
      period: "Pay As You Go",
      features: [
        "NOT for absolute beginners",
        "Does not apply to bootcamp",
        "Progressive classes & patterns",
        "No commitment / No group chat",
      ],
      highlight: false,
    },
    {
      name: "5 Class Subscription",
      price: "$99",
      period: "per month",
      features: [
        "5 classes per month",
        "3% off private lessons",
        "10% off any bootcamp",
      ],
      highlight: false,
    },
    {
      name: "8 Class Subscription",
      price: "$139",
      period: "per month",
      features: [
        "8 classes per month",
        "5% off private lessons",
        "15% off any bootcamp",
      ],
      highlight: true,
    },
    {
      name: "Unlimited Subscription",
      price: "$179",
      period: "per month",
      features: [
        "Unlimited passes",
        "7% off private lessons",
        "20% off any bootcamp",
      ],
      highlight: false,
    },
    {
      name: "Showcase / Performance Teams",
      price: "$209",
      period: "per month",
      features: [
        "Unlimited class subscription included",
        "Accelerated training & opportunities",
        "Mandatory 4-5 group classes per week",
        "1 FREE Salsa Ninja gear",
        "$5 off SNDA dance social",
        "10% off private lessons",
      ],
      highlight: false,
      special: true,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="badge"><span>Plan Your Week</span></span>
            <h1 className="heading-xl mt-4">
              Class <span className="gradient-text">Schedule</span>
            </h1>
            <p className="subtitle">Schedule is subject to change</p>
          </div>
        </div>
      </section>

      {/* Dynamic Events Calendar Link */}
      <section style={{ padding: '1.5rem 0 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <Link
            href="/calendar"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <span>View Events Calendar</span>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Browse all classes, workshops, and events in an interactive calendar
          </p>
        </div>
      </section>

      {/* Weekly Calendar View */}
      <section className="section diagonal-stripes">
        <div className="container">
          <ScheduleGrid initialSlots={slots ?? []} />

          {/* Legend */}
          <div className="legend">
            {[
              { colorKey: "bootcamp", label: "Bootcamp / Beginner" },
              { colorKey: "intermediate", label: "Intermediate" },
              { colorKey: "openLevel", label: "Open Level" },
              { colorKey: "team", label: "Team Training" },
            ].map((item) => (
              <div key={item.label} className="legend-item">
                <div className={`legend-color-box ${item.colorKey}`} />
                <span className="legend-label">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Bootcamp Note */}
          <div className="bootcamp-note">
            <p>Bootcamp Classes: January 12th - February 18th</p>
            <p className="text-sm" style={{ opacity: 0.8, marginTop: "0.25rem" }}>
              6PM-7P and/or 9PM-10P sessions available (you can attend both!)
            </p>
          </div>
        </div>
      </section>

      {/* Fridays, Saturdays & Sundays */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-heading">
            <div className="overline">
              <span>Weekends</span>
            </div>
            <h2>
              Fridays, Saturdays &{" "}
              <span className="gradient-text">Sundays</span>
            </h2>
          </div>

          <div className="grid-3">
            {[
              {
                icon: "👤",
                title: "Private Lessons",
                description:
                  "All appointments must be approved 24 hours in advance",
                items: [
                  { label: "5 Hour Package:", value: "$475" },
                  { label: "10 Hour Package:", value: "$850" },
                ],
              },
              {
                icon: "🎉",
                title: "Events & Socials",
                description:
                  "Every 2nd Friday of each month - Salsa Ninja Dance Academy Social",
                items: [
                  { label: "Online Pre-Sale:", value: "$15" },
                  { label: "At The Door:", value: "$20" },
                ],
              },
              {
                icon: "💪",
                title: "Team Practice",
                description:
                  "For additional practice, choreography cleaning and team bonding",
                items: [],
              },
            ].map((card, idx) => (
              <div key={idx} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
                  {card.icon}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "1.25rem" }}>
                  {card.title}
                </h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  {card.description}
                </p>
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "1rem",
                  }}
                >
                  {card.items.length > 0 ? (
                    card.items.map((item, i) => (
                      <div key={i} style={{ marginBottom: i < card.items.length - 1 ? "0.5rem" : 0 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-light)" }}>
                          {item.label}
                        </span>{" "}
                        <span className="gradient-text" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                          {item.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                      Availability Based
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Prices */}
      <section className="section diagonal-stripes">
        <div className="container">
          <div className="section-heading">
            <div className="overline">
              <span>Subscription Prices</span>
            </div>
            <h2>
              Choose Your <span className="gradient-text">Plan</span>
            </h2>
            <p>
              All packages are subscription-based and charged recurringly every
              1st or 15th monthly
            </p>
          </div>

          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))",
                color: "#f59e0b",
                padding: "0.75rem 2rem",
                fontWeight: 700,
                fontSize: "1.1rem",
                borderLeft: "3px solid #f59e0b",
                transform: "skewX(-6deg)",
              }}
            >
              <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
                Try your first class for just $5!
              </span>
            </span>
          </div>

          <div className="grid-4 mb-8">
            {pricing.slice(0, 4).map((plan, index) => (
              <div
                key={index}
                className="card relative flex flex-col"
                style={{
                  border: plan.highlight
                    ? "2px solid transparent"
                    : "1px solid rgba(255,255,255,0.06)",
                  background: plan.highlight ? "#1a1a1a" : undefined,
                  ...(plan.highlight
                    ? {
                        backgroundImage:
                          "linear-gradient(#1a1a1a, #1a1a1a), linear-gradient(135deg, #ef4444, #f59e0b)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                      }
                    : {}),
                }}
              >
                {plan.highlight && (
                  <div className="most-popular-badge">Most Popular</div>
                )}
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    textAlign: "center",
                    color: "#ffffff",
                  }}
                >
                  {plan.name}
                </h3>
                <div style={{ textAlign: "center", margin: "1.25rem 0" }}>
                  <span
                    className="gradient-text"
                    style={{ fontSize: "2.5rem", fontWeight: 800 }}
                  >
                    {plan.price}
                  </span>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {plan.period}
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        color: "var(--text-light)",
                      }}
                    >
                      <span
                        style={{
                          background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6rem",
                          color: "white",
                          flexShrink: 0,
                          marginTop: "3px",
                        }}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={
                    plan.highlight
                      ? "btn btn-primary w-full mt-6"
                      : "btn btn-outline w-full mt-6"
                  }
                  style={{ textAlign: "center" }}
                >
                  <span>Get Started</span>
                </Link>
              </div>
            ))}
          </div>

          <div className="performance-card">
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <span className="performance-badge">
                <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
                  For Committed Students
                </span>
              </span>
            </div>
            <div className="performance-grid">
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                  Showcase /{" "}
                  <span className="gradient-text">Performance Teams</span>
                </h3>
                <p style={{ color: "var(--text-light)", marginBottom: "1.5rem" }}>
                  This package is for committed students who desire to truly
                  learn the full art of dance
                </p>
                <div>
                  <span className="gradient-text" style={{ fontSize: "3rem", fontWeight: 800 }}>
                    $209
                  </span>
                  <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                    per month
                  </span>
                </div>
              </div>
              <div>
                <div className="features-grid">
                  {pricing[4].features.map((feature, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className="feature-checkmark">✓</span>
                      <span style={{ color: "var(--text-light)" }}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <Link href="/login" className="btn btn-primary">
                    <span>Join Performance Team</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-alt">
        <div className="container">
          <div className="cta-card">
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem", position: "relative", zIndex: 1 }}>
              Ready to Start <span className="gradient-text">Dancing?</span>
            </h2>
            <p style={{ opacity: 0.9, marginBottom: "2rem", maxWidth: "28rem", margin: "0 auto 2rem", position: "relative", zIndex: 1 }}>
              Register now and try your first class for just $5. No experience
              necessary!
            </p>
            <div style={{ position: "relative", zIndex: 1 }}>
              <Link href="/login" className="btn btn-light">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

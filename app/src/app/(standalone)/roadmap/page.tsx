"use client";

import { useState } from "react";

const stages = [
  {
    number: 1,
    title: "Professional Website",
    status: "live" as const,
    statusLabel: "LIVE",
    description:
      "A modern, mobile-first site that replaces Wix with real content, real pricing, and a professional online presence.",
    features: [
      "Mobile-first responsive design",
      "Class schedule with all pricing tiers",
      "Bootcamp course & enrollment info",
      "Monthly socials with ticket purchase",
      "Shoe store with affiliate links",
      "Contact with map, hours & click-to-call",
    ],
    value:
      "Students find you online, see your schedule, and buy tickets — all from their phone.",
  },
  {
    number: 2,
    title: "Online Booking",
    status: "live" as const,
    statusLabel: "LIVE",
    description:
      "Students book private lessons directly. Instructors manage their own availability. No more back-and-forth texts.",
    features: [
      "Private lesson scheduling calendar",
      "Instructor availability management",
      "Student picks instructor, date & time",
      "Instructor confirms or declines",
      "Built-in student-instructor messaging",
      "Fully responsive — works on any device",
    ],
    value:
      "Students book on their own time. Instructors control their schedule. You stop playing middleman.",
  },
  {
    number: 3,
    title: "Member Login Area",
    status: "building" as const,
    statusLabel: "BUILDING",
    description:
      "A private portal where members access their dashboard and you manage your community from one place.",
    features: [
      "Magic link login — no passwords",
      "Personalized member dashboard",
      "Role-based access (owner, instructor, member)",
      "Admin panel for member management",
      "Invite-only registration via QR or link",
    ],
    value:
      "Members feel like insiders. You know exactly who\u2019s in your community and what role they play.",
  },
  {
    number: 4,
    title: "QR Check-ins & Payments",
    status: "next" as const,
    statusLabel: "NEXT UP",
    description:
      "Scan at the door, track attendance automatically, and bring all payments online with Stripe.",
    features: [
      "QR code check-in at the door",
      "Automated attendance tracking",
      "Online payments via Stripe",
      "Class packages & subscriptions",
      "Google Calendar sync for instructors",
      "Capacity & waitlist management",
    ],
    value:
      "Know who showed up, who\u2019s dropping off, and which classes are growing — without manual tracking. Revenue flows online.",
  },
  {
    number: 5,
    title: "Community & Growth",
    status: "future" as const,
    statusLabel: "FUTURE",
    description:
      "Replace Telegram, add video content, and expand your reach with new tools.",
    features: [
      "Video library with class recordings",
      "Built-in community messaging",
      "Event management with RSVP & waitlist",
      "Spanish language support",
      "Mobile app experience",
      "Referral program for members",
    ],
    value:
      "Everything under one roof — your community, your content, your brand.",
  },
];

const statusConfig = {
  live: {
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.25)",
    glow: "0 0 24px rgba(34, 197, 94, 0.15)",
    lineColor: "#22c55e",
  },
  building: {
    color: "var(--primary)",
    bg: "color-mix(in srgb, var(--primary) 12%, transparent)",
    border: "color-mix(in srgb, var(--primary) 25%, transparent)",
    glow: "0 0 24px color-mix(in srgb, var(--primary) 15%, transparent)",
    lineColor: "var(--primary)",
  },
  next: {
    color: "var(--primary-light)",
    bg: "color-mix(in srgb, var(--primary-light) 8%, transparent)",
    border: "color-mix(in srgb, var(--primary-light) 20%, transparent)",
    glow: "none",
    lineColor: "var(--primary-light)",
  },
  future: {
    color: "rgba(255,255,255,0.4)",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.06)",
    glow: "none",
    lineColor: "rgba(255,255,255,0.1)",
  },
};

export default function RoadmapPage() {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", fontFamily: "'Segoe UI', -apple-system, 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Hero */}
      <section
        style={{
          padding: "4rem 1.5rem 2.5rem",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40%",
            left: "-15%",
            width: "60%",
            height: "180%",
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
          {/* Logo */}
          <div
            style={{
              display: "inline-block",
              fontSize: "1.1rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "2rem",
            }}
          >
            SALSA NINJA
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#ffffff",
              margin: "0 0 1rem",
            }}
          >
            Building Your{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Dance Empire
            </span>
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1.05rem",
              lineHeight: 1.6,
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            From a professional website to a full community platform — one stage at a time, at your pace.
          </p>

          {/* Progress pills */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              marginTop: "2.5rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Live", count: 2, color: "#22c55e" },
              { label: "Building", count: 1, color: "var(--primary)" },
              { label: "Planned", count: 2, color: "rgba(255,255,255,0.35)" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: item.color,
                    boxShadow:
                      item.color.startsWith("#")
                        ? `0 0 6px ${item.color}`
                        : "none",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {item.count} {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: "1rem 1.5rem 5rem", maxWidth: "780px", margin: "0 auto" }}>
        {stages.map((stage, idx) => {
          const config = statusConfig[stage.status];
          const isExp = expandedStage === stage.number;
          const active = stage.status === "live" || stage.status === "building";
          const faded = stage.status === "future";

          return (
            <div
              key={stage.number}
              style={{
                display: "flex",
                gap: "clamp(1rem, 3vw, 1.5rem)",
                position: "relative",
                opacity: faded ? 0.55 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              {/* Timeline column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                  width: "44px",
                }}
              >
                {/* Node */}
                <div
                  style={{
                    width: active ? "44px" : "36px",
                    height: active ? "44px" : "36px",
                    borderRadius: "50%",
                    background: config.bg,
                    border: `2px solid ${config.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: active ? "1.1rem" : "0.95rem",
                    color: config.color,
                    boxShadow: config.glow,
                    position: "relative",
                    zIndex: 2,
                    flexShrink: 0,
                  }}
                >
                  {stage.status === "live" ? (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 10l3.5 3.5L15 7"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    stage.number
                  )}
                </div>
                {/* Connector */}
                {idx < stages.length - 1 && (
                  <div
                    style={{
                      width: "2px",
                      flex: 1,
                      minHeight: "1.5rem",
                      background: `linear-gradient(to bottom, ${config.lineColor}, ${statusConfig[stages[idx + 1].status].lineColor})`,
                    }}
                  />
                )}
              </div>

              {/* Card */}
              <div
                onClick={() =>
                  setExpandedStage(isExp ? null : stage.number)
                }
                style={{
                  flex: 1,
                  background: "var(--card)",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  marginBottom: idx < stages.length - 1 ? "0.75rem" : 0,
                  border: `1px solid ${config.border}`,
                  boxShadow: active
                    ? config.glow
                    : "0 2px 12px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent */}
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      background:
                        stage.status === "live"
                          ? "#22c55e"
                          : "linear-gradient(90deg, var(--primary), var(--primary-light))",
                    }}
                  />
                )}

                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "clamp(1.1rem, 3vw, 1.3rem)",
                        fontWeight: 700,
                        color: faded ? "rgba(255,255,255,0.5)" : "#ffffff",
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {stage.title}
                    </h3>
                    <p
                      style={{
                        color: faded
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(255,255,255,0.6)",
                        fontSize: "0.9rem",
                        marginTop: "0.3rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {stage.description}
                    </p>
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.7rem",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: config.color,
                      background: config.bg,
                      border: `1px solid ${config.border}`,
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      marginTop: "0.15rem",
                    }}
                  >
                    {stage.statusLabel}
                  </span>
                </div>

                {/* Expandable detail */}
                <div
                  style={{
                    maxHeight: isExp ? "500px" : "0",
                    overflow: "hidden",
                    transition:
                      "max-height 0.4s ease, opacity 0.3s ease, margin 0.3s ease",
                    opacity: isExp ? 1 : 0,
                    marginTop: isExp ? "1.25rem" : "0",
                  }}
                >
                  <div
                    style={{
                      paddingTop: "1.25rem",
                      borderTop: `1px solid ${config.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "0.5rem",
                      }}
                    >
                      {stage.features.map((feature) => (
                        <div
                          key={feature}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.85rem",
                            color: faded
                              ? "rgba(255,255,255,0.35)"
                              : "rgba(255,255,255,0.7)",
                          }}
                        >
                          <div
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: config.color,
                              flexShrink: 0,
                            }}
                          />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Value callout */}
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.875rem 1rem",
                        background: config.bg,
                        borderRadius: "0.6rem",
                        border: `1px solid ${config.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: config.color,
                          marginBottom: "0.25rem",
                        }}
                      >
                        Why it matters
                      </div>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: faded
                            ? "rgba(255,255,255,0.35)"
                            : "rgba(255,255,255,0.75)",
                          fontStyle: "italic",
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {stage.value}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expand indicator */}
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "0.6rem",
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  {isExp ? "tap to collapse" : "tap for details"}
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "3rem",
            padding: "1.75rem",
            background: "var(--card)",
            borderRadius: "1rem",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Each stage builds on the last. Nothing ships until you&apos;ve seen
            it and approved it.
          </p>
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Platform costs start under $10/mo and scale with your membership.
          </div>
        </div>
      </section>
    </div>
  );
}

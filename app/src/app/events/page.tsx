import Link from "next/link";

export default function EventsPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: "#111111",
          padding: "5rem 0 6rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40%",
            right: "-15%",
            width: "60%",
            height: "180%",
            background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span className="badge"><span>Upcoming Events</span></span>
            <h1 className="heading-xl" style={{ marginTop: "1.5rem", color: "#ffffff" }}>
              Special <span className="gradient-text">Events</span>
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "1.1rem", marginTop: "1rem" }}>
              Join us for socials, workshops, and special dance events!
            </p>
          </div>
        </div>
      </section>

      {/* Featured Event */}
      <section className="section diagonal-stripes">
        <div className="container">
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              background: "var(--dark-2)",
              borderRadius: "1.5rem",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "var(--shadow-heavy)",
            }}
          >
            {/* Event Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
                padding: "2.5rem 2rem",
                textAlign: "center",
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", zIndex: 1 }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(255,255,255,0.2)",
                    padding: "0.375rem 1.25rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "1rem",
                    transform: "skewX(-6deg)",
                  }}
                >
                  <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
                    First Social of the Year
                  </span>
                </span>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  NEW YEAR Social 2026
                </h2>
                <p style={{ opacity: 0.9, fontSize: "1.1rem" }}>
                  Kick off 2026 with the Ninja fam!
                </p>
              </div>
            </div>

            {/* Event Details */}
            <div style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text-light)", marginBottom: "1rem" }}>
                  We&apos;re kicking off 2026 the only way Salsa Ninja knows how — with a
                  packed dance floor, elite vibes, and the whole Ninja fam together!
                </p>
                <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text-light)" }}>
                  Get ready for a night of pure salsa & bachata energy, good people, and
                  that feeling you only get at a Salsa Ninja social
                </p>
              </div>

              {/* Event Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "2rem",
                }}
              >
                {[
                  { emoji: "📅", label: "Date", value: "Friday, January 16, 2026" },
                  { emoji: "🕘", label: "Time", value: "Salsa Class 9 PM\nSocial 10 PM 'til late" },
                  { emoji: "🎧", label: "Music By", value: "DJ Mike Calderon" },
                  { emoji: "🎟", label: "Entry", value: "$20 (Food on site)" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "1.25rem",
                      background: "var(--dark-3)",
                      borderRadius: "1rem",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                      {item.emoji} {item.label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "#ffffff", whiteSpace: "pre-line" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2rem" }}>
                {["BYOB", "Light Bites", "Free Parking"].map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "0.5rem 1.25rem",
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      border: "1px solid rgba(239,68,68,0.2)",
                      transform: "skewX(-6deg)",
                    }}
                  >
                    <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
                      {item}
                    </span>
                  </span>
                ))}
              </div>

              {/* Dresscode */}
              <div
                style={{
                  padding: "1.5rem",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))",
                  borderRadius: "1rem",
                  marginBottom: "2rem",
                  textAlign: "center",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#f59e0b", marginBottom: "0.5rem", letterSpacing: "0.08em", fontWeight: 600 }}>
                  Dresscode
                </div>
                <div className="gradient-text" style={{ fontWeight: 800, fontSize: "1.75rem" }}>
                  NEON
                </div>
                <p style={{ color: "var(--text-light)", marginTop: "0.5rem" }}>
                  Come sharp, come confident — start the year in style!
                </p>
              </div>

              {/* Location */}
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                  📍 Location
                </div>
                <p style={{ fontWeight: 600, color: "#ffffff" }}>
                  Salsa Ninja Dance Academy
                  <br />
                  10070 W Oakland Park Blvd, Sunrise FL 33351
                </p>
              </div>

              {/* CTA */}
              <div style={{ textAlign: "center" }}>
                <a
                  href="https://square.link/u/ShQElAnw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ minWidth: "200px" }}
                >
                  <span>Purchase Tickets</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stay Updated */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            <h2 className="heading-md" style={{ marginBottom: "1rem", color: "#ffffff" }}>
              Don&apos;t <span className="gradient-text">Miss Out!</span>
            </h2>
            <p style={{ color: "var(--text-light)", marginBottom: "2rem" }}>
              Follow us on social media to stay updated on upcoming events, socials, and
              special workshops.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="https://instagram.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <span>Follow on Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <span>Follow on Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

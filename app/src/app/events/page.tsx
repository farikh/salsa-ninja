import Link from "next/link";

export default function EventsPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
          padding: "4rem 0 5rem",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span className="badge">Upcoming Events</span>
            <h1 className="heading-xl" style={{ marginTop: "1rem" }}>
              Special Events
            </h1>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "1.1rem",
                marginTop: "1rem",
              }}
            >
              Join us for socials, workshops, and special dance events!
            </p>
          </div>
        </div>
      </section>

      {/* Featured Event */}
      <section className="section">
        <div className="container">
          <div
            className="card"
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              overflow: "hidden",
              padding: 0,
            }}
          >
            {/* Event Header */}
            <div
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                padding: "2rem",
                color: "white",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.2)",
                  padding: "0.375rem 1rem",
                  borderRadius: "9999px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                }}
              >
                First Social of the Year
              </span>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                NEW YEAR Social 2026
              </h2>
              <p style={{ opacity: 0.9, fontSize: "1.1rem" }}>
                Kick off 2026 with the Ninja fam!
              </p>
            </div>

            {/* Event Details */}
            <div style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.8,
                    color: "var(--foreground)",
                    marginBottom: "1.5rem",
                  }}
                >
                  We&apos;re kicking off 2026 the only way Salsa Ninja knows how — with a
                  packed dance floor, elite vibes, and the whole Ninja fam together! 🔥
                </p>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.8,
                    color: "var(--foreground)",
                  }}
                >
                  Get ready for a night of pure salsa & bachata energy, good people, and
                  that feeling you only get at a Salsa Ninja social ✨
                </p>
              </div>

              {/* Event Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--muted)",
                    borderRadius: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    📅 Date
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    Friday, January 16, 2026
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--muted)",
                    borderRadius: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    🕘 Time
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    Salsa Class 9 PM
                    <br />
                    Social 10 PM &apos;til late
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--muted)",
                    borderRadius: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    🎧 Music By
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    DJ Mike Calderon
                  </div>
                </div>

                <div
                  style={{
                    padding: "1.25rem",
                    background: "var(--muted)",
                    borderRadius: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    🎟️ Entry
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    $20 (Food on site)
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "2rem",
                }}
              >
                {["BYOB", "Light Bites", "Free Parking"].map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--secondary)",
                      color: "var(--primary)",
                      borderRadius: "9999px",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Dresscode */}
              <div
                style={{
                  padding: "1.5rem",
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  borderRadius: "1rem",
                  marginBottom: "2rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "#92400e",
                    marginBottom: "0.5rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  ✨ Dresscode
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.5rem", color: "#78350f" }}>
                  NEON
                </div>
                <p style={{ color: "#92400e", marginTop: "0.5rem" }}>
                  Come sharp, come confident — start the year in style!
                </p>
              </div>

              {/* Location */}
              <div style={{ marginBottom: "2rem" }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "var(--muted-foreground)",
                    marginBottom: "0.5rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  📍 Location
                </div>
                <p style={{ fontWeight: 600 }}>
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
                  Purchase Tickets
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
            <h2 className="heading-md" style={{ marginBottom: "1rem" }}>
              Don&apos;t Miss Out!
            </h2>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>
              Follow us on social media to stay updated on upcoming events, socials, and
              special workshops.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <a
                href="https://instagram.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Follow on Instagram
              </a>
              <a
                href="https://www.facebook.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Follow on Facebook
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

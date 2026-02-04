import Link from "next/link";

export default function BootcampPage() {
  const curriculum = [
    {
      icon: "🎵",
      title: "Musicality Basics",
      description:
        "Develop a foundation in Salsa Music theory and rhythm. Learn to identify Latin music patterns and dance on beat.",
    },
    {
      icon: "🤝",
      title: "Partnerwork (Lead & Follow)",
      description:
        "Learn the basics of partner work in a fun and supportive environment. Build confidence with clear lead and follow techniques.",
    },
    {
      icon: "👟",
      title: "Shines and Footwork",
      description:
        "Master basic Salsa Shines steps and improve your vocabulary. Get ready to impress on the dance floor.",
    },
    {
      icon: "💬",
      title: "Communication",
      description:
        "Focus on communication and expression through salsa music and dance. Connect with others who share your passion.",
    },
  ];

  const rules = [
    "This is a 6 week committed course",
    "No drop-in or trial classes for this course",
    "No refunds or price adjustments for missed classes",
    "Private lessons available for missed classes",
    "Dance shoes & casual clothing attire mandatory",
    "Scan QR code or visit website for acceptable heels and shoes",
  ];

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
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <span className="badge">6 Week Course</span>
            <h1 className="heading-xl" style={{ marginTop: "1rem" }}>
              Absolute Beginners
              <br />
              <span className="text-gradient">L.A. Style Salsa On 1</span>
              <br />
              Bootcamp
            </h1>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "1.1rem",
                marginTop: "1.5rem",
                lineHeight: 1.7,
              }}
            >
              The perfect opportunity for those who&apos;ve never danced before to learn
              the basics of salsa in a fun and supportive environment.
            </p>
            <div
              style={{
                display: "inline-block",
                background: "var(--primary)",
                color: "white",
                padding: "0.5rem 1.5rem",
                borderRadius: "9999px",
                fontWeight: 600,
                marginTop: "1.5rem",
              }}
            >
              NO PARTNER REQUIRED
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Left - Info */}
            <div>
              <h2 className="heading-md" style={{ marginBottom: "1.5rem" }}>
                Bootcamp Details
              </h2>

              <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        color: "var(--muted-foreground)",
                        marginBottom: "0.25rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Dates
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      January 12th - February 18th
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        color: "var(--muted-foreground)",
                        marginBottom: "0.25rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Schedule
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      Monday&apos;s and Wednesday&apos;s
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        color: "var(--muted-foreground)",
                        marginBottom: "0.25rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Time Options
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      6:00 PM - 7:00 PM (Early Evening)
                      <br />
                      9:00 PM - 10:00 PM (Late Evening)
                    </div>
                    <p
                      style={{
                        color: "var(--primary)",
                        fontSize: "0.9rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      Yes, you can take both 6PM & 9PM!
                    </p>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        color: "var(--muted-foreground)",
                        marginBottom: "0.25rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Duration
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      6 Weeks Total
                    </div>
                    <p
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: "0.85rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      10-20 classes with pop-up sessions
                    </p>
                  </div>
                </div>
              </div>

              <p
                style={{
                  color: "var(--muted-foreground)",
                  lineHeight: 1.7,
                  marginBottom: "1.5rem",
                }}
              >
                This is a progressive group private lessons course. We rotate partners
                during class settings to help you get a feel of different dance languages
                throughout the Bootcamp.
              </p>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
                Payment Options Available
              </h3>
              <p style={{ color: "var(--muted-foreground)", marginBottom: "1rem" }}>
                Purchase in full or use our payment plan options!
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {["Afterpay", "Google Pay", "Klarna", "Affirm"].map((option) => (
                  <span
                    key={option}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--muted)",
                      borderRadius: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {option}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - Registration CTA */}
            <div>
              <div
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                  borderRadius: "1.5rem",
                  padding: "2.5rem",
                  color: "white",
                  textAlign: "center",
                  marginBottom: "2rem",
                }}
              >
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                  Bootcamp Pricing
                </h3>

                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: "0.85rem", textTransform: "uppercase", opacity: 0.8, marginBottom: "0.25rem" }}>
                      One Person
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>$259</div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", textTransform: "uppercase", opacity: 0.8, marginBottom: "0.25rem" }}>
                      Two People (Couple)
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>$399</div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "0.25rem" }}>
                      Save by joining with a friend!
                    </div>
                  </div>
                </div>

                <Link href="/register" className="btn btn-light" style={{ width: "100%" }}>
                  Sign Up Today
                </Link>
              </div>

              <div
                className="card"
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fcd34d",
                }}
              >
                <h4 style={{ fontWeight: 600, marginBottom: "1rem", color: "#92400e" }}>
                  Important Notes
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {rules.map((rule, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        marginBottom: "0.75rem",
                        fontSize: "0.9rem",
                        color: "#78350f",
                      }}
                    >
                      <span>⚠️</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="badge">What You&apos;ll Learn</span>
            <h2 className="heading-lg" style={{ marginTop: "1rem" }}>
              Bootcamp Curriculum
            </h2>
          </div>

          <div className="grid-2">
            {curriculum.map((item, index) => (
              <div key={index} className="card">
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{item.icon}</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shoes CTA */}
      <section className="section">
        <div className="container">
          <div
            className="card"
            style={{
              textAlign: "center",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
              Step 2: Order Your Dance Shoes
            </h2>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "1.5rem" }}>
              Ballroom shoes are mandatory for the bootcamp. Check out our recommended
              shoes and exclusive discount codes!
            </p>
            <Link href="/shoes" className="btn btn-primary">
              Shop Dance Shoes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

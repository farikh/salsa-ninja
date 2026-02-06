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
        <div
          style={{
            position: "absolute",
            bottom: "-40%",
            left: "-10%",
            width: "40%",
            height: "120%",
            background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <span className="badge"><span>6 Week Course</span></span>
            <h1 className="heading-xl" style={{ marginTop: "1.5rem", color: "#ffffff" }}>
              Absolute Beginners
              <br />
              <span className="gradient-text">L.A. Style Salsa On 1</span>
              <br />
              Bootcamp
            </h1>
            <p
              style={{
                color: "var(--text-light)",
                fontSize: "1.15rem",
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
                background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                color: "white",
                padding: "0.625rem 2rem",
                fontWeight: 700,
                marginTop: "1.5rem",
                transform: "skewX(-6deg)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
                NO PARTNER REQUIRED
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="section diagonal-stripes">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Left - Info */}
            <div>
              <h2 className="heading-md" style={{ marginBottom: "1.5rem", color: "#ffffff" }}>
                Bootcamp <span className="gradient-text">Details</span>
              </h2>

              <div
                className="card"
                style={{ marginBottom: "2rem" }}
              >
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  {[
                    { label: "Dates", value: "January 12th - February 18th" },
                    { label: "Schedule", value: "Monday's and Wednesday's" },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
                        {item.value}
                      </div>
                    </div>
                  ))}

                  <div>
                    <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      Time Options
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
                      6:00 PM - 7:00 PM (Early Evening)
                      <br />
                      9:00 PM - 10:00 PM (Late Evening)
                    </div>
                    <p style={{ color: "#f59e0b", fontSize: "0.9rem", marginTop: "0.5rem", fontWeight: 600 }}>
                      Yes, you can take both 6PM & 9PM!
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      Duration
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
                      6 Weeks Total
                    </div>
                    <p style={{ color: "var(--text-light)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      10-20 classes with pop-up sessions
                    </p>
                  </div>
                </div>
              </div>

              <p style={{ color: "var(--text-light)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                This is a progressive group private lessons course. We rotate partners
                during class settings to help you get a feel of different dance languages
                throughout the Bootcamp.
              </p>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#ffffff" }}>
                Payment Options Available
              </h3>
              <p style={{ color: "var(--text-light)", marginBottom: "1rem" }}>
                Purchase in full or use our payment plan options!
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {["Afterpay", "Google Pay", "Klarna", "Affirm"].map((option) => (
                  <span
                    key={option}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "var(--dark-3)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--text-light)",
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
                  background: "linear-gradient(135deg, var(--dark-2), var(--dark-3))",
                  borderRadius: "1.5rem",
                  padding: "2.5rem",
                  textAlign: "center",
                  marginBottom: "2rem",
                  border: "1px solid rgba(255,255,255,0.06)",
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
                    height: "4px",
                    background: "linear-gradient(90deg, #ef4444, #f59e0b)",
                  }}
                />
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "#ffffff" }}>
                  Bootcamp <span className="gradient-text">Pricing</span>
                </h3>

                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      One Person
                    </div>
                    <div className="gradient-text" style={{ fontSize: "2.5rem", fontWeight: 800 }}>
                      $259
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.25rem", letterSpacing: "0.08em" }}>
                      Two People (Couple)
                    </div>
                    <div className="gradient-text" style={{ fontSize: "2.5rem", fontWeight: 800 }}>
                      $399
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
                      Save by joining with a friend!
                    </div>
                  </div>
                </div>

                <Link href="/register" className="btn btn-primary" style={{ width: "100%" }}>
                  <span>Sign Up Today</span>
                </Link>
              </div>

              <div
                style={{
                  background: "var(--dark-2)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderLeft: "4px solid #f59e0b",
                  borderRadius: "1rem",
                  padding: "2rem",
                }}
              >
                <h4 style={{ fontWeight: 700, marginBottom: "1rem", color: "#f59e0b" }}>
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
                        color: "var(--text-light)",
                      }}
                    >
                      <span style={{ color: "#f59e0b", flexShrink: 0 }}>⚠</span>
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
          <div className="section-heading">
            <div className="overline">
              <span>What You&apos;ll Learn</span>
            </div>
            <h2>
              Bootcamp <span className="gradient-text">Curriculum</span>
            </h2>
          </div>

          <div className="grid-2">
            {curriculum.map((item, index) => (
              <div key={index} className="card">
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{item.icon}</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem", color: "#ffffff" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-light)", lineHeight: 1.7 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shoes CTA */}
      <section className="section diagonal-stripes">
        <div className="container">
          <div
            style={{
              textAlign: "center",
              maxWidth: "600px",
              margin: "0 auto",
              background: "var(--dark-2)",
              borderRadius: "1.5rem",
              padding: "3rem",
              border: "1px solid rgba(255,255,255,0.06)",
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
                height: "4px",
                background: "linear-gradient(90deg, #ef4444, #f59e0b)",
              }}
            />
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem", color: "#ffffff" }}>
              Step 2: Order Your <span className="gradient-text">Dance Shoes</span>
            </h2>
            <p style={{ color: "var(--text-light)", marginBottom: "1.5rem" }}>
              Ballroom shoes are mandatory for the bootcamp. Check out our recommended
              shoes and exclusive discount codes!
            </p>
            <Link href="/shoes" className="btn btn-primary">
              <span>Shop Dance Shoes</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

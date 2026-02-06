export default function ContactPage() {
  const hours = [
    { day: "Monday", time: "6:00 PM - 9:00 PM" },
    { day: "Tuesday", time: "7:00 PM - 9:00 PM" },
    { day: "Wednesday", time: "6:00 PM - 9:00 PM" },
    { day: "Thursday", time: "7:00 PM - 10:00 PM" },
    { day: "Friday", time: "Closed (Events Only)" },
    { day: "Saturday", time: "Closed" },
    { day: "Sunday", time: "Closed" },
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
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span className="badge"><span>Get in Touch</span></span>
            <h1 className="heading-xl" style={{ marginTop: "1.5rem", color: "#ffffff" }}>
              Contact <span className="gradient-text">Us</span>
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "1.1rem", marginTop: "1rem" }}>
              Have questions? We&apos;d love to hear from you!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Map */}
      <section className="section diagonal-stripes">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Contact Details */}
            <div>
              <div
                style={{
                  background: "var(--dark-2)",
                  borderRadius: "1rem",
                  padding: "2rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: "2rem",
                }}
              >
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "#ffffff" }}>
                  Contact <span className="gradient-text">Information</span>
                </h2>

                <div style={{ marginBottom: "2rem" }}>
                  {[
                    {
                      emoji: "📍",
                      title: "Address",
                      content: (
                        <>
                          <p style={{ color: "var(--text-light)", lineHeight: 1.6 }}>
                            10070 W Oakland Park Blvd
                            <br />
                            Sunrise, FL 33351
                          </p>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                            (Cross intersection of Oakland Park Blvd and Nob Hill)
                          </p>
                        </>
                      ),
                    },
                    {
                      emoji: "📞",
                      title: "Phone",
                      content: (
                        <a
                          href="tel:9546625354"
                          style={{ color: "#ef4444", textDecoration: "none", fontSize: "1.1rem", fontWeight: 600 }}
                        >
                          (954) 662-5354
                        </a>
                      ),
                    },
                    {
                      emoji: "✉",
                      title: "Email",
                      content: (
                        <a
                          href="mailto:contact@salsaninja.com"
                          style={{ color: "#ef4444", textDecoration: "none", fontSize: "1.1rem", fontWeight: 600 }}
                        >
                          contact@salsaninja.com
                        </a>
                      ),
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "1rem",
                        marginBottom: idx < 2 ? "1.5rem" : 0,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "48px",
                          height: "48px",
                          borderRadius: "1rem",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.15)",
                          fontSize: "1.25rem",
                          flexShrink: 0,
                        }}
                      >
                        {item.emoji}
                      </span>
                      <div>
                        <h3 style={{ fontWeight: 700, marginBottom: "0.25rem", color: "#ffffff" }}>
                          {item.title}
                        </h3>
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Social Links */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: "1rem", color: "#ffffff" }}>
                    Follow Us
                  </h3>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <a
                      href="https://instagram.com/salsaninjadanceacademy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.25rem",
                        background: "var(--dark-3)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        textDecoration: "none",
                        color: "var(--text-light)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        transition: "all 0.3s ease",
                      }}
                    >
                      📸 Instagram
                    </a>
                    <a
                      href="https://www.facebook.com/salsaninjadanceacademy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.25rem",
                        background: "var(--dark-3)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        textDecoration: "none",
                        color: "var(--text-light)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        transition: "all 0.3s ease",
                      }}
                    >
                      👍 Facebook
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div
                style={{
                  background: "var(--dark-2)",
                  borderRadius: "1rem",
                  padding: "2rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "#ffffff" }}>
                  Hours of <span className="gradient-text">Operation</span>
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {hours.map((item, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.75rem 0",
                        borderBottom:
                          index < hours.length - 1
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "none",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#ffffff" }}>{item.day}</span>
                      <span
                        style={{
                          color: item.time.includes("Closed")
                            ? "var(--text-muted)"
                            : "#ef4444",
                          fontWeight: item.time.includes("Closed") ? 400 : 600,
                        }}
                      >
                        {item.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Map */}
            <div>
              <div
                style={{
                  borderRadius: "1rem",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "var(--shadow-heavy)",
                  marginBottom: "1.5rem",
                }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.8040036267397!2d-80.25444768496654!3d26.172024883446398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d905e8b5e0c2e7%3A0x3e8c9f1b9f9b9b9b!2s10070%20W%20Oakland%20Park%20Blvd%2C%20Sunrise%2C%20FL%2033351!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
                  width="100%"
                  height="450"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <a
                href="https://www.google.com/maps/dir/?api=1&destination=10070+W+Oakland+Park+Blvd+Sunrise+FL+33351"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: "100%", textAlign: "center" }}
              >
                <span>Get Directions</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-alt">
        <div className="container">
          <div className="cta-card">
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem", position: "relative", zIndex: 1, color: "white" }}>
              Try Your First Class for $5!
            </h2>
            <p style={{ opacity: 0.9, marginBottom: "2rem", maxWidth: "500px", margin: "0 auto 2rem", position: "relative", zIndex: 1 }}>
              Visit us and experience the Salsa Ninja Dance Academy difference. No experience
              necessary!
            </p>
            <div style={{ position: "relative", zIndex: 1 }}>
              <a href="/register" className="btn btn-light">
                Register Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

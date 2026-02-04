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
          background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
          padding: "4rem 0 5rem",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span className="badge">Get in Touch</span>
            <h1 className="heading-xl" style={{ marginTop: "1rem" }}>
              Contact Us
            </h1>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "1.1rem",
                marginTop: "1rem",
              }}
            >
              Have questions? We&apos;d love to hear from you!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Map */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Contact Details */}
            <div>
              <div className="card" style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                  Contact Information
                </h2>

                <div style={{ marginBottom: "2rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      marginBottom: "1.5rem",
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
                        background: "var(--secondary)",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      📍
                    </span>
                    <div>
                      <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Address</h3>
                      <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                        10070 W Oakland Park Blvd
                        <br />
                        Sunrise, FL 33351
                      </p>
                      <p
                        style={{
                          color: "var(--muted-foreground)",
                          fontSize: "0.9rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        (Cross intersection of Oakland Park Blvd and Nob Hill)
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      marginBottom: "1.5rem",
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
                        background: "var(--secondary)",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      📞
                    </span>
                    <div>
                      <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Phone</h3>
                      <a
                        href="tel:9546625354"
                        style={{
                          color: "var(--primary)",
                          textDecoration: "none",
                          fontSize: "1.1rem",
                          fontWeight: 500,
                        }}
                      >
                        (954) 662-5354
                      </a>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
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
                        background: "var(--secondary)",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      ✉️
                    </span>
                    <div>
                      <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Email</h3>
                      <a
                        href="mailto:contact@salsaninja.com"
                        style={{
                          color: "var(--primary)",
                          textDecoration: "none",
                          fontSize: "1.1rem",
                          fontWeight: 500,
                        }}
                      >
                        contact@salsaninja.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                  <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Follow Us</h3>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <a
                      href="https://instagram.com/salsaninjadanceacademy"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.25rem",
                        background: "var(--muted)",
                        borderRadius: "0.5rem",
                        textDecoration: "none",
                        color: "var(--foreground)",
                        fontWeight: 500,
                        fontSize: "0.9rem",
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
                        background: "var(--muted)",
                        borderRadius: "0.5rem",
                        textDecoration: "none",
                        color: "var(--foreground)",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                      }}
                    >
                      👍 Facebook
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="card">
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                  Hours of Operation
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
                          index < hours.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{item.day}</span>
                      <span
                        style={{
                          color: item.time.includes("Closed")
                            ? "var(--muted-foreground)"
                            : "var(--foreground)",
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
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
                  marginBottom: "2rem",
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
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-alt">
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
              borderRadius: "1.5rem",
              padding: "3rem",
              textAlign: "center",
              color: "white",
            }}
          >
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
              Try Your First Class for $5!
            </h2>
            <p style={{ opacity: 0.9, marginBottom: "2rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
              Visit us and experience the Salsa Ninja Dance Academy difference. No experience
              necessary!
            </p>
            <a href="/register" className="btn btn-light">
              Register Now
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

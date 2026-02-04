"use client";

import { InlineWidget } from "react-calendly";

export default function RegisterPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
          padding: "4rem 0 3rem",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span className="badge">Get Started</span>
            <h1 className="heading-xl" style={{ marginTop: "1rem" }}>
              Registration & Waiver
            </h1>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "1.1rem",
                marginTop: "1rem",
              }}
            >
              Complete your registration to join the Salsa Ninja Dance Academy family!
            </p>
          </div>
        </div>
      </section>

      {/* Registration Info */}
      <section style={{ padding: "3rem 0" }}>
        <div className="container">
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="grid-3" style={{ marginBottom: "3rem" }}>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📝</div>
                <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Step 1</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
                  Complete registration form below
                </p>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✍️</div>
                <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Step 2</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
                  Sign the liability waiver
                </p>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💃</div>
                <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Step 3</h3>
                <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
                  Start dancing!
                </p>
              </div>
            </div>

            {/* Trial Class Promo */}
            <div
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                borderRadius: "1rem",
                padding: "2rem",
                textAlign: "center",
                color: "white",
                marginBottom: "3rem",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Try Your First Class for Just $5!
              </h2>
              <p style={{ opacity: 0.9 }}>
                No experience necessary. All levels welcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calendly Widget */}
      <section style={{ padding: "0 0 4rem" }}>
        <div className="container">
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div
              style={{
                background: "white",
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <InlineWidget
                url="https://calendly.com/tafari-k-higgs/30min"
                styles={{ height: "700px" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Location Info */}
      <section className="section section-alt">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "center" }}>
            <div>
              <span className="badge">Visit Us</span>
              <h2 className="heading-md" style={{ marginTop: "1rem" }}>
                Studio Location
              </h2>
              <p
                style={{
                  color: "var(--muted-foreground)",
                  marginTop: "1rem",
                  lineHeight: 1.7,
                }}
              >
                Located at the cross intersection of Oakland Park Blvd and Nob Hill in
                Sunrise, FL (Broward County).
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  10070 W Oakland Park Blvd
                  <br />
                  Sunrise, FL 33351
                </p>
                <p style={{ color: "var(--muted-foreground)" }}>
                  <a
                    href="tel:9546625354"
                    style={{ color: "var(--primary)", textDecoration: "none" }}
                  >
                    (954) 662-5354
                  </a>
                </p>
              </div>
            </div>
            <div
              style={{
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.8040036267397!2d-80.25444768496654!3d26.172024883446398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d905e8b5e0c2e7%3A0x3e8c9f1b9f9b9b9b!2s10070%20W%20Oakland%20Park%20Blvd%2C%20Sunrise%2C%20FL%2033351!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

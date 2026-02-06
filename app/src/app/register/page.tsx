"use client";

import { InlineWidget } from "react-calendly";

export default function RegisterPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: "#111111",
          padding: "5rem 0 4rem",
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
            <span className="badge"><span>Get Started</span></span>
            <h1 className="heading-xl" style={{ marginTop: "1.5rem", color: "#ffffff" }}>
              Registration & <span className="gradient-text">Waiver</span>
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "1.1rem", marginTop: "1rem" }}>
              Complete your registration to join the Salsa Ninja Dance Academy family!
            </p>
          </div>
        </div>
      </section>

      {/* Registration Info */}
      <section style={{ padding: "3rem 0", background: "var(--dark)" }}>
        <div className="container">
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="grid-3" style={{ marginBottom: "3rem" }}>
              {[
                { emoji: "📝", step: "Step 1", desc: "Complete registration form below" },
                { emoji: "✍", step: "Step 2", desc: "Sign the liability waiver" },
                { emoji: "💃", step: "Step 3", desc: "Start dancing!" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{ textAlign: "center" }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{item.emoji}</div>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#ffffff" }}>
                    {item.step}
                  </h3>
                  <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Trial Class Promo */}
            <div className="cta-card" style={{ marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
                Try Your First Class for Just $5!
              </h2>
              <p style={{ opacity: 0.9, position: "relative", zIndex: 1 }}>
                No experience necessary. All levels welcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calendly Widget */}
      <section style={{ padding: "0 0 4rem", background: "var(--dark)" }}>
        <div className="container">
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div
              style={{
                background: "#ffffff",
                color: "#111111",
                borderRadius: "1rem",
                overflow: "hidden",
                boxShadow: "var(--shadow-heavy)",
                border: "1px solid rgba(255,255,255,0.06)",
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
              <span className="badge"><span>Visit Us</span></span>
              <h2 className="heading-md" style={{ marginTop: "1rem", color: "#ffffff" }}>
                Studio <span className="gradient-text">Location</span>
              </h2>
              <p style={{ color: "var(--text-light)", marginTop: "1rem", lineHeight: 1.7 }}>
                Located at the cross intersection of Oakland Park Blvd and Nob Hill in
                Sunrise, FL (Broward County).
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#ffffff" }}>
                  10070 W Oakland Park Blvd
                  <br />
                  Sunrise, FL 33351
                </p>
                <p>
                  <a
                    href="tel:9546625354"
                    style={{ color: "#ef4444", textDecoration: "none", fontWeight: 600 }}
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
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "var(--shadow-heavy)",
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.8040036267397!2d-80.25444768496654!3d26.172024883446398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d905e8b5e0c2e7%3A0x3e8c9f1b9f9b9b9b!2s10070%20W%20Oakland%20Park%20Blvd%2C%20Sunrise%2C%20FL%2033351!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
                width="100%"
                height="300"
                style={{ border: 0, display: "block" }}
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

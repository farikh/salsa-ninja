"use client";

import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
          padding: "6rem 0 8rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: "60%",
            height: "200%",
            background: "radial-gradient(circle, rgba(230, 57, 70, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative" }}>
          <div style={{ maxWidth: "700px" }}>
            <span className="badge" style={{ marginBottom: "1.5rem" }}>
              Try Your First Class for $5
            </span>
            <h1 className="heading-xl" style={{ marginBottom: "1.5rem" }}>
              Ready to become a{" "}
              <span className="text-gradient">Salsa Ninja?</span>
            </h1>
            <p
              style={{
                fontSize: "1.25rem",
                color: "var(--muted-foreground)",
                marginBottom: "2.5rem",
                lineHeight: 1.7,
              }}
            >
              Salsa Ninja Dance Academy is the premier destination for learning
              and mastering the art of Salsa and Bachata. Join now and let the
              rhythm move your body and soul!
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/login" className="btn btn-primary">
                Join Now
              </Link>
              <Link href="/schedule" className="btn btn-outline">
                View Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="badge">What We Offer</span>
            <h2 className="heading-lg" style={{ marginTop: "1rem" }}>
              Quality Dance Instructions
            </h2>
            <p
              style={{
                color: "var(--muted-foreground)",
                maxWidth: "600px",
                margin: "1rem auto 0",
              }}
            >
              Dedicated to social dancing and stage performances. We provide a
              welcoming environment for all levels of dancers.
            </p>
          </div>

          <div className="grid-3">
            {[
              {
                icon: "👥",
                title: "Group Classes",
                description:
                  "Quality group classes for all skill levels. Learn in a fun, social environment with rotating partners.",
              },
              {
                icon: "🎯",
                title: "Private Lessons",
                description:
                  "One-on-one instruction tailored to your goals. Perfect for accelerated learning or special occasions.",
              },
              {
                icon: "🚀",
                title: "Beginner Bootcamps",
                description:
                  "6-week intensive courses designed for absolute beginners. No partner required!",
              },
              {
                icon: "⭐",
                title: "Dance Teams",
                description:
                  "Join our performance teams and take your dancing to the stage. Showcase your skills!",
              },
              {
                icon: "💳",
                title: "Premium Subscriptions",
                description:
                  "Unlimited access plans with exclusive perks including our Telegram community.",
              },
              {
                icon: "📱",
                title: "On-Demand Classes",
                description:
                  "Access our library of video classes anytime, anywhere. Learn at your own pace.",
              },
            ].map((service, index) => (
              <div key={index} className="card">
                <div
                  style={{
                    fontSize: "2.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  {service.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                  }}
                >
                  {service.title}
                </h3>
                <p
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                  }}
                >
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="section section-alt">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "center" }}>
            <div>
              <span className="badge">Our Studio</span>
              <h2 className="heading-lg" style={{ marginTop: "1rem" }}>
                Amenities
              </h2>
              <p
                style={{
                  color: "var(--muted-foreground)",
                  marginTop: "1rem",
                  marginBottom: "2rem",
                  lineHeight: 1.7,
                }}
              >
                At Salsa Ninja Dance Academy, we&apos;re always expanding our
                different class options to meet the needs of our community.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: "1rem",
                }}
              >
                {[
                  "Modern Facility",
                  "Huge Dance Floor",
                  "Snack and Hydration Area",
                  "Seating for Guests",
                  "Mini Lockers & Storage",
                ].map((item, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      fontSize: "1.05rem",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "var(--primary)",
                        color: "white",
                        fontSize: "0.75rem",
                      }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                borderRadius: "1.5rem",
                padding: "3rem",
                color: "white",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                Schedule a Visit
              </h3>
              <p
                style={{
                  opacity: 0.9,
                  marginBottom: "2rem",
                  lineHeight: 1.7,
                }}
              >
                Tour the Salsa Ninja Dance Academy at the intersection of
                Oakland Park Blvd and Nob Hill in Sunrise, FL. Try your first
                group class for just $5!
              </p>
              <Link href="/schedule" className="btn btn-light">
                View Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bootcamp Promo Section */}
      <section className="section">
        <div className="container">
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "3rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "2rem",
              alignItems: "center",
            }}
            className="bootcamp-promo"
          >
            <div>
              <span className="badge">New Session Starting</span>
              <h2 className="heading-md" style={{ marginTop: "1rem" }}>
                Absolute Beginners Salsa Bootcamp
              </h2>
              <p
                style={{
                  color: "var(--muted-foreground)",
                  marginTop: "1rem",
                  marginBottom: "1.5rem",
                  lineHeight: 1.7,
                }}
              >
                This 6 Week Group Course is the perfect opportunity for those
                who&apos;ve never danced before to learn the basics of salsa. No
                partner required!
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  flexWrap: "wrap",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Duration
                  </div>
                  <div style={{ fontWeight: 600 }}>6 Weeks</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Schedule
                  </div>
                  <div style={{ fontWeight: 600 }}>Mon & Wed</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Partner
                  </div>
                  <div style={{ fontWeight: 600 }}>Not Required</div>
                </div>
              </div>
              <Link href="/bootcamp" className="btn btn-primary">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span className="badge">Join the Ninja Fam</span>
            <h2 className="heading-lg" style={{ marginTop: "1rem" }}>
              Stay Updated
            </h2>
            <p
              style={{
                color: "var(--muted-foreground)",
                marginTop: "1rem",
                marginBottom: "2rem",
                lineHeight: 1.7,
              }}
            >
              Sign up for the 8 Class Pass or Unlimited Plan and get access to
              Salsa Ninja&apos;s Community Blog on Telegram. Class homework,
              group events, and more!
            </p>
            <Link href="/login" className="btn btn-primary">
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ alignItems: "center" }}>
            <div>
              <span className="badge">Visit Us</span>
              <h2 className="heading-lg" style={{ marginTop: "1rem" }}>
                Our Location
              </h2>
              <p
                style={{
                  color: "var(--muted-foreground)",
                  marginTop: "1rem",
                  lineHeight: 1.7,
                }}
              >
                Located at the cross intersection of Oakland Park Blvd and Nob
                Hill in Sunrise, FL (Broward County).
              </p>
              <div style={{ marginTop: "2rem" }}>
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
              <Link
                href="/contact"
                className="btn btn-outline"
                style={{ marginTop: "1.5rem" }}
              >
                Get Directions
              </Link>
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
                height="350"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media (min-width: 768px) {
          .bootcamp-promo {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

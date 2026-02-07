"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Scroll reveal with IntersectionObserver
    const revealElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    revealElements.forEach((el) => observer.observe(el));

    // Parallax effect on hero
    const handleScroll = () => {
      const hero = document.getElementById("hero-bg");
      if (hero) {
        const scrollY = window.scrollY;
        hero.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: "#111111",
          overflow: "hidden",
        }}
      >
        {/* Parallax background container */}
        <div
          id="hero-bg"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        >
          {/* Animated diagonal stripe pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(239, 68, 68, 0.04) 40px, rgba(239, 68, 68, 0.04) 42px)",
              animation: "stripeShift 20s linear infinite",
            }}
          />
        </div>

        {/* Diagonal split — right side gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "100%",
            height: "100%",
            clipPath: "polygon(55% 0, 100% 0, 100% 100%, 25% 100%)",
            background:
              "linear-gradient(135deg, #ef4444 0%, #f97316 50%, #ea580c 100%)",
            opacity: 0.15,
            zIndex: 1,
          }}
        />

        {/* Radial red glow at the split edge */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "40%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Hero content */}
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "650px" }}>
            {/* Overline */}
            <div
              className="reveal hero-stagger-1"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "40px",
                  height: "3px",
                  background: "linear-gradient(90deg, #ef4444, #f97316)",
                  borderRadius: "2px",
                }}
              />
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Sunrise, Florida
              </span>
            </div>

            {/* Main heading */}
            <h1
              className="heading-xl reveal hero-stagger-2"
              style={{
                color: "#ffffff",
                marginBottom: "1.5rem",
              }}
            >
              Move Like a{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Ninja.
              </span>
            </h1>

            {/* Tagline */}
            <p
              className="reveal hero-stagger-3"
              style={{
                fontSize: "1.15rem",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                marginBottom: "2.5rem",
                maxWidth: "520px",
              }}
            >
              Salsa Ninja Dance Academy is Sunrise&apos;s home for Salsa On1 and
              Bachata. Step onto the floor, feel the music, and unleash the
              dancer within.
            </p>

            {/* CTAs */}
            <div
              className="reveal hero-stagger-4"
              style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
            >
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.875rem 2rem",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  color: "white",
                  textDecoration: "none",
                  transform: "skewX(-6deg)",
                  transition: "all 0.3s ease",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span style={{ transform: "skewX(6deg)", display: "block" }}>
                  Try Your First Class — $5
                </span>
              </Link>
              <Link
                href="/schedule"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.875rem 2rem",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  background: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  textDecoration: "none",
                  border: "2px solid rgba(255,255,255,0.25)",
                  transform: "skewX(-6deg)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                <span style={{ transform: "skewX(6deg)", display: "block" }}>
                  View Schedule
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section
        style={{
          position: "relative",
          zIndex: 10,
          marginTop: "-50px",
          padding: "0 1.5rem",
        }}
      >
        <div
          className="reveal"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            background: "#222222",
            transform: "skewY(-3deg)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            position: "relative",
          }}
        >
          {/* Top gradient bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "linear-gradient(90deg, #ef4444, #f97316)",
            }}
          />
          <div
            style={{
              transform: "skewY(3deg)",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              padding: "2.5rem 2rem",
            }}
          >
            {[
              { number: "500+", label: "Students & Counting" },
              { number: "8+", label: "Years Teaching" },
              { number: "50+", label: "Socials & Events" },
              { number: "5\u2605", label: "Google Rating" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  position: "relative",
                  padding: "0 1rem",
                }}
              >
                {i > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "10%",
                      height: "80%",
                      width: "1px",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontWeight: 800,
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    lineHeight: 1.2,
                  }}
                >
                  {stat.number}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: "0.25rem",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DANCE STYLES ===== */}
      <section
        style={{
          background: "#ffffff",
          color: "#111111",
          padding: "7rem 0 5rem",
          clipPath: "polygon(0 40px, 100% 0, 100% calc(100% - 40px), 0 100%)",
          marginTop: "-20px",
        }}
      >
        <div className="container">
          {/* Section heading */}
          <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ef4444",
              }}
            >
              What We Teach
            </span>
            <h2
              className="heading-lg"
              style={{ marginTop: "0.75rem", color: "#111111" }}
            >
              Find Your{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Rhythm
              </span>
            </h2>
          </div>

          {/* 2-column grid */}
          <div className="grid-2">
            {[
              {
                tag: "LA Style",
                title: "Salsa On1",
                description:
                  "Master the explosive energy of LA-style Salsa. From foundation to advanced partnerwork and shines, learn to command the dance floor with precision timing and dynamic spins.",
                gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              },
              {
                tag: "Dominican Roots",
                title: "Bachata",
                description:
                  "Feel the sensual rhythm of Bachata. Explore traditional Dominican footwork, modern sensual styling, body waves, and connection techniques that bring this passionate dance to life.",
                gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              },
            ].map((style, i) => (
              <div
                key={i}
                className="reveal"
                style={{
                  background: "#ffffff",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  boxShadow:
                    "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
              >
                {/* Image placeholder */}
                <div
                  style={{
                    height: "240px",
                    background: style.gradient,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 22px)",
                    }}
                  />
                  {/* Skewed tag badge */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "16px",
                      left: "16px",
                      background: "rgba(0,0,0,0.7)",
                      color: "white",
                      padding: "0.375rem 1rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      transform: "skewX(-6deg)",
                    }}
                  >
                    <span
                      style={{ display: "block", transform: "skewX(6deg)" }}
                    >
                      {style.tag}
                    </span>
                  </span>
                </div>
                <div style={{ padding: "1.75rem" }}>
                  <h3
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                      color: "#111111",
                    }}
                  >
                    {style.title}
                  </h3>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                    }}
                  >
                    {style.description}
                  </p>
                </div>
                {/* Gradient bottom border */}
                <div
                  style={{
                    height: "3px",
                    background:
                      "linear-gradient(90deg, #ef4444, #f97316)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCHEDULE SECTION ===== */}
      <section
        style={{
          background: "#111111",
          padding: "7rem 0 5rem",
          clipPath: "polygon(0 0, 100% 40px, 100% 100%, 0 calc(100% - 40px))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Diagonal stripes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(239, 68, 68, 0.03) 60px, rgba(239, 68, 68, 0.03) 62px)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          {/* Section heading */}
          <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ef4444",
              }}
            >
              When We Dance
            </span>
            <h2
              className="heading-lg"
              style={{ marginTop: "0.75rem", color: "#ffffff" }}
            >
              Our{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Schedule
              </span>
            </h2>
          </div>

          {/* Schedule table */}
          <div
            className="reveal"
            style={{
              background: "#1a1a1a",
              borderRadius: "0.75rem",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Left gradient bar */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "3px",
                background: "linear-gradient(180deg, #ef4444, #f97316)",
              }}
            />
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "600px",
                }}
              >
                <thead>
                  <tr>
                    {["Day", "Time", "Class", "Level"].map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "1rem 1.5rem",
                          textAlign: "left",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.4)",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      day: "Monday",
                      time: "6:00 PM - 9:00 PM",
                      class: "Salsa On1 Fundamentals",
                      level: "beginner",
                    },
                    {
                      day: "Monday",
                      time: "7:30 PM - 9:00 PM",
                      class: "Salsa On1 Intermediate",
                      level: "intermediate",
                    },
                    {
                      day: "Tuesday",
                      time: "7:00 PM - 9:00 PM",
                      class: "Bachata Basics",
                      level: "beginner",
                    },
                    {
                      day: "Wednesday",
                      time: "6:00 PM - 9:00 PM",
                      class: "Salsa On1 Open Level",
                      level: "all",
                    },
                    {
                      day: "Wednesday",
                      time: "7:30 PM - 9:00 PM",
                      class: "Bachata Intermediate",
                      level: "intermediate",
                    },
                    {
                      day: "Thursday",
                      time: "7:00 PM - 10:00 PM",
                      class: "Social Dancing & Practica",
                      level: "all",
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td
                        style={{
                          padding: "1rem 1.5rem",
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        {row.day}
                      </td>
                      <td
                        style={{
                          padding: "1rem 1.5rem",
                          color: "rgba(255,255,255,0.6)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {row.time}
                      </td>
                      <td
                        style={{
                          padding: "1rem 1.5rem",
                          color: "#ffffff",
                          fontSize: "0.95rem",
                        }}
                      >
                        {row.class}
                      </td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.75rem",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            transform: "skewX(-6deg)",
                            background:
                              row.level === "beginner"
                                ? "rgba(239, 68, 68, 0.15)"
                                : row.level === "intermediate"
                                ? "rgba(249, 115, 22, 0.15)"
                                : "rgba(239, 68, 68, 0.08)",
                            color:
                              row.level === "beginner"
                                ? "#ef4444"
                                : row.level === "intermediate"
                                ? "#f97316"
                                : "rgba(239, 68, 68, 0.6)",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              transform: "skewX(6deg)",
                            }}
                          >
                            {row.level}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSTRUCTORS SECTION ===== */}
      <section
        style={{
          background: "#1a1a1a",
          padding: "5rem 0",
        }}
      >
        <div className="container">
          <div className="reveal" style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ef4444",
              }}
            >
              Meet The Team
            </span>
            <h2
              className="heading-lg"
              style={{ marginTop: "0.75rem", color: "#ffffff" }}
            >
              Learn From the{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Best
              </span>
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "1.05rem",
              lineHeight: 1.8,
              marginTop: "1.5rem",
              marginBottom: "2.5rem",
            }}>
              Our instructors bring years of experience in LA-style Salsa and Bachata
              to every class. Whether you&apos;re stepping onto the floor for the first
              time or refining your technique, you&apos;ll learn in a supportive environment
              built around community and growth.
            </p>
            <Link
              href="/schedule"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.875rem 2.5rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                color: "white",
                textDecoration: "none",
                transform: "skewX(-6deg)",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ transform: "skewX(6deg)", display: "block" }}>
                Try Your First Class — $5
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF / COMMUNITY CTA ===== */}
      <section
        style={{
          background: "#ffffff",
          color: "#111111",
          padding: "7rem 0 5rem",
          clipPath: "polygon(0 40px, 100% 0, 100% calc(100% - 40px), 0 100%)",
        }}
      >
        <div className="container">
          <div className="reveal" style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ef4444",
              }}
            >
              Community
            </span>
            <h2
              className="heading-lg"
              style={{ marginTop: "0.75rem", color: "#111111" }}
            >
              More Than a{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Dance School
              </span>
            </h2>
            <p style={{
              color: "#6b7280",
              fontSize: "1.05rem",
              lineHeight: 1.8,
              marginTop: "1.5rem",
              marginBottom: "2.5rem",
            }}>
              Salsa Ninja is a family. Monthly socials, workshops with guest
              instructors, bootcamps for absolute beginners, and a community that
              shows up for each other on and off the dance floor.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="https://www.instagram.com/salsaninjadanceacademy/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 2rem",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  color: "white",
                  textDecoration: "none",
                  transform: "skewX(-6deg)",
                  transition: "all 0.3s ease",
                }}
              >
                <span style={{ transform: "skewX(6deg)", display: "block" }}>
                  Follow @salsaninjadanceacademy
                </span>
              </a>
              <Link
                href="/events"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.875rem 2rem",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  background: "transparent",
                  color: "#111111",
                  textDecoration: "none",
                  border: "2px solid rgba(0,0,0,0.15)",
                  transform: "skewX(-6deg)",
                  transition: "all 0.3s ease",
                }}
              >
                <span style={{ transform: "skewX(6deg)", display: "block" }}>
                  Upcoming Events
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section
        style={{
          background: "#111111",
          padding: "7rem 0 5rem",
          clipPath: "polygon(0 0, 100% 40px, 100% 100%, 0 calc(100% - 40px))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Diagonal stripes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(239, 68, 68, 0.02) 80px, rgba(239, 68, 68, 0.02) 82px)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          {/* Section heading */}
          <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ef4444",
              }}
            >
              Membership
            </span>
            <h2
              className="heading-lg"
              style={{ marginTop: "0.75rem", color: "#ffffff" }}
            >
              Choose Your{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Path
              </span>
            </h2>
          </div>

          {/* 3-column pricing grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.1fr 1fr",
              gap: "1.5rem",
              alignItems: "stretch",
            }}
            className="pricing-grid"
          >
            {[
              {
                name: "Drop-In",
                price: "$25",
                period: "/class",
                featured: false,
                features: [
                  "Access to any single class",
                  "Progressive classes & patterns",
                  "No commitment required",
                  "Pay at the door",
                ],
              },
              {
                name: "8 Class",
                price: "$139",
                period: "/month",
                featured: true,
                features: [
                  "8 classes per month",
                  "5% off private lessons",
                  "15% off any bootcamp",
                  "Community group chat access",
                ],
              },
              {
                name: "Unlimited",
                price: "$179",
                period: "/month",
                featured: false,
                features: [
                  "Unlimited classes all month",
                  "7% off private lessons",
                  "20% off any bootcamp",
                  "Community group chat access",
                ],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className="reveal"
                style={{
                  background: plan.featured ? "#1a1a1a" : "#1a1a1a",
                  borderRadius: "0.75rem",
                  padding: "2.5rem 2rem",
                  position: "relative",
                  border: plan.featured
                    ? "2px solid transparent"
                    : "1px solid rgba(255,255,255,0.06)",
                  ...(plan.featured
                    ? {
                        backgroundImage:
                          "linear-gradient(#1a1a1a, #1a1a1a), linear-gradient(135deg, #ef4444, #f97316)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                      }
                    : {}),
                  display: "flex",
                  flexDirection: "column" as const,
                }}
              >
                {plan.featured && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-14px",
                      left: "50%",
                      transform: "translateX(-50%) skewX(-6deg)",
                      background:
                        "linear-gradient(135deg, #ef4444, #f97316)",
                      color: "white",
                      padding: "0.3rem 1.25rem",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{ display: "block", transform: "skewX(6deg)" }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: "1rem",
                  }}
                >
                  {plan.name}
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.25rem",
                    marginBottom: "2rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 800,
                      color: "#ffffff",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 2rem 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    flex: 1,
                  }}
                >
                  {plan.features.map((feature, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "6px",
                          height: "6px",
                          background:
                            "linear-gradient(135deg, #ef4444, #f97316)",
                          transform: "rotate(45deg)",
                          flexShrink: 0,
                        }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "0.875rem 2rem",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    transform: "skewX(-6deg)",
                    transition: "all 0.3s ease",
                    ...(plan.featured
                      ? {
                          background:
                            "linear-gradient(135deg, #ef4444, #f97316)",
                          color: "white",
                        }
                      : {
                          background: "transparent",
                          color: "rgba(255,255,255,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }),
                  }}
                >
                  <span
                    style={{ display: "block", transform: "skewX(6deg)" }}
                  >
                    Get Started
                  </span>
                </Link>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link
              href="/schedule"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.85rem",
                textDecoration: "none",
                fontWeight: 600,
                letterSpacing: "0.05em",
                transition: "color 0.3s ease",
              }}
            >
              View all plans including 5-Class and Showcase/Performance &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===== EVENTS SECTION ===== */}
      <section
        style={{
          background: "#ffffff",
          color: "#111111",
          padding: "7rem 0 5rem",
          clipPath: "polygon(0 40px, 100% 0, 100% calc(100% - 40px), 0 100%)",
        }}
      >
        <div className="container">
          {/* Section heading */}
          <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ef4444",
              }}
            >
              Coming Up
            </span>
            <h2
              className="heading-lg"
              style={{ marginTop: "0.75rem", color: "#111111" }}
            >
              Upcoming{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Events
              </span>
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            maxWidth: "900px",
            margin: "0 auto",
          }} className="events-home-grid">
            {/* Real featured event */}
            <div
              className="reveal"
              style={{
                background: "#ffffff",
                borderRadius: "0.75rem",
                overflow: "hidden",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  height: "180px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 22px)",
                }} />
                <div style={{
                  position: "absolute", bottom: 0, right: 0, width: "100%", height: "60px",
                  background: "#ffffff", clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                }} />
                <span style={{
                  position: "absolute", top: "16px", left: "16px",
                  background: "rgba(0,0,0,0.8)", color: "white",
                  padding: "0.5rem 1rem", fontSize: "0.75rem", fontWeight: 800,
                  letterSpacing: "0.05em", transform: "skewX(-6deg)",
                }}>
                  <span style={{ display: "block", transform: "skewX(6deg)" }}>MONTHLY</span>
                </span>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111111", marginBottom: "0.35rem" }}>
                  Salsa Ninja Dance Social
                </h3>
                <p style={{ color: "#ef4444", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Every 2nd Friday of the Month
                </p>
                <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  DJ, open floor, and the whole Ninja fam together. Salsa class at 9 PM, social dancing &apos;til late. BYOB with light bites and free parking.
                </p>
              </div>
            </div>

            {/* CTA card to see all events */}
            <Link
              href="/events"
              className="reveal"
              style={{
                background: "#111111",
                borderRadius: "0.75rem",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem 2rem",
                textDecoration: "none",
                position: "relative",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(239,68,68,0.04) 30px, rgba(239,68,68,0.04) 32px)",
                pointerEvents: "none",
              }} />
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.5rem", fontSize: "1.5rem", color: "white", position: "relative",
              }}>
                &rarr;
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem", position: "relative" }}>
                View All Events
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", textAlign: "center", position: "relative" }}>
                Socials, workshops, bootcamps, and more
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BOOTCAMP CTA ===== */}
      <section
        style={{
          background: "#ffffff",
          color: "#111111",
          padding: "3rem 0 5rem",
        }}
      >
        <div className="container">
          <div
            className="reveal"
            style={{
              background: "#111111",
              borderRadius: "0.75rem",
              padding: "3.5rem 2.5rem",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(239,68,68,0.04) 40px, rgba(239,68,68,0.04) 42px)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{
                display: "inline-block", padding: "0.375rem 1rem", marginBottom: "1.25rem",
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                background: "linear-gradient(135deg, #ef4444, #f97316)", color: "white",
                transform: "skewX(-6deg)",
              }}>
                <span style={{ display: "block", transform: "skewX(6deg)" }}>New to Salsa?</span>
              </span>
              <h2 className="heading-lg" style={{ color: "#ffffff", marginBottom: "1rem" }}>
                Start With the{" "}
                <span style={{
                  background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>Bootcamp</span>
              </h2>
              <p style={{
                color: "rgba(255,255,255,0.5)", fontSize: "1.05rem", lineHeight: 1.8,
                maxWidth: "550px", margin: "0 auto 2rem",
              }}>
                Our 6-week beginner bootcamp is the perfect way to start. No partner or experience needed.
                Progressive group lessons that take you from zero to the dance floor.
              </p>
              <Link
                href="/bootcamp"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "0.875rem 2.5rem", fontWeight: 700, fontSize: "0.95rem",
                  background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  color: "white", textDecoration: "none", transform: "skewX(-6deg)",
                  transition: "all 0.3s ease",
                }}
              >
                <span style={{ transform: "skewX(6deg)", display: "block" }}>
                  Learn About the Bootcamp
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOCATION + HOURS ===== */}
      <section
        style={{
          background: "#111111",
          padding: "7rem 0 5rem",
          clipPath: "polygon(0 40px, 100% 0, 100% 100%, 0 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Diagonal stripes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(239, 68, 68, 0.03) 60px, rgba(239, 68, 68, 0.03) 62px)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          {/* Section heading */}
          <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#ef4444",
              }}
            >
              Location
            </span>
            <h2
              className="heading-lg"
              style={{ marginTop: "0.75rem", color: "#ffffff" }}
            >
              Come{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Dance
              </span>
            </h2>
          </div>

          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Map placeholder */}
            <div
              className="reveal"
              style={{
                background: "#1a1a1a",
                borderRadius: "0.75rem",
                overflow: "hidden",
                height: "400px",
                position: "relative",
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.8040036267397!2d-80.25444768496654!3d26.172024883446398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d905e8b5e0c2e7%3A0x3e8c9f1b9f9b9b9b!2s10070%20W%20Oakland%20Park%20Blvd%2C%20Sunrise%2C%20FL%2033351!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "grayscale(0.8) brightness(0.8)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Info */}
            <div className="reveal" style={{ padding: "1rem 0" }}>
              {[
                {
                  label: "Address",
                  value: (
                    <>
                      10070 W Oakland Park Blvd
                      <br />
                      Sunrise, FL 33351
                    </>
                  ),
                },
                {
                  label: "Phone",
                  value: (
                    <a
                      href="tel:9546625354"
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        textDecoration: "none",
                      }}
                    >
                      (954) 662-5354
                    </a>
                  ),
                },
                {
                  label: "Email",
                  value: (
                    <a
                      href="mailto:contact@salsaninja.com"
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        textDecoration: "none",
                      }}
                    >
                      contact@salsaninja.com
                    </a>
                  ),
                },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: "1.75rem" }}>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#ef4444",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "1rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}

              {/* Hours */}
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#ef4444",
                    marginBottom: "0.75rem",
                  }}
                >
                  Hours
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {[
                    { day: "Monday", hours: "6:00 PM - 9:00 PM" },
                    { day: "Tuesday", hours: "7:00 PM - 9:00 PM" },
                    { day: "Wednesday", hours: "6:00 PM - 9:00 PM" },
                    { day: "Thursday", hours: "7:00 PM - 10:00 PM" },
                  ].map((schedule, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: "0.6rem",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span
                        style={{
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        {schedule.day}
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {schedule.hours}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

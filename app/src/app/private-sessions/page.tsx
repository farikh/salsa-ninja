"use client";

import { useState, useRef, useEffect } from "react";
import { InlineWidget } from "react-calendly";

export default function PrivateSessionsPage() {
  const instructors = [
    {
      id: "tafari",
      name: "Tafari Higgs",
      initials: "TH",
      color: "#d92635",
      bio: "Tafari is the founder of Salsa Ninja Dance Academy and a passionate instructor with years of experience in L.A. Style Salsa On1 and On2. His teaching style focuses on building strong fundamentals while keeping classes fun and energetic.",
      calendlyUrl: "https://calendly.com/tafari-k-higgs/30min",
    },
  ];

  const [selectedInstructorId, setSelectedInstructorId] = useState(
    instructors[0].id
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getSelectedInstructor = () => {
    return instructors.find((inst) => inst.id === selectedInstructorId);
  };

  const selectedInstructor = getSelectedInstructor();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Avatar component using initials
  const Avatar = ({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="badge">One-on-One</span>
            <h1 className="heading-xl mt-4">Private Lessons</h1>
            <p className="subtitle">
              Accelerate your learning with personalized instruction
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-lg">Book a Session</h2>
            <p className="text-muted-foreground mt-4" style={{ maxWidth: "42rem", margin: "1rem auto 0" }}>
              Private lessons offer personalized instruction tailored to your goals.
              Whether you&apos;re preparing for a special event, want to accelerate your
              learning, or focus on specific techniques, our instructors are here to help.
            </p>
          </div>

          {/* Pricing Info */}
          <div className="grid-2" style={{ maxWidth: "600px", margin: "0 auto 3rem" }}>
            <div className="card text-center">
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
                5 Hour Package
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)" }}>$475</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>$95/hour</div>
            </div>
            <div className="card text-center">
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>
                10 Hour Package
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)" }}>$850</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>$85/hour</div>
            </div>
          </div>

          {instructors.length > 1 && (
            <div className="relative" style={{ maxWidth: "24rem", margin: "0 auto 3rem" }} ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="instructor-select-button"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    initials={selectedInstructor?.initials || ""}
                    color={selectedInstructor?.color || "#d92635"}
                  />
                  <span className="font-semibold text-lg">
                    {selectedInstructor?.name}
                  </span>
                </div>
                <svg
                  style={{
                    width: 20,
                    height: 20,
                    color: "#6b7280",
                    transition: "transform 0.2s",
                    transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="instructor-dropdown">
                  {instructors.map((instructor) => (
                    <div
                      key={instructor.id}
                      onClick={() => {
                        setSelectedInstructorId(instructor.id);
                        setIsDropdownOpen(false);
                      }}
                      className="dropdown-item"
                    >
                      <Avatar initials={instructor.initials} color={instructor.color} />
                      <span className="font-semibold">{instructor.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="instructor-content">
            <div className="instructor-bio">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <Avatar
                  initials={selectedInstructor?.initials || ""}
                  color={selectedInstructor?.color || "#d92635"}
                  size={64}
                />
                <div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                    {selectedInstructor?.name}
                  </h3>
                  <p style={{ color: "var(--primary)", fontSize: "0.9rem" }}>Lead Instructor</p>
                </div>
              </div>
              <p className="text-muted-foreground" style={{ lineHeight: 1.7 }}>
                {selectedInstructor?.bio}
              </p>

              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--secondary)", borderRadius: "1rem" }}>
                <h4 style={{ fontWeight: 600, marginBottom: "1rem" }}>What to Expect</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    "Personalized curriculum based on your goals",
                    "Flexible scheduling to fit your availability",
                    "Video recordings of your sessions (upon request)",
                    "Homework and practice materials",
                  ].map((item, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem", color: "var(--muted-foreground)" }}>
                      <span style={{ color: "var(--primary)" }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="calendly-embed-container">
              <InlineWidget
                url={selectedInstructor?.calendlyUrl || ""}
                styles={{ height: "700px", borderRadius: "1rem" }}
                pageSettings={{
                  backgroundColor: "ffffff",
                  hideEventTypeDetails: false,
                  hideLandingPageDetails: false,
                  primaryColor: "d92635",
                  textColor: "111827",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            <h3 className="heading-md" style={{ marginBottom: "1rem" }}>Important Information</h3>
            <p style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
              All private lesson appointments must be approved 24 hours in advance.
              Cancellations require at least 24 hours notice to reschedule without penalty.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .instructor-select-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .instructor-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 0.5rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          box-shadow: 0 10px 20px rgba(0,0,0,0.07);
          z-index: 10;
          overflow: hidden;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .dropdown-item:hover {
          background-color: var(--secondary);
        }
        .instructor-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: flex-start;
        }
        .instructor-bio {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .calendly-embed-container {
          background: white;
          border-radius: 1rem;
          padding: 1rem;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        @media (min-width: 1024px) {
          .instructor-content {
            grid-template-columns: 1fr 1.5fr;
          }
        }
      `}</style>
    </>
  );
}

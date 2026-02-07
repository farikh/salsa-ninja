"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/schedule", label: "Schedule & Prices" },
    { href: "/bootcamp", label: "Salsa Bootcamp" },
    { href: "/private-sessions", label: "Private Sessions" },
    { href: "/events", label: "Events" },
    { href: "/shoes", label: "Shoes & Apparel" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          background: "rgba(17,17,17,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          height: "72px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "72px",
            }}
          >
            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "4px",
                  height: "20px",
                  background: "linear-gradient(to bottom, #ef4444, #f59e0b)",
                  borderRadius: "2px",
                  transform: "skewX(-12deg)",
                }}
              />
              <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "#fff" }}>
                Salsa
                <span
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Ninja
                </span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="fiery-desktop-nav" style={{ alignItems: "center", gap: "32px" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="fiery-nav-link"
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    position: "relative",
                    paddingBottom: "4px",
                    transition: "color 0.3s ease",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="fiery-nav-link"
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      textDecoration: "none",
                      position: "relative",
                      paddingBottom: "4px",
                      transition: "color 0.3s ease",
                    }}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "rgba(255,255,255,0.85)",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      padding: "10px 24px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      marginLeft: "8px",
                    }}
                    className="fiery-btn-secondary"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="fiery-cta-btn"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    transform: "skewX(-6deg)",
                    transition: "all 0.3s ease",
                    marginLeft: "8px",
                  }}
                >
                  <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="fiery-mobile-btn"
              aria-label="Toggle menu"
              style={{
                display: "none",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                zIndex: 1010,
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "24px",
                  height: "2px",
                  background: "#fff",
                  borderRadius: "2px",
                  transition: "all 0.3s ease",
                  transform: isOpen ? "translateY(7px) rotate(45deg)" : "none",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "24px",
                  height: "2px",
                  background: "#fff",
                  borderRadius: "2px",
                  transition: "all 0.3s ease",
                  opacity: isOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "24px",
                  height: "2px",
                  background: "#fff",
                  borderRadius: "2px",
                  transition: "all 0.3s ease",
                  transform: isOpen ? "translateY(-7px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>

          {/* Mobile Nav Dropdown */}
          <div
            className="fiery-mobile-nav"
            style={{
              display: "none",
              flexDirection: "column",
              gap: "16px",
              padding: isOpen ? "24px 40px 32px" : "0 40px",
              maxHeight: isOpen ? "600px" : "0",
              overflow: "hidden",
              transition: "all 0.4s ease",
              background: "rgba(17,17,17,0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: isOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "1rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  transition: "color 0.3s ease",
                }}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: "#ef4444",
                    fontSize: "1rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    transition: "color 0.3s ease",
                  }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginTop: "8px",
                    textAlign: "center",
                    transition: "all 0.3s ease",
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                style={{
                  display: "block",
                  background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  padding: "12px 24px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  textAlign: "center",
                  marginTop: "8px",
                  transition: "all 0.3s ease",
                }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer to offset fixed navbar */}
      <div style={{ height: "72px" }} />

    </>
  );
};

export default Navbar;

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
    <nav className="main-nav">
      <div className="container">
        <div className="nav-content">
          <Link href="/" className="logo">
            Salsa Ninja
          </Link>

          <div className="desktop-nav">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="btn btn-outline ml-2 py-2 px-5"
              >
                Log out
              </button>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary ml-2 py-2 px-5"
              >
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <span className={`menu-bar ${isOpen ? "bar-1-open" : ""}`} />
            <span className={`menu-bar ${isOpen ? "bar-2-open" : ""}`} />
            <span className={`menu-bar ${isOpen ? "bar-3-open" : ""}`} />
          </button>
        </div>

        <div className={`mobile-nav ${isOpen ? "mobile-nav-open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="mobile-nav-link"
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <button
              onClick={() => { handleLogout(); setIsOpen(false); }}
              className="btn btn-outline mt-2 text-center"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="btn btn-primary mt-2 text-center"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

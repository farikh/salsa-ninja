"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div>
            <h3 className="footer-brand">Salsa Ninja</h3>
            <p className="footer-description">
              Quality dance instructions dedicated to social dancing and stage
              performances. Join the Ninja fam today!
            </p>
            <div className="social-links">
              <a
                href="https://instagram.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-list">
              {[
                { href: "/schedule", label: "Schedule & Prices" },
                { href: "/bootcamp", label: "Salsa Bootcamp" },
                { href: "/events", label: "Events" },
                { href: "/shoes", label: "Shoes & Apparel" },
                { href: "/register", label: "Registration" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-list">
              <li>
                <a href="tel:9546625354" className="footer-link">
                  (954) 662-5354
                </a>
              </li>
              <li>
                <a href="mailto:contact@salsaninja.com" className="footer-link">
                  contact@salsaninja.com
                </a>
              </li>
              <li className="text-white/70 text-[0.95rem] leading-relaxed">
                10070 W Oakland Park Blvd
                <br />
                Sunrise, FL 33351
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Hours</h4>
            <ul className="footer-list">
              {[
                { day: "Monday", hours: "6:00 PM - 9:00 PM" },
                { day: "Tuesday", hours: "7:00 PM - 9:00 PM" },
                { day: "Wednesday", hours: "6:00 PM - 9:00 PM" },
                { day: "Thursday", hours: "7:00 PM - 10:00 PM" },
              ].map((item) => (
                <li key={item.day} className="hour-item">
                  <span>{item.day}</span>
                  <span>{item.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} Salsa Ninja Dance Academy. All
            rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        .main-footer {
          background: var(--foreground);
          color: white;
          padding-top: 4rem;
          padding-bottom: 2rem;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }
        .footer-brand {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--primary-light);
          margin-bottom: 1rem;
        }
        .footer-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          line-height: 1.7;
          max-width: 300px;
        }
        .social-links {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.2s ease;
        }
        .social-icon:hover {
          background: var(--primary);
          transform: translateY(-2px);
        }
        .social-icon svg {
          width: 20px;
          height: 20px;
        }
        .footer-heading {
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
        }
        .footer-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: white;
        }
        .hour-item {
          display: flex;
          justify-content: space-between;
          max-width: 220px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          text-align: center;
        }
        .copyright {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
          margin: 0;
        }

        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .footer-bottom {
            flex-direction: row;
            justify-content: space-between;
          }
        }
        @media (min-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-top">
          {/* Brand Column */}
          <div className="brand-column">
            <div className="footer-logo">
              <span className="logo-bar">|</span>
              <span className="logo-salsa">Salsa</span>
              <span className="logo-ninja">Ninja</span>
            </div>
            <p className="footer-description">
              Quality dance instructions dedicated to social dancing and stage
              performances. Join the Ninja fam today!
            </p>
            <div className="social-icons">
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

          {/* Quick Links */}
          <div>
            <h4 className="column-heading">Quick Links</h4>
            <ul className="column-list">
              {[
                { href: "/schedule", label: "Schedule & Prices" },
                { href: "/bootcamp", label: "Salsa Bootcamp" },
                { href: "/events", label: "Events" },
                { href: "/shoes", label: "Shoes & Apparel" },
                { href: "/register", label: "Registration" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="column-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="column-heading">Contact</h4>
            <ul className="column-list">
              <li>
                <a href="tel:9546625354" className="column-link">
                  (954) 662-5354
                </a>
              </li>
              <li>
                <a href="mailto:contact@salsaninja.com" className="column-link">
                  contact@salsaninja.com
                </a>
              </li>
              <li className="address-text">
                10070 W Oakland Park Blvd
                <br />
                Sunrise, FL 33351
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="column-heading">Hours</h4>
            <ul className="hours-list">
              {[
                { day: "Monday", hours: "6:00 PM - 9:00 PM" },
                { day: "Tuesday", hours: "7:00 PM - 9:00 PM" },
                { day: "Wednesday", hours: "6:00 PM - 9:00 PM" },
                { day: "Thursday", hours: "7:00 PM - 10:00 PM" },
              ].map((item, index) => (
                <li key={item.day} className={`hour-row${index > 0 ? " hour-row-border" : ""}`}>
                  <span className="hour-day">{item.day}</span>
                  <span className="hour-time">{item.hours}</span>
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
          <div className="bottom-social">
            <a
              href="https://instagram.com/salsaninjadanceacademy"
              target="_blank"
              rel="noopener noreferrer"
              className="bottom-social-link"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/salsaninjadanceacademy"
              target="_blank"
              rel="noopener noreferrer"
              className="bottom-social-link"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .main-footer {
          background: #111111;
          color: white;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 60px 0 40px;
          position: relative;
        }
        .main-footer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(to right, #ef4444, #f59e0b);
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .footer-top {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 30px;
          padding-bottom: 40px;
        }

        /* Brand Column */
        .brand-column {
          display: flex;
          flex-direction: column;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 16px;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .logo-bar {
          color: #ef4444;
          margin-right: 8px;
          font-weight: 300;
        }
        .logo-salsa {
          color: white;
        }
        .logo-ninja {
          background: linear-gradient(135deg, #ef4444, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .footer-description {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.7;
          max-width: 280px;
          margin: 0;
        }
        .social-icons {
          display: inline-flex;
          gap: 20px;
          margin-top: 20px;
        }
        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.2s ease;
        }
        .social-icon:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          transform: translateY(-2px);
        }
        .social-icon svg {
          width: 18px;
          height: 18px;
        }

        /* Column Headers */
        .column-heading {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
          margin: 0 0 18px 0;
        }

        /* Column Lists & Links */
        .column-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .column-link {
          color: rgba(255, 255, 255, 0.55);
          text-decoration: none;
          font-size: 0.88rem;
          transition: color 0.2s ease;
        }
        .column-link:hover {
          color: #ef4444;
        }
        .address-text {
          color: rgba(255, 255, 255, 0.55);
          font-size: 0.88rem;
          line-height: 1.6;
        }

        /* Hours */
        .hours-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .hour-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .hour-row-border {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .hour-day {
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .hour-time {
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.83rem;
        }

        /* Footer Bottom */
        .footer-bottom {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }
        .copyright {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.25);
          margin: 0;
        }
        .bottom-social {
          display: flex;
          flex-direction: row;
          gap: 20px;
        }
        .bottom-social-link {
          color: rgba(255, 255, 255, 0.35);
          text-decoration: none;
          font-size: 0.8rem;
          transition: color 0.2s ease;
        }
        .bottom-social-link:hover {
          color: #ef4444;
        }

        /* Responsive: 900px - 2 columns */
        @media (max-width: 900px) {
          .footer-top {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Responsive: 600px - 1 column, stacked bottom */
        @media (max-width: 600px) {
          .footer-top {
            grid-template-columns: 1fr;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

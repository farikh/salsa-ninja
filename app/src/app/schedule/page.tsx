"use client";

import Link from "next/link";

export default function SchedulePage() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday"];
  const times = ["6P-7P", "7P-8P", "8P-9P", "9P-10P", "10P-11P"];

  // Lighter, modern color palette - moved to CSS-in-JS
  const schedule: Record<
    string,
    Record<
      string,
      { name: string; level: string; colorKey: string } | null
    >
  > = {
    Monday: {
      "6P-7P": {
        name: "Absolute Beginners Salsa On 1 Bootcamp",
        level: "Bootcamp",
        colorKey: "bootcamp",
      },
      "7P-8P": {
        name: "L.A. Salsa On 1",
        level: "LVL 1-2 Shine & Partner",
        colorKey: "intermediate",
      },
      "8P-9P": { name: "Bachata", level: "Open Level", colorKey: "openLevel" },
      "9P-10P": {
        name: "Absolute Beginners Salsa On 1 Bootcamp",
        level: "Bootcamp",
        colorKey: "bootcamp",
      },
      "10P-11P": null,
    },
    Tuesday: {
      "6P-7P": null,
      "7P-8P": {
        name: "Salsa On 2",
        level: "LVL 1&2 Shine & Partner",
        colorKey: "intermediate",
      },
      "8P-9P": {
        name: "Salsa Caleña",
        level: "Level 1 & 2",
        colorKey: "bootcamp",
      },
      "9P-10P": { name: "Team Training", level: "9PM-11PM", colorKey: "team" },
      "10P-11P": { name: "Team Training", level: "Continued", colorKey: "team" },
    },
    Wednesday: {
      "6P-7P": {
        name: "Absolute Beginners Salsa On 1 Bootcamp",
        level: "Bootcamp",
        colorKey: "bootcamp",
      },
      "7P-8P": {
        name: "L.A. Salsa On 1",
        level: "LVL 2-3 Shine & Partner",
        colorKey: "intermediate",
      },
      "8P-9P": { name: "Bachata", level: "Open Levels", colorKey: "openLevel" },
      "9P-10P": {
        name: "Absolute Beginners Salsa On 1 Bootcamp",
        level: "Bootcamp",
        colorKey: "bootcamp",
      },
      "10P-11P": null,
    },
    Thursday: {
      "6P-7P": null,
      "7P-8P": {
        name: "Salsa On 1",
        level: "Freestyle Fusion",
        colorKey: "intermediate",
      },
      "8P-9P": {
        name: "Salsa On 2",
        level: "Level 2-3 Partnerwork",
        colorKey: "openLevel",
      },
      "9P-10P": { name: "Team Training", level: "9PM-11PM", colorKey: "team" },
      "10P-11P": { name: "Team Training", level: "Continued", colorKey: "team" },
    },
  };

  const pricing = [
    {
      name: "Drop In Class",
      price: "$25",
      period: "Pay As You Go",
      features: [
        "NOT for absolute beginners",
        "Does not apply to bootcamp",
        "Progressive classes & patterns",
        "No commitment / No group chat",
      ],
      highlight: false,
    },
    {
      name: "5 Class Subscription",
      price: "$99",
      period: "per month",
      features: [
        "5 classes per month",
        "3% off private lessons",
        "10% off any bootcamp",
      ],
      highlight: false,
    },
    {
      name: "8 Class Subscription",
      price: "$139",
      period: "per month",
      features: [
        "8 classes per month",
        "5% off private lessons",
        "15% off any bootcamp",
      ],
      highlight: true,
    },
    {
      name: "Unlimited Subscription",
      price: "$179",
      period: "per month",
      features: [
        "Unlimited passes",
        "7% off private lessons",
        "20% off any bootcamp",
      ],
      highlight: false,
    },
    {
      name: "Showcase / Performance Teams",
      price: "$209",
      period: "per month",
      features: [
        "Unlimited class subscription included",
        "Accelerated training & opportunities",
        "Mandatory 4-5 group classes per week",
        "1 FREE Salsa Ninja gear",
        "$5 off SNDA dance social",
        "10% off private lessons",
      ],
      highlight: false,
      special: true,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <span className="badge">Plan Your Week</span>
            <h1 className="heading-xl mt-4">Class Schedule</h1>
            <p className="subtitle">Schedule is subject to change</p>
          </div>
        </div>
      </section>

      {/* Weekly Calendar View */}
      <section className="section">
        <div className="container">
          <div className="overflow-x-auto">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="time-header">Time</th>
                  {days.map((day) => (
                    <th key={day} className="day-header">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((time, timeIndex) => (
                  <tr key={time}>
                    <td className="time-cell">{time}</td>
                    {days.map((day) => {
                      const cls = schedule[day][time];
                      return (
                        <td
                          key={`${day}-${time}`}
                          className={`class-cell ${
                            !cls ? (timeIndex % 2 === 0 ? "bg-gray-50" : "bg-white") : ""
                          }`}
                        >
                          {cls && (
                            <div className={`class-card ${cls.colorKey}`}>
                              <div className="class-name">{cls.name}</div>
                              <div className="class-level">{cls.level}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="legend">
            {[
              { colorKey: "bootcamp", label: "Bootcamp / Beginner" },
              { colorKey: "intermediate", label: "Intermediate" },
              { colorKey: "openLevel", label: "Open Level" },
              { colorKey: "team", label: "Team Training" },
            ].map((item) => (
              <div key={item.label} className="legend-item">
                <div className={`legend-color-box ${item.colorKey}`} />
                <span className="legend-label">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Bootcamp Note */}
          <div className="bootcamp-note">
            <p>Bootcamp Classes: January 12th - February 18th</p>
            <p className="text-sm">
              6PM-7P and/or 9PM-10P sessions available (you can attend both!)
            </p>
          </div>
        </div>
      </section>

      {/* Fridays, Saturdays & Sundays */}
      <section className="section section-alt">
        <div className="container">
          <div className="text-center mb-12">
            <span className="badge">Weekends</span>
            <h2 className="heading-lg mt-4">Fridays, Saturdays & Sundays</h2>
          </div>

          <div className="grid-3">
            <div className="card text-center">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="font-bold mb-4 text-xl">Private Lessons</h3>
              <p className="text-muted-foreground text-sm mb-6">
                All appointments must be approved 24 hours in advance
              </p>
              <div className="border-t border-border pt-4">
                <div className="mb-3">
                  <span className="font-semibold">5 Hour Package:</span>{" "}
                  <span className="text-primary font-bold">$475</span>
                </div>
                <div>
                  <span className="font-semibold">10 Hour Package:</span>{" "}
                  <span className="text-primary font-bold">$850</span>
                </div>
              </div>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="font-bold mb-4 text-xl">Events & Socials</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Every 2nd Friday of each month - Salsa Ninja Dance Academy
                Social
              </p>
              <div className="border-t border-border pt-4">
                <div className="mb-3">
                  <span className="font-semibold">Online Pre-Sale:</span>{" "}
                  <span className="text-primary font-bold">$15</span>
                </div>
                <div>
                  <span className="font-semibold">At The Door:</span>{" "}
                  <span className="text-primary font-bold">$20</span>
                </div>
              </div>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="font-bold mb-4 text-xl">Team Practice</h3>
              <p className="text-muted-foreground text-sm mb-6">
                For additional practice, choreography cleaning and team bonding
              </p>
              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground italic">
                  Availability Based
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Prices */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <span className="badge">Subscription Prices</span>
            <h2 className="heading-lg mt-4">Choose Your Plan</h2>
            <p className="text-muted-foreground mt-3 text-base">
              All packages are subscription-based and charged recurringly every
              1st or 15th monthly
            </p>
            <p className="text-primary mt-2 font-semibold">
              Try your first class for just $5!
            </p>
          </div>

          <div className="grid-4 mb-8">
            {pricing.slice(0, 4).map((plan, index) => (
              <div
                key={index}
                className={`card relative flex flex-col ${
                  plan.highlight ? "border-2 border-primary" : "border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="most-popular-badge">Most Popular</div>
                )}
                <h3 className="text-lg font-bold text-center">
                  {plan.name}
                </h3>
                <div className="text-center my-4">
                  <span className="text-4xl font-extrabold text-primary">
                    {plan.price}
                  </span>
                  <div className="text-muted-foreground text-sm">
                    {plan.period}
                  </div>
                </div>
                <ul className="list-none p-0 m-0 flex-1 text-sm">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 mb-2 text-muted-foreground"
                    >
                      <span className="text-primary shrink-0">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={
                    plan.highlight
                      ? "btn btn-primary w-full mt-6"
                      : "btn btn-outline w-full mt-6"
                  }
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          <div className="performance-card">
            <div className="text-center mb-6">
              <span className="performance-badge">For Committed Students</span>
            </div>
            <div className="performance-grid">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">
                  Showcase / Performance Teams
                </h3>
                <p className="opacity-80 mb-4">
                  This package is for committed students who desire to truly
                  learn the full art of dance
                </p>
                <div>
                  <span className="text-5xl font-extrabold">$209</span>
                  <span className="opacity-70 ml-2">per month</span>
                </div>
              </div>
              <div>
                <div className="features-grid">
                  {pricing[4].features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="feature-checkmark">✓</span>
                      <span className="text-base">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link href="/register" className="btn btn-primary">
                    Join Performance Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-alt">
        <div className="container">
          <div className="cta-card">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Dancing?</h2>
            <p className="opacity-90 mb-8 max-w-md mx-auto">
              Register now and try your first class for just $5. No experience
              necessary!
            </p>
            <Link href="/register" className="btn btn-light">
              Register Now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

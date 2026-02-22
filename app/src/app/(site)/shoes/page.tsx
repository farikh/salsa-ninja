import Link from "next/link";

export default function ShoesPage() {
  const shoeCategories = [
    {
      name: "Ladies Shoes",
      description: "RoseMoli Women's Latin Dance Shoes - Perfect for beginners",
      link: "https://amzn.to/41fdL2l",
      type: "Low Heel",
    },
    {
      name: "Ladies Heels",
      description: "Professional Ballroom Salsa Practice Performance Dance Shoes",
      link: "https://amzn.to/41hv7f0",
      type: "High Heel",
    },
    {
      name: "Jazz Shoes",
      description: "Linodes Unisex Leather Upper Jazz Shoe - Slip-on style",
      link: "https://amzn.to/3XaD3NR",
      type: "Unisex",
    },
    {
      name: "Men's Shoes",
      description: "Professional men's Latin dance shoes for all levels",
      link: "https://amzn.to/4hWTGW0",
      type: "Men",
    },
  ];

  const partnerBrands = [
    {
      name: "Fuego Dance",
      description: "Premium dance shoes with exclusive designs",
      link: "https://fuegodance.com/discount/SALSANINJA",
      discount: "Use code SALSANINJA for discount",
    },
    {
      name: "Dapper-D",
      description: "Stylish dance shoes for the modern dancer",
      link: "https://dapper-d.com/",
      discount: "Check for exclusive deals",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: "var(--dark)",
          padding: "5rem 0 6rem",
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
            background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <span className="badge"><span>Gear Up</span></span>
            <h1 className="heading-xl" style={{ marginTop: "1.5rem", color: "var(--foreground)" }}>
              Shoes & <span className="gradient-text">Apparel</span>
            </h1>
            <p style={{ color: "var(--text-light)", fontSize: "1.1rem", marginTop: "1rem" }}>
              Salsa Ninja&apos;s go-to guide for shoes and when to wear them!
            </p>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section style={{ padding: "3rem 0", background: "var(--dark)" }}>
        <div className="container">
          <div className="cta-card">
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
              Appropriate Dance Shoes are MANDATORY
            </h2>
            <p style={{ opacity: 0.9, position: "relative", zIndex: 1 }}>
              All students must wear proper dance shoes during classes and events.
            </p>
          </div>
        </div>
      </section>

      {/* Why Dance Shoes */}
      <section className="section diagonal-stripes" style={{ paddingTop: "2rem" }}>
        <div className="container">
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              background: "var(--dark-2)",
              borderRadius: "1.5rem",
              padding: "2.5rem",
              border: "1px solid rgba(255,255,255,0.06)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, var(--primary), var(--primary-light))",
              }}
            />
            <h2 className="heading-md" style={{ marginBottom: "1.5rem", color: "var(--foreground)" }}>
              Why Dance Shoes <span className="gradient-text">Matter</span>
            </h2>
            <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text-light)" }}>
              The main difference between <strong style={{ color: "var(--foreground)" }}>BALLROOM DANCE SHOES / DANCER SNEAKERS</strong>{" "}
              and <strong style={{ color: "var(--foreground)" }}>CASUAL SHOES</strong> is that dance shoes have special suede soles
              or material which is smooth enough to allow easier pivot and turning motions on
              specific dance floors.
            </p>
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--foreground)" }}>
                Benefits of Proper Dance Shoes:
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "Easier pivot and turning motions",
                  "Flexibility and highlighted foot mobility",
                  "Smooth movement across the dance floor",
                  "Prevention of hip and joint injuries",
                  "Better balance and control",
                ].map((benefit, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.75rem",
                      fontSize: "1rem",
                      color: "var(--text-light)",
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
                        background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                        color: "white",
                        fontSize: "0.7rem",
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Latin Ballroom Shoes */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-heading">
            <div className="overline">
              <span>Recommended</span>
            </div>
            <h2>
              Latin Ballroom <span className="gradient-text">Shoes</span>
            </h2>
            <p>Best for spins and pivoting on floors like hardwood</p>
          </div>

          <div className="grid-4">
            {shoeCategories.map((shoe, index) => (
              <a
                key={index}
                href={shoe.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                    fontSize: "2rem",
                  }}
                >
                  👟
                </div>
                <span
                  className="badge"
                  style={{ marginBottom: "0.75rem", display: "inline-block" }}
                >
                  <span>{shoe.type}</span>
                </span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--foreground)" }}>
                  {shoe.name}
                </h3>
                <p style={{ color: "var(--text-light)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  {shoe.description}
                </p>
                <span className="gradient-text" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Shop on Amazon →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Brands */}
      <section className="section diagonal-stripes">
        <div className="container">
          <div className="section-heading">
            <div className="overline">
              <span>Exclusive Partners</span>
            </div>
            <h2>
              Partner <span className="gradient-text">Brands</span>
            </h2>
            <p>Exclusive dance shoes with special discount codes!</p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--primary-light) 12%, transparent))",
              border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
              padding: "1.5rem",
              textAlign: "center",
              marginBottom: "2rem",
              transform: "skewX(-3deg)",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "1.1rem", transform: "skewX(3deg)" }}>
              <span style={{ color: "var(--text-light)" }}>AFFILIATE DISCOUNT CODE: </span>
              <span className="gradient-text" style={{ fontSize: "1.5rem" }}>SALSANINJA</span>
            </p>
          </div>

          <div className="grid-2">
            {partnerBrands.map((brand, index) => (
              <a
                key={index}
                href={brand.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem", color: "var(--foreground)" }}>
                  {brand.name}
                </h3>
                <p style={{ color: "var(--text-light)", marginBottom: "1.25rem" }}>
                  {brand.description}
                </p>
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                    color: "white",
                    padding: "0.5rem 1.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    transform: "skewX(-6deg)",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
                    {brand.discount}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
            <h2 className="heading-md" style={{ marginBottom: "1rem", color: "var(--foreground)" }}>
              Ready to <span className="gradient-text">Dance?</span>
            </h2>
            <p style={{ color: "var(--text-light)", marginBottom: "2rem" }}>
              Got your shoes? Register for classes and start your dance journey!
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" className="btn btn-primary">
                <span>Register for Classes</span>
              </Link>
              <Link href="/bootcamp" className="btn btn-outline">
                <span>Join Bootcamp</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

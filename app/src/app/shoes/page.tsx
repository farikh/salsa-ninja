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
          background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
          padding: "4rem 0 5rem",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
            <span className="badge">Gear Up</span>
            <h1 className="heading-xl" style={{ marginTop: "1rem" }}>
              Shoes & Apparel
            </h1>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "1.1rem",
                marginTop: "1rem",
              }}
            >
              Salsa Ninja&apos;s go-to guide for shoes and when to wear them!
            </p>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section style={{ padding: "3rem 0" }}>
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
              borderRadius: "1.5rem",
              padding: "2rem",
              color: "white",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              ⚠️ Appropriate Dance Shoes are MANDATORY
            </h2>
            <p style={{ opacity: 0.9 }}>
              All students must wear proper dance shoes during classes and events.
            </p>
          </div>
        </div>
      </section>

      {/* Why Dance Shoes */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card" style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h2 className="heading-md" style={{ marginBottom: "1.5rem" }}>
              Why Dance Shoes Matter
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.8,
                color: "var(--muted-foreground)",
              }}
            >
              The main difference between <strong>BALLROOM DANCE SHOES / DANCER SNEAKERS</strong>{" "}
              and <strong>CASUAL SHOES</strong> is that dance shoes have special suede soles
              or material which is smooth enough to allow easier pivot and turning motions on
              specific dance floors.
            </p>
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
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
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="badge">Recommended</span>
            <h2 className="heading-lg" style={{ marginTop: "1rem" }}>
              Latin Ballroom Shoes
            </h2>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
              Best for spins and pivoting on floors like hardwood
            </p>
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
                    background: "var(--secondary)",
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
                  {shoe.type}
                </span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  {shoe.name}
                </h3>
                <p
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "0.9rem",
                    marginBottom: "1rem",
                  }}
                >
                  {shoe.description}
                </p>
                <span style={{ color: "var(--primary)", fontWeight: 500, fontSize: "0.9rem" }}>
                  Shop on Amazon →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Brands */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="badge">Exclusive Partners</span>
            <h2 className="heading-lg" style={{ marginTop: "1rem" }}>
              Partner Brands
            </h2>
            <p style={{ color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
              Exclusive dance shoes with special discount codes!
            </p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)",
              borderRadius: "1rem",
              padding: "1.5rem",
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--primary)", fontSize: "1.1rem" }}>
              AFFILIATE DISCOUNT CODE: <span style={{ fontSize: "1.5rem" }}>SALSANINJA</span>
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
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                  {brand.name}
                </h3>
                <p
                  style={{
                    color: "var(--muted-foreground)",
                    marginBottom: "1rem",
                  }}
                >
                  {brand.description}
                </p>
                <span
                  style={{
                    background: "var(--primary)",
                    color: "white",
                    padding: "0.5rem 1.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  {brand.discount}
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
            <h2 className="heading-md" style={{ marginBottom: "1rem" }}>
              Ready to Dance?
            </h2>
            <p style={{ color: "var(--muted-foreground)", marginBottom: "2rem" }}>
              Got your shoes? Register for classes and start your dance journey!
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" className="btn btn-primary">
                Register for Classes
              </Link>
              <Link href="/bootcamp" className="btn btn-outline">
                Join Bootcamp
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

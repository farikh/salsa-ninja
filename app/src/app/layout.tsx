import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Salsa Ninja Dance Academy | Salsa & Bachata Classes in Sunrise, FL",
  description:
    "Learn Salsa and Bachata at Salsa Ninja Dance Academy in Sunrise, FL. Quality dance instructions for all levels. Try your first class for $5!",
  keywords: [
    "salsa classes",
    "bachata classes",
    "dance lessons",
    "Sunrise FL",
    "Broward County",
    "Latin dance",
    "salsa bootcamp",
    "dance academy",
  ],
  openGraph: {
    title: "Salsa Ninja Dance Academy",
    description:
      "The premier destination for learning Salsa and Bachata in South Florida.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { getTenantFromHeaders, getThemeConfig } from "@/lib/tenant/server";
import { TenantProvider } from "@/lib/tenant/context";
import { ThemeStyleInjector } from "@/components/theme-provider";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  const name = tenant?.name || "Dance Studio Platform";

  return {
    title: name,
    description: tenant
      ? `${tenant.name} - Dance studio community platform`
      : "Multi-tenant dance studio community platform",
    openGraph: {
      title: name,
      description: tenant
        ? `${tenant.name} - Dance studio community platform`
        : "Multi-tenant dance studio community platform",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenantFromHeaders();
  const theme = tenant?.theme_id
    ? await getThemeConfig(tenant.theme_id)
    : null;

  return (
    <html lang="en">
      <head>
        <ThemeStyleInjector config={theme} />
      </head>
      <body>
        <TenantProvider tenant={tenant} theme={theme}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}

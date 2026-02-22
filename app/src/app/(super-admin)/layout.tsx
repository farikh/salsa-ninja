export const metadata = {
  title: 'Platform Admin',
  description: 'Super admin panel for platform management',
}

export default function SuperAdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

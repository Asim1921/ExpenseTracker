import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Earnings Management',
  description: 'Manage your projects, expenses, and profit distribution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


import type { Metadata } from 'next'
import { Playfair_Display, Lora } from 'next/font/google'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/layout/ToastProvider'
import './globals.css'

// ── Google Fonts ───────────────────────────────────────────────
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
})

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
  weight: ['400', '500', '600', '700'],
})

// ── Metadata ───────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Rattlesnake Ridge Homestead Hub',
  description: 'Personal homestead management for Sarah & Kyle — 44 acres in West Texas',
}

// ── Root Layout ────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${lora.variable}`}>
      <body>
        <ToastProvider>
          {/* Fixed left sidebar */}
          <Sidebar />

          {/* Main content — offset by sidebar width */}
          <main className="ml-56 min-h-screen">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  )
}

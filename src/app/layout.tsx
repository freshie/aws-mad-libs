import type { Metadata } from 'next'
import { GameProvider } from '@/contexts/GameContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Mad Libs Party Game',
  description: 'Create hilarious stories with friends using AI-generated content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-game">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
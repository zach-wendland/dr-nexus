import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dr. Nexus - Medical Knowledge Base',
  description: 'Production-ready medical data processing system with FHIR/C-CDA ingestion, AI analysis, and interactive dashboard',
  keywords: ['medical', 'healthcare', 'FHIR', 'HL7', 'knowledge base', 'AI analysis'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dr. Nexus Medical Dashboard',
  description: 'Comprehensive medical data visualization and health tracking platform with stunning visualizations',
  keywords: ['medical', 'health', 'dashboard', 'visualization', 'patient records', 'FHIR', 'HL7'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}

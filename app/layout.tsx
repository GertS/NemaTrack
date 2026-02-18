import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NemaTrack',
  description: 'MVP voor beheer en visualisatie van aaltjesuitslagen'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href="/fields">Fields</Link>
          <Link href="/upload">Upload</Link>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}

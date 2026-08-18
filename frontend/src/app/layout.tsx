import type { Metadata } from 'next';
import '../styles/globals.css';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import SmoothScrollProvider from '@/components/common/SmoothScrollProvider';

export const metadata: Metadata = {
  title: 'Global Masters Scholarship Matcher | Data-Honest Funding Engine',
  description: 'Match prospective master’s programs worldwide using verified published formulas, UN M49 geography, and crowdsourced student distributions.',
  keywords: 'scholarship matcher, master degree scholarships, DAAD, Chevening, university funding, GPA scholarship calculator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-porcelain text-slate-navy antialiased selection:bg-royal selection:text-white min-h-screen flex flex-col">
        <SmoothScrollProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}

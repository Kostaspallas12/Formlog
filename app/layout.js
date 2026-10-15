import './globals.css';
import { Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const font = Manrope({
  subsets: ['greek', 'latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'FormLog',
  description: 'Κράτα όλες τις φωτογραφίες προόδου σου σε ένα ιδιωτικό αρχείο και δες πόσο έχεις αλλάξει.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="el" className={font.variable} data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <Header />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

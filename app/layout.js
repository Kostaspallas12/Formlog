import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SiteChrome from '@/components/SiteChrome';

export const metadata = {
  title: 'FormLog',
  description: 'Κράτα όλες τις φωτογραφίες προόδου σου σε ένα ιδιωτικό αρχείο και δες πόσο έχεις αλλάξει.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="el" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <SiteChrome header={<Header />} footer={<Footer />}>{children}</SiteChrome>
        </AuthProvider>
      </body>
    </html>
  );
}

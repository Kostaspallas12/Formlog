import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SiteChrome from '@/components/SiteChrome';

const description = 'Κράτα όλες τις φωτογραφίες προόδου σου σε ένα ιδιωτικό αρχείο και δες πόσο έχεις αλλάξει.';

export const metadata = {
  // Η πλήρης διεύθυνση του site (για την προεπισκόπηση σε εφαρμογές μηνυμάτων και social media). Με δικό μας domain: NEXT_PUBLIC_SITE_URL.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://formlog-rust.vercel.app'),
  title: 'FormLog',
  description,
  // Η εικόνα της κάρτας είναι το app/opengraph-image.png (και το twitter-image.png).
  openGraph: { type: 'website', siteName: 'FormLog', title: 'FormLog · Δες πόσο έχεις αλλάξει', description, locale: 'el_GR' },
  twitter: { card: 'summary_large_image', title: 'FormLog · Δες πόσο έχεις αλλάξει', description },
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

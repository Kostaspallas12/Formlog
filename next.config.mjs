// Security headers σε όλες τις σελίδες.
const securityHeaders = [
  // Κανένα άλλο site δεν μπορεί να «φορτώσει» το FormLog μέσα του (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Ο browser δεν «μαντεύει» τύπο αρχείου.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Σε εξωτερικά links δεν φεύγει η πλήρης διεύθυνση (π.χ. ο σύνδεσμος πρόσκλησης), μόνο το site.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Χωρίς μικρόφωνο / τοποθεσία· κάμερα μόνο για το ίδιο το site.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;

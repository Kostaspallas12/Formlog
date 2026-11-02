// Το λογότυπο του FormLog: λευκό F σε πράσινο τετράγωνο,
// με μια μικρή πορτοκαλί λεπτομέρεια. Ίδια χρώματα σε φωτεινό και σκούρο θέμα (όπως κάθε λογότυπο).
// (Το ίδιο σχέδιο υπάρχει στο app/icon.svg για την καρτέλα του browser και στο proxy.js.)
export const LOGO_PATHS = (
  <>
    <rect width="64" height="64" rx="15" fill="#0e8a6b" />
    <path
      d="M23 44V20h17a2.5 2.5 0 0 1 2.5 2.5v2.5A2.5 2.5 0 0 1 40 27.5H30.5v3.5h7a2.5 2.5 0 0 1 2.5 2.5v2A2.5 2.5 0 0 1 37.5 38h-7v6a2.5 2.5 0 0 1-2.5 2.5h-2.5A2.5 2.5 0 0 1 23 44z"
      fill="#fff"
    />
    <rect x="38" y="39" width="5" height="7.5" rx="2.5" fill="#e8a33d" />
  </>
);

export default function LogoMark({ size = 28, className = '' }) {
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {LOGO_PATHS}
    </svg>
  );
}

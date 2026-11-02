// Το λογότυπο του FormLog: λευκό F με ένα τικ, σε πράσινο τετράγωνο.
// Ίδια χρώματα σε φωτεινό και σκούρο θέμα (όπως κάθε λογότυπο).
// (Το ίδιο σχέδιο υπάρχει στο app/icon.svg για την καρτέλα του browser, στο proxy.js και στο lib/planPdf.js.)
export const LOGO_PATHS = (
  <>
    <rect width="64" height="64" rx="15" fill="#14b478" />
    <path
      d="M15.4 12.1H49.6a4 4 0 0 1 4 4V19a5.2 5.2 0 0 1-5.2 5.2H21.1a1 1 0 0 0-1 1V48.8a4.85 4.85 0 0 1-9.7 0V17.1a5 5 0 0 1 5-5z"
      fill="#fff"
    />
    <rect x="23" y="29.9" width="26.5" height="8.7" rx="3.4" fill="#fff" />
    <path d="M40.6 17.4l2.7 2.8 7.2-9" fill="none" stroke="#14b478" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

export default function LogoMark({ size = 28, className = '' }) {
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {LOGO_PATHS}
    </svg>
  );
}

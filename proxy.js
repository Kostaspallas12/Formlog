import { NextResponse } from 'next/server';

// «Υπό κατασκευή»: όταν στο Vercel υπάρχει UNDER_CONSTRUCTION=true, όλες οι σελίδες
// απαντούν με την παρακάτω σελίδα. Τοπικά (χωρίς τη ρύθμιση) το site δουλεύει κανονικά.
//
// Μυστικό πέρασμα για τον ιδιοκτήτη: αν οριστεί UNDER_CONSTRUCTION_BYPASS=<κωδικός>, τότε το
//   https://…/?preview=<κωδικός>   ανοίγει το πραγματικό site σε αυτόν τον browser (cookie 30 ημερών)
//   https://…/?preview=off         το κλείνει ξανά

const COOKIE = 'formlog_preview';

export function proxy(request) {
  if (process.env.UNDER_CONSTRUCTION !== 'true') return NextResponse.next();

  const secret = process.env.UNDER_CONSTRUCTION_BYPASS;
  const { searchParams } = request.nextUrl;
  const preview = searchParams.get('preview');

  if (secret && preview) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('preview');
    const res = NextResponse.redirect(url);
    if (preview === secret) {
      res.cookies.set(COOKIE, secret, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
    } else {
      res.cookies.delete(COOKIE);
    }
    return res;
  }

  if (secret && request.cookies.get(COOKIE)?.value === secret) return NextResponse.next();

  // 503 + Retry-After: οι μηχανές αναζήτησης καταλαβαίνουν ότι είναι προσωρινό.
  return new NextResponse(PAGE, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '86400',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

export const config = {
  // Όχι στα αρχεία του Next.js και στο εικονίδιο, ώστε να φορτώνουν κανονικά.
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico).*)'],
};

const PAGE = `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>FormLog</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
  :root { --bg:#f4f6f8; --surface:#fff; --ink:#16202a; --muted:#64727f; --line:#e3e8ed; --primary:#0e8a6b; --amber:#e8a33d; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0e1418; --surface:#151d23; --ink:#e8eef2; --muted:#8fa0ac; --line:#25313a; --primary:#3ccb9f; --amber:#f0b45a; }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; padding: 24px;
    background: var(--bg); color: var(--ink); font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  main {
    max-width: 480px; width: 100%; text-align: center; background: var(--surface); border: 1px solid var(--line);
    border-radius: 24px; padding: 48px 32px;
  }
  .logo { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 22px; letter-spacing: -0.02em; margin-bottom: 28px; }
  .logo i { width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, var(--primary) 55%, var(--amber) 55%); }
  h1 { margin: 0 0 12px; font-size: 30px; line-height: 1.15; letter-spacing: -0.02em; }
  p { margin: 0; color: var(--muted); line-height: 1.6; }
  .bar { height: 6px; border-radius: 99px; background: var(--line); overflow: hidden; margin: 28px auto 0; max-width: 220px; }
  .bar span { display: block; height: 100%; width: 40%; border-radius: 99px; background: var(--primary); animation: slide 1.6s ease-in-out infinite; }
  @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
  @media (prefers-reduced-motion: reduce) { .bar span { animation: none; width: 60%; } }
</style>
</head>
<body>
  <main>
    <div class="logo"><i></i> FormLog</div>
    <h1>Υπό κατασκευή</h1>
    <p>Ετοιμάζουμε κάτι καλό για να κρατάς τις φωτογραφίες προόδου σου και να βλέπεις πόσο έχεις αλλάξει. Τα λέμε πολύ σύντομα.</p>
    <div class="bar" aria-hidden="true"><span></span></div>
  </main>
</body>
</html>`;

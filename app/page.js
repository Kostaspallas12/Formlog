import Image from 'next/image';
import Link from 'next/link';
import HeroPreview from '@/components/HeroPreview';
import HomeRedirect from '@/components/HomeRedirect';

const BENEFITS = [
  {
    // Γραμμικά εικονίδια (αντί για emoji), στο χρώμα του site.
    icon: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
    title: 'Όλο το αρχείο σε ένα μέρος',
    text: 'Παλιές και καινούριες φωτογραφίες μπαίνουν αυτόματα σε χρονολογική σειρά, με ημερομηνία και βάρος. Όχι πια σκόρπιες στη συλλογή του κινητού.',
  },
  {
    icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16M8 12H6m12 0h-2" /></>,
    title: 'Σύγκριση πριν και μετά',
    text: 'Διάλεξε δύο ημερομηνίες και δες τη διαφορά με slider ή δίπλα δίπλα, μαζί με τις ημέρες και τα κιλά που άλλαξαν.',
  },
  {
    icon: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    title: 'Ιδιωτικό',
    text: 'Τις φωτογραφίες σου τις βλέπεις μόνο εσύ. Δεν τις πουλάμε, δεν τις δείχνουμε σε κανέναν και τις σβήνεις όποτε θέλεις.',
  },
];

const STEPS = [
  ['Φωτογραφίσου', 'Μπροστά, πλάγια και πίσω, κάθε 2 με 4 εβδομάδες.'],
  ['Ανέβασε', 'Βάλε την ημερομηνία και, αν θέλεις, το βάρος σου. Ανεβαίνουν και παλιές φωτογραφίες.'],
  ['Δες την πρόοδο', 'Σύγκρινε οποιεσδήποτε δύο φωτογραφίες και δες πόσο έχεις αλλάξει.'],
];

const PERSONAL = [
  'Όλες οι φωτογραφίες σου σε ένα αρχείο',
  'Σύγκριση πριν και μετά',
  'Βάρος, θερμίδες, βήματα και νερό',
  'Συνομιλία με τον προπονητή σου',
];

const COACH = [
  'Όλοι οι αθλούμενοί σου σε μία λίστα',
  'Συνομιλία με τον αθλούμενο, μέσα στην εφαρμογή',
  'Ομάδες με κοινή συνομιλία',
  'Ειδοποίηση όταν στέλνει check-in',
  'Βλέπεις ποιος έχει μείνει πίσω',
];

const PLANS = [
  { name: 'Προσωπικός', type: 'personal', items: ['Απεριόριστες φωτογραφίες', 'Σύγκριση και γράφημα βάρους', 'Καθημερινές μετρήσεις'] },
  { name: 'Προπονητής', type: 'coach', items: ['Απεριόριστοι αθλούμενοι', 'Συνομιλίες και ομάδες', 'Ειδοποιήσεις για check-in'] },
];

const TIPS = [
  ['Ίδιο φως', 'Ίδιο σημείο του σπιτιού και φως από μπροστά. Οι σκιές αλλάζουν το πώς φαίνεται το σώμα.'],
  ['Ίδια απόσταση', 'Κινητό στο ύψος της μέσης, στην ίδια απόσταση κάθε φορά. Ιδανικά σε τρίποδο με χρονοδιακόπτη.'],
  ['Ίδια ώρα', 'Το πρωί, πριν το φαγητό. Το σώμα αλλάζει μέσα στη μέρα.'],
  ['Ίδιες πόζες', 'Μπροστά, πλάγια και πίσω, χαλαρά, με τα ίδια ρούχα.'],
];

const FAQ = [
  ['Ποιος βλέπει τις φωτογραφίες μου;', 'Μόνο εσύ, και ο προπονητής σου αν συνδεθείς μαζί του.'],
  ['Μπορώ να ανεβάσω παλιές φωτογραφίες;', 'Ναι. Βάζεις την ημερομηνία που τραβήχτηκαν και μπαίνουν στη σωστή θέση στο αρχείο.'],
  ['Δουλεύει στο κινητό;', 'Ναι. Μπορείς να φωτογραφίζεσαι και να ανεβάζεις κατευθείαν από το κινητό σου.'],
  ['Μπορώ να σβήσω τα δεδομένα μου;', 'Ναι. Μπορείς να σβήσεις μία φωτογραφία ή ολόκληρο τον λογαριασμό σου, οριστικά.'],
];

const Checks = ({ items }) => <ul className="checks">{items.map((t) => <li key={t}>{t}</li>)}</ul>;

export default function Home() {
  return (
    <>
      <HomeRedirect />
      <main>
        {/* Hero: κείμενο αριστερά, φωτογραφία με την προεπισκόπηση του αρχείου δεξιά */}
        <section className="hero wrap">
          <div className="hero-text">
            <span className="eyebrow">Το αρχείο της προόδου σου</span>
            <h1>Δες πόσο έχεις αλλάξει.</h1>
            <p className="lede">
              Το FormLog κρατάει όλες τις φωτογραφίες προόδου σου, από την πρώτη μέχρι τη σημερινή, σε ένα
              ιδιωτικό αρχείο. Ανέβασε, σύγκρινε και δες την αλλαγή με τα μάτια σου.
            </p>
            <div className="row cta">
              <Link href="/signup" className="btn primary big">Δημιουργία λογαριασμού</Link>
              <a href="#how" className="btn big">Πώς δουλεύει</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <Image src="/landing/athlete.jpg" alt="Αθλητής στο γυμναστήριο" fill priority sizes="(max-width: 860px) 90vw, 400px" />
            </div>
            <HeroPreview />
          </div>
        </section>
        {/* Οφέλη */}
        <section className="band">
          <div className="wrap benefits">
            {BENEFITS.map((b) => (
              <div className="benefit" key={b.title}>
                <span className="icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                </span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Πώς δουλεύει */}
        <section id="how" className="section wrap">
          <h2>Πώς δουλεύει</h2>
          <ol className="steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span className="num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>
        {/* Για εσένα */}
        <section className="section wrap split">
          <div className="split-photo">
            <Image src="/landing/training.jpg" alt="Προπόνηση με αλτήρα" fill sizes="(max-width: 860px) 90vw, 520px" />
          </div>
          <div>
            <span className="pill">Προσωπική χρήση</span>
            <h2>Για εσένα</h2>
            <p className="sub">Ένα ιδιωτικό αρχείο για τις φωτογραφίες, το βάρος και τις καθημερινές σου μετρήσεις.</p>
            <Checks items={PERSONAL} />
            <Link href="/signup?type=personal" className="btn primary big">Ξεκίνα</Link>
          </div>
        </section>
        {/* Για προπονητές: πραγματικό στιγμιότυπο της εφαρμογής */}
        <section id="coaches" className="band">
          <div className="section wrap">
            <div className="coach-intro">
              <div>
                <span className="pill amber">Επαγγελματική χρήση</span>
                <h2>Για προπονητές</h2>
                <p className="sub">Όλοι οι αθλούμενοί σου, οι φωτογραφίες τους και οι συνομιλίες σας σε ένα σημείο.</p>
                <Link href="/signup?type=coach" className="btn primary big">Ξεκίνα ως προπονητής</Link>
              </div>
              <Checks items={COACH} />
            </div>
            <div className="app-frame">
              <div className="app-frame-bar" aria-hidden="true"><i /><i /><i /></div>
              <Image src="/landing/coach-app.webp" alt="Η επισκόπηση του προπονητή στο FormLog" width={1600} height={700} sizes="(max-width: 1080px) 100vw, 1032px" />
            </div>
          </div>
        </section>
        {/* Τιμές */}
        <section id="pricing" className="section wrap">
          <h2>Τιμές</h2>
          <p className="sub">Το FormLog είναι δωρεάν σε αυτή την πρώτη του έκδοση.</p>
          <div className="plans">
            {PLANS.map((p) => (
              <div className="plan" key={p.type}>
                <h3>{p.name}</h3>
                <p className="price"><b>0 €</b><span>/ μήνα</span></p>
                <Checks items={p.items} />
              </div>
            ))}
          </div>
        </section>
        {/* Συμβουλές */}
        <section className="band">
          <div className="section wrap">
            <h2>Πώς να βγάζεις σωστές φωτογραφίες προόδου</h2>
            <p className="sub">Όσο πιο ίδιες είναι οι συνθήκες, τόσο πιο αληθινή είναι η σύγκριση.</p>
            <div className="tips">
              {TIPS.map(([title, text]) => (
                <div className="tip" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Συχνές ερωτήσεις */}
        <section id="faq" className="section wrap narrow">
          <h2>Συχνές ερωτήσεις</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

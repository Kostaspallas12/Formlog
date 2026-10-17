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

export default function Home() {
  return (
    <>
      <HomeRedirect />
      <main>
        {/* Hero */}
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
          <HeroPreview />
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
        {/* Για ποιον */}
        <section className="section wrap">
          <h2>Για ποιον είναι</h2>
          <div className="audiences">
            <div className="audience">
              <span className="pill">Προσωπική χρήση</span>
              <h3>Για εσένα</h3>
              <ul>
                <li>Όλες οι φωτογραφίες σου σε ένα αρχείο</li>
                <li>Σύγκριση πριν και μετά</li>
                <li>Βάρος, θερμίδες, βήματα και νερό</li>
              </ul>
              <Link href="/signup?type=personal" className="btn primary">Ξεκίνα</Link>
            </div>
            <div className="audience">
              <span className="pill amber">Επαγγελματική χρήση</span>
              <h3>Για προπονητές</h3>
              <ul>
                <li>Όλοι οι αθλούμενοί σου σε μία λίστα</li>
                <li>Συνομιλία με τον αθλούμενο, μέσα στην εφαρμογή</li>
                <li>Ειδοποίηση όταν στέλνει check-in</li>
                <li>Βλέπεις ποιος έχει μείνει πίσω</li>
              </ul>
              <Link href="/signup?type=coach" className="btn primary">Ξεκίνα ως προπονητής</Link>
            </div>
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
        <section className="section wrap narrow">
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

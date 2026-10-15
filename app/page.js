import Link from 'next/link';
import HeroPreview from '@/components/HeroPreview';

const BENEFITS = [
  {
    icon: '🗂️',
    title: 'Όλο το αρχείο σε ένα μέρος',
    text: 'Παλιές και καινούριες φωτογραφίες μπαίνουν αυτόματα σε χρονολογική σειρά, με ημερομηνία και βάρος. Όχι πια σκόρπιες στη συλλογή του κινητού.',
  },
  {
    icon: '↔️',
    title: 'Σύγκριση πριν και μετά',
    text: 'Διάλεξε δύο ημερομηνίες και δες τη διαφορά με slider ή δίπλα δίπλα, μαζί με τις ημέρες και τα κιλά που άλλαξαν.',
  },
  {
    icon: '🔒',
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
  ['Ποιος βλέπει τις φωτογραφίες μου;', 'Μόνο εσύ. Αν συνεργάζεσαι με προπονητή, εκείνος καταχωρεί τις φωτογραφίες σου μόνο με τη ρητή συγκατάθεσή σου και τις διαγράφει όταν του το ζητήσεις.'],
  ['Μπορώ να ανεβάσω παλιές φωτογραφίες;', 'Ναι. Βάζεις την ημερομηνία που τραβήχτηκαν και μπαίνουν στη σωστή θέση στο αρχείο.'],
  ['Δουλεύει στο κινητό;', 'Ναι. Μπορείς να φωτογραφίζεσαι και να ανεβάζεις κατευθείαν από το κινητό σου.'],
  ['Μπορώ να σβήσω τα δεδομένα μου;', 'Ναι. Μπορείς να σβήσεις μία φωτογραφία ή ολόκληρο τον λογαριασμό σου, οριστικά.'],
];

export default function Home() {
  return (
    <>
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
                <span className="icon" aria-hidden="true">{b.icon}</span>
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
                <li>Καταγραφή βάρους ανά φωτογραφία</li>
              </ul>
              <Link href="/signup?type=personal" className="btn primary">Ξεκίνα</Link>
            </div>
            <div className="audience">
              <span className="pill amber">Επαγγελματική χρήση</span>
              <h3>Για προπονητές</h3>
              <ul>
                <li>Ξεχωριστός φάκελος για κάθε αθλούμενο</li>
                <li>Αρχείο, σύγκριση και βάρος για τον καθένα</li>
                <li>Καταχώρηση μόνο με τη συγκατάθεσή τους</li>
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

        {/* Τελικό κάλεσμα */}
        <section className="wrap">
          <div className="final">
            <h2>Η πρόοδός σου αξίζει να φαίνεται.</h2>
            <Link href="/signup" className="btn big light">Δημιουργία λογαριασμού</Link>
          </div>
        </section>
      </main>
    </>
  );
}

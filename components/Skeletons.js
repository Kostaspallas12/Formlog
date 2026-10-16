// Σκελετοί φόρτωσης: το «σχήμα» της σελίδας με γκρι κουτάκια που λάμπουν απαλά,
// ώστε να μη φαίνεται κενή οθόνη όσο έρχονται τα δεδομένα.

const Box = ({ w, h, r, className = '' }) => (
  <span className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />
);

// Κεφαλίδα σελίδας (χαιρετισμός + τίτλος) όταν δεν ξέρουμε ακόμα τον τίτλο.
export function HeadSkeleton() {
  return (
    <div className="app-head">
      <div className="sk-stack">
        <Box w={140} h={16} />
        <Box w={260} h={36} r={10} />
      </div>
    </div>
  );
}

// Το σώμα του χώρου ενός αθλούμενου: σύνοψη, καρτέλες, καταγραφές.
export function WorkspaceBodySkeleton() {
  return (
    <div role="status" aria-label="Φόρτωση">
      <div className="stats">
        {[0, 1, 2, 3].map((i) => (
          <div className="stat sk-stat" key={i}>
            <Box w="45%" h={24} />
            <Box w="70%" h={12} />
          </div>
        ))}
      </div>
      <Box w={340} h={44} r={99} className="sk-tabs" />
      <div className="timeline">
        {[0, 1].map((i) => (
          <div className="entry" key={i}>
            <div className="sk-stack" style={{ marginBottom: 14 }}>
              <Box w={180} h={18} />
              <Box w={90} h={13} />
            </div>
            <div className="thumbs">
              {[0, 1, 2].map((j) => <Box key={j} w="100%" h="auto" r={10} className="sk-thumb" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <>
      <HeadSkeleton />
      <WorkspaceBodySkeleton />
    </>
  );
}

// Κάρτες αθλούμενων του προπονητή.
export function AthleteCardsSkeleton({ count = 3 }) {
  return (
    <div className="athletes" role="status" aria-label="Φόρτωση">
      {Array.from({ length: count }, (_, i) => (
        <div className="athlete sk-athlete" key={i}>
          <Box w={72} h={96} r={10} />
          <div className="sk-stack" style={{ flex: 1 }}>
            <Box w="55%" h={18} />
            <Box w="80%" h={13} />
            <Box w="40%" h={13} />
          </div>
        </div>
      ))}
    </div>
  );
}

// «Ο λογαριασμός μου»: μερικά πάνελ.
export function AccountSkeleton() {
  return (
    <div role="status" aria-label="Φόρτωση">
      <Box w={70} h={16} />
      <Box w={280} h={36} r={10} className="sk-title" />
      {[150, 110, 110].map((h, i) => (
        <div className="panel account-block" key={i}>
          <Box w={160} h={18} />
          <Box w="70%" h={14} className="sk-line" />
          <Box w="50%" h={14} className="sk-line" />
        </div>
      ))}
    </div>
  );
}

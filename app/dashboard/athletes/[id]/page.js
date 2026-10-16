'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { deleteAthlete, getAthlete } from '@/lib/storage';
import Workspace from '@/components/Workspace';
import CoachLink from '@/components/CoachLink';
import { WorkspaceSkeleton } from '@/components/Skeletons';

export default function AthletePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [athlete, setAthlete] = useState(undefined); // undefined: φορτώνει, null: δεν βρέθηκε

  useEffect(() => {
    if (!user) return;
    // Ο προπονητής βλέπει μόνο όσους προπονεί.
    // (Η βάση επιστρέφει μόνο αυτούς, χάρη στο RLS· ελέγχουμε και εδώ.)
    getAthlete(id)
      .then((a) => setAthlete(a && a.coachId === user.id ? a : null))
      .catch(() => setAthlete(null));
  }, [id, user]);

  if (!ready || !user || athlete === undefined) {
    return <main className="wrap app"><WorkspaceSkeleton /></main>;
  }

  return (
    <main className="wrap app">
      {athlete ? (
        <Workspace
          athlete={athlete}
          title={athlete.name}
          backHref="/dashboard"
          banner={<CoachLink athlete={athlete} onDisconnected={() => router.push('/dashboard')} />}
          // Φάκελο συνδεδεμένου αθλούμενου δεν τον σβήνει ο προπονητής· ανήκει στον αθλούμενο.
          onDeleteAthlete={athlete.linked ? undefined : async () => {
            await deleteAthlete(athlete.id);
            router.push('/dashboard');
          }}
        />
      ) : (
        <div className="empty">
          Δεν βρέθηκε αυτός ο αθλούμενος. <Link href="/dashboard">Επιστροφή</Link>
        </div>
      )}
    </main>
  );
}

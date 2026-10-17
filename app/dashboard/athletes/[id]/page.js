'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { deleteAthlete, disconnectCoach, getAthlete } from '@/lib/storage';
import Workspace from '@/components/Workspace';
import CoachLink from '@/components/CoachLink';
import Menu from '@/components/Menu';
import PaneHead from '@/components/PaneHead';
import { WorkspaceSkeleton } from '@/components/Skeletons';
import { useLive } from '@/components/Live';
import Chat from '@/components/Chat';

export default function AthletePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [athlete, setAthlete] = useState(undefined); // undefined: φορτώνει, null: δεν βρέθηκε
  const { online, lastEvent, markRead, unreadMsgs } = useLive();
  const tabParam = useSearchParams().get('tab'); // π.χ. ?tab=chat από ειδοποίηση μηνύματος

  // Ό,τι νέο είχε έρθει από αυτόν τον αθλούμενο θεωρείται πλέον διαβασμένο.
  useEffect(() => { markRead(id); }, [id, markRead]);

  useEffect(() => {
    if (!user) return;
    setAthlete(undefined);
    // Ο προπονητής βλέπει μόνο όσους προπονεί.
    // (Η βάση επιστρέφει μόνο αυτούς, χάρη στο RLS· ελέγχουμε και εδώ.)
    getAthlete(id)
      .then((a) => setAthlete(a && a.coachId === user.id ? a : null))
      .catch(() => setAthlete(null));
  }, [id, user]);

  if (!ready || !user || athlete === undefined) return <WorkspaceSkeleton back />;

  if (!athlete) {
    return (
      <>
        <PaneHead title="Δεν βρέθηκε" backHref="/dashboard" />
        <div className="empty">Δεν βρέθηκε αυτός ο αθλούμενος. <Link href="/dashboard">Επιστροφή</Link></div>
      </>
    );
  }

  const subtitle = [
    athlete.age != null && `${athlete.age} ετών`,
    athlete.height != null && `${athlete.height} cm`,
    athlete.linked && online.has(athlete.id) && <span className="link-status on" key="on">Online</span>,
  ].filter(Boolean).flatMap((x, i) => (i ? [' · ', x] : [x]));

  return (
    <Workspace
      key={athlete.id}
      athlete={athlete}
      title={athlete.name}
      subtitle={subtitle.length ? subtitle : null}
      backHref="/dashboard"
      banner={athlete.linked ? null : <CoachLink athlete={athlete} />}
      onAthleteChange={setAthlete}
      chat={athlete.linked ? <Chat athleteId={athlete.id} me={user.id} otherName={athlete.name} /> : null}
      chatBadge={unreadMsgs[athlete.id] || 0}
      initialTab={tabParam}
      // Μόλις ο αθλούμενος ανεβάσει check-in, εμφανίζεται εδώ χωρίς ανανέωση σελίδας.
      reloadSignal={lastEvent?.athleteId === athlete.id ? lastEvent.id : null}
      menu={
        <Menu
          items={[
            // Φάκελο συνδεδεμένου αθλούμενου δεν τον σβήνει ο προπονητής· ανήκει στον αθλούμενο.
            athlete.linked && {
              label: 'Διακοπή συνεργασίας', danger: true,
              onClick: async () => {
                if (!confirm(`Διακοπή συνεργασίας με «${athlete.name}»; Ο φάκελος μένει στον αθλούμενο και εσύ δεν θα έχεις πια πρόσβαση.`)) return;
                await disconnectCoach(athlete.id);
                router.push('/dashboard');
              },
            },
            !athlete.linked && {
              label: 'Διαγραφή αθλούμενου', danger: true,
              onClick: async () => {
                if (!confirm(`Οριστική διαγραφή του φακέλου «${athlete.name}» με όλες τις καταγραφές, το βάρος, τα καθημερινά και τις φωτογραφίες;`)) return;
                await deleteAthlete(athlete.id);
                router.push('/dashboard');
              },
            },
          ]}
        />
      }
    />
  );
}

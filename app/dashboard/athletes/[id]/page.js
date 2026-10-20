'use client';

import { useCallback, useEffect, useState } from 'react';
import { confirmDialog } from '@/components/Confirm';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { deleteAthlete, disconnectCoach, getAthlete } from '@/lib/storage';
import Workspace from '@/components/Workspace';
import CoachLink from '@/components/CoachLink';
import Menu from '@/components/Menu';
import PaneHead from '@/components/PaneHead';
import { WorkspaceSkeleton } from '@/components/Skeletons';
import { useLive, useSignal } from '@/components/Live';
import EmptyState from '@/components/EmptyState';
import Chat from '@/components/Chat';
import AthletePlans from '@/components/AthletePlans';
import AvatarPicker from '@/components/AvatarPicker';
import { isUuid } from '@/lib/utils';

export default function AthletePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [athlete, setAthlete] = useState(undefined); // undefined: φορτώνει, null: δεν βρέθηκε
  const { online, lastEvent, markRead, unreadMsgs, reloadAthletes } = useLive();
  const tabParam = useSearchParams().get('tab'); // π.χ. ?tab=chat από ειδοποίηση μηνύματος

  // Ό,τι νέο είχε έρθει από αυτόν τον αθλούμενο θεωρείται πλέον διαβασμένο.
  useEffect(() => { if (isUuid(id)) markRead(id); }, [id, markRead]);

  // Ο προπονητής βλέπει μόνο όσους προπονεί. (Η βάση επιστρέφει μόνο αυτούς, χάρη στο RLS· ελέγχουμε και εδώ.)
  const read = useCallback((skeleton) => {
    if (!user) return;
    if (!isUuid(id)) { setAthlete(null); return; } // χαλασμένη διεύθυνση: κατευθείαν «Δεν βρέθηκε»
    if (skeleton) setAthlete(undefined);
    getAthlete(id).then((a) => {
      const mine = a && a.coachId === user.id ? a : null;
      // Ζωντανά: ο αθλούμενος διέκοψε τη συνεργασία (ή σβήστηκε) → πίσω στη λίστα.
      if (!mine && !skeleton) { router.replace('/dashboard'); return; }
      setAthlete(mine);
    }).catch(() => skeleton && setAthlete(null));
  }, [id, user, router]);
  useEffect(() => { read(true); }, [read]);
  // Ζωντανά: μόλις ο αθλούμενος αποδεχτεί (ή αλλάξει στοιχεία), ξαναδιαβάζει χωρίς σκελετό —
  // εμφανίζονται οι καρτέλες «Συνομιλία»/«Πρόγραμμα» και φεύγει το πλαίσιο πρόσκλησης, χωρίς refresh.
  useSignal('athlete', id, () => read(false));

  if (!ready || !user || athlete === undefined) return <WorkspaceSkeleton back />;

  if (!athlete) {
    return (
      <>
        <PaneHead title="Δεν βρέθηκε" backHref="/dashboard" />
        <EmptyState title="Δεν βρέθηκε αυτός ο αθλούμενος"><Link href="/dashboard" className="btn">Επιστροφή</Link></EmptyState>
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
      avatar={<AvatarPicker avatar={athlete.avatar} name={athlete.name} size={44} editable={false} />}
      banner={athlete.linked ? null : <CoachLink athlete={athlete} />}
      onAthleteChange={setAthlete}
      chat={athlete.linked ? <Chat athleteId={athlete.id} me={user.id} otherName={athlete.name} /> : null}
      chatBadge={unreadMsgs[athlete.id] || 0}
      plans={<AthletePlans athleteId={athlete.id} coach />}
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
                if (!(await confirmDialog(`Διακοπή συνεργασίας με «${athlete.name}»; Ο φάκελος μένει στον αθλούμενο και εσύ δεν θα έχεις πια πρόσβαση.`))) return;
                await disconnectCoach(athlete.id);
                reloadAthletes();
                router.push('/dashboard');
              },
            },
            !athlete.linked && {
              label: 'Διαγραφή αθλούμενου', danger: true,
              onClick: async () => {
                if (!(await confirmDialog(`Οριστική διαγραφή του φακέλου «${athlete.name}» με όλες τις καταγραφές, το βάρος, τα καθημερινά και τις φωτογραφίες;`))) return;
                await deleteAthlete(athlete.id);
                reloadAthletes();
                router.push('/dashboard');
              },
            },
          ]}
        />
      }
    />
  );
}

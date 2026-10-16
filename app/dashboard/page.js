'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { getSelfAthlete } from '@/lib/storage';
import { getLastUser } from '@/lib/lastUser';
import AthleteList from '@/components/AthleteList';
import Workspace from '@/components/Workspace';
import { AthleteCardsSkeleton, WorkspaceBodySkeleton, WorkspaceSkeleton } from '@/components/Skeletons';

export default function DashboardPage() {
  const { user, ready } = useRequireUser();

  return (
    <main className="wrap app">
      {!ready || !user ? (
        <LoadingSkeleton />
      ) : user.type === 'coach' ? (
        <AthleteList user={user} />
      ) : (
        <MyProgress user={user} />
      )}
    </main>
  );
}

// Πριν μάθουμε ποιος είναι συνδεδεμένος: ο τελευταίος χρήστης αυτής της συσκευής,
// ώστε ο χαιρετισμός και ο σκελετός να είναι σωστοί από την πρώτη στιγμή.
function LoadingSkeleton() {
  const [last, setLast] = useState(null);
  useLayoutEffect(() => { setLast(getLastUser()); }, []);

  if (!last) return <WorkspaceSkeleton />;

  return (
    <>
      <div className="app-head">
        <div>
          <p className="greeting">Γεια σου, {last.firstName}</p>
          <h1>{last.type === 'coach' ? 'Οι αθλούμενοί μου' : 'Η πρόοδός μου'}</h1>
        </div>
      </div>
      {last.type === 'coach' ? <AthleteCardsSkeleton /> : <WorkspaceBodySkeleton />}
    </>
  );
}

// Προσωπικός λογαριασμός: ο χώρος του ίδιου του χρήστη.
function MyProgress({ user }) {
  const [me, setMe] = useState(null);
  const greeting = `Γεια σου, ${user.name.split(' ')[0]}`;

  useEffect(() => {
    getSelfAthlete(user).then(setMe);
  }, [user]);

  if (!me) {
    return (
      <>
        <div className="app-head">
          <div>
            <p className="greeting">{greeting}</p>
            <h1>Η πρόοδός μου</h1>
          </div>
        </div>
        <WorkspaceBodySkeleton />
      </>
    );
  }

  return <Workspace athlete={me} title="Η πρόοδός μου" greeting={greeting} />;
}

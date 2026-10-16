'use client';

import { useEffect, useState } from 'react';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { getSelfAthlete } from '@/lib/storage';
import AthleteList from '@/components/AthleteList';
import Workspace from '@/components/Workspace';
import { WorkspaceBodySkeleton, WorkspaceSkeleton } from '@/components/Skeletons';

export default function DashboardPage() {
  const { user, ready } = useRequireUser();

  return (
    <main className="wrap app">
      {!ready || !user ? (
        <WorkspaceSkeleton />
      ) : user.type === 'coach' ? (
        <AthleteList user={user} />
      ) : (
        <MyProgress user={user} />
      )}
    </main>
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

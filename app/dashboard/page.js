'use client';

import { useEffect, useState } from 'react';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { getSelfAthlete } from '@/lib/storage';
import AthleteList from '@/components/AthleteList';
import Workspace from '@/components/Workspace';

export default function DashboardPage() {
  const { user, ready } = useRequireUser();

  if (!ready || !user) return null;

  return (
    <main className="wrap app">
      {user.type === 'coach' ? <AthleteList user={user} /> : <MyProgress user={user} />}
    </main>
  );
}

// Προσωπικός λογαριασμός: ο χώρος του ίδιου του χρήστη.
function MyProgress({ user }) {
  const [me, setMe] = useState(null);

  useEffect(() => {
    getSelfAthlete(user).then(setMe);
  }, [user]);

  if (!me) return null;

  return <Workspace athlete={me} title="Η πρόοδός μου" greeting={`Γεια σου, ${user.name.split(' ')[0]}`} />;
}

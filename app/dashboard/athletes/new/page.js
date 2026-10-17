'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireUser } from '@/lib/useAuthRedirect';
import AthleteForm from '@/components/AthleteForm';
import PaneHead from '@/components/PaneHead';

// Νέος αθλούμενος (μόνο για προπονητές). Μετά την προσθήκη πάμε κατευθείαν στον αθλούμενο,
// όπου είναι έτοιμος ο σύνδεσμος πρόσκλησης.
export default function NewAthletePage() {
  const { user } = useRequireUser();
  const router = useRouter();

  useEffect(() => {
    if (user && user.type !== 'coach') router.replace('/dashboard');
  }, [user, router]);

  return (
    <>
      <PaneHead title="Νέος αθλούμενος" backHref="/dashboard" />
      {user?.type === 'coach' && (
        <AthleteForm
          onCancel={() => router.push('/dashboard')}
          onDone={(athlete) => router.push(`/dashboard/athletes/${athlete.id}`)}
        />
      )}
    </>
  );
}

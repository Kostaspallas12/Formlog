'use client';

import { useEffect, useState } from 'react';
import { getMyCoach } from '@/lib/storage';

// Για τον αθλούμενο: με ποιον προπονητή συνεργάζεται (μικρή γραμμή κάτω από τον τίτλο).
export default function MyCoach() {
  const [coach, setCoach] = useState(null);

  useEffect(() => {
    getMyCoach().then(setCoach).catch(() => {});
  }, []);

  if (!coach) return null;
  return <span>Προπονητής: <b>{coach.name}</b></span>;
}

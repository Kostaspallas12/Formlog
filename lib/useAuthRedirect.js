'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

// Σελίδες λογαριασμού: όποιος δεν είναι συνδεδεμένος πάει στην είσοδο.
export function useRequireUser() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.ready && !auth.user) router.replace('/login');
  }, [auth.ready, auth.user, router]);
  return auth;
}

// Είσοδος/εγγραφή: όποιος είναι ήδη συνδεδεμένος πάει στον λογαριασμό του.
export function useRedirectIfLoggedIn() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.ready && auth.user) router.replace('/dashboard');
  }, [auth.ready, auth.user, router]);
  return auth;
}

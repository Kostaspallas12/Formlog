'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

// Πού να πάει μετά την είσοδο/εγγραφή: το ?next=… (μόνο σελίδες του site μας), αλλιώς το dashboard.
export function nextPath() {
  try {
    const n = new URLSearchParams(window.location.search).get('next');
    return n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

// Σελίδες λογαριασμού: όποιος δεν είναι συνδεδεμένος πάει στην είσοδο.
export function useRequireUser() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.ready && !auth.user) router.replace('/login');
  }, [auth.ready, auth.user, router]);
  return auth;
}

// Είσοδος/εγγραφή: όποιος είναι ήδη συνδεδεμένος πάει στον λογαριασμό του (ή στο ?next=…).
export function useRedirectIfLoggedIn() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.ready && auth.user) router.replace(nextPath());
  }, [auth.ready, auth.user, router]);
  return auth;
}

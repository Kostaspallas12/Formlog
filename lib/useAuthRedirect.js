'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

// Πού να πάει μετά την είσοδο/εγγραφή: το ?next=… (μόνο σελίδες του site μας), αλλιώς το dashboard.
// (Ο browser διαβάζει το «/\κάτι» σαν «//κάτι», δηλαδή άλλο site· γι' αυτό ελέγχουμε το τελικό origin.)
export function nextPath() {
  try {
    const n = new URLSearchParams(window.location.search).get('next');
    if (!n || !n.startsWith('/') || n.includes('\\')) return '/dashboard';
    const url = new URL(n, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : '/dashboard';
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

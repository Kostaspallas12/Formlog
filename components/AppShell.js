'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getLastUser } from '@/lib/lastUser';
import AthleteSidebar from './AthleteSidebar';
import { CoachLive, PersonalLive, useLive } from './Live';
import { ArchiveIcon, ChatIcon, CompareIcon, DailyIcon, LogoutIcon, UserIcon, UsersIcon, WeightIcon } from './Icons';

// Οι ενότητες του χώρου ενός αθλούμενου.
export const VIEWS = [
  { id: 'archive', label: 'Αρχείο', Icon: ArchiveIcon },
  { id: 'compare', label: 'Σύγκριση', Icon: CompareIcon },
  { id: 'weight', label: 'Βάρος', Icon: WeightIcon },
  { id: 'daily', label: 'Καθημερινά', Icon: DailyIcon },
];
// Συνομιλία με τον προπονητή / τον αθλούμενο (μόνο όταν είναι συνδεδεμένοι).
export const CHAT_VIEW = { id: 'chat', label: 'Συνομιλία', Icon: ChatIcon };

// Ποια ενότητα έχει διαλέξει ο προσωπικός χρήστης από το πλαϊνό μενού.
const ViewContext = createContext(null);
export const useAppView = () => useContext(ViewContext);
const VIEW_KEY = 'formlog:view';

// Διάταξη τύπου WhatsApp:
//   υπολογιστής: στενή στήλη με εικονίδια αριστερά · (προπονητής: λίστα αθλούμενων) · περιεχόμενο
//   κινητό: μπάρα κάτω · ο προπονητής βλέπει ή τη λίστα ή έναν αθλούμενο (με «πίσω»)
export default function AppShell({ children }) {
  const { user } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [view, setViewState] = useState('archive');
  const [lastType, setLastType] = useState(null);

  useEffect(() => {
    setLastType(getLastUser()?.type ?? null);
    try {
      const v = sessionStorage.getItem(VIEW_KEY);
      if ([...VIEWS, CHAT_VIEW].some((x) => x.id === v)) setViewState(v);
    } catch {}
  }, []);

  const setView = (v) => {
    setViewState(v);
    try { sessionStorage.setItem(VIEW_KEY, v); } catch {}
    if (path !== '/dashboard') router.push('/dashboard');
    window.scrollTo(0, 0);
  };

  const coach = (user?.type ?? lastType) === 'coach';
  const body = (
    <ViewContext.Provider value={{ view, setView }}>
      <Shell coach={coach}>{children}</Shell>
    </ViewContext.Provider>
  );
  if (!user) return body;
  return coach
    ? <CoachLive user={user}>{body}</CoachLive>
    : <PersonalLive user={user} onOpenChat={() => setView('chat')}>{body}</PersonalLive>;
}

function Shell({ coach, children }) {
  const { user, logout } = useAuth();
  const { view, setView } = useAppView();
  const { unread, unreadMsgs, coach: myCoach } = useLive();
  const path = usePathname();

  const onAccount = path.startsWith('/account');
  const withList = coach && !onAccount;
  const paneOpen = path.startsWith('/dashboard/athletes/');
  const total = (m) => Object.values(m).reduce((a, b) => a + b, 0);

  const nav = coach
    ? [{ id: 'athletes', label: 'Αθλούμενοι', Icon: UsersIcon, href: '/dashboard', active: !onAccount, badge: total(unread) + total(unreadMsgs) }]
    : [...VIEWS, ...(myCoach ? [CHAT_VIEW] : [])].map((v) => ({
      ...v, active: !onAccount && view === v.id, onClick: () => setView(v.id),
      badge: v.id === 'chat' ? total(unreadMsgs) : 0,
    }));

  return (
    <div className={`shell${withList ? ' with-list' : ''}${paneOpen ? ' pane-open' : ''}`}>
      <nav className="rail" aria-label="Μενού">
        <Link href="/dashboard" className="rail-logo" aria-label="FormLog"><i /></Link>
        {nav.map(({ id, label, Icon, href, active, onClick, badge }) => {
          const inner = (
            <>
              <span className="rail-icon">
                <Icon />
                {badge > 0 && <span className="badge" aria-label={`${badge} νέα`}>{badge > 99 ? '99+' : badge}</span>}
              </span>
              <span className="rail-label">{label}</span>
            </>
          );
          return href ? (
            <Link key={id} href={href} className="rail-item" aria-current={active ? 'page' : undefined}>{inner}</Link>
          ) : (
            <button key={id} type="button" className="rail-item" aria-current={active ? 'page' : undefined} onClick={onClick}>{inner}</button>
          );
        })}
        <span className="rail-spacer" />
        <Link href="/account" className="rail-item rail-account" aria-current={onAccount ? 'page' : undefined} title={user?.name}>
          <span className="rail-icon">
            {user ? <span className="avatar">{user.name.charAt(0).toUpperCase()}</span> : <UserIcon />}
          </span>
          <span className="rail-label">Λογαριασμός</span>
        </Link>
        <button type="button" className="rail-item rail-logout" title="Αποσύνδεση" onClick={async () => { await logout(); window.location.assign('/'); }}>
          <span className="rail-icon"><LogoutIcon /></span>
          <span className="rail-label">Έξοδος</span>
        </button>
      </nav>

      {withList && <AthleteSidebar />}

      <main className="pane">{children}</main>
    </div>
  );
}

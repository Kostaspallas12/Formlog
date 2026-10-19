'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireUser } from '@/lib/useAuthRedirect';
import { getSelfAthlete } from '@/lib/storage';
import { getLastUser } from '@/lib/lastUser';
import Workspace from '@/components/Workspace';
import MyCoach from '@/components/MyCoach';
import PaneHead from '@/components/PaneHead';
import { CHAT_VIEW, PLAN_VIEW, useAppView, VIEWS } from '@/components/AppShell';
import Chat from '@/components/Chat';
import AthletePlans from '@/components/AthletePlans';
import { PlusIcon, UsersIcon } from '@/components/Icons';
import { AthleteAvatar } from '@/components/AthleteSidebar';
import { useLive } from '@/components/Live';
import { ANGLES, daysBetween, fmtDate, todayISO } from '@/lib/utils';
import Photo from '@/components/Photo';
import { WorkspaceSkeleton } from '@/components/Skeletons';

export default function DashboardPage() {
  const { user, ready } = useRequireUser();

  if (!ready || !user) return <LoadingSkeleton />;
  return user.type === 'coach' ? <CoachHome /> : <MyProgress user={user} />;
}

// Πριν μάθουμε ποιος είναι συνδεδεμένος: ο τελευταίος χρήστης αυτής της συσκευής,
// ώστε ο σκελετός να είναι σωστός από την πρώτη στιγμή.
function LoadingSkeleton() {
  const [last, setLast] = useState(null);
  useLayoutEffect(() => { setLast(getLastUser()); }, []);
  return last?.type === 'coach' ? <CoachHome /> : <WorkspaceSkeleton />;
}

// Προπονητής χωρίς επιλεγμένο αθλούμενο: η εικόνα της ημέρας (ποιος χρειάζεται προσοχή).
const QUIET_DAYS = 7;

function CoachHome() {
  const { athletes, unread, unreadMsgs, online, groups } = useLive();
  const head = (
    <PaneHead
      title="Επισκόπηση"
      actions={
        <Link href="/dashboard/athletes/new" className="btn primary">
          <PlusIcon size={18} /><span className="long">Προσθήκη αθλούμενου</span><span className="short">Νέος</span>
        </Link>
      }
    />
  );

  if (!athletes) return <>{head}<WorkspaceSkeleton body /></>;
  if (athletes.length === 0) {
    return (
      <div className="pane-empty">
        <span className="pane-empty-icon"><UsersIcon size={34} /></span>
        <h2>Πρόσθεσε τον πρώτο σου αθλούμενο</h2>
        <Link href="/dashboard/athletes/new" className="btn primary">Προσθήκη αθλούμενου</Link>
      </div>
    );
  }

  const today = todayISO();
  // Ημέρες από την τελευταία καταγραφή (ή, αν δεν έχει καμία, από τότε που προστέθηκε).
  const ago = (a) => daysBetween(a.lastDate || a.createdAt.slice(0, 10), today);
  const fresh = athletes.filter((a) => unread[a.id] || unreadMsgs[a.id]);
  const pending = athletes.filter((a) => !a.linked && a.pending);
  const quiet = athletes
    .filter((a) => !pending.includes(a) && ago(a) >= QUIET_DAYS)
    .sort((a, b) => ago(b) - ago(a));
  const sum = (m) => Object.values(m).reduce((x, y) => x + y, 0);
  const newCount = sum(unread);
  const msgCount = sum(unreadMsgs) + (groups || []).reduce((a, g) => a + g.unread, 0); // ατομικά + ομάδες
  const onlineCount = athletes.filter((a) => a.linked && online.has(a.id)).length;

  return (
    <>
      {head}
      <div className="stats">
        <div className="stat"><b className={newCount ? 'good' : ''}>{newCount}</b><span>νέα check-in</span></div>
        <div className="stat"><b className={msgCount ? 'good' : ''}>{msgCount}</b><span>νέα μηνύματα</span></div>
        <div className="stat"><b>{onlineCount}</b><span>online τώρα</span></div>
      </div>

      <RecentPhotos athletes={athletes} />

      <Group
        title="Νέα" items={fresh} online={online}
        // Μόνο μηνύματα → κατευθείαν στη συνομιλία.
        hrefOf={(a) => `/dashboard/athletes/${a.id}${unreadMsgs[a.id] && !unread[a.id] ? '?tab=chat' : ''}`}
        sub={(a) => [
          unread[a.id] && `${unread[a.id]} check-in`,
          unreadMsgs[a.id] && `${unreadMsgs[a.id]} ${unreadMsgs[a.id] === 1 ? 'μήνυμα' : 'μηνύματα'}`,
        ].filter(Boolean).join(' · ')}
      />
      <Group
        title={`Χωρίς καταγραφή ${QUIET_DAYS}+ ημέρες`} items={quiet} online={online}
        sub={(a) => (a.lastDate ? `Τελευταία πριν ${ago(a)} ημέρες` : 'Καμία καταγραφή ακόμα')}
      />
      <Group title="Δεν έχουν αποδεχτεί την πρόσκληση" items={pending} sub={() => 'Αναμένει αποδοχή'} online={online} />
      {!fresh.length && !quiet.length && !pending.length && (
        <p className="ov-ok">Όλοι οι αθλούμενοι είναι ενημερωμένοι.</p>
      )}
    </>
  );
}

// Οι πιο πρόσφατες καταγραφές με φωτογραφία, από όλους τους αθλούμενους.
function RecentPhotos({ athletes }) {
  const recent = athletes
    .flatMap((a) => a.checkins.map((c) => ({ a, c, photo: ANGLES.map((x) => c.photos[x.id]).find(Boolean) })))
    .filter((r) => r.photo)
    .sort((x, y) => y.c.date.localeCompare(x.c.date) || (y.c.createdAt || '').localeCompare(x.c.createdAt || ''))
    .slice(0, 8);
  if (!recent.length) return null;
  return (
    <section className="ov-group">
      <h2>Πρόσφατες φωτογραφίες</h2>
      <div className="recent-photos">
        {recent.map(({ a, c, photo }) => (
          <Link key={c.id} href={`/dashboard/athletes/${a.id}`} className="recent-photo">
            <Photo id={photo} alt={`${a.name}, ${fmtDate(c.date)}`} />
            <span className="recent-cap"><b>{a.name}</b><small>{fmtDate(c.date, { day: 'numeric', month: 'short' })}</small></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Group({ title, items, sub, online, hrefOf = (a) => `/dashboard/athletes/${a.id}` }) {
  if (!items.length) return null;
  return (
    <section className="ov-group">
      <h2>{title} <span className="ov-count">{items.length}</span></h2>
      <div className="ov-list">
        {items.map((a) => (
          <Link key={a.id} href={hrefOf(a)} className="ov-row">
            <AthleteAvatar athlete={a} online={a.linked && online.has(a.id)} />
            <span className="ov-name"><b>{a.name}</b><small>{sub(a)}</small></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Προσωπικός λογαριασμός: ο χώρος του ίδιου του χρήστη, με την ενότητα από το πλαϊνό μενού.
function MyProgress({ user }) {
  const { view } = useAppView();
  const { coach, hasPlans } = useLive();
  const [me, setMe] = useState(null);
  const current = (view === 'chat' && !coach) || (view === 'plan' && !coach && !hasPlans) || view === 'groups' ? 'archive' : view;
  const title = current === 'chat' ? coach.name : [...VIEWS, PLAN_VIEW, CHAT_VIEW].find((v) => v.id === current)?.label;

  useEffect(() => {
    getSelfAthlete(user).then(setMe);
  }, [user]);

  if (!me) return <><PaneHead title={title} /><WorkspaceSkeleton body /></>;
  return (
    <Workspace
      athlete={me} title={title} subtitle={current === 'chat' ? 'Προπονητής' : <MyCoach />} view={current} onAthleteChange={setMe}
      chat={coach ? <Chat athleteId={me.id} me={user.id} otherName={coach.name} solo /> : null}
      plans={coach || hasPlans ? <AthletePlans athleteId={me.id} /> : null}
    />
  );
}

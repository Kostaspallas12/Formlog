'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ANGLES, fmtDate, fmtDelta, fmtKg } from '@/lib/utils';
import Photo from './Photo';
import { PlusIcon, SearchIcon } from './Icons';
import { useLive } from './Live';

const FILTERS = [
  { id: 'all', label: 'Όλοι' },
  { id: 'linked', label: 'Συνδεδεμένοι' },
  { id: 'pending', label: 'Αναμένουν' },
];

// Φωτογραφία του αθλούμενου (η πιο πρόσφατη) ή το αρχικό του σε κύκλο.
export function AthleteAvatar({ athlete, online = false }) {
  const lastPhoto = [...athlete.checkins].reverse()
    .map((c) => ANGLES.map((x) => c.photos[x.id]).find(Boolean))
    .find(Boolean);
  return (
    <span className={`chat-pic${online ? ' online' : ''}`} title={online ? 'Online' : undefined}>
      {lastPhoto
        ? <Photo id={lastPhoto} alt="" className="chat-avatar" />
        : <span className="chat-avatar initial">{athlete.name.charAt(0).toUpperCase()}</span>}
    </span>
  );
}

// Η λίστα αθλούμενων του προπονητή (σαν τις συνομιλίες του WhatsApp):
// πρώτα όσοι έχουν νέο check-in, μετά όσοι έστειλαν πιο πρόσφατα.
export default function AthleteSidebar() {
  const path = usePathname();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { online, unread, unreadMsgs, lastMsg, athletes } = useLive();
  const news = (id) => (unread[id] || 0) + (unreadMsgs[id] || 0);
  // Τελευταία κίνηση: καταγραφή, ζύγισμα ή μήνυμα.
  const activity = (a) => [a.lastDate, lastMsg[a.id]?.createdAt].filter(Boolean).sort().pop() || '';

  const q = query.trim().toLocaleLowerCase('el');
  const shown = (athletes || [])
    .filter((a) =>
      (!q || a.name.toLocaleLowerCase('el').includes(q)) &&
      (filter === 'all' || (filter === 'linked' ? a.linked : !a.linked && a.pending)))
    .sort((a, b) =>
      (news(b.id) ? 1 : 0) - (news(a.id) ? 1 : 0) ||
      activity(b).localeCompare(activity(a)) ||
      (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <aside className="list">
      <div className="list-head">
        <h2>Αθλούμενοι{athletes?.length > 0 && <span className="list-count">{athletes.length}</span>}</h2>
        <Link href="/dashboard/athletes/new" className="icon-btn round primary" aria-label="Προσθήκη αθλούμενου" title="Προσθήκη αθλούμενου">
          <PlusIcon />
        </Link>
      </div>

      <label className="list-search">
        <SearchIcon size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Αναζήτηση" aria-label="Αναζήτηση αθλούμενου" />
      </label>
      <div className="list-filters">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      {!athletes ? (
        <div role="status" aria-label="Φόρτωση">
          {[0, 1, 2, 3].map((i) => (
            <div className="chat" key={i}>
              <span className="sk chat-avatar" />
              <span className="chat-body"><span className="sk" style={{ width: '60%', height: 14 }} /><span className="sk" style={{ width: '40%', height: 12, marginTop: 6 }} /></span>
            </div>
          ))}
        </div>
      ) : athletes.length === 0 ? (
        <div className="list-empty">
          <p>Δεν έχεις αθλούμενους ακόμα.</p>
          <Link href="/dashboard/athletes/new" className="btn primary">Προσθήκη αθλούμενου</Link>
        </div>
      ) : shown.length === 0 ? (
        <p className="list-empty">Κανένα αποτέλεσμα.</p>
      ) : (
        <nav className="chats">
          {shown.map((a) => (
            <AthleteRow
              key={a.id} athlete={a} active={path === `/dashboard/athletes/${a.id}`}
              online={a.linked && online.has(a.id)} unread={news(a.id)}
              message={unreadMsgs[a.id] ? lastMsg[a.id] : null} date={activity(a).slice(0, 10)}
              toChat={!!unreadMsgs[a.id] && !unread[a.id]}
            />
          ))}
        </nav>
      )}
    </aside>
  );
}

function AthleteRow({ athlete, active, online, unread, message, date, toChat }) {
  const { checkins, weighIns: kgs } = athlete;
  const sub = kgs.length
    ? `${fmtKg(kgs[kgs.length - 1].weight)} kg${kgs.length > 1 ? ` · ${fmtDelta(kgs[kgs.length - 1].weight - kgs[0].weight)}` : ''}`
    : checkins.length ? `${checkins.length} ${checkins.length === 1 ? 'καταγραφή' : 'καταγραφές'}` : 'Καμία καταγραφή';

  return (
    <Link href={`/dashboard/athletes/${athlete.id}${toChat ? '?tab=chat' : ''}`} className="chat" aria-current={active ? 'page' : undefined}>
      <AthleteAvatar athlete={athlete} online={online} />
      <span className="chat-body">
        <span className="chat-top">
          <b>{athlete.name}</b>
          {date && <small className={unread ? 'new' : ''}>{fmtDate(date, { day: 'numeric', month: 'short' })}</small>}
        </span>
        <span className="chat-bottom">
          {/* Αν έχει νέο μήνυμα, φαίνεται αυτό (όπως στο WhatsApp). */}
          <span className={`chat-sub${message ? ' msg-preview' : ''}`}>{message ? message.body : sub}</span>
          {!athlete.linked && athlete.pending && <span className="chat-tag">Αναμένει</span>}
          {unread > 0 && <span className="badge" aria-label={`${unread} νέα`}>{unread}</span>}
        </span>
      </span>
    </Link>
  );
}

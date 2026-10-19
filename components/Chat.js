'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  addPhoto, listGroupMessages, listMessages, markGroupRead, markMessagesRead, onGroupMessages, onMessages,
  sendGroupMessage, sendMessage,
} from '@/lib/storage';
import { processImage } from '@/lib/images';
import { fmtDate } from '@/lib/utils';
import { useLive } from './Live';
import Photo from './Photo';
import { Lightbox } from './Timeline';
import { ImageIcon, SendIcon, TicksIcon } from './Icons';

// Τοπική ημερομηνία (YYYY-MM-DD) για τα διαχωριστικά «Σήμερα», «Χθες», …
const localDay = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const dayLabel = (iso) => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 864e5);
  if (iso === localDay(today)) return 'Σήμερα';
  if (iso === localDay(yesterday)) return 'Χθες';
  return fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
};
const time = (ts) => new Date(ts).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });

// Η συνομιλία (σαν εφαρμογή μηνυμάτων), με κείμενο και φωτογραφίες:
//   ατομική: προπονητής ↔ αθλούμενος για έναν φάκελο (athleteId)
//   ομάδα: groupId · people: { userId → { name, isCoach } } για να φαίνεται ποιος γράφει
// solo: χωρίς καρτέλες από πάνω, για σωστό ύψος.
export default function Chat({ athleteId, groupId, people = {}, me, otherName, solo = false }) {
  const { clearMessages, clearGroup, setOpenChat } = useLive();
  const isGroup = !!groupId;
  const chatId = groupId || athleteId;
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null); // { file, preview } πριν σταλεί
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(null);
  const scroller = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    let alive = true;
    const read = () => (isGroup
      ? markGroupRead(chatId).then(() => clearGroup(chatId))
      : markMessagesRead(chatId, me).then(() => clearMessages(chatId))).catch(() => {});
    setOpenChat(chatId);
    (isGroup ? listGroupMessages : listMessages)(chatId).then((m) => alive && setMsgs(m)).catch(() => alive && setMsgs([]));
    read();
    const stop = (isGroup ? onGroupMessages : onMessages)(chatId, (type, m) => {
      setMsgs((list) => {
        if (!list) return list;
        if (type === 'INSERT') return list.some((x) => x.id === m.id) ? list : [...list, m];
        return list.map((x) => (x.id === m.id ? m : x)); // π.χ. «διαβάστηκε»
      });
      if (type === 'INSERT' && m.sender !== me) read();
    });
    return () => { alive = false; stop(); setOpenChat(null); };
  }, [chatId, isGroup, me, clearMessages, clearGroup, setOpenChat]);

  // Πάντα στο τελευταίο μήνυμα.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, photo]);

  // Καθάρισμα της προσωρινής προεπισκόπησης.
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.preview); }, [photo]);

  const pick = (file) => {
    if (!file) return;
    setError('');
    setPhoto({ file, preview: URL.createObjectURL(file) });
    input.current?.focus();
  };

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if ((!body && !photo) || sending) return;
    setSending(true);
    setError('');
    try {
      let path = null;
      if (photo) {
        let versions;
        try {
          versions = await processImage(photo.file); // μικραίνει όπως στις καταγραφές
        } catch {
          throw new Error('Δεν διαβάστηκε η φωτογραφία. Δοκίμασε αρχείο JPG ή PNG.');
        }
        path = await addPhoto(versions, chatId); // στον φάκελο του αθλούμενου ή της ομάδας
      }
      const m = await (isGroup ? sendGroupMessage : sendMessage)(chatId, body, path);
      setMsgs((list) => (list?.some((x) => x.id === m.id) ? list : [...(list || []), m]));
      setText('');
      setPhoto(null);
    } catch (err) {
      setError(err.message?.startsWith('Δεν') ? err.message : 'Το μήνυμα δεν στάλθηκε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.');
    }
    setSending(false);
    input.current?.focus();
  };

  let lastDay = null;
  let prevSender = null;
  return (
    <div className={`chatbox${solo ? ' solo' : ''}`}>
      <div className="chat-scroll" ref={scroller}>
        {!msgs ? (
          <p className="chat-note">Φόρτωση…</p>
        ) : msgs.length === 0 ? (
          <p className="chat-note">{isGroup ? 'Κανένα μήνυμα ακόμα.' : `Στείλε το πρώτο μήνυμα στον/στην ${otherName}.`}</p>
        ) : (
          msgs.map((m) => {
            const day = localDay(new Date(m.createdAt));
            const sep = day !== lastDay && <div className="chat-day" key={`d${day}`}><span>{dayLabel(day)}</span></div>;
            lastDay = day;
            const mine = m.sender === me;
            // Στην ομάδα: όνομα και αρχικό του αποστολέα στο πρώτο από τα συνεχόμενα μηνύματά του.
            const first = isGroup && !mine && (prevSender !== m.sender || !!sep);
            prevSender = m.sender;
            const who = people[m.sender];
            const bubble = (
              <div key={m.id} className={`msg${mine ? ' me' : ''}${m.photo ? ' has-photo' : ''}`}>
                {first && (
                  <span className="msg-from">
                    {who?.name || 'Πρώην μέλος'}
                    {who?.isCoach && <em className="msg-role">Προπονητής</em>}
                  </span>
                )}
                {m.photo && (
                  <Photo id={m.photo} alt="Φωτογραφία" className="msg-photo" onClick={() => setZoom({ id: m.photo, label: `Φωτογραφία · ${dayLabel(day)} ${time(m.createdAt)}` })} />
                )}
                {m.body && <p>{m.body}</p>}
                <span className="msg-meta">
                  {time(m.createdAt)}
                  {mine && !isGroup && <TicksIcon size={16} className={m.readAt ? 'read' : ''} aria-label={m.readAt ? 'Διαβάστηκε' : 'Στάλθηκε'} />}
                </span>
              </div>
            );
            if (!isGroup || mine) return [sep, bubble];
            return [
              sep,
              <div key={m.id} className={`msg-line${first ? ' first' : ''}`}>
                {first
                  ? <span className={`msg-avatar${who?.isCoach ? ' coach' : ''}`} aria-hidden="true">{(who?.name || '?').charAt(0).toUpperCase()}</span>
                  : <span className="msg-avatar-space" />}
                {bubble}
              </div>,
            ];
          })
        )}
      </div>

      {photo && (
        <div className="chat-attach">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.preview} alt="Φωτογραφία προς αποστολή" />
          <span>{sending ? 'Αποστολή…' : 'Φωτογραφία'}</span>
          <button type="button" className="x" onClick={() => setPhoto(null)} disabled={sending} aria-label="Αφαίρεση φωτογραφίας">✕</button>
        </div>
      )}
      {error && <p className="error chat-error" role="alert">{error}</p>}
      <form className="chat-compose" onSubmit={send}>
        <label className="icon-btn chat-pick" title="Φωτογραφία" aria-label="Αποστολή φωτογραφίας">
          <ImageIcon />
          <input type="file" accept="image/*" onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} disabled={sending} />
        </label>
        <textarea
          ref={input} rows={1} value={text} maxLength={4000} placeholder={photo ? 'Λεζάντα' : 'Μήνυμα'} aria-label="Μήνυμα"
          onChange={(e) => setText(e.target.value)}
          // Enter: αποστολή · Shift+Enter: νέα γραμμή
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
        />
        <button type="submit" className="icon-btn round primary" disabled={(!text.trim() && !photo) || sending} aria-label="Αποστολή">
          <SendIcon size={20} />
        </button>
      </form>

      {zoom && <Lightbox {...zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

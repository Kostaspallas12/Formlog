// Γραμμικά εικονίδια της εφαρμογής (ίδιο πάχος, παίρνουν το χρώμα του κειμένου).
const icon = (paths, filled = false) => {
  const Icon = ({ size = 22, ...props }) => (
    <svg
      viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}
    >
      {paths}
    </svg>
  );
  return Icon;
};

export const ArchiveIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-9 9" /></>);
export const CompareIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M12 4v16" /></>);
export const WeightIcon = icon(<><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 10a4 4 0 0 1 8 0" /><path d="M12 10l1.6-2.2" /></>);
export const DailyIcon = icon(<><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4" /></>);
export const UsersIcon = icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6a6.5 6.5 0 0 1 3.5 5.4" /></>);
export const UserIcon = icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const LogoutIcon = icon(<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);
export const BackIcon = icon(<path d="M15 18l-6-6 6-6" />);
export const SearchIcon = icon(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const LinkIcon = icon(<><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></>);
export const ImageIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-9 9" /></>);
export const ChatIcon = icon(<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />);
export const SendIcon = icon(<path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />);
export const TicksIcon = icon(<path d="M2 12.5l4 4 8-9M10 15l1.5 1.5 8-9" />);
export const MoreIcon = icon(<><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></>, true);

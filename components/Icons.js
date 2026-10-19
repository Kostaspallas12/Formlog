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
// Ομάδες / κοινότητα: τρία άτομα
export const GroupsIcon = icon(<><circle cx="12" cy="7.5" r="3" /><circle cx="5" cy="10" r="2.2" /><circle cx="19" cy="10" r="2.2" /><path d="M6.8 20a5.2 5.2 0 0 1 10.4 0" /><path d="M1.5 19a3.5 3.5 0 0 1 4.3-3.4M22.5 19a3.5 3.5 0 0 0-4.3-3.4" /></>);
export const PlanIcon = icon(<><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 4V2.8h6V4M9 10h6M9 14h6M9 18h3" /></>);
export const DumbbellIcon = icon(<path d="M6.5 6v12M17.5 6v12M3.5 9v6M20.5 9v6M6.5 12h11" />);
export const FoodIcon = icon(<path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M17.5 21V3c-2.2 1.2-3.5 4-3.5 7.5V14h3.5" />);
export const UserIcon =icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const LogoutIcon = icon(<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />);
export const UploadIcon = icon(<path d="M12 16V4M7 9l5-5 5 5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />);
export const DownloadIcon = icon(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />);
export const CloseIcon =icon(<path d="M6 6l12 12M18 6L6 18" />);
export const PlusIcon =icon(<path d="M12 5v14M5 12h14" />);
export const BackIcon = icon(<path d="M15 18l-6-6 6-6" />);
export const SearchIcon = icon(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const LinkIcon = icon(<><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></>);
export const ImageIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-9 9" /></>);
export const ChatIcon = icon(<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />);
export const SendIcon = icon(<path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />);
export const TicksIcon = icon(<path d="M2 12.5l4 4 8-9M10 15l1.5 1.5 8-9" />);
// Για το μενού κάθε αθλούμενου στη λίστα
export const ChevronIcon = icon(<path d="M6 9l6 6 6-6" />);
export const PinIcon = icon(<path d="M9 3h6l-1 6 4 3v2h-5v7l-1 1-1-1v-7H6v-2l4-3-1-6z" />);
export const BellOffIcon = icon(<><path d="M6 8a6 6 0 0 1 9.2-5M18 8c0 7 3 9 3 9H9" /><path d="M6 8c0 7-3 9-3 9h3M10.3 21a1.9 1.9 0 0 0 3.4 0M2 2l20 20" /></>);
export const HeartIcon = icon(<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.1 4.3 6.3C19.5 15.4 12 20 12 20z" />);
export const ArchiveBoxIcon = icon(<><rect x="3" y="4" width="18" height="5" rx="1.5" /><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" /></>);
export const ReadIcon = icon(<><path d="M3 9l9 6 9-6" /><path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /></>);
export const UnreadIcon = icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>);
export const GroupAddIcon = icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" /></>);
export const TrashIcon = icon(<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />);
export const MoreIcon = icon(<><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></>, true);

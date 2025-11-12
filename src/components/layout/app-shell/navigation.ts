export type NavigationItem = {
  to: string;
  icon: string;
  labelKey: string;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { to: '/dashboard', icon: '📊', labelKey: 'dashboard.dashboard' },
  { to: '/diagnosis/quick', icon: '⚡', labelKey: 'dashboard.quickScan' },
  { to: '/diagnosis/guided', icon: '🧭', labelKey: 'dashboard.guidedScan' },
  { to: '/history', icon: '🗂️', labelKey: 'dashboard.history' },
  { to: '/library', icon: '🖼️', labelKey: 'dashboard.mediaLibrary' },
  { to: '/knowledge-base', icon: '📚', labelKey: 'dashboard.knowledgeBase' },
  { to: '/settings', icon: '⚙️', labelKey: 'dashboard.settings' }
];

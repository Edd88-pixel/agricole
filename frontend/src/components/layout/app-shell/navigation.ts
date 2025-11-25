import { createElement, type ReactNode } from 'react';
import {
  FiBarChart2,
  FiZap,
  FiCompass,
  FiClock,
  FiImage,
  FiBookOpen,
  FiSettings
} from 'react-icons/fi';

export type NavigationItem = {
  to: string;
  icon: ReactNode;
  labelKey: string;
};

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { to: '/dashboard', icon: createElement(FiBarChart2, { 'aria-hidden': true }), labelKey: 'dashboard.dashboard' },
  { to: '/diagnosis/quick', icon: createElement(FiZap, { 'aria-hidden': true }), labelKey: 'dashboard.quickScan' },
  { to: '/diagnosis/guided', icon: createElement(FiCompass, { 'aria-hidden': true }), labelKey: 'dashboard.guidedScan' },
  { to: '/history', icon: createElement(FiClock, { 'aria-hidden': true }), labelKey: 'dashboard.history' },
  { to: '/library', icon: createElement(FiImage, { 'aria-hidden': true }), labelKey: 'dashboard.mediaLibrary' },
  { to: '/knowledge-base', icon: createElement(FiBookOpen, { 'aria-hidden': true }), labelKey: 'dashboard.knowledgeBase' },
  { to: '/settings', icon: createElement(FiSettings, { 'aria-hidden': true }), labelKey: 'dashboard.settings' }
];

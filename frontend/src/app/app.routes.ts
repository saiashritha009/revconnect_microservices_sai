import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page/landing-page').then(m => m.LandingPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: 'feed',
    loadComponent: () => import('./features/feed/feed-page/feed-page').then(m => m.FeedPage)
  },
  {
    path: 'explore',
    loadComponent: () => import('./features/explore/explore-page/explore-page').then(m => m.ExplorePage)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications-page/notifications-page').then(m => m.NotificationsPage)
  },
  {
    path: 'messages',
    loadComponent: () => import('./features/messages/messages-page/messages-page').then(m => m.MessagesPage)
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./features/bookmarks/bookmarks-page/bookmarks-page').then(m => m.BookmarksPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile-page/profile-page').then(m => m.ProfilePage)
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./features/profile/profile-page/profile-page').then(m => m.ProfilePage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings-page/settings-page').then(m => m.SettingsPage)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics-dashboard/analytics-dashboard').then(m => m.AnalyticsDashboard)
  },
  {
    path: '**',
    redirectTo: 'feed'
  }
];

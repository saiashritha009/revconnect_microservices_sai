import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, NotificationResponse } from '../../services/notification.service';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { UserService, UserResponse } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { BottomNav } from '../bottom-nav/bottom-nav';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BottomNav],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements OnInit, OnDestroy {
  unreadNotificationCount = 0;
  unreadMessageCount = 0;
  searchQuery = '';

  notificationDropdownOpen = false;
  notifications: NotificationResponse[] = [];
  notificationsLoading = false;

  isLightMode = false;
  currentUser: UserResponse | null = null;

  private pollSub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private messageService: MessageService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.checkTheme();
    this.loadCounts();
    this.loadUser();

    // Notification count subscription (Once)
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotificationCount = count;
      this.cdr.markForCheck();
    });
    this.notificationService.refreshUnreadCount();

    // Poll counts every 30 seconds
    this.pollSub = interval(30000).subscribe(() => this.loadCounts());
  }

  loadUser() {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentUser = res.data;
          this.cdr.markForCheck();
        }
      }
    });
  }

  checkTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightMode = true;
      document.body.classList.add('light-theme');
    }
  }

  toggleTheme() {
    this.isLightMode = !this.isLightMode;
    if (this.isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  loadCounts() {
    // Message count (Direct fetch since it doesn't have a Subject yet)
    this.messageService.getUnreadCount().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.unreadMessageCount = res.data.count;
          this.cdr.markForCheck();
        }
      }
    });
  }

  toggleNotifications() {
    this.notificationDropdownOpen = !this.notificationDropdownOpen;
    if (this.notificationDropdownOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notificationsLoading = true;
    this.cdr.markForCheck();

    this.notificationService.getNotifications(0, 10).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notifications = res.data.content.map((n: any) => ({
            ...n,
            isRead: n.read !== undefined ? n.read : !!n.isRead
          }));
        }
        this.notificationsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notificationsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  markAsRead(notification: NotificationResponse, event: Event) {
    event.stopPropagation();
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadNotificationCount = Math.max(0, this.unreadNotificationCount - 1);
          this.cdr.markForCheck();
        }
      });
    }
  }

  navigateNotification(notification: NotificationResponse, event: Event) {
    event.stopPropagation();
    // Mark as read
    if (!notification.isRead) {
      notification.isRead = true;
      this.unreadNotificationCount = Math.max(0, this.unreadNotificationCount - 1);
      this.cdr.markForCheck();
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    this.notificationDropdownOpen = false;

    // Navigate based on type
    const type: string = (notification as any).type || '';
    switch (type) {
      case 'LIKE':
      case 'COMMENT':
      case 'SHARE':
        const postId = (notification as any).postId;
        if (postId) {
          this.router.navigate(['/post', postId]);
        } else {
          this.router.navigate(['/feed']);
        }
        break;
      case 'FOLLOW':
      case 'NEW_FOLLOWER':
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        const senderId = (notification as any).senderId || (notification as any).actorId;
        if (senderId) {
          this.router.navigate(['/profile', senderId]);
        } else {
          this.router.navigate(['/notifications']);
        }
        break;
      default:
        this.router.navigate(['/notifications']);
        break;
    }
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadNotificationCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  deleteNotification(notification: NotificationResponse, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        if (!notification.isRead) {
          this.unreadNotificationCount = Math.max(0, this.unreadNotificationCount - 1);
        }
        this.cdr.markForCheck();
      }
    });
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'LIKE': 'fa-heart',
      'COMMENT': 'fa-comment',
      'FOLLOW': 'fa-user-plus',
      'SHARE': 'fa-share-nodes',
      'CONNECTION_REQUEST': 'fa-user-clock',
      'CONNECTION_ACCEPTED': 'fa-user-check',
      'MESSAGE': 'fa-envelope'
    };
    return icons[type] || 'fa-bell';
  }

  getNotificationIconColor(type: string): string {
    const colors: Record<string, string> = {
      'LIKE': '#ef4444',
      'COMMENT': '#3b82f6',
      'FOLLOW': '#8b5cf6',
      'SHARE': '#10b981',
      'CONNECTION_REQUEST': '#f59e0b',
      'CONNECTION_ACCEPTED': '#10b981',
      'MESSAGE': '#06b6d4'
    };
    return colors[type] || '#64748b';
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date((dateString || '').endsWith('Z') ? dateString : dateString + 'Z');
    const now = new Date();
    const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (seconds < 60) return 'just now';

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' min ago';
    return Math.floor(seconds) + ' seconds ago';
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/explore'], { queryParams: { q: this.searchQuery.trim() } });
      this.searchQuery = ''; // Clear after search
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-btn-wrapper')) {
      this.notificationDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }
}

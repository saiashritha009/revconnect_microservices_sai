import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Navbar } from '../../../core/components/navbar/navbar';
import { Sidebar } from '../../../core/components/sidebar/sidebar';
import { NotificationService, NotificationResponse } from '../../../core/services/notification.service';
import { SearchService } from '../../../core/services/search.service';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { ConnectionService } from '../../../core/services/connection.service';
import { RouterModule, Router } from '@angular/router';
import { BottomNav } from '../../../core/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, Navbar, Sidebar, RouterModule, BottomNav],
  providers: [DatePipe],
  templateUrl: './notifications-page.html',
  styleUrls: ['./notifications-page.css']
})
export class NotificationsPage implements OnInit {
  notifications: any[] = [];
  isLoading = false;
  page = 0;
  totalPages = 1;

  constructor(
    private notificationService: NotificationService,
    private searchService: SearchService,
    private userService: UserService,
    private connectionService: ConnectionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadNotifications();
  }

  viewProfile(userId: number) {
    this.router.navigate(['/profile', userId]);
  }

  loadNotifications() {
    this.isLoading = true;
    this.notificationService.getNotifications(this.page, 20).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notifications = res.data.content.map((n: any) => ({
            ...n,
            isRead: n.isRead === true || n.read === true
          }));
          this.totalPages = res.data.totalPages;
          this.enrichActorDetails();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private enrichActorDetails() {
    const actorIds = [...new Set(this.notifications.map(n => n.actorId).filter(Boolean))];
    actorIds.forEach(actorId => {
      this.userService.getUserById(actorId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.notifications.forEach(n => {
              if (n.actorId === actorId) {
                n.actorName = res.data!.name;
                n.actorUsername = res.data!.username;
                n.actorProfilePicture = res.data!.profilePicture;
              }
            });
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  markAsRead(notification: any) {
    if (notification.isRead) return;

    // Optimistic UI update
    notification.isRead = true;
    this.notifications = [...this.notifications];
    this.cdr.detectChanges();

    this.notificationService.markAsRead(notification.id).subscribe({
      error: () => {
        // Revert on error
        notification.isRead = false;
        this.notifications = [...this.notifications];
        this.cdr.detectChanges();
      }
    });
  }

  navigateNotification(notification: any) {
    // Mark as read first
    if (!notification.isRead) {
      notification.isRead = true;
      this.notifications = [...this.notifications];
      this.cdr.detectChanges();
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Navigate based on type
    const type: string = notification.type || '';
    switch (type) {
      case 'LIKE':
      case 'COMMENT':
      case 'SHARE':
        // referenceId = postId for interaction notifications
        if (notification.referenceId) {
          this.router.navigate(['/feed'], { queryParams: { postId: notification.referenceId } });
        } else {
          this.router.navigate(['/feed']);
        }
        break;
      case 'FOLLOW':
      case 'NEW_FOLLOWER':
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
        // Navigate to the actor's profile
        if (notification.actorId) {
          this.router.navigate(['/profile', notification.actorId]);
        }
        break;
      default:
        this.router.navigate(['/feed']);
        break;
    }
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    this.cdr.detectChanges();

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notificationService.refreshUnreadCount();
      }
    });
  }

  deleteNotification(notification: any, event: Event) {
    event.stopPropagation();

    this.notifications = this.notifications.filter(n => n.id !== notification.id);
    this.cdr.detectChanges();

    this.notificationService.deleteNotification(notification.id).subscribe({
      error: () => {
        this.loadNotifications();
      }
    });
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'LIKE': return 'fa-solid fa-heart text-danger';
      case 'COMMENT': return 'fa-solid fa-comment text-primary';
      case 'FOLLOW':
      case 'NEW_FOLLOWER': return 'fa-solid fa-user-plus text-success';
      case 'SHARE': return 'fa-solid fa-share text-warning';
      case 'CONNECTION_REQUEST': return 'fa-solid fa-user-clock text-warning';
      case 'CONNECTION_ACCEPTED': return 'fa-solid fa-check-circle text-success';
      case 'BRAND_UPDATE': return 'fa-solid fa-bullhorn text-info';
      default: return 'fa-solid fa-bell text-info';
    }
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    // Backend stores LocalDateTime in UTC (Docker JVM timezone) but without 'Z' suffix.
    // Append 'Z' so JavaScript interprets it as UTC, not local time.
    const normalized = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(normalized);
    const now = new Date();
    const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
    if (seconds < 60) return 'just now';
    const intervals: [number, string][] = [[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'min']];
    for (const [secs, label] of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) return `${count} ${label}${count > 1 && label !== 'min' ? 's' : ''} ago`;
    }
    return Math.floor(seconds) + ' seconds ago';
  }
}

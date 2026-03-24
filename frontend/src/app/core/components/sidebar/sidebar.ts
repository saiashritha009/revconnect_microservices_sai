import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService, UserResponse } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { ConnectionService } from '../../services/connection.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit {
  currentUser: UserResponse | null = null;
  unreadNotifications = 0;
  unreadMessages = 0;
  pendingRequests = 0;

  constructor(
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService,
    private connectionService: ConnectionService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentUser = res.data;
          this.cdr.markForCheck();
        }
      }
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotifications = count;
      this.cdr.markForCheck();
    });

    this.notificationService.refreshUnreadCount();

    // Fetch unread messages
    this.messageService.getUnreadCount().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.unreadMessages = res.data.count;
          this.cdr.markForCheck();
        }
      }
    });

    // Fetch pending requests mapping internally to profile page badge
    this.connectionService.getPendingRequests(0, 1).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pendingRequests = res.data.totalElements;
          this.cdr.markForCheck();
        }
      }
    });
  }

  menuItems = [
    { icon: 'fa-house', label: 'Home', link: '/feed', active: true },
    { icon: 'fa-compass', label: 'Explore', link: '/explore', active: false },
    { icon: 'fa-bell', label: 'Notifications', link: '/notifications', active: false },
    { icon: 'fa-envelope', label: 'Messages', link: '/messages', active: false },
    { icon: 'fa-bookmark', label: 'Bookmarks', link: '/bookmarks', active: false },
    { icon: 'fa-chart-line', label: 'Analytics', link: '/analytics', active: false },
    { icon: 'fa-user', label: 'Profile', link: '/profile', active: false },
    { icon: 'fa-gear', label: 'Settings', link: '/settings', active: false }
  ];

  get filteredMenuItems() {
    return this.menuItems.filter(item => {
      if (item.label === 'Analytics') {
        return this.currentUser?.userType === 'CREATOR' || this.currentUser?.userType === 'BUSINESS';
      }
      return true;
    });
  }

  logout() {
    localStorage.removeItem('revconnect_token');
    this.router.navigate(['/login']);
  }
}

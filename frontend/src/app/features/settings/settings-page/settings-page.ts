import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Navbar } from '../../../core/components/navbar/navbar';
import { Sidebar } from '../../../core/components/sidebar/sidebar';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar],
  templateUrl: './settings-page.html',
  styleUrls: ['./settings-page.css']
})
export class SettingsPage {
  activeTab: 'account' | 'security' | 'links' | 'privacy' | 'notifications' | 'policy' = 'account';

  // State
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Security Form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  deletePassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showDeletePassword = false;

  // Links Form
  links: string[] = [];
  newLink = '';
  isLoadingLinks = false;

  // Privacy Form
  privacySetting: 'PUBLIC' | 'PRIVATE' = 'PUBLIC';

  // Notification Prefs
  notificationPrefs: Record<string, boolean> = {
    'notifyLike': true,
    'notifyComment': true,
    'notifyNewFollower': true,
    'emailNotifications': true,
    'notifyConnectionRequest': true,
    'notifyShare': true,
    'pushNotifications': true
  };

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.fetchLinks();
    this.fetchSettings();
  }

  setTab(tab: 'account' | 'security' | 'links' | 'privacy' | 'notifications' | 'policy') {
    this.activeTab = tab;
    this.clearMessages();
  }

  fetchSettings() {
    // Notification settings
    this.settingsService.getNotificationSettings().subscribe(res => {
      if (res.success && res.data) {
        this.notificationPrefs = { ...this.notificationPrefs, ...res.data };
        this.cdr.markForCheck();
      }
    });
    // Privacy settings
    this.settingsService.getPrivacySettings().subscribe(res => {
      if (res.success && res.data && res.data['privacy']) {
        this.privacySetting = res.data['privacy'] as 'PUBLIC' | 'PRIVATE';
        this.cdr.markForCheck();
      }
    });
  }

  fetchLinks() {
    this.isLoadingLinks = true;
    this.cdr.markForCheck();
    this.settingsService.getExternalLinks().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.links = res.data;
        }
        this.isLoadingLinks = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingLinks = false;
        this.cdr.markForCheck();
      }
    });
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.showError('All password fields are required');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.showError('New passwords do not match');
      return;
    }
    if (this.newPassword.length < 6) {
      this.showError('Password must be at least 6 characters');
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.showError('New password must be different from your current password');
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.settingsService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.success === false) {
          this.showError(res.message || 'Failed to change password');
        } else {
          this.showSuccess('Password updated successfully');
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.showError(err?.error?.message || 'Failed to change password');
        this.cdr.markForCheck();
      }
    });
  }

  deactivateAccount() {
    if (!confirm('Are you sure you want to deactivate your account? This will hide your profile.')) return;

    this.isLoading = true;
    this.settingsService.deactivateAccount().subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading = false;
        this.showError('Failed to deactivate account');
        this.cdr.markForCheck();
      }
    });
  }

  deleteAccount() {
    if (!this.deletePassword) {
      this.showError('You must enter your password to delete your account.');
      return;
    }
    if (!confirm('Are you ABSOLUTELY sure? This cannot be undone and deletes all your data.')) return;

    this.isLoading = true;
    this.settingsService.deleteAccount(this.deletePassword).subscribe({
      next: (res: any) => {
        if (res && res.success === false) {
          this.isLoading = false;
          this.showError(res.message || 'Failed to delete account');
          this.cdr.markForCheck();
        } else {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.showError(err?.error?.message || 'Failed to delete account');
        this.cdr.markForCheck();
      }
    });
  }

  addLink() {
    if (!this.newLink || !this.newLink.startsWith('http')) {
      this.showError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    this.isLoadingLinks = true;
    this.settingsService.addExternalLink(this.newLink).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.links = res.data;
          this.newLink = '';
        }
        this.isLoadingLinks = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoadingLinks = false;
        this.showError(err?.error?.message || 'Failed to add link');
        this.cdr.markForCheck();
      }
    });
  }

  removeLink(link: string) {
    this.isLoadingLinks = true;
    this.settingsService.removeExternalLink(link).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.links = res.data;
        }
        this.isLoadingLinks = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingLinks = false;
        this.cdr.markForCheck();
      }
    });
  }

  getLinkDisplay(link: any): string {
    if (typeof link === 'string') {
      try {
        if (link.startsWith('{')) {
          const obj = JSON.parse(link.replace(/'/g, '"'));
          return obj.title || obj.url || this.cleanUrlForDisplay(link);
        }
      } catch (e) { }

      // Custom Regex for weird formats like {title:Nike and url:www.nike.com}
      const titleMatch = link.match(/title:\s*([^,}\s]+)/i);
      if (titleMatch) return titleMatch[1];

      const urlMatch = link.match(/url:\s*([^,}\s]+)/i);
      if (urlMatch) return this.cleanUrlForDisplay(urlMatch[1]);

      return this.cleanUrlForDisplay(link);
    }
    return link.title || link.url || 'Link';
  }

  getLinkUrl(link: any): string {
    if (typeof link === 'string') {
      try {
        if (link.startsWith('{')) {
          const obj = JSON.parse(link.replace(/'/g, '"'));
          return obj.url || link;
        }
      } catch (e) { }

      const urlMatch = link.match(/url:\s*([^,}\s]+)/i);
      let extractedUrl = urlMatch ? urlMatch[1] : link;

      extractedUrl = extractedUrl.replace(/[{}]/g, '').trim();

      // Basic validation for clickability
      if (!extractedUrl.startsWith('http') && extractedUrl.includes('.')) {
        return 'https://' + extractedUrl;
      }
      return extractedUrl;
    }
    return link.url || '#';
  }

  private cleanUrlForDisplay(rawText: string): string {
    let clean = rawText.replace(/[{}]/g, '').trim();
    if (clean.includes('url:')) clean = clean.replace(/url:/gi, '');
    if (clean.includes('title:')) clean = clean.replace(/title:/gi, '');

    clean = clean.replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean || rawText;
  }

  savePrivacy() {
    this.isLoading = true;
    this.clearMessages();
    this.settingsService.updatePrivacySettings({ privacy: this.privacySetting }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess('Privacy settings updated successfully');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.showError(err?.error?.message || 'Failed to update privacy settings');
        this.cdr.markForCheck();
      }
    });
  }

  saveNotifications() {
    this.isLoading = true;
    this.clearMessages();
    this.settingsService.updateNotificationSettings(this.notificationPrefs).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess('Notification preferences updated successfully');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.showError(err?.error?.message || 'Failed to update notification preferences');
        this.cdr.markForCheck();
      }
    });
  }

  private showSuccess(msg: string) {
    this.clearMessages();
    this.successMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  private showError(msg: string) {
    this.clearMessages();
    this.errorMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}

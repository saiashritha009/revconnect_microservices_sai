import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryService, StoryResponse } from '../../../core/services/story.service';
import { MediaService } from '../../../core/services/media.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, UserResponse } from '../../../core/services/user.service';

@Component({
  selector: 'app-stories-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './stories-feed.html',
  styleUrls: ['./stories-feed.css']
})
export class StoriesFeed implements OnInit, OnDestroy {
  stories: StoryResponse[] = [];
  myStories: StoryResponse[] = [];
  currentUser: UserResponse | null = null;
  isLoading = false;

  // Create Story Modal active state
  showCreateModal = false;
  selectedMediaFile: File | null = null;
  mediaPreviewUrl: string | null = null;
  newStoryCaption = '';
  isCreating = false;
  isUploadingMedia = false;

  // View Story Modal
  activeStoryToView: StoryResponse | null = null;

  // Story timer
  storyTimerRef: any = null;
  storyDuration = 5000; // 5 seconds for images
  storyProgress = 0;
  storyProgressInterval: any = null;

  constructor(
    private storyService: StoryService,
    private mediaService: MediaService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.userService.getMyProfile().subscribe(res => {
      if (res.success) {
        this.currentUser = res.data;
        this.cdr.markForCheck();
      }
    });
    this.loadStories();
  }

  loadStories() {
    this.isLoading = true;
    this.storyService.getStoriesFeed().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stories = res.data || [];
          // Enrich stories missing user data (Feign enrichment may fail in Docker)
          this.enrichStoryUsers();
        }
        // Also fetch my stories separately to show "Add to your story" correctly
        this.fetchMyStories();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private enrichStoryUsers() {
    const needsEnrichment = this.stories.filter(s => !s.user?.name);
    const uniqueUserIds = [...new Set(needsEnrichment.map(s => s.userId))];
    uniqueUserIds.forEach(uid => {
      this.userService.getUserById(uid).subscribe({
        next: (userRes) => {
          if (userRes.success && userRes.data) {
            this.stories.forEach(s => {
              if (s.userId === uid) {
                s.user = {
                  id: userRes.data!.id,
                  username: userRes.data!.username,
                  name: userRes.data!.name,
                  profilePicture: userRes.data!.profilePicture || ''
                };
              }
            });
            this.cdr.markForCheck();
          }
        }
      });
    });
  }

  fetchMyStories() {
    this.storyService.getMyStories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.myStories = (res.data || []).map(s => ({
            ...s,
            user: s.user || {
              id: this.currentUser?.id || s.userId,
              username: this.currentUser?.username || '',
              name: this.currentUser?.name || '',
              profilePicture: this.currentUser?.profilePicture || ''
            }
          }));
          // Remove own stories from the feed to avoid duplicates
          const myStoryIds = new Set(this.myStories.map(s => s.id));
          this.stories = this.stories.filter(s => !myStoryIds.has(s.id));
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.selectedMediaFile = null;
    this.mediaPreviewUrl = null;
    this.newStoryCaption = '';
    this.cdr.markForCheck();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.selectedMediaFile = null;
    this.mediaPreviewUrl = null;
    this.cdr.markForCheck();
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedMediaFile = input.files[0];

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.mediaPreviewUrl = e.target?.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(this.selectedMediaFile);
    }
  }

  removeSelectedMedia() {
    this.selectedMediaFile = null;
    this.mediaPreviewUrl = null;
    this.cdr.markForCheck();
  }

  createStory() {
    if (!this.selectedMediaFile) return;

    this.isCreating = true;
    this.isUploadingMedia = true;
    this.cdr.markForCheck();

    // Handle video or general file upload
    const uploadAction = this.selectedMediaFile.type.startsWith('video/')
      ? this.mediaService.uploadVideo(this.selectedMediaFile)
      : this.mediaService.uploadFile(this.selectedMediaFile);

    uploadAction.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.publishStory(res.data.url);
        } else {
          this.isCreating = false;
          this.isUploadingMedia = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error uploading story media:', err);
        this.isCreating = false;
        this.isUploadingMedia = false;
        alert('Failed to upload media. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  private publishStory(mediaUrl: string) {
    this.storyService.createStory(mediaUrl, this.newStoryCaption).subscribe({
      next: (res) => {
        this.isCreating = false;
        this.isUploadingMedia = false;
        this.closeCreateModal();
        this.loadStories(); // Refresh feed
      },
      error: (err) => {
        this.isCreating = false;
        this.isUploadingMedia = false;
        alert(err?.error?.message || 'Failed to create story');
        this.cdr.markForCheck();
      }
    });
  }

  viewStory(story: StoryResponse) {
    this.activeStoryToView = story;
    this.storyProgress = 0;
    this.cdr.markForCheck();
    // Call backend to increment view count
    this.storyService.viewStory(story.id).subscribe();
    this.startStoryTimer();
  }

  closeStoryView() {
    this.clearStoryTimer();
    this.activeStoryToView = null;
    this.storyProgress = 0;
    this.cdr.markForCheck();
  }

  private startStoryTimer() {
    this.clearStoryTimer();
    const isVideo = this.activeStoryToView?.mediaUrl?.endsWith('.mp4') || this.activeStoryToView?.mediaUrl?.endsWith('.webm');
    const duration = isVideo ? 15000 : this.storyDuration;
    const step = 50; // update every 50ms
    const increment = (step / duration) * 100;
    this.storyProgress = 0;
    this.storyProgressInterval = setInterval(() => {
      this.storyProgress += increment;
      if (this.storyProgress >= 100) {
        this.storyProgress = 100;
        this.closeStoryView();
      }
      this.cdr.markForCheck();
    }, step);
  }

  private clearStoryTimer() {
    if (this.storyProgressInterval) {
      clearInterval(this.storyProgressInterval);
      this.storyProgressInterval = null;
    }
  }

  ngOnDestroy() {
    this.clearStoryTimer();
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    let normalized = dateString;
    if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-', 10)) {
      normalized += 'Z';
    }
    const date = new Date(normalized);
    const now = new Date();
    const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
    if (seconds < 60) return 'just now';
    const intervals: [number, string][] = [[86400,'d'],[3600,'h'],[60,'m']];
    for (const [secs, label] of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) return `${count}${label} ago`;
    }
    return 'just now';
  }

  get isMyActiveStory(): boolean {
    if (!this.activeStoryToView) return false;
    return this.myStories.some(s => s.id === this.activeStoryToView?.id);
  }

  deleteStory() {
    if (!this.activeStoryToView) return;
    if (!confirm('Are you sure you want to delete this story?')) return;

    this.storyService.deleteStory(this.activeStoryToView.id).subscribe({
      next: () => {
        this.closeStoryView();
        this.loadStories();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete story');
      }
    });
  }
}

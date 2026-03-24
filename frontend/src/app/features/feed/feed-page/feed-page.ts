import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../../core/components/navbar/navbar';
import { Sidebar } from '../../../core/components/sidebar/sidebar';
import { FormsModule } from '@angular/forms';
import { PostService, PostResponse } from '../../../core/services/post.service';
import { InteractionService, CommentResponse } from '../../../core/services/interaction.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { MediaService } from '../../../core/services/media.service';
import { StoriesFeed } from '../../stories/stories-feed/stories-feed';
import { AnalyticsService, AnalyticsOverview } from '../../../core/services/analytics.service';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { SearchService } from '../../../core/services/search.service';
import { HashtagTextComponent } from '../../../shared/components/hashtag-text/hashtag-text.component';
import { BottomNav } from '../../../core/components/bottom-nav/bottom-nav';
import { ConnectionService } from '../../../core/services/connection.service';
import { MessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Sidebar, FormsModule, StoriesFeed, HashtagTextComponent, BottomNav],
  templateUrl: './feed-page.html',
  styleUrls: ['./feed-page.css']
})
export class FeedPage implements OnInit {
  posts: PostResponse[] = [];
  newPostContent = '';
  selectedMediaFile: File | null = null;
  mediaPreviewUrl: string | null = null;
  isUploadingMedia = false;
  isLoading = false;

  // Business Post Fields
  showBusinessTools = false;
  showScheduleTool = false;
  ctaLabelInput = '';
  ctaUrlInput = '';
  scheduleDateOnlyInput = '';
  scheduleHourInput = '';
  scheduleMinuteInput = '';
  scheduleAmPmInput = 'AM';
  isPromotionalInput = false;
  partnerNameInput = '';
  postCategoryInput: 'STANDARD' | 'ANNOUNCEMENT' | 'UPDATE' = 'STANDARD';
  productTagsInput = '';

  get minDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatScheduleTime() {
    if (this.scheduleHourInput) {
      let h = parseInt(this.scheduleHourInput, 10);
      if (isNaN(h) || h < 1) h = 12;
      if (h > 12) h = 12;
      this.scheduleHourInput = String(h).padStart(2, '0');
    }

    if (this.scheduleMinuteInput) {
      let m = parseInt(this.scheduleMinuteInput, 10);
      if (isNaN(m) || m < 0) m = 0;
      if (m > 59) m = 59;
      this.scheduleMinuteInput = String(m).padStart(2, '0');
    }
  }

  focusNextIfFull(value: string, nextElement: HTMLInputElement) {
    if (value && value.length === 2) {
      nextElement.focus();
    }
  }

  // Like state: { postId -> true/false }
  likedMap: { [postId: number]: boolean } = {};

  // Comment panel state: { postId -> boolean (open) }
  commentOpenMap: { [postId: number]: boolean } = {};

  // Comments data per post: { postId -> CommentResponse[] }
  commentsMap: { [postId: number]: CommentResponse[] } = {};

  // New comment input per post
  newCommentMap: { [postId: number]: string } = {};

  // Loading state per comment section
  commentLoadingMap: { [postId: number]: boolean } = {};

  // Bookmark state: { postId -> true/false }
  bookmarkedMap: { [postId: number]: boolean } = {};

  analyticsOverview: AnalyticsOverview | null = null;
  isLoadingAnalytics = false;

  trendingTopics: string[] = [];

  // Management State
  currentUser: UserResponse | null = null;
  postOptionsOpenMap: { [id: number]: boolean } = {};
  editingPostId: number | null = null;
  editPostContent: string = '';
  commentOptionsOpenMap: { [id: number]: boolean } = {};

  editingCommentId: number | null = null;
  editCommentContent: string = '';

  // Comment Likes & Replies
  commentLikedMap: { [commentId: number]: boolean } = {};
  repliesMap: { [commentId: number]: CommentResponse[] } = {};
  commentReplyOpenMap: { [commentId: number]: boolean } = {};
  commentReplyInputMap: { [commentId: number]: string } = {};
  commentRepliesLoadingMap: { [commentId: number]: boolean } = {};

  // Share Modal State
  shareModalOpen = false;
  sharePostId: number | null = null;
  followingUsers: { userId: number; username: string; name: string; profilePicture: string | null }[] = [];
  shareUserSearch = '';
  isSendingShare = false;
  shareSuccessMap: { [userId: number]: boolean } = {};
  shareSendingMap: { [userId: number]: boolean } = {};

  constructor(
    private postService: PostService,
    private interactionService: InteractionService,
    private bookmarkService: BookmarkService,
    private mediaService: MediaService,
    private analyticsService: AnalyticsService,
    private userService: UserService,
    private searchService: SearchService,
    private connectionService: ConnectionService,
    private messageService: MessageService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success) this.currentUser = res.data;
        this.loadFeed();
        if (this.currentUser?.userType === 'BUSINESS' || this.currentUser?.userType === 'CREATOR') {
          this.loadAnalytics();
        }
        this.loadTrending();
      }
    });
  }

  loadTrending() {
    // Fetch actual hashtags from post-service
    this.http.get<any[]>('/api/hashtags/trending?limit=10').subscribe({
      next: (tags) => {
        if (tags && tags.length > 0) {
          this.trendingTopics = tags.map((t: any) => t.tag || t.name).filter((t: string) => !!t);
          this.cdr.markForCheck();
        } else {
          this.fallbackTrending();
        }
      },
      error: () => this.fallbackTrending()
    });
  }

  private fallbackTrending() {
    // Extract hashtags from loaded posts as fallback
    const hashtagSet = new Set<string>();
    this.posts.forEach(p => {
      const matches = (p.content || '').match(/#(\w+)/g);
      if (matches) matches.forEach(m => hashtagSet.add(m.substring(1).toLowerCase()));
    });
    if (hashtagSet.size > 0) {
      this.trendingTopics = Array.from(hashtagSet).slice(0, 10);
    }
    this.cdr.markForCheck();
  }

  loadAnalytics() {
    this.isLoadingAnalytics = true;
    this.analyticsService.getOverview().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.analyticsOverview = res.data;
        }
        this.isLoadingAnalytics = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading analytics:', err);
        this.isLoadingAnalytics = false;
        this.cdr.markForCheck();
      }
    });
  }

  sortPosts() {
    const myId = this.currentUser?.id;
    this.posts = [...this.posts].sort((a, b) => {
      // 1. Pinned status - only pin to top if current user is the author
      const aPinned = a.pinned && (a.authorId == myId || a.userId == myId);
      const bPinned = b.pinned && (b.authorId == myId || b.userId == myId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 2. Creation date (most recent first)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    this.cdr.markForCheck();
  }

  // Management logic
  togglePostOptions(postId: number) {
    // Close others
    const currentState = this.postOptionsOpenMap[postId];
    this.postOptionsOpenMap = {};
    this.commentOptionsOpenMap = {};
    this.postOptionsOpenMap[postId] = !currentState;
    this.cdr.markForCheck();
  }

  isPostAuthor(post: PostResponse): boolean {
    return this.currentUser?.id == post.authorId || this.currentUser?.id == post.userId;
  }

  isCommentAuthor(comment: CommentResponse): boolean {
    return this.currentUser?.id == comment.userId;
  }

  canEditComment(comment: CommentResponse): boolean {
    return this.currentUser?.id == comment.userId;
  }

  canDeleteComment(comment: CommentResponse, post: PostResponse | null): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.id == comment.userId || (post ? this.currentUser.id == post.authorId : false);
  }

  toggleCommentOptions(commentId: number) {
    const currentState = this.commentOptionsOpenMap[commentId];
    this.postOptionsOpenMap = {};
    this.commentOptionsOpenMap = {};
    this.commentOptionsOpenMap[commentId] = !currentState;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // If not clicking on an ellipsis or a dropdown option, close all
    if (!target.closest('.options-btn') && !target.closest('.options-dropdown')) {
      this.postOptionsOpenMap = {};
      this.commentOptionsOpenMap = {};
      this.cdr.markForCheck();
    }
  }

  deletePost(postId: number) {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(postId).subscribe({
        next: (res) => {
          if (res.success) {
            this.posts = this.posts.filter(p => p.id !== postId);
            this.cdr.markForCheck();
          }
        }
      });
    }
  }

  editPost(post: PostResponse) {
    this.editingPostId = post.id;
    this.editPostContent = post.content;
    this.postOptionsOpenMap[post.id] = false;
  }

  savePostEdit(postId: number) {
    if (!this.editPostContent.trim()) return;
    this.postService.updatePost(postId, { content: this.editPostContent }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.posts.findIndex(p => p.id === postId);
          if (idx !== -1) {
            this.posts[idx] = res.data;
          }
          this.editingPostId = null;
          this.cdr.markForCheck();
        }
      }
    });
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editPostContent = '';
  }

  togglePin(postId: number) {
    this.postService.togglePin(postId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.posts.findIndex(p => p.id === postId);
          if (idx !== -1) {
            this.posts[idx] = res.data;
            this.sortPosts();
          }
          this.postOptionsOpenMap[postId] = false;
          this.cdr.markForCheck();
        }
      }
    });
  }

  deleteComment(commentId: number, postId: number) {
    if (confirm('Delete this comment?')) {
      this.interactionService.deleteComment(commentId).subscribe({
        next: (res) => {
          if (res.success) {
            this.commentsMap[postId] = this.commentsMap[postId].filter(c => c.id !== commentId);
            const post = this.posts.find(p => p.id === postId);
            if (post) post.commentCount--;
            this.cdr.markForCheck();
          }
        }
      });
    }
  }

  editComment(comment: CommentResponse, postId: number) {
    this.editingCommentId = comment.id;
    this.editCommentContent = comment.content;
  }

  saveCommentEdit(commentId: number, postId: number) {
    if (!this.editCommentContent.trim()) return;
    this.interactionService.updateComment(commentId, this.editCommentContent).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.commentsMap[postId].findIndex(c => c.id === commentId);
          if (idx !== -1) this.commentsMap[postId][idx] = res.data;
          this.editingCommentId = null;
          this.cdr.markForCheck();
        }
      }
    });
  }

  cancelCommentEdit() {
    this.editingCommentId = null;
    this.editCommentContent = '';
  }

  loadFeed() {
    this.isLoading = true;
    this.cdr.markForCheck();

    // Always fetch own posts alongside the personalized feed to guarantee they appear
    const feedPosts: PostResponse[] = [];
    let feedDone = false;
    let myPostsDone = false;

    const tryMerge = () => {
      if (!feedDone || !myPostsDone) return;
      // Merge: add own posts that aren't already in the feed
      const existingIds = new Set(feedPosts.map(p => p.id));
      const myOnly = this._myFeedPosts.filter(p => !existingIds.has(p.id));
      const merged = [...feedPosts, ...myOnly];
      // Sort by createdAt descending
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.populateFeed(merged);
      this.isLoading = false;
      this.cdr.markForCheck();
    };

    // 1. Fetch personalized feed
    this.postService.getPersonalizedFeed(0, 20).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.content) {
          feedPosts.push(...response.data.content);
        }
        feedDone = true;
        tryMerge();
      },
      error: () => {
        feedDone = true;
        tryMerge();
      }
    });

    // 2. Fetch own posts in parallel
    this.postService.getMyPosts(0, 20).subscribe({
      next: (myRes) => {
        if (myRes.success && myRes.data && myRes.data.content) {
          this._myFeedPosts = myRes.data.content;
        }
        myPostsDone = true;
        tryMerge();
      },
      error: () => {
        myPostsDone = true;
        tryMerge();
      }
    });
  }

  private _myFeedPosts: PostResponse[] = [];

  private populateFeed(posts: PostResponse[]) {
    this.posts = posts;
    this.sortPosts();
    // Retry trending if empty now that posts are loaded
    if (this.trendingTopics.length === 0) {
      this.fallbackTrending();
    }
    this.posts.forEach(post => {
      this.checkLikeStatus(post.id);
      this.checkBookmarkStatus(post.id);
      this.fetchRealCounts(post);
      this.interactionService.recordView(post.id).subscribe();
    });
    this.enrichPostAuthors();
    this.cdr.markForCheck();
  }

  private enrichPostAuthors() {
    const needsEnrichment = this.posts.filter(p => !p.authorName);
    const uniqueUserIds = [...new Set(needsEnrichment.map(p => p.userId || p.authorId))];
    uniqueUserIds.forEach(uid => {
      if (!uid) return;
      this.userService.getUserById(uid).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.posts.forEach(p => {
              if ((p.userId === uid || p.authorId === uid) && !p.authorName) {
                p.authorName = res.data!.name;
                p.authorUsername = res.data!.username;
                p.authorProfilePicture = res.data!.profilePicture || '';
              }
            });
            this.cdr.markForCheck();
          }
        }
      });
    });
  }

  private fetchRealCounts(post: PostResponse) {
    this.interactionService.getPostLikeCount(post.id).subscribe({
      next: (res: any) => {
        if (res && res.likeCount !== undefined) {
          post.likeCount = res.likeCount;
          this.cdr.markForCheck();
        }
      }
    });
    this.interactionService.getComments(post.id, 0, 1).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          post.commentCount = res.data.totalElements;
          this.cdr.markForCheck();
        }
      }
    });
    this.interactionService.getPostShareCount(post.id).subscribe({
      next: (res) => {
        if (res.success && res.data?.shareCount !== undefined) {
          post.shareCount = res.data.shareCount;
          this.cdr.markForCheck();
        }
      }
    });
    this.interactionService.getViewCount(post.id).subscribe({
      next: (res) => {
        if (res.success && res.data?.viewCount !== undefined) {
          (post as any).viewCount = res.data.viewCount;
          this.cdr.markForCheck();
        }
      }
    });
  }

  checkLikeStatus(postId: number) {
    this.interactionService.hasLikedPost(postId).subscribe({
      next: (res) => {
        if (res.success) {
          this.likedMap[postId] = !!res.data;
          this.cdr.markForCheck();
        }
      }
    });
  }

  checkBookmarkStatus(postId: number) {
    this.bookmarkService.isBookmarked(postId).subscribe({
      next: (res) => {
        if (res.success) {
          this.bookmarkedMap[postId] = !!res.data;
          this.cdr.markForCheck();
        }
      }
    });
  }

  toggleBookmark(postId: number) {
    const isBookmarked = this.bookmarkedMap[postId];
    this.bookmarkedMap[postId] = !isBookmarked; // Optimistic

    const action = isBookmarked
      ? this.bookmarkService.removeBookmark(postId)
      : this.bookmarkService.bookmarkPost(postId);

    action.subscribe({
      error: () => {
        this.bookmarkedMap[postId] = isBookmarked; // Revert on error
        this.cdr.markForCheck();
      }
    });
    this.cdr.markForCheck();
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  toggleBusinessTools() {
    this.showBusinessTools = !this.showBusinessTools;
  }

  isCreator(): boolean {
    return this.currentUser?.userType === 'CREATOR';
  }

  toggleScheduleTool() {
    this.showScheduleTool = !this.showScheduleTool;
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

  createPost() {
    if (!this.newPostContent.trim() && !this.selectedMediaFile) return;

    if (this.selectedMediaFile) {
      this.isUploadingMedia = true;
      this.cdr.markForCheck();

      // Handle video or general file upload
      const uploadAction = this.selectedMediaFile.type.startsWith('video/')
        ? this.mediaService.uploadVideo(this.selectedMediaFile)
        : this.mediaService.uploadFile(this.selectedMediaFile);

      uploadAction.subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.publishPost(res.data.url);
          } else {
            console.error('Media upload returned unsuccessful response:', res);
            alert('Media upload failed: ' + (res.message || 'Unknown error'));
            this.isUploadingMedia = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error uploading media:', err);
          alert('Error uploading media. Please check your connection.');
          this.isUploadingMedia = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.publishPost();
    }
  }

  private publishPost(mediaUrl?: string) {
    let finalContent = this.newPostContent;

    // Encode CTA tags for Business/Creator users - add if inputs have values
    if (this.ctaLabelInput.trim() && this.ctaUrlInput.trim()) {
      finalContent += `\n[[CTA|${this.ctaLabelInput.trim()}|${this.ctaUrlInput.trim()}]]`;
    }

    if (this.isPromotionalInput && this.isCreator() && this.partnerNameInput.trim()) {
      finalContent += `\n[[PROMO|${this.partnerNameInput.trim()}]]`;
    }

    if (this.isCreator() && this.productTagsInput.trim()) {
      const cleanedTags = this.productTagsInput.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .join(',');
      if (cleanedTags) {
        finalContent += `\n[[TAGS|${cleanedTags}]]`;
      }
    }

    let postType: string;
    if (this.postCategoryInput !== 'STANDARD') {
      postType = this.postCategoryInput;
    } else {
      postType = mediaUrl ? (this.selectedMediaFile?.type.startsWith('video/') ? 'VIDEO' : 'IMAGE') : 'TEXT';
    }

    if ((this.showBusinessTools || this.showScheduleTool) && this.scheduleDateOnlyInput) {
      // Build ISO string from 12-hour inputs
      let hour = parseInt(this.scheduleHourInput, 10) || 12;
      if (this.scheduleAmPmInput === 'PM' && hour !== 12) {
        hour += 12;
      } else if (this.scheduleAmPmInput === 'AM' && hour === 12) {
        hour = 0;
      }
      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(parseInt(this.scheduleMinuteInput, 10) || 0).padStart(2, '0');
      const timeIso = `${hourStr}:${minStr}:00`;

      // Convert to UTC to match Docker container's LocalDateTime.now() which runs in UTC
      const localDate = new Date(this.scheduleDateOnlyInput + 'T' + timeIso);
      const publishAtIso = localDate.toISOString().substring(0, 19);
      const request = {
        content: finalContent,
        postType: postType as any,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
        scheduledAt: publishAtIso,
        ctaLabel: this.ctaLabelInput,
        ctaUrl: this.ctaUrlInput,
        isPromotional: this.isPromotionalInput,
        partnerName: this.partnerNameInput,
        productTags: this.productTagsInput ? this.productTagsInput.split(',').map(t => t.trim()) : undefined
      };
      this.postService.schedulePost(request).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Post scheduled successfully for ' + localDate.toLocaleString());
            this.resetPostForm();
          }
          this.isUploadingMedia = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error scheduling post:', err);
          const backendMsg = err.error?.message || err.message || 'Unknown error';
          alert(`Failed to schedule post: ${backendMsg}`);
          this.isUploadingMedia = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      const request = {
        content: finalContent,
        postType: postType as any,
        mediaUrls: mediaUrl ? [mediaUrl] : undefined,
        ctaLabel: this.ctaLabelInput,
        ctaUrl: this.ctaUrlInput,
        isPromotional: this.isPromotionalInput,
        partnerName: this.partnerNameInput,
        productTags: this.productTagsInput ? this.productTagsInput.split(',').map(t => t.trim()) : undefined
      };

      this.postService.createPost(request).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.posts.unshift(response.data);
            this.sortPosts();
            this.likedMap[response.data.id] = false;
            this.resetPostForm();
          } else {
            alert('Error: ' + (response.message || 'Failed to create post'));
          }
          this.isUploadingMedia = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error creating post:', err);
          alert(`Failed to create post. Status: ${err.status}. Error: ${err.message || 'Unknown'}`);
          this.isUploadingMedia = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  private resetPostForm() {
    this.newPostContent = '';
    this.ctaLabelInput = '';
    this.ctaUrlInput = '';
    this.scheduleDateOnlyInput = '';
    this.scheduleHourInput = '';
    this.scheduleMinuteInput = '';
    this.scheduleAmPmInput = 'AM';
    this.isPromotionalInput = false;
    this.partnerNameInput = '';
    this.productTagsInput = '';
    this.postCategoryInput = 'STANDARD';
    this.showBusinessTools = false;
    this.showScheduleTool = false;
    this.removeSelectedMedia();
  }

  toggleLike(postId: number) {
    const isLiked = this.likedMap[postId];
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    this.likedMap[postId] = !isLiked;
    post.likeCount = isLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1;
    this.cdr.markForCheck();

    const action = isLiked
      ? this.interactionService.unlikePost(postId)
      : this.interactionService.likePost(postId);

    action.subscribe({
      error: () => {
        // Revert on error
        this.likedMap[postId] = isLiked;
        post.likeCount = isLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);
        this.cdr.markForCheck();
      }
    });
  }

  toggleComments(postId: number) {
    this.commentOpenMap[postId] = !this.commentOpenMap[postId];

    if (this.commentOpenMap[postId]) {
      // Record view when user intentionally opens comments
      this.postService.recordView(postId).subscribe();

      if (!this.commentsMap[postId]) {
        this.loadComments(postId);
      }
    }
    this.cdr.markForCheck();
  }

  loadComments(postId: number) {
    this.commentLoadingMap[postId] = true;
    this.cdr.markForCheck();

    this.interactionService.getComments(postId, 0, 10).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.commentsMap[postId] = res.data.content;
        }
        this.commentLoadingMap[postId] = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.commentLoadingMap[postId] = false;
        this.cdr.markForCheck();
      }
    });
  }

  submitComment(postId: number) {
    const content = (this.newCommentMap[postId] || '').trim();
    if (!content) return;

    this.interactionService.addComment(postId, content).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (!this.commentsMap[postId]) this.commentsMap[postId] = [];
          this.commentsMap[postId].unshift(res.data);
          this.newCommentMap[postId] = '';
          // Update comment count on post
          const post = this.posts.find(p => p.id === postId);
          if (post) post.commentCount++;
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error adding comment:', err)
    });
  }

  toggleCommentLike(commentId: number, postId: number) {
    const comment = this.commentsMap[postId]?.find(c => c.id === commentId) ||
      Object.values(this.repliesMap).flat().find(c => c.id === commentId);
    if (!comment) return;

    const isLiked = comment.isLikedByCurrentUser;
    comment.isLikedByCurrentUser = !isLiked;
    comment.likeCount = isLiked ? Math.max(0, comment.likeCount - 1) : comment.likeCount + 1;
    this.cdr.markForCheck();

    const action = isLiked
      ? this.interactionService.unlikeComment(commentId)
      : this.interactionService.likeComment(commentId);

    action.subscribe({
      error: () => {
        comment.isLikedByCurrentUser = isLiked;
        comment.likeCount = isLiked ? comment.likeCount + 1 : Math.max(0, comment.likeCount - 1);
        this.cdr.markForCheck();
      }
    });
  }

  toggleReplies(commentId: number) {
    this.commentReplyOpenMap[commentId] = !this.commentReplyOpenMap[commentId];
    if (this.commentReplyOpenMap[commentId] && !this.repliesMap[commentId]) {
      this.loadReplies(commentId);
    }
    this.cdr.markForCheck();
  }

  loadReplies(commentId: number) {
    this.commentRepliesLoadingMap[commentId] = true;
    this.cdr.markForCheck();

    this.interactionService.getCommentReplies(commentId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.repliesMap[commentId] = res.data.content;
        }
        this.commentRepliesLoadingMap[commentId] = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.commentRepliesLoadingMap[commentId] = false;
        this.cdr.markForCheck();
      }
    });
  }

  submitReply(postId: number, commentId: number) {
    const content = (this.commentReplyInputMap[commentId] || '').trim();
    if (!content) return;

    this.interactionService.addComment(postId, content, commentId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (!this.repliesMap[commentId]) this.repliesMap[commentId] = [];
          this.repliesMap[commentId].push(res.data);
          this.commentReplyInputMap[commentId] = '';

          // Increment reply count on parent
          const parent = this.commentsMap[postId]?.find(c => c.id === commentId);
          if (parent) {
            parent.replyCount = (parent.replyCount || 0) + 1;
          }

          // Increment post comment count
          const post = this.posts.find(p => p.id === postId);
          if (post) post.commentCount++;

          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error adding reply:', err)
    });
  }

  openShareModal(postId: number) {
    this.sharePostId = postId;
    this.shareUserSearch = '';
    this.shareSuccessMap = {};
    this.followingUsers = [];
    this.shareModalOpen = true;
    const userId = this.currentUser?.id;
    if (!userId) return;
    this.connectionService.getFollowing(userId, 0, 100).subscribe({
      next: (res) => {
        if (res.success && res.data?.content) {
          this.followingUsers = res.data.content.map((c: any) => ({
            userId: c.userId,
            username: c.username,
            name: c.name,
            profilePicture: c.profilePicture
          }));
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error fetching following users:', err)
    });
  }

  closeShareModal() {
    this.shareModalOpen = false;
    this.sharePostId = null;
  }

  get filteredShareUsers() {
    const q = this.shareUserSearch.toLowerCase();
    if (!q) return this.followingUsers;
    return this.followingUsers.filter(u =>
      u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }

  cleanPostContent(content: string | undefined): string {
    if (!content) return '';
    let clean = content
      .replace(/\[\[CTA\|[^\]]*\]\]/g, '')
      .replace(/\[\[PROMO\|[^\]]*\]\]/g, '')
      .replace(/\[\[PRODUCT_TAGS\|[^\]]*\]\]/g, '')
      .replace(/\[\[TAGS\|[^\]]*\]\]/g, '')
      .trim();
    return clean.length > 120 ? clean.substring(0, 120) + '...' : clean;
  }

  copyPostLink() {
    if (!this.sharePostId) return;
    const postUrl = `${window.location.origin}/post/${this.sharePostId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('Post link copied to clipboard!');
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = postUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Post link copied to clipboard!');
    });
  }

  sendPostToUser(recipientId: number) {
    if (!this.sharePostId || this.shareSuccessMap[recipientId] || this.shareSendingMap[recipientId]) return;
    this.shareSendingMap[recipientId] = true;
    this.cdr.markForCheck();
    const post = this.posts.find(p => p.id === this.sharePostId);
    const postUrl = `${window.location.origin}/post/${this.sharePostId}`;
    let message = '';
    let mediaUrl: string | undefined;
    if (post) {
      // Send as full post content with image as mediaUrl
      let cleanContent = (post.content || '')
        .replace(/\[\[CTA\|[^\]]*\]\]/g, '')
        .replace(/\[\[PROMO\|[^\]]*\]\]/g, '')
        .replace(/\[\[PRODUCT_TAGS\|[^\]]*\]\]/g, '')
        .replace(/\[\[TAGS\|[^\]]*\]\]/g, '')
        .trim();
      const header = `📤 Shared post by @${post.authorUsername || post.authorName}`;
      const content = cleanContent ? `\n${cleanContent}` : '';
      message = `${header}${content}`;
      if (post.mediaUrls?.length) {
        mediaUrl = post.mediaUrls[0];
      }
    } else {
      message = `📤 Shared a post: ${postUrl}`;
    }
    const currentSharePostId = this.sharePostId;

    // Optimistic UI update
    const postToUpdate = this.posts.find(p => p.id === currentSharePostId);
    if (postToUpdate) {
      postToUpdate.shareCount++;
      this.cdr.markForCheck();
    }

    this.messageService.createConversation(recipientId).subscribe({
      next: (res) => {
        const conversationId = res.data?.userId ?? recipientId;
        this.messageService.sendMessage(conversationId, message, mediaUrl).subscribe({
          next: () => {
            this.shareSuccessMap[recipientId] = true;
            this.shareSendingMap[recipientId] = false;
            this.cdr.markForCheck();

            // Record the share in backend
            this.interactionService.sharePost(currentSharePostId).subscribe({
              next: () => {},
              error: (err) => console.error('Error recording share:', err)
            });
          },
          error: (err) => {
            console.error('Error sending share message:', err);
            this.shareSendingMap[recipientId] = false;
            if (postToUpdate) {
              postToUpdate.shareCount = Math.max(0, postToUpdate.shareCount - 1);
            }
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        console.error('Error creating conversation:', err);
        this.shareSendingMap[recipientId] = false;
        if (postToUpdate) {
          postToUpdate.shareCount = Math.max(0, postToUpdate.shareCount - 1);
        }
        this.cdr.markForCheck();
      }
    });
  }

  // Keep legacy method for backward compatibility with template
  likePost(postId: number) {
    this.toggleLike(postId);
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    // Backend Docker containers return UTC timestamps without Z suffix
    let normalized = dateString;
    if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-', 10)) {
      normalized += 'Z';
    }
    const date = new Date(normalized);
    const now = new Date();
    const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (seconds < 60) return 'just now';
    const intervals: [number, string][] = [
      [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
      [3600, 'hour'], [60, 'min']
    ];
    for (const [secs, label] of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) return `${count} ${label}${count > 1 && label !== 'min' ? 's' : ''} ago`;
    }
    return Math.floor(seconds) + ' seconds ago';
  }
}



import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Navbar } from '../../../core/components/navbar/navbar';
import { Sidebar } from '../../../core/components/sidebar/sidebar';
import { UserService, UserResponse, ProfileUpdateRequest } from '../../../core/services/user.service';
import { PostService, PostResponse } from '../../../core/services/post.service';
import { InteractionService, CommentResponse } from '../../../core/services/interaction.service';
import { ConnectionService, ConnectionStatsResponse, ConnectionResponse } from '../../../core/services/connection.service';
import { MessageService } from '../../../core/services/message.service';
import { MediaService } from '../../../core/services/media.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { HashtagTextComponent } from '../../../shared/components/hashtag-text/hashtag-text.component';
import { BottomNav } from '../../../core/components/bottom-nav/bottom-nav';

@Component({
    selector: 'app-profile-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, Navbar, Sidebar, HashtagTextComponent, BottomNav],
    templateUrl: './profile-page.html',
    styleUrls: ['./profile-page.css']
})
export class ProfilePage implements OnInit {
    user: UserResponse | null = null;
    posts: PostResponse[] = [];
    likedPosts: PostResponse[] = [];
    currentUser: UserResponse | null = null; // tracking logged in user

    postOptionsOpenMap: { [id: number]: boolean } = {};
    editingPostId: number | null = null;
    editPostContent: string = '';

    editingCommentId: number | null = null;
    editCommentContent: string = '';

    commentOpenMap: { [id: number]: boolean } = {};
    commentOptionsOpenMap: { [id: number]: boolean } = {};
    commentsMap: { [id: number]: CommentResponse[] } = {};
    commentLoadingMap: { [id: number]: boolean } = {};
    newCommentMap: { [id: number]: string } = {};

    likedMap: { [id: number]: boolean } = {};
    bookmarkedMap: { [id: number]: boolean } = {};

    isLoadingProfile = true;
    isLoadingPosts = false;
    isLoadingLikes = false;
    isLoadingStats = false;

    currentUserId: number | null = null;
    viewedUserId: number | null = null;

    stats: ConnectionStatsResponse | null = null;
    // Separate flag so Follow button shows immediately even before stats loads
    isFollowingUser: 'none' | 'pending' | 'following' | null = null;
    isFollowLoading = false;

    suggestedUsers: UserResponse[] = [];
    isLoadingSuggestions = false;

    isEditModalOpen = false;
    isSavingProfile = false;
    editData: ProfileUpdateRequest = {};

    activeTab: 'posts' | 'media' | 'likes' | 'requests' | 'showcase' = 'posts';
    showcaseItems: any[] = [];
    isLoadingShowcase = false;
    newShowcaseItem = { name: '', type: '', price: '', link: '' };
    isAddingShowcase = false;
    pendingRequests: ConnectionResponse[] = [];
    isLoadingRequests = false;
    pastRequests: ConnectionResponse[] = [];
    isLoadingPastRequests = false;

    endorsementLinks: { title: string, url: string }[] = [];

    isUploadingProfilePic = false;
    isUploadingCoverPhoto = false;

    // Connections List Modal State
    isConnectionsModalOpen = false;
    connectionsModalType: 'followers' | 'following' = 'followers';
    connectionList: ConnectionResponse[] = [];
    isConnectionsLoading = false;
    connectionsFollowMap: { [userId: number]: 'none' | 'pending' | 'following' } = {};

    // Share Modal State
    shareModalOpen = false;
    sharePostId: number | null = null;
    shareUserSearch = '';
    followingUsers: any[] = [];
    shareSuccessMap: { [userId: number]: boolean } = {};

    constructor(
        private userService: UserService,
        private postService: PostService,
        private interactionService: InteractionService,
        private connectionService: ConnectionService,
        private messageService: MessageService,
        private mediaService: MediaService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationService,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    onProfilePicSelected(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        this.isUploadingProfilePic = true;
        this.cdr.markForCheck();

        this.mediaService.uploadProfilePicture(file).subscribe({
            next: (res) => {
                if (res.success && res.data && this.user) {
                    const picUrl = res.data.url;
                    this.user.profilePicture = picUrl;
                    // Persist to user-service
                    this.userService.updateProfile({ profilePicture: picUrl }).subscribe(() => {
                        this.isUploadingProfilePic = false;
                        this.cdr.markForCheck();
                    });
                } else {
                    this.isUploadingProfilePic = false;
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Failed to upload profile picture', err);
                this.isUploadingProfilePic = false;
                this.cdr.markForCheck();
            }
        });
    }

    onCoverPhotoSelected(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        this.isUploadingCoverPhoto = true;
        this.cdr.markForCheck();

        this.mediaService.uploadCoverPhoto(file).subscribe({
            next: (res) => {
                if (res.success && res.data && this.user) {
                    const coverUrl = res.data.url;
                    this.user.coverPhoto = coverUrl;
                    // Persist to user-service
                    this.userService.updateProfile({ coverPhoto: coverUrl }).subscribe(() => {
                        this.isUploadingCoverPhoto = false;
                        this.cdr.markForCheck();
                    });
                } else {
                    this.isUploadingCoverPhoto = false;
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Failed to upload cover photo', err);
                this.isUploadingCoverPhoto = false;
                this.cdr.markForCheck();
            }
        });
    }

    openEditModal() {
        if (!this.user) return;
        this.editData = {
            name: this.user.name,
            bio: this.user.bio,
            location: this.user.location,
            website: this.user.website,
            businessName: this.user.businessName,
            category: this.user.category,
            industry: this.user.industry,
            businessHours: this.user.businessHours
        };

        this.parseEndorsementLinks();

        if (this.user.userType === 'BUSINESS' || this.user.userType === 'CREATOR') {
            this.userService.getBusinessProfile().subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.editData.contactEmail = res.data.contactEmail;
                        this.editData.contactPhone = res.data.contactPhone;
                        this.editData.address = res.data.address;
                        this.editData.category = res.data.category || this.user?.category;
                        this.editData.businessName = res.data.businessName || this.user?.businessName;
                        this.cdr.markForCheck();
                    }
                }
            });
        }
        this.isEditModalOpen = true;
        this.cdr.markForCheck();
    }

    closeEditModal() {
        this.isEditModalOpen = false;
        this.cdr.markForCheck();
    }

    openConnections(type: 'followers' | 'following') {
        const targetUserId = this.viewedUserId || this.currentUserId;
        if (!targetUserId) return;

        this.connectionsModalType = type;
        this.isConnectionsModalOpen = true;
        this.isConnectionsLoading = true;
        this.connectionList = [];
        this.cdr.markForCheck();

        const request = type === 'followers'
            ? this.connectionService.getFollowers(targetUserId)
            : this.connectionService.getFollowing(targetUserId);

        request.subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.connectionList = res.data.content;
                    // Pre-populate follow states
                    this.connectionList.forEach(conn => {
                        // If we are looking at OUR OWN profile's following list, we ARE following them.
                        // (Note: isCurrentUser() currently checks if we are viewing our own profile page)
                        if (this.isCurrentUser() && type === 'following') {
                            this.connectionsFollowMap[conn.userId] = 'following';
                        } else {
                            // Check if WE (the logged in user) follow this person in the list
                            this.connectionService.isFollowing(conn.userId).subscribe({
                                next: (boolRes) => {
                                    if (boolRes.success) {
                                        this.connectionsFollowMap[conn.userId] = boolRes.data ? 'following' : 'none';
                                        this.cdr.markForCheck();
                                    }
                                }
                            });
                        }
                    });
                }
                this.isConnectionsLoading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error(`Failed to load ${type}`, err);
                this.isConnectionsLoading = false;
                this.cdr.markForCheck();
            }
        });
    }

    toggleFollowInList(userId: number) {
        const currentState = this.connectionsFollowMap[userId];
        if (currentState === 'following') {
            if (!confirm("Unfollow this user?")) return;
            this.connectionService.unfollowUser(userId).subscribe({
                next: () => {
                    this.connectionsFollowMap[userId] = 'none';
                    if (this.isCurrentUser() && this.connectionsModalType === 'following') {
                        this.connectionList = this.connectionList.filter(c => c.userId !== userId);
                    }
                    if (this.stats && this.isCurrentUser() && this.connectionsModalType === 'following') {
                        this.stats.followingCount--;
                    }
                    this.cdr.markForCheck();
                }
            });
        } else {
            this.connectionService.followUser(userId).subscribe({
                next: (res) => {
                    // All follow requests require approval - always show pending
                    this.connectionsFollowMap[userId] = 'pending';
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    if (err?.error?.message?.includes('pending')) {
                        this.connectionsFollowMap[userId] = 'pending';
                    }
                    this.cdr.markForCheck();
                }
            });
        }
    }

    removeFollower(userId: number) {
        if (!confirm("Are you sure you want to remove this follower? They will no longer follow you.")) return;
        this.connectionService.removeConnection(userId).subscribe({
            next: () => {
                this.connectionList = this.connectionList.filter(c => c.userId !== userId);
                if (this.stats && this.isCurrentUser() && this.connectionsModalType === 'followers') {
                    this.stats.followersCount--;
                }
                this.cdr.markForCheck();
            }
        });
    }

    closeConnectionsModal() {
        this.isConnectionsModalOpen = false;
        this.cdr.markForCheck();
    }

    unfollowFromList(userId: number) {
        if (!confirm("Are you sure you want to unfollow this user?")) return;

        this.connectionService.unfollowUser(userId).subscribe({
            next: () => {
                // Remove from local list
                this.connectionList = this.connectionList.filter(c => c.userId !== userId);
                // Update stats
                if (this.stats && this.stats.followingCount > 0) {
                    this.stats.followingCount--;
                }
                this.cdr.markForCheck();
            },
            error: (err) => {
                alert("Could not unfollow user.");
                console.error(err);
            }
        });
    }

    navigateToProfile(userId: number) {
        this.closeConnectionsModal();
        this.router.navigate(['/profile', userId]);
    }

    saveProfile() {
        this.isSavingProfile = true;
        this.cdr.markForCheck();

        // Sync businessAddress field for the main User entity
        if (this.editData.address) {
            this.editData.businessAddress = this.editData.address;
        }

        this.editData.externalLinks = JSON.stringify(this.endorsementLinks);

        this.userService.updateProfile(this.editData).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.user = res.data;
                    this.parseEndorsementLinks();

                    if (this.user?.userType === 'BUSINESS' || this.user?.userType === 'CREATOR') {
                        const busReq = {
                            businessName: this.editData.businessName || this.user?.businessName || '',
                            category: this.editData.category || this.user?.category || 'RETAIL',
                            description: this.editData.bio || this.user?.bio,
                            contactEmail: this.editData.contactEmail,
                            contactPhone: this.editData.contactPhone,
                            address: this.editData.address
                        };
                        this.userService.updateBusinessProfile(busReq).subscribe({
                            next: () => {
                                this.closeEditModal();
                                this.isSavingProfile = false;
                                this.cdr.markForCheck();
                            },
                            error: (err) => {
                                console.error('Failed to update business profile', err);
                                this.closeEditModal();
                                this.isSavingProfile = false;
                                this.cdr.markForCheck();
                            }
                        });
                    } else {
                        this.closeEditModal();
                        this.isSavingProfile = false;
                        this.cdr.markForCheck();
                    }
                }
            },
            error: (err) => {
                console.error('Failed to update profile', err);
                this.isSavingProfile = false;
                this.cdr.markForCheck();
            }
        });
    }

    ngOnInit(): void {
        this.isLoadingProfile = true;
        this.cdr.markForCheck();

        this.loadSuggestedUsers();

        // 1. Get logged in user first to avoid race conditions
        this.userService.getMyProfile().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.currentUserId = response.data.id;
                    this.currentUser = response.data;
                }

                // 2. Now determine who we are viewing
                this.route.paramMap.subscribe(params => {
                    const idParam = params.get('id');
                    if (idParam) {
                        this.viewedUserId = +idParam;
                        this.loadUserProfileById(this.viewedUserId);
                    } else {
                        // Viewing own profile
                        if (this.currentUser) {
                            this.user = this.currentUser;
                            this.viewedUserId = this.currentUser.id;
                            this.parseEndorsementLinks();
                            this.loadUserPosts(this.user.id);
                            this.loadUserStats(this.user.id);
                            this.loadRequests();
                            this.isLoadingProfile = false;
                        } else {
                            // Fallback if currentUser failed but we are on /profile
                            this.loadMyProfile();
                        }
                    }
                    this.cdr.markForCheck();
                });
            },
            error: (err) => {
                console.error("Could not determine current user ID", err);
                this.router.navigate(['/login']);
            }
        });
    }

    // Method removed as it's merged into ngOnInit for reliability

    loadMyProfile() {
        this.isLoadingProfile = true;
        this.cdr.markForCheck();

        this.userService.getMyProfile().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.user = response.data;

                    if (this.user!.userType === 'BUSINESS' || this.user!.userType === 'CREATOR') {
                        this.userService.getBusinessProfile().subscribe({
                            next: (res) => {
                                if (res.success && res.data && this.user) {
                                    this.user.contactEmail = res.data.contactEmail;
                                    this.user.contactPhone = res.data.contactPhone;
                                    this.user.address = res.data.address;
                                    this.user.category = res.data.category || this.user.category;
                                    this.user.businessName = res.data.businessName || this.user.businessName;
                                    this.cdr.markForCheck();
                                }
                            }
                        });
                    }

                    this.viewedUserId = this.user!.id;
                    this.parseEndorsementLinks();
                    this.loadUserPosts(this.user!.id);
                    this.loadUserStats(this.user!.id);
                    // Preload pending requests so the badge can display the count immediately
                    this.loadRequests();
                }
                this.isLoadingProfile = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error fetching my profile:', err);
                // Might not be logged in or token expired
                this.router.navigate(['/login']);
            }
        });
    }

    loadUserProfileById(id: number) {
        this.isLoadingProfile = true;
        this.cdr.markForCheck();

        this.userService.getUserById(id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.user = response.data;

                    if (this.user!.userType === 'BUSINESS' || this.user!.userType === 'CREATOR') {
                        this.userService.getBusinessProfileById(id).subscribe({
                            next: (res) => {
                                if (res.success && res.data && this.user) {
                                    this.user.contactEmail = res.data.contactEmail;
                                    this.user.contactPhone = res.data.contactPhone;
                                    this.user.address = res.data.address;
                                    this.user.category = res.data.category || this.user.category;
                                    this.user.businessName = res.data.businessName || this.user.businessName;
                                    this.cdr.markForCheck();
                                }
                            }
                        });
                    }

                    this.parseEndorsementLinks();
                    this.loadUserPosts(id);
                    this.loadUserStats(id);
                }
                this.isLoadingProfile = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error(`Error fetching user profile for ${id}:`, err);
                this.isLoadingProfile = false;
                this.cdr.markForCheck();
            }
        });
    }

    loadUserStats(userId: number) {
        this.isLoadingStats = true;
        this.connectionService.getConnectionStats(userId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.stats = res.data;

                    if (res.data.isFollowing) {
                        this.isFollowingUser = 'following';
                    } else {
                        // Not following. Check if pending.
                        // We check if the user is in our sent pending requests.
                        this.connectionService.getSentPendingRequests(0, 50).subscribe({
                            next: (pendingRes) => {
                                if (pendingRes.success && pendingRes.data) {
                                    // if current target user is in the pending following list
                                    const isPending = pendingRes.data.content.some((req: ConnectionResponse) =>
                                        req.userId === userId
                                    );
                                    this.isFollowingUser = isPending ? 'pending' : 'none';
                                } else {
                                    this.isFollowingUser = 'none';
                                }
                                this.isLoadingStats = false;
                                this.cdr.markForCheck();
                            },
                            error: () => {
                                this.isFollowingUser = 'none';
                                this.isLoadingStats = false;
                                this.cdr.markForCheck();
                            }
                        });
                        return; // return early as the nested subscribe will handle the loading state
                    }
                }
                this.isLoadingStats = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoadingStats = false;
                this.cdr.markForCheck();
            }
        });
    }

    toggleFollow() {
        if (!this.viewedUserId || this.isFollowLoading) return;

        this.isFollowLoading = true;
        const currentState = this.isFollowingUser;

        if (currentState === 'following' || currentState === 'pending') {
            const action = this.connectionService.unfollowUser(this.viewedUserId);
            this.isFollowingUser = 'none'; // Optimistic
            this.cdr.markForCheck();

            action.subscribe({
                next: () => {
                    this.isFollowLoading = false;
                    if (this.viewedUserId) {
                        this.loadUserStats(this.viewedUserId);
                    }
                },
                error: (err) => {
                    this.isFollowingUser = currentState;
                    this.isFollowLoading = false;
                    this.cdr.markForCheck();
                }
            });
        } else {
            // currently 'none', attempt to follow
            const action = this.connectionService.followUser(this.viewedUserId);
            // Optimistic pessimistic assumption (always show 'pending' first, loadUserStats will correct it to 'following' instantly if public)
            this.isFollowingUser = 'pending';
            this.cdr.markForCheck();

            action.subscribe({
                next: () => {
                    this.isFollowLoading = false;
                    if (this.viewedUserId) {
                        // Let the backend dictate the true relationship state after following
                        this.loadUserStats(this.viewedUserId);
                    }
                },
                error: (err) => {
                    if (err?.error?.message === 'You already follow or have a pending request for this user') {
                        this.isFollowingUser = 'pending';
                    } else {
                        this.isFollowingUser = 'none';
                        alert(err?.error?.message || 'Could not follow user.');
                    }
                    this.isFollowLoading = false;
                    this.cdr.markForCheck();
                }
            });
        }
    }

    // Start a DM conversation from profile page
    startMessage(): void {
        if (this.viewedUserId) {
            this.router.navigate(['/messages'], { queryParams: { userId: this.viewedUserId } });
        } else {
            this.router.navigate(['/messages']);
        }
    }

    get displayPosts(): PostResponse[] {
        if (this.activeTab === 'likes') return this.likedPosts;
        return this.posts;
    }

    get isLoadingDisplayPosts(): boolean {
        if (this.activeTab === 'likes') return this.isLoadingLikes;
        return this.isLoadingPosts;
    }

    setTab(tab: 'posts' | 'likes' | 'requests' | 'showcase'): void {
        this.activeTab = tab;
        if (tab === 'requests') {
            this.loadRequests();
            this.loadPastRequests();
        } else if (tab === 'showcase') {
            this.loadShowcase();
        } else if (tab === 'likes') {
            if (this.viewedUserId) this.loadLikes(this.viewedUserId);
        }
    }

    loadRequests(): void {
        this.isLoadingRequests = true;
        this.cdr.markForCheck();
        this.connectionService.getPendingRequests(0, 50).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.pendingRequests = res.data.content;
                }
                this.isLoadingRequests = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoadingRequests = false;
                this.cdr.markForCheck();
            }
        });
    }

    loadPastRequests(): void {
        this.isLoadingPastRequests = true;
        this.cdr.markForCheck();
        this.connectionService.getPastRequests(0, 50).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.pastRequests = res.data.content;
                }
                this.isLoadingPastRequests = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoadingPastRequests = false;
                this.cdr.markForCheck();
            }
        });
    }

    acceptRequest(connectionId: number): void {
        this.connectionService.acceptRequest(connectionId).subscribe({
            next: () => {
                this.pendingRequests = this.pendingRequests.filter(req => req.id !== connectionId);
                // Also reload the user's stats dynamically to show exactly what the server thinks
                if (this.viewedUserId) {
                    this.loadUserStats(this.viewedUserId);
                }
                this.loadPastRequests();
                this.cdr.markForCheck();
            }
        });
    }

    rejectRequest(connectionId: number): void {
        this.connectionService.rejectRequest(connectionId).subscribe({
            next: () => {
                this.pendingRequests = this.pendingRequests.filter(req => req.id !== connectionId);
                this.loadPastRequests();
                this.cdr.markForCheck();
            }
        });
    }

    loadUserPosts(userId: number) {
        this.isLoadingPosts = true;
        this.cdr.markForCheck();

        const handlePosts = (posts: PostResponse[]) => {
            this.posts = posts;
            this.posts.forEach(p => {
                if (p.isLikedByCurrentUser !== undefined) {
                    this.likedMap[p.id] = p.isLikedByCurrentUser;
                } else {
                    this.checkLikeStatus(p.id);
                }
                this.checkBookmarkStatus(p.id);
                this.fetchRealCounts(p);
            });
            this.enrichProfilePosts();
            this.isLoadingPosts = false;
            this.cdr.markForCheck();
        };

        if (this.isCurrentUser()) {
            this.postService.getMyPosts(0, 20).subscribe({
                next: (response) => {
                    if (response.success && response.data) handlePosts(response.data.content);
                    else { this.isLoadingPosts = false; this.cdr.markForCheck(); }
                },
                error: () => { this.isLoadingPosts = false; this.cdr.markForCheck(); }
            });
        } else {
            this.postService.getUserPosts(userId, 0, 20).subscribe({
                next: (response) => {
                    if (response.success && response.data) handlePosts(response.data.content);
                    else { this.isLoadingPosts = false; this.cdr.markForCheck(); }
                },
                error: () => { this.isLoadingPosts = false; this.cdr.markForCheck(); }
            });
        }
    }

    private enrichProfilePosts() {
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
        this.http.get<any>(`/api/bookmarks/${postId}/status`).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.bookmarkedMap[postId] = !!res.data;
                    this.cdr.markForCheck();
                }
            },
            error: () => {}
        });
    }

    loadLikes(userId: number) {
        this.isLoadingLikes = true;
        this.cdr.markForCheck();
        // Step 1: Get liked post IDs from interaction service
        this.interactionService.getLikedPostIds().subscribe({
            next: (idsRes) => {
                if (idsRes.success && idsRes.data && idsRes.data.length > 0) {
                    // Step 2: Fetch posts by IDs from post service batch endpoint
                    const ids = idsRes.data.slice(0, 20);
                    this.http.get<any>(`/api/posts/batch?ids=${ids.join(',')}`).subscribe({
                        next: (postsRes: any) => {
                            if (postsRes.success && postsRes.data) {
                                this.likedPosts = postsRes.data;
                                this.likedPosts.forEach(p => {
                                    this.likedMap[p.id] = true;
                                    this.fetchRealCounts(p);
                                });
                            }
                            this.isLoadingLikes = false;
                            this.cdr.markForCheck();
                        },
                        error: () => {
                            this.isLoadingLikes = false;
                            this.cdr.markForCheck();
                        }
                    });
                } else {
                    this.likedPosts = [];
                    this.isLoadingLikes = false;
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Error fetching liked posts:', err);
                this.isLoadingLikes = false;
                this.cdr.markForCheck();
            }
        });
    }

    isCurrentUser(): boolean {
        if (!this.currentUserId || !this.viewedUserId) return false;
        return this.currentUserId === this.viewedUserId;
    }

    getJoinedDate(dateString: string): string {
        if (!dateString) return 'Recently';
        const date = new Date((dateString || '').endsWith('Z') ? dateString : dateString + 'Z');
        const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
        return date.toLocaleDateString(undefined, options);
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
        const intervals: [number, string][] = [[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'min']];
        for (const [secs, label] of intervals) {
            const count = Math.floor(seconds / secs);
            if (count >= 1) return `${count} ${label}${count > 1 && label !== 'min' ? 's' : ''} ago`;
        }
        return Math.floor(seconds) + ' seconds ago';
    }

    // Management Methods
    togglePostOptions(postId: number) {
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

    sortPosts() {
        this.posts = [...this.posts].sort((a, b) => {
            // 1. Pinned status (pinned first)
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;

            // 2. Creation date (most recent first)
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
        this.cdr.markForCheck();
    }

    // Interaction Methods (Copy from Feed)
    toggleLike(postId: number) {
        const isLiked = this.likedMap[postId];
        if (isLiked) {
            this.interactionService.unlikePost(postId).subscribe();
            const post = this.posts.find(p => p.id === postId);
            if (post && post.likeCount > 0) post.likeCount--;
        } else {
            this.interactionService.likePost(postId).subscribe();
            const post = this.posts.find(p => p.id === postId);
            if (post) post.likeCount++;
        }
        this.likedMap[postId] = !isLiked;
        this.cdr.markForCheck();
    }

    toggleBookmark(postId: number) {
        const isBookmarked = this.bookmarkedMap[postId];
        if (isBookmarked) {
            this.interactionService.unlikePost(postId).subscribe(); // reusing unlike post if bookmark service is not ready, update later if bookmark service used
        } else {
            // this.bookmarkService.addBookmark(postId).subscribe();
        }
        this.bookmarkedMap[postId] = !isBookmarked;
        this.cdr.markForCheck();
    }

    sharePost(postId: number) {
        // Open DM share modal instead of just reposting
        this.openShareModal(postId);
    }

    openShareModal(postId: number) {
        this.sharePostId = postId;
        this.shareUserSearch = '';
        this.shareSuccessMap = {};
        this.followingUsers = [];
        this.shareModalOpen = true;
        const userId = this.currentUser?.id || this.currentUserId;
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

    shareSendingMap: { [userId: number]: boolean } = {};

    sendPostToUser(recipientId: number) {
        if (!this.sharePostId || this.shareSuccessMap[recipientId] || this.shareSendingMap[recipientId]) return;
        this.shareSendingMap[recipientId] = true;
        const postUrl = `${window.location.origin}/post/${this.sharePostId}`;
        const message = `Check out this post: ${postUrl}`;
        const currentSharePostId = this.sharePostId;

        // Optimistic UI update
        const postToUpdate = this.posts.find(p => p.id === currentSharePostId) || this.likedPosts?.find(p => p.id === currentSharePostId);
        if (postToUpdate) {
            postToUpdate.shareCount++;
            this.cdr.markForCheck();
        }

        this.messageService.createConversation(recipientId).subscribe({
            next: (res) => {
                const conversationId = res.data?.userId ?? recipientId;
                this.messageService.sendMessage(conversationId, message).subscribe({
                    next: () => {
                        this.shareSuccessMap[recipientId] = true;
                        this.shareSendingMap[recipientId] = false;

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
                            this.cdr.markForCheck();
                        }
                    }
                });
            },
            error: (err) => {
                console.error('Error creating conversation:', err);
                this.shareSendingMap[recipientId] = false;
                if (postToUpdate) {
                    postToUpdate.shareCount = Math.max(0, postToUpdate.shareCount - 1);
                    this.cdr.markForCheck();
                }
            }
        });
    }

    toggleComments(postId: number) {
        this.commentOpenMap[postId] = !this.commentOpenMap[postId];
        if (this.commentOpenMap[postId]) {
            if (!this.newCommentMap[postId]) this.newCommentMap[postId] = '';
            if (!this.commentsMap[postId]) {
                this.loadComments(postId);
            }
        }
    }

    loadComments(postId: number) {
        this.commentLoadingMap[postId] = true;
        this.interactionService.getComments(postId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.commentsMap[postId] = res.data.content;
                }
                this.commentLoadingMap[postId] = false;
                this.cdr.markForCheck();
            }
        });
    }

    submitComment(postId: number) {
        const content = this.newCommentMap[postId];
        if (!content || !content.trim()) return;

        this.interactionService.addComment(postId, content).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    if (!this.commentsMap[postId]) this.commentsMap[postId] = [];
                    this.commentsMap[postId].unshift(res.data);
                    this.newCommentMap[postId] = '';
                    const post = this.posts.find(p => p.id === postId);
                    if (post) post.commentCount++;
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Comment submission failed:', err);
                alert(err?.error?.message || 'Could not post comment. Please try again.');
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

    loadSuggestedUsers() {
        this.isLoadingSuggestions = true;
        this.cdr.markForCheck();
        this.userService.getSuggestedUsers(0, 20).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const allUsers = res.data.content.filter((u: any) => u.id !== this.currentUserId);
                    const checkPromises = allUsers.map((u: any) =>
                        this.connectionService.isFollowing(u.id).toPromise()
                            .then(r => ({ user: u, following: r?.data === true }))
                            .catch(() => ({ user: u, following: false }))
                    );
                    Promise.all(checkPromises).then(results => {
                        this.suggestedUsers = results.filter(r => !r.following).map(r => r.user).slice(0, 5);
                        this.isLoadingSuggestions = false;
                        this.cdr.markForCheck();
                    });
                } else {
                    this.isLoadingSuggestions = false;
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Failed to load suggestions', err);
                this.isLoadingSuggestions = false;
                this.cdr.markForCheck();
            }
        });
    }

    followFromSuggestions(suggestedUser: UserResponse) {
        if (!suggestedUser.id) return;

        this.connectionService.followUser(suggestedUser.id).subscribe({
            next: (res) => {
                if (res.success) {
                    // Remove from suggestions list once followed
                    this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== suggestedUser.id);
                    // If we are viewing a profile and we just followed someone, we might want to refresh stats if it was the same user, 
                    // but here we are following from suggestions, which usually are NOT the person whose profile we are on (since we filter already followed).
                    this.cdr.markForCheck();
                    // Optionally show a toast
                }
            },
            error: (err) => {
                console.error('Failed to follow user from suggestions', err);
            }
        });
    }

    addEndorsementLink() {
        this.endorsementLinks.push({ title: '', url: '' });
        this.cdr.markForCheck();
    }

    removeEndorsementLink(index: number) {
        this.endorsementLinks.splice(index, 1);
        this.cdr.markForCheck();
    }

    parseEndorsementLinks() {
        if (this.user?.externalLinks) {
            const raw = this.user.externalLinks.trim();
            if (raw.startsWith('[') || raw.startsWith('{')) {
                try {
                    const parsed = JSON.parse(raw);
                    this.endorsementLinks = Array.isArray(parsed) ? parsed : [parsed];
                    return;
                } catch (e) {
                    console.error('Failed to parse external links as JSON', e);
                }
            }

            // Fallback for comma-separated or plain URLs
            const links = raw.split(',').filter(l => l.trim().length > 0);
            this.endorsementLinks = links.map(link => ({
                title: link.replace('https://', '').replace('http://', '').split('/')[0],
                url: link.startsWith('http') ? link : `https://${link}`
            }));
        } else {
            this.endorsementLinks = [];
        }
    }

    requestVerification() {
        if (!this.user || this.user.verificationRequested) return;
        this.userService.requestVerification().subscribe({
            next: (res) => {
                if (res.success && res.data && this.user) {
                    this.user.verificationRequested = true;
                    alert('Verification request submitted successfully!');
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Failed to request verification', err);
                alert('Failed to submit verification request.');
            }
        });
    }

    approveVerification() {
        if (!this.user) return;
        this.userService.approveVerification(this.user.id).subscribe({
            next: (res) => {
                if (res.success && this.user) {
                    this.user.isVerified = true;
                    this.user.verificationRequested = false;
                    alert('User verified successfully (Admin Action)!');
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Failed to verify user', err);
                alert('Verification failed. Note: Only accounts with ADMIN role can approve verification.');
            }
        });
    }

    // Temporary Debug Helper (only works if ?debug=true in URL)
    promoteToAdmin() {
        if (!confirm("DEBUG: Set your account to ADMIN role for testing?")) return;
        this.http.post<any>('/api/users/me/debug-admin', {}).subscribe({
            next: () => {
                alert("Account promoted to ADMIN! Please reload to see changes.");
                location.reload();
            },
            error: () => alert("Promotion failed. (Ensure backend has the debug endpoint)")
        });
    }

    isDebugMode() {
        return this.route.snapshot.queryParamMap.has('debug');
    }

    loadShowcase() {
        this.isLoadingShowcase = true;
        this.cdr.markForCheck();
        this.userService.getShowcase().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.showcaseItems = res.data;
                }
                this.isLoadingShowcase = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Failed to load showcase', err);
                this.isLoadingShowcase = false;
                this.cdr.markForCheck();
            }
        });
    }

    addShowcaseItem() {
        if (!this.newShowcaseItem.name || !this.newShowcaseItem.price) {
            alert('Please provide at least a name and price.');
            return;
        }
        this.isAddingShowcase = true;
        this.userService.addShowcaseItem(this.newShowcaseItem).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.showcaseItems = res.data;
                    this.newShowcaseItem = { name: '', type: '', price: '', link: '' };
                }
                this.isAddingShowcase = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Failed to add showcase item', err);
                this.isAddingShowcase = false;
                this.cdr.markForCheck();
            }
        });
    }

    removeShowcaseItem(index: number) {
        if (!confirm('Remove this item from your showcase?')) return;
        this.userService.removeShowcaseItem(index).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.showcaseItems = res.data;
                }
                this.cdr.markForCheck();
            },
            error: (err) => console.error('Failed to remove showcase item', err)
        });
    }
}

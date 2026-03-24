import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Navbar } from '../../../core/components/navbar/navbar';
import { Sidebar } from '../../../core/components/sidebar/sidebar';
import { SearchService } from '../../../core/services/search.service';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { PostResponse } from '../../../core/services/post.service';
import { ConnectionService } from '../../../core/services/connection.service';
import { HashtagTextComponent } from '../../../shared/components/hashtag-text/hashtag-text.component';

@Component({
    selector: 'app-explore-page',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, Navbar, Sidebar, HashtagTextComponent],
    templateUrl: './explore-page.html',
    styleUrls: ['./explore-page.css']
})
export class ExplorePage implements OnInit {
    searchQuery = '';
    activeTab = 'all'; // all, users, posts
    isLoading = false;

    recentSearches: string[] = []; // Not populated from DB yet
    trendingTopics: string[] = [];

    usersResults: UserResponse[] = [];
    postsResults: PostResponse[] = [];

    // Track follow/pending state: { userId -> 'following' | 'pending' | 'none' }
    followStateMap: { [userId: number]: 'following' | 'pending' | 'none' } = {};

    // Current logged-in user ID (to hide Follow button for self)
    currentUserId: number | null = null;

    suggestedUsers: UserResponse[] = [];
    isLoadingSuggestions = false;

    constructor(
        private searchService: SearchService,
        private connectionService: ConnectionService,
        private userService: UserService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.loadTrending();
        this.loadRecentSearches();
        this.loadSuggestedUsers();

        // Get current user ID so we can hide Follow button for ourselves
        this.userService.getMyProfile().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.currentUserId = res.data.id;
                }
            }
        });

        // Listen for query params
        this.route.queryParams.subscribe(params => {
            if (params['q']) {
                this.searchQuery = params['q'];
                this.performSearch();
            }
        });
    }

    loadTrending() {
        this.searchService.getTrendingSearches().subscribe({
            next: (res: any) => {
                if (res.success && res.data) {
                    this.trendingTopics = res.data.slice(0, 5);
                    this.cdr.markForCheck();
                }
            }
        });
    }

    searchTopic(trend: string) {
        this.searchQuery = trend;
        this.performSearch();
    }

    loadRecentSearches() {
        this.searchService.getRecentSearches().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.recentSearches = res.data;
                    this.cdr.markForCheck();
                }
            }
        });
    }

    clearRecentSearches() {
        this.searchService.clearRecentSearches().subscribe({
            next: (res) => {
                if (res.success) {
                    this.recentSearches = [];
                    this.cdr.markForCheck();
                }
            }
        });
    }

    removeRecentSearch(query: string, event: Event) {
        event.stopPropagation();
        this.searchService.removeRecentSearch(query).subscribe({
            next: (res) => {
                if (res.success) {
                    this.recentSearches = this.recentSearches.filter(s => s !== query);
                    this.cdr.markForCheck();
                }
            }
        });
    }

    onSearchChange() {
        if (!this.searchQuery.trim()) {
            this.clearResults();
            return;
        }
        this.performSearch();
    }

    performSearch() {
        this.isLoading = true;
        this.cdr.markForCheck();

        // Call /api/search/all (or individual based on activeTab)
        if (this.activeTab === 'all') {
            this.searchService.searchAll(this.searchQuery, 10).subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.usersResults = ((res.data.users?.content as any) || []).filter((u: any) => u.id !== this.currentUserId);
                        this.postsResults = (res.data.posts?.content as any) || [];
                    }
                    this.finalizeSearch();
                },
                error: () => this.finalizeSearch()
            });
        } else if (this.activeTab === 'users') {
            this.searchService.searchUsers(this.searchQuery, 0, 20).subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.usersResults = res.data.content.filter((u: any) => u.id !== this.currentUserId);
                        this.postsResults = [];
                    }
                    this.finalizeSearch();
                },
                error: () => this.finalizeSearch()
            });
        } else {
            this.searchService.searchPosts(this.searchQuery, 0, 20).subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.postsResults = res.data.content;
                        this.usersResults = [];
                    }
                    this.finalizeSearch();
                },
                error: () => this.finalizeSearch()
            });
        }
    }

    clearResults() {
        this.usersResults = [];
        this.postsResults = [];
        this.isLoading = false;
        this.cdr.markForCheck();
    }

    finalizeSearch() {
        this.isLoading = false;
        this.checkFollowStatuses();
        this.cdr.markForCheck();
    }

    checkFollowStatuses() {
        // Use per-user isFollowing API which correctly handles bidirectional PERSONAL friendships
        if (!this.currentUserId) return;

        // First get pending sent requests
        this.connectionService.getSentPendingRequests(0, 50).subscribe({
            next: (pendingRes) => {
                const pendingIds = new Set<number>();
                if (pendingRes.success && pendingRes.data) {
                    pendingRes.data.content.forEach((req: any) => pendingIds.add(req.userId));
                }

                // For each user in results, check follow status via the isFollowing API
                // which correctly handles PERSONAL-PERSONAL bidirectional friendships
                this.usersResults.forEach(user => {
                    if (user.id === this.currentUserId) return;

                    if (pendingIds.has(user.id)) {
                        this.followStateMap[user.id] = 'pending';
                        this.cdr.markForCheck();
                    } else {
                        this.connectionService.isFollowing(user.id).subscribe({
                            next: (res) => {
                                if (res.success) {
                                    this.followStateMap[user.id] = res.data ? 'following' : 'none';
                                } else {
                                    this.followStateMap[user.id] = 'none';
                                }
                                this.cdr.markForCheck();
                            },
                            error: () => {
                                this.followStateMap[user.id] = 'none';
                                this.cdr.markForCheck();
                            }
                        });
                    }
                });
            }
        });
    }

    toggleFollowFromExplore(userId: number, event: Event) {
        event.stopPropagation(); // prevent card click

        // Prevent following yourself
        if (userId === this.currentUserId) return;

        const currentState = this.followStateMap[userId];
        const targetUser = this.usersResults.find(u => u.id === userId);

        if (currentState === 'following' || currentState === 'pending') {
            // Unfollow/cancel pending
            this.followStateMap[userId] = 'none'; // Optimistic
            this.connectionService.unfollowUser(userId).subscribe({
                next: () => this.cdr.markForCheck(),
                error: (err) => {
                    this.followStateMap[userId] = currentState; // Revert
                    this.cdr.markForCheck();
                }
            });
        } else {
            // Follow
            // Optimistic pessimistic assumption (always show 'pending' first, correct it to 'following' instantly if public)
            this.followStateMap[userId] = 'pending';
            this.cdr.markForCheck();

            this.connectionService.followUser(userId).subscribe({
                next: () => {
                    // All follow requests require approval - keep pending
                    this.followStateMap[userId] = 'pending';
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    if (err?.error?.message === 'You already follow or have a pending request for this user') {
                        this.followStateMap[userId] = 'pending';
                    } else {
                        this.followStateMap[userId] = 'none'; // Revert
                        alert(err?.error?.message || 'Could not follow user. You may already be following them.');
                    }
                    this.cdr.markForCheck();
                }
            });
        }
    }

    isFollowing(userId: number): boolean {
        return this.followStateMap[userId] === 'following';
    }

    isPending(userId: number): boolean {
        return this.followStateMap[userId] === 'pending';
    }

    setTab(tab: string) {
        this.activeTab = tab;
        if (this.searchQuery.trim()) {
            this.performSearch();
        }
    }

    viewProfile(userId: number) {
        this.router.navigate(['/profile', userId]);
    }

    viewPost(postId: number) {
        // Optionally open post modal or page in future
    }

    getRelativeTime(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
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

    loadSuggestedUsers() {
        this.isLoadingSuggestions = true;
        this.cdr.markForCheck();
        this.userService.getSuggestedUsers(0, 20).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const allUsers = res.data.content.filter((u: any) => u.id !== this.currentUserId);
                    // Filter out already-followed users
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
                    this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== suggestedUser.id);
                    this.cdr.markForCheck();
                }
            },
            error: (err) => {
                console.error('Failed to follow user from suggestions', err);
            }
        });
    }
}


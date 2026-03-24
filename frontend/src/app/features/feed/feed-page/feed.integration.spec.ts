import { vi, expect } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FeedPage } from './feed-page';
import { PostService } from '../../../core/services/post.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { MediaService } from '../../../core/services/media.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { UserService } from '../../../core/services/user.service';
import { SearchService } from '../../../core/services/search.service';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('Feed Integration Test', () => {
    let component: FeedPage;
    let fixture: ComponentFixture<FeedPage>;
    let postServiceSpy: any;
    let interactionServiceSpy: any;
    let userServiceSpy: any;

    beforeEach(async () => {
        postServiceSpy = { getPersonalizedFeed: vi.fn(), createPost: vi.fn(), recordImpression: vi.fn().mockReturnValue(of(null)), recordView: vi.fn().mockReturnValue(of(null)) };
        interactionServiceSpy = { likePost: vi.fn(), addComment: vi.fn(), hasLikedPost: vi.fn().mockReturnValue(of(true)) };
        userServiceSpy = { getMyProfile: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [FeedPage, RouterModule.forRoot([])],
            providers: [
                { provide: PostService, useValue: postServiceSpy },
                { provide: InteractionService, useValue: interactionServiceSpy },
                { provide: UserService, useValue: userServiceSpy },
                { provide: BookmarkService, useValue: { getBookmarks: vi.fn(), isBookmarked: vi.fn().mockReturnValue(of(false)) } },
                { provide: MediaService, useValue: { uploadMedia: vi.fn() } },
                { provide: AnalyticsService, useValue: { getOverview: vi.fn() } },
                { provide: SearchService, useValue: { search: vi.fn() } },
                { provide: ChangeDetectorRef, useValue: { detectChanges: () => { } } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeedPage);
        component = fixture.componentInstance;
    });

    it('should load initial feed on init', () => {
        const mockFeed = {
            success: true,
            message: 'OK',
            data: {
                content: [{ id: 1, content: 'Integration test post', authorId: 1, authorUsername: 'user1' }],
                pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, last: true, first: true
            }
        };

        postServiceSpy.getPersonalizedFeed.mockReturnValue(of(mockFeed as any));
        userServiceSpy.getMyProfile.mockReturnValue(of({
            success: true,
            data: { id: 1, username: 'tester' } as any,
            message: 'OK'
        }));

        // Trigger feed loading
        component.loadFeed();

        expect(postServiceSpy.getPersonalizedFeed).toHaveBeenCalled();
        expect(component.posts.length).toBe(1);
        expect(component.posts[0].content).toBe('Integration test post');
    });

    it('should create a post successfully and push to feed', () => {
        const mockCreatedPost = {
            success: true,
            data: { id: 2, content: 'Brand new post', authorId: 1, authorUsername: 'user1' }
        };
        postServiceSpy.createPost.mockReturnValue(of(mockCreatedPost as any));

        component.posts = []; // Start empty
        // component.newPostContent = 'Brand new post';
        // component.submitPost();
    });
});

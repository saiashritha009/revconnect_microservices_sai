import { vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FeedPage } from './feed-page';
import { InteractionService } from '../../../core/services/interaction.service';
import { PostService } from '../../../core/services/post.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { MediaService } from '../../../core/services/media.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { UserService } from '../../../core/services/user.service';
import { SearchService } from '../../../core/services/search.service';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('Post Interaction Integration', () => {
    let component: FeedPage;
    let fixture: ComponentFixture<FeedPage>;
    let interactionServiceSpy: any;

    beforeEach(async () => {
        interactionServiceSpy = { likePost: vi.fn(), addComment: vi.fn(), hasLikedPost: vi.fn().mockReturnValue(of(true)) };

        await TestBed.configureTestingModule({
            imports: [FeedPage, RouterModule.forRoot([])],
            providers: [
                { provide: InteractionService, useValue: interactionServiceSpy },
                { provide: PostService, useValue: { getPersonalizedFeed: vi.fn(), recordImpression: vi.fn().mockReturnValue(of(null)), recordView: vi.fn().mockReturnValue(of(null)) } },
                { provide: UserService, useValue: { getMyProfile: vi.fn() } },
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

    it('should like a post and increment like count', () => {
        const mockPost = { id: 1, content: 'Test post', likeCount: 5 };
        component.posts = [mockPost as any];
        component.likedMap = {};

        interactionServiceSpy.likePost.mockReturnValue(of({
            success: true, data: { ...mockPost, likeCount: 6 }
        } as any));

        component.likePost(1);

        expect(interactionServiceSpy.likePost).toHaveBeenCalledWith(1);
        expect(component.posts[0].likeCount).toBe(6);
        expect(component.likedMap[1]).toBe(true);
    });

    it('should comment on a post successfully', () => {
        const mockPost = { id: 2, content: 'Test', commentCount: 0, comments: [] };
        component.posts = [mockPost as any];
        // component.newCommentContent[2] = 'Nice post!';

        interactionServiceSpy.addComment.mockReturnValue(of({
            success: true,
            data: { id: 101, content: 'Nice post!', postId: 2, authorUsername: 'tester' }
        } as any));

        // component.submitComment(2);
    });
});

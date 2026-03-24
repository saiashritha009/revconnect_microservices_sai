import { vi, expect } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProfilePage } from './profile-page';
import { UserService } from '../../../core/services/user.service';
import { PostService } from '../../../core/services/post.service';
import { InteractionService } from '../../../core/services/interaction.service';
import { ConnectionService } from '../../../core/services/connection.service';
import { MediaService } from '../../../core/services/media.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

describe('Profile Update Integration Test', () => {
    let component: ProfilePage;
    let fixture: ComponentFixture<ProfilePage>;
    let userServiceSpy: any;

    beforeEach(async () => {
        userServiceSpy = { getMyProfile: vi.fn(), updateProfile: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [ProfilePage, RouterModule.forRoot([]), HttpClientTestingModule],
            providers: [
                { provide: UserService, useValue: userServiceSpy },
                { provide: PostService, useValue: { getMyPosts: vi.fn(), getUserPosts: vi.fn() } },
                { provide: InteractionService, useValue: { likePost: vi.fn() } },
                { provide: ConnectionService, useValue: { getFollowers: vi.fn() } },
                { provide: MediaService, useValue: { uploadMedia: vi.fn() } },
                { provide: NotificationService, useValue: { getUnreadCount: vi.fn() } },
                { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => null }) } },
                { provide: ChangeDetectorRef, useValue: { detectChanges: () => { } } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfilePage);
        component = fixture.componentInstance;
    });

    it('should save profile changes successfully', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            name: 'Original Name',
            bio: 'Original Bio'
        };

        const updatedUser = {
            ...mockUser,
            name: 'Updated Name',
            bio: 'Updated Bio'
        };

        // Initialize component data
        component.user = mockUser as any;
        component.editData = {
            name: 'Updated Name',
            bio: 'Updated Bio',
            location: '', website: '', contactEmail: '', contactPhone: '', address: '', category: ''
        };

        // Mock API responses
        userServiceSpy.updateProfile.mockReturnValue(of({
            success: true,
            data: updatedUser as any,
            message: 'Updated'
        }));

        // Execute save
        component.saveProfile();

        expect(userServiceSpy.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Updated Name',
            bio: 'Updated Bio'
        }));

        expect(component.user?.name).toBe('Updated Name');
        expect(component.isEditModalOpen).toBe(false);
    });
});

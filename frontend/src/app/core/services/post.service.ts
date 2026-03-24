import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiResponse } from './auth.service';

export interface PagedResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
}

export interface PostResponse {
    id: number;
    content: string;
    postType: string;
    mediaUrls: string[];
    pinned: boolean;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    createdAt: string;
    updatedAt: string;
    userId: number;
    authorId: number;
    authorUsername: string;
    authorName: string;
    authorProfilePicture: string;
    ctaLabel?: string;
    ctaUrl?: string;
    isPromotional?: boolean;
    partnerName?: string;
    productTags?: string[];
    isLikedByCurrentUser?: boolean;
    originalPost?: PostResponse;
}

export interface PostRequest {
    content: string;
    postType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' | 'PROMOTIONAL' | 'ANNOUNCEMENT' | 'UPDATE';
    mediaUrls?: string[];
    isPromotional?: boolean;
    partnerName?: string;
    productTags?: string[];
}

@Injectable({ providedIn: 'root' })
export class PostService {
    private apiUrl = '/api/posts';

    constructor(private http: HttpClient) { }

    // GET /api/posts/feed
    getPublicFeed(page = 0, size = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/feed`, { params });
    }

    // GET /api/posts/feed/personalized
    getPersonalizedFeed(page = 0, size = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/feed/personalized`, { params });
    }

    // POST /api/posts
    createPost(request: PostRequest): Observable<ApiResponse<PostResponse>> {
        return this.http.post<ApiResponse<PostResponse>>(this.apiUrl, request);
    }

    // GET /api/posts/me
    getMyPosts(page = 0, size = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/me`, { params });
    }

    // GET /api/posts/user/{userId}
    getUserPosts(userId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/user/${userId}`, { params });
    }

    // GET /api/posts/user/{userId}/liked
    getUserLikedPosts(userId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/user/${userId}/liked`, { params });
    }

    // GET /api/posts/user/{userId}/media
    getUserMediaPosts(userId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/user/${userId}/media`, { params });
    }

    // GET /api/posts/{postId}
    getPostById(postId: number): Observable<ApiResponse<PostResponse>> {
        return this.http.get<ApiResponse<PostResponse>>(`${this.apiUrl}/${postId}`);
    }

    // PUT /api/posts/{postId}
    updatePost(postId: number, request: PostRequest): Observable<ApiResponse<PostResponse>> {
        return this.http.put<ApiResponse<PostResponse>>(`${this.apiUrl}/${postId}`, request);
    }

    // DELETE /api/posts/{postId}
    deletePost(postId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${postId}`);
    }

    // GET /api/posts/trending
    getTrendingPosts(page = 0, size = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/trending`, { params });
    }

    // PATCH /api/posts/{postId}/pin
    togglePin(postId: number): Observable<ApiResponse<PostResponse>> {
        return this.http.patch<ApiResponse<PostResponse>>(`${this.apiUrl}/${postId}/pin`, {});
    }

    // POST /api/posts/{postId}/view
    recordView(postId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${postId}/view`, {}).pipe(
            catchError(() => EMPTY)
        );
    }

    // POST /api/posts/{postId}/impression
    recordImpression(postId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${postId}/impression`, {}).pipe(
            catchError(() => EMPTY)
        );
    }

    // POST /api/posts/{postId}/cta
    setPostCta(postId: number, label: string, url: string): Observable<ApiResponse<any>> {
        const params = new HttpParams().set('label', label).set('url', url);
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${postId}/cta`, {}, { params });
    }

    // DELETE /api/posts/{postId}/cta
    clearPostCta(postId: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${postId}/cta`);
    }

    // POST /api/posts/schedule
    schedulePost(request: any): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/schedule`, request);
    }
}

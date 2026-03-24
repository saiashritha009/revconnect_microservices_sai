import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';
import { PagedResponse } from './post.service';

// Matches backend CommentResponse DTO
export interface CommentResponse {
    id: number;
    content: string;
    userId: number;
    username: string;
    name: string;
    profilePicture: string;
    postId: number;
    parentId?: number;
    likeCount: number;
    isLikedByCurrentUser?: boolean;
    replyCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ShareResponse {
    id: number;
    userId: number;
    username: string;
    name: string;
    profilePicture: string;
    postId: number;
    comment: string;
    createdAt: string;
}

export interface CommentRequest {
    content: string;
    parentId?: number;
}

@Injectable({ providedIn: 'root' })
export class InteractionService {
    private api = '/api';

    constructor(private http: HttpClient) { }

    likePost(postId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/posts/${postId}/like`, {});
    }

    unlikePost(postId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/posts/${postId}/like`);
    }

    hasLikedPost(postId: number): Observable<ApiResponse<boolean>> {
        return this.http.get<ApiResponse<boolean>>(`${this.api}/posts/${postId}/liked`);
    }

    getComments(postId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<CommentResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<CommentResponse>>>(
            `${this.api}/posts/${postId}/comments?page=${page}&size=${size}`
        );
    }

    addComment(postId: number, content: string, parentId?: number): Observable<ApiResponse<CommentResponse>> {
        return this.http.post<ApiResponse<CommentResponse>>(
            `${this.api}/posts/${postId}/comments`,
            { content, parentId }
        );
    }

    deleteComment(commentId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/comments/${commentId}`);
    }

    updateComment(commentId: number, content: string): Observable<ApiResponse<CommentResponse>> {
        return this.http.put<ApiResponse<CommentResponse>>(`${this.api}/comments/${commentId}`, { content });
    }

    likeComment(commentId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/comments/${commentId}/like`, {});
    }

    unlikeComment(commentId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/comments/${commentId}/like`);
    }

    getCommentReplies(commentId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<CommentResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<CommentResponse>>>(
            `${this.api}/comments/${commentId}/replies?page=${page}&size=${size}`
        );
    }

    getLikedPostIds(): Observable<ApiResponse<number[]>> {
        return this.http.get<ApiResponse<number[]>>(`${this.api}/interactions/liked-posts`);
    }

    getPostLikeCount(postId: number): Observable<any> {
        return this.http.get<any>(`${this.api}/posts/${postId}/likes`);
    }

    getPostShareCount(postId: number): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.api}/posts/${postId}/shares`);
    }

    sharePost(postId: number, comment?: string): Observable<ApiResponse<ShareResponse>> {
        const body = comment ? { comment } : {};
        return this.http.post<ApiResponse<ShareResponse>>(`${this.api}/posts/${postId}/share`, body);
    }

    incrementShareCount(postId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/posts/${postId}/share/increment`, {});
    }

    recordView(postId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/posts/${postId}/view`, {});
    }

    getViewCount(postId: number): Observable<ApiResponse<{ viewCount: number }>> {
        return this.http.get<ApiResponse<{ viewCount: number }>>(`${this.api}/posts/${postId}/views`);
    }
}

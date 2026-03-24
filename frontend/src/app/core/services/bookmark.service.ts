import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';
import { PagedResponse, PostResponse } from './post.service';

// Matches backend BookmarkResponse DTO exactly:
// { id, post: PostResponse, bookmarkedAt }
export interface BookmarkResponse {
    id: number;
    post: PostResponse;
    bookmarkedAt: string; // Backend field name, mapped from LocalDateTime
}

@Injectable({ providedIn: 'root' })
export class BookmarkService {
    private api = '/api/bookmarks';

    constructor(private http: HttpClient) { }

    // POST /api/bookmarks/posts/{postId}
    bookmarkPost(postId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/posts/${postId}`, {});
    }

    // DELETE /api/bookmarks/posts/{postId}
    removeBookmark(postId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/posts/${postId}`);
    }

    // GET /api/bookmarks?page=0&size=10
    getBookmarks(page = 0, size = 10): Observable<ApiResponse<PagedResponse<BookmarkResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<BookmarkResponse>>>(`${this.api}?page=${page}&size=${size}`);
    }

    // GET /api/bookmarks/posts/{postId}/status
    isBookmarked(postId: number): Observable<ApiResponse<boolean>> {
        return this.http.get<ApiResponse<boolean>>(`${this.api}/posts/${postId}/status`);
    }
}

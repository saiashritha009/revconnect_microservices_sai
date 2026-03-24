import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';
import { UserResponse } from './user.service';
import { PagedResponse } from './post.service';

export interface ConnectionStatsResponse {
    userId: number;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isFollowedBy: boolean;
}

export interface ConnectionResponse {
    id: number;
    userId: number;
    username: string;
    name: string;
    profilePicture: string;
    bio: string;
    status: string;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectionService {
    private api = '/api';

    constructor(private http: HttpClient) { }

    // POST /api/users/{userId}/follow → 201
    followUser(userId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/users/${userId}/follow`, {});
    }

    // DELETE /api/users/{userId}/follow → 200
    unfollowUser(userId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/users/${userId}/follow`);
    }

    // GET /api/users/{userId}/connection-stats
    getConnectionStats(userId: number): Observable<ApiResponse<ConnectionStatsResponse>> {
        return this.http.get<ApiResponse<ConnectionStatsResponse>>(`${this.api}/users/${userId}/connection-stats`);
    }

    // GET /api/users/{userId}/is-following → boolean
    isFollowing(userId: number): Observable<ApiResponse<boolean>> {
        return this.http.get<ApiResponse<boolean>>(`${this.api}/users/${userId}/is-following`);
    }

    // GET /api/users/{userId}/followers
    getFollowers(userId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<ConnectionResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<ConnectionResponse>>>(`${this.api}/users/${userId}/followers?page=${page}&size=${size}`);
    }

    // GET /api/users/{userId}/following
    getFollowing(userId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<ConnectionResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<ConnectionResponse>>>(`${this.api}/users/${userId}/following?page=${page}&size=${size}`);
    }

    // GET /api/connections/pending
    getPendingRequests(page = 0, size = 10): Observable<ApiResponse<PagedResponse<ConnectionResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<ConnectionResponse>>>(`${this.api}/connections/pending?page=${page}&size=${size}`);
    }

    // GET /api/connections/pending/sent
    getSentPendingRequests(page = 0, size = 10): Observable<ApiResponse<PagedResponse<ConnectionResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<ConnectionResponse>>>(`${this.api}/connections/pending/sent?page=${page}&size=${size}`);
    }

    // POST /api/connections/{connectionId}/accept
    acceptRequest(connectionId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/connections/${connectionId}/accept`, {});
    }

    // DELETE /api/connections/{connectionId}/reject
    rejectRequest(connectionId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/connections/${connectionId}/reject`);
    }

    // GET /api/connections/past
    getPastRequests(page = 0, size = 10): Observable<ApiResponse<PagedResponse<ConnectionResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<ConnectionResponse>>>(`${this.api}/connections/past?page=${page}&size=${size}`);
    }

    // DELETE /api/users/{userId}/connection
    removeConnection(userId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/users/${userId}/connection`);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';
import { PagedResponse } from './post.service';

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    name: string;
    userType: string;
    bio?: string;
    profilePicture?: string;
    coverPhoto?: string;
    location?: string;
    website?: string;
    privacy: string;
    isVerified: boolean;
    verificationRequested?: boolean;
    businessName?: string;
    category?: string;
    industry?: string;
    contactInfo?: string;
    businessAddress?: string;
    businessHours?: string;
    externalLinks?: string;
    socialMediaLinks?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    createdAt: string;
}

export interface ProfileUpdateRequest {
    name?: string;
    bio?: string;
    profilePicture?: string;
    coverPhoto?: string;
    location?: string;
    website?: string;
    privacy?: string;
    businessName?: string;
    category?: string;
    industry?: string;
    contactInfo?: string;
    businessAddress?: string;
    businessHours?: string;
    externalLinks?: string;
    socialMediaLinks?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = '/api/users';

    constructor(private http: HttpClient) { }

    getMyProfile(): Observable<ApiResponse<UserResponse>> {
        return this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/me`);
    }

    getUserById(userId: number): Observable<ApiResponse<UserResponse>> {
        return this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/${userId}`);
    }

    getUserByUsername(username: string): Observable<ApiResponse<UserResponse>> {
        return this.http.get<ApiResponse<UserResponse>>(`${this.apiUrl}/username/${username}`);
    }

    updateProfile(request: ProfileUpdateRequest): Observable<ApiResponse<UserResponse>> {
        return this.http.put<ApiResponse<UserResponse>>(`${this.apiUrl}/me`, request);
    }

    searchUsers(query: string, page = 0, size = 10): Observable<ApiResponse<PagedResponse<UserResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<UserResponse>>>(
            `${this.apiUrl}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
        );
    }

    updatePrivacy(privacy: 'PUBLIC' | 'PRIVATE'): Observable<ApiResponse<UserResponse>> {
        return this.http.patch<ApiResponse<UserResponse>>(`${this.apiUrl}/me/privacy?privacy=${privacy}`, {});
    }

    getSuggestedUsers(page = 0, size = 10): Observable<ApiResponse<PagedResponse<UserResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<UserResponse>>>(`${this.apiUrl}/suggested?page=${page}&size=${size}`);
    }

    blockUser(userId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${userId}/block`, {});
    }

    unblockUser(userId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${userId}/block`);
    }

    getBlockedUsers(page = 0, size = 10): Observable<ApiResponse<PagedResponse<UserResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<UserResponse>>>(`${this.apiUrl}/blocked?page=${page}&size=${size}`);
    }

    reportUser(userId: number, reason: string): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${userId}/report?reason=${encodeURIComponent(reason)}`, {});
    }

    getBusinessProfile(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>('/api/business/profile/me');
    }

    getBusinessProfileById(userId: number): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`/api/business/profile/${userId}`);
    }

    updateBusinessProfile(request: any): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>('/api/business/profile', request);
    }

    getMutualConnections(userId: number, page = 0, size = 10): Observable<ApiResponse<PagedResponse<UserResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<UserResponse>>>(`${this.apiUrl}/mutual/${userId}?page=${page}&size=${size}`);
    }

    requestVerification(): Observable<ApiResponse<UserResponse>> {
        return this.http.post<ApiResponse<UserResponse>>(`${this.apiUrl}/me/request-verification`, {});
    }

    getShowcase(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>('/api/business/showcase');
    }

    addShowcaseItem(item: any): Observable<ApiResponse<any[]>> {
        return this.http.post<ApiResponse<any[]>>('/api/business/showcase', item);
    }

    removeShowcaseItem(index: number): Observable<ApiResponse<any[]>> {
        return this.http.delete<ApiResponse<any[]>>(`/api/business/showcase/${index}`);
    }

    approveVerification(userId: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`/api/admin/users/${userId}/verify`, {});
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface AnalyticsOverview {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalFollowers: number;
    totalPosts: number;
}

export interface PostPerformance {
    postId: number;
    content: string;
    likes: number;
    comments: number;
    shares: number;
    views: number;
}

export interface FollowerGrowth {
    date: string;
    followers: number;
}

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private apiUrl = '/api/analytics';

    constructor(private http: HttpClient) { }

    getOverview(): Observable<ApiResponse<AnalyticsOverview>> {
        return this.http.get<ApiResponse<AnalyticsOverview>>(`${this.apiUrl}/overview`);
    }

    getProfileViews(days = 7): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/profile-views?days=${days}`);
    }

    getPostPerformance(days = 7): Observable<ApiResponse<PostPerformance[]>> {
        return this.http.get<ApiResponse<PostPerformance[]>>(`${this.apiUrl}/post-performance?days=${days}`);
    }

    getFollowerGrowth(days = 30): Observable<ApiResponse<FollowerGrowth[]>> {
        return this.http.get<ApiResponse<FollowerGrowth[]>>(`${this.apiUrl}/followers/growth?days=${days}`);
    }

    getEngagement(days = 7): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/engagement?days=${days}`);
    }

    getAudienceDemographics(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/audience`);
    }

    getTopPosts(limit = 5): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/top-posts?limit=${limit}`);
    }
}

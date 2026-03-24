import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface StoryResponse {
    id: number;
    userId: number;
    mediaUrl: string;
    caption?: string;
    createdAt: string;
    expiresAt: string;
    isHighlight: boolean;
    viewCount: number;
    username?: string;
    profilePicture?: string;
    user?: {
        id: number;
        username: string;
        name: string;
        profilePicture: string;
    };
}

@Injectable({ providedIn: 'root' })
export class StoryService {
    private api = '/api/stories';

    constructor(private http: HttpClient) { }

    getMyStories(): Observable<ApiResponse<StoryResponse[]>> {
        return this.http.get<ApiResponse<StoryResponse[]>>(this.api);
    }

    getStoriesFeed(): Observable<ApiResponse<StoryResponse[]>> {
        return this.http.get<ApiResponse<StoryResponse[]>>(`${this.api}/feed`);
    }

    createStory(mediaUrl: string, caption?: string): Observable<ApiResponse<{ storyId: number }>> {
        let params = new HttpParams().set('mediaUrl', mediaUrl);
        if (caption) {
            params = params.set('caption', caption);
        }
        return this.http.post<ApiResponse<{ storyId: number }>>(this.api, {}, { params });
    }

    viewStory(storyId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/${storyId}/view`, {});
    }

    deleteStory(storyId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/${storyId}`);
    }

}

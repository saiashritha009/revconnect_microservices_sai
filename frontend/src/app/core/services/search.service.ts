import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';
import { UserResponse } from './user.service';
import { PostResponse, PagedResponse } from './post.service';

export interface SearchResults {
    users?: PagedResponse<UserResponse>;
    posts?: PagedResponse<PostResponse>;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private apiUrl = '/api/search';

    constructor(private http: HttpClient) { }

    searchAll(query: string, limit: number = 5): Observable<ApiResponse<SearchResults>> {
        const params = new HttpParams()
            .set('query', query)
            .set('limit', limit.toString());
        return this.http.get<ApiResponse<SearchResults>>(`${this.apiUrl}/all`, { params });
    }

    searchUsers(query: string, page: number = 0, size: number = 10): Observable<ApiResponse<PagedResponse<UserResponse>>> {
        const params = new HttpParams()
            .set('query', query)
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PagedResponse<UserResponse>>>(`${this.apiUrl}/users`, { params });
    }

    searchPosts(query: string, page: number = 0, size: number = 10): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        const params = new HttpParams()
            .set('query', query)
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/posts`, { params });
    }

    getTrendingSearches(): Observable<ApiResponse<string[]>> {
        return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/trending`);
    }

    advancedPostSearch(params: any): Observable<ApiResponse<PagedResponse<PostResponse>>> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });
        return this.http.get<ApiResponse<PagedResponse<PostResponse>>>(`${this.apiUrl}/posts/advanced`, { params: httpParams });
    }

    advancedUserSearch(params: any): Observable<ApiResponse<PagedResponse<UserResponse>>> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });
        return this.http.get<ApiResponse<PagedResponse<UserResponse>>>(`${this.apiUrl}/users/advanced`, { params: httpParams });
    }

    getRecentSearches(): Observable<ApiResponse<string[]>> {
        return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/recent`);
    }

    clearRecentSearches(): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/recent`);
    }

    removeRecentSearch(query: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/recent/${encodeURIComponent(query)}`);
    }

    getSearchSuggestions(query: string): Observable<ApiResponse<string[]>> {
        return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/suggestions?query=${encodeURIComponent(query)}`);
    }
}

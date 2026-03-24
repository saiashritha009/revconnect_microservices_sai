import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private api = '/api/settings';

    constructor(private http: HttpClient) { }

    getAccountSettings(): Observable<ApiResponse<Record<string, any>>> {
        return this.http.get<ApiResponse<Record<string, any>>>(`${this.api}/account`);
    }

    changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<void>> {
        const params = new HttpParams()
            .set('currentPassword', currentPassword)
            .set('newPassword', newPassword);
        return this.http.post<ApiResponse<void>>(`${this.api}/password/change`, {}, { params });
    }

    deleteAccount(password: string): Observable<ApiResponse<void>> {
        const params = new HttpParams().set('password', password);
        return this.http.delete<ApiResponse<void>>(`${this.api}/account`, { params });
    }

    deactivateAccount(): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/account/deactivate`, {});
    }

    getExternalLinks(): Observable<ApiResponse<string[]>> {
        return this.http.get<ApiResponse<string[]>>(`${this.api}/account/external-links`);
    }

    addExternalLink(url: string): Observable<ApiResponse<string[]>> {
        const params = new HttpParams().set('url', url);
        return this.http.post<ApiResponse<string[]>>(`${this.api}/account/external-links`, {}, { params });
    }

    removeExternalLink(url: string): Observable<ApiResponse<string[]>> {
        const params = new HttpParams().set('url', url);
        return this.http.delete<ApiResponse<string[]>>(`${this.api}/account/external-links`, { params });
    }

    getPrivacySettings(): Observable<ApiResponse<Record<string, any>>> {
        return this.http.get<ApiResponse<Record<string, any>>>(`${this.api}/privacy`);
    }

    updatePrivacySettings(settings: Record<string, any>): Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.api}/privacy`, settings);
    }

    getNotificationSettings(): Observable<ApiResponse<Record<string, any>>> {
        return this.http.get<ApiResponse<Record<string, any>>>(`${this.api}/notifications`);
    }

    updateNotificationSettings(settings: Record<string, any>): Observable<ApiResponse<void>> {
        return this.http.put<ApiResponse<void>>(`${this.api}/notifications`, settings);
    }
}

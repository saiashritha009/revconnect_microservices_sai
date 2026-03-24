import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ApiResponse, PagedResponse } from './auth.service';

export interface NotificationResponse {
    id: number;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    referenceId: number;
    actorId?: number;
    actorUsername?: string;
    actorName?: string;
    actorProfilePicture?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private api = '/api/notifications';
    private unreadCountSubject = new BehaviorSubject<number>(0);
    unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private http: HttpClient) { }

    refreshUnreadCount(): void {
        this.getUnreadCount().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.unreadCountSubject.next(res.data.unreadCount);
                }
            }
        });
    }

    getNotifications(page: number = 0, size: number = 20): Observable<ApiResponse<PagedResponse<NotificationResponse>>> {
        return this.http.get<ApiResponse<PagedResponse<NotificationResponse>>>(`${this.api}?page=${page}&size=${size}`);
    }

    getUnreadCount(): Observable<ApiResponse<{ unreadCount: number }>> {
        return this.http.get<ApiResponse<{ unreadCount: number }>>(`${this.api}/count`);
    }

    markAsRead(id: number): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(`${this.api}/${id}/read`, {}).pipe(
            tap(() => this.refreshUnreadCount())
        );
    }

    markAllAsRead(): Observable<ApiResponse<{ markedCount: number }>> {
        return this.http.patch<ApiResponse<{ markedCount: number }>>(`${this.api}/read-all`, {}).pipe(
            tap(() => this.refreshUnreadCount())
        );
    }

    deleteNotification(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
            tap(() => this.refreshUnreadCount())
        );
    }
}

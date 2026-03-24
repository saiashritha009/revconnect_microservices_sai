import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

/**
 * Backend MessageController returns raw Maps (not typed DTOs), so we model them directly.
 *
 * Conversation partner returned from toUserMap():
 *   { userId, username, name, profilePicture }
 *
 * Message returned from toMessageMap():
 *   { id, senderId, receiverId, content, mediaUrl, timestamp, isRead, isDeleted }
 *
 * NOTE: conversationId = the other user's userId throughout the API.
 */

export interface ConversationPartner {
    userId: number;
    username: string;
    name: string;
    profilePicture?: string; // may be null from backend
    unreadCount?: number;
}

export interface MessageItem {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    mediaUrl: string | null;
    timestamp: string;
    isRead: boolean;
    isDeleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
    private api = '/api/messages';

    constructor(private http: HttpClient) { }

    // GET /api/messages/conversations?page=0&size=20
    // Returns: ApiResponse<List<Map>> where each map = ConversationPartner
    getConversations(page = 0, size = 20): Observable<ApiResponse<ConversationPartner[]>> {
        return this.http.get<ApiResponse<ConversationPartner[]>>(
            `${this.api}/conversations?page=${page}&size=${size}`
        );
    }

    // POST /api/messages/conversations?recipientId={userId}
    // Returns: ApiResponse<ConversationPartner>
    createConversation(recipientId: number): Observable<ApiResponse<ConversationPartner>> {
        return this.http.post<ApiResponse<ConversationPartner>>(
            `${this.api}/conversations?recipientId=${recipientId}`, {}
        );
    }

    // GET /api/messages/conversations/{conversationId}?page=0&size=50
    // conversationId = other user's userId
    // Returns: ApiResponse<List<Map>> where each map = MessageItem
    getMessages(conversationId: number, page = 0, size = 50): Observable<ApiResponse<MessageItem[]>> {
        return this.http.get<ApiResponse<MessageItem[]>>(
            `${this.api}/conversations/${conversationId}?page=${page}&size=${size}`
        );
    }

    // POST /api/messages/conversations/{conversationId}
    // Returns: ApiResponse<Map<String, Long>> = { messageId: X }
    sendMessage(conversationId: number, content: string, mediaUrl?: string): Observable<ApiResponse<{ messageId: number }>> {
        const body = { content, mediaUrl };
        return this.http.post<ApiResponse<{ messageId: number }>>(`${this.api}/conversations/${conversationId}`, body);
    }

    // DELETE /api/messages/conversations/{conversationId}
    deleteConversation(conversationId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/conversations/${conversationId}`);
    }

    // DELETE /api/messages/messages/{messageId}
    deleteMessage(messageId: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.api}/messages/${messageId}`);
    }

    // PATCH /api/messages/messages/{messageId}
    editMessage(messageId: number, content: string): Observable<ApiResponse<void>> {
        return this.http.patch<ApiResponse<void>>(
            `${this.api}/messages/${messageId}`, { content }
        );
    }

    // POST /api/messages/conversations/{conversationId}/read
    markConversationAsRead(conversationId: number): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.api}/conversations/${conversationId}/read`, {});
    }

    // GET /api/messages/unread/count
    // Returns: ApiResponse<Map<String, Integer>> = { count: N }
    getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
        return this.http.get<ApiResponse<{ count: number }>>(`${this.api}/unread/count`);
    }

    // POST /api/messages/messages/{messageId}/react?reaction={emoji}
    reactToMessage(messageId: number, reaction: string): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(
            `${this.api}/messages/${messageId}/react?reaction=${encodeURIComponent(reaction)}`, {}
        );
    }

    // GET /api/messages/search?query={text}
    searchMessages(query: string): Observable<ApiResponse<MessageItem[]>> {
        return this.http.get<ApiResponse<MessageItem[]>>(
            `${this.api}/search?query=${encodeURIComponent(query)}`
        );
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface VerifyEmailRequest {
    email: string;
    otp: string;
}

export interface ResendVerificationRequest {
    email: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    name: string;
    userType?: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    category?: string;
}

export interface AuthResponse {
    accessToken: string;
    tokenType?: string;
    username: string;
    userId: number;
    email?: string;
    name?: string;
    userType?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PagedResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api/auth';

    constructor(private http: HttpClient) { }

    login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
        return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials);
    }

    register(details: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
        return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, details);
    }

    verifyEmail(request: VerifyEmailRequest): Observable<ApiResponse<AuthResponse>> {
        return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/verify-email`, request);
    }

    resendVerification(request: ResendVerificationRequest): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/resend-verification`, request);
    }

    forgotPassword(email: string): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, { email });
    }

    resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<void>> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/reset-password`, request);
    }

    storeToken(token: string) {
        localStorage.setItem('revconnect_token', token);
    }

    logout() {
        localStorage.removeItem('revconnect_token');
    }
}

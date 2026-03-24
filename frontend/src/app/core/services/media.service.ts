import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface MediaUploadResponse {
    url: string;
    mediaId?: string;
    fileName?: string;
    [key: string]: string | undefined;
}

@Injectable({
    providedIn: 'root'
})
export class MediaService {
    private apiUrl = '/api/media';

    constructor(private http: HttpClient) { }

    uploadFile(file: File): Observable<ApiResponse<MediaUploadResponse>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<MediaUploadResponse>>(`${this.apiUrl}/upload`, formData);
    }

    uploadMultipleFiles(files: File[]): Observable<ApiResponse<MediaUploadResponse[]>> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return this.http.post<ApiResponse<MediaUploadResponse[]>>(`${this.apiUrl}/upload/multiple`, formData);
    }

    uploadProfilePicture(file: File): Observable<ApiResponse<MediaUploadResponse>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<MediaUploadResponse>>(`${this.apiUrl}/upload/profile-picture`, formData);
    }

    uploadCoverPhoto(file: File): Observable<ApiResponse<MediaUploadResponse>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<MediaUploadResponse>>(`${this.apiUrl}/upload/cover-photo`, formData);
    }

    uploadVideo(file: File): Observable<ApiResponse<MediaUploadResponse>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<ApiResponse<MediaUploadResponse>>(`${this.apiUrl}/upload/video`, formData);
    }
}

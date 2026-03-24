import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const isAuthRequest = req.url.includes('/api/auth/');

    if (isAuthRequest) {
        return next(req);
    }

    const token = localStorage.getItem('revconnect_token');

    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    return next(req);
};

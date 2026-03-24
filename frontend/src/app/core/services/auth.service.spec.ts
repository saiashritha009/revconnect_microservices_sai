import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService, LoginRequest, RegisterRequest } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(AuthService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should login and return auth response', () => {
        const mockResponse = {
            success: true,
            message: 'Logged in successfully',
            data: { accessToken: 'fake-token', username: 'testuser', userId: 1 }
        };
        const loginRequest: LoginRequest = { usernameOrEmail: 'testuser', password: 'password' };

        service.login(loginRequest).subscribe(res => {
            expect(res).toEqual(mockResponse);
        });

        const req = httpTestingController.expectOne('/api/auth/login');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual(loginRequest);
        req.flush(mockResponse);
    });

    it('should register and return auth response', () => {
        const mockResponse = {
            success: true,
            message: 'Registered successfully',
            data: { accessToken: 'new-token', username: 'newuser', userId: 2 }
        };
        const registerRequest: RegisterRequest = { username: 'newuser', password: 'password', email: 'new@test.com', name: 'New User' };

        service.register(registerRequest).subscribe(res => {
            expect(res).toEqual(mockResponse);
        });

        const req = httpTestingController.expectOne('/api/auth/register');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual(registerRequest);
        req.flush(mockResponse);
    });

    it('should store and remove token from local storage', () => {
        const token = 'my-token';
        service.storeToken(token);
        expect(localStorage.getItem('revconnect_token')).toEqual(token);

        service.logout();
        expect(localStorage.getItem('revconnect_token')).toBeNull();
    });
});

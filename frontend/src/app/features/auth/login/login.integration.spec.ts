import { vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('Login Integration Test', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authServiceSpy: any;
    let routerSpy: any;

    beforeEach(async () => {
        authServiceSpy = { login: vi.fn(), storeToken: vi.fn() };
        routerSpy = { navigate: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [LoginComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should show error message on invalid credentials', () => {
        authServiceSpy.login.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));

        component.credentials.usernameOrEmail = 'wronguser';
        component.credentials.password = 'wrongpass';

        component.onSubmit();
        fixture.detectChanges();

        expect(authServiceSpy.login).toHaveBeenCalled();
        expect(component.errorMessage).toBe('Invalid credentials');
    });

    it('should navigate to feed on successful login', () => {
        const mockResponse = {
            success: true,
            message: 'Success',
            data: { accessToken: 'token123', username: 'testuser', userId: 1 }
        };
        authServiceSpy.login.mockReturnValue(of(mockResponse));

        component.credentials.usernameOrEmail = 'testuser';
        component.credentials.password = 'correctpass';

        component.onSubmit();
        fixture.detectChanges();

        expect(authServiceSpy.login).toHaveBeenCalledWith({ usernameOrEmail: 'testuser', password: 'correctpass' });
        expect(authServiceSpy.storeToken).toHaveBeenCalledWith('token123');
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/feed']);
    });
});

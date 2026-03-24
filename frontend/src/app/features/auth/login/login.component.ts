import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    credentials: LoginRequest = {
        usernameOrEmail: '',
        password: ''
    };
    showPassword = false;
    isLoading = false;
    errorMessage = '';
    rememberMe = false;

    constructor(private authService: AuthService, private router: Router) { }

    ngOnInit() {
        const savedUsername = localStorage.getItem('revconnect_remembered_user');
        if (savedUsername) {
            this.credentials.usernameOrEmail = savedUsername;
            this.rememberMe = true;
        }
    }

    onSubmit() {
        this.isLoading = true;
        this.errorMessage = '';

        this.authService.login(this.credentials).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    if (this.rememberMe) {
                        localStorage.setItem('revconnect_remembered_user', this.credentials.usernameOrEmail);
                    } else {
                        localStorage.removeItem('revconnect_remembered_user');
                    }

                    this.authService.storeToken(response.data.accessToken);
                    this.router.navigate(['/feed']);
                }
                this.isLoading = false;
            },
            error: (error) => {
                this.errorMessage = error.error?.message || error.message || 'Login failed. Please verify credentials.';
                this.isLoading = false;
            }
        });
    }
}

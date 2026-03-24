import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {
  email: string = '';
  isSubmitting = false;
  message: string | null = null;
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    if (!this.email) {
      this.error = 'Please enter your email address.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.message = null;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        if (res.success) {
          this.message = 'OTP sent to your email. Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/reset-password']);
          }, 2000);
        } else {
          this.error = res.message || 'Failed to send OTP.';
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'An error occurred. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}

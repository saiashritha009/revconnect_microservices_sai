import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPassword implements OnInit {
  otp = '';
  newPassword = '';
  confirmPassword = '';
  isSubmitting = false;
  message: string | null = null;
  error: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
  }

  onSubmit() {
    if (!this.otp || this.otp.length !== 6) {
      this.error = 'Please enter the 6-digit OTP sent to your email.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.message = null;

    // Remove any spaces if user accidentally pasted them
    const cleanOtp = this.otp.trim();

    this.authService.resetPassword({ token: cleanOtp, newPassword: this.newPassword }).subscribe({
      next: (res) => {
        if (res && (res.success || (res as any).status === 200)) {
          this.message = '✅ Password successfully updated! Redirecting to login...';
          this.otp = '';
          this.newPassword = '';
          this.confirmPassword = '';
          setTimeout(() => this.router.navigate(['/login']), 4000);
        } else {
          this.error = res.message || 'Failed to reset password.';
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Reset error:', err);
        // Extract the error message from the response
        this.error = err.error?.message || err.message || 'Verification failed. Please check your OTP.';
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}


import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  details: RegisterRequest = {
    name: '',
    username: '',
    email: '',
    password: '',
    userType: 'PERSONAL',
    category: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    logoUrl: '',
    coverImageUrl: ''
  };

  isLoading = false;
  isVerifying = false;
  isResending = false;
  errorMessage = '';
  passwordStrength = 0;
  showPassword = false;
  readonly emailPattern = '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$';

  step: 'REGISTER' | 'VERIFY' = 'REGISTER';
  otp: string = '';

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

  onTypeChange() {
    this.details.category = '';
    this.details.address = '';
    this.details.contactEmail = '';
    this.details.contactPhone = '';
    this.details.logoUrl = '';
    this.details.coverImageUrl = '';
  }

  checkPasswordStrength() {
    const pbox = this.details.password;
    this.passwordStrength = 0;
    if (!pbox) return;

    if (pbox.length >= 6) this.passwordStrength += 25;
    if (/[A-Z]/.test(pbox)) this.passwordStrength += 25;
    if (/[0-9]/.test(pbox)) this.passwordStrength += 25;
    if (/[^A-Za-z0-9]/.test(pbox)) this.passwordStrength += 25;
  }

  onSubmit(registerForm: NgForm) {
    if (registerForm.invalid) {
      registerForm.control.markAllAsTouched();
      return;
    }

    this.details.email = this.details.email.trim();
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.details).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          alert('Registration successful! Please check your email for the verification code.');
          setTimeout(() => {
            this.step = 'VERIFY';
            this.cdr.detectChanges();
          }, 100);
        } else {
          this.errorMessage = response.message || 'Registration failed.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        this.errorMessage =
          error.error?.message ||
          `Registration failed (Status: ${error.status}). Please try again.`;
        alert('Error: ' + this.errorMessage);
      }
    });
  }

  onVerifySubmit(verifyForm: NgForm) {
    if (verifyForm.invalid || !this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP.';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';

    this.authService.verifyEmail({ email: this.details.email, otp: this.otp }).subscribe({
      next: (response) => {
        this.isVerifying = false;
        if (response.success) {
          alert('Email verified successfully! Please log in with your credentials.');
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = response.message || 'Verification failed.';
        }
      },
      error: (error) => {
        this.isVerifying = false;
        console.error('Verification error:', error);
        this.errorMessage = error.error?.message || 'Verification request failed.';
      }
    });
  }

  resendOtp() {
    this.isResending = true;
    this.errorMessage = '';

    this.authService.resendVerification({ email: this.details.email }).subscribe({
      next: (response) => {
        this.isResending = false;
        alert('A new verification code has been sent to your email.');
      },
      error: (error) => {
        this.isResending = false;
        console.error('Resend error:', error);
        this.errorMessage = error.error?.message || 'Failed to resend verification code.';
      }
    });
  }
}


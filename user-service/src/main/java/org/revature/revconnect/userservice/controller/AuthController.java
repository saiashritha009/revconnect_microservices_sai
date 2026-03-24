package org.revature.revconnect.userservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.userservice.dto.request.LoginRequest;
import org.revature.revconnect.userservice.dto.request.RegisterRequest;
import org.revature.revconnect.userservice.dto.response.ApiResponse;
import org.revature.revconnect.userservice.dto.response.AuthResponse;
import org.revature.revconnect.userservice.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        log.info("Login attempt for: {}", request.getUsernameOrEmail());
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            log.warn("Bad credentials for: {}", request.getUsernameOrEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username/email or password"));
        } catch (Exception e) {
            log.error("Login error for {}: {}", request.getUsernameOrEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage() != null ? e.getMessage() : "Login failed"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request) {
        log.info("Registration request received for username: {}", request.getUsername());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@RequestBody Map<String, String> request) {
        log.info("Verify email request received for: {}", request.get("email"));
        AuthResponse response = authService.verifyEmail(request.get("email"), request.get("otp"));
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. You are now logged in.", response));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@RequestBody Map<String, String> request) {
        log.info("Resend verification request received for email: {}", request.get("email"));
        authService.resendVerification(request.get("email"));
        return ResponseEntity.ok(ApiResponse.success("Verification email resent. Check your inbox.", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody Map<String, String> request) {
        log.info("Forgot password request for email: {}", request.get("email"));
        authService.forgotPassword(request.get("email"));
        return ResponseEntity.ok(ApiResponse.success("Password reset email sent. Check your inbox.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody Map<String, String> request) {
        log.info("Reset password request received");
        authService.resetPassword(request.get("token"), request.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.success("Password reset successful. You can now login with your new password.", null));
    }
}

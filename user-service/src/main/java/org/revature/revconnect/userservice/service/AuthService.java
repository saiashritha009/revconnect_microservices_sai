package org.revature.revconnect.userservice.service;

import lombok.RequiredArgsConstructor;
import org.revature.revconnect.userservice.dto.request.*;
import org.revature.revconnect.userservice.dto.response.AuthResponse;
import org.revature.revconnect.userservice.enums.UserType;
import org.revature.revconnect.userservice.model.User;
import org.revature.revconnect.userservice.repository.UserRepository;
import org.revature.revconnect.userservice.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword()));
        String token = jwtTokenProvider.generateToken(authentication);
        User user = (User) authentication.getPrincipal();

        // Block login if email has not been verified yet (pending OTP)
        if (!Boolean.TRUE.equals(user.getEmailVerified()) && user.getVerificationCode() != null) {
            throw new RuntimeException("Please verify your email before logging in. Check your inbox for the OTP.");
        }

        // Reactivate account on login if it was previously deactivated (no pending OTP)
        if (!Boolean.TRUE.equals(user.getEmailVerified()) && user.getVerificationCode() == null) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        return AuthResponse.builder()
                .accessToken(token)
                .username(user.getUsername())
                .userId(user.getId())
                .userType(user.getUserType().name())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .userType(request.getUserType() != null ? UserType.valueOf(request.getUserType()) : UserType.PERSONAL)
                .bio(request.getBio())
                .location(request.getLocation())
                .website(request.getWebsite())
                .build();

        user = userRepository.save(user);
        
        // Generate and send OTP
        String otp = generateOtp();
        user.setVerificationCode(otp);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        System.out.println("DEBUG: Sending OTP " + otp + " to email " + user.getEmail());
        emailService.sendVerificationEmail(user.getEmail(), otp);

        String token = jwtTokenProvider.generateTokenFromUser(user);
        return AuthResponse.builder()
                .accessToken(token)
                .username(user.getUsername())
                .userId(user.getId())
                .userType(user.getUserType().name())
                .build();
    }

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public AuthResponse verifyEmail(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }
        if (user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
        
        String token = jwtTokenProvider.generateTokenFromUser(user);
        return AuthResponse.builder()
                .accessToken(token).username(user.getUsername())
                .userId(user.getId()).userType(user.getUserType().name()).build();
    }

    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String otp = generateOtp();
        user.setVerificationCode(otp);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        System.out.println("DEBUG: Resending OTP " + otp + " to email " + user.getEmail());
        emailService.sendVerificationEmail(user.getEmail(), otp);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String otp = generateOtp();
        user.setVerificationCode(otp);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        System.out.println("DEBUG: Password reset OTP " + otp + " for email " + user.getEmail());
        emailService.sendPasswordResetOtp(user.getEmail(), otp);
    }

    public void resetPassword(String otp, String newPassword) {
        // Find user by the verification code (OTP)
        User user = userRepository.findByVerificationCode(otp)
                .orElseThrow(() -> new RuntimeException("Invalid OTP. Please request a new one."));
        
        if (user.getVerificationCodeExpiry() == null || user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
    }
}

package org.revature.revconnect.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String to, String otp) {
        try {
            log.info("Sending OTP email to: {}", to);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("RevConnect - Email Verification OTP");
            message.setText("Your OTP for email verification is: " + otp + "\n\nThis OTP is valid for 10 minutes.");
            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String to, String resetToken) {
        try {
            log.info("Sending password reset email to: {}", to);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("RevConnect - Password Reset");
            message.setText("Your password reset token is: " + resetToken + "\n\nThis token is valid for 30 minutes.");
            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendVerificationEmail(String to, String otp) {
        sendOtpEmail(to, otp);
    }

    @Async
    public void sendPasswordResetOtp(String to, String otp) {
        try {
            log.info("Sending password reset OTP to: {}", to);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("RevConnect - Password Reset OTP");
            message.setText("Your OTP for password reset is: " + otp + "\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.");
            mailSender.send(message);
            log.info("Password reset OTP sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send password reset OTP to {}: {}", to, e.getMessage());
        }
    }
}


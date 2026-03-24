package org.revature.revconnect.userservice.service;

import lombok.RequiredArgsConstructor;
import org.revature.revconnect.userservice.dto.request.ProfileUpdateRequest;
import org.revature.revconnect.userservice.dto.response.UserResponse;
import org.revature.revconnect.userservice.model.User;
import java.util.List;
import java.util.stream.Collectors;
import org.revature.revconnect.userservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    public Page<UserResponse> searchUsers(String query, Pageable pageable) {
        return userRepository.searchUsers(query, pageable).map(this::mapToResponse);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getWebsite() != null) user.setWebsite(request.getWebsite());
        if (request.getProfilePicture() != null) user.setProfilePicture(request.getProfilePicture());
        if (request.getCoverPhoto() != null) user.setCoverPhoto(request.getCoverPhoto());
        if (request.getBusinessName() != null) user.setBusinessName(request.getBusinessName());
        if (request.getCategory() != null) user.setCategory(request.getCategory());
        if (request.getIndustry() != null) user.setIndustry(request.getIndustry());
        if (request.getContactInfo() != null) user.setContactInfo(request.getContactInfo());
        if (request.getBusinessAddress() != null) user.setBusinessAddress(request.getBusinessAddress());
        if (request.getBusinessHours() != null) user.setBusinessHours(request.getBusinessHours());
        if (request.getExternalLinks() != null) user.setExternalLinks(request.getExternalLinks());
        if (request.getSocialMediaLinks() != null) user.setSocialMediaLinks(request.getSocialMediaLinks());

        user = userRepository.save(user);
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updatePrivacy(Long userId, String privacy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPrivacy(org.revature.revconnect.userservice.enums.Privacy.valueOf(privacy.toUpperCase()));
        user = userRepository.save(user);
        return mapToResponse(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public Page<UserResponse> getSuggestions(Long userId, Pageable pageable) {
        return userRepository.findSuggestions(userId, pageable).map(this::mapToResponse);
    }

    public List<UserResponse> getUsersByIds(List<Long> ids) {
        return userRepository.findAllById(ids).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .name(user.getName())
                .userType(user.getUserType().name())
                .bio(user.getBio())
                .profilePicture(user.getProfilePicture())
                .coverPhoto(user.getCoverPhoto())
                .location(user.getLocation())
                .website(user.getWebsite())
                .privacy(user.getPrivacy().name())
                .isVerified(user.getIsVerified())
                .businessName(user.getBusinessName())
                .category(user.getCategory())
                .industry(user.getIndustry())
                .contactInfo(user.getContactInfo())
                .businessAddress(user.getBusinessAddress())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

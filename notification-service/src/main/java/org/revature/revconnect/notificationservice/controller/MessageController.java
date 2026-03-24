package org.revature.revconnect.notificationservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.notificationservice.dto.response.ApiResponse;
import org.revature.revconnect.notificationservice.model.Message;
import org.revature.revconnect.notificationservice.client.UserServiceClient;
import org.revature.revconnect.notificationservice.repository.MessageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserServiceClient userServiceClient;

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getConversations(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Get conversations request for user: {}", userId);
        List<Long> partnerIds = messageRepository.findConversationPartnerIds(userId);
        
        if (partnerIds.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("Success", List.of()));
        }

        Map<Long, UserServiceClient.UserResponse> userMap = new java.util.HashMap<>();
        try {
            var userRes = userServiceClient.getUsersByIds(partnerIds);
            if (userRes != null && userRes.getData() != null) {
                userRes.getData().forEach(u -> userMap.put(u.getId(), u));
            }
        } catch (Exception e) {
            log.error("Error fetching user details for conversations", e);
        }

        List<Map<String, Object>> conversations = partnerIds.stream().map(partnerId -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId", partnerId);
            map.put("unreadCount", messageRepository.countByReceiverIdAndSenderIdAndReadFalse(userId, partnerId));
            
            var user = userMap.get(partnerId);
            if (user != null) {
                map.put("username", user.getUsername());
                map.put("name", user.getName());
                map.put("profilePicture", user.getProfilePicture());
            }
            
            // Get last message
            Page<Message> lastMsgs = messageRepository.findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
                    userId, partnerId, userId, partnerId, PageRequest.of(0, 1));
            if (!lastMsgs.isEmpty()) {
                Message m = lastMsgs.getContent().get(0);
                map.put("lastMessage", m.getContent());
                map.put("lastMessageTime", m.getTimestamp());
            }
            
            return map;
        }).toList();
        return ResponseEntity.ok(ApiResponse.success("Success", conversations));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createConversation(
            @RequestParam Long recipientId) {
        log.info("Creating/opening conversation with user: {}", recipientId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("userId", recipientId);
        
        try {
            var userRes = userServiceClient.getUsersByIds(List.of(recipientId));
            if (userRes != null && userRes.getData() != null && !userRes.getData().isEmpty()) {
                var user = userRes.getData().get(0);
                data.put("username", user.getUsername());
                data.put("name", user.getName());
                data.put("profilePicture", user.getProfilePicture());
            }
        } catch (Exception e) {
            log.error("Error fetching user details for new conversation", e);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conversation opened", data));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMessages(
            @PathVariable Long conversationId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Getting messages for conversation: {}", conversationId);
        Page<Message> messages = messageRepository.findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
                userId, conversationId, userId, conversationId, PageRequest.of(page, size));
        List<Map<String, Object>> response = messages.getContent().stream()
                .map(this::toMessageMap).toList();
        return ResponseEntity.ok(ApiResponse.success("Success", response));
    }

    @PostMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(
            @PathVariable Long conversationId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> request) {
        log.info("Send message to conversation: {}", conversationId);
        Message message = Message.builder()
                .senderId(userId).receiverId(conversationId)
                .content(request.getOrDefault("content", ""))
                .mediaUrl(request.get("mediaUrl"))
                .build();
        message = messageRepository.save(message);

        // Real-time WebSocket delivery
        try {
            messagingTemplate.convertAndSendToUser(
                    conversationId.toString(), "/queue/messages", toMessageMap(message));
        } catch (Exception e) {
            log.warn("WebSocket delivery failed (user may not be connected): {}", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", Map.of("messageId", message.getId())));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable Long conversationId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Deleting conversation: {}", conversationId);
        messageRepository.deleteBySenderIdAndReceiverId(userId, conversationId);
        messageRepository.deleteBySenderIdAndReceiverId(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted", null));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long messageId) {
        log.info("Deleting message: {}", messageId);
        messageRepository.deleteById(messageId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }

    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> editMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> request) {
        log.info("Editing message: {}", messageId);
        messageRepository.findById(messageId).ifPresent(m -> {
            m.setContent(request.get("content"));
            messageRepository.save(m);
        });
        return ResponseEntity.ok(ApiResponse.success("Message edited", null));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long conversationId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Marking conversation {} as read", conversationId);
        messageRepository.markAllAsRead(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Getting unread message count");
        long count = messageRepository.countByReceiverIdAndReadFalse(userId);
        return ResponseEntity.ok(ApiResponse.success("Success", Map.of("count", count)));
    }

    @PostMapping("/messages/{messageId}/react")
    public ResponseEntity<ApiResponse<Void>> reactToMessage(
            @PathVariable Long messageId,
            @RequestParam String reaction) {
        log.info("Reacting to message {} with {}", messageId, reaction);
        return ResponseEntity.ok(ApiResponse.success("Reaction added", null));
    }

    @DeleteMapping("/messages/{messageId}/react")
    public ResponseEntity<ApiResponse<Void>> removeReaction(@PathVariable Long messageId) {
        log.info("Removing reaction from message: {}", messageId);
        return ResponseEntity.ok(ApiResponse.success("Reaction removed", null));
    }

    @PostMapping("/conversations/{conversationId}/mute")
    public ResponseEntity<ApiResponse<Void>> muteConversation(@PathVariable Long conversationId) {
        log.info("Muting conversation: {}", conversationId);
        return ResponseEntity.ok(ApiResponse.success("Conversation muted", null));
    }

    @DeleteMapping("/conversations/{conversationId}/mute")
    public ResponseEntity<ApiResponse<Void>> unmuteConversation(@PathVariable Long conversationId) {
        log.info("Unmuting conversation: {}", conversationId);
        return ResponseEntity.ok(ApiResponse.success("Conversation unmuted", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchMessages(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String query) {
        log.info("Searching messages: {}", query);
        List<Map<String, Object>> results = messageRepository.findByContentContainingIgnoreCaseAndSenderIdOrReceiverId(
                        query, userId).stream()
                .map(this::toMessageMap).toList();
        return ResponseEntity.ok(ApiResponse.success("Success", results));
    }

    @PostMapping("/conversations/{conversationId}/attachment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendAttachment(
            @PathVariable Long conversationId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String attachmentUrl) {
        log.info("Sending attachment to conversation: {}", conversationId);
        Message message = Message.builder()
                .senderId(userId).receiverId(conversationId)
                .content("").mediaUrl(attachmentUrl)
                .build();
        message = messageRepository.save(message);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attachment sent", Map.of("messageId", message.getId())));
    }

    private Map<String, Object> toMessageMap(Message message) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", message.getId());
        map.put("senderId", message.getSenderId());
        map.put("receiverId", message.getReceiverId());
        map.put("content", message.getContent());
        map.put("mediaUrl", message.getMediaUrl());
        map.put("timestamp", message.getTimestamp());
        map.put("isRead", message.getRead());
        return map;
    }
}

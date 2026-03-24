package org.revature.revconnect.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/user-service")
    public Mono<Map<String, String>> userServiceFallback() {
        return Mono.just(Map.of(
                "status", "SERVICE_UNAVAILABLE",
                "message", "User Service is currently unavailable. Please try again later."
        ));
    }

    @RequestMapping("/post-service")
    public Mono<Map<String, String>> postServiceFallback() {
        return Mono.just(Map.of(
                "status", "SERVICE_UNAVAILABLE",
                "message", "Post Service is currently unavailable. Please try again later."
        ));
    }

    @RequestMapping("/feed-service")
    public Mono<Map<String, String>> feedServiceFallback() {
        return Mono.just(Map.of(
                "status", "SERVICE_UNAVAILABLE",
                "message", "Feed Service is currently unavailable. Please try again later."
        ));
    }

    @GetMapping("/interaction-service")
    public Mono<Map<String, String>> interactionServiceFallback() {
        return Mono.just(Map.of(
                "status", "SERVICE_UNAVAILABLE",
                "message", "Interaction Service is currently unavailable. Please try again later."
        ));
    }

    @GetMapping("/connection-service")
    public Mono<Map<String, String>> connectionServiceFallback() {
        return Mono.just(Map.of(
                "status", "SERVICE_UNAVAILABLE",
                "message", "Connection Service is currently unavailable. Please try again later."
        ));
    }

    @GetMapping("/notification-service")
    public Mono<Map<String, String>> notificationServiceFallback() {
        return Mono.just(Map.of(
                "status", "SERVICE_UNAVAILABLE",
                "message", "Notification Service is currently unavailable. Please try again later."
        ));
    }
}


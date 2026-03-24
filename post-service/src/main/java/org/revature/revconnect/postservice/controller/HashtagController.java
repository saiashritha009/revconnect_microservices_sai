package org.revature.revconnect.postservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.postservice.model.Hashtag;
import org.revature.revconnect.postservice.repository.HashtagRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hashtags")
@RequiredArgsConstructor
@Slf4j
public class HashtagController {

    private final HashtagRepository hashtagRepository;

    @GetMapping("/trending")
    public ResponseEntity<List<Map<String, Object>>> getTrendingHashtags(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Getting top {} trending hashtags", limit);
        List<Map<String, Object>> tags = hashtagRepository.findByNameContainingIgnoreCase("")
                .stream().sorted((a, b) -> b.getPostCount() - a.getPostCount())
                .limit(limit).map(this::toHashtagMap).toList();
        return ResponseEntity.ok(tags);
    }

    @GetMapping("/{hashtag}")
    public ResponseEntity<Map<String, Object>> getHashtag(@PathVariable String hashtag) {
        log.info("Getting hashtag details: {}", hashtag);
        return hashtagRepository.findByName(hashtag)
                .map(h -> ResponseEntity.ok(toHashtagMap(h)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{hashtag}/posts")
    public ResponseEntity<List<Map<String, Object>>> getPostsByHashtag(
            @PathVariable String hashtag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Getting posts for hashtag: {}", hashtag);
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/{hashtag}/follow")
    public ResponseEntity<Map<String, String>> followHashtag(@PathVariable String hashtag) {
        log.info("Following hashtag: {}", hashtag);
        return ResponseEntity.ok(Map.of("message", "Hashtag followed"));
    }

    @DeleteMapping("/{hashtag}/follow")
    public ResponseEntity<Map<String, String>> unfollowHashtag(@PathVariable String hashtag) {
        log.info("Unfollowing hashtag: {}", hashtag);
        return ResponseEntity.ok(Map.of("message", "Hashtag unfollowed"));
    }

    @GetMapping("/following")
    public ResponseEntity<List<Map<String, Object>>> getFollowedHashtags() {
        log.info("Getting followed hashtags");
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/suggested")
    public ResponseEntity<List<Map<String, Object>>> getSuggestedHashtags() {
        log.info("Getting suggested hashtags");
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchHashtags(@RequestParam String query) {
        log.info("Searching hashtags: {}", query);
        List<Map<String, Object>> tags = hashtagRepository.findByNameContainingIgnoreCase(query)
                .stream().map(this::toHashtagMap).toList();
        return ResponseEntity.ok(tags);
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<List<String>> autocompleteHashtags(@RequestParam String prefix) {
        log.info("Autocomplete hashtags: {}", prefix);
        List<String> tags = hashtagRepository.findByNameContainingIgnoreCase(prefix)
                .stream().map(Hashtag::getName).toList();
        return ResponseEntity.ok(tags);
    }

    @GetMapping("/{hashtag}/related")
    public ResponseEntity<List<Map<String, Object>>> getRelatedHashtags(@PathVariable String hashtag) {
        log.info("Getting related hashtags for: {}", hashtag);
        return ResponseEntity.ok(List.of());
    }

    private Map<String, Object> toHashtagMap(Hashtag hashtag) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", hashtag.getId());
        map.put("tag", hashtag.getName());
        map.put("usageCount", hashtag.getPostCount());
        return map;
    }
}

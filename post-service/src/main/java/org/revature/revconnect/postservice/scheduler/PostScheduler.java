package org.revature.revconnect.postservice.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.revature.revconnect.postservice.model.Post;
import org.revature.revconnect.postservice.repository.PostRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostScheduler {

    private final PostRepository postRepository;

    @Scheduled(fixedRate = 15000) // Check every 15 seconds
    @Transactional
    public void publishScheduledPosts() {
        List<Post> readyPosts = postRepository.findScheduledPostsReady(LocalDateTime.now());
        if (!readyPosts.isEmpty()) {
            log.info("Publishing {} scheduled posts", readyPosts.size());
            for (Post post : readyPosts) {
                post.setIsPublished(true);
                postRepository.save(post);
                log.info("Published scheduled post ID: {} for user: {}", post.getId(), post.getUserId());
            }
        }
    }
}

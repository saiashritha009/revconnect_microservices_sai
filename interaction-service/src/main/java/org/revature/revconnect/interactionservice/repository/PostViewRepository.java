package org.revature.revconnect.interactionservice.repository;

import org.revature.revconnect.interactionservice.model.PostView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostViewRepository extends JpaRepository<PostView, Long> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    long countByPostId(Long postId);
    long countByPostIdIn(List<Long> postIds);
}

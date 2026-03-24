package org.revature.revconnect.interactionservice.repository;

import org.revature.revconnect.interactionservice.model.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserIdAndPostId(Long userId, Long postId);
    List<Like> findByPostId(Long postId);
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    long countByPostId(Long postId);
    long countByUserId(Long userId);
    List<Like> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByPostIdIn(List<Long> postIds);
}

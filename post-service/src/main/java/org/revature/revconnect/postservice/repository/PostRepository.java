package org.revature.revconnect.postservice.repository;

import org.revature.revconnect.postservice.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Post> findByUserIdInAndIsPublishedTrueOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.isPublished = true ORDER BY p.likeCount DESC, p.createdAt DESC")
    Page<Post> findTrendingPosts(Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.content LIKE %:query% AND p.isPublished = true")
    Page<Post> searchPosts(@Param("query") String query, Pageable pageable);

    List<Post> findByUserIdAndPinnedTrue(Long userId);

    @Query("SELECT p FROM Post p WHERE p.isPublished = false AND p.scheduledAt <= :now")
    List<Post> findScheduledPostsReady(@Param("now") LocalDateTime now);

    @Query("SELECT p FROM Post p WHERE p.userId = :userId AND p.isPublished = false AND p.scheduledAt IS NOT NULL ORDER BY p.scheduledAt ASC")
    List<Post> findScheduledPostsByUserId(@Param("userId") Long userId);

    Page<Post> findByIsPublishedTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByUserIdAndIsPublishedTrueOrderByCreatedAtDesc(Long userId, Pageable pageable);
}

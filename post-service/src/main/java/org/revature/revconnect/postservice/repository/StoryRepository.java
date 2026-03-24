package org.revature.revconnect.postservice.repository;

import org.revature.revconnect.postservice.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByUserIdAndExpiresAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime now);

    @Query("SELECT s FROM Story s WHERE s.userId IN :userIds AND s.expiresAt > :now ORDER BY s.createdAt DESC")
    List<Story> findActiveStoriesByUserIds(@Param("userIds") List<Long> userIds, @Param("now") LocalDateTime now);

    List<Story> findByUserIdAndIsHighlightTrue(Long userId);

    List<Story> findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime now);

    List<Story> findByUserIdAndExpiresAtBeforeOrderByCreatedAtDesc(Long userId, LocalDateTime now);
}

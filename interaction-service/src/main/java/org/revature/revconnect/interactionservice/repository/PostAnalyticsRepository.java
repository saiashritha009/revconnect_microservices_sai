package org.revature.revconnect.interactionservice.repository;

import org.revature.revconnect.interactionservice.model.PostAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PostAnalyticsRepository extends JpaRepository<PostAnalytics, Long> {
    Optional<PostAnalytics> findByPostId(Long postId);
}

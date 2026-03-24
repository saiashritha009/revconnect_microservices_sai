package org.revature.revconnect.interactionservice.repository;

import org.revature.revconnect.interactionservice.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShareRepository extends JpaRepository<Share, Long> {
    List<Share> findByPostId(Long postId);
    long countByPostId(Long postId);
    long countByUserId(Long userId);
    long countByPostIdIn(java.util.List<Long> postIds);
}

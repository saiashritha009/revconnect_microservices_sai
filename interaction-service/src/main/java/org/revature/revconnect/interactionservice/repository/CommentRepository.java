package org.revature.revconnect.interactionservice.repository;

import org.revature.revconnect.interactionservice.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByPostIdOrderByCreatedAtDesc(Long postId, Pageable pageable);
    Page<Comment> findByParentCommentIdOrderByCreatedAtDesc(Long parentCommentId, Pageable pageable);
    long countByPostId(Long postId);
    long countByUserId(Long userId);
    long countByPostIdIn(java.util.List<Long> postIds);
}

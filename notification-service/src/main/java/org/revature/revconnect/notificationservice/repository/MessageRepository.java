package org.revature.revconnect.notificationservice.repository;

import org.revature.revconnect.notificationservice.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
           "((m.senderId = :userId AND m.receiverId = :otherUserId) OR " +
           "(m.senderId = :otherUserId AND m.receiverId = :userId)) " +
           "AND m.deleted = false ORDER BY m.timestamp DESC")
    Page<Message> findConversation(@Param("userId") Long userId,
                                   @Param("otherUserId") Long otherUserId,
                                   Pageable pageable);

    @Query("SELECT DISTINCT CASE WHEN m.senderId = :userId THEN m.receiverId ELSE m.senderId END " +
           "FROM Message m WHERE (m.senderId = :userId OR m.receiverId = :userId) AND m.deleted = false")
    List<Long> findConversationPartnerIds(@Param("userId") Long userId);

    long countByReceiverIdAndSenderIdAndReadFalse(Long receiverId, Long senderId);

    long countByReceiverIdAndReadFalse(Long receiverId);

    @Modifying @Transactional
    @Query("UPDATE Message m SET m.read = true WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.read = false")
    void markAllAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    @Modifying @Transactional
    void deleteBySenderIdAndReceiverId(Long senderId, Long receiverId);

    Page<Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
            Long senderId, Long receiverId, Long receiverId2, Long senderId2, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.content LIKE %:query% AND (m.senderId = :userId OR m.receiverId = :userId)")
    List<Message> findByContentContainingIgnoreCaseAndSenderIdOrReceiverId(
            @Param("query") String query, @Param("userId") Long userId);
}

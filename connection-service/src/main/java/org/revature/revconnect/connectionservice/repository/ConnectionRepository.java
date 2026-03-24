package org.revature.revconnect.connectionservice.repository;

import org.revature.revconnect.connectionservice.enums.ConnectionStatus;
import org.revature.revconnect.connectionservice.model.Connection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    Optional<Connection> findByFollowerIdAndFollowingId(Long followerId, Long followingId);
    boolean existsByFollowerIdAndFollowingIdAndStatus(Long followerId, Long followingId, ConnectionStatus status);

    Page<Connection> findByFollowingIdAndStatus(Long followingId, ConnectionStatus status, Pageable pageable);
    Page<Connection> findByFollowerIdAndStatus(Long followerId, ConnectionStatus status, Pageable pageable);
    Page<Connection> findByFollowingIdAndStatusIn(Long followingId, List<ConnectionStatus> statuses, Pageable pageable);

    @Query("SELECT c.followingId FROM Connection c WHERE c.followerId = :userId AND c.status = 'ACCEPTED'")
    List<Long> findFollowingIdsByFollowerId(@Param("userId") Long userId);

    @Query("SELECT c.followerId FROM Connection c WHERE c.followingId = :userId AND c.status = 'ACCEPTED'")
    List<Long> findFollowerIdsByFollowingId(@Param("userId") Long userId);

    long countByFollowingIdAndStatus(Long followingId, ConnectionStatus status);
    long countByFollowerIdAndStatus(Long followerId, ConnectionStatus status);
}

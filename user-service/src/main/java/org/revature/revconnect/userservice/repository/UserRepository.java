package org.revature.revconnect.userservice.repository;

import org.revature.revconnect.userservice.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.emailVerified = true AND u.privacy <> org.revature.revconnect.userservice.enums.Privacy.PRIVATE AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<User> searchUsers(@Param("query") String query, Pageable pageable);

    List<User> findByIdIn(List<Long> ids);

    @Query("SELECT u FROM User u WHERE u.id <> :userId AND u.emailVerified = true AND u.privacy <> org.revature.revconnect.userservice.enums.Privacy.PRIVATE")
    Page<User> findSuggestions(@Param("userId") Long userId, Pageable pageable);

    Optional<User> findByVerificationCode(String verificationCode);
}

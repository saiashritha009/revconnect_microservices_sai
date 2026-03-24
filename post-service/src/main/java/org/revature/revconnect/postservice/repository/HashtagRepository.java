package org.revature.revconnect.postservice.repository;

import org.revature.revconnect.postservice.model.Hashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HashtagRepository extends JpaRepository<Hashtag, Long> {
    Optional<Hashtag> findByName(String name);
    Page<Hashtag> findByNameContainingIgnoreCase(String query, Pageable pageable);
    List<Hashtag> findByNameContainingIgnoreCase(String query);
    Page<Hashtag> findAllByOrderByPostCountDesc(Pageable pageable);
}

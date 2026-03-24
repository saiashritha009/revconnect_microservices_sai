package org.revature.revconnect.connectionservice.model;

import org.revature.revconnect.connectionservice.enums.ConnectionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "connections", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"follower_id", "following_id"})
}, indexes = {
        @Index(name = "idx_connection_follower", columnList = "follower_id"),
        @Index(name = "idx_connection_following", columnList = "following_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Connection {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_id", nullable = false)
    private Long followerId;

    @Column(name = "following_id", nullable = false)
    private Long followingId;

    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private ConnectionStatus status = ConnectionStatus.PENDING;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;
}

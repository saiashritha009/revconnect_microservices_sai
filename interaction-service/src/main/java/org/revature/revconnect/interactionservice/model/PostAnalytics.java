package org.revature.revconnect.interactionservice.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_analytics")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostAnalytics {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false, unique = true)
    private Long postId;

    @Builder.Default private Integer viewCount = 0;
    @Builder.Default private Integer uniqueViewCount = 0;
    @Builder.Default private Integer likeCount = 0;
    @Builder.Default private Integer commentCount = 0;
    @Builder.Default private Integer shareCount = 0;
    @Builder.Default private Integer bookmarkCount = 0;
    @Builder.Default private Double engagementRate = 0.0;
    @Builder.Default private Integer reachCount = 0;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;
}

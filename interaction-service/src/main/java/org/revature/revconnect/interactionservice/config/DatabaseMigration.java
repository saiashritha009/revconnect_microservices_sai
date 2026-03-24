package org.revature.revconnect.interactionservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        dropPostViewsUniqueConstraint();
    }

    private void dropPostViewsUniqueConstraint() {
        try {
            List<Map<String, Object>> constraints = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_views' AND CONSTRAINT_TYPE = 'UNIQUE'");

            for (Map<String, Object> row : constraints) {
                String constraintName = (String) row.get("CONSTRAINT_NAME");
                log.info("Dropping unique constraint '{}' from post_views", constraintName);
                jdbcTemplate.execute("ALTER TABLE post_views DROP INDEX `" + constraintName + "`");
            }
        } catch (Exception e) {
            log.warn("Could not drop post_views unique constraint (may already be removed): {}", e.getMessage());
        }
    }
}

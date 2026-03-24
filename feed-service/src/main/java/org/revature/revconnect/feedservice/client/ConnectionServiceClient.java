package org.revature.revconnect.feedservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "connection-service")
public interface ConnectionServiceClient {

    @GetMapping("/api/connections/{userId}/following-ids")
    List<Long> getFollowingIds(@PathVariable Long userId);
}

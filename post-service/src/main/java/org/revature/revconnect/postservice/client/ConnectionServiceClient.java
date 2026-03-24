package org.revature.revconnect.postservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "connection-service")
public interface ConnectionServiceClient {

    @GetMapping("/api/connections/{userId}/following-ids")
    List<Long> getFollowingIds(@PathVariable("userId") Long userId);
}

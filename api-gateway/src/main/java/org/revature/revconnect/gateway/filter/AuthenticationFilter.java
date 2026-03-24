package org.revature.revconnect.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;

@Component
@Slf4j
public class AuthenticationFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret:RevConnectSecretKeyForJWTTokenGenerationMustBeAtLeast256BitsLong2024}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        if (request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    Claims claims = Jwts.parser()
                            .verifyWith(getSigningKey())
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();

                    log.debug("Token claims: {}", claims);
                    Object userIdObj = claims.get("userId");
                    if (userIdObj != null) {
                        String userIdStr = userIdObj.toString();
                        request = request.mutate()
                                .header("X-User-Id", userIdStr)
                                .build();
                        return chain.filter(exchange.mutate().request(request).build());
                    } else {
                        System.out.println("UserId claim missing in token");
                    }
                } catch (Exception e) {
                    System.err.println("Token validation failed: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
        return chain.filter(exchange);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    @Override
    public int getOrder() {
        return -1;
    }
}

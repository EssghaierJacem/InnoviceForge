package com.invoiceforge.api_gateway.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class TenantPropagationFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .cast(JwtAuthenticationToken.class)
                .map(JwtAuthenticationToken::getToken)
                // mapNotNull, not map: a self-registered user's JWT has no
                // tenant_id claim (see TenantController), and Mono.map()
                // throws on a null return — that used to 500 every request
                // from such a user, including the provisioning call meant
                // to fix that exact case.
                .mapNotNull(jwt -> jwt.getClaimAsString("tenant_id"))
                .filter(tenantId -> !tenantId.isBlank())
                .map(tenantId -> exchange.mutate()
                        .request(r -> r.header("X-Tenant-Id", tenantId))
                        .build())
                .defaultIfEmpty(exchange)
                .flatMap(chain::filter);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
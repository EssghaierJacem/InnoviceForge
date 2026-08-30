package com.invoiceforge.analytics_service.controller;

import com.invoiceforge.analytics_service.dto.PageResponse;
import com.invoiceforge.analytics_service.dto.PublicExtractionResultDTO;
import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import com.invoiceforge.analytics_service.repository.ExtractedInvoiceRepository;
import com.invoiceforge.analytics_service.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ExtractedInvoiceController {

    private static final String ANONYMOUS_TENANT_PREFIX = "anon:";
    private static final int MAX_PAGE_SIZE = 100;

    private final ExtractedInvoiceRepository extractedInvoiceRepository;
    private final ExportService exportService;

    @GetMapping("/api/v1/reports/invoices")
    public PageResponse<ExtractedInvoice> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.from(extractedInvoiceRepository.findByTenantIdOrderByCreatedAtDesc(
                jwt.getClaimAsString("tenant_id"), pageRequest));
    }

    @GetMapping("/api/v1/reports/invoices/{id}")
    public ResponseEntity<ExtractedInvoice> getById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return extractedInvoiceRepository.findByIdAndTenantId(id, jwt.getClaimAsString("tenant_id"))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Keyed by the ingestion-service Invoice id (what POST /api/v1/invoices
     * returns), not this service's own ExtractedInvoice.id — that's the only
     * id the frontend has right after upload, before extraction exists at
     * all. Used to poll for a result post-upload; getById above is for
     * looking up an already-listed invoice by its analytics-service id.
     */
    @GetMapping("/api/v1/reports/invoices/by-invoice/{invoiceId}")
    public ResponseEntity<ExtractedInvoice> getByInvoiceId(@PathVariable UUID invoiceId, @AuthenticationPrincipal Jwt jwt) {
        return extractedInvoiceRepository.findByInvoiceIdAndTenantId(invoiceId, jwt.getClaimAsString("tenant_id"))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/api/v1/public/reports/invoices/{invoiceId}")
    public ResponseEntity<PublicExtractionResultDTO> getPublicResult(@PathVariable UUID invoiceId) {
        return extractedInvoiceRepository.findByInvoiceId(invoiceId)
                .filter(this::belongsToAnonymousTenant)
                .map(PublicExtractionResultDTO::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private boolean belongsToAnonymousTenant(ExtractedInvoice invoice) {
        return invoice.getTenantId() != null && invoice.getTenantId().startsWith(ANONYMOUS_TENANT_PREFIX);
    }

    @GetMapping("/api/v1/reports/invoices/export/csv")
    public ResponseEntity<StreamingResponseBody> exportCsv(@AuthenticationPrincipal Jwt jwt) {
        List<ExtractedInvoice> invoices = extractedInvoiceRepository.findByTenantId(jwt.getClaimAsString("tenant_id"));
        StreamingResponseBody body = out -> exportService.writeCsv(invoices, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoices.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }

    @GetMapping("/api/v1/reports/invoices/export/xlsx")
    public ResponseEntity<StreamingResponseBody> exportXlsx(@AuthenticationPrincipal Jwt jwt) {
        List<ExtractedInvoice> invoices = extractedInvoiceRepository.findByTenantId(jwt.getClaimAsString("tenant_id"));
        StreamingResponseBody body = out -> exportService.writeXlsx(invoices, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoices.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(body);
    }
}

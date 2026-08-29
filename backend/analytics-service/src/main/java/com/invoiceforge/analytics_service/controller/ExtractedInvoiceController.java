package com.invoiceforge.analytics_service.controller;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import com.invoiceforge.analytics_service.repository.ExtractedInvoiceRepository;
import com.invoiceforge.analytics_service.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports/invoices")
@RequiredArgsConstructor
public class ExtractedInvoiceController {

    private final ExtractedInvoiceRepository extractedInvoiceRepository;
    private final ExportService exportService;

    @GetMapping
    public List<ExtractedInvoice> list(@AuthenticationPrincipal Jwt jwt) {
        return extractedInvoiceRepository.findByTenantId(jwt.getClaimAsString("tenant_id"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExtractedInvoice> getById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return extractedInvoiceRepository.findByIdAndTenantId(id, jwt.getClaimAsString("tenant_id"))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/export/csv")
    public ResponseEntity<StreamingResponseBody> exportCsv(@AuthenticationPrincipal Jwt jwt) {
        List<ExtractedInvoice> invoices = extractedInvoiceRepository.findByTenantId(jwt.getClaimAsString("tenant_id"));
        StreamingResponseBody body = out -> exportService.writeCsv(invoices, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoices.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }

    @GetMapping("/export/xlsx")
    public ResponseEntity<StreamingResponseBody> exportXlsx(@AuthenticationPrincipal Jwt jwt) {
        List<ExtractedInvoice> invoices = extractedInvoiceRepository.findByTenantId(jwt.getClaimAsString("tenant_id"));
        StreamingResponseBody body = out -> exportService.writeXlsx(invoices, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoices.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(body);
    }
}

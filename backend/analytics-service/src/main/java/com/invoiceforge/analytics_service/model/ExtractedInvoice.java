package com.invoiceforge.analytics_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "extracted_invoices")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExtractedInvoice {

    @Id
    private UUID id;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "vendor_name", length = 255)
    private String vendorName;

    @Column(name = "contact_name", length = 255)
    private String contactName;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "po_number", length = 100)
    private String poNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "currency", columnDefinition = "bpchar")
    private String currency;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "payment_terms", length = 100)
    private String paymentTerms;

    @Column(name = "payment_method", length = 100)
    private String paymentMethod;

    @Column(name = "category", length = 50)
    private String category;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "line_items", columnDefinition = "jsonb")
    private String lineItems;

    @Column(name = "confidence_score", precision = 3, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "reviewed_by_user")
    private boolean reviewedByUser;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public ExtractedInvoice(UUID id, UUID invoiceId, String tenantId, String vendorName, String contactName,
                             String invoiceNumber, String poNumber, LocalDate issueDate, LocalDate dueDate,
                             String currency, BigDecimal totalAmount, BigDecimal subtotal, BigDecimal taxAmount,
                             String paymentTerms, String paymentMethod, String category, String lineItems,
                             BigDecimal confidenceScore, String status) {
        this.id = id;
        this.invoiceId = invoiceId;
        this.tenantId = tenantId;
        this.vendorName = vendorName;
        this.contactName = contactName;
        this.invoiceNumber = invoiceNumber;
        this.poNumber = poNumber;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.currency = currency;
        this.totalAmount = totalAmount;
        this.subtotal = subtotal;
        this.taxAmount = taxAmount;
        this.paymentTerms = paymentTerms;
        this.paymentMethod = paymentMethod;
        this.category = category;
        this.lineItems = lineItems;
        this.confidenceScore = confidenceScore;
        this.status = status;
        this.reviewedByUser = false;
    }
}

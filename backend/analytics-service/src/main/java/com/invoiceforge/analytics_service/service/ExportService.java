package com.invoiceforge.analytics_service.service;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class ExportService {

    private static final String[] HEADERS = {
            "vendor_name", "contact_name", "invoice_number", "po_number", "issue_date", "due_date",
            "currency", "total_amount", "subtotal", "tax_amount", "payment_terms", "payment_method",
            "category", "confidence_score", "status", "created_at"
    };

    private static final int ROW_ACCESS_WINDOW_SIZE = 100;

    public void writeCsv(List<ExtractedInvoice> invoices, OutputStream out) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder().setHeader(HEADERS).build();
        try (CSVPrinter printer = new CSVPrinter(new java.io.OutputStreamWriter(out), format)) {
            for (ExtractedInvoice invoice : invoices) {
                printer.printRecord(toCsvRowValues(invoice));
            }
        }
    }

    public void writeXlsx(List<ExtractedInvoice> invoices, OutputStream out) throws IOException {
        SXSSFWorkbook workbook = new SXSSFWorkbook(ROW_ACCESS_WINDOW_SIZE);
        try {
            CreationHelper creationHelper = workbook.getCreationHelper();
            CellStyle dateStyle = dateCellStyle(workbook, creationHelper, "yyyy-mm-dd");
            CellStyle dateTimeStyle = dateCellStyle(workbook, creationHelper, "yyyy-mm-dd hh:mm:ss");

            Sheet sheet = workbook.createSheet("Invoices");
            writeHeaderRow(sheet);
            writeDataRows(sheet, invoices, dateStyle, dateTimeStyle);
            workbook.write(out);
        } finally {
            workbook.dispose();
        }
    }

    private CellStyle dateCellStyle(SXSSFWorkbook workbook, CreationHelper creationHelper, String pattern) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(creationHelper.createDataFormat().getFormat(pattern));
        return style;
    }

    private void writeHeaderRow(Sheet sheet) {
        Row header = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            header.createCell(i).setCellValue(HEADERS[i]);
        }
    }

    private void writeDataRows(Sheet sheet, List<ExtractedInvoice> invoices, CellStyle dateStyle, CellStyle dateTimeStyle) {
        int rowIndex = 1;
        for (ExtractedInvoice invoice : invoices) {
            writeDataRow(sheet.createRow(rowIndex++), invoice, dateStyle, dateTimeStyle);
        }
    }

    private void writeDataRow(Row row, ExtractedInvoice invoice, CellStyle dateStyle, CellStyle dateTimeStyle) {
        setStringCell(row, 0, invoice.getVendorName());
        setStringCell(row, 1, invoice.getContactName());
        setStringCell(row, 2, invoice.getInvoiceNumber());
        setStringCell(row, 3, invoice.getPoNumber());
        setDateCell(row, 4, invoice.getIssueDate(), dateStyle);
        setDateCell(row, 5, invoice.getDueDate(), dateStyle);
        setStringCell(row, 6, invoice.getCurrency());
        setNumericCell(row, 7, invoice.getTotalAmount());
        setNumericCell(row, 8, invoice.getSubtotal());
        setNumericCell(row, 9, invoice.getTaxAmount());
        setStringCell(row, 10, invoice.getPaymentTerms());
        setStringCell(row, 11, invoice.getPaymentMethod());
        setStringCell(row, 12, invoice.getCategory());
        setNumericCell(row, 13, invoice.getConfidenceScore());
        setStringCell(row, 14, invoice.getStatus());
        setDateTimeCell(row, 15, invoice.getCreatedAt(), dateTimeStyle);
    }

    private void setStringCell(Row row, int column, String value) {
        if (value != null) {
            row.createCell(column).setCellValue(value);
        }
    }

    private void setNumericCell(Row row, int column, BigDecimal value) {
        if (value != null) {
            row.createCell(column).setCellValue(value.doubleValue());
        }
    }

    private void setDateCell(Row row, int column, LocalDate value, CellStyle style) {
        if (value == null) {
            return;
        }
        Cell cell = row.createCell(column);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void setDateTimeCell(Row row, int column, java.time.Instant value, CellStyle style) {
        if (value == null) {
            return;
        }
        Cell cell = row.createCell(column);
        cell.setCellValue(LocalDateTime.ofInstant(value, ZoneOffset.UTC));
        cell.setCellStyle(style);
    }

    private Object[] toCsvRowValues(ExtractedInvoice invoice) {
        return new Object[]{
                invoice.getVendorName(),
                invoice.getContactName(),
                invoice.getInvoiceNumber(),
                invoice.getPoNumber(),
                invoice.getIssueDate(),
                invoice.getDueDate(),
                invoice.getCurrency(),
                invoice.getTotalAmount(),
                invoice.getSubtotal(),
                invoice.getTaxAmount(),
                invoice.getPaymentTerms(),
                invoice.getPaymentMethod(),
                invoice.getCategory(),
                invoice.getConfidenceScore(),
                invoice.getStatus(),
                invoice.getCreatedAt()
        };
    }
}

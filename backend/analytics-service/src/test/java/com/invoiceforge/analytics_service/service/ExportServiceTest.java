package com.invoiceforge.analytics_service.service;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises both writers against a real invoice-shaped row and reads the
 * output back — a CSV/XLSX export that merely "doesn't throw" isn't
 * actually verified until something parses the bytes it produced and
 * checks the values survived the round trip.
 */
class ExportServiceTest {

    private final ExportService exportService = new ExportService();

    @Test
    void csvExportRoundTripsHeaderAndValues() throws IOException {
        ExtractedInvoice invoice = sampleInvoice();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        exportService.writeCsv(List.of(invoice), out);

        CSVParser parser = CSVParser.parse(
                new StringReader(out.toString()),
                CSVFormat.DEFAULT.builder().setHeader().build()
        );
        List<CSVRecord> records = parser.getRecords();

        assertThat(records).hasSize(1);
        CSVRecord row = records.getFirst();
        assertThat(row.get("vendor_name")).isEqualTo("Acme Co");
        assertThat(row.get("invoice_number")).isEqualTo("INV-42");
        assertThat(row.get("total_amount")).isEqualTo("150.00");
        assertThat(row.get("status")).isEqualTo("EXTRACTED");
    }

    @Test
    void csvExportLeavesNullFieldsBlankRatherThanWritingTheWordNull() throws IOException {
        ExtractedInvoice sparse = new ExtractedInvoice(
                UUID.randomUUID(), UUID.randomUUID(), "tenant-a", null, null, null, null, null, null,
                null, null, null, null, null, null, null, "[]", null, "FAILED"
        );
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        exportService.writeCsv(List.of(sparse), out);

        CSVParser parser = CSVParser.parse(
                new StringReader(out.toString()),
                CSVFormat.DEFAULT.builder().setHeader().build()
        );
        CSVRecord row = parser.getRecords().getFirst();
        assertThat(row.get("vendor_name")).isEmpty();
        assertThat(row.get("status")).isEqualTo("FAILED");
    }

    @Test
    void xlsxExportProducesAReadableWorkbookWithTheRightValues() throws IOException {
        ExtractedInvoice invoice = sampleInvoice();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        exportService.writeXlsx(List.of(invoice), out);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(out.toByteArray()))) {
            Sheet sheet = workbook.getSheet("Invoices");
            assertThat(sheet).isNotNull();
            Row header = sheet.getRow(0);
            assertThat(header.getCell(0).getStringCellValue()).isEqualTo("vendor_name");

            Row dataRow = sheet.getRow(1);
            assertThat(dataRow.getCell(0).getStringCellValue()).isEqualTo("Acme Co");
            assertThat(dataRow.getCell(7).getNumericCellValue()).isEqualTo(150.00);
        }
    }

    private ExtractedInvoice sampleInvoice() {
        return new ExtractedInvoice(
                UUID.randomUUID(), UUID.randomUUID(), "tenant-a",
                "Acme Co", "Jane Doe", "INV-42", "PO-7",
                LocalDate.of(2026, 1, 15), LocalDate.of(2026, 2, 15),
                "USD", new BigDecimal("150.00"), new BigDecimal("140.00"), new BigDecimal("10.00"),
                "Net 30", "Bank transfer", "Software", "[]",
                new BigDecimal("0.95"), "EXTRACTED"
        );
    }
}

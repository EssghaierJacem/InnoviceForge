package com.invoiceforge.ingestion_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnsupportedFileTypeException.class)
    public ResponseEntity<Map<String, String>> handleUnsupportedFileType(UnsupportedFileTypeException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(SizeCapExceededException.class)
    public ResponseEntity<Map<String, String>> handleSizeCapExceeded(SizeCapExceededException ex) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(QuotaExceededException.class)
    public ResponseEntity<Map<String, String>> handleQuotaExceeded(QuotaExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", ex.getMessage()));
    }
}

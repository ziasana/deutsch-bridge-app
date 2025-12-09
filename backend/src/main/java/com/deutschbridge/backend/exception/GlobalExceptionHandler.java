package com.deutschbridge.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(DataNotFoundException.class)
        public ResponseEntity<ResponseException> handleDataNotFoundException(DataNotFoundException e){
            ResponseException responseException = new ResponseException(
                    e.getMessage(),
                    HttpStatus.NOT_FOUND.value()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseException);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ResponseException> handleException(Exception e){
            ResponseException responseException = new ResponseException(
                    e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseException);
        }

}

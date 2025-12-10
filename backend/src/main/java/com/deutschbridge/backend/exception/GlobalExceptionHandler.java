package com.deutschbridge.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

        @ResponseStatus(HttpStatus.NOT_FOUND)
        @ExceptionHandler(DataNotFoundException.class)
        public ResponseEntity<ResponseException> handleDataNotFoundException(DataNotFoundException e){
            ResponseException responseException = new ResponseException(
                    e.getMessage(),
                    HttpStatus.NOT_FOUND.value()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseException);
        }

        @ResponseStatus(HttpStatus.BAD_REQUEST)
        @ExceptionHandler(UserVerificationException.class)
        public ResponseEntity<ResponseException> handleUserVerificationException(UserVerificationException e){
            ResponseException responseException = new ResponseException(
                    e.getMessage(),
                    HttpStatus.BAD_REQUEST.value()
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseException);
        }

        @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ResponseException> handleException(Exception e){
            ResponseException responseException = new ResponseException(
                    e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseException);
        }

}

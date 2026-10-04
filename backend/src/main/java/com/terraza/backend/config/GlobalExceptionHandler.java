package com.terraza.backend.config;

import com.terraza.backend.dto.ApiError;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.service.AuditoriaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.TypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private final AuditoriaService auditoriaService;

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(BusinessException ex, WebRequest request) {
        if (ex.getStatus().is5xxServerError()) {
            log.error("Error de negocio", ex);
        } else {
            log.warn("Solicitud rechazada: {}", ex.getMessage());
        }
        return ResponseEntity.status(ex.getStatus()).body(apiError(ex.getStatus(), ex.getMessage(), request, null));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabled(DisabledException ex, WebRequest request) {
        log.warn("Intento de acceso de un usuario inactivo");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(apiError(HttpStatus.UNAUTHORIZED, "Usuario inactivo", request, null));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiError> handleLocked(LockedException ex, WebRequest request) {
        log.warn("Intento de acceso con cuenta bloqueada");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(apiError(HttpStatus.UNAUTHORIZED, "Cuenta bloqueada temporalmente", request, null));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, WebRequest request) {
        log.warn("Autenticación rechazada");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(apiError(HttpStatus.UNAUTHORIZED, "Credenciales inválidas", request, null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        auditar("ACCESO_DENEGADO", "Acceso denegado");
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(apiError(HttpStatus.FORBIDDEN, "No tiene permisos para esta operación", request, null));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException ex, WebRequest request) {
        log.warn("Conflicto de integridad: {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiError(
                HttpStatus.CONFLICT,
                "El registro entra en conflicto con datos existentes",
                request,
                null));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiError> handleDataAccess(DataAccessException ex, WebRequest request) {
        log.error("Error de acceso a datos", ex);
        auditar("ERROR_INESPERADO", "Error al acceder a los datos");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(apiError(HttpStatus.INTERNAL_SERVER_ERROR, "Error al acceder a los datos", request, null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, WebRequest request) {
        log.error("Error no controlado", ex);
        auditar("ERROR_INESPERADO", "Error interno del servidor");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(apiError(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor", request, null));
    }

    private void auditar(String operacion, String detalle) {
        try {
            auditoriaService.registrar(operacion, detalle);
        } catch (RuntimeException ex) {
            log.error("No se pudo registrar la auditoría", ex);
        }
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(apiError(HttpStatus.BAD_REQUEST, "Datos inválidos", request, errors));
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        return ResponseEntity.badRequest()
                .body(apiError(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud no es válido", request, null));
    }

    @Override
    protected ResponseEntity<Object> handleMissingServletRequestParameter(
            MissingServletRequestParameterException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        String message = "sedeId".equals(ex.getParameterName())
                ? "El parámetro sedeId es obligatorio"
                : "Falta el parámetro " + ex.getParameterName();
        return ResponseEntity.badRequest().body(apiError(HttpStatus.BAD_REQUEST, message, request, null));
    }

    @Override
    protected ResponseEntity<Object> handleTypeMismatch(
            TypeMismatchException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        return ResponseEntity.badRequest()
                .body(apiError(HttpStatus.BAD_REQUEST, "Un parámetro tiene un formato inválido", request, null));
    }

    private ApiError apiError(HttpStatus status, String message, WebRequest request, Map<String, String> errors) {
        return ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(path(request))
                .errors(errors)
                .build();
    }

    private String path(WebRequest request) {
        if (request instanceof ServletWebRequest servletRequest) {
            return servletRequest.getRequest().getRequestURI();
        }
        return "";
    }
}

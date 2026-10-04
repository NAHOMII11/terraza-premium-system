package com.terraza.backend.service;

import com.terraza.backend.dto.LoginRequest;
import com.terraza.backend.dto.MessageResponse;
import com.terraza.backend.dto.UsuarioDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.security.UsuarioPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AuditoriaService auditoriaService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public UsuarioDTO login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        if (authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            principal.getUsuario().setPassword(null);
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true);
        httpRequest.changeSessionId();
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        UsuarioPrincipal principal = (UsuarioPrincipal) authentication.getPrincipal();
        log.info("Sesión iniciada para {}", email);
        return UsuarioDTO.from(principal.getUsuario());
    }

    public MessageResponse logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Autenticación requerida");
        }

        auditoriaService.registrar(
                "CIERRE_SESION",
                "usuarios",
                principal.getUsuario().getId(),
                "Cierre de sesión de " + principal.getUsuario().getRolNombre());
        log.info("Sesión cerrada para el usuario {}", principal.getUsuario().getId());

        SecurityContextHolder.clearContext();
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return new MessageResponse("Sesión cerrada correctamente");
    }
}

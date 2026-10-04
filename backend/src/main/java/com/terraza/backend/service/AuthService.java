package com.terraza.backend.service;

import com.terraza.backend.dto.LoginRequest;
import com.terraza.backend.dto.MessageResponse;
import com.terraza.backend.dto.UsuarioDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Usuario;
import com.terraza.backend.repository.UsuarioRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public UsuarioDTO login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        Optional<Usuario> existente = usuarioRepository.findByEmail(email);

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (BadCredentialsException ex) {
            auditoriaService.registrar(
                    existente.map(Usuario::getId).orElse(null),
                    existente.map(Usuario::getSedeId).orElse(null),
                    "LOGIN_FALLIDO",
                    "Credenciales inválidas");
            throw ex;
        } catch (AuthenticationException ex) {
            auditoriaService.registrar(
                    existente.map(Usuario::getId).orElse(null),
                    existente.map(Usuario::getSedeId).orElse(null),
                    "LOGIN_FALLIDO",
                    "Autenticación rechazada");
            throw ex;
        }

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
        auditoriaService.registrar("INICIO_SESION", "Inicio de sesión correcto");
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

package com.terraza.backend.controller;

import com.terraza.backend.dto.LoginRequest;
import com.terraza.backend.dto.MessageResponse;
import com.terraza.backend.dto.UsuarioDTO;
import com.terraza.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public UsuarioDTO login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    @PostMapping("/logout")
    public MessageResponse logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return authService.logout(httpRequest, httpResponse);
    }
}

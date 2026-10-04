package com.terraza.backend.service;

import com.terraza.backend.dto.UsuarioDTO;
import com.terraza.backend.dto.UsuarioRequest;
import com.terraza.backend.dto.UsuarioUpdateRequest;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Usuario;
import com.terraza.backend.repository.SedeRepository;
import com.terraza.backend.repository.UsuarioRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SedeRepository sedeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public List<UsuarioDTO> listarActivos() {
        return usuarioRepository.findActivos().stream().map(UsuarioDTO::from).toList();
    }

    @Transactional
    public UsuarioDTO crear(UsuarioRequest request) {
        String nombre = request.getNombre().trim();
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        validarRolYSede(request.getRolId(), request.getSedeId());
        if (usuarioRepository.existeEmail(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email");
        }

        Long id = usuarioRepository.insertar(
                nombre,
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getRolId(),
                request.getSedeId());
        auditoriaService.registrar("CREAR_USUARIO", "Usuario creado: " + email);
        return obtener(id);
    }

    @Transactional
    public UsuarioDTO actualizar(Long id, UsuarioUpdateRequest request) {
        if (usuarioRepository.findById(id).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        String nombre = request.getNombre().trim();
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        validarRolYSede(request.getRolId(), request.getSedeId());
        if (usuarioRepository.existeEmailEnOtro(email, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email");
        }

        usuarioRepository.actualizar(id, nombre, email, request.getRolId(), request.getSedeId());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuarioRepository.actualizarPassword(id, passwordEncoder.encode(request.getPassword()));
        }
        auditoriaService.registrar("EDITAR_USUARIO", "Usuario actualizado: " + email);
        return obtener(id);
    }

    @Transactional
    public UsuarioDTO cambiarEstado(Long id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (!activo && id.equals(actorId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "No puede desactivar su propio usuario");
        }
        usuarioRepository.actualizarActivo(id, activo);
        auditoriaService.registrar(
                "CAMBIAR_ESTADO_USUARIO",
                activo ? "Usuario activado: " + id : "Usuario desactivado: " + id);
        usuario.setActivo(activo);
        return UsuarioDTO.from(usuarioRepository.findById(id).orElseThrow());
    }

    private UsuarioDTO obtener(Long id) {
        return usuarioRepository.findById(id)
                .map(UsuarioDTO::from)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private void validarRolYSede(Long rolId, Long sedeId) {
        usuarioRepository.findRolActivo(rolId)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "El rol no existe o está inactivo"));
        if (!sedeRepository.existeActiva(sedeId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La sede no existe o está inactiva");
        }
    }

    private Long actorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            return principal.getUsuario().getId();
        }
        return null;
    }
}

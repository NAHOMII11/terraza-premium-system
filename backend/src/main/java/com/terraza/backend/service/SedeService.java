package com.terraza.backend.service;

import com.terraza.backend.dto.SedeRequest;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Sede;
import com.terraza.backend.repository.MesaRepository;
import com.terraza.backend.repository.SedeRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SedeService {

    private final SedeRepository sedeRepository;
    private final MesaRepository mesaRepository;
    private final AuditoriaService auditoriaService;

    public java.util.List<Sede> listar() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioPrincipal principal) {
            if (!"ADMIN".equals(principal.getUsuario().getRolNombre())) {
                Long sedeId = principal.getUsuario().getSedeId();
                if (sedeId == null) {
                    return java.util.List.of();
                }
                return sedeRepository.findById(sedeId).map(java.util.List::of).orElseGet(java.util.List::of);
            }
        }
        return sedeRepository.findAll();
    }

    @Transactional
    public Sede crear(SedeRequest request) {
        String nombre = request.getNombre().trim();
        if (sedeRepository.existeNombre(nombre)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A branch with that name already exists");
        }
        Long id = sedeRepository.insertar(
                nombre,
                limpiar(request.getDireccion()),
                limpiar(request.getTelefono()),
                ciudad(request));
        auditoriaService.registrar("CREAR_SEDE", "Sede creada: " + nombre);
        mesaRepository.crearHasta(id, cantidadMesas(request, 10));
        return sedeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Branch not found"));
    }

    @Transactional
    public Sede actualizar(Long id, SedeRequest request) {
        if (sedeRepository.findById(id).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Branch not found");
        }
        String nombre = request.getNombre().trim();
        if (sedeRepository.existeNombreEnOtra(nombre, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A branch with that name already exists");
        }
        sedeRepository.actualizar(
                id,
                nombre,
                limpiar(request.getDireccion()),
                limpiar(request.getTelefono()),
                ciudad(request));
        auditoriaService.registrar("EDITAR_SEDE", "Sede actualizada: " + nombre);
        if (request.getMesas() != null) {
            mesaRepository.crearHasta(id, cantidadMesas(request, request.getMesas()));
        }
        return sedeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Branch not found"));
    }

    private int cantidadMesas(SedeRequest request, int valorPorDefecto) {
        Integer mesas = request.getMesas();
        return mesas == null ? valorPorDefecto : mesas;
    }

    private String ciudad(SedeRequest request) {
        String ciudad = limpiar(request.getCiudad());
        return ciudad == null ? "Bogotá" : ciudad;
    }

    private String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}

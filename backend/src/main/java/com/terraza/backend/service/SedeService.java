package com.terraza.backend.service;

import com.terraza.backend.dto.SedeRequest;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Sede;
import com.terraza.backend.repository.SedeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SedeService {

    private final SedeRepository sedeRepository;
    private final AuditoriaService auditoriaService;

    public java.util.List<Sede> listar() {
        return sedeRepository.findAll();
    }

    @Transactional
    public Sede crear(SedeRequest request) {
        String nombre = request.getNombre().trim();
        if (sedeRepository.existeNombre(nombre)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe una sede con ese nombre");
        }
        Long id = sedeRepository.insertar(nombre, limpiar(request.getDireccion()), limpiar(request.getTelefono()));
        auditoriaService.registrar("CREAR_SEDE", "sedes", id, "Sede creada: " + nombre);
        return sedeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Sede no encontrada"));
    }

    @Transactional
    public Sede actualizar(Long id, SedeRequest request) {
        if (sedeRepository.findById(id).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Sede no encontrada");
        }
        String nombre = request.getNombre().trim();
        if (sedeRepository.existeNombreEnOtra(nombre, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe una sede con ese nombre");
        }
        sedeRepository.actualizar(id, nombre, limpiar(request.getDireccion()), limpiar(request.getTelefono()));
        auditoriaService.registrar("EDITAR_SEDE", "sedes", id, "Sede actualizada: " + nombre);
        return sedeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Sede no encontrada"));
    }

    private String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}

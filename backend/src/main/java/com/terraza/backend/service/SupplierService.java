package com.terraza.backend.service;

import com.terraza.backend.dto.SupplierDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditoriaService auditoriaService;

    public List<SupplierDTO> listar() {
        return supplierRepository.listarActivos().stream().map(SupplierDTO::from).toList();
    }

    @Transactional
    public SupplierDTO crear(SupplierDTO request) {
        String nombre = request.getNombre().trim();
        String nit = limpiar(request.getNit());
        if (nit != null && supplierRepository.existeNit(nit)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A supplier with that NIT already exists");
        }
        Long id = supplierRepository.insertar(
                nombre,
                nit,
                limpiar(request.getContacto()),
                limpiar(request.getTelefono()),
                limpiar(request.getEmail()),
                limpiar(request.getDireccion()));
        auditoriaService.registrar("CREAR_PROVEEDOR", "Proveedor creado: " + nombre);
        return SupplierDTO.from(supplierRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Supplier not found")));
    }

    @Transactional
    public SupplierDTO actualizar(Long id, SupplierDTO request) {
        supplierRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Supplier not found"));
        String nombre = request.getNombre().trim();
        String nit = limpiar(request.getNit());
        if (nit != null && supplierRepository.existeNitEnOtra(nit, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A supplier with that NIT already exists");
        }
        if (supplierRepository.actualizar(
                id,
                nombre,
                nit,
                limpiar(request.getContacto()),
                limpiar(request.getTelefono()),
                limpiar(request.getEmail()),
                limpiar(request.getDireccion())) == 0) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Supplier not found");
        }
        auditoriaService.registrar("EDITAR_PROVEEDOR", "Proveedor actualizado: " + nombre);
        return SupplierDTO.from(supplierRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Supplier not found")));
    }

    private String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}

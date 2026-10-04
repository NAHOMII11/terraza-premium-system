package com.terraza.backend.service;

import com.terraza.backend.dto.ProductoRequest;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Producto;
import com.terraza.backend.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;

    public List<Producto> listarActivos() {
        return productoRepository.findActivos();
    }

    @Transactional
    public Producto crear(ProductoRequest request) {
        String codigo = request.getCodigo().trim();
        String nombre = request.getNombre().trim();
        validarRelaciones(request);
        if (productoRepository.existeCodigo(codigo)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un producto con ese código");
        }
        if (productoRepository.existeNombreYTipo(nombre, request.getTipoProductoId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un producto con ese nombre y tipo");
        }
        Long id = productoRepository.insertar(
                codigo,
                nombre,
                limpiar(request.getDescripcion()),
                request.getValorCompra(),
                request.getValorVenta(),
                request.getTipoProductoId(),
                request.getProveedorId());
        auditoriaService.registrar("CREAR_PRODUCTO", "Producto creado: " + codigo);
        return obtener(id);
    }

    @Transactional
    public Producto actualizar(Long id, ProductoRequest request) {
        if (productoRepository.findById(id).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Producto no encontrado");
        }
        String codigo = request.getCodigo().trim();
        String nombre = request.getNombre().trim();
        validarRelaciones(request);
        if (productoRepository.existeCodigoEnOtro(codigo, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un producto con ese código");
        }
        if (productoRepository.existeNombreYTipoEnOtro(nombre, request.getTipoProductoId(), id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un producto con ese nombre y tipo");
        }
        productoRepository.actualizar(
                id,
                codigo,
                nombre,
                limpiar(request.getDescripcion()),
                request.getValorCompra(),
                request.getValorVenta(),
                request.getTipoProductoId(),
                request.getProveedorId());
        auditoriaService.registrar("EDITAR_PRODUCTO", "Producto actualizado: " + codigo);
        return obtener(id);
    }

    @Transactional
    public void desactivar(Long id) {
        if (productoRepository.findById(id).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Producto no encontrado");
        }
        productoRepository.desactivar(id);
        auditoriaService.registrar("DESACTIVAR_PRODUCTO", "Producto desactivado: " + id);
    }

    private Producto obtener(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    private void validarRelaciones(ProductoRequest request) {
        if (!productoRepository.existeTipoActivo(request.getTipoProductoId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El tipo de producto no existe o está inactivo");
        }
        if (request.getProveedorId() != null && !productoRepository.existeProveedorActivo(request.getProveedorId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El proveedor no existe o está inactivo");
        }
    }

    private String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}

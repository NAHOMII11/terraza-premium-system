package com.terraza.backend.service;

import com.terraza.backend.dto.ProductoRequest;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Producto;
import com.terraza.backend.model.Sede;
import com.terraza.backend.repository.InventoryRepository;
import com.terraza.backend.repository.ProductoRepository;
import com.terraza.backend.repository.SedeRepository;
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
    private final InventoryRepository inventoryRepository;
    private final SedeRepository sedeRepository;
    private final AuditoriaService auditoriaService;

    public List<Producto> listarActivos() {
        return productoRepository.findActivos();
    }

    @Transactional
    public Producto crear(ProductoRequest request) {
        String codigo = request.getCodigo().trim();
        String nombre = request.getNombre().trim();
        validarRelaciones(request);
        validarPrecios(request);
        if (productoRepository.existeCodigo(codigo)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A product with that code already exists");
        }
        if (productoRepository.existeNombreYTipo(nombre, request.getTipoProductoId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "A product with that name and type already exists");
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
        for (Sede sede : sedeRepository.findAll()) {
            if (!inventoryRepository.existePorSedeYProducto(sede.getId(), id)) {
                inventoryRepository.insertar(sede.getId(), id, 0);
            }
        }
        return obtener(id);
    }

    @Transactional
    public Producto actualizar(Long id, ProductoRequest request) {
        if (productoRepository.findById(id).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Product not found");
        }
        String codigo = request.getCodigo().trim();
        String nombre = request.getNombre().trim();
        validarRelaciones(request);
        validarPrecios(request);
        if (productoRepository.existeCodigoEnOtro(codigo, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A product with that code already exists");
        }
        if (productoRepository.existeNombreYTipoEnOtro(nombre, request.getTipoProductoId(), id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A product with that name and type already exists");
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
            throw new BusinessException(HttpStatus.NOT_FOUND, "Product not found");
        }
        productoRepository.desactivar(id);
        auditoriaService.registrar("DESACTIVAR_PRODUCTO", "Producto desactivado: " + id);
    }

    private Producto obtener(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private void validarPrecios(ProductoRequest request) {
        if (request.getValorVenta().compareTo(request.getValorCompra()) < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Sale price cannot be lower than purchase price");
        }
    }

    private void validarRelaciones(ProductoRequest request) {
        if (!productoRepository.existeTipoActivo(request.getTipoProductoId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The product type does not exist or is inactive");
        }
        if (request.getProveedorId() != null && !productoRepository.existeProveedorActivo(request.getProveedorId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The supplier does not exist or is inactive");
        }
    }

    private String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}

package com.terraza.backend.service;

import com.terraza.backend.dto.ProductTypeDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.repository.ProductTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductTypeService {

    private final ProductTypeRepository productTypeRepository;
    private final AuditoriaService auditoriaService;

    public List<ProductTypeDTO> listar() {
        return productTypeRepository.listarActivos().stream().map(ProductTypeDTO::from).toList();
    }

    @Transactional
    public ProductTypeDTO crear(ProductTypeDTO request) {
        String nombre = request.getNombre().trim();
        if (productTypeRepository.existeNombre(nombre)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A product type with that name already exists");
        }
        Long id = productTypeRepository.insertar(nombre, limpiar(request.getDescripcion()));
        auditoriaService.registrar("CREAR_TIPO_PRODUCTO", "Tipo de producto creado: " + nombre);
        return ProductTypeDTO.from(productTypeRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Product type not found")));
    }

    @Transactional
    public ProductTypeDTO actualizar(Long id, ProductTypeDTO request) {
        productTypeRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Product type not found"));
        String nombre = request.getNombre().trim();
        if (productTypeRepository.existeNombreEnOtra(nombre, id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "A product type with that name already exists");
        }
        if (productTypeRepository.actualizar(id, nombre, limpiar(request.getDescripcion())) == 0) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Product type not found");
        }
        auditoriaService.registrar("EDITAR_TIPO_PRODUCTO", "Product type updated: " + nombre);
        return ProductTypeDTO.from(productTypeRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Product type not found")));
    }

    @Transactional
    public void eliminar(Long id) {
        productTypeRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Product type not found"));
        if (productTypeRepository.contarProductos(id) > 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "This type cannot be deleted because it has products");
        }
        productTypeRepository.eliminar(id);
        auditoriaService.registrar("ELIMINAR_TIPO_PRODUCTO", "Product type deleted: " + id);
    }

    private String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}

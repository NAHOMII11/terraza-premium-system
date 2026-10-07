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
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un tipo de producto con ese nombre");
        }
        Long id = productTypeRepository.insertar(nombre, limpiar(request.getDescripcion()));
        auditoriaService.registrar("CREAR_TIPO_PRODUCTO", "Tipo de producto creado: " + nombre);
        return ProductTypeDTO.from(productTypeRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tipo de producto no encontrado")));
    }

    private String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}

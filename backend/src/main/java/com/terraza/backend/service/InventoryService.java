package com.terraza.backend.service;

import com.terraza.backend.dto.CrearInventoryDTO;
import com.terraza.backend.dto.InventoryDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Inventory;
import com.terraza.backend.repository.InventoryRepository;
import com.terraza.backend.repository.ProductoRepository;
import com.terraza.backend.repository.SedeRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final SedeRepository sedeRepository;
    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;

    public List<InventoryDTO> listarPorSede(Long sedeId, UsuarioPrincipal principal) {
        exigirAccesoSede(principal, sedeId);
        exigirSede(sedeId);
        return inventoryRepository.listarPorSede(sedeId).stream().map(InventoryDTO::from).toList();
    }

    @Transactional
    public InventoryDTO crear(CrearInventoryDTO request, UsuarioPrincipal principal) {
        exigirAccesoSede(principal, request.getSedeId());
        validarRelaciones(request);
        if (inventoryRepository.existePorSedeYProducto(request.getSedeId(), request.getProductoId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ese producto ya tiene inventario en la sede");
        }
        Long id = inventoryRepository.insertar(request.getSedeId(), request.getProductoId(), request.getStock());
        auditoriaService.registrar(
                "CREAR_INVENTARIO",
                "Inventario sede " + request.getSedeId() + ", producto " + request.getProductoId());
        return obtener(id);
    }

    @Transactional
    public InventoryDTO actualizarStock(Long id, Integer stock, UsuarioPrincipal principal) {
        Inventory inventory = buscar(id);
        exigirAccesoSede(principal, inventory.getSedeId());
        if (inventoryRepository.actualizarStock(id, stock) == 0) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Registro de inventario no encontrado");
        }
        auditoriaService.registrar("ACTUALIZAR_STOCK", "Inventario " + id + " → stock " + stock);
        return obtener(id);
    }

    private void validarRelaciones(CrearInventoryDTO request) {
        if (!sedeRepository.existeActiva(request.getSedeId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La sede no existe o está inactiva");
        }
        if (productoRepository.findActivoById(request.getProductoId()).isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El producto no existe o está inactivo");
        }
    }

    private InventoryDTO obtener(Long id) {
        return InventoryDTO.from(buscar(id));
    }

    private Inventory buscar(Long id) {
        return inventoryRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Registro de inventario no encontrado"));
    }

    private void exigirSede(Long sedeId) {
        if (sedeRepository.findById(sedeId).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Sede no encontrada");
        }
    }

    private void exigirAccesoSede(UsuarioPrincipal principal, Long sedeId) {
        if ("ADMIN".equals(principal.getUsuario().getRolNombre())) {
            return;
        }
        Long sedeUsuario = principal.getUsuario().getSedeId();
        if (sedeUsuario == null || !sedeUsuario.equals(sedeId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "No puede operar inventario de otra sede");
        }
    }
}

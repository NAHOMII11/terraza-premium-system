package com.terraza.backend.service;

import com.terraza.backend.algorithm.KnapsackAlgorithm;
import com.terraza.backend.algorithm.LowStockAlgorithm;
import com.terraza.backend.dto.CrearInventoryDTO;
import com.terraza.backend.dto.InventoryDTO;
import com.terraza.backend.dto.KnapsackPlanDTO;
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

import java.math.BigDecimal;
import java.util.ArrayList;
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

    public KnapsackPlanDTO restockPlan(Long sedeId, Integer budget, UsuarioPrincipal principal) {
        exigirAccesoSede(principal, sedeId);
        exigirSede(sedeId);
        int capacity = budget == null || budget < 1 ? 100_000 : Math.min(budget, 5_000_000);
        List<KnapsackAlgorithm.Item> candidates = new ArrayList<>();
        List<Inventory> rows = inventoryRepository.listarPorSede(sedeId);
        boolean onlyLow = rows.stream().anyMatch(row -> LowStockAlgorithm.isLow(row.getStock()));
        for (Inventory row : rows) {
            if (onlyLow && !LowStockAlgorithm.isLow(row.getStock())) {
                continue;
            }
            int cost = money(row.getValorCompra());
            int sale = money(row.getValorVenta());
            int margin = Math.max(0, sale - cost);
            if (cost > 0 && margin > 0) {
                candidates.add(new KnapsackAlgorithm.Item(row.getProductoId(), row.getNombreProducto(), cost, margin));
            }
        }
        KnapsackAlgorithm.Result packed = KnapsackAlgorithm.pack(candidates, capacity);
        return KnapsackPlanDTO.builder()
                .budget(capacity)
                .totalCost(packed.totalWeight())
                .totalMargin(packed.totalValue())
                .items(packed.chosen().stream()
                        .map(item -> KnapsackPlanDTO.Item.builder()
                                .productoId(item.id())
                                .nombre(item.name())
                                .cost(item.weight())
                                .margin(item.value())
                                .build())
                        .toList())
                .build();
    }

    private static int money(BigDecimal value) {
        if (value == null) {
            return 0;
        }
        return value.setScale(0, java.math.RoundingMode.HALF_UP).intValue();
    }

    @Transactional
    public InventoryDTO crear(CrearInventoryDTO request, UsuarioPrincipal principal) {
        exigirAccesoSede(principal, request.getSedeId());
        validarRelaciones(request);
        if (inventoryRepository.existePorSedeYProducto(request.getSedeId(), request.getProductoId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "That product already has inventory at this branch");
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
            throw new BusinessException(HttpStatus.NOT_FOUND, "Inventory record not found");
        }
        auditoriaService.registrar("ACTUALIZAR_STOCK", "Inventario " + id + " → stock " + stock);
        return obtener(id);
    }

    private void validarRelaciones(CrearInventoryDTO request) {
        if (!sedeRepository.existeActiva(request.getSedeId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The branch does not exist or is inactive");
        }
        if (productoRepository.findActivoById(request.getProductoId()).isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Product does not exist or is inactive");
        }
    }

    private InventoryDTO obtener(Long id) {
        return InventoryDTO.from(buscar(id));
    }

    private Inventory buscar(Long id) {
        return inventoryRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Inventory record not found"));
    }

    private void exigirSede(Long sedeId) {
        if (sedeRepository.findById(sedeId).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Branch not found");
        }
    }

    private void exigirAccesoSede(UsuarioPrincipal principal, Long sedeId) {
        if ("ADMIN".equals(principal.getUsuario().getRolNombre())) {
            return;
        }
        Long sedeUsuario = principal.getUsuario().getSedeId();
        if (sedeUsuario == null || !sedeUsuario.equals(sedeId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot operate inventory from another branch");
        }
    }
}

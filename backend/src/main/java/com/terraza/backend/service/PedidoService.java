package com.terraza.backend.service;

import com.terraza.backend.dto.DetallePedidoRequest;
import com.terraza.backend.dto.PedidoRequest;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.DetallePedido;
import com.terraza.backend.model.Pedido;
import com.terraza.backend.model.Producto;
import com.terraza.backend.repository.PedidoRepository;
import com.terraza.backend.repository.ProductoRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PedidoService {

    private static final int CANTIDAD_MAXIMA = 999;

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;

    @Transactional
    public Pedido crear(PedidoRequest request, UsuarioPrincipal principal) {
        validarAccesoSede(principal, request.getSedeId());
        validarSedeActiva(request.getSedeId());
        validarMesa(request.getSedeId(), request.getMesaId());
        List<DetallePedido> detalles = resolverDetalles(request.getDetalles());
        aplicarStock(request.getSedeId(), List.of(), detalles);
        Long id = pedidoRepository.insertar(
                request.getSedeId(),
                request.getMesaId(),
                principal.getUsuario().getId(),
                total(detalles));
        pedidoRepository.insertarDetalles(id, detalles);
        auditoriaService.registrar("CREAR_PEDIDO", "Pedido creado: " + id);
        return obtener(id);
    }

    @Transactional
    public Pedido actualizar(Long id, PedidoRequest request, UsuarioPrincipal principal) {
        Pedido pedido = pedidoRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        if (!Pedido.ABIERTO.equals(pedido.getEstado())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Solo se pueden modificar pedidos abiertos");
        }
        validarAccesoSede(principal, pedido.getSedeId());
        if (!pedido.getSedeId().equals(request.getSedeId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "No se puede cambiar la sede de un pedido abierto");
        }
        validarMesa(pedido.getSedeId(), request.getMesaId());
        List<DetallePedido> detalles = resolverDetalles(request.getDetalles());
        aplicarStock(pedido.getSedeId(), pedido.getDetalles(), detalles);
        pedidoRepository.reemplazarDetalles(id, detalles);
        int filas = pedidoRepository.actualizarCabecera(id, request.getMesaId(), total(detalles));
        if (filas == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "El pedido ya no está abierto");
        }
        auditoriaService.registrar("EDITAR_PEDIDO", "Pedido abierto actualizado: " + id);
        return obtener(id);
    }

    public List<Pedido> listarActivos(Long sedeId, UsuarioPrincipal principal) {
        validarAccesoSede(principal, sedeId);
        if (pedidoRepository.findActivoDeSede(sedeId).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Sede no encontrada");
        }
        return pedidoRepository.findAbiertosBySede(sedeId);
    }

    private Pedido obtener(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    private void validarAccesoSede(UsuarioPrincipal principal, Long sedeId) {
        if ("ADMIN".equals(principal.getUsuario().getRolNombre())) {
            return;
        }
        Long sedeUsuario = principal.getUsuario().getSedeId();
        if (sedeUsuario == null || !sedeUsuario.equals(sedeId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "No puede operar pedidos de otra sede");
        }
    }

    private void validarSedeActiva(Long sedeId) {
        Boolean activa = pedidoRepository.findActivoDeSede(sedeId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Sede no encontrada"));
        if (!activa) {
            throw new BusinessException(HttpStatus.CONFLICT, "La sede está inactiva");
        }
    }

    private void validarMesa(Long sedeId, Long mesaId) {
        if (mesaId == null) {
            return;
        }
        if (!pedidoRepository.mesaPerteneceASede(mesaId, sedeId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La mesa no pertenece a la sede indicada");
        }
    }

    private List<DetallePedido> resolverDetalles(List<DetallePedidoRequest> solicitudes) {
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (DetallePedidoRequest item : solicitudes) {
            cantidades.merge(item.getProductoId(), item.getCantidad(), (actual, nueva) -> {
                int suma = actual + nueva;
                if (suma > CANTIDAD_MAXIMA) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "La cantidad supera el máximo permitido");
                }
                return suma;
            });
        }

        List<DetallePedido> detalles = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : cantidades.entrySet()) {
            Producto producto = productoRepository.findActivoById(entry.getKey())
                    .orElseThrow(() -> new BusinessException(
                            HttpStatus.BAD_REQUEST,
                            "El producto " + entry.getKey() + " no existe o está inactivo"));
            DetallePedido detalle = new DetallePedido();
            detalle.setProductoId(producto.getId());
            detalle.setProductoNombre(producto.getNombre());
            detalle.setCantidad(entry.getValue());
            detalle.setPrecioUnitario(producto.getValorVenta());
            detalle.setSubtotal(producto.getValorVenta()
                    .multiply(BigDecimal.valueOf(entry.getValue()))
                    .setScale(2, RoundingMode.HALF_UP));
            detalles.add(detalle);
        }
        return detalles;
    }

    private void aplicarStock(Long sedeId, List<DetallePedido> anteriores, List<DetallePedido> nuevos) {
        Map<Long, Integer> anterior = cantidades(anteriores);
        Map<Long, Integer> nuevo = cantidades(nuevos);
        Map<Long, String> nombres = nombres(anteriores, nuevos);
        List<Long> productos = new ArrayList<>(anterior.keySet());
        nuevo.keySet().stream().filter(id -> !anterior.containsKey(id)).forEach(productos::add);
        productos.sort(Long::compareTo);

        Map<Long, Integer> stockActual = new LinkedHashMap<>();
        for (Long productoId : productos) {
            int stock = pedidoRepository.lockStock(sedeId, productoId)
                    .orElseThrow(() -> new BusinessException(
                            HttpStatus.CONFLICT,
                            "Out of stock: " + nombres.getOrDefault(productoId, String.valueOf(productoId))));
            stockActual.put(productoId, stock);
        }

        for (Long productoId : productos) {
            long resultante = (long) stockActual.get(productoId)
                    + anterior.getOrDefault(productoId, 0)
                    - nuevo.getOrDefault(productoId, 0);
            if (resultante < 0) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "Out of stock: "
                                + nombres.getOrDefault(productoId, String.valueOf(productoId)));
            }
            if (resultante > Integer.MAX_VALUE) {
                throw new BusinessException(HttpStatus.CONFLICT, "El stock resultante no es válido");
            }
            int filas = pedidoRepository.actualizarStock(sedeId, productoId, (int) resultante);
            if (filas == 0) {
                throw new BusinessException(HttpStatus.CONFLICT, "No fue posible actualizar el inventario");
            }
        }
    }

    private Map<Long, Integer> cantidades(List<DetallePedido> detalles) {
        Map<Long, Integer> cantidades = new HashMap<>();
        if (detalles == null) {
            return cantidades;
        }
        for (DetallePedido detalle : detalles) {
            cantidades.merge(detalle.getProductoId(), detalle.getCantidad(), Integer::sum);
        }
        return cantidades;
    }

    private Map<Long, String> nombres(List<DetallePedido> anteriores, List<DetallePedido> nuevos) {
        Map<Long, String> nombres = new HashMap<>();
        for (DetallePedido detalle : anteriores) {
            if (detalle.getProductoNombre() != null) {
                nombres.put(detalle.getProductoId(), detalle.getProductoNombre());
            }
        }
        for (DetallePedido detalle : nuevos) {
            if (detalle.getProductoNombre() != null) {
                nombres.put(detalle.getProductoId(), detalle.getProductoNombre());
            }
        }
        return nombres;
    }

    private BigDecimal total(List<DetallePedido> detalles) {
        return detalles.stream()
                .map(DetallePedido::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }
}

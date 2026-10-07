package com.terraza.backend.service;

import com.terraza.backend.dto.CreatePaymentDTO;
import com.terraza.backend.dto.InvoiceDTO;
import com.terraza.backend.dto.InvoicePaymentDTO;
import com.terraza.backend.dto.PaymentDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Mesa;
import com.terraza.backend.model.Payment;
import com.terraza.backend.model.Pedido;
import com.terraza.backend.model.Usuario;
import com.terraza.backend.repository.MesaRepository;
import com.terraza.backend.repository.PaymentRepository;
import com.terraza.backend.repository.PedidoRepository;
import com.terraza.backend.repository.UsuarioRepository;
import com.terraza.backend.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MesaRepository mesaRepository;
    private final AuditoriaService auditoriaService;

    @Transactional
    public PaymentDTO registrar(CreatePaymentDTO request, UsuarioPrincipal principal) {
        Pedido pedido = pedidoAbierto(request.getPedidoId());
        exigirAccesoSede(principal, pedido.getSedeId());
        Usuario cajero = cajeroValido(request.getCajeroId(), principal, pedido.getSedeId());
        BigDecimal cambio = calcularCambio(request.getMetodoPago(), request.getMonto(), pedido.getTotal());
        rechazarPagoDuplicado(pedido.getId());
        paymentRepository.insertar(pedido.getId(), cajero.getId(), request.getMetodoPago(), request.getMonto(), cambio);
        cerrarPedido(pedido.getId(), cajero.getId());
        liberarMesa(pedido.getMesaId());
        auditoriaService.registrar("REGISTRAR_PAGO", "Pago del pedido " + pedido.getId() + " por " + request.getMetodoPago());
        return new PaymentDTO("Pago registrado", cambio);
    }

    @Transactional
    public InvoiceDTO generarFactura(Long orderId, UsuarioPrincipal principal) {
        InvoiceDTO factura = paymentRepository.buscarFactura(orderId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        exigirAccesoSede(principal, factura.getSedeId());
        factura.setDetalles(paymentRepository.listarLineas(orderId));
        paymentRepository.buscarPagoPorPedido(orderId).map(InvoicePaymentDTO::from).ifPresent(factura::setPago);
        auditoriaService.registrar("CONSULTAR_FACTURA", "Factura del pedido " + orderId);
        return factura;
    }

    private Pedido pedidoAbierto(Long pedidoId) {
        Pedido pedido = pedidoRepository.findByIdForUpdate(pedidoId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        if (!Pedido.ABIERTO.equals(pedido.getEstado())) {
            throw new BusinessException(HttpStatus.CONFLICT, "El pedido ya está cerrado");
        }
        return pedido;
    }

    private Usuario cajeroValido(Long cajeroId, UsuarioPrincipal principal, Long sedePedido) {
        Usuario cajero = usuarioRepository.findById(cajeroId)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "El cajero no existe o está inactivo"));
        if (!Boolean.TRUE.equals(cajero.getActivo())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El cajero no existe o está inactivo");
        }
        validarRolDeCajero(cajero);
        validarIdentidad(principal, cajero);
        validarSedeDelCajero(cajero, sedePedido);
        return cajero;
    }

    private void validarRolDeCajero(Usuario cajero) {
        String rol = cajero.getRolNombre();
        if (!"ADMIN".equals(rol) && !"CAJERO".equals(rol)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El usuario indicado no puede registrar pagos");
        }
    }

    private void validarIdentidad(UsuarioPrincipal principal, Usuario cajero) {
        boolean esCajero = "CAJERO".equals(principal.getUsuario().getRolNombre());
        if (esCajero && !principal.getUsuario().getId().equals(cajero.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "No puede registrar un pago a nombre de otro cajero");
        }
    }

    private void validarSedeDelCajero(Usuario cajero, Long sedePedido) {
        if (!"CAJERO".equals(cajero.getRolNombre())) {
            return;
        }
        if (cajero.getSedeId() == null || !cajero.getSedeId().equals(sedePedido)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El cajero no pertenece a la sede del pedido");
        }
    }

    // El efectivo puede superar el total y devuelve cambio. La tarjeta debe coincidir exacto.
    private BigDecimal calcularCambio(String metodo, BigDecimal monto, BigDecimal total) {
        BigDecimal pagado = monto.setScale(2, RoundingMode.HALF_UP);
        BigDecimal esperado = total.setScale(2, RoundingMode.HALF_UP);
        if (Payment.EFECTIVO.equals(metodo)) {
            return cambioEfectivo(pagado, esperado);
        }
        return cambioTarjeta(pagado, esperado);
    }

    private BigDecimal cambioEfectivo(BigDecimal pagado, BigDecimal esperado) {
        if (pagado.compareTo(esperado) < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El monto no cubre el total del pedido");
        }
        return pagado.subtract(esperado);
    }

    private BigDecimal cambioTarjeta(BigDecimal pagado, BigDecimal esperado) {
        if (pagado.compareTo(esperado) != 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El monto con tarjeta debe ser igual al total del pedido");
        }
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private void rechazarPagoDuplicado(Long pedidoId) {
        if (paymentRepository.existePago(pedidoId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "El pedido ya tiene un pago registrado");
        }
    }

    private void cerrarPedido(Long pedidoId, Long cajeroId) {
        if (paymentRepository.cerrarPedido(pedidoId, cajeroId) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "El pedido ya está cerrado");
        }
    }

    private void liberarMesa(Long mesaId) {
        if (mesaId == null) {
            return;
        }
        mesaRepository.actualizarEstado(mesaId, Mesa.DISPONIBLE);
    }

    private void exigirAccesoSede(UsuarioPrincipal principal, Long sedeId) {
        if ("ADMIN".equals(principal.getUsuario().getRolNombre())) {
            return;
        }
        Long sedeUsuario = principal.getUsuario().getSedeId();
        if (sedeUsuario == null || !sedeUsuario.equals(sedeId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "No puede cobrar pedidos de otra sede");
        }
    }
}

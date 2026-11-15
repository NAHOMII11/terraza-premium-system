package com.terraza.backend.service;

import com.terraza.backend.algorithm.ChangeMakingAlgorithm;
import com.terraza.backend.algorithm.Sha256Algorithm;
import com.terraza.backend.dto.CreatePaymentDTO;
import com.terraza.backend.dto.DenominationDTO;
import com.terraza.backend.dto.InvoiceDTO;
import com.terraza.backend.dto.InvoicePaymentDTO;
import com.terraza.backend.dto.PaymentDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Mesa;
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
import java.util.List;

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
        BigDecimal cambio = ChangeMakingAlgorithm.change(request.getMetodoPago(), request.getMonto(), pedido.getTotal());
        rechazarPagoDuplicado(pedido.getId());
        paymentRepository.insertar(pedido.getId(), cajero.getId(), request.getMetodoPago(), request.getMonto(), cambio);
        cerrarPedido(pedido.getId(), cajero.getId());
        liberarMesa(pedido.getMesaId());
        auditoriaService.registrar("REGISTRAR_PAGO", "Pago del pedido " + pedido.getId() + " por " + request.getMetodoPago());
        List<DenominationDTO> desglose = ChangeMakingAlgorithm.breakdown(cambio).entrySet().stream()
                .filter(entry -> entry.getValue() > 0)
                .map(entry -> new DenominationDTO(entry.getKey(), entry.getValue()))
                .toList();
        return new PaymentDTO("Payment registered", cambio, desglose);
    }

    public java.util.List<InvoiceDTO> listarFacturas(Long sedeId, UsuarioPrincipal principal) {
        exigirAccesoSede(principal, sedeId);
        return paymentRepository.listarFacturas(sedeId);
    }

    @Transactional
    public InvoiceDTO generarFactura(Long orderId, UsuarioPrincipal principal) {
        InvoiceDTO factura = paymentRepository.buscarFactura(orderId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Order not found"));
        exigirAccesoSede(principal, factura.getSedeId());
        factura.setDetalles(paymentRepository.listarLineas(orderId));
        paymentRepository.buscarPagoPorPedido(orderId).map(InvoicePaymentDTO::from).ifPresent(factura::setPago);
        factura.setHashSha256(Sha256Algorithm.digest(payloadFactura(factura)));
        auditoriaService.registrar("CONSULTAR_FACTURA", "Factura del pedido " + orderId);
        return factura;
    }

    private Pedido pedidoAbierto(Long pedidoId) {
        Pedido pedido = pedidoRepository.findByIdForUpdate(pedidoId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!Pedido.ABIERTO.equals(pedido.getEstado())) {
            throw new BusinessException(HttpStatus.CONFLICT, "The order is already closed");
        }
        return pedido;
    }

    private Usuario cajeroValido(Long cajeroId, UsuarioPrincipal principal, Long sedePedido) {
        Usuario cajero = usuarioRepository.findById(cajeroId)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "El cajero does not exist or is inactive"));
        if (!Boolean.TRUE.equals(cajero.getActivo())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The cashier does not exist or is inactive");
        }
        validarRolDeCajero(cajero);
        validarIdentidad(principal, cajero);
        validarSedeDelCajero(cajero, sedePedido);
        return cajero;
    }

    private void validarRolDeCajero(Usuario cajero) {
        String rol = cajero.getRolNombre();
        if (!"ADMIN".equals(rol) && !"CAJERO".equals(rol)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The selected user cannot register payments");
        }
    }

    private void validarIdentidad(UsuarioPrincipal principal, Usuario cajero) {
        boolean esCajero = "CAJERO".equals(principal.getUsuario().getRolNombre());
        if (esCajero && !principal.getUsuario().getId().equals(cajero.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot register a payment on behalf of another cashier");
        }
    }

    private void validarSedeDelCajero(Usuario cajero, Long sedePedido) {
        if (!"CAJERO".equals(cajero.getRolNombre())) {
            return;
        }
        if (cajero.getSedeId() == null || !cajero.getSedeId().equals(sedePedido)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The cashier does not belong to the order branch");
        }
    }

    private void rechazarPagoDuplicado(Long pedidoId) {
        if (paymentRepository.existePago(pedidoId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "The order already has a payment");
        }
    }

    private void cerrarPedido(Long pedidoId, Long cajeroId) {
        if (paymentRepository.cerrarPedido(pedidoId, cajeroId) == 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "The order is already closed");
        }
    }

    private void liberarMesa(Long mesaId) {
        if (mesaId == null) {
            return;
        }
        mesaRepository.actualizarEstado(mesaId, Mesa.DISPONIBLE);
    }

    private String payloadFactura(InvoiceDTO factura) {
        StringBuilder payload = new StringBuilder();
        payload.append(factura.getPedidoId()).append('|')
                .append(factura.getSedeNombre()).append('|')
                .append(factura.getTotal()).append('|')
                .append(factura.getEstado());
        if (factura.getDetalles() != null) {
            factura.getDetalles().forEach(line -> payload
                    .append('|')
                    .append(line.getProductoId())
                    .append('x')
                    .append(line.getCantidad())
                    .append('=')
                    .append(line.getSubtotal()));
        }
        return payload.toString();
    }

    private void exigirAccesoSede(UsuarioPrincipal principal, Long sedeId) {
        if ("ADMIN".equals(principal.getUsuario().getRolNombre())) {
            return;
        }
        Long sedeUsuario = principal.getUsuario().getSedeId();
        if (sedeUsuario == null || !sedeUsuario.equals(sedeId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot charge orders from another branch");
        }
    }
}

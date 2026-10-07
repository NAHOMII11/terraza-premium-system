package com.terraza.backend.service;

import com.terraza.backend.dto.MesaDTO;
import com.terraza.backend.exception.BusinessException;
import com.terraza.backend.model.Mesa;
import com.terraza.backend.repository.MesaRepository;
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
public class MesaService {

    private final MesaRepository mesaRepository;
    private final SedeRepository sedeRepository;
    private final AuditoriaService auditoriaService;

    public List<MesaDTO> listarPorSede(Long sedeId, UsuarioPrincipal principal) {
        exigirAccesoSede(principal, sedeId);
        exigirSede(sedeId);
        return mesaRepository.listarPorSede(sedeId).stream().map(MesaDTO::from).toList();
    }

    @Transactional
    public MesaDTO actualizarEstado(Long id, String estado, UsuarioPrincipal principal) {
        validarEstado(estado);
        Mesa mesa = buscarActiva(id);
        exigirAccesoSede(principal, mesa.getSedeId());
        if (mesaRepository.actualizarEstado(id, estado) == 0) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Mesa no encontrada");
        }
        auditoriaService.registrar("ACTUALIZAR_MESA", "Mesa " + id + " → " + estado);
        return MesaDTO.from(buscarActiva(id));
    }

    private Mesa buscarActiva(Long id) {
        return mesaRepository.buscarPorId(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Mesa no encontrada"));
    }

    private void validarEstado(String estado) {
        if (!Mesa.DISPONIBLE.equals(estado) && !Mesa.OCUPADA.equals(estado)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Estado inválido: " + estado);
        }
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
            throw new BusinessException(HttpStatus.FORBIDDEN, "No puede operar mesas de otra sede");
        }
    }
}

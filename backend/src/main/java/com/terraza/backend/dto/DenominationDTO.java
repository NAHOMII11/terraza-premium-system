package com.terraza.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DenominationDTO {
    private final int denomination;
    private final int count;
}

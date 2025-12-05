package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum PreferredLanguage
{
    EN ("English"),
    DE ("Deutsch"),
    PR ("Persian");

    private final String value;

    PreferredLanguage(String value) {
        this.value = value;
    }

}

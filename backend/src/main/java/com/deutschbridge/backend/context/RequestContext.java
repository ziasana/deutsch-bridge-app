package com.deutschbridge.backend.context;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.util.SecurityUtils;
import lombok.Getter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
@Getter
public class RequestContext {
    private final String language;
    private final String userEmail;
    private final String userId;

    public RequestContext() throws DataNotFoundException {
        // Get language from LanguageContext (ThreadLocal)
        this.language = LanguageContext.get() != null ? LanguageContext.get() : "EN";

        // Get user info from SecurityUtils
        this.userEmail = SecurityUtils.getAuthenticatedEmail();
        this.userId = SecurityUtils.getCurrentUser().getId();
    }
}

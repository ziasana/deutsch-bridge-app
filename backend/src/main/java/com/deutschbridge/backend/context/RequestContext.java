package com.deutschbridge.backend.context;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.enums.PromptType;
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
        // get language from (ThreadLocal)
        this.language = LanguageContext.get() != null ? LanguageContext.get() : "EN";


        // get user info from SecurityUtils
        this.userEmail = SecurityUtils.getAuthenticatedEmail();
        this.userId = SecurityUtils.getCurrentUser().getId();

    }
}

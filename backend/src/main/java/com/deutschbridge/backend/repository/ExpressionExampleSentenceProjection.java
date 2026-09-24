package com.deutschbridge.backend.repository;

/** Row shape for ExpressionRepository.findFirstExampleSentences - one sentence per expression id. */
public interface ExpressionExampleSentenceProjection {
    String getExpressionId();
    String getSentence();
}

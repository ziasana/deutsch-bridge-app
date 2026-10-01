package com.deutschbridge.backend.model.enums;

/** The kind of learning unit a WritingGuideItem represents; its JSON payload shape depends on it. */
public enum WritingGuideKind {
    /** Prüfungsformat: content = intro, data = {requirements[], time?}. */
    FORMAT,
    /** Schreibstrategie step: content = explanation, data = {tips[]}. */
    STRATEGY_STEP,
    /** Textaufbau part: content = purpose, data = {examples[], phrases[]}. */
    STRUCTURE_PART,
    /** Mustertext: content = task situation, data = {sections[{key,label,text,why,phrases[]}]}. */
    EXAMPLE,
    /** Satzbaustein: title = pattern, content = explanation, data = {examples[]}. */
    SENTENCE_PATTERN,
    /** Typischer Fehler: content = explanation, data = {wrong?, right?}. */
    MISTAKE,
    /** One checklist line (title). */
    CHECKLIST_ITEM
}

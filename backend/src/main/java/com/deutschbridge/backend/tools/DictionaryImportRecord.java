package com.deutschbridge.backend.tools;

import java.util.List;

/** Shape produced by scripts/dictionary-import/transform.py - one JSON object per line. */
public class DictionaryImportRecord {
    public String lemma;
    public String ipa;
    public String audioUrl;
    public String article;
    public List<ImportedSense> senses;

    public static class ImportedSense {
        public String pos;
        public List<String> translations;
        public List<ImportedExample> examples;
    }

    public static class ImportedExample {
        public String de;
        public String en;
        public String audioUrl;
    }
}

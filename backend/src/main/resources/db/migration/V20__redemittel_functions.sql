-- "Funktion" of a Redemittel becomes admin-managed data instead of the WritingPhraseCategory enum.
-- The built-in functions keep the enum names as ids, so writing_phrases.category needs no data change.
CREATE TABLE redemittel_functions (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL
);

INSERT INTO redemittel_functions (id, label, sort_order) VALUES
    ('GREETING', 'Anrede', 0),
    ('INTRODUCTION', 'Einleitung', 1),
    ('OPINION', 'Meinung äußern', 2),
    ('REASON', 'Begründen', 3),
    ('EXAMPLE', 'Beispiele geben', 4),
    ('ADDITION', 'Ergänzen', 5),
    ('CONTRAST', 'Vergleichen / Gegensatz', 6),
    ('AGREEMENT', 'Zustimmen', 7),
    ('DISAGREEMENT', 'Widersprechen', 8),
    ('ADVANTAGE_DISADVANTAGE', 'Vor- und Nachteile', 9),
    ('SUGGESTION', 'Vorschläge machen', 10),
    ('REQUEST', 'Bitten', 11),
    ('APOLOGY', 'Entschuldigen', 12),
    ('QUESTION', 'Nach Informationen fragen', 13),
    ('CONCLUSION', 'Schluss', 14);

ALTER TABLE writing_phrases
    ADD CONSTRAINT fk_writing_phrases_function FOREIGN KEY (category) REFERENCES redemittel_functions (id);

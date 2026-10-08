-- Part of speech (noun, verb, adjective ...) or expression kind (expression, idiom, noun-verb connection)
-- of a vocabulary entry. Null for entries saved before this existed.
ALTER TABLE vocabulary_items ADD COLUMN word_type VARCHAR(255);

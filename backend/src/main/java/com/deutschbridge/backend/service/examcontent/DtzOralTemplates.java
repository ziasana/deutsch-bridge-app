package com.deutschbridge.backend.service.examcontent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.List;

/**
 * The standard content of the DTZ Teil 1 template. The six topics are the fixed examination content; the question, sentence starter and
 * vocabulary of each topic are optional practice support that is kept apart from them and can evolve without changing the template.
 * The sentence starters are open ("Ich wohne in ...") - there are no sample biographies to memorise.
 */
final class DtzOralTemplates {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final List<String[]> SUPPORT = List.of(
            new String[]{"Wie heißen Sie?", "Ich heiße ... Mein Nachname ist ...", "der Vorname|der Nachname|buchstabieren"},
            new String[]{"Wo sind Sie geboren?", "Ich bin in ... geboren. Das liegt in ...", "geboren|die Stadt|das Land|aufgewachsen"},
            new String[]{"Wo wohnen Sie?", "Ich wohne in ... Ich wohne seit ... in Deutschland.", "die Wohnung|das Haus|die Straße|seit zwei Jahren"},
            new String[]{"Was sind Sie von Beruf?", "Ich arbeite als ... Ich bin ... von Beruf.", "der Beruf|die Firma|die Ausbildung|arbeitslos|die Arbeit suchen"},
            new String[]{"Haben Sie Familie?", "Ich bin verheiratet. Ich habe ... Kinder.", "verheiratet|ledig|die Kinder|die Eltern|die Geschwister"},
            new String[]{"Welche Sprachen sprechen Sie?", "Meine Muttersprache ist ... Ich spreche auch ...", "die Muttersprache|der Sprachkurs|Deutsch lernen|ein bisschen|fließend"});

    private DtzOralTemplates() {
    }

    static ObjectNode teil1() {
        ObjectNode node = MAPPER.createObjectNode();
        node.put("part", 1);
        node.put("exerciseType", DtzOralSchema.TYPE_SELF_INTRODUCTION);
        node.put("title", DtzOralSchema.TEIL1_TITLE);
        node.put("instructions", DtzOralSchema.TEIL1_INSTRUCTIONS);
        node.put("guidance", "Sprechen Sie zu jedem Thema ein oder zwei Sätze. Sie müssen nichts auswendig lernen.");
        ArrayNode topics = node.putArray("topics");
        ArrayNode support = node.putArray("practiceSupport");
        for (int i = 0; i < DtzOralSchema.TEIL1_TOPICS.size(); i++) {
            topics.addObject().put("number", i + 1).put("label", DtzOralSchema.TEIL1_TOPICS.get(i));
            ObjectNode entry = support.addObject();
            entry.put("topicNumber", i + 1);
            entry.put("question", SUPPORT.get(i)[0]);
            entry.put("sentenceStarter", SUPPORT.get(i)[1]);
            ArrayNode vocabulary = entry.putArray("vocabulary");
            for (String word : SUPPORT.get(i)[2].split("\\|")) vocabulary.add(word);
        }
        return node;
    }
}

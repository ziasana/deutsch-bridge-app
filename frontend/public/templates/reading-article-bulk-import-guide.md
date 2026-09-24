# Reading article bulk import — field reference

Use `reading-article-bulk-import-template.json` as a starting point: duplicate one of its two
entries per new article, edit the values, and paste the whole array into the "Bulk upload" panel
on the admin Reading Articles page (or upload the `.json` file directly there).

The import is best-effort: each row is validated and saved independently, so a mistake in one
row won't block the rest of the batch. You'll get a per-row success/failure report after import.

## Required fields

| Field     | Type   | Notes                                       |
|-----------|--------|----------------------------------------------|
| `title`   | string | The article's title.                        |
| `level`   | enum   | `A1`, `A2`, `B1`, `B2`, `C1`, or `C2`         |
| `content` | string | The full article text.                      |

Everything else is optional — omit a field entirely (rather than sending `null`/`""`) if you
don't have a value for it.

## Optional fields

| Field           | Type            | Notes                                                                 |
|------------------|-----------------|------------------------------------------------------------------------|
| `topic`         | string          | Short topic/category label shown in the article list.                 |
| `imageUrl`      | string or null  | Leave as `null` — illustrations are uploaded separately per article from the admin edit form, not through bulk import. |
| `linkedGroupId` | string or null  | Groups articles that share the same story across levels.              |

## `keyVocabulary` (array, optional)

Each item:

```json
{ "word": "...", "meaning": "..." }
```

## `annotations` (array, optional)

Highlighted words/expressions inside the article text. Each item:

```json
{
  "type": "WORD",
  "surfaceText": "...",
  "lemma": "...",
  "pos": null,
  "gender": null,
  "pluralForm": null,
  "translationEn": null,
  "literalTranslation": null,
  "cefrLevel": null,
  "exampleSentence": null
}
```

- `type` is one of: `WORD`, `NOMEN_VERB_VERBINDUNG`, `REDEWENDUNG`
- `surfaceText` must match text that actually appears in `content` — its position is located
  automatically, so you don't need to supply `spans` or `id` yourself.
- `pos`, `gender`, `pluralForm` are `WORD`-specific (part of speech, grammatical gender, plural form).
- `literalTranslation` is `REDEWENDUNG`-specific (the literal, word-for-word meaning).
- `cefrLevel` is one of `A1`-`C2`, or `null`.

## `quiz` (array, optional)

Each item:

```json
{
  "type": "DETAIL",
  "prompt": "...",
  "options": ["...", "...", "..."],
  "correctAnswer": "...",
  "explanation": "...",
  "supportingSentence": "...",
  "relatedAnnotationId": null,
  "minLevel": null
}
```

- `type` is one of: `HAUPTIDEE`, `DETAIL`, `VOCAB_CONTEXT`, `INFERENCE`, `RICHTIG_FALSCH_NICHT_IM_TEXT`
- `options` is the list of choices shown to the learner; for a true/false question use
  `["Richtig", "Falsch"]` (or similar) and set `correctAnswer` to the matching text.
- `supportingSentence` should be a sentence copied from `content` — it's shown to the learner as
  evidence after they answer.
- `relatedAnnotationId` only matters for `VOCAB_CONTEXT` questions that link to one of the
  `annotations` above. Since annotation ids are normally auto-generated, only set this if you also
  explicitly set an `id` on that annotation and reuse the same value here — otherwise leave it `null`.
- `minLevel` restricts the question to articles at or above that level (`A1`-`C2`). Leave it
  `null` (or omit it) for no restriction.

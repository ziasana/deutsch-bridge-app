# Expression bulk import — field reference

Use `expression-bulk-import-template.json` as a starting point: duplicate one of its two entries
per new expression, edit the values, and paste the whole array into the "Bulk upload" panel on
the admin Active Expressions page (or upload the `.json` file directly there).

The import is best-effort: each row is validated and saved independently, so a mistake in one
row won't block the rest of the batch. You'll get a per-row success/failure report after import.

## Required fields

| Field       | Type   | Notes                                                             |
|-------------|--------|--------------------------------------------------------------------|
| `expression`| string | The Nomen-Verb-Verbindung or Redewendung itself.                  |
| `type`      | enum   | `NOMEN_VERB_VERBINDUNG` or `REDEWENDUNG`                           |
| `level`     | enum   | `A1`, `A2`, `B1`, `B2`, `C1`, or `C2`                               |
| `meaningDe` | string | German meaning/definition.                                        |

Everything else is optional — omit a field entirely (rather than sending `null`/`""`) if you
don't have a value for it, except where noted below.

## Optional fields

| Field              | Type            | Notes                                                                 |
|---------------------|-----------------|------------------------------------------------------------------------|
| `meaningEn`         | string          | English meaning.                                                      |
| `meaningFa`         | string          | Persian meaning.                                                      |
| `literalMeaning`    | string          | REDEWENDUNG only — the literal, word-for-word meaning.                 |
| `figurativeMeaning` | string          | REDEWENDUNG only — the idiomatic meaning.                              |
| `imageUrl`          | string or null  | Leave as `null` — illustrations are uploaded separately per entry from the admin edit form, not through bulk import. |
| `grammarNote`       | string          | NOMEN_VERB_VERBINDUNG only — e.g. the grammatical case it takes.       |
| `usageNote`         | string          | Register/usage context, shown to students.                            |
| `register`          | enum or null    | `NEUTRAL_FORMAL`, `FORMAL`, or `UMGANGSSPRACHLICH`                     |
| `commonMistakes`    | string          | Typical learner errors.                                               |
| `status`            | enum            | `DRAFT` or `PUBLISHED`. Defaults to `DRAFT` if omitted — entries stay hidden from students until you publish them from the admin table. |

## `examples` (array, optional but recommended)

Each item:

```json
{ "sentence": "...", "translationEn": "...", "translationFa": "...", "context": "EVERYDAY" }
```

`context` is one of: `EVERYDAY`, `WORK`, `UNIVERSITY`, `SOCIETY`, `EXAM`.

## `patterns` (array, optional, NOMEN_VERB_VERBINDUNG only)

Each item:

```json
{ "pattern": "...", "grammarCase": "...", "preposition": "...", "example": "..." }
```

## `questions` (array, optional)

Each item:

```json
{
  "type": "CONTEXT",
  "format": "MULTIPLE_CHOICE",
  "prompt": "...",
  "explanation": "...",
  "options": [{ "text": "...", "correct": true }]
}
```

- `type` is one of: `CONTEXT`, `COMPLETION`, `TRANSFORMATION`
- `format` is one of: `MULTIPLE_CHOICE`, `FREE_TEXT` — for `FREE_TEXT`, omit `options` (send `[]`).

# Redemittel bulk import — field reference

Use `redemittel-bulk-import-template.json` as a starting point: duplicate one of its two entries per
new Redemittel, edit the values, and paste the whole array into the "Bulk upload" panel on the admin
Manage Redemittel page (or upload the `.json` file directly there).

The import is best-effort: each row is validated and saved independently, so a mistake in one row
won't block the rest of the batch. You'll get a per-row success/failure report after the import.

## Required fields

| Field      | Type   | Notes                                                                                              |
|------------|--------|-----------------------------------------------------------------------------------------------------|
| `phrase`   | string | The Redemittel itself.                                                                              |
| `level`    | enum   | `A1`, `A2`, `B1`, `B2`, `C1`, or `C2`                                                                |
| `function` | string | The name of an existing Funktion (case-insensitive), e.g. `Meinung äußern`. Create new ones under *Funktionen* first. |

A Redemittel that already exists on the same level (same `phrase`, ignoring case) is rejected.

## Optional fields

Omit a field entirely if you have no value for it.

| Field               | Type            | Notes                                                                                   |
|----------------------|-----------------|------------------------------------------------------------------------------------------|
| `example`            | string          | An example sentence (plain text). Used to generate extra cloze / word-order questions.    |
| `explanation`        | string (HTML)   | Rich text, e.g. `<p>…<strong>…</strong></p>`; plain text works too.                       |
| `usageNote`          | string (HTML)   | Hint on how to use it (rich text).                                                        |
| `formality`          | enum            | `INFORMAL`, `NEUTRAL`, or `FORMAL`                                                        |
| `sortOrder`          | number          | Order within the function. Defaults to `0`.                                               |
| `active`             | boolean         | Visible to learners. Defaults to `true`.                                                  |
| `meaningEn`          | string          | English meaning.                                                                          |
| `meaningFa`          | string          | Persian meaning.                                                                          |
| `grammarPattern`     | string          | Grammar / structure, e.g. `Ich bin der Meinung, dass + Nebensatz`.                         |
| `commonMistake`      | string          | Typical error; use `\n` to separate the wrong and the right form.                         |
| `similarExpressions` | array of string | Similar Redemittel.                                                                       |
| `contexts`           | array of enum   | Any of `EVERYDAY`, `SPEAKING`, `WRITING`, `EXAM`, `WORK`, `DISCUSSION`.                    |
| `exercises`          | array           | Practice exercises, see below.                                                            |

## `exercises` (array, optional)

Each item has a `type`; the other fields depend on it:

| `type`       | `prompt`                                   | `correctAnswer`  | `wrongAnswers`                       |
|--------------|---------------------------------------------|-------------------|----------------------------------------|
| `MEANING`    | optional (defaults to "Was bedeutet: …")    | required          | at least 2, all different              |
| `FILL_BLANK` | required, must contain a blank `___`        | the missing word  | —                                      |
| `SITUATION`  | required (the situation)                    | required          | at least 2, all different              |
| `PRODUCTION` | required (the topic)                        | —                 | —                                      |

An invalid exercise rejects the whole row (the error names the exercise, e.g. `exercises[1]: …`).

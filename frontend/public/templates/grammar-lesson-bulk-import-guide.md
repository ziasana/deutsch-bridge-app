# Grammar lesson bulk import — field reference

Use `grammar-lesson-bulk-import-template.json` as a starting point: duplicate one of its two
entries per new lesson, edit the values, and paste the whole array into the "Bulk upload" panel
on the admin Grammar Lessons page (or upload the `.json` file directly there). Imported lessons
always land as **DRAFT** unless you set `status` to `PUBLISHED` yourself, so you can review them
before they reach students.

Unlike Reading/Expressions bulk import, this one is **all-or-nothing**: every lesson (and its
exercises) is validated first, and if any of them fails, nothing is saved. You'll get one combined
error listing every problem found, so you can fix them all before re-uploading.

## Required fields

| Field     | Type   | Notes                                 |
|-----------|--------|-----------------------------------------|
| `title`   | string | The lesson's title.                    |
| `level`   | enum   | `A1`, `A2`, `B1`, `B2`, `C1`, or `C2`   |
| `content` | string | The explanation shown to the learner.  |

Everything else is optional — omit a field entirely (rather than sending `null`/`""`) if you
don't have a value for it.

## Optional fields

| Field         | Type            | Notes                                                                 |
|----------------|-----------------|------------------------------------------------------------------------|
| `summary`     | string          | One-line summary shown in the lesson list.                            |
| `example`     | string          | Example sentence(s).                                                  |
| `usageTips`   | string          | Tips on how/when to use this grammar point.                           |
| `videoLink`   | string or null  | A YouTube (or similar) link.                                          |
| `status`      | enum            | `DRAFT` or `PUBLISHED`. Defaults to `DRAFT` if omitted.                |
| `categoryId`  | string or null  | Groups the lesson into a block (see the admin Categories page for ids). Must belong to the same `level` as the lesson. |
| `sortOrder`   | number          | Lower shows first within its category. Defaults to `0`.               |
| `titleFa`, `summaryFa`, `contentFa`, `exampleFa`, `usageTipsFa` | string | Persian translations. Only used for `A1`, `A2`, `B1` — silently ignored for `B2` and up. |

## Duplicate detection

A lesson is a duplicate (and the whole batch is rejected) if another lesson already exists - or
appears earlier in the same upload - with the same `title` (case-insensitive) **and** the same
`level` **and** the same `categoryId`. The same title is fine again in a different level, a
different category, or with no category at all.

## `quiz` (array, optional)

Each item:

```json
{
  "type": "mcq",
  "title": "...",
  "question": "...",
  "options": ["...", "...", "..."],
  "answer": "...",
  "titleFa": "...",
  "questionFa": "..."
}
```

- `type` is one of: `mcq`, `truefalse`
- `mcq` requires at least 2 `options`, and `answer` must be one of them (as a string).
- `truefalse` ignores `options`; `answer` is `true` or `false`.
- `titleFa`/`questionFa` are optional Persian translations, only used for `A1`-`B1` lessons.

## Alternate shape: category blocks

Instead of (or mixed with) plain lessons, you can group lessons under a shared level and category
so you don't have to repeat those two fields on every row:

```json
[
  {
    "title": "Block 1: Präpositionen",
    "level": "A2",
    "categoryId": "cat-abc123",
    "lessons": [
      { "title": "Präpositionen mit Akkusativ", "content": "..." },
      { "title": "Präpositionen mit Dativ", "content": "...", "level": "B1" }
    ]
  }
]
```

Each lesson inside `lessons` inherits the block's `level` and `categoryId` unless it sets its own
(as the second lesson above does, overriding `level` to `B1`). Everything else about a lesson
(required/optional fields, `quiz`, translations) works exactly the same inside a block.

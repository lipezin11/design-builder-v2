# My Eyes — Human Evidence Capture

This stage records evidence. It does not infer designer preferences or quality weights.

## Add a literal human reason

Run:

```powershell
npm run my-eyes:add-reason
```

The command shows the available images and asks for:

1. `image_id`;
2. the literal human reason;
3. explicit confirmation before writing.

The entered text is preserved exactly as `raw_text` and attributed to `HUMAN`.

## Add a pairwise choice

Run:

```powershell
npm run my-eyes:add-pair
```

The command asks for:

1. `left_image_id`;
2. `right_image_id`;
3. `LEFT`, `RIGHT`, or `TIE`;
4. whether the comparison is a `HARD_PAIR`;
5. comparison context;
6. an optional literal human reason;
7. explicit confirmation before writing.

Pairs are never generated automatically. Reversed duplicates are rejected while an active pair exists.

## Structured reasons

The runtime can store either human-structured or AI-structured reasons. AI structure remains `asserted_by = AI` and `confirmed_by_human = false` until explicit confirmation. The literal raw reason is never replaced.

## Corrections

The runtime exposes correction operations for reasons, structured reasons, and pairs. A correction appends the next version and marks the previous record `SUPERSEDED`; previous text and decisions remain available for audit.

## Evidence preparation

Human reasons and pairwise choices can be linked to the latest Level 3 visual-analysis records for the same images. Those links remain `UNASSESSED`, with `causality_inferred = false` and `preference_inferred = false`.
# Finland: native review gate

Status: **prepared, not published**.

The Finnish site is intentionally absent from all three `PUBLISHED` lists and
therefore receives `noindex`, no sitemap entries, no hreflang links and no
language-switcher entry. Do not add `fi` to a `PUBLISHED` list until all items
below are complete and both Finnish store listings are live.

## Required native Finnish review

A Finnish-speaking golfer must review:

- the homepage, about page, glossary and format chooser;
- all 21 format names, rules, examples and handicap explanations;
- money wording (`panos`, `potti`, `maksujen loppuselvitys`) and the clear
  statement that Wager Golf never handles money;
- accessibility labels and invite-page copy;
- store screenshots and store metadata against the same terminology.

The current terminology follows the app's `fi` catalog, including
`pelitasoitus`, `tasoitusindeksi`, `pistebogey`, `lyöntipeli`, `reikäpeli`,
`Four-Ball`, `lähimmäs lippua`, `pisin draivi`, `mailaruletti` and
`golfpokeri`. It is internally consistent, but consistency is not a substitute
for native review.

## Legal fallback

Finnish privacy and terms pages do not exist yet. Finnish footer links point
to the English sections of the canonical legal pages and label them as
English. A Finnish legal translation is not required for technical preview,
but should be separately reviewed if added later.

## Publication checklist

1. Complete native Finnish golf-language review and apply corrections.
2. Confirm `/fi/`, all 21 generated guides and both store links in a preview.
3. Confirm App Store Finland and Google Play Finland listings are live.
4. Add `fi` to `_data/routes.js`, `functions/go.js` and
   `functions/i/[[path]].js` in the same commit.
5. Run `npm run check`; `published-complete` must confirm all 29 page keys.
6. Deploy only after review. This preparation does not deploy anything.

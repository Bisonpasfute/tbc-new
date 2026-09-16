# Verification: what to run, and what each gate actually catches

**Source of truth:** the `scripts` block in `package.json` and `.github/workflows/run_tests.yml`.
Never quote a command from memory; print the current list:

```
node -e "console.log(require('./package.json').scripts)"
```

## Before you call a UI change done

```
npm run type-check     # node_modules/typescript/bin/tsc --noEmit — the whole repo, tools/ included
npm run lint:js        # npx oxlint ./ui
npm run test:unit      # vitest run — happy-dom, ui/**/*.test.ts(x)
npm run test:snapshots # store-contract test, then 17 golden spec protos
npm run fmt            # npx oxfmt ui --check
```

Add `npm run test:locales` whenever you touched `assets/locales/**` or `schemas/**`, and
`npm run lint:css` (stylelint over `ui/**/*.css`) whenever you touched a stylesheet. There is no
SCSS left in the tree.

What each one is actually for:

| Gate             | Catches                                                                                                                    | Does not catch                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `type-check`     | broken specifiers, alias mismatches, spec-config shape drift                                                               | a legal import that violates the layer direction                              |
| `lint:js`        | layer violations (`no-restricted-imports`), browser globals in `ui/sim` and feature models, hook-rule breaks, import order | anything not listed in `.oxlintrc.json` — `categories.correctness` is **off** |
| `test:unit`      | component and helper behaviour, the store hooks' gating                                                                    | anything without a `.test.ts(x)` beside it                                    |
| `test:snapshots` | the store notification contract, then serialization drift across all 17 specs                                              | rendering                                                                     |
| `fmt`            | `ui/` formatting only, `tools/` not in scope — and it does reformat `ui/`'s markdown, so `ui/README.md` and `ui/STYLING.md` are gated by it |                                                                               |

**Zero `no-restricted-imports` errors is the bar**, not "no new ones": the layer rules are the whole
point of the current tree, and `lint:js` is the only thing enforcing them anywhere.

## What CI runs — it is not the list above

`.github/workflows/run_tests.yml` has two jobs:

- **`build-ui`**: `npm ci`, `npm run test:locales`, then `make dist/tbc/.dirstamp`.
- **`test`**: four shards of `go test --tags=with_db ./sim/...` — the Go sim, not the UI.

`make dist/tbc/.dirstamp` is not a thin wrapper: through `dist/tbc/bundle/.dirstamp` it runs
`tsc --noEmit`, `npx tsx vite.build-workers.mts` and `npx vite build`, and it also builds
`dist/tbc/lib.wasm.gz`, `ui/generated/proto/api.ts` and the asset copies. So CI does type-check and
does build the bundle — through make, never by calling `vite build` directly.

**CI does not run oxlint, vitest, or the snapshot harness.** A layer violation, a failing unit test
and a golden diff all reach master green. Run them locally; nothing else will.

Read the current job list rather than trusting this section:

```
/usr/bin/grep -n "run:" -A3 .github/workflows/run_tests.yml
```

## Locales

`npm run test:locales` runs `test-locales.mjs`, which compiles each `schemas/<name>.schema.json`
with ajv and validates every `assets/locales/**/<name>.json` against it. Today that is `character`,
`talents` and `translation` — TBC ships only `assets/locales/en/`, no second locale. There is no
`glyphs` schema or locale file (TBC's proto has no `Glyphs` message). `gear.schema.json` exists but
matches no locale file, so it validates nothing; `assets/locales/en/updates.json` has no matching
schema either, so it is never validated by this script.

**Every schema sets `additionalProperties: false`**, so a new locale key needs a matching property in
`schemas/<name>.schema.json`. Skip the schema and CI fails on the very first job. Verify the
constraint rather than trusting it:

```
node -e "const j=require('./schemas/translation.schema.json'); const s=new Set(); (function w(o){if(!o||typeof o!=='object')return; if('additionalProperties' in o) s.add(String(o.additionalProperties)); for(const k in o) w(o[k]);})(j); console.log([...s])"
```

## The snapshot harness

**`tools/state-snapshots/` is developer-local and not tracked** (a line in `.git/info/exclude`
here, ahead of the harness itself landing — it is absent from this checkout). `test:snapshots` /
`test:snapshots:update` are not yet `package.json` scripts on this tree — check
`node -e "console.log(require('./package.json').scripts)"` before quoting either. Once they exist,
expect the same shape as the source port: they do nothing in a fresh clone, and the 17/17 figure a PR
quotes cannot be reproduced by a reviewer who does not have the harness, because it stays local —
`golden.json` is a multi-MB fixture and regenerating it is a fixture update, which only the repo
owner does. The `virtual:i18next-loader` alias the unit tests need should be a separate, **tracked**
file (`tools/vite/stub-i18n.js`), so `npm run test:unit` works in a fresh clone regardless.

`check.mjs` runs two passes, both as vite SSR builds into `tmp/harness/`
executed under happy-dom by `run.mjs` (which stubs `Worker` and serves `/tbc/assets/**` from the
checkout so `Database.get()` loads the real `db.bin`):

1. **`store-contract-test.ts`** first, fast-fail. It asserts the notification contract: one gated
   subscriber fire per facade write, equal-value writes suppressed, unconditional setters still
   notifying via version counters, `batch()` deferring to one fire with final state, the aggregate
   and composition selectors, the satellites, `Emitter`, `setGearAsync`. Nothing else runs if this
   fails.
2. **`snapshot.ts`** — for every launched spec, build `Sim` + `Player` in node, apply defaults,
   serialize player / sim / raid / encounter, and compare byte-for-byte against `golden.json`. It
   also asserts `fromProto(toProto(x))` is a fixed point per spec.

Quirks it encodes **on purpose** — do not "fix" them:

- `Sim.toProto` collapses all-selected filter arrays to `[]`; `Sim.fromProto` re-expands them, so
  the form is only a fixed point from the second pass and the harness canonicalizes once first.
- `Sim.fromProto` mutates its **argument** in place. Serialize before round-tripping.
- `sim.waitForInit()` never resolves under the stubbed `Worker` (it probes for wasm). Await
  `Database.get()` instead.
- `applySpecDefaults` in `snapshot.ts` mirrors `IndividualSimUI.applyDefaults` minus the UI-owned
  satellites. When defaults application moves into `ui/sim/state/`, replace the mirror with the real
  implementation — the snapshot diff then verifies the move.

`npm run test:snapshots:update` regenerates `golden.json`. **Never run it to make a red gate green,
and never commit a regenerated golden without asking** — diff the old and new JSON and confirm only
the fields you intended moved. The same rule covers every fixture in this repo.

Because the harness builds the real module graph, it is also the gate that catches a
module-evaluation-order cycle (see `layers.md`) — that failure looks like a crash in `new Player`.

## What no gate covers

Rendering, layout and interaction. None of the five commands above constructs the shell —
`tools/state-snapshots/snapshot.ts` imports `IndividualSimUIConfig` as a _type_ and mirrors
`applyDefaults` by hand, so the goldens prove no state write leaked into a component and say nothing
about whether anything rendered.

**There is a DOM-parity harness, and it is not in a fresh clone.** `tools/react-migration/` holds
~30 `.mjs` files: Playwright probes (`a11y.mjs`, `tabs-behaviour.mjs`, and one per tab and per
widget) over a shared `browser.mjs`. Each probe compares a built React branch against a built
baseline, both served first. Read `tools/react-migration/README.md` before running one — in
particular its `PORT` section: several of the gates silently measure the **baseline** unless you set
`PORT`, so a bare invocation can report a clean run of the wrong build.

The directory is **untracked**, not deleted, and whether the files are present depends on whether
that checkout's owner made them. `git log` knows nothing about it. It may or may not carry a
`.git/info/exclude` line — that file lives in the shared common git dir, so it applies to every
worktree of this clone but travels with none of them, and today it lists `tools/state-snapshots/`
but not `tools/react-migration/` or `tools/browser-perf/`. Check before concluding anything:

```
/usr/bin/ls tools/react-migration/ 2>/dev/null | wc -l
git check-ignore -v tools/react-migration
```

`tools/browser-perf/` (perf timings, not parity) behaves the same way.
If neither is present where you are working, running the page yourself is the fallback — see
`running-locally.md`. Either way, say in the PR what you ran or what you clicked.

## A fresh checkout needs generated files first

`npm run type-check` and every build need files that are gitignored and produced by Go tooling:
`ui/generated/proto/*` (`make ui/generated/proto/api.ts`) and the `*_auto_gen.ts` files
(`make go-to-ts`, which runs `go run ./tools/database/gen_db -gen=go-to-ts`) — today three:
`ui/sim/player/classes/capabilities_auto_gen.ts`, `ui/sim/bulk/constants_auto_gen.ts` and
`ui/sim/wasm/bulk_sim/constants_auto_gen.ts`. Copying them from a built checkout works and is
faster. Never run `gen_db` concurrently with another copy of itself.

The wart to watch for is a `AUTO_GEN_FILES_TS` entry the generator does not actually write: a stale
path there makes the prerequisite never appear, so every `make` that depends on it re-runs `gen_db`
and re-bundles even when nothing changed. After the restructure the three agree — deleting all
three and running `make go-to-ts` brings back byte-identical copies, and a second `make go-to-ts`
then says "Nothing to be done". Re-derive rather than trusting this paragraph:

```
/usr/bin/grep -n AUTO_GEN_FILES_TS makefile | head -1
/usr/bin/grep -rn 'constants_auto_gen.ts\"\|capabilities_auto_gen.ts\"' tools/database/
```

A fourth generated TS file, `ui/sim/constants/missing_effects_auto_gen.ts`, is *not* in that list and
is not written by `-gen=go-to-ts`: `tools/database/gen_effects.go` emits it during full database
generation, which needs `assets/db_inputs`. `ui/features/gear/item_notices.tsx` imports it, so a
checkout without it fails `type-check`. That has always been true here — master has the same
arrangement at the pre-port path — so copy the file in rather than trying to regenerate it.

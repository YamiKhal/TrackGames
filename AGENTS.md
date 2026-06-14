<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-agent-rules -->

# Coding Philosophy

Prefer simple, readable code over abstraction.

Do not create helper functions, utilities, hooks, classes, constants, or files unless:

* The logic is reused in multiple places.
* The logic is complex enough that extraction improves readability.
* The logic represents a meaningful domain concept.
* The logic isolates error-prone edge cases.

Inline simple transformations instead of extracting them into single-use helpers.

Avoid patterns such as:

* `normalizeColor()`
* `normalizeText()`
* `getAlignment()`
* `formatValue()`

when they are only used once.

Before extracting code, ask:

> Will this realistically be reused or significantly improve readability?

If not, keep it inline.

# Reuse Existing Code

Before implementing anything:

1. Search the repository for existing exports.
2. Search for existing types, utilities, components, hooks, and services.
3. Reuse or extend existing implementations whenever possible.
4. Prefer modification over duplication.

Do not create:

* Duplicate business logic.
* Utility wrappers around existing utilities.
* Near-identical components.
* Alternative versions of existing functionality.

If an existing implementation is at least 80% suitable, modify or extend it instead of creating a new one.

Examples:

Bad:

* `getCompactNumber()` when `formatNumber()` already exists
* `DisplayGameLite` when `DisplayGame` already exists
* `fetchTrendingGamesV2()` when `fetchTrendingGames()` already exists

Good:

* Extend `formatNumber()`
* Extend `DisplayGame`
* Modify `fetchTrendingGames()`

# React / Next.js

* Prefer local component state over unnecessary abstractions.
* Prefer direct JSX over helper render functions used once.
* Avoid premature optimization.
* Avoid creating files solely for future reuse.
* Keep data flow explicit and easy to trace.

# Architecture Principles

* Reuse existing exports whenever possible.
* Import existing types instead of redefining them.
* Favor explicit code over clever code.
* Minimize abstraction layers.
* Keep implementations simple and maintainable.

When introducing a new abstraction, explain why the existing implementation cannot be reused or extended.

<!-- END:project-agent-rules -->
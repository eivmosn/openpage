# Contribution Guide

## Environment

- Node.js `24.14.1`
- pnpm `10` or newer

Install dependencies:

```bash
pnpm install
```

The `prepare` script installs the `simple-git-hooks` pre-commit hook automatically.

## Quality Checks

Before submitting changes, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

The pre-commit hook runs `nano-staged`, which applies ESLint fixes only to staged code files.

## Commit Messages

Use Conventional Commits following the Angular convention:

```text
<type>(<scope>): <description>
```

Common types:

- `feat`: add user-facing functionality
- `fix`: correct a defect
- `perf`: improve runtime performance
- `refactor`: change code without changing behavior
- `docs`: update documentation
- `chore`: maintain tooling or dependencies
- `build`: change build configuration

Examples:

```text
feat(renderer): add generic adapter factories
fix(naive-ui): preserve input model updates
chore(repo): configure staged lint hooks
```

## Changelog

Generate or update `CHANGELOG.md` from Conventional Commit history:

```bash
pnpm changelog
```

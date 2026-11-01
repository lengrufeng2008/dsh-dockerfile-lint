# Dockerfile Lint for DSH

> Fast static Dockerfile heuristics: base tag, root user, sudo, remote shell, apt hygiene,
> remote ADD, secret-like build args, missing `.dockerignore`.

## Use

```bash
node bin/dsh-dockerfile-lint.mjs Dockerfile
node bin/dsh-dockerfile-lint.mjs Dockerfile --json
```

In DSH:

```text
Use dockerfile_lint with the Dockerfile path.
```

## Limits

- Static heuristics only; not a security audit, image scan, or build test
- Small rule set; false positives/negatives are possible
- Does not run Docker or inspect layers

## Tests

```bash
npm test
```

## Provenance

A small independent static checker. License: MIT.

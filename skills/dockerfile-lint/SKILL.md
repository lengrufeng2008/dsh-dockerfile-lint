---
name: dockerfile-lint
description: Static Dockerfile heuristics for base tags, root user, sudo, remote shell, apt hygiene, remote ADD, secret-like build args, and missing .dockerignore. Read-only.
whenToUse: "A Dockerfile changed and a fast static review is needed before a build."
---

# Dockerfile lint

```text
Use dockerfile_lint with the Dockerfile path.
```

Rules include: pinned base image, non-root `USER`, no `sudo`, no remote `curl|sh`, apt
`--no-install-recommends` + cleanup, no remote `ADD`, no secret-like `ENV`/`ARG`, `.dockerignore`.

## Limits

- Static heuristics only; not a security audit, image scan, or build test.
- Rule coverage is intentionally small; false positives/negatives are possible.
- It does not run Docker or inspect layers.

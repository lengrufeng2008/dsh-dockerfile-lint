#!/usr/bin/env node
import { lintDockerfile, renderMarkdown } from '../src/lint.mjs'
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) { console.log('dsh-dockerfile-lint <Dockerfile> [--json]\\n\\nStatic Dockerfile heuristics.'); process.exit(0) }
const file = args.find((a) => !a.startsWith('--'))
if (!file) { console.error('dsh-dockerfile-lint: Dockerfile path required'); process.exit(2) }
try {
  const r = await lintDockerfile(file)
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2))
  else console.log(renderMarkdown(r))
  process.exitCode = r.verdict === 'BLOCK' ? 1 : 0
} catch (error) { console.error(`dsh-dockerfile-lint: ${error.message}`); process.exitCode = 2 }

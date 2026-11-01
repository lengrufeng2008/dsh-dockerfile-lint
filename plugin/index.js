import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lintDockerfile, renderMarkdown } from '../src/lint.mjs'
const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const SKILL_PATH = join(PLUGIN_DIR, '..', 'skills', 'dockerfile-lint', 'SKILL.md')
const PROVIDER = 'dsh-dockerfile-lint'
export const name = 'dockerfile-lint'
export const inject = ['tools', 'skills']
function stripFrontmatter(text) { if (!text.startsWith('---\n')) return text; const end = text.indexOf('\n---\n', 4); return end === -1 ? text : text.slice(end + 5) }
const summary = { name: 'dockerfile-lint', description: 'Static Dockerfile heuristics: base tag, root user, sudo, remote shell, apt hygiene, remote ADD, secret-like build args, missing .dockerignore.', whenToUse: 'A Dockerfile changed and a fast static review is needed before a build.', invocation: { modelInvocable: true, userInvocable: true }, source: 'bundled', provider: PROVIDER, resourceBase: { kind: 'directory', path: join(PLUGIN_DIR, '..', 'skills', 'dockerfile-lint') }, rank: 600, locator: 'dockerfile-lint', metadata: { domain: 'devops', version: '0.1.0' } }
export function apply(ctx) {
  ctx.tools.register({ name: 'dockerfile_lint', description: 'Static Dockerfile heuristics. Read-only; not a security audit, build test, or image scanner.', parameters: { type: 'object', additionalProperties: false, properties: { path: { type: 'string' } }, required: ['path'] }, output: { schema: { type: 'object', additionalProperties: false, properties: { markdown: { type: 'string' }, verdict: { type: 'string' }, findings: { type: 'integer' }, high: { type: 'integer' } }, required: ['markdown', 'verdict', 'findings', 'high'] }, render: (_a, v) => [{ type: 'text', text: v.markdown }] }, timeoutMs: 20_000, async execute(args = {}) { const r = await lintDockerfile(args.path); return { markdown: renderMarkdown(r), verdict: r.verdict, findings: r.findings.length, high: r.findings.filter((f) => f.severity === 'high').length } } })
  ctx.skills.registerProvider(() => ({ name: PROVIDER, async list() { return [summary] }, async get(c) { if (c?.name !== 'dockerfile-lint') return undefined; return { ...summary, content: stripFrontmatter(await readFile(SKILL_PATH, 'utf8')) } } }))
}

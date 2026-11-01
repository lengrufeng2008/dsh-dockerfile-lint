import { readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
export function lintDockerfileText(text, name = 'Dockerfile') {
  const findings = []
  const lines = text.split('\n')
  let userSeen = false
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw || raw.startsWith('#')) continue
    const line = i + 1
    const upper = raw.toUpperCase()
    if (/^FROM\s+/i.test(raw)) {
      const image = raw.replace(/^FROM\s+/i, '').split(/\s+/)[0]
      if (!image.includes(':') && !image.includes('@') || /:latest$/i.test(image)) findings.push({ severity: 'warning', rule: 'base-tag', line, message: `pin a base image tag/digest: ${image}` })
    }
    if (/^USER\s+/i.test(raw)) { userSeen = true; if (/^USER\s+(?:root|0)\s*$/i.test(raw)) findings.push({ severity: 'warning', rule: 'root-user', line, message: 'container runs as root' }) }
    if (/^RUN\s+/i.test(raw) && /sudo\s+/i.test(raw)) findings.push({ severity: 'warning', rule: 'sudo', line, message: 'sudo in a container build is fragile' })
    if (/^RUN\s+/i.test(raw) && /(?:curl|wget)[^\n|]{0,200}\|\s*(?:ba|z)?sh/i.test(raw)) findings.push({ severity: 'high', rule: 'remote-shell', line, message: 'remote download piped into a shell' })
    if (/apt-get\s+install/i.test(raw)) {
      if (!/--no-install-recommends/i.test(raw)) findings.push({ severity: 'warning', rule: 'apt-recommends', line, message: 'apt-get install without --no-install-recommends' })
      if (!/rm\s+-rf\s+\/var\/lib\/apt\/lists/i.test(raw)) findings.push({ severity: 'warning', rule: 'apt-cleanup', line, message: 'apt lists not cleaned in the same layer' })
    }
    if (/^ADD\s+https?:/i.test(raw)) findings.push({ severity: 'warning', rule: 'add-remote', line, message: 'prefer COPY; remote ADD is opaque' })
    if (/^(?:ENV|ARG)\s+.*(?:PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)/i.test(raw)) findings.push({ severity: 'high', rule: 'secret-build-arg', line, message: 'secret-like build env/arg; do not bake secrets into layers' })
  }
  if (!userSeen) findings.push({ severity: 'warning', rule: 'no-user', line: lines.length, message: 'no USER instruction; image may run as root' })
  const severity = findings.some((f) => f.severity === 'high') ? 'BLOCK' : findings.length ? 'WARN' : 'PASS'
  return { name, findings, verdict: severity }
}
export async function lintDockerfile(path) {
  const info = await stat(path).catch(() => null)
  if (!info?.isFile()) throw new Error(`Dockerfile not found: ${path}`)
  const result = lintDockerfileText(await readFile(path, 'utf8'), path.split('/').pop())
  const ignore = await stat(join(dirname(path), '.dockerignore')).catch(() => null)
  if (!ignore) result.findings.push({ severity: 'info', rule: 'no-dockerignore', line: 0, message: '.dockerignore not found next to the Dockerfile' })
  result.verdict = result.findings.some((f) => f.severity === 'high') ? 'BLOCK' : result.findings.some((f) => f.severity === 'warning') ? 'WARN' : 'PASS'
  return result
}
export function renderMarkdown(r) {
  const lines = [`# Dockerfile lint: ${r.verdict}`, '', `- findings: ${r.findings.length}`, '']
  for (const f of r.findings) lines.push(`- ${f.severity.toUpperCase()} ${f.rule} line ${f.line}: ${f.message}`)
  if (!r.findings.length) lines.push('No issues under these checks.')
  lines.push('', 'Static heuristics only; not a security audit or a build test.')
  return lines.join('\n')
}

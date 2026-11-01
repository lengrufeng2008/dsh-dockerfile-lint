import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lintDockerfile } from '../src/lint.mjs'
import { apply } from '../plugin/index.js'
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
test('flags remote shell and secret-like build arg', async () => {
  const r = await lintDockerfile(join(ROOT, 'test/fixtures/Dockerfile.bad'))
  assert.equal(r.verdict, 'BLOCK')
  assert.ok(r.findings.some((f) => f.rule === 'remote-shell'))
  assert.ok(r.findings.some((f) => f.rule === 'secret-build-arg'))
})
test('CLI exits 1 on BLOCK and plugin registers', async () => {
  const c = spawnSync(process.execPath, [join(ROOT, 'bin/dsh-dockerfile-lint.mjs'), join(ROOT, 'test/fixtures/Dockerfile.bad')], { encoding: 'utf8' })
  assert.equal(c.status, 1)
  const tools = []; let factory
  apply({ tools: { register: (t) => tools.push(t) }, skills: { registerProvider: (fn) => { factory = fn } } })
  assert.equal(tools[0].name, 'dockerfile_lint')
  const result = await tools[0].execute({ path: join(ROOT, 'test/fixtures/Dockerfile.good') })
  assert.equal(result.verdict, 'PASS')
  assert.equal((await factory().list())[0].name, 'dockerfile-lint')
})

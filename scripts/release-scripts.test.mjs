import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { isReleaseVersion } from './semver.mjs';
import { classifyView, publishAll, PACKAGES } from './publish-packages.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('accepts strict SemVer release versions', () => {
  for (const version of ['0.1.0', '1.2.3', '10.20.30', '0.2.0-rc.1', '1.0.0-alpha', '1.0.0-0', '1.0.0-x-y.7.z-9']) {
    assert.equal(isReleaseVersion(version), true, version);
  }
});

test('rejects invalid or ambiguous versions', () => {
  for (const version of ['01.2.3', '0.02.3', '0.2.0-rc..1', '0.2.0-', '0.2.0-rc.01', '1.2', '1.2.3+build', 'v1.2.3', ' 1.2.3', '1.2.3-rc_1', '', undefined]) {
    assert.equal(isReleaseVersion(version), false, String(version));
  }
});

test('classifies registry lookups', () => {
  assert.equal(classifyView({ status: 0, stdout: '0.1.0\n' }, '0.1.0'), 'published');
  assert.equal(classifyView({ status: 0, stdout: '' }, '0.1.0'), 'missing');
  assert.equal(classifyView({ status: 1, stderr: 'npm error code E404' }, '0.1.0'), 'missing');
  assert.equal(classifyView({ status: 1, stderr: 'npm error code E401' }, '0.1.0'), 'error');
  assert.equal(classifyView({ status: 1, stderr: 'npm error code E403' }, '0.1.0'), 'error');
  assert.equal(classifyView({ status: 1, stderr: 'npm error code ECONNRESET' }, '0.1.0'), 'error');
});

// A fake npm: `published` lists package names already in the registry; `fail` maps a command to an error.
function fakeNpm({ published = [], viewError, publishError } = {}) {
  const calls = [];
  const run = (args) => {
    calls.push(args.slice(0, 2).join(' '));
    if (args[0] === 'view') {
      if (viewError) return { status: 1, stderr: viewError };
      const [spec] = args.slice(1, 2);
      const name = spec.slice(0, spec.lastIndexOf('@'));
      return published.includes(name)
        ? { status: 0, stdout: `${spec.slice(spec.lastIndexOf('@') + 1)}\n` }
        : { status: 1, stderr: 'npm error code E404' };
    }
    return publishError ? { status: 1, stderr: publishError } : { status: 0 };
  };
  return { run, calls };
}

test('a rerun skips packages that already published and publishes the rest', async () => {
  const { run, calls } = fakeNpm({ published: ['@mzebley-aem/target-line-chart'] });
  await publishAll({ root, run, log: () => {} });
  assert.equal(calls.filter((call) => call.startsWith('publish')).length, PACKAGES.length - 1);
  assert.ok(!calls.some((call) => call.includes('packages/target-line-chart') && call.startsWith('publish')));
});

test('stops on registry errors other than not found', async () => {
  const { run, calls } = fakeNpm({ viewError: 'npm error code E401\nUnable to authenticate' });
  await assert.rejects(publishAll({ root, run, log: () => {} }), /Could not check.*\n.*E401/s);
  assert.ok(!calls.some((call) => call.startsWith('publish')));
});

test('stops when a publish fails', async () => {
  const { run, calls } = fakeNpm({ publishError: 'npm error code E403' });
  await assert.rejects(publishAll({ root, run, log: () => {} }), /Publishing @mzebley-aem\/target-line-chart@.* failed/);
  assert.equal(calls.filter((call) => call.startsWith('publish')).length, 1);
});

test('dry run publishes nothing', async () => {
  const { run, calls } = fakeNpm();
  await publishAll({ root, run, dryRun: true, log: () => {} });
  assert.ok(!calls.some((call) => call.startsWith('publish')));
});

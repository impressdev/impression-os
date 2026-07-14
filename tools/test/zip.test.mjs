// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zip } from '../lib/zip.js';

test('zip() produces a well-formed archive (signatures + entry count)', () => {
  const buf = zip([{ name: 'a.txt', data: 'hello' }, { name: 'dir/b.json', data: '{"x":1}' }]);
  assert.ok(Buffer.isBuffer(buf));
  assert.deepEqual([...buf.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04], 'starts with local file header PK\\x03\\x04');
  // End-of-central-directory record: last 22 bytes, signature PK\x05\x06
  const eocd = buf.subarray(buf.length - 22);
  assert.deepEqual([...eocd.subarray(0, 4)], [0x50, 0x4b, 0x05, 0x06], 'ends with EOCD PK\\x05\\x06');
  assert.equal(eocd.readUInt16LE(10), 2, 'two entries in the archive');
  assert.ok(buf.includes(Buffer.from('hello')), 'stored content is present');
});

test('the archive unzips to the original files', () => {
  const buf = zip([{ name: 'kit.json', data: '{"ok":true}' }, { name: 'templates/hero.json', data: '{"h":1}' }]);
  const dir = mkdtempSync(join(tmpdir(), 'ios-zip-'));
  const archive = join(dir, 'out.zip');
  writeFileSync(archive, buf);
  const listing = execFileSync('unzip', ['-l', archive], { encoding: 'utf8' });
  assert.match(listing, /kit\.json/);
  assert.match(listing, /templates\/hero\.json/);
  const kit = execFileSync('unzip', ['-p', archive, 'kit.json'], { encoding: 'utf8' });
  assert.equal(JSON.parse(kit).ok, true);
});

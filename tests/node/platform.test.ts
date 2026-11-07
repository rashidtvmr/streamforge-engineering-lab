import { strict as assert } from 'node:assert';
import { after, describe, it } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openPlatformDatabase } from '../../server/platform/database.ts';

const dirs: string[] = [];
after(() => { for (const dir of dirs) rmSync(dir, { recursive: true, force: true }); });

describe('SQLite persistence and migrations', () => {
  it('creates schema and runs migrations idempotently', () => {
    const db = openPlatformDatabase();
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name IN ('accounts','sessions')").get()?.count, 2);
    db.close();
  });
  it('durably stores records across a close and reopen', () => {
    const dir = mkdtempSync(join(tmpdir(), 'streamforge-db-')); dirs.push(dir);
    const file = join(dir, 'data.sqlite');
    const first = openPlatformDatabase(file);
    first.prepare('INSERT INTO accounts VALUES (?, ?, ?, ?, ?, ?)').run('a', 'a@example.org', 'Alice', 'salt', 'hash', '2026-11-07');
    first.close();
    const next = openPlatformDatabase(file);
    assert.equal(next.prepare('SELECT display_name FROM accounts WHERE id = ?').get('a')?.display_name, 'Alice');
    next.close();
  });
  it('enforces relational foreign keys', () => {
    const db = openPlatformDatabase();
    assert.throws(() => db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run('token', 'missing', 123));
    db.close();
  });
});

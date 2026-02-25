// tests/unit/chimera.test.js
import assert from 'node:assert';
import { test } from 'node:test';
import { Chimera } from '../../dist/sdk/chimera.js';

test('Chimera should instantiate without errors', () => {
  const chimera = new Chimera();
  assert.ok(chimera instanceof Chimera);
  assert.ok(chimera.chainManager);
  assert.ok(chimera.deployer);
});

test('Chimera should have deploy method', () => {
  const chimera = new Chimera();
  assert.equal(typeof chimera.deploy, 'function');
});

test('Chimera should have connect method', () => {
  const chimera = new Chimera();
  assert.equal(typeof chimera.connect, 'function');
});

test('Chimera should have getChains method', () => {
  const chimera = new Chimera();
  assert.equal(typeof chimera.getChains, 'function');
});
// tests/unit/deployer.test.js
import assert from 'node:assert';
import { test } from 'node:test';
import { Deployer } from '../../dist/sdk/deployer.js';
import fs from 'node:fs';
import path from 'node:path';

test('Deployer should have deployToChain method', () => {
  const deployer = new Deployer();
  assert.equal(typeof deployer.deployToChain, 'function');
});
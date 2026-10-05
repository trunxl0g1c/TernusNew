import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve('assets/js');
const graph = new Map();
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith('.js')) {
      const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      if (check.status !== 0) throw new Error(check.stderr);
      const dependencies = [
        ...fs.readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g),
      ].map((match) => {
        if (!match[1].startsWith('.')) throw new Error(`Non-local browser dependency: ${match[1]}`);
        const dependency = path.resolve(path.dirname(file), match[1]);
        if (!fs.existsSync(dependency)) throw new Error(`Missing import: ${dependency}`);
        return dependency;
      });
      graph.set(file, dependencies);
    }
  }
}
walk(root);
const done = new Set();
function visit(file, stack = []) {
  if (stack.includes(file))
    throw new Error(`Circular dependency: ${[...stack, file].join(' -> ')}`);
  if (done.has(file)) return;
  for (const dependency of graph.get(file) || []) visit(dependency, [...stack, file]);
  done.add(file);
}
for (const file of graph.keys()) visit(file);
console.log(
  `${graph.size} JavaScript modules: syntax and local imports valid; no circular dependencies.`,
);

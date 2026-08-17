import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { GenerationResultStore } from "../../src/generators/persistence/generation-result-store.mjs";
import { GENERATION_ERROR_CODES as C } from "../../src/generators/generation-errors.mjs";
import { loadJson } from "./test-helpers.mjs";
import { clone } from "./generation-test-helpers.mjs";

const fixture = () => clone(loadJson("tests/fixtures/generation_result/mock_provider_success.json"));
const temporaryStore = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "design-builder-generations-"));
  return { directory, store: new GenerationResultStore({ baseDirectory: directory }) };
};
const cleanup = (directory) => {
  const resolved = path.resolve(directory);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) throw new Error("Refusing to clean a non-temporary directory.");
  fs.rmSync(resolved, { recursive: true, force: true });
};

test("persistence saves and loads a schema-valid result", () => {
  const { directory, store } = temporaryStore();
  try {
    const result = fixture();
    const saved = store.save(result);
    assert.equal(saved.persisted, true);
    assert.equal(fs.existsSync(saved.path), true);
    assert.deepEqual(store.load(result.generation_id), result);
  } finally { cleanup(directory); }
});

test("persistence rejects schema-invalid result", () => {
  const { directory, store } = temporaryStore();
  try {
    const result = fixture();
    delete result.project_id;
    assert.throws(() => store.save(result), (error) => error.code === C.INVALID_GENERATION_RESULT);
  } finally { cleanup(directory); }
});

test("persistence rejects unsafe generation ID", () => {
  const { directory, store } = temporaryStore();
  try { assert.throws(() => store.resultPath("../escape"), (error) => error.code === C.PERSISTENCE_FAILED); }
  finally { cleanup(directory); }
});

test("persistence does not overwrite by default", () => {
  const { directory, store } = temporaryStore();
  try {
    const result = fixture();
    store.save(result);
    assert.throws(() => store.save(result), (error) => error.code === C.PERSISTENCE_FAILED);
  } finally { cleanup(directory); }
});

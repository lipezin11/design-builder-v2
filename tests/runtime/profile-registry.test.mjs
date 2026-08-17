import test from "node:test";
import assert from "node:assert/strict";
import { CompilerError, COMPILER_ERROR_CODES } from "../../src/compiler/compiler-errors.mjs";
import { GeneratorProfileRegistry } from "../../src/generators/registry/generator-profile-registry.mjs";

test("Profile Registry: returns an existing profile", () => {
  const registry = new GeneratorProfileRegistry();
  assert.equal(registry.getProfile("profile-hypothetical-v1").profile_type, "HYPOTHETICAL_TEST_PROFILE");
  assert.equal(registry.hasProfile("profile-hypothetical-v1"), true);
});

test("Profile Registry: missing profile fails explicitly", () => {
  const registry = new GeneratorProfileRegistry();
  assert.throws(() => registry.getProfile("missing"), (error) => error instanceof CompilerError && error.code === COMPILER_ERROR_CODES.PROFILE_NOT_FOUND);
});

test("Profile Registry: resolves an exact target without fallback", () => {
  const registry = new GeneratorProfileRegistry();
  const profile = registry.getProfile("profile-hypothetical-edit-v1");
  const resolved = registry.resolveProfile({ provider: profile.provider, model_family: profile.model_family, model_name: profile.model_name, profile_id: profile.profile_id, profile_version: profile.profile_version });
  assert.equal(resolved.adapter_id, "hypothetical-edit-test-adapter");
});

test("Profile Registry: invalid profile is rejected", () => {
  const registry = new GeneratorProfileRegistry();
  const invalid = registry.getProfile("profile-hypothetical-v1");
  invalid.profile_type = "REAL_PRODUCT";
  const result = registry.validateProfile(invalid);
  assert.equal(result.valid, false);
  assert.throws(() => new GeneratorProfileRegistry([invalid]), (error) => error.code === COMPILER_ERROR_CODES.INVALID_PROFILE);
});
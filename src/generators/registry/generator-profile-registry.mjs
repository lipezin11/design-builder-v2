import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { CompilerError, COMPILER_ERROR_CODES } from "../../compiler/compiler-errors.mjs";
import { assertValidProfile, validateProfile } from "./profile-validator.mjs";

const PROFILE_FILES = [
  "profiles/hypothetical-rich-generator.json",
  "profiles/hypothetical-limited-generator.json",
  "profiles/hypothetical-edit-generator.json"
];
const readProfile = (relativePath) => JSON.parse(fs.readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8"));
const clone = (value) => structuredClone(value);

export class GeneratorProfileRegistry {
  constructor(profiles = PROFILE_FILES.map(readProfile)) {
    this.profiles = new Map();
    for (const profile of profiles) {
      assertValidProfile(profile);
      if (this.profiles.has(profile.profile_id)) throw new CompilerError(COMPILER_ERROR_CODES.INVALID_PROFILE, `Duplicate profile_id: ${profile.profile_id}`);
      this.profiles.set(profile.profile_id, clone(profile));
    }
  }

  hasProfile(profileId) { return this.profiles.has(profileId); }
  getProfile(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) throw new CompilerError(COMPILER_ERROR_CODES.PROFILE_NOT_FOUND, `Generator profile not found: ${profileId}`, { profile_id: profileId });
    return clone(profile);
  }
  listProfiles() { return [...this.profiles.values()].map(clone).sort((a, b) => a.profile_id.localeCompare(b.profile_id)); }
  validateProfile(profile) { return validateProfile(profile); }
  resolveProfile(targetGenerator) {
    const profile = this.getProfile(targetGenerator?.profile_id);
    const mismatches = ["profile_version", "provider", "model_family", "model_name"].filter((field) => targetGenerator?.[field] !== profile[field]);
    if (mismatches.length > 0) throw new CompilerError(COMPILER_ERROR_CODES.PROFILE_TARGET_MISMATCH, "Target generator does not match the registered profile.", { mismatches, profile_id: profile.profile_id });
    return profile;
  }
}

export const generatorProfileRegistry = new GeneratorProfileRegistry();
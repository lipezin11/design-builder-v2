import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();

const schemaPath = path.join(root, "schemas", "brief_spec.schema.json");
const fixturesDir = path.join(root, "tests", "fixtures", "brief_spec");

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
});

addFormats(ajv);

const validate = ajv.compile(schema);

const files = fs
  .readdirSync(fixturesDir)
  .filter((file) => file.endsWith(".json"));

let failed = false;

for (const file of files) {
  const fullPath = path.join(fixturesDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  const valid = validate(data);

  if (valid) {
    console.log(`✅ ${file}`);
  } else {
    failed = true;
    console.log(`❌ ${file}`);
    console.dir(validate.errors, { depth: null });
  }
}

if (failed) {
  process.exit(1);
}

console.log("\nTodos os fixtures passaram no brief_spec.schema.json.");
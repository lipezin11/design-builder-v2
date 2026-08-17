import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schemaName = process.argv[2];

if (!schemaName) {
  console.error(
    " Informe o schema. Exemplo:\n" +
    "node scripts/validate_schema.mjs reference_transfer_plan"
  );
  process.exit(1);
}

const root = process.cwd();

const schemaPath = path.join(
  root,
  "schemas",
  `${schemaName}.schema.json`
);

const fixturesDir = path.join(
  root,
  "tests",
  "fixtures",
  schemaName
);

if (!fs.existsSync(schemaPath)) {
  console.error(` Schema não encontrado: ${schemaPath}`);
  process.exit(1);
}

if (!fs.existsSync(fixturesDir)) {
  console.error(` Fixtures não encontrados: ${fixturesDir}`);
  process.exit(1);
}

const schema = JSON.parse(
  fs.readFileSync(schemaPath, "utf8")
);

const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});

addFormats(ajv);

const validate = ajv.compile(schema);

const files = fs
  .readdirSync(fixturesDir)
  .filter(file => file.endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error(` Nenhum fixture encontrado em ${fixturesDir}`);
  process.exit(1);
}

let failed = false;

for (const file of files) {
  const fullPath = path.join(fixturesDir, file);

  try {
    const data = JSON.parse(
      fs.readFileSync(fullPath, "utf8")
    );

    const valid = validate(data);

    if (valid) {
      console.log(` ${file}`);
    } else {
      failed = true;
      console.log(` ${file}`);
      console.dir(validate.errors, { depth: null });
    }
  } catch (error) {
    failed = true;
    console.log(`💥 ${file}`);
    console.error(error.message);
  }
}

if (failed) {
  console.error(`\n ${schemaName}: validação falhou.`);
  process.exit(1);
}

console.log(
  `\n ${schemaName}: todos os ${files.length} fixtures passaram.`
);

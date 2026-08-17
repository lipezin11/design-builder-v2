import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadApprovedDirectionMemory } from "../src/my-eyes/approved-direction-memory-loader.mjs";
import { appendHumanReason, persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(rootDir, "data", "my_eyes", "approved_direction_memory.json");
const rl = createInterface({ input, output });
try {
  const memory = loadApprovedDirectionMemory(manifestPath, { rootDir, verifyFiles: true });
  console.log("\nImagens disponíveis:");
  for (const image of memory.images.filter((item) => item.availability === "AVAILABLE")) console.log(`${image.image_id} | ${image.original_filename} | ${image.source_bucket}`);
  const imageId = (await rl.question("\nimage_id: ")).trim();
  const rawText = await rl.question("Razão humana literal: ");
  if (!memory.images.some((item) => item.image_id === imageId)) throw new Error(`image_id inexistente: ${imageId}`);
  if (!rawText.trim()) throw new Error("A razão literal é obrigatória.");
  console.log(`\nSerá registrado sem reescrita:\n${imageId}\n${rawText}`);
  const confirmed = (await rl.question("Confirmar gravação? [s/N]: ")).trim().toLowerCase();
  if (!['s','sim','y','yes'].includes(confirmed)) { console.log("Nada foi gravado."); process.exitCode = 0; }
  else {
    const result = appendHumanReason({ memory, image_id: imageId, raw_text: rawText });
    persistApprovedDirectionMemory({ manifestPath, memory: result.memory });
    console.log(`Razão ${result.reason.reason_id} registrada como HUMAN, versão ${result.reason.version}.`);
  }
} catch (error) {
  console.error(`${error.code ? `${error.code}: ` : ""}${error.message}`);
  process.exitCode = 1;
} finally { rl.close(); }
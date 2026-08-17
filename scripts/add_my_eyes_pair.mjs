import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadApprovedDirectionMemory } from "../src/my-eyes/approved-direction-memory-loader.mjs";
import { appendPairwisePreference, persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(rootDir, "data", "my_eyes", "approved_direction_memory.json");
const rl = createInterface({ input, output });
try {
  const memory = loadApprovedDirectionMemory(manifestPath, { rootDir, verifyFiles: true });
  console.log("\nImagens disponíveis:");
  for (const image of memory.images.filter((item) => item.availability === "AVAILABLE")) console.log(`${image.image_id} | ${image.original_filename} | ${image.source_bucket}`);
  const left = (await rl.question("\nleft_image_id: ")).trim();
  const right = (await rl.question("right_image_id: ")).trim();
  const choice = (await rl.question("Escolha humana [LEFT/RIGHT/TIE]: ")).trim().toUpperCase();
  const hard = (await rl.question("É HARD_PAIR? [s/N]: ")).trim().toLowerCase();
  const context = await rl.question("Contexto da comparação: ");
  const reason = await rl.question("Razão humana literal opcional (Enter para nenhuma): ");
  const ids = new Set(memory.images.map((item) => item.image_id));
  if (!ids.has(left) || !ids.has(right)) throw new Error("Os dois image_ids precisam existir.");
  if (left === right) throw new Error("Uma imagem não pode ser comparada consigo mesma.");
  if (!['LEFT','RIGHT','TIE',left,right].includes(choice)) throw new Error("Escolha inválida; use LEFT, RIGHT, TIE ou o image_id escolhido.");
  if (!context.trim()) throw new Error("O contexto da comparação é obrigatório.");
  const pairType = ['s','sim','y','yes'].includes(hard) ? "HARD_PAIR" : "STANDARD_PAIR";
  console.log(`\nComparação: ${left} vs ${right}\nEscolha: ${choice}\nTipo: ${pairType}\nContexto: ${context}\nRazão: ${reason || '(nenhuma)'}`);
  const confirmed = (await rl.question("Confirmar gravação? [s/N]: ")).trim().toLowerCase();
  if (!['s','sim','y','yes'].includes(confirmed)) { console.log("Nada foi gravado."); process.exitCode = 0; }
  else {
    const result = appendPairwisePreference({ memory, left_image_id: left, right_image_id: right, human_choice: choice, pair_type: pairType, comparison_context: context, ...(reason ? { human_reason_raw: reason } : {}) });
    persistApprovedDirectionMemory({ manifestPath, memory: result.memory });
    console.log(`Pair ${result.pair.pair_id} registrado como HUMAN, versão ${result.pair.version}.`);
    if (result.human_reason) console.log(`Razão literal vinculada: ${result.human_reason.reason_id}.`);
  }
} catch (error) {
  console.error(`${error.code ? `${error.code}: ` : ""}${error.message}`);
  process.exitCode = 1;
} finally { rl.close(); }
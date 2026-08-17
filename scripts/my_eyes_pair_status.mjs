import fs from "node:fs";
import path from "node:path";
import { loadPairwiseSession } from "../src/my-eyes/pairwise-session-store.mjs";

const root = process.cwd();
const directory = path.join(root, "data", "my_eyes", "pairwise", "sessions");
const files = fs.existsSync(directory) ? fs.readdirSync(directory).filter((name) => /^MYE_PAIR_SESSION_\d{6}(?:\.v\d{6})?\.json$/.test(name)).sort() : [];
if (files.length === 0) throw new Error("No pairwise session artifacts were found.");
const latest = files.at(-1);
const session = loadPairwiseSession(path.join(directory, latest));
console.log(JSON.stringify({ file: latest, session_id: session.session_id, session_version: session.session_version, status: session.status, summary: session.summary, pairs: session.pairs.map((pair) => ({ pair_id: pair.pair_id, pair_type: pair.pair_type, image_a: pair.image_a.source_path, image_b: pair.image_b.source_path, human_decision_status: pair.human_decision.status })) }, null, 2));

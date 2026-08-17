import fs from "node:fs";
import path from "node:path";
import { appendHumanPairDecision, loadPairwiseSession, persistPairwiseSessionVersion } from "../src/my-eyes/pairwise-session-store.mjs";

const entries = [];
const tokens = process.argv.slice(2);
for (let index = 0; index < tokens.length; index += 1) if (tokens[index].startsWith("--")) entries.push([tokens[index].slice(2), tokens[index + 1]]);
const args = Object.fromEntries(entries);
if (!args.pair || !args.winner) throw new Error("Usage: --pair MYE_PAIRSEL_000001 --winner A|B|TIE [--raw text] [--winner-reason text] [--loser-reason text] [--keep text] [--difficulty EASY|MEDIUM|HARD] [--dimension text]");
const root = process.cwd();
const directory = path.join(root, "data", "my_eyes", "pairwise", "sessions");
const files = fs.readdirSync(directory).filter((name) => /^MYE_PAIR_SESSION_000001(?:\.v\d{6})?\.json$/.test(name)).sort();
if (!files.length) throw new Error("MYE_PAIR_SESSION_000001 was not found.");
const session = loadPairwiseSession(path.join(directory, files.at(-1)));
const updated = appendHumanPairDecision({ session, pair_id: args.pair, winner: args.winner, raw_reason: args.raw, winner_reason: args["winner-reason"], loser_reason: args["loser-reason"], keep_from_loser: args.keep, decision_difficulty: args.difficulty, decisive_visual_dimension: args.dimension, source_ref: "my-eyes-cli://explicit-human-pair-response" });
const persisted = persistPairwiseSessionVersion({ root_dir: root, session: updated });
console.log(JSON.stringify({ pair_id: args.pair, winner: updated.pairs.find((pair) => pair.pair_id === args.pair).human_decision.winner, session_version: updated.session_version, status: updated.status, path: path.relative(root, persisted.path).replaceAll("\\", "/"), scores_created: 0, weights_created: 0, inferred_preferences_created: 0 }, null, 2));

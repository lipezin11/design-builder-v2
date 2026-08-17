import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateApprovedDirectionMemory } from "../../src/my-eyes/approved-direction-memory-loader.mjs";
import { appendPreferenceCandidates, appendPreferenceRevision, PreferenceInferenceError, upgradeMemoryForPreferenceCandidates } from "../../src/my-eyes/preference-candidate-store.mjs";
import { buildPreferenceCandidatesV1, PREFERENCE_INFERENCE_V1_DECISIONS, renderPreferenceInferenceReport } from "../../src/my-eyes/preference-inference-v1.mjs";

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const fixedNow=()=>new Date("2026-08-15T20:00:00.000Z");
const loadReal=()=>JSON.parse(fs.readFileSync(path.join(projectRoot,"data","my_eyes","approved_direction_memory.json"),"utf8"));
const baseMemory=()=>{const memory=loadReal();memory.inferred_preferences=[];return upgradeMemoryForPreferenceCandidates(memory)};
const buildValidated=()=>{const memory=baseMemory();const candidates=buildPreferenceCandidatesV1({memory,now:fixedNow});return appendPreferenceCandidates({memory,candidates,now:fixedNow})};
const mutateAndValidate=(mutation,index=0)=>{const memory=buildValidated();mutation(memory.inferred_preferences[index],memory);return validateApprovedDirectionMemory(memory)};

test("Preference Inference v1 creates seven audit-ready candidates from convergent evidence",()=>{
  const memory=buildValidated();
  assert.equal(memory.inferred_preferences.length,7);
  assert.equal(memory.summary.human_confirmed_generalized_preference_count,0);
  assert.equal(validateApprovedDirectionMemory(memory).valid,true);
});

test("candidate requires supporting evidence",()=>{
  const result=mutateAndValidate(candidate=>{candidate.supporting_evidence_refs=[]});
  assert.equal(result.valid,false);
});

test("candidate requires explicit context",()=>{
  const result=mutateAndValidate(candidate=>{delete candidate.scope});
  assert.equal(result.valid,false);
});

test("candidate requires explicitly_not_claimed",()=>{
  const result=mutateAndValidate(candidate=>{candidate.explicitly_not_claimed=[]});
  assert.equal(result.valid,false);
});

test("every system candidate starts human_confirmed=false",()=>{
  const memory=buildValidated();
  assert.equal(memory.inferred_preferences.every(item=>item.human_confirmed===false),true);
});

test("SYSTEM cannot auto-confirm a generalized preference",()=>{
  const memory=baseMemory();
  const candidate=buildPreferenceCandidatesV1({memory,now:fixedNow})[0];
  candidate.human_confirmed=true;
  assert.throws(()=>appendPreferenceCandidates({memory,candidates:[candidate],now:fixedNow}),error=>error instanceof PreferenceInferenceError&&error.code==="MY_EYES_PREFERENCE_AUTO_CONFIRMATION_FORBIDDEN");
});

const forbiddenClaims=[
  ["density does not become dislike of complexity","The designer dislikes complexity."],
  ["floating elements do not become forbidden","Floating elements are forbidden."],
  ["cards do not become forbidden","Cards are forbidden."],
  ["particles do not become forbidden","Particles are forbidden."],
  ["detail does not become bad","Detail is bad."],
  ["realism does not become irrelevant","Realism is irrelevant."],
  ["high saturation does not become automatically better","More saturation is better."],
  ["high contrast does not become automatically better","Maximum contrast is better."]
];
for(const [name,statement] of forbiddenClaims){
  test(name,()=>{
    const result=mutateAndValidate(candidate=>{candidate.statement=statement});
    assert.equal(result.valid,false);
    assert.equal(result.errors.some(error=>error.code==="MY_EYES_INFERENCE_FORBIDDEN_GENERALIZATION"),true);
  });
}

test("contradicting evidence refs cannot be discarded after a performed search",()=>{
  const result=mutateAndValidate(candidate=>{candidate.contradicting_evidence_refs=[]});
  assert.equal(result.valid,false);
});

test("counterexamples refine floating and card candidates instead of banning features",()=>{
  const memory=buildValidated();
  const floating=memory.inferred_preferences.find(item=>item.related_concepts.includes("FLOATING_ELEMENT_EXECUTION_DISCIPLINE"));
  const cards=memory.inferred_preferences.find(item=>item.related_concepts.includes("GENERIC_CARD_TREATMENT_SENSITIVITY"));
  assert.ok(floating.contradicting_evidence_refs.length>0);
  assert.ok(cards.contradicting_evidence_refs.length>0);
  assert.ok(floating.explicitly_not_claimed.includes("floating_elements_are_forbidden"));
  assert.ok(cards.explicitly_not_claimed.includes("cards_are_forbidden"));
});

test("pairwise evidence can support a candidate without creating weight, score, or ranking coefficient",()=>{
  const memory=buildValidated();
  const serialized=JSON.stringify(memory.inferred_preferences);
  assert.equal(memory.inferred_preferences.every(item=>item.pairwise_refs.length>0),true);
  const keys=[];
  const visit=value=>{if(Array.isArray(value))return value.forEach(visit);if(value&&typeof value==="object")for(const [key,child] of Object.entries(value)){keys.push(key);visit(child)}};
  visit(memory.inferred_preferences);
  assert.equal(keys.includes("weight"),false);
  assert.equal(keys.includes("score"),false);
  assert.equal(keys.includes("ranking_coefficient"),false);
  assert.equal(serialized.includes('"confidence":0.'),false);
});

test("isolated label evidence cannot establish a candidate",()=>{
  const result=mutateAndValidate(candidate=>{candidate.independent_evidence_groups=[{group_id:"label_only",evidence_refs:["MYE_DEC_000001"],independence_basis:"One label only."}];candidate.confidence="LOW"});
  assert.equal(result.valid,false);
});

test("isolated system hypothesis cannot establish a candidate",()=>{
  const result=mutateAndValidate(candidate=>{candidate.independent_evidence_groups=[{group_id:"hypothesis_only",evidence_refs:["MYE_HYP_000002"],independence_basis:"One system hypothesis only."}];candidate.confidence="LOW"});
  assert.equal(result.valid,false);
});

test("HIGH confidence requires at least three independent direct-human groups",()=>{
  const result=mutateAndValidate(candidate=>{candidate.independent_evidence_groups=candidate.independent_evidence_groups.slice(0,2)});
  assert.equal(result.valid,false);
  assert.equal(result.errors.some(error=>error.code==="MY_EYES_INFERENCE_HIGH_CONFIDENCE_UNSUPPORTED"),true);
});

test("technical realism tradeoff remains insufficient evidence instead of becoming a rule",()=>{
  assert.equal(PREFERENCE_INFERENCE_V1_DECISIONS.insufficient_evidence.some(item=>item.startsWith("TECHNICAL_REALISM_IS_NOT_SUFFICIENT")),true);
  const memory=buildValidated();
  assert.equal(memory.inferred_preferences.some(item=>item.related_concepts.includes("TECHNICAL_REALISM_IS_NOT_SUFFICIENT")),false);
});

test("Preference Candidates do not connect to compiler, generation, or critic runtime",()=>{
  const roots=["src/compiler","src/generators","src/validation"];
  const files=[];
  const walk=dir=>{for(const entry of fs.readdirSync(path.join(projectRoot,dir),{withFileTypes:true})){const rel=path.join(dir,entry.name);if(entry.isDirectory())walk(rel);else if(entry.isFile())files.push(rel)}};
  roots.forEach(walk);
  const coupled=files.filter(file=>{const text=fs.readFileSync(path.join(projectRoot,file),"utf8");return text.includes("preference-candidate-store")||text.includes("preference-inference-v1")});
  assert.deepEqual(coupled,[]);
});

test("historical preference versions remain append-only and linked",()=>{
  const memory=buildValidated();
  const previous=memory.inferred_preferences[0];
  const revised={...structuredClone(previous),preference_id:"MYE_PREF_000008",statement:previous.statement+" This synthetic revision preserves the contextual boundary.",version:2,supersedes:previous.preference_id,revision_reason:"Synthetic counterexample-triggered refinement.",created_at:"2026-08-15T21:00:00.000Z",provenance:{...previous.provenance,source_ref:"my-eyes://preference-inference/test-revision",recorded_at:"2026-08-15T21:00:00.000Z"}};
  const next=appendPreferenceRevision({memory,previousPreferenceId:previous.preference_id,revisedCandidate:revised,now:()=>new Date("2026-08-15T21:00:00.000Z")});
  assert.equal(next.inferred_preferences.length,8);
  assert.equal(next.inferred_preferences.find(item=>item.preference_id===previous.preference_id).status,"SUPERSEDED");
  assert.equal(next.inferred_preferences.at(-1).supersedes,previous.preference_id);
  assert.equal(validateApprovedDirectionMemory(next).valid,true);
});

test("human report exposes required review fields and zero-authority state",()=>{
  const memory=buildValidated();
  const report=renderPreferenceInferenceReport({memory,candidates:memory.inferred_preferences});
  for(const field of ["TYPE:","STATEMENT:","CONFIDENCE:","SUPPORTING HUMAN EVIDENCE:","SUPPORTING VISUAL EVIDENCE:","COUNTEREVIDENCE:","CONDITIONS:","EXCEPTIONS:","EXPLICITLY NOT CLAIMED:","KNOWN UNCERTAINTIES:","HUMAN CONFIRMED: false","HUMAN CONFIRMATION QUESTION:"])assert.ok(report.includes(field));
  assert.ok(report.includes("Scores: 0"));
  assert.ok(report.includes("Weights: 0"));
  assert.ok(report.includes("Critic integration: 0"));
});

for(const [name,key,value] of [["max_elements", "max_elements", 5],["contrast_weight","contrast_weight",0.9],["realism_weight","realism_weight",0.3]]){
  test(`mutation rejects ${name}`,()=>{
    const result=mutateAndValidate(candidate=>{candidate[key]=value});
    assert.equal(result.valid,false);
  });
}

test("candidate without contradiction search is incomplete and rejected",()=>{
  const result=mutateAndValidate(candidate=>{delete candidate.contradiction_search});
  assert.equal(result.valid,false);
});

test("report ends with the mandatory human-action boundary",()=>{
  const memory=buildValidated();
  const report=renderPreferenceInferenceReport({memory,candidates:memory.inferred_preferences});
  assert.ok(report.includes("\u26a0\ufe0f A\u00c7\u00c3O HUMANA NECESS\u00c1RIA"));
  assert.ok(report.trim().endsWith("Apresente-os em linguagem simples, um por um, sem exigir linguagem t\u00e9cnica."));
});

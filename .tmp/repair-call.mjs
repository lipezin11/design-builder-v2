import https from 'node:https';
import fs from 'node:fs';

const API_KEY = 'sk-enndpoints-kziS06kwDqtednmBZCCZLlIKNB4qz_ww';
const MODEL = 'gemini-3-6-flash';

const planJson = JSON.parse(fs.readFileSync('data/reference-translator/user-live-tests/subject-reference-20260816_11_kie_gemini_2_5_flash_single_persisted_candidate/plans/plan_tech_thumbnail_001.json', 'utf8'));

const prompt = `You are a design system validator. Fix the semantic issues in this Reference Translation Plan JSON.

CURRENT JSON PLAN:
${JSON.stringify(planJson, null, 2)}

VALIDATION DIAGNOSTICS:

SEMANTIC FAILURES:
1. SOURCE_HUE_TREATED_AS_INVARIANT - director_handoff.what_should_survive[0] contains literal 'violet/purple' 
2. SOURCE_HUE_TREATED_AS_INVARIANT - director_handoff.what_should_survive[1] contains literal 'acid-green'
3. SOURCE_HUE_TREATED_AS_INVARIANT - director_handoff.recommended_anchors[1] contains literal 'violet/purple'
4. TYPOGRAPHY_UNRESOLVED - obs_003/map_003 resolves only chromatic attribute, not typography function
5-7. DIRECTOR_HANDOFF_CONTRADICTION - handoff contradicts decision map abstraction

QUALITY FAILURES:
HIGH_INTENSITY_UNDERTRANSFER - obs_003 is HIGH salience TYPOGRAPHY but map_003 does not functionally resolve the typographic structure

CORRECTION RULES:

1. TYPOGRAPHY (map_003):
   - Currently reduces typography to color only
   - Must resolve TYPOGRAPHIC FUNCTION: what happens to source typography as design structure
   - Address: source wording must not transfer literally; graffiti styling must not transfer literally
   - Preserve or reinvent compositional role (hierarchy, counterweight, mass, placement, tension)
   - Typography may function if target-native copy exists
   - Do NOT invent final copy; do NOT require text if Brief doesn't require it
   - Transfer the function, not the source wording/style

2. COLOR (handoff fields):
   - Replace literal 'violet/purple' and 'acid-green' with transferable COLOR RELATIONSHIPS:
   - saturated ambient base
   - high-chroma secondary accent  
   - chromatic tension
   - subject/environment separation
   - controlled contrast
   - Do NOT choose new literal hues

3. HANDOFF CONSISTENCY:
   - director_handoff must summarize decision map
   - Must NOT reintroduce literal source properties that decision map abstracted
   - Keep centralized subject hierarchy if already valid

AUTHORIZED PATHS ONLY - modify ONLY these 5 paths:
- /design_decision_map/2/target_in_new_composition
- /design_decision_map/2/rationale
- /director_handoff/what_should_survive/0
- /director_handoff/what_should_survive/1  
- /director_handoff/recommended_anchors/1

Return ONLY the complete corrected JSON object, no explanation.`;

const payload = {
  model: MODEL,
  messages: [{
    role: 'user',
    content: prompt
  }],
  temperature: 0.1,
  max_tokens: 4096
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'api-useoneai.onrender.com',
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log(responseData);
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error.message);
  process.exit(1);
});

req.write(data);
req.end();

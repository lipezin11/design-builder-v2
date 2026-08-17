import fs from "node:fs";
import path from "node:path";
import { appendPairwisePreference, persistApprovedDirectionMemory } from "../src/my-eyes/human-evidence-store.mjs";
import { appendHumanPairDecision, appendStructuredPairReason, loadPairwiseSession, persistPairwiseSessionVersion } from "../src/my-eyes/pairwise-session-store.mjs";

const root = process.cwd();
const memoryPath = path.join(root, "data", "my_eyes", "approved_direction_memory.json");
const sessionPath = path.join(root, "data", "my_eyes", "pairwise", "sessions", "MYE_PAIR_SESSION_000001.json");
let memory = JSON.parse(fs.readFileSync(memoryPath, "utf8"));
let session = loadPairwiseSession(sessionPath);

if (memory.pairwise_preferences.length !== 0 || session.session_version !== 1 || session.status !== "WAITING_FOR_HUMAN") {
  throw new Error("Refusing duplicate application: expected memory with zero pairs and the untouched session v1.");
}

const responses = [
  {
    pair_id: "MYE_PAIRSEL_000001",
    winner: "A",
    difficulty: "EASY",
    raw_reason: `**Escolha:** A
**O que fez ganhar:** contraste melhor, rim light bem aplicado, cores mais coerentes, realismo e integração superiores; um único elemento flutuante com mais valor visual que vários elementos da B.
**O que fez B perder:** excesso de elementos flutuantes e microdetalhes, cores/contraste com aparência mais artificial e menor integração entre personagem, fundo e objetos.
**Manteria algo da B:** a ideia de tipografia grande atrás do personagem pode funcionar, se usada com muito mais controle.
**Dificuldade:** EASY`,
    winner_reason: "contraste melhor, rim light bem aplicado, cores mais coerentes, realismo e integração superiores; um único elemento flutuante com mais valor visual que vários elementos da B.",
    loser_reason: "excesso de elementos flutuantes e microdetalhes, cores/contraste com aparência mais artificial e menor integração entre personagem, fundo e objetos.",
    keep_from_loser: "a ideia de tipografia grande atrás do personagem pode funcionar, se usada com muito mais controle.",
    source_ref: "codex-user-message://2026-08-15#pair-01",
    concepts: ["CONTROLLED_CONTRAST", "COLOR_COHERENCE", "SUBJECT_ENVIRONMENT_INTEGRATION", "PURPOSEFUL_FLOATING_ELEMENTS", "CONTROLLED_TYPOGRAPHY_BEHIND_SUBJECT"],
    normalized_statement: "SYSTEM interpretation: the human preferred the option whose contrast, color, rim light and subject/environment integration felt more coherent, while explicitly preserving the other option's large-behind-subject typography as a controllable idea. This is contextual, not a universal rule."
  },
  {
    pair_id: "MYE_PAIRSEL_000002",
    winner: "B",
    difficulty: "EASY",
    raw_reason: `**Escolha:** B
**O que fez B ganhar:** “o fundo esta muito melhor, qualidade visual”
**O que fez A perder:** você não deu uma causa específica além da diferença geral de qualidade, então eu deixaria isso sem inventar.
**O que manteria da A:** ainda não informado.
**Dificuldade:** **EASY**, porque apesar de serem propostas difíceis de comparar diretamente, você disse que escolher qual é melhor foi claramente fácil.`,
    winner_reason: "o fundo esta muito melhor, qualidade visual",
    loser_reason: null,
    keep_from_loser: null,
    source_ref: "codex-user-message://2026-08-15#pair-02",
    concepts: ["BACKGROUND_QUALITY", "OVERALL_VISUAL_QUALITY"],
    normalized_statement: "SYSTEM interpretation: the only explicit reason is that IMAGE_B has a much better background and visual quality. No specific losing cause or keep-from-loser claim is inferred."
  },
  {
    pair_id: "MYE_PAIRSEL_000003",
    winner: "A",
    difficulty: "EASY",
    raw_reason: `Escolha: A
Dificuldade: EASY
1. O que fez a escolhida ganhar?

“a A ganha, pois está bem literalmente um design faria, tudo se encaixa. tem muitos elementos na A mas ela soube encaixar pra não ficar poluído”

Se quiser um pouco mais organizado, sem perder tua ideia:

a composição da A é muito mais resolvida
os elementos estão melhor encaixados
mesmo com muitos elementos, ela não fica poluída
existe controle visual e intenção clara
é exatamente a prova de que muitos elementos não são o problema; o problema é quando eles são mal usados
2. O que fez a outra perder?
a B até tem uma pequena semelhança com a A por causa dos cards perto do sujeito
mas nela os elementos ficam muito mais com cara de recurso genérico
parece menos resolvida como design
falta esse encaixe mais natural entre sujeito, cards e composição geral
3. Tem alguma coisa da outra que você manteria?
sim, a ideia de cards perto do sujeito
mas não a execução
o conceito pode funcionar, só que a A prova que precisa de melhor encaixe, melhor distribuição e menos sensação artificial
4. Leitura importante que isso confirma sobre tua régua

Isso aqui confirma quase literalmente teu ponto:

“complexidade não é o problema; o problema é quando a complexidade parece artificial, mal encaixada e poluída.”

Ou seja:

muitos elementos podem funcionar
desde que tenham função
estejam bem encaixados
e não criem poluição visual`,
    winner_reason: "a A ganha, pois está bem literalmente um design faria, tudo se encaixa. tem muitos elementos na A mas ela soube encaixar pra não ficar poluído",
    loser_reason: `a B até tem uma pequena semelhança com a A por causa dos cards perto do sujeito
mas nela os elementos ficam muito mais com cara de recurso genérico
parece menos resolvida como design
falta esse encaixe mais natural entre sujeito, cards e composição geral`,
    keep_from_loser: `sim, a ideia de cards perto do sujeito
mas não a execução
o conceito pode funcionar, só que a A prova que precisa de melhor encaixe, melhor distribuição e menos sensação artificial`,
    source_ref: "codex-user-message://2026-08-15#pair-03",
    concepts: ["CONTROLLED_INTENTIONAL_COMPLEXITY", "VISUAL_CONVERGENCE", "PURPOSEFUL_ELEMENT_INTEGRATION", "GENERIC_CARD_EXECUTION", "AI_LOOKING_DESIGN"],
    normalized_statement: "SYSTEM interpretation: element count is not the failure condition. The human preferred the composition where numerous elements fit together with clear control and intention, while retaining cards-near-subject as a viable concept whose execution must avoid generic or artificial integration."
  },
  {
    pair_id: "MYE_PAIRSEL_000004",
    winner: "B",
    difficulty: "EASY",
    raw_reason: `Escolha: B
Dificuldade: EASY
1. O que fez a escolhida ganhar?
a B está muito mais resolvida como design
o fundo tem textura, profundidade e acabamento visual melhor
parece muito mais uma peça feita por alguém que realmente sabe o que está fazendo
a composição é mais limpa, mais sólida e mais fácil de ler
ela transmite mais controle e menos sensação de montagem artificial
2. O que fez a outra perder?
a A tem vários micro detalhes que, mesmo pequenos, acumulam e bagunçam a mente
os cards estão super genéricos, com cara de recurso padrão/IA
isso reforça uma sensação de peça genérica
tem muita informação miúda sem peso real, o que polui a leitura
mesmo estando bem incorporada, ela cai no problema que você já falou: excesso de pequenos elementos sem sofisticação suficiente
3. Tem alguma coisa da outra que você manteria?
sim, as cores e parte do formato/estrutura
a ideia geral até tem semelhanças interessantes
mas eu tomaria cuidado extremo com cards
se forem usados, precisam ser muito melhor resolvidos, menos genéricos e com mais função visual
4. Leitura importante que esse par confirma

Esse par confirma mais uma vez:

micro detalhes demais podem piorar muito a peça
cards mal resolvidos geram sensação imediata de genérico
não basta estar “bem incorporado”; precisa parecer intencional, sofisticado e controlado
quando houver cards, o sistema precisa entrar em alerta máximo, porque eles facilmente escorregam pro visual padrão de IA`,
    winner_reason: `a B está muito mais resolvida como design
o fundo tem textura, profundidade e acabamento visual melhor
parece muito mais uma peça feita por alguém que realmente sabe o que está fazendo
a composição é mais limpa, mais sólida e mais fácil de ler
ela transmite mais controle e menos sensação de montagem artificial`,
    loser_reason: `a A tem vários micro detalhes que, mesmo pequenos, acumulam e bagunçam a mente
os cards estão super genéricos, com cara de recurso padrão/IA
isso reforça uma sensação de peça genérica
tem muita informação miúda sem peso real, o que polui a leitura
mesmo estando bem incorporada, ela cai no problema que você já falou: excesso de pequenos elementos sem sofisticação suficiente`,
    keep_from_loser: `sim, as cores e parte do formato/estrutura
a ideia geral até tem semelhanças interessantes
mas eu tomaria cuidado extremo com cards
se forem usados, precisam ser muito melhor resolvidos, menos genéricos e com mais função visual`,
    source_ref: "codex-user-message://2026-08-15#pair-04",
    concepts: ["FUNCTIONLESS_MICRODETAIL_ACCUMULATION", "GENERIC_CARD_EXECUTION", "AI_LOOKING_DESIGN", "CONTROLLED_COMPOSITION", "ENVIRONMENT_DEPTH"],
    normalized_statement: "SYSTEM interpretation: the human preferred the cleaner, more solid composition with stronger environmental texture and depth. The concern is accumulated low-value microdetail and generic card execution, not a universal prohibition on cards, color or structural complexity."
  },
  {
    pair_id: "MYE_PAIRSEL_000005",
    winner: "A",
    difficulty: "HARD",
    raw_reason: `essa aqui pra mim é a mais dificil ate agora porque a A é literalmente meu xodó, mas eu ainda escolheria a A.
a B tecnicamente ta muito bonita, o realismo do personagem ta melhor, a luz vermelha e azul ta bem incorporada e o fundo conversa bem com ele, mas ela cai em umas coisas que eu ja falei: tem varios papeis flutuando, varios relogios pequenos, particulas e micro detalhes espalhados que olhando separado parece que nao incomoda, mas tudo junto começa a dar aquela cara de ia tentando deixar a imagem mais "impactante".
na A eu sinto muito mais que existe uma ideia por tras de tudo. o fogo nao ta ali só pra enfeitar, o relogio tem motivo, a dinamite tem motivo, a corda tem motivo, a expressao do personagem tem motivo, ate o texto conversa com a cena. é exagerada pra caralho mas é um exagero controlado, eu olho e entendo na hora oque ela quer falar.

e esta muiuto bem as cores, eu ja tentei gerar uma imagem parecida e sempre fica palido, menos coroso se assim posso falar, ali sla, so sei que eh muito vivo e com bastante constraste certo
e isso é uma coisa importante: eu prefiro mil vezes uma imagem exagerada que tem uma ideia forte e que todos os elementos trabalham pra mesma ideia, do que uma imagem tecnicamente bonita que começa a colocar coisa flutuando só pra preencher e deixar cinematografico.
a B é bonita, mas a A pra mim tem muito mais personalidade e parece muito mais uma peça que um designer pensou de verdade.
escolhida: A
o que fez A ganhar: conceito muito mais forte, todos os elementos tem função e contam a mesma historia, a composição é exagerada mas controlada e tem muito mais personalidade.
o que fez B perder: apesar de ser visualmente muito boa, os papeis, relogios, particulas e pequenos efeitos começam a parecer recursos colocados pra aumentar impacto e entram naquela assinatura visual de ia que eu ja falei.
o que eu manteria da B: principalmente a qualidade do realismo, a iluminação no personagem e essa mistura de vermelho com azul, porque isso esta muito bem feito.
dificuldade: HARD`,
    winner_reason: "conceito muito mais forte, todos os elementos tem função e contam a mesma historia, a composição é exagerada mas controlada e tem muito mais personalidade.",
    loser_reason: "apesar de ser visualmente muito boa, os papeis, relogios, particulas e pequenos efeitos começam a parecer recursos colocados pra aumentar impacto e entram naquela assinatura visual de ia que eu ja falei.",
    keep_from_loser: "principalmente a qualidade do realismo, a iluminação no personagem e essa mistura de vermelho com azul, porque isso esta muito bem feito.",
    source_ref: "codex-attachment://a4277f18-d219-4a49-9b7e-1a6feeab9a11#raw-human-response",
    concepts: ["CONTROLLED_INTENTIONAL_COMPLEXITY", "NARRATIVE_FUNCTIONAL_COHERENCE", "FUNCTIONLESS_MICRODETAIL_ACCUMULATION", "AI_LOOKING_DESIGN", "PURPOSEFUL_VS_DECORATIVE_ELEMENTS", "COLOR_VITALITY_WITH_CONTROLLED_CONTRAST", "TECHNICAL_REALISM_NOT_SUFFICIENT", "CREATIVE_PERSONALITY"],
    normalized_statement: "SYSTEM interpretation: IMAGE_A won because its extreme complexity is subordinated to a strong narrative idea and its elements share purpose, while IMAGE_B retained acknowledged strengths in realism, red-blue lighting and background integration. The concern is accumulated functionless filler and AI-looking impact devices; it does not imply that complexity, particles, floating objects, saturation, contrast or realism are universally good or bad."
  }
];

const createdPairs = [];
for (const response of responses) {
  const selection = session.pairs.find((pair) => pair.pair_id === response.pair_id);
  if (!selection) throw new Error(`Selection ${response.pair_id} not found.`);
  const memoryResult = appendPairwisePreference({
    memory,
    left_image_id: selection.image_a.image_id,
    right_image_id: selection.image_b.image_id,
    human_choice: response.winner === "A" ? "LEFT" : response.winner === "B" ? "RIGHT" : "TIE",
    pair_type: selection.pair_type,
    comparison_context: selection.selection.selection_reason,
    human_reason_raw: response.raw_reason,
    source_ref: `${response.source_ref}#memory-pair`
  });
  memory = memoryResult.memory;
  persistApprovedDirectionMemory({ manifestPath: memoryPath, memory });
  createdPairs.push(memoryResult.pair.pair_id);
  session = appendHumanPairDecision({
    session,
    pair_id: response.pair_id,
    winner: response.winner,
    raw_reason: response.raw_reason,
    winner_reason: response.winner_reason,
    loser_reason: response.loser_reason,
    keep_from_loser: response.keep_from_loser,
    decision_difficulty: response.difficulty,
    source_ref: `${response.source_ref}#${memoryResult.pair.pair_id}`
  });
  persistPairwiseSessionVersion({ root_dir: root, session });
}

for (const response of responses) {
  session = appendStructuredPairReason({ session, pair_id: response.pair_id, concepts: response.concepts, normalized_statement: response.normalized_statement, source_ref: `${response.source_ref}#system-structure` });
  persistPairwiseSessionVersion({ root_dir: root, session });
}

console.log(JSON.stringify({
  session_id: session.session_id,
  session_version: session.session_version,
  status: session.status,
  completed_pairs: session.summary.completed_pair_count,
  human_pairwise_evidence: session.summary.human_pairwise_evidence_count,
  memory_version: memory.memory_version,
  memory_pairwise_count: memory.summary.pairwise_count,
  memory_pair_ids: createdPairs,
  scores_created: session.summary.scores_created,
  weights_created: session.summary.weights_created,
  inferred_preferences_created: session.summary.inferred_preferences_created
}, null, 2));

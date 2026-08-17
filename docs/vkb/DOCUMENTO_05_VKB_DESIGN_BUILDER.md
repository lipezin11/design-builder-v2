# DOCUMENTO 05: VISUAL KNOWLEDGE BASE (VKB)
## Approved Direction Memory + Design Pattern Graph + Visual Precedent Retrieval

**Autor:** Manus AI  
**Versão:** 1.0  
**Status:** Especificação Técnica e Cognitiva  
**Data:** 2026  
**Escopo:** Arquitetura completa da Visual Knowledge Base do Design Builder

---

## PRINCÍPIO CENTRAL

> **THE VKB DOES NOT REMEMBER WHAT TO COPY. IT REMEMBERS HOW VISUAL PROBLEMS WERE SOLVED.**

A Visual Knowledge Base não é uma galeria, não é Pinterest interno, não é um vector database de imagens e não é um sistema de "ache algo parecido". A VKB funciona como **memória visual** e **memória de decisões** do Design Builder, transformando histórico visual em **conhecimento de design reutilizável**.

A pergunta central que guia toda a arquitetura é: **"Como fazemos o sistema aprender com centenas ou milhares de peças, referências, direções, gerações, aprovações e rejeições sem simplesmente copiar o passado?"**

---

## 1. CONTEXTO DO ECOSSISTEMA

O Design Builder possui uma arquitetura em camadas que atravessa múltiplos componentes especializados. A VKB não pertence a uma única camada, mas é consultada de maneiras distintas por cada componente:

| Componente | Função | Consulta VKB Para |
|-----------|--------|------------------|
| **Brief Interpreter** | Normaliza requisitos do usuário | Entender contexto similar de briefs anteriores |
| **Principal Creative Director** | Gera direção criativa | Repertório de soluções, mecanismos aprovados, padrões históricos |
| **Ideation Capability** | Gera conceitos visuais | Inspiração estruturada, não cópia direta |
| **Reference Translator** | Extrai DNA visual de referências | Casos anteriores de transferência bem-sucedida |
| **Creative Direction Room** | Refina direção visual | Precedentes estruturalmente relevantes |
| **Technical Design Room** | Define especificações técnicas | Soluções técnicas para problemas similares |
| **Visual Systems** | Define linguagem visual | Padrões de composição, hierarquia, profundidade |
| **Layout & Typography** | Organiza elementos | Casos de integração texto-imagem bem-sucedida |
| **Final Frame Spec** | Consolida especificação | Validação contra padrões históricos |
| **Generator Compiler** | Prepara prompt para gerador | Contexto histórico, mecanismos, restrições |
| **Image Critic** | Avalia qualidade da geração | Características que diferenciaram aprovados de rejeitados |
| **My Eyes** | Aprende preferências do criador | Padrões de decisão, evidência de preferência |
| **Visual Learning System** | Extrai conhecimento de novas peças | Mecanismos, problemas, decisões humanas |

A VKB é o **backbone cognitivo** que conecta essas camadas, permitindo que cada uma consulte conhecimento histórico de forma especializada.

---

## 2. PRINCÍPIO FUNDAMENTAL: DO PIXEL AO CONHECIMENTO

A unidade fundamental de conhecimento na VKB não é "imagem parecida". É:

```
SOLVED DESIGN PROBLEM
+
DESIGN MECHANISMS
+
OUTCOME
```

Uma imagem aprovada pode ensinar múltiplas dimensões de conhecimento:

- **Composição:** Distribuição de massas, equilíbrio, tensão visual
- **Hierarquia:** Ordem de leitura, foco, importância relativa
- **Profundidade:** Camadas, oclusão, perspectiva, atmosfera
- **Integração de sujeito:** Relação com ambiente, escala, posicionamento
- **Negative space:** Uso intencional de vazio, breathing room
- **Foreground:** Oclusão, profundidade, urgência
- **Lighting mechanisms:** Direção, temperatura, contraste, drama
- **Color mechanisms:** Paleta, harmonia, separação, emoção
- **Typography mechanisms:** Integração com imagem, legibilidade, massa visual
- **Niche communication:** Representação autêntica, evitar clichês
- **Reference transfer:** Como referências foram adaptadas
- **Format intelligence:** Aproveitamento do espaço disponível
- **Visual tension:** Dinâmica, movimento, conflito visual
- **Premium perception:** Qualidade, intencionalidade, refinamento
- **Narrative objects:** Elementos que contam história
- **Attention control:** Direcionamento de olhar, foco

Transformar imagem em conhecimento exige **análise estruturada**, não apenas armazenamento de pixels.

---

## 3. TRÊS TIPOS DE MEMÓRIA DISTINTOS

A VKB mantém três memórias separadas, cada uma com semântica e provenance diferentes:

### 3.1 VISUAL PRECEDENT MEMORY

**Definição:** Peças visualmente relevantes que podem fornecer repertório técnico e inspiracional.

**Características:**
- Peças de alta qualidade visual
- Podem ser internas ou externas
- Fornecem referência técnica
- Não necessariamente aprovadas pelo criador
- Servem como "o que é possível fazer"

**Exemplo:** Uma fotografia de arquitetura de alta qualidade, um design de outro criador, uma peça de referência externa.

**Não implica:** Preferência pessoal, aprovação, ou que deva ser copiada.

### 3.2 APPROVED DIRECTION MEMORY

**Definição:** Problemas de design que foram resolvidos e aprovados pelo criador.

**Características:**
- Histórico completo de decisão
- Aprovação explícita do humano
- Contexto do problema preservado
- Mecanismos identificados
- Razões de aprovação documentadas

**Exemplo:** Um hero de website de estilista que foi aprovado porque resolveu bem o problema de "comunicar autoridade premium com grande área de copy protegida".

**Implica:** Que aquela solução funcionou para aquele problema. Não implica que deva ser replicada em todos os contextos similares.

### 3.3 MY EYES PREFERENCE MEMORY

**Definição:** Padrões de preferência inferidos das decisões humanas, com maturidade de evidência.

**Características:**
- Baseada em comparações e aprovações
- Possui provenance clara
- Tem escopo definido
- Tem confiança quantificada
- Pode evoluir temporalmente

**Exemplo:** "Em problemas de website hero com autoridade humana, o criador preferiu copy protegida à esquerda (3 casos aprovados, 0 rejeitados com copy à direita)."

**Não implica:** Que seja uma regra absoluta, apenas que há evidência em um contexto específico.

**Diferença crítica:** Uma imagem pode ser um ótimo precedente visual sem ser uma preferência pessoal comprovada. Uma direção pode ter sido aprovada por funcionar naquele briefing sem significar que aquele layout é sempre preferido.

---

## 4. APPROVED DESIGN CASE: ESTRUTURA COMPLETA

Um **Approved Design Case** preserva o histórico completo de uma decisão de design aprovada. Não apenas a imagem final, mas toda a jornada que levou à aprovação.

### 4.1 Estrutura do Approved Design Case

```
APPROVED_DESIGN_CASE {
  case_id: string (UUID)
  created_at: timestamp
  project_id: string
  
  // INPUT
  raw_user_brief: string (texto original do usuário)
  normalized_brief_contract: object (requisitos estruturados)
  user_assets: array<Asset> (imagens/arquivos do usuário)
  subject_assets: array<Asset> (sujeito principal)
  reference_assets: array<Asset> (referências fornecidas)
  reference_roles: array<ReferenceRole> (como cada referência foi usada)
  reference_transfer_plan: object (intenção de transferência)
  
  // IDEATION
  ideation_output: object (conceitos gerados)
  ideation_confidence: enum (LOW, MEDIUM, HIGH)
  
  // CREATIVE DIRECTION
  creative_direction_spec: object (direção visual estruturada)
  creative_direction_rationale: string (por que essa direção)
  creative_direction_alternatives: array<string> (direções consideradas)
  
  // TECHNICAL DESIGN
  technical_design_discussion: object (decisões técnicas)
  technical_design_rationale: string (justificativa)
  
  // SPECIFICATION
  final_frame_spec: object (especificação final)
  generator_profile: object (parâmetros do gerador)
  compiled_prompt: string (prompt final compilado)
  
  // GENERATION
  generated_image: Asset (imagem gerada)
  alternative_generations: array<Asset> (alternativas)
  rejected_variants: array<Asset> (versões rejeitadas)
  
  // EVALUATION
  image_critic_output: object (análise automática)
  image_critic_confidence: enum
  
  // HUMAN APPROVAL
  human_approval: boolean (true)
  human_feedback_raw: string (comentário original)
  human_feedback_structured: object (interpretação estruturada)
  human_approval_timestamp: timestamp
  
  // DELTA HISTORY
  delta_fix_history: array<Delta> (iterações até aprovação)
  
  // FINAL VERSION
  final_approved_version: Asset (versão final aprovada)
  
  // METADATA
  design_problems_solved: array<DesignProblem>
  design_mechanisms_used: array<DesignMechanism>
  mechanism_bundles: array<MechanismBundle>
  niche: string
  format: enum (HERO, THUMBNAIL, CARD, etc)
  commercial_objective: string
  visual_density: enum (LOW, MEDIUM, HIGH)
  reference_mode: enum (NONE, INSPIRATIONAL, STRUCTURAL, TRANSFER)
  emotional_goal: string
}
```

### 4.2 Por que preservar somente a imagem final é perda brutal de informação

Armazenar apenas a imagem final é equivalente a armazenar apenas o resultado de um experimento científico sem documentar o método, as hipóteses testadas, os fracassos intermediários e a razão pela qual aquele resultado foi escolhido.

**Perdas de informação:**

1. **Não sabemos qual problema foi resolvido.** A imagem pode parecer similar a outras, mas resolveu um problema específico que outras não resolvem.

2. **Não sabemos quais mecanismos foram usados.** Sem entender os mecanismos, o sistema não consegue reutilizá-los em contextos novos.

3. **Não sabemos por que foi aprovada.** Sem saber o motivo, o sistema não consegue reproduzir o critério de aprovação.

4. **Não sabemos quais alternativas foram rejeitadas.** As rejeições ensinam tanto quanto as aprovações.

5. **Não sabemos qual era a direção criativa.** A imagem final pode ser uma execução perfeita de uma direção ruim, ou uma execução imperfeita de uma direção excelente.

6. **Não sabemos como as referências foram usadas.** A transferência de referência é um mecanismo de aprendizado crucial.

7. **Não sabemos qual era o brief original.** Sem o brief, não conseguimos recuperar casos similares.

8. **Não sabemos a confiança da aprovação.** Algumas aprovações são entusiastas, outras são "aceitável". Essa diferença importa.

9. **Não sabemos a evolução temporal.** Se o gosto mudou entre 2026 e 2028, precisamos saber quando a aprovação ocorreu.

10. **Não conseguimos fazer análise contrastiva.** Sem as alternativas rejeitadas, não conseguemos fazer análise de pairwise preference.

Portanto, um **Approved Design Case** completo é a unidade mínima de conhecimento reutilizável.

---

## 5. DESIGN PROBLEM REPRESENTATION

A VKB deve entender **qual problema** aquela peça resolveu, não apenas armazenar a peça.

### 5.1 Design Problem Schema

```
DESIGN_PROBLEM {
  problem_id: string (UUID)
  name: string (identificador legível)
  description: string (descrição textual)
  
  // CONTEXTO
  format: enum (LANDING_PAGE_HERO, THUMBNAIL, CARD, SOCIAL, etc)
  subject_type: enum (HUMAN_AUTHORITY, PRODUCT, ENVIRONMENT, ABSTRACT, etc)
  commercial_objective: enum (PREMIUM_POSITIONING, URGENCY, TRUST, CONVERSION, etc)
  niche: string (domínio: aviation, fashion, biology, etc)
  
  // REQUISITOS ESPECÍFICOS
  copy_requirement: string (ex: "large protected text territory")
  visual_requirement: string (ex: "communicate authority without cliché")
  emotional_goal: string (ex: "premium, trustworthy, innovative")
  
  // RESTRIÇÕES
  constraints: array<string> (ex: ["must preserve copy area", "avoid generic airport imagery"])
  
  // SOLUÇÕES CONHECIDAS
  solved_by_cases: array<DesignCase> (casos que resolveram este problema)
  failed_by_cases: array<DesignCase> (casos que não resolveram)
  
  // MECANISMOS RELEVANTES
  relevant_mechanisms: array<DesignMechanism> (mecanismos que tendem a resolver)
  contradictory_mechanisms: array<DesignMechanism> (mecanismos que conflitam)
  
  // EVIDÊNCIA
  success_rate: float (percentual de aprovação entre tentativas)
  difficulty: enum (EASY, MEDIUM, HARD, VERY_HARD)
  frequency: int (quantas vezes apareceu)
  
  // METADATA
  created_at: timestamp
  last_updated: timestamp
  confidence: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
}
```

### 5.2 Exemplo Concreto: Aviation Mentor Hero

```
DESIGN_PROBLEM {
  problem_id: "PROBLEM_AVIATION_MENTOR_HERO_001"
  name: "Premium Aviation Mentor Authority Hero"
  description: "Landing page hero for aviation mentorship service that communicates expertise and premium positioning without falling into generic aviation clichés"
  
  format: "LANDING_PAGE_HERO"
  subject_type: "HUMAN_AUTHORITY"
  commercial_objective: "PREMIUM_MENTORSHIP_POSITIONING"
  niche: "aviation"
  
  copy_requirement: "Large protected text territory on left side for value proposition"
  visual_requirement: "Communicate aviation authority without airport/travel cliché; abstract niche environment preferred"
  emotional_goal: "Premium, trustworthy, innovative, exclusive"
  
  constraints: [
    "Must preserve readable copy area",
    "Avoid literal airport/airplane imagery",
    "Subject must feel integrated, not pasted",
    "Premium lighting required",
    "Atmospheric depth essential"
  ]
  
  solved_by_cases: ["CASE_AVIATION_MENTOR_001", "CASE_AVIATION_MENTOR_002"]
  failed_by_cases: ["CASE_AVIATION_MENTOR_REJECTED_001"]
  
  relevant_mechanisms: [
    "SUBJECT_COPY_TERRITORIAL_SEPARATION",
    "CYAN_SUBJECT_SEPARATION",
    "CONTROLLED_AVIATION_SYMBOLISM",
    "PREMIUM_ATMOSPHERIC_DEPTH",
    "ABSTRACT_NICHE_ENVIRONMENT"
  ]
  
  success_rate: 0.67
  difficulty: "HARD"
  frequency: 3
  confidence: "HIGH"
}
```

Isso permite recuperar precedentes por **PROBLEMA DE DESIGN**, não apenas por similaridade visual.

---

## 6. DESIGN MECHANISM: ENTIDADE FUNDAMENTAL

Um **Design Mechanism** é uma decisão visual abstrata que produz determinado efeito. É a unidade de reutilização de conhecimento.

### 6.1 Design Mechanism Schema

```
DESIGN_MECHANISM {
  mechanism_id: string (UUID, ex: "MECH_FOREGROUND_OCCLUSION_001")
  name: string (ex: "Foreground Occlusion")
  description: string (descrição técnica)
  
  // EFEITO VISUAL
  visual_effect: string (o que você vê)
  psychological_effect: string (o que você sente)
  
  // CONTEXTO DE SUCESSO
  best_contexts: array<string> (formatos, nichos, objetivos onde funciona bem)
  failure_modes: array<string> (quando não funciona)
  
  // EXEMPLOS
  known_examples: array<Asset> (exemplos de referência)
  approved_examples: array<DesignCase> (casos aprovados que usaram)
  rejected_examples: array<DesignCase> (casos rejeitados que usaram)
  
  // CONFIANÇA
  confidence: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
  
  // ESCOPO
  scope: enum (UNIVERSAL, FORMAT_SPECIFIC, NICHE_SPECIFIC, CONTEXT_SPECIFIC)
  
  // RELAÇÕES
  works_well_with: array<DesignMechanism> (mecanismos complementares)
  contradicts: array<DesignMechanism> (mecanismos conflitantes)
  
  // EVIDÊNCIA DE PREFERÊNCIA
  human_preference_evidence: array<PreferenceEvidence>
  
  // METADATA
  created_at: timestamp
  last_updated: timestamp
  evidence_count: int (quantas peças usam este mecanismo)
}
```

### 6.2 Exemplos Ilustrativos de Design Mechanisms

**NOTA:** Os exemplos abaixo são ilustrativos e marcados como tal. Não representam mecanismos reais validados.

#### Exemplo 1: FOREGROUND_OCCLUSION (Ilustrativo)

```
DESIGN_MECHANISM {
  mechanism_id: "MECH_FOREGROUND_OCCLUSION_ILLUS_001"
  name: "Foreground Occlusion"
  description: "Objeto em primeiro plano ocluindo parcialmente o sujeito ou ambiente de fundo, criando profundidade e urgência"
  
  visual_effect: "Profundidade tátil, proximidade, urgência, dinamismo"
  psychological_effect: "Sensação de imersão, movimento, proximidade do observador"
  
  best_contexts: [
    "Thumbnails de alta urgência",
    "Produtos de consumo rápido",
    "Conteúdo de ação/movimento",
    "Formatos quadrados ou verticais"
  ]
  
  failure_modes: [
    "Em heróis premium onde breathing room é crítico",
    "Quando oclusão prejudica legibilidade de copy",
    "Em nichos que requerem clareza total (medicina, educação formal)"
  ]
  
  works_well_with: [
    "EXPLOSIVE_BACKLIGHT",
    "CENTERED_PRESSURE_COMPOSITION",
    "TYPE_AS_VISUAL_MASS"
  ]
  
  contradicts: [
    "MAXIMUM_BREATHING_ROOM",
    "CENTERED_EMPTY_SPACE"
  ]
  
  scope: "FORMAT_SPECIFIC"
  confidence: "MEDIUM"
}
```

#### Exemplo 2: SUBJECT_COPY_TERRITORIAL_SEPARATION (Ilustrativo)

```
DESIGN_MECHANISM {
  mechanism_id: "MECH_SUBJECT_COPY_SEPARATION_ILLUS_001"
  name: "Subject-Copy Territorial Separation"
  description: "Divisão clara do espaço entre sujeito visual e área de copy, com cada um ocupando território protegido"
  
  visual_effect: "Clareza, organização, hierarquia, profissionalismo"
  psychological_effect: "Confiança, ordem, intenção, premium perception"
  
  best_contexts: [
    "Website heróis premium",
    "Autoridade humana positioning",
    "B2B marketing",
    "Serviços profissionais"
  ]
  
  failure_modes: [
    "Pode parecer rígido se não bem executado",
    "Pode reduzir dinamismo em thumbnails",
    "Pode não funcionar em formatos muito verticais"
  ]
  
  works_well_with: [
    "CONTROLLED_ASYMMETRY",
    "DETAIL_DENSITY_GRADIENT",
    "PREMIUM_ATMOSPHERIC_DEPTH"
  ]
  
  contradicts: [
    "FULL_BLEED_INTEGRATION",
    "CHAOTIC_LAYERING"
  ]
  
  scope: "FORMAT_SPECIFIC"
  confidence: "HIGH"
}
```

#### Exemplo 3: CONTROLLED_ASYMMETRY (Ilustrativo)

```
DESIGN_MECHANISM {
  mechanism_id: "MECH_CONTROLLED_ASYMMETRY_ILLUS_001"
  name: "Controlled Asymmetry"
  description: "Composição assimétrica mas balanceada, onde elementos não estão centrados mas possuem equilíbrio visual intencional"
  
  visual_effect: "Dinamismo, sofisticação, movimento contido"
  psychological_effect: "Interesse visual, refinamento, modernidade"
  
  best_contexts: [
    "Design contemporâneo",
    "Nichos criativos",
    "Posicionamento premium",
    "Qualquer formato"
  ]
  
  failure_modes: [
    "Pode parecer acidental se não bem executado",
    "Pode confundir se não houver equilíbrio real",
    "Pode não funcionar em contextos muito formais"
  ]
  
  works_well_with: [
    "DETAIL_DENSITY_GRADIENT",
    "SUBJECT_COPY_TERRITORIAL_SEPARATION",
    "ATMOSPHERIC_DEPTH_STACKING"
  ]
  
  contradicts: [
    "PERFECT_SYMMETRY",
    "CENTERED_PRESSURE"
  ]
  
  scope: "UNIVERSAL"
  confidence: "HIGH"
}
```

### 6.3 Mecanismo NÃO É Estilo

Esta é uma distinção crítica que permeia toda a VKB.

| Conceito | Exemplo | Tipo |
|----------|---------|------|
| **Estética/Estilo** | "Purple cyberpunk" | Superficial, visual |
| **Mecanismo** | "Foreground object entering close to camera to create depth and urgency" | Estrutural, funcional |
| **Cenário** | "Forest" | Conteúdo, tema |
| **Mecanismo** | "Layered atmospheric depth with foreground organic occlusion" | Estrutural, funcional |
| **Tema** | "F1" | Conteúdo, domínio |
| **Mecanismo** | "Directional background vectors reinforcing subject motion" | Estrutural, funcional |

**Por que essa distinção importa:**

1. **Reutilização:** Um mecanismo pode ser reutilizado em contextos completamente diferentes. "Controlled Asymmetry" funciona em fashion, tech, educação, saúde.

2. **Transferência:** Você pode transferir um mecanismo de um estilo para outro. "Explosive Backlight" funciona em cyberpunk, em natureza, em produto.

3. **Composição:** Mecanismos podem ser combinados. Estilos não se combinam tão facilmente.

4. **Aprendizado:** O sistema deve aprender mecanismos, não estilos. Aprender estilos leva a repetição. Aprender mecanismos leva a inovação.

A VKB deve ser muito melhor em recuperar **mecanismos** do que simplesmente estilos.

---

## 7. APPROVED CASES CONHECIDOS: PRIMEIROS EXEMPLOS

Existem três casos aprovados importantes que servem como primeiros exemplos da VKB:

### 7.1 CASE: Stylist Website Hero

**Contexto:** Website hero para estilista de moda premium

**Problemas resolvidos:**
- Comunicar autoridade em moda sem parecer genérico
- Proteger grande área de copy (proposta de valor)
- Integrar sujeito (estilista) com ambiente de forma premium
- Evitar clichês de fashion photography

**Mecanismos observados:**
- Subject/copy territorial separation (sujeito à direita, copy à esquerda)
- Subject concentrated on right side
- Protected left-side copy territory
- Visual density increasing toward subject
- Environment strongly related to niche (fashion elements, não genérico)
- Avoidance of first-order niche clichés
- Premium commercial lighting
- Subject/environment integration
- Controlled supporting elements
- Intentional hero-background functionality

**Resultado:** Aprovado

### 7.2 CASE: Aviation Mentor Hero

**Contexto:** Website hero para mentor de aviação

**Problemas resolvidos:**
- Comunicar expertise em aviação sem parecer turismo
- Criar premium perception em serviço B2B
- Proteger copy area
- Usar ambiente de forma abstrata, não literal

**Mecanismos observados:**
- Subject/copy territorial separation
- Subject concentrated on right side
- Protected left-side copy territory
- Visual density increasing toward subject
- Environment strongly related to niche (aviação abstrata, não aeroporto)
- Avoidance of first-order niche clichés
- Premium atmospheric depth
- Subject/environment integration
- Controlled supporting elements
- Intentional hero-background functionality

**Resultado:** Aprovado

### 7.3 CASE: Biologist / Environmental Specialist Hero

**Contexto:** Website hero para especialista ambiental

**Problemas resolvidos:**
- Comunicar expertise em biologia/ambiente sem parecer genérico
- Criar credibilidade científica
- Proteger copy area
- Usar ambiente de forma relevante mas não óbvia

**Mecanismos observados:**
- Subject/copy territorial separation
- Subject concentrated on right side
- Protected left-side copy territory
- Visual density increasing toward subject
- Environment strongly related to niche (biologia, natureza, mas curada)
- Avoidance of first-order niche clichés
- Premium atmospheric depth
- Subject/environment integration
- Controlled supporting elements
- Intentional hero-background functionality

**Resultado:** Aprovado

### 7.4 Evidência vs Padrão: Classificação Correta

Esses três casos similares em formato mostram evidência de:
- Subject/copy territorial separation
- Subject concentrated on right side
- Protected left-side copy territory
- Visual density increasing toward subject
- Environment strongly related to niche
- Avoidance of first-order niche clichés
- Premium commercial lighting
- Subject/environment integration
- Controlled supporting elements
- Intentional hero-background functionality

**IMPORTANTE:** Isso é evidência de apenas **três casos similares** em formato.

**NÃO transformar automaticamente em:** "MY EYES always wants the subject on the right."

**Classificação correta:**

```
PATTERN: SUBJECT_RIGHT_POSITIONING

EVIDENCE: 3 approved website hero cases

SCOPE: human-authority website hero format

CONFIDENCE: medium-high

CONTEXT: All three cases had copy-protection requirement on left

POTENTIAL_CAUSAL_VARIABLE: Copy protection requirement may drive right positioning, not aesthetic preference

STATUS: Hypothesis, requires validation
```

Essa distinção entre **evidência observada** e **padrão confirmado** é fundamental para evitar overfitting.

---

## 8. REJECTED DESIGN CASES

Não armazenar apenas sucessos. Os fracassos ensinam tanto quanto os sucessos, especialmente quando temos contraste.

### 8.1 Rejected Design Case Schema

```
REJECTED_DESIGN_CASE {
  case_id: string (UUID)
  created_at: timestamp
  project_id: string
  
  // INPUT
  brief: object (requisitos)
  
  // DIRECTION
  creative_direction_spec: object (direção que foi tentada)
  
  // SPECIFICATION
  final_frame_spec: object
  
  // GENERATION
  generated_image: Asset
  
  // EVALUATION
  image_critic_output: object
  
  // HUMAN REJECTION
  human_rejection: boolean (true)
  rejection_reason: string (por que foi rejeitado)
  rejection_feedback_raw: string (comentário original)
  rejection_feedback_structured: object (interpretação)
  rejection_timestamp: timestamp
  
  // REPLACEMENT
  replacement_version: Asset (versão que foi aprovada em seu lugar)
  delta: object (o que mudou entre rejeitado e aprovado)
  
  // ANALYSIS
  failure_analysis: string (análise de por que falhou)
  mechanisms_that_failed: array<DesignMechanism>
  mechanisms_that_succeeded_in_replacement: array<DesignMechanism>
  
  // METADATA
  design_problems_attempted: array<DesignProblem>
  design_mechanisms_attempted: array<DesignMechanism>
}
```

### 8.2 Por que Rejected Cases Ensinam Mais

Um caso rejeitado pode ensinar mais que um aprovado, principalmente quando temos contraste:

```
A = rejected
B = approved

Para o MESMO problema
```

**Exemplo ilustrativo:**

```
REJECTED_CASE_A {
  brief: "Premium aviation mentor hero"
  direction: "Subject centered, full-bleed background"
  rejection_reason: "Feels generic, subject looks pasted, no territorial clarity"
  mechanisms_attempted: [
    "FULL_BLEED_INTEGRATION",
    "CENTERED_SUBJECT",
    "MAXIMUM_VISUAL_DENSITY"
  ]
}

APPROVED_CASE_B {
  brief: "Premium aviation mentor hero"
  direction: "Subject right, copy left, atmospheric depth"
  approval_reason: "Clear hierarchy, premium, intentional, subject integrated"
  mechanisms_used: [
    "SUBJECT_COPY_TERRITORIAL_SEPARATION",
    "CONTROLLED_ASYMMETRY",
    "ATMOSPHERIC_DEPTH_STACKING"
  ]
}

DELTA {
  changed: [
    "Subject positioning: centered → right",
    "Copy treatment: overlaid → territorial",
    "Background: full-bleed → atmospheric depth",
    "Composition: centered → asymmetric"
  ]
  
  learning: "For premium authority positioning, territorial separation outperforms full-bleed integration"
}
```

Esse contraste é **evidência pairwise** de altíssimo valor.

---

## 9. PAIRWISE MEMORY E HARD PAIRS

Uma das formas mais fortes de aprendizado é a comparação direta: **A vs B**.

### 9.1 Pairwise Preference Schema

```
PAIRWISE_PREFERENCE {
  pair_id: string (UUID)
  created_at: timestamp
  
  // COMPARAÇÃO
  option_a: DesignCase (rejeitado ou anterior)
  option_b: DesignCase (aprovado ou posterior)
  
  // PREFERÊNCIA
  preferred: enum (A, B)
  preference_strength: enum (SLIGHT, MODERATE, STRONG, VERY_STRONG)
  
  // RAZÃO HUMANA
  human_statement: string (comentário original)
  human_statement_raw: string (exatamente como foi dito)
  
  // ANÁLISE DE DELTA
  possible_deltas: array<Delta> (o que pode ter mudado)
  
  // DELTA DIMENSIONS
  // Cada dimensão pode ter mudado
  composition_changed: boolean
  subject_scale_changed: boolean
  expression_changed: boolean
  environment_changed: boolean
  depth_changed: boolean
  lighting_changed: boolean
  reference_fidelity_changed: boolean
  typography_changed: boolean
  visual_density_changed: boolean
  foreground_changed: boolean
  niche_representation_changed: boolean
  premium_perception_changed: boolean
  format_authenticity_changed: boolean
  
  // ANÁLISE CAUSAL
  likely_causal_factors: array<string> (fatores que provavelmente causaram preferência)
  confidence_in_causality: enum (LOW, MEDIUM, HIGH)
  
  // CONTEXTO
  context: object (brief, formato, niche)
  
  // METADATA
  is_hard_pair: boolean (ver seção 9.2)
  evidence_weight: float (0.0 a 1.0)
}
```

### 9.2 HARD PAIR: Evidência de Altíssimo Valor

Um **HARD PAIR** é uma comparação pairwise que fornece evidência particularmente clara de preferência.

**Critérios para ser HARD PAIR:**

1. **Mudança única ou muito clara:** Apenas uma ou duas dimensões mudaram, facilitando atribuição causal
2. **Preferência explícita:** O humano foi claro sobre preferir B
3. **Contexto idêntico:** Brief, niche, formato são os mesmos
4. **Mecanismos distintos:** A e B usam mecanismos diferentes e identificáveis
5. **Repetição:** Padrão similar apareceu em múltiplos pares

**Exemplo ilustrativo de HARD PAIR:**

```
HARD_PAIR_001 {
  pair_id: "HARD_PAIR_AVIATION_POSITIONING_001"
  
  option_a: {
    description: "Aviation mentor hero, subject centered"
    mechanisms: ["CENTERED_SUBJECT", "FULL_BLEED_BACKGROUND"]
  }
  
  option_b: {
    description: "Aviation mentor hero, subject right, copy left"
    mechanisms: ["SUBJECT_COPY_TERRITORIAL_SEPARATION", "CONTROLLED_ASYMMETRY"]
  }
  
  preferred: "B"
  preference_strength: "VERY_STRONG"
  
  human_statement: "B is much better. Clear hierarchy, subject feels intentional, copy has breathing room."
  
  possible_deltas: [
    "Subject positioning: centered → right",
    "Copy treatment: overlaid → territorial",
    "Composition: centered → asymmetric"
  ]
  
  likely_causal_factors: [
    "Subject positioning change",
    "Copy territorial protection",
    "Composition asymmetry"
  ]
  
  confidence_in_causality: "HIGH"
  
  is_hard_pair: true
  evidence_weight: 0.95
}
```

**Por que HARD PAIRS importam:**

- Fornecem evidência clara de preferência
- Permitem atribuição causal com confiança
- Podem ser usadas para validar hipóteses
- São mais valiosas que múltiplos pares confusos

---

## 10. HUMAN FEEDBACK: RAW vs STRUCTURED

A VKB preserva sempre o comentário humano original, separado da interpretação.

### 10.1 Preservação de Feedback Raw

```
HUMAN_FEEDBACK {
  feedback_id: string (UUID)
  created_at: timestamp
  
  // RAW FEEDBACK
  raw_feedback: string (exatamente como foi dito/escrito)
  raw_context: string (contexto em que foi dito)
  
  // STRUCTURED INTERPRETATION
  structured_interpretation: object (análise do feedback)
  interpretation_confidence: enum (LOW, MEDIUM, HIGH)
  
  // RELACIONAMENTO
  related_case: DesignCase
  related_image: Asset
  related_version: int (qual versão)
  
  // METADATA
  feedback_type: enum (APPROVAL, REJECTION, COMPARISON, SUGGESTION, QUESTION)
  tone: enum (ENTHUSIASTIC, SATISFIED, NEUTRAL, DISAPPOINTED, FRUSTRATED)
}
```

### 10.2 Exemplo: Feedback Aparentemente Pouco Informativo

```
RAW_FEEDBACK: "Ficou uma bosta."

CONTEXTO:
- Imagem: Aviation mentor hero, versão 1
- Brief: Premium aviation mentorship positioning
- Versão anterior: Não existia
- Versão posterior: Versão 2 (aprovada)

ANÁLISE ISOLADA: Parece pouco informativo

ANÁLISE CONECTADA:
- Imagem 1: Sujeito centrado, full-bleed background, visual density alta
- Imagem 2: Sujeito direita, copy esquerda, atmospheric depth
- Feedback: "Ficou uma bosta"
- Resultado: Imagem 2 foi aprovada

INTERPRETAÇÃO ESTRUTURADA:
- Rejeição muito forte (tom: FRUSTRATED)
- Problema fundamental com abordagem
- Não é refinamento, é direção errada
- Mudança radical necessária

APRENDIZADO:
- Full-bleed centered approach falhou para este problema
- Territorial separation approach funcionou
- Mudança de direção foi crítica
```

Isoladamente, "ficou uma bosta" é pouco informativo. Conectado ao histórico, é evidência clara.

**Regra:** Nunca substituir RAW feedback por interpretação. Armazenar ambos.

---

## 11. REFERENCE MEMORY: COMO REFERÊNCIAS FORAM USADAS

A VKB aprende como referências foram utilizadas, não apenas que foram usadas.

### 11.1 Reference Transfer Case Schema

```
REFERENCE_TRANSFER_CASE {
  case_id: string (UUID)
  created_at: timestamp
  
  // INPUTS
  base_image: Asset (imagem base do projeto)
  base_semantics: object (o que a base precisa comunicar)
  reference_image: Asset (referência fornecida)
  reference_intent: string (por que foi fornecida)
  
  // TRANSFERÊNCIA
  transfer_mode: enum (INSPIRATIONAL, STRUCTURAL, AGGRESSIVE, ABSTRACTION, FIDELITY)
  
  // ELEMENTOS
  preserved_elements: array<string> (o que foi mantido da base)
  transferred_elements: array<string> (o que foi trazido da referência)
  adapted_elements: array<string> (o que foi adaptado)
  rejected_reference_elements: array<string> (o que foi rejeitado)
  
  // RESULTADO
  final_solution: Asset (resultado final)
  
  // APROVAÇÃO
  human_result: enum (APPROVED, REJECTED, PARTIAL)
  human_feedback: string
  
  // ANÁLISE
  transfer_success: boolean
  transfer_analysis: string (o que funcionou, o que não funcionou)
  
  // APRENDIZADO
  learning_points: array<string>
  
  // METADATA
  transfer_fidelity: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
  creativity_level: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
}
```

### 11.2 Aprendizado de Padrões de Transferência

A VKB aprende:

- **Quando o criador prefere transferência agressiva:** Trazer muitos elementos da referência, adaptar para novo contexto
- **Quando prefere abstração:** Extrair apenas princípios, não elementos visuais
- **Quando prefere fidelidade:** Manter referência muito próxima
- **Quando acha que a referência foi usada superficialmente:** Feedback negativo sobre transferência inadequada

**Exemplo ilustrativo:**

```
TRANSFER_PATTERN_001 {
  pattern: "Aggressive transfer from architectural reference to hero background"
  
  cases: [
    "TRANSFER_CASE_001: Approved, high fidelity, strong integration",
    "TRANSFER_CASE_002: Approved, high fidelity, strong integration",
    "TRANSFER_CASE_003: Rejected, high fidelity, but felt copied"
  ]
  
  observation: "High fidelity transfer works when elements are adapted to niche context. Fails when feels like direct copy."
  
  learning: "Transfer fidelity alone doesn't determine success. Adaptation and context integration matter more."
}
```

---

## 12. DESIGN PATTERN GRAPH: ESTRUTURA EM GRAFO

A VKB mantém uma camada em grafo que conecta entidades e relações.

### 12.1 Entidades do Graph

| Entidade | Descrição |
|----------|-----------|
| **DESIGN_CASE** | Caso de design aprovado ou rejeitado |
| **DESIGN_PROBLEM** | Problema de design a ser resolvido |
| **DESIGN_MECHANISM** | Mecanismo visual abstrato |
| **FORMAT** | Tipo de formato (hero, thumbnail, card, etc) |
| **NICHE** | Domínio temático (aviação, moda, biologia, etc) |
| **EMOTION** | Objetivo emocional (premium, urgência, confiança, etc) |
| **REFERENCE** | Imagem de referência |
| **CREATIVE_DIRECTION** | Direção criativa específica |
| **TECHNICAL_DECISION** | Decisão técnica |
| **GENERATION** | Geração de imagem |
| **HUMAN_DECISION** | Decisão humana (aprovação/rejeição) |
| **MY_EYES_PATTERN** | Padrão de preferência do criador |
| **FAILURE_MODE** | Modo de falha conhecido |

### 12.2 Relações do Graph

| Relação | Significado |
|---------|------------|
| **SOLVES** | Design case resolve design problem |
| **USES** | Design case usa design mechanism |
| **FAILED_BECAUSE** | Design case falhou porque |
| **APPROVED_BY** | Design case foi aprovado por human decision |
| **REJECTED_BY** | Design case foi rejeitado por human decision |
| **DERIVED_FROM** | Design case derivou de outro |
| **TRANSFERRED_FROM** | Design case transferiu de referência |
| **CONTRADICTS** | Design mechanism contradicts outro |
| **SUPPORTS** | Design mechanism supports outro |
| **WORKS_WITH** | Design mechanism works well com outro |
| **CONFLICTS_WITH** | Design mechanism conflicts com outro |
| **OBSERVED_IN** | Padrão observed em design case |
| **IMPROVED_BY** | Design case foi improved por delta |
| **REPLACED_BY** | Design case foi replaced por outro |

### 12.3 Exemplo de Subgraph

```
DESIGN_PROBLEM: "Premium Aviation Mentor Hero"
  ├─ SOLVES ──→ DESIGN_CASE: "Aviation Mentor Approved 001"
  ├─ SOLVES ──→ DESIGN_CASE: "Aviation Mentor Approved 002"
  ├─ FAILED_BY ──→ DESIGN_CASE: "Aviation Mentor Rejected 001"
  ├─ USES ──→ DESIGN_MECHANISM: "Subject Copy Territorial Separation"
  ├─ USES ──→ DESIGN_MECHANISM: "Controlled Asymmetry"
  ├─ USES ──→ DESIGN_MECHANISM: "Atmospheric Depth Stacking"
  ├─ FORMAT ──→ "Landing Page Hero"
  ├─ NICHE ──→ "Aviation"
  └─ EMOTION ──→ "Premium Positioning"

DESIGN_CASE: "Aviation Mentor Approved 001"
  ├─ SOLVES ──→ DESIGN_PROBLEM: "Premium Aviation Mentor Hero"
  ├─ USES ──→ DESIGN_MECHANISM: "Subject Copy Territorial Separation"
  ├─ USES ──→ DESIGN_MECHANISM: "Controlled Asymmetry"
  ├─ USES ──→ DESIGN_MECHANISM: "Atmospheric Depth Stacking"
  ├─ TRANSFERRED_FROM ──→ REFERENCE: "Architecture Image"
  ├─ APPROVED_BY ──→ HUMAN_DECISION: "Approval 001"
  ├─ OBSERVED_IN ──→ MY_EYES_PATTERN: "Prefers Territorial Separation"
  └─ IMPROVED_BY ──→ DELTA: "Version 1 to Version 2"

DESIGN_MECHANISM: "Subject Copy Territorial Separation"
  ├─ USES ──→ DESIGN_CASE: "Aviation Mentor Approved 001"
  ├─ USES ──→ DESIGN_CASE: "Aviation Mentor Approved 002"
  ├─ USES ──→ DESIGN_CASE: "Stylist Hero Approved 001"
  ├─ WORKS_WITH ──→ DESIGN_MECHANISM: "Controlled Asymmetry"
  ├─ WORKS_WITH ──→ DESIGN_MECHANISM: "Atmospheric Depth Stacking"
  ├─ CONFLICTS_WITH ──→ DESIGN_MECHANISM: "Full Bleed Integration"
  ├─ OBSERVED_IN ──→ MY_EYES_PATTERN: "Prefers Territorial Separation"
  └─ FAILURE_MODE ──→ "Can appear rigid if poorly executed"
```

O graph permite navegação complexa e descoberta de padrões.

---

## 13. MECHANISM BUNDLES: COMPOSIÇÃO DE MECANISMOS

A verdadeira inteligência emerge ao combinar mecanismos.

### 13.1 Mechanism Bundle Schema

```
MECHANISM_BUNDLE {
  bundle_id: string (UUID)
  name: string (ex: "Hero Premium Authority Bundle")
  description: string
  
  // COMPOSIÇÃO
  mechanisms: array<DesignMechanism>
  mechanism_count: int
  
  // CONTEXTO
  best_for: array<DesignProblem>
  format: enum
  niche: enum
  emotional_goal: string
  
  // SUCESSO
  success_cases: array<DesignCase>
  failure_cases: array<DesignCase>
  success_rate: float
  
  // SINERGIA
  synergy_description: string (como os mecanismos trabalham juntos)
  synergy_strength: enum (WEAK, MODERATE, STRONG, VERY_STRONG)
  
  // ALTERNATIVAS
  alternative_bundles: array<MechanismBundle>
  
  // METADATA
  created_at: timestamp
  evidence_count: int
  confidence: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
}
```

### 13.2 Exemplos Ilustrativos de Bundles

#### Bundle 1: Hero Premium Authority (Ilustrativo)

```
MECHANISM_BUNDLE {
  bundle_id: "BUNDLE_HERO_PREMIUM_AUTHORITY_ILLUS_001"
  name: "Hero Premium Authority Bundle"
  description: "Combinação de mecanismos para heróis de website que comunicam autoridade premium"
  
  mechanisms: [
    "CONTROLLED_ASYMMETRY",
    "SUBJECT_COPY_SEPARATION",
    "DETAIL_DENSITY_GRADIENT"
  ]
  
  best_for: [
    "PROBLEM_AVIATION_MENTOR_HERO_001",
    "PROBLEM_STYLIST_HERO_001",
    "PROBLEM_BIOLOGIST_HERO_001"
  ]
  
  synergy_description: "Asymmetry creates visual interest, separation provides clarity, density gradient guides attention from copy to subject"
  
  synergy_strength: "VERY_STRONG"
  
  success_cases: [
    "CASE_AVIATION_MENTOR_001",
    "CASE_STYLIST_001",
    "CASE_BIOLOGIST_001"
  ]
  
  success_rate: 1.0
  confidence: "HIGH"
}
```

#### Bundle 2: Thumbnail Urgency (Ilustrativo)

```
MECHANISM_BUNDLE {
  bundle_id: "BUNDLE_THUMBNAIL_URGENCY_ILLUS_001"
  name: "Thumbnail Urgency Bundle"
  description: "Combinação de mecanismos para thumbnails de alta urgência"
  
  mechanisms: [
    "CENTERED_PRESSURE",
    "FOREGROUND_OCCLUSION",
    "EXPLOSIVE_BACKLIGHT",
    "TYPE_AS_MASS"
  ]
  
  synergy_description: "Centered pressure creates focal point, foreground occlusion adds depth, explosive backlight separates subject, type as mass adds visual weight"
  
  synergy_strength: "VERY_STRONG"
  
  success_rate: 0.85
  confidence: "HIGH"
}
```

---

## 14. CONTEXT-SPECIFIC SUCCESS: ESCOPO DE SUCESSO

Nunca armazenar "Explosive Backlight = bom."

Armazenar "Explosive Backlight demonstrou bom desempenho em X contexto, combinado com Y e Z."

### 14.1 Success Scope Schema

```
SUCCESS_SCOPE {
  scope_id: string (UUID)
  mechanism_id: string (mecanismo em questão)
  
  // SUCESSO
  success_rate: float (0.0 a 1.0)
  success_count: int (quantas vezes funcionou)
  failure_count: int (quantas vezes não funcionou)
  
  // CONTEXTO
  format: enum (ou null para universal)
  niche: enum (ou null para universal)
  commercial_objective: enum (ou null para universal)
  subject_type: enum (ou null para universal)
  visual_density: enum (ou null para universal)
  
  // COMBINAÇÕES
  works_well_with: array<DesignMechanism>
  conflicts_with: array<DesignMechanism>
  
  // EVIDÊNCIA
  evidence_cases: array<DesignCase>
  confidence: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
  
  // METADATA
  created_at: timestamp
  last_updated: timestamp
}
```

### 14.2 Exemplo: Explosive Backlight em Múltiplos Contextos

```
MECHANISM: "Explosive Backlight"

SUCCESS_SCOPE_1 {
  format: "THUMBNAIL"
  niche: null (universal)
  commercial_objective: "URGENCY"
  success_rate: 0.92
  success_count: 12
  failure_count: 1
  works_well_with: ["FOREGROUND_OCCLUSION", "CENTERED_PRESSURE"]
  confidence: "VERY_HIGH"
}

SUCCESS_SCOPE_2 {
  format: "HERO"
  niche: null (universal)
  commercial_objective: "PREMIUM_POSITIONING"
  success_rate: 0.60
  success_count: 3
  failure_count: 2
  works_well_with: ["SUBJECT_COPY_SEPARATION", "ATMOSPHERIC_DEPTH"]
  confidence: "MEDIUM"
}

SUCCESS_SCOPE_3 {
  format: "CARD"
  niche: "FASHION"
  commercial_objective: null
  success_rate: 0.75
  success_count: 3
  failure_count: 1
  works_well_with: ["DETAIL_DENSITY_GRADIENT"]
  confidence: "MEDIUM"
}
```

O mesmo mecanismo tem sucesso diferente em contextos diferentes.

---

## 15. ANTI-OVERFITTING: PROTEÇÃO CONTRA APRENDIZADO SUPERFICIAL

Este é um ponto crítico. Se 20 hero sections aprovados colocarem sujeito à direita, o sistema pode concluir "sujeito à direita é bom." Mas talvez isso tenha ocorrido porque **todos precisavam de copy à esquerda**.

### 15.1 Superficial Pattern Learning: Definição

```
SUPERFICIAL_PATTERN_LEARNING {
  definition: "Identificar correlação visual sem entender variável causal subjacente",
  
  example: "Observar que 20 heróis aprovados têm sujeito à direita, concluir que 'sujeito à direita é bom', sem notar que todos têm copy à esquerda",
  
  symptom: "Padrão desaparece quando contexto muda",
  
  consequence: "Sistema recomenda solução inadequada em novo contexto"
}
```

### 15.2 Mecanismos Contra Superficial Pattern Learning

#### Mecanismo 1: Causal Variable Search

```
CAUSAL_VARIABLE_SEARCH {
  process: "Quando padrão é observado, perguntar: 'What requirement likely produced this pattern?'",
  
  example: [
    "Padrão observado: Subject right positioning em 20 heróis",
    "Pergunta: Por que sujeito à direita?",
    "Investigação: Todos têm copy à esquerda",
    "Hipótese: Copy protection requirement drives right positioning",
    "Teste: Encontrar heróis com copy à direita",
    "Resultado: Sujeito também está à direita nesses casos",
    "Conclusão: Causal variable é copy placement, não aesthetic preference"
  ]
}
```

#### Mecanismo 2: Context Variation Testing

```
CONTEXT_VARIATION_TESTING {
  process: "Testar padrão em contextos diferentes",
  
  example: [
    "Padrão: Subject right positioning",
    "Teste 1: Hero com copy requirement → Subject right (confirma padrão)",
    "Teste 2: Thumbnail sem copy → Subject centered (padrão quebra)",
    "Teste 3: Card com copy requirement → Subject right (padrão mantém)",
    "Conclusão: Padrão é específico a copy-requirement contexts"
  ]
}
```

#### Mecanismo 3: Mechanism vs Correlation

```
MECHANISM_VS_CORRELATION {
  correlation: "Subject right appears in 20 approved cases",
  
  mechanism: "Subject-copy territorial separation solves copy-protection problem",
  
  distinction: "Correlation is surface observation, mechanism is causal explanation",
  
  implication: "Recommend mechanism in new context, not surface pattern"
}
```

### 15.3 Implementação: Confidence Reduction

Quando padrão é observado mas causal variable é incerta:

```
PATTERN_OBSERVATION {
  pattern: "Subject right positioning"
  observation_count: 20
  contexts: ["hero", "hero", "hero", ...]
  
  confidence_without_causal_analysis: "HIGH"
  
  causal_analysis: "Copy placement likely causal variable"
  causal_confidence: "MEDIUM"
  
  final_confidence: "MEDIUM" (reduzido porque causal variable incerta)
  
  recommendation: "Use in contexts with copy requirement, test in other contexts"
}
```

---

## 16. CONTRADIÇÕES: CONTEXTO COMO RESOLUÇÃO

MY EYES pode aprovar minimalismo em um projeto e caos visual extremo em outro. Isso não é necessariamente contradição.

### 16.1 Aparente Contradição

```
OBSERVATION_1: "Criador aprovou design minimalista com muito breathing room"
OBSERVATION_2: "Criador aprovou design com visual density extrema"

APARENTE CONTRADIÇÃO: "Criador gosta de minimalismo E caos visual?"
```

### 16.2 Resolução: Context

```
CONTEXT_1: Thumbnail urgency
  → High controlled density
  → Reason: Urgency requires visual impact

CONTEXT_2: Premium website hero
  → Controlled breathing room
  → Reason: Premium requires sophistication and clarity

RESOLUÇÃO: Não é contradição, é context-specific preference

MY_EYES_PATTERN {
  pattern_1: "THUMBNAIL_URGENCY → high controlled density"
  pattern_2: "PREMIUM_WEBSITE_HERO → controlled breathing room"
  
  apparent_contradiction: false
  
  actual_principle: "Match visual density to commercial objective and format"
}
```

**Regra:** Preferência deve possuir CONTEXT. Sem contexto, é apenas ruído.

---

## 17. TEMPORAL EVOLUTION: PREFERENCE DRIFT

O gosto do criador pode mudar. Uma preferência de 2026 pode não representar 2028.

### 17.1 Preference Drift Schema

```
PREFERENCE_DRIFT {
  pattern_id: string
  name: string (ex: "Subject Positioning Preference")
  
  // HISTÓRICO
  evidence_2026: array<PreferenceEvidence>
  evidence_2027: array<PreferenceEvidence>
  evidence_2028: array<PreferenceEvidence>
  
  // ANÁLISE
  drift_detected: boolean
  drift_direction: enum (STRONGER, WEAKER, REVERSED, STABLE)
  drift_confidence: enum (LOW, MEDIUM, HIGH)
  
  // TEMPORAL
  created_at: timestamp
  last_updated: timestamp
  
  // RECOMENDAÇÃO
  use_recent_evidence: boolean (true)
  weight_recent_higher: boolean (true)
  
  // METADATA
  historical_evidence_retained: boolean (true, nunca descartar)
  historical_evidence_weight: float (0.0 a 1.0)
}
```

### 17.2 Regra: Não Descartar História Automaticamente

Armazenar timestamp e preference version. Preferência de 2026 pode ter valor histórico ou indicar padrão cíclico.

```
MY_EYES_PATTERN {
  pattern: "Subject positioning preference"
  
  evidence_2026: {
    period: "2026-01 to 2026-06"
    preference: "Subject right"
    cases: 5
    confidence: "HIGH"
  }
  
  evidence_2027: {
    period: "2027-01 to 2027-06"
    preference: "Subject centered"
    cases: 4
    confidence: "MEDIUM"
  }
  
  evidence_2028: {
    period: "2028-01 to 2028-06"
    preference: "Subject right"
    cases: 3
    confidence: "MEDIUM"
  }
  
  analysis: "Possible cyclical pattern or context-dependent preference"
  
  recommendation: "Weight 2028 evidence higher, but retain 2026-2027 for pattern analysis"
}
```

---

## 18. GLOBAL QUALITY vs PERSONAL TASTE

Separar GENERAL DESIGN KNOWLEDGE de MY EYES.

### 18.1 Distinção

| Tipo | Exemplo | Escopo | Aplicabilidade |
|------|---------|--------|-----------------|
| **General Design Knowledge** | Hierarquia quebrada é problema | Universal | Todos os projetos |
| **Personal Taste** | Preferir certo grau de densidade | Contextual | Específico ao criador |
| **General Knowledge** | Legibilidade de tipo é crítica | Universal | Todos os projetos |
| **Personal Taste** | Preferir serif em contextos premium | Contextual | Específico ao criador |

### 18.2 Implementação

```
DESIGN_KNOWLEDGE {
  knowledge_id: string
  
  // CLASSIFICAÇÃO
  type: enum (GENERAL_PRINCIPLE, PERSONAL_PREFERENCE, CONTEXT_SPECIFIC)
  
  // CONTEÚDO
  statement: string
  
  // APLICABILIDADE
  applies_to_all: boolean
  applies_to_creator: boolean
  applies_to_context: array<string>
  
  // CONFIANÇA
  confidence: enum
  evidence_count: int
  
  // METADATA
  source: enum (DESIGN_PRINCIPLE, HUMAN_APPROVAL, HUMAN_REJECTION, INFERENCE)
}
```

O Critic precisa distinguir. A VKB também.

---

## 19. EXTERNAL REFERENCES: CLASSIFICAÇÃO DE ORIGEM

A VKB pode conter peças não produzidas pelo Design Builder.

### 19.1 Origem Classification Schema

```
ASSET_ORIGIN {
  asset_id: string
  
  // CLASSIFICAÇÃO
  origin: enum (
    INTERNAL_APPROVED,      // Gerada pelo DB e aprovada
    INTERNAL_REJECTED,      // Gerada pelo DB e rejeitada
    EXTERNAL_REFERENCE,     // Referência externa
    EXTERNAL_CURATED,       // Referência externa curada
    USER_REFERENCE,         // Fornecida pelo usuário
    BENCHMARK               // Benchmark externo
  )
  
  // EVIDÊNCIA
  has_human_approval: boolean
  has_human_rejection: boolean
  has_human_feedback: boolean
  
  // CONFIANÇA
  confidence_in_quality: enum
  confidence_in_relevance: enum
  
  // METADATA
  source_url: string (se externo)
  source_attribution: string
  acquisition_date: timestamp
}
```

### 19.2 Regra: Nunca Misture Evidência

```
INTERNAL_APPROVED {
  meaning: "Gerada pelo DB, aprovada pelo criador"
  evidence_value: "VERY_HIGH"
  can_use_for: "Approved cases, mechanism extraction, preference inference"
}

EXTERNAL_REFERENCE {
  meaning: "Referência externa, não gerada pelo DB"
  evidence_value: "MEDIUM"
  can_use_for: "Precedent memory, inspiration, technical reference"
  cannot_use_for: "Preference inference, approval patterns"
}

MIXING_ERROR: "Usar external reference como evidência de preferência"
```

---

## 20. RETRIEVAL STRATEGIES: MÚLTIPLAS DIMENSÕES

A VKB suporta retrieval em múltiplas dimensões, não apenas visual similarity.

### 20.1 Retrieval por Problema

```
RETRIEVAL_BY_PROBLEM {
  query: "Premium human-authority website hero requiring large copy area and non-literal niche environment"
  
  dimensions: [
    "FORMAT: Landing Page Hero",
    "COMMERCIAL_OBJECTIVE: Premium Positioning",
    "SUBJECT_TYPE: Human Authority",
    "COPY_REQUIREMENTS: Large Protected Territory",
    "REFERENCE_MODE: Non-literal Niche",
    "EMOTIONAL_GOAL: Premium, Trustworthy"
  ]
  
  results: [
    "CASE_STYLIST_HERO_001",      // Visually different, structurally similar
    "CASE_AVIATION_MENTOR_001",   // Visually different, structurally similar
    "CASE_BIOLOGIST_HERO_001"     // Visually different, structurally similar
  ]
  
  observation: "Resultados são visualmente muito diferentes, mas estruturalmente similares"
  
  value: "Permite descobrir precedentes por PROBLEMA, não por estilo"
}
```

### 20.2 Retrieval por Mecanismo

```
RETRIEVAL_BY_MECHANISM {
  query_1: "Find approved uses of aggressive foreground occlusion"
  
  results: [
    "CASE_THUMBNAIL_URGENCY_001",
    "CASE_PRODUCT_HERO_002",
    "CASE_ACTION_CONTENT_001"
  ]
  
  query_2: "Find cases where explosive backlight increased subject separation"
  
  results: [
    "CASE_PORTRAIT_HERO_001",
    "CASE_PRODUCT_SHOT_002",
    "CASE_FASHION_CARD_001"
  ]
  
  query_3: "Find rejected cases where floating elements caused clutter"
  
  results: [
    "REJECTED_CASE_LAYOUT_001",
    "REJECTED_CASE_COMPOSITION_002"
  ]
  
  requirement: "Exige indexação semântica dos mecanismos"
}
```

---

## 21. MULTIMODAL EMBEDDINGS: CRÍTICA E HIBRIDISMO

Embeddings visuais são úteis para similaridade visual, mas podem ser ruins como mecanismo principal de retrieval criativo.

### 21.1 Limitações de Embeddings Visuais

```
VISUAL_EMBEDDING_GOOD_FOR: [
  "Visual similarity search",
  "Style similarity",
  "Object similarity",
  "Palette similarity"
]

VISUAL_EMBEDDING_BAD_FOR: [
  "Problem-based retrieval",
  "Mechanism discovery",
  "Creative direction transfer",
  "Context-specific solutions"
]

REASON: "Imagem visualmente mais parecida pode resolver problema completamente diferente"

EXAMPLE: [
  "Query: 'Hero com copy protection'",
  "Visual embedding retorna: Imagem visualmente similar mas sem copy area",
  "Resultado: Não útil para o problema"
]
```

### 21.2 Retrieval Híbrido

```
HYBRID_RETRIEVAL {
  components: [
    "VISUAL_EMBEDDING",           // Similaridade visual
    "TEXTUAL_DESIGN_REPRESENTATION", // Descrição textual
    "STRUCTURED_METADATA",        // Metadados estruturados
    "DESIGN_MECHANISM_GRAPH",     // Grafo de mecanismos
    "HUMAN_PREFERENCE_DATA"       // Dados de preferência
  ]
  
  ranking_logic: [
    "1. Filter by problem relevance (structured metadata)",
    "2. Rank by mechanism match (design mechanism graph)",
    "3. Boost by human preference alignment (preference data)",
    "4. Consider visual similarity (visual embedding)",
    "5. Apply context-specific weights"
  ]
  
  example_query: "Find precedents for premium authority positioning with copy protection"
  
  step_1_filter: [
    "FORMAT: Landing Page Hero",
    "COMMERCIAL_OBJECTIVE: Premium",
    "COPY_REQUIREMENT: Protected"
  ]
  
  step_2_rank: [
    "MECHANISM: Subject-Copy Separation (HIGH weight)",
    "MECHANISM: Controlled Asymmetry (MEDIUM weight)",
    "MECHANISM: Atmospheric Depth (MEDIUM weight)"
  ]
  
  step_3_boost: [
    "MY_EYES: Prefers territorial separation (BOOST)",
    "MY_EYES: Prefers asymmetry in heróis (BOOST)"
  ]
  
  step_4_visual: [
    "Visual similarity (LOW weight, used for tie-breaking)"
  ]
  
  final_ranking: [
    "CASE_AVIATION_MENTOR_001 (score: 0.92)",
    "CASE_STYLIST_HERO_001 (score: 0.89)",
    "CASE_BIOLOGIST_HERO_001 (score: 0.87)"
  ]
}
```

---

## 22. INGESTION PIPELINE: DO PIXEL AO CONHECIMENTO

Pipeline para ingestão de novas peças na VKB.

### 22.1 Ingestion Pipeline Flow

```
IMAGE
  ↓
METADATA EXTRACTION
  ├─ Technical metadata (resolution, format, etc)
  ├─ Visual metadata (colors, composition, etc)
  └─ Contextual metadata (brief, project, etc)
  ↓
MULTIMODAL ANALYSIS
  ├─ Visual analysis (composition, hierarchy, depth, etc)
  ├─ Semantic analysis (what is the image communicating)
  └─ Technical analysis (lighting, color, etc)
  ↓
DESIGN PROBLEM EXTRACTION
  ├─ What problem does this solve?
  ├─ What are the constraints?
  └─ What is the context?
  ↓
MECHANISM EXTRACTION
  ├─ What mechanisms are used?
  ├─ How do they work together?
  └─ Are there mechanism bundles?
  ↓
HUMAN VALIDATION (when needed)
  ├─ Is problem extraction correct?
  ├─ Are mechanisms identified correctly?
  └─ Should this be an approved case?
  ↓
EMBEDDINGS GENERATION
  ├─ Visual embeddings
  ├─ Textual embeddings
  └─ Semantic embeddings
  ↓
GRAPH CONNECTIONS
  ├─ Connect to related problems
  ├─ Connect to related mechanisms
  ├─ Connect to related cases
  └─ Connect to human decisions
  ↓
VKB STORAGE
  └─ Store in appropriate databases
```

### 22.2 Questões Críticas

**Quais etapas podem ser automáticas?**
- Metadata extraction: SIM
- Visual analysis: SIM (com confiança média)
- Semantic analysis: PARCIAL (com confiança baixa)
- Problem extraction: NÃO (requer contexto)
- Mechanism extraction: PARCIAL (requer validação)
- Embeddings: SIM

**Quais precisam de humano?**
- Problem extraction: SIM (crítico)
- Mechanism extraction: SIM (crítico)
- Approval classification: SIM (crítico)
- Preference inference: SIM (crítico)

**Onde LLM pode alucinar mecanismo?**
- Atribuir mecanismo que não existe
- Confundir estilo com mecanismo
- Inferir causalidade sem evidência
- Generalizar de caso único

**Como evitar criar conhecimento falso?**
- Requer validação humana para peças críticas
- Marca confiança baixa para inferências
- Permite correção posterior
- Não usa inferências baixa-confiança em decisões críticas

---

## 23. KNOWLEDGE PROVENANCE: RASTREABILIDADE TOTAL

Todo conhecimento precisa responder: **WHERE DID THIS COME FROM?**

### 23.1 Provenance Sources

```
POSSIBLE_ORIGINS: [
  "HUMAN_EXPLICIT",              // Humano disse explicitamente
  "HUMAN_APPROVAL",              // Humano aprovou (inferência)
  "HUMAN_REJECTION",             // Humano rejeitou (inferência)
  "PAIRWISE_COMPARISON",         // Comparação A vs B
  "CRITIC_INFERENCE",            // Crítico inferiu
  "CREATIVE_DIRECTOR_INFERENCE", // Diretor criativo inferiu
  "MULTIMODAL_ANALYSIS",         // Análise automática
  "EXTERNAL_REFERENCE",          // Referência externa
  "CROSS_CASE_PATTERN_MINING"    // Padrão entre casos
]
```

### 23.2 Provenance Tracking

```
KNOWLEDGE_ITEM {
  knowledge_id: string
  
  // CONTEÚDO
  statement: string (ex: "Subject right positioning is preferred")
  
  // PROVENANCE
  origin: enum (ver lista acima)
  origin_details: object (detalhes específicos)
  
  // RASTREABILIDADE
  source_cases: array<DesignCase> (casos que originaram)
  source_decisions: array<HumanDecision> (decisões que originaram)
  source_comparisons: array<PairwisePreference> (comparações que originaram)
  
  // CONFIANÇA
  confidence: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
  confidence_factors: array<string> (por que essa confiança)
  
  // METADATA
  created_at: timestamp
  last_validated: timestamp
}
```

### 23.3 Regra: Nunca Apresentar Inferência como Confirmado

```
WRONG: "MY EYES prefers subject on right"
RIGHT: "MY EYES shows preference for subject on right in 3 approved website heróis with copy protection requirement (confidence: HIGH, origin: HUMAN_APPROVAL + PAIRWISE_COMPARISON)"

WRONG: "Explosive backlight is good"
RIGHT: "Explosive backlight succeeded in 12 thumbnail cases (success rate: 92%, confidence: VERY_HIGH, origin: HUMAN_APPROVAL) but only 3 hero cases (success rate: 60%, confidence: MEDIUM)"
```

---

## 24. CONFIDENCE MODEL: BASEADO EM EVIDÊNCIA

Confiança não é porcentagem falsa. É baseada em fatores reais.

### 24.1 Confidence Levels

```
CONFIDENCE_LEVELS: [
  "LOW",      // Evidência limitada, alta incerteza
  "MEDIUM",   // Alguma evidência, incerteza moderada
  "HIGH",     // Boa evidência, confiança razoável
  "VERY_HIGH" // Forte evidência, confiança alta
]
```

### 24.2 Fatores que Aumentam Confiança

```
CONFIDENCE_FACTORS {
  number_of_cases: {
    1_case: "LOW",
    2_3_cases: "MEDIUM",
    4_10_cases: "HIGH",
    10_plus_cases: "VERY_HIGH"
  },
  
  context_diversity: {
    single_context: "REDUCE by 1 level",
    multiple_contexts: "MAINTAIN",
    diverse_contexts: "INCREASE by 1 level"
  },
  
  pairwise_evidence: {
    no_pairwise: "REDUCE by 1 level",
    some_pairwise: "MAINTAIN",
    multiple_hard_pairs: "INCREASE by 1 level"
  },
  
  explicit_human_statement: {
    not_stated: "REDUCE by 1 level",
    implied: "MAINTAIN",
    explicitly_stated: "INCREASE by 1 level"
  },
  
  recency: {
    older_than_1_year: "REDUCE by 1 level",
    within_1_year: "MAINTAIN",
    within_3_months: "INCREASE by 1 level"
  },
  
  consistency: {
    contradictory_evidence: "REDUCE by 2 levels",
    mixed_evidence: "REDUCE by 1 level",
    consistent_evidence: "MAINTAIN"
  }
}
```

### 24.3 Exemplo: Cálculo de Confiança

```
PATTERN: "Subject right positioning preference"

BASE_CONFIDENCE: "MEDIUM" (3 cases)

ADJUSTMENTS:
- context_diversity: "single context (website heróis)" → REDUCE by 1 level
- pairwise_evidence: "1 hard pair" → MAINTAIN
- explicit_human_statement: "not stated" → REDUCE by 1 level
- recency: "within 6 months" → MAINTAIN
- consistency: "consistent evidence" → MAINTAIN

CALCULATION:
  MEDIUM → REDUCE → LOW
  LOW → REDUCE → VERY_LOW
  
FINAL_CONFIDENCE: "LOW"

INTERPRETATION: "Evidence suggests pattern, but limited scope and context make confidence low. Requires more diverse evidence."
```

---

## 25. VKB RESULT FORMAT: RESPOSTA ESTRUTURADA

Quando um agente consulta VKB, não retornar dump de 50 imagens. Retornar resposta estruturada.

### 25.1 VKB Response Schema

```
VKB_RESPONSE {
  response_id: string (UUID)
  query_id: string (referência à query)
  timestamp: timestamp
  
  // INTERPRETAÇÃO
  query_interpretation: string (como a query foi interpretada)
  query_confidence: enum (LOW, MEDIUM, HIGH)
  
  // RESULTADOS
  relevant_precedents: array<DesignCase> (casos relevantes)
  relevant_mechanisms: array<DesignMechanism> (mecanismos relevantes)
  known_failures: array<DesignCase> (o que não funcionou)
  
  // PREFERÊNCIAS
  my_eyes_signals: array<PreferenceSignal> (padrões de preferência)
  contradictory_evidence: array<string> (evidência contraditória)
  
  // CONTEXTO
  novelty_warning: string (se solução seria muito similar ao passado)
  confidence: enum (LOW, MEDIUM, HIGH, VERY_HIGH)
  
  // RASTREABILIDADE
  provenance: array<string> (origem de cada resultado)
  
  // METADATA
  result_count: int
  result_diversity: enum (LOW, MEDIUM, HIGH)
}
```

### 25.2 Exemplo de Resposta

```
VKB_RESPONSE {
  query_interpretation: "Find precedents for premium authority positioning with copy protection"
  query_confidence: "HIGH"
  
  relevant_precedents: [
    {
      case: "CASE_AVIATION_MENTOR_001",
      relevance_score: 0.92,
      reason: "Solves identical problem: premium authority + copy protection"
    },
    {
      case: "CASE_STYLIST_HERO_001",
      relevance_score: 0.89,
      reason: "Solves similar problem: premium positioning + copy protection"
    },
    {
      case: "CASE_BIOLOGIST_HERO_001",
      relevance_score: 0.87,
      reason: "Solves similar problem: authority positioning + copy protection"
    }
  ]
  
  relevant_mechanisms: [
    {
      mechanism: "SUBJECT_COPY_TERRITORIAL_SEPARATION",
      confidence: "VERY_HIGH",
      evidence: "Used in all 3 precedents, all approved"
    },
    {
      mechanism: "CONTROLLED_ASYMMETRY",
      confidence: "HIGH",
      evidence: "Used in 2 of 3 precedents, all approved"
    },
    {
      mechanism: "ATMOSPHERIC_DEPTH_STACKING",
      confidence: "HIGH",
      evidence: "Used in 3 of 3 precedents, all approved"
    }
  ]
  
  known_failures: [
    {
      case: "REJECTED_CASE_AVIATION_001",
      failure_reason: "Full-bleed integration without territorial separation felt generic",
      mechanisms_that_failed: ["FULL_BLEED_INTEGRATION", "CENTERED_SUBJECT"]
    }
  ]
  
  my_eyes_signals: [
    {
      pattern: "Prefers territorial separation for premium authority",
      confidence: "HIGH",
      evidence_count: 3,
      scope: "website heróis with copy requirement"
    },
    {
      pattern: "Prefers asymmetry over centering",
      confidence: "MEDIUM",
      evidence_count: 2,
      scope: "website heróis"
    }
  ]
  
  contradictory_evidence: [
    "One rejected case used full-bleed, suggesting territorial separation may be causal"
  ]
  
  novelty_warning: "All precedents are website heróis with human authority. Ensure new solution adapts mechanisms rather than copying composition."
  
  confidence: "VERY_HIGH"
  
  provenance: [
    "relevant_precedents: HUMAN_APPROVAL + DESIGN_PROBLEM_EXTRACTION",
    "relevant_mechanisms: MECHANISM_EXTRACTION + PAIRWISE_COMPARISON",
    "my_eyes_signals: HUMAN_APPROVAL + CROSS_CASE_PATTERN_MINING"
  ]
}
```

---

## 26. NOVELTY PROTECTION: EVITAR REPETIÇÃO

Um sistema treinado em aprovações pode começar a repetir. Isso destruiria o Design Builder.

### 26.1 Novelty Check

```
NOVELTY_CHECK {
  question_1: "A solução apenas recombina o que já fizemos?"
  question_2: "Está excessivamente próxima de um caso anterior?"
  question_3: "O mecanismo é reutilizado, mas a manifestação visual é nova?"
  question_4: "Estamos copiando resultado ou reutilizando princípio?"
}
```

### 26.2 Mechanism Reuse vs Composition Copying

```
MECHANISM_REUSE {
  definition: "Usar mecanismo conhecido em novo contexto visual",
  example: "Usar 'Controlled Asymmetry' em novo niche com composição diferente",
  evaluation: "GOOD - Reutiliza princípio, cria novidade"
}

COMPOSITION_COPYING {
  definition: "Copiar composição visual de caso anterior",
  example: "Gerar imagem que é visualmente muito similar a caso anterior",
  evaluation: "BAD - Reduz criatividade, viola originalidade"
}

DETECTION: [
  "Visual embedding similarity > 0.85 → WARNING",
  "Mechanism overlap > 80% AND visual similarity > 0.75 → ALERT",
  "Composition identical to previous case → BLOCK"
]
```

### 26.3 Novelty Score

```
NOVELTY_SCORE {
  calculation: [
    "base_score: 1.0",
    "mechanism_reuse_penalty: -0.2 * (overlap_percentage / 100)",
    "visual_similarity_penalty: -0.5 * visual_embedding_similarity",
    "composition_similarity_penalty: -0.3 * composition_similarity",
    "context_novelty_bonus: +0.2 if new context"
  ],
  
  example: [
    "base: 1.0",
    "mechanism_reuse: 60% overlap → -0.12",
    "visual_similarity: 0.4 → -0.20",
    "composition_similarity: 0.3 → -0.09",
    "context_novelty: new niche → +0.20",
    "final_score: 0.79"
  ],
  
  threshold: "novelty_score < 0.5 → FLAG for review"
}
```

---

## 27. VKB NÃO SUBSTITUI IDEATION

A VKB oferece repertório. Ideation ainda deve conseguir criar algo que nunca apareceu no banco.

### 27.1 Autoridade Criativa

```
VKB_ROLE: "Oferece repertório, contexto, aprendizado histórico"

IDEATION_ROLE: "Cria conceitos novos, testa hipóteses, desafia padrões"

RELATIONSHIP: "VKB informa, Ideation cria"

EXAMPLE: [
  "VKB retorna: 'Territorial separation funciona em 3 heróis'",
  "Ideation pensa: 'E se tentássemos full-bleed com copy overlay?'",
  "Resultado: Novo conceito que contradiz padrão histórico"
]
```

### 27.2 Autoridade para Contradizer

```
CREATIVE_DIRECTOR_AUTHORITY {
  right_1: "Usar mecanismos recomendados pela VKB",
  right_2: "Ignorar recomendações se houver boa justificativa",
  right_3: "Criar conceitos que contradizem padrões históricos",
  right_4: "Testar hipóteses que VKB considera baixa-probabilidade"
}

PROTECTION: "VKB não deve bloquear criatividade, apenas informar"
```

---

## 28. FAILURE MODES: 17 MODOS DE FALHA

Documentar profundamente os modos de falha da VKB.

### 28.1 VISUAL_SIMILARITY_TRAP

**Definição:** Retornar imagens visualmente similares que resolvem problemas diferentes.

**Sintoma:** "Essas imagens parecem iguais mas não resolvem o meu problema."

**Exemplo:** Query por "hero com copy protection" retorna imagem visualmente similar mas sem copy area.

**Detecção:** Verificar se problema da imagem retornada corresponde ao problema da query.

**Prevenção:** Usar retrieval baseado em problema, não apenas visual similarity.

**Recuperação:** Implementar feedback loop onde usuário indica que resultado não é relevante.

### 28.2 COPYING_APPROVED_WORK

**Definição:** Sistema gera imagem que é cópia de caso anterior aprovado.

**Sintoma:** "Isso é praticamente idêntico ao que fizemos antes."

**Exemplo:** Gerar hero com mesma composição, mesmo sujeito, mesmo background de caso anterior.

**Detecção:** Visual embedding similarity > 0.85 + composition similarity > 0.8.

**Prevenção:** Novelty check antes de gerar, penalizar composições similares.

**Recuperação:** Rejeitar geração, forçar novo conceito.

### 28.3 PATTERN_OVERFITTING

**Definição:** Aprender padrão superficial sem entender variável causal.

**Sintoma:** "Sistema acha que sujeito à direita é sempre bom."

**Exemplo:** 20 heróis com sujeito à direita aprovados, mas todos têm copy à esquerda.

**Detecção:** Padrão desaparece quando contexto muda.

**Prevenção:** Causal variable search, context variation testing.

**Recuperação:** Reclassificar padrão como context-specific.

### 28.4 FALSE_PREFERENCE

**Definição:** Inferir preferência que não existe.

**Sintoma:** "Sistema acha que gosto de minimalismo, mas era apenas contexto."

**Exemplo:** Inferir preferência por breathing room de heróis premium, aplicar em thumbnails.

**Detecção:** Preferência falha em novo contexto.

**Prevenção:** Sempre incluir contexto em preferências, validar em múltiplos contextos.

**Recuperação:** Remover ou reclassificar preferência.

### 28.5 CONTEXT_COLLAPSE

**Definição:** Aplicar padrão de um contexto em outro contexto diferente.

**Sintoma:** "Isso funcionou em heróis, por que não funciona em thumbnails?"

**Exemplo:** Usar "controlled breathing room" em thumbnail de urgência.

**Detecção:** Padrão funciona em contexto A, falha em contexto B.

**Prevenção:** Sempre especificar contexto de padrões, validar aplicabilidade.

**Recuperação:** Reclassificar padrão como context-specific.

### 28.6 STYLE_AS_MECHANISM

**Definição:** Confundir estilo com mecanismo.

**Sintoma:** "Sistema acha que 'purple cyberpunk' é um mecanismo."

**Exemplo:** Armazenar "purple cyberpunk" como mecanismo em vez de "directional background vectors".

**Detecção:** Mecanismo é superficial, não estrutural.

**Prevenção:** Validação humana de mecanismos, usar definição clara.

**Recuperação:** Reclassificar como estilo, não mecanismo.

### 28.7 VKB_DOMINANCE

**Definição:** VKB domina decisões criativas, reduzindo inovação.

**Sintoma:** "Todas as soluções são variações do que já fizemos."

**Exemplo:** Creative Director sempre segue recomendações VKB, nunca testa novo.

**Detecção:** Novelty score diminuindo, aprovações diminuindo.

**Prevenção:** Proteger autoridade criativa, encorajar experimentação.

**Recuperação:** Reduzir peso de VKB em recomendações.

### 28.8 NOVELTY_SUPPRESSION

**Definição:** Sistema rejeita soluções novas porque não aparecem em VKB.

**Sintoma:** "Isso nunca apareceu antes, então deve ser ruim?"

**Exemplo:** Critic rejeita conceito novo porque não tem precedente.

**Detecção:** Soluções novas são rejeitadas sistematicamente.

**Prevenção:** Proteger contra PAST-PREFERENCE PRISON, permitir novidade.

**Recuperação:** Validar soluções novas independentemente de VKB.

### 28.9 OUTDATED_PREFERENCE

**Definição:** Usar preferência antiga que não representa gosto atual.

**Sintoma:** "Isso era preferido em 2026, mas não mais."

**Exemplo:** Usar preferência de 2026 em 2028 quando gosto mudou.

**Detecção:** Preferência antiga falha em novos casos.

**Prevenção:** Temporal tracking, weight recent evidence higher.

**Recuperação:** Atualizar preferência com evidência recente.

### 28.10 BAD_METADATA

**Definição:** Metadados incorretos ou incompletos.

**Sintoma:** "Caso foi classificado como hero, mas é thumbnail."

**Exemplo:** Brief não foi normalizado corretamente, problema não foi identificado.

**Detecção:** Retrieval retorna resultados irrelevantes.

**Prevenção:** Validação de metadados, human review de casos críticos.

**Recuperação:** Corrigir metadados, re-index.

### 28.11 HALLUCINATED_RATIONALE

**Definição:** LLM inventa razão para aprovação que não existe.

**Sintoma:** "Sistema diz que foi aprovado porque de X, mas realmente foi Y."

**Exemplo:** LLM infere que hero foi aprovado por lighting, mas realmente foi por copy protection.

**Detecção:** Rationale não corresponde ao feedback humano.

**Prevenção:** Não usar LLM para extrair rationale sem validação, preservar raw feedback.

**Recuperação:** Remover rationale alucinado, usar apenas raw feedback.

### 28.12 HUMAN_FEEDBACK_MISINTERPRETATION

**Definição:** Interpretar feedback humano incorretamente.

**Sintoma:** "Humano disse 'ficou uma bosta', sistema interpretou como 'não gostou da cor'."

**Exemplo:** Feedback ambíguo interpretado de forma errada.

**Detecção:** Interpretação não corresponde ao contexto.

**Prevenção:** Preservar raw feedback, validar interpretação.

**Recuperação:** Corrigir interpretação, usar raw feedback como source of truth.

### 28.13 APPROVAL_CAUSALITY_ERROR

**Definição:** Atribuir aprovação ao fator errado.

**Sintoma:** "Aprovado porque sujeito à direita, mas realmente porque copy protection."

**Exemplo:** Confundir correlação com causalidade.

**Detecção:** Padrão quebra em novo contexto.

**Prevenção:** Causal variable search, pairwise analysis.

**Recuperação:** Reclassificar causal variable.

### 28.14 EMBEDDING_ONLY_RETRIEVAL

**Definição:** Usar apenas embeddings para retrieval, ignorar estrutura.

**Sintoma:** "Retorna imagens visualmente similares mas estruturalmente diferentes."

**Exemplo:** Query por "premium authority" retorna imagens similares mas que resolvem problemas diferentes.

**Detecção:** Resultados não são relevantes para problema.

**Prevenção:** Usar retrieval híbrido, não apenas embeddings.

**Recuperação:** Implementar retrieval baseado em problema.

### 28.15 GENERIC_PATTERN_EXTRACTION

**Definição:** Extrair padrão genérico demais que não tem valor.

**Sintoma:** "Sistema aprendeu que 'composição boa é preferida'."

**Exemplo:** Padrão tão genérico que não fornece direção.

**Detecção:** Padrão não diferencia aprovados de rejeitados.

**Prevenção:** Exigir especificidade em padrões, validar discriminative power.

**Recuperação:** Remover padrão genérico.

### 28.16 REFERENCE_CONTAMINATION

**Definição:** Usar referência externa como evidência de preferência interna.

**Sintoma:** "Imagem externa foi usada como precedente, agora sistema acha que é preferência."

**Exemplo:** Usar external reference como evidência de aprovação.

**Detecção:** Origem é EXTERNAL_REFERENCE, não INTERNAL_APPROVED.

**Prevenção:** Nunca misturar evidência, classificar origem corretamente.

**Recuperação:** Reclassificar origem, remover de preferência evidence.

### 28.17 CRITIC_CONFIRMATION_BIAS

**Definição:** Critic confirma preferências VKB em vez de avaliar independentemente.

**Sintoma:** "Critic sempre aprova o que VKB recomenda."

**Exemplo:** Critic usa VKB como input em vez de como referência.

**Detecção:** Taxa de aprovação correlaciona perfeitamente com VKB recommendation.

**Prevenção:** Critic deve avaliar independentemente, usar VKB como contexto.

**Recuperação:** Recalibrar Critic para ser mais independente.

---

## 29. STORAGE ARCHITECTURE: MÚLTIPLOS BANCOS

Propor arquitetura possível envolvendo múltiplos tipos de armazenamento.

### 29.1 Opções de Storage

#### Opção 1: PostgreSQL + pgvector (Simplificado)

```
ARCHITECTURE_1 {
  name: "PostgreSQL + pgvector",
  
  components: [
    "PostgreSQL: Relational data (cases, problems, mechanisms, etc)",
    "pgvector: Vector embeddings (visual, textual, semantic)",
    "JSONB: Flexible metadata (feedback, analysis, etc)"
  ],
  
  advantages: [
    "Single database reduces operational complexity",
    "ACID transactions ensure consistency",
    "pgvector provides vector search",
    "JSONB provides flexibility",
    "Mature ecosystem, good tooling"
  ],
  
  disadvantages: [
    "Vector search may not be as optimized as specialized DB",
    "Graph queries can be complex",
    "Scaling vector search may require tuning"
  ],
  
  best_for: "V1 and V2, when data volume is moderate"
}
```

#### Opção 2: Specialized Vector DB (Optimized)

```
ARCHITECTURE_2 {
  name: "Specialized Vector DB (e.g., Pinecone, Weaviate)",
  
  components: [
    "PostgreSQL: Relational data",
    "Vector DB: Optimized vector search",
    "Object Storage: Images"
  ],
  
  advantages: [
    "Vector search is highly optimized",
    "Specialized for similarity search",
    "Better performance at scale"
  ],
  
  disadvantages: [
    "Adds operational complexity (multiple databases)",
    "Data synchronization challenges",
    "Higher cost"
  ],
  
  best_for: "V3+, when data volume is large and search performance is critical"
}
```

#### Opção 3: Graph Database (Relationship-Focused)

```
ARCHITECTURE_3 {
  name: "Graph Database (e.g., Neo4j)",
  
  components: [
    "Neo4j: Graph data (cases, problems, mechanisms, relationships)",
    "PostgreSQL: Relational data (metadata)",
    "Vector DB: Vector search"
  ],
  
  advantages: [
    "Graph queries are natural and efficient",
    "Relationship traversal is fast",
    "Pattern discovery is easier"
  ],
  
  disadvantages: [
    "Adds operational complexity",
    "Higher cost",
    "Learning curve"
  ],
  
  best_for: "V3+, when relationship analysis is critical"
}
```

#### Opção 4: Hybrid (Recomendado para V1)

```
ARCHITECTURE_4 {
  name: "Hybrid: PostgreSQL + pgvector + Object Storage",
  
  components: [
    "PostgreSQL + pgvector: Relational + vector data",
    "S3 or similar: Image storage",
    "Redis: Caching layer (optional)"
  ],
  
  advantages: [
    "Balanced complexity and capability",
    "Single relational database",
    "Vector search with pgvector",
    "Scalable image storage",
    "Good for V1-V2"
  ],
  
  disadvantages: [
    "Graph queries still complex",
    "May need to migrate to specialized DB later"
  ],
  
  best_for: "V1 and V2, with clear migration path to V3"
}
```

### 29.2 Recomendação

**Para V1:** PostgreSQL + pgvector + Object Storage

- Reduz complexidade operacional
- Suficiente para volume inicial
- Permite validar arquitetura
- Caminho claro para V2/V3

**Para V2:** Adicionar Redis para caching

- Melhora performance de queries frequentes
- Reduz carga em PostgreSQL

**Para V3:** Considerar Graph Database

- Quando análise de relacionamentos é crítica
- Quando volume de dados justifica

---

## 30. SCHEMAS: ESTRUTURA DE DADOS

Criar schemas conceituais para entidades principais.

### 30.1 DesignCase (Base)

```typescript
interface DesignCase {
  case_id: string; // UUID
  created_at: timestamp;
  project_id: string;
  
  // CLASSIFICATION
  status: "APPROVED" | "REJECTED" | "DRAFT";
  case_type: "INTERNAL" | "EXTERNAL_REFERENCE" | "BENCHMARK";
  
  // INPUT
  brief: {
    raw: string;
    normalized: object;
    format: string;
    niche: string;
    commercial_objective: string;
  };
  
  // ASSETS
  user_assets: Asset[];
  subject_assets: Asset[];
  reference_assets: Asset[];
  
  // PROCESS
  ideation_output: object;
  creative_direction_spec: object;
  technical_design_discussion: object;
  final_frame_spec: object;
  
  // GENERATION
  generated_image: Asset;
  alternative_generations: Asset[];
  rejected_variants: Asset[];
  
  // EVALUATION
  image_critic_output: object;
  human_feedback_raw: string;
  human_feedback_structured: object;
  human_decision: "APPROVED" | "REJECTED";
  
  // ANALYSIS
  design_problems_solved: string[]; // problem_ids
  design_mechanisms_used: string[]; // mechanism_ids
  mechanism_bundles: string[]; // bundle_ids
  
  // METADATA
  confidence: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  tags: string[];
}
```

### 30.2 DesignProblem

```typescript
interface DesignProblem {
  problem_id: string;
  name: string;
  description: string;
  
  // CONTEXT
  format: string;
  subject_type: string;
  commercial_objective: string;
  niche: string;
  
  // REQUIREMENTS
  copy_requirement: string;
  visual_requirement: string;
  emotional_goal: string;
  constraints: string[];
  
  // SOLUTIONS
  solved_by_cases: string[]; // case_ids
  failed_by_cases: string[]; // case_ids
  relevant_mechanisms: string[]; // mechanism_ids
  contradictory_mechanisms: string[]; // mechanism_ids
  
  // METRICS
  success_rate: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  frequency: number;
  
  // METADATA
  created_at: timestamp;
  confidence: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
}
```

### 30.3 DesignMechanism

```typescript
interface DesignMechanism {
  mechanism_id: string;
  name: string;
  description: string;
  
  // EFFECTS
  visual_effect: string;
  psychological_effect: string;
  
  // CONTEXT
  best_contexts: string[];
  failure_modes: string[];
  scope: "UNIVERSAL" | "FORMAT_SPECIFIC" | "NICHE_SPECIFIC" | "CONTEXT_SPECIFIC";
  
  // EXAMPLES
  known_examples: Asset[];
  approved_examples: string[]; // case_ids
  rejected_examples: string[]; // case_ids
  
  // RELATIONSHIPS
  works_well_with: string[]; // mechanism_ids
  contradicts: string[]; // mechanism_ids
  
  // PREFERENCE EVIDENCE
  human_preference_evidence: PreferenceEvidence[];
  
  // METADATA
  created_at: timestamp;
  confidence: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  evidence_count: number;
}
```

### 30.4 MyEyesPattern

```typescript
interface MyEyesPattern {
  pattern_id: string;
  name: string;
  description: string;
  
  // STATEMENT
  statement: string; // "Prefers X in context Y"
  
  // EVIDENCE
  evidence: {
    approved_cases: string[]; // case_ids
    rejected_cases: string[]; // case_ids
    pairwise_preferences: string[]; // pair_ids
    explicit_statements: string[];
  };
  
  // MATURITY
  maturity: "SINGLE_OBSERVATION" | "REPEATED_OBSERVATION" | "STRONG_PATTERN" | "HUMAN_CONFIRMED_PATTERN" | "VALIDATED_MY_EYES_PRINCIPLE";
  
  // SCOPE
  scope: {
    format: string | null;
    niche: string | null;
    commercial_objective: string | null;
    context: string;
  };
  
  // CONFIDENCE
  confidence: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  confidence_factors: string[];
  
  // TEMPORAL
  created_at: timestamp;
  last_updated: timestamp;
  evidence_by_period: {
    period: string;
    evidence_count: number;
  }[];
  
  // METADATA
  provenance: string; // HUMAN_EXPLICIT, HUMAN_APPROVAL, PAIRWISE_COMPARISON, etc
}
```

### 30.5 PairwisePreference

```typescript
interface PairwisePreference {
  pair_id: string;
  created_at: timestamp;
  
  // COMPARISON
  option_a: string; // case_id
  option_b: string; // case_id
  
  // PREFERENCE
  preferred: "A" | "B";
  preference_strength: "SLIGHT" | "MODERATE" | "STRONG" | "VERY_STRONG";
  
  // HUMAN STATEMENT
  human_statement: string;
  human_statement_raw: string;
  
  // DELTA ANALYSIS
  possible_deltas: {
    dimension: string;
    changed: boolean;
  }[];
  
  likely_causal_factors: string[];
  confidence_in_causality: "LOW" | "MEDIUM" | "HIGH";
  
  // CLASSIFICATION
  is_hard_pair: boolean;
  evidence_weight: number; // 0.0 to 1.0
  
  // METADATA
  context: object;
}
```

---

## 31. CASOS DE TESTE: 10 CENÁRIOS

Incluir no mínimo 10 casos de teste que validam a VKB.

### 31.1 CASE 1: Novo Hero de Niche Diferente

```
SCENARIO: "Novo hero para niche que não temos precedente direto"

QUERY: "Premium authority positioning for marine biology specialist"

EXISTING_PRECEDENTS: [
  "CASE_AVIATION_MENTOR_001",
  "CASE_STYLIST_HERO_001",
  "CASE_BIOLOGIST_HERO_001"
]

EXPECTED_BEHAVIOR:
- Retornar precedentes não por visual similarity
- Retornar por problema estrutural: "premium authority + copy protection + niche environment"
- Mecanismos relevantes: territorial separation, asymmetry, atmospheric depth
- Avisar: "Precedentes são visualmente diferentes, mas estruturalmente similares"

VALIDATION:
- Creative Director consegue usar precedentes sem copiar
- Solução é nova mas informada por padrões históricos
- Mecanismos são reutilizados, composição é nova
```

### 31.2 CASE 2: Thumbnail Extrema com Referência

```
SCENARIO: "Thumbnail de urgência com referência de alta densidade"

QUERY: "High-urgency thumbnail, reference is dense architectural image"

REFERENCE_TRANSFER_HISTORY: [
  "TRANSFER_CASE_001: Approved, aggressive transfer",
  "TRANSFER_CASE_002: Approved, aggressive transfer",
  "TRANSFER_CASE_003: Rejected, felt like direct copy"
]

EXPECTED_BEHAVIOR:
- Retornar histórico de transferência
- Avisar: "Aggressive transfer works when adapted to context"
- Sugerir mecanismos: foreground occlusion, explosive backlight
- Avisar: "Avoid direct copying of reference composition"

VALIDATION:
- Reference Translator usa histórico para informar transferência
- Resultado é novo, não cópia
```

### 31.3 CASE 3: Usuário Rejeita A e Aprova B

```
SCENARIO: "Pairwise preference clara entre duas versões"

VERSIONS:
- A: Subject centered, full-bleed background
- B: Subject right, copy left, atmospheric depth

HUMAN_DECISION: "B is much better"

EXPECTED_BEHAVIOR:
- Criar HARD_PAIR
- Analisar delta: subject positioning, copy treatment, composition
- Inferir: "Territorial separation > full-bleed for this problem"
- Atualizar MY_EYES_PATTERN se consistente

VALIDATION:
- Pairwise preference é capturada
- Delta é analisado corretamente
- Padrão é atualizado com confiança apropriada
```

### 31.4 CASE 4: Critic Prefere B, Humano Prefere A

```
SCENARIO: "Critic e humano discordam"

CRITIC_EVALUATION: "B is technically superior, better hierarchy"
HUMAN_DECISION: "A is better, feels more premium"

EXPECTED_BEHAVIOR:
- Armazenar ambas as avaliações
- Não forçar concordância
- Aprender que "technical quality" ≠ "premium perception"
- Avisar: "Critic and human disagree, investigate"

VALIDATION:
- Discordância é documentada
- Não há assumção de que um está certo
- Sistema aprende nuances de preferência
```

### 31.5 CASE 5: Nova Solução Contradiz Padrões Antigos

```
SCENARIO: "Creative Director propõe solução que contradiz padrão histórico"

PATTERN: "Territorial separation preferred in heróis"
PROPOSAL: "Full-bleed integration with overlay copy"
HUMAN_DECISION: "Approved, this is better"

EXPECTED_BEHAVIOR:
- Não bloquear porque contradiz padrão
- Armazenar como APPROVED_CASE
- Atualizar PREFERENCE_DRIFT
- Questionar: "Padrão mudou ou era context-specific?"

VALIDATION:
- Criatividade não é suprimida por padrões históricos
- Novidade é permitida e documentada
- Padrões são revistos quando necessário
```

### 31.6 CASE 6: 20 Peças Indicam Preferência, Mas Análise Descobre Variável

```
SCENARIO: "Superficial pattern vs causal variable"

OBSERVATION: "20 approved heróis têm sujeito à direita"
ANALYSIS: "Todos têm copy à esquerda"
HYPOTHESIS: "Copy placement é variável causal, não aesthetic"
TEST: "Encontrar heróis com copy à direita"
RESULT: "Sujeito também está à direita"

EXPECTED_BEHAVIOR:
- Detectar padrão superficial
- Investigar variável causal
- Reclassificar: "Subject positioning driven by copy placement"
- Não criar falsa preferência

VALIDATION:
- Anti-overfitting mecanismos funcionam
- Causal variables são identificadas
- Padrão é reclassificado corretamente
```

### 31.7 CASE 7: Referência Externa Entra na VKB

```
SCENARIO: "Usuário fornece referência externa de alta qualidade"

REFERENCE: "Architectural photography of premium space"
CLASSIFICATION: "EXTERNAL_REFERENCE"

EXPECTED_BEHAVIOR:
- Armazenar com origem clara
- Usar para precedent memory
- NÃO usar como evidência de preferência
- Permitir transfer learning

VALIDATION:
- Origem é classificada corretamente
- Não contamina preferência inference
- Pode ser usada para inspiração técnica
```

### 31.8 CASE 8: Reference Translator Consulta Histórico

```
SCENARIO: "Reference Translator precisa saber como transferências foram feitas antes"

QUERY: "Como transferir alta densidade visual de referência sem perder semântica da base?"

EXPECTED_BEHAVIOR:
- Retornar histórico de transfer cases
- Sugerir mecanismos: "adapted elements", "rejected reference elements"
- Avisar: "Aggressive transfer works when adapted"
- Não retornar "imagem parecida"

VALIDATION:
- Reference Translator consegue consultar VKB estruturadamente
- Resposta é operacional, não visual
```

### 31.9 CASE 9: VKB Retorna Precedente Visualmente Diferente Mas Estruturalmente Relevante

```
SCENARIO: "Precedente é visualmente muito diferente mas resolve mesmo problema"

QUERY: "Premium authority positioning with copy protection"

PRECEDENT_A: "Aviation mentor hero (blue, technical)"
PRECEDENT_B: "Stylist hero (warm, fashion)"
PRECEDENT_C: "Biologist hero (green, nature)"

EXPECTED_BEHAVIOR:
- Retornar todos três como igualmente relevantes
- Avisar: "Visually different, structurally similar"
- Sugerir: "Extract mechanisms, not visual style"

VALIDATION:
- Retrieval não é dominado por visual similarity
- Precedentes estruturalmente relevantes são encontrados
- Creative Director consegue usar sem copiar
```

### 31.10 CASE 10: Sistema Detecta Que Está Repetindo Demais Um Mecanismo

```
SCENARIO: "Últimas 5 gerações usaram mesmo mecanismo"

MECHANISM: "Foreground occlusion"
USAGE_COUNT: 5 consecutive cases
NOVELTY_SCORE: 0.35 (baixo)

EXPECTED_BEHAVIOR:
- Detectar repetição
- Avisar: "This mechanism has been used 5 times recently"
- Sugerir: "Consider alternative mechanisms"
- Não bloquear, apenas avisar

VALIDATION:
- Repetição é detectada
- Sistema avisa sem bloquear
- Criatividade é encorajada
```

---

## 32. BOOTSTRAPPING: FASES V0-V3

Explicar como começar sem milhares de decisões.

### 32.1 V0: Manual Seed (Semana 1-2)

```
V0_PHASE {
  name: "Manual Seed",
  duration: "1-2 weeks",
  
  goal: "Criar base inicial de conhecimento",
  
  activities: [
    "Analisar manualmente 3 approved design cases",
    "Extrair design problems",
    "Extrair design mechanisms",
    "Criar mechanism bundles",
    "Documentar my eyes patterns iniciais"
  ],
  
  output: [
    "3 DesignCase entries",
    "3-5 DesignProblem entries",
    "5-10 DesignMechanism entries",
    "2-3 MechanismBundle entries",
    "5-10 MyEyesPattern entries (low confidence)"
  ],
  
  validation: [
    "Creative Director consegue consultar VKB",
    "Resultados são relevantes",
    "Não há alucinações"
  ]
}
```

### 32.2 V1: Automated Ingestion (Semana 3-4)

```
V1_PHASE {
  name: "Automated Ingestion",
  duration: "2-3 weeks",
  
  goal: "Ingerir histórico existente",
  
  activities: [
    "Implementar ingestion pipeline",
    "Ingerir ~20 peças aprovadas existentes",
    "Validar metadados",
    "Atualizar mecanismos",
    "Atualizar my eyes patterns"
  ],
  
  output: [
    "~20 DesignCase entries",
    "~10-15 DesignProblem entries",
    "~15-25 DesignMechanism entries",
    "~5-10 MechanismBundle entries",
    "~20-30 MyEyesPattern entries (medium confidence)"
  ],
  
  validation: [
    "Retrieval por problema funciona",
    "Retrieval por mecanismo funciona",
    "Padrões têm confiança apropriada"
  ]
}
```

### 32.3 V2: Pairwise Learning (Semana 5-8)

```
V2_PHASE {
  name: "Pairwise Learning",
  duration: "3-4 weeks",
  
  goal: "Aprender de comparações",
  
  activities: [
    "Coletar pairwise preferences de novas gerações",
    "Analisar deltas",
    "Identificar hard pairs",
    "Atualizar my eyes patterns com pairwise evidence",
    "Validar causal variables"
  ],
  
  output: [
    "~30-50 PairwisePreference entries",
    "~10-15 HardPair entries",
    "Atualizado MyEyesPattern com pairwise evidence",
    "Causal variables identificadas"
  ],
  
  validation: [
    "Pairwise preferences são capturadas",
    "Hard pairs são identificadas",
    "Causal variables são validadas"
  ]
}
```

### 32.4 V3: Scale and Refinement (Semana 9+)

```
V3_PHASE {
  name: "Scale and Refinement",
  duration: "ongoing",
  
  goal: "Escalar e refinar",
  
  activities: [
    "Ingerir ~500 peças existentes",
    "Implementar graph database se necessário",
    "Refinar retrieval strategies",
    "Detectar e corrigir failure modes",
    "Implementar active learning"
  ],
  
  output: [
    "~500 DesignCase entries",
    "~100-150 DesignProblem entries",
    "~50-100 DesignMechanism entries",
    "~20-30 MechanismBundle entries",
    "~100+ MyEyesPattern entries (high confidence)"
  ],
  
  validation: [
    "VKB melhora aprovação humana",
    "Novelty scores são altos",
    "Failure modes são raros"
  ]
}
```

### 32.5 Regra: Não Fingir Suficiência

Não fingir que 3 casos são suficientes para aprender o gosto inteiro. Cada fase tem expectativa clara de confiança.

```
CONFIDENCE_BY_PHASE: {
  V0: "LOW to MEDIUM",
  V1: "MEDIUM",
  V2: "MEDIUM to HIGH",
  V3: "HIGH to VERY_HIGH"
}
```

---

## 33. MIGRAÇÃO DAS ~500 PEÇAS

Processo para ingestão em lote das centenas de peças visuais existentes.

### 33.1 Estratégia de Migração

```
MIGRATION_STRATEGY {
  phase_1: "Inventory and Classification",
  phase_2: "Metadata Extraction",
  phase_3: "Automated Analysis",
  phase_4: "Human Validation",
  phase_5: "VKB Ingestion"
}
```

### 33.2 Phase 1: Inventory and Classification

```
PHASE_1 {
  activity: "Inventariar as ~500 peças",
  
  classification: [
    "Provenance: internal approved, internal rejected, external, benchmark",
    "Format: hero, thumbnail, card, social, etc",
    "Niche: aviation, fashion, biology, etc",
    "Quality: high, medium, low",
    "Available context: full, partial, minimal"
  ],
  
  output: "Spreadsheet com 500 peças classificadas"
}
```

### 33.3 Phase 2: Metadata Extraction

```
PHASE_2 {
  activity: "Extrair metadados de cada peça",
  
  metadata: [
    "Brief (se disponível)",
    "Approval status",
    "Human feedback (se disponível)",
    "Generation date",
    "Format",
    "Niche"
  ],
  
  output: "Metadados estruturados para 500 peças"
}
```

### 33.4 Phase 3: Automated Analysis

```
PHASE_3 {
  activity: "Análise automática de cada peça",
  
  analysis: [
    "Visual analysis: composition, hierarchy, depth, etc",
    "Semantic analysis: what is it communicating",
    "Mechanism suggestion: quais mecanismos podem estar presentes"
  ],
  
  output: "Análise automática para 500 peças (LOW confidence)"
}
```

### 33.5 Phase 4: Human Validation

```
PHASE_4 {
  activity: "Validação humana de análise",
  
  validation_strategy: [
    "Sample 50 peças (10%) para validação completa",
    "Corrigir erros em análise automática",
    "Refinar mecanismos sugeridos",
    "Validar problemas de design"
  ],
  
  output: "Análise validada para 50 peças, padrões para aplicar a 450"
}
```

### 33.6 Phase 5: VKB Ingestion

```
PHASE_5 {
  activity: "Ingerir 500 peças na VKB",
  
  ingestion: [
    "Criar DesignCase para cada peça",
    "Conectar a DesignProblems",
    "Conectar a DesignMechanisms",
    "Gerar embeddings",
    "Conectar ao graph"
  ],
  
  output: "500 peças na VKB"
}
```

### 33.7 Regra: Não Inventar Rationale

```
CRITICAL_RULE: "Uma peça sem histórico não pode receber rationale inventado"

EXAMPLE_WRONG: [
  "Peça: Imagem de aviação",
  "Análise automática: 'Provavelmente aprovada por lighting'",
  "Armazenar como: 'Aprovada por lighting'"
]

EXAMPLE_RIGHT: [
  "Peça: Imagem de aviação",
  "Análise automática: 'Observa-se: lighting premium, composição assimétrica'",
  "Armazenar como: 'OBSERVED_VISUAL_PROPERTIES: premium lighting, asymmetric composition'",
  "Não armazenar: 'KNOWN_REASON_FOR_APPROVAL' sem evidência"
]
```

---

## 34. RATIONALE PROBLEM: DISTINÇÃO CRÍTICA

O sistema não pode afirmar "O humano aprovou porque gostou da iluminação" se apenas sabemos "O humano aprovou."

### 34.1 Distinção de Níveis

```
LEVEL_1_OBSERVED_PROPERTY {
  definition: "Propriedade visual observada na imagem",
  example: "Lighting is warm and directional",
  confidence: "VERY_HIGH",
  can_infer: "Image has warm directional lighting"
}

LEVEL_2_CORRELATED_PROPERTY {
  definition: "Propriedade que aparece junto com aprovação",
  example: "Approved images tend to have warm lighting",
  confidence: "MEDIUM",
  can_infer: "Warm lighting may be correlated with approval"
}

LEVEL_3_INFERRED_FACTOR {
  definition: "Fator que pode ter causado aprovação",
  example: "Warm lighting may have caused approval",
  confidence: "LOW",
  can_infer: "Warm lighting might be a factor"
}

LEVEL_4_EXPLICIT_HUMAN_REASON {
  definition: "Razão explicitamente dita pelo humano",
  example: "Human said: 'I like the warm lighting'",
  confidence: "VERY_HIGH",
  can_infer: "Warm lighting was a factor in approval"
}
```

### 34.2 Schema com Distinção

```
DESIGN_CASE_RATIONALE {
  case_id: string,
  
  // OBSERVED
  observed_properties: {
    property: string,
    confidence: "VERY_HIGH"
  }[],
  
  // CORRELATED
  correlated_properties: {
    property: string,
    correlation_strength: "LOW" | "MEDIUM" | "HIGH",
    confidence: "LOW" | "MEDIUM" | "HIGH"
  }[],
  
  // INFERRED
  inferred_factors: {
    factor: string,
    likelihood: "LOW" | "MEDIUM" | "HIGH",
    confidence: "LOW" | "MEDIUM" | "HIGH",
    evidence: string[]
  }[],
  
  // EXPLICIT
  explicit_human_reasons: {
    reason: string,
    source: "raw_feedback" | "structured_feedback",
    confidence: "VERY_HIGH"
  }[]
}
```

---

## 35. ACTIVE LEARNING: NÃO INTRUSIVO

Quando o sistema estiver incerto sobre uma preferência importante, pode aproveitar decisões naturais do usuário.

### 35.1 Estratégia de Active Learning

```
ACTIVE_LEARNING_STRATEGY {
  principle: "Não interromper projeto com questionários",
  
  learning_opportunities: [
    "Quando usuário escolhe A > B: Aprender preferência",
    "Quando usuário comenta: Aprender razão",
    "Quando usuário rejeita: Aprender o que não funciona",
    "Quando usuário aprova: Aprender o que funciona"
  ]
}
```

### 35.2 Exemplo: Feedback Gratuito

```
SCENARIO_1: "Usuário escolhe A > B"

LEARNING: "Pairwise preference capturada"
VALUE: "Médio"

SCENARIO_2: "Usuário comenta: 'A primeira tem mais profundidade'"

LEARNING: "Pairwise preference + razão explícita"
VALUE: "Alto"

SCENARIO_3: "Usuário comenta: 'A primeira tem mais profundidade, que é importante para premium'"

LEARNING: "Pairwise preference + razão + contexto"
VALUE: "Muito alto"
```

### 35.3 Implementação

```
ACTIVE_LEARNING_IMPLEMENTATION {
  trigger: "Quando confiança em padrão é MEDIUM e contexto é relevante",
  
  action: "Não interromper, apenas registrar oportunidade",
  
  example: [
    "Sistema observa: Usuário escolheu A > B",
    "Sistema registra: Pairwise preference",
    "Sistema não pergunta: 'Por que você preferiu A?'",
    "Se usuário comenta: Sistema captura razão",
    "Se usuário não comenta: Sistema aprende apenas preferência"
  ]
}
```

---

## 36. MEMORY WRITE POLICY: QUANDO ARMAZENAR

Nem toda geração entra como conhecimento forte.

### 36.1 Níveis de Armazenamento

```
STORE_RAW {
  definition: "Armazenar imagem e metadados básicos",
  when: "Sempre, para todas as gerações",
  confidence: "VERY_HIGH",
  use_for: "Histórico, análise posterior"
}

STORE_ANALYZED {
  definition: "Armazenar com análise visual e semântica",
  when: "Quando análise automática é confiável",
  confidence: "MEDIUM",
  use_for: "Retrieval, pattern mining"
}

PROMOTE_TO_APPROVED_CASE {
  definition: "Armazenar como caso aprovado com histórico completo",
  when: "Quando humano aprova explicitamente",
  confidence: "VERY_HIGH",
  use_for: "Precedent memory, preference inference"
}

PROMOTE_TO_GOLDEN_DATASET {
  definition: "Armazenar em dataset de alta confiança",
  when: "Quando caso é particularmente valioso",
  confidence: "VERY_HIGH",
  use_for: "Benchmark, validation, training"
}

PROMOTE_TO_MY_EYES_EVIDENCE {
  definition: "Usar como evidência de preferência",
  when: "Quando aprovação é clara e contexto é relevante",
  confidence: "HIGH",
  use_for: "Preference inference"
}

PROMOTE_TO_VALIDATED_PATTERN {
  definition: "Usar para validar padrão",
  when: "Quando padrão é confirmado por múltiplos casos",
  confidence: "VERY_HIGH",
  use_for: "Recomendações, direção criativa"
}
```

### 36.2 Regra: Não Contaminar Memória

```
CONTAMINATION_EXAMPLE {
  wrong: "Armazenar output ruim como 'APPROVED_CASE'",
  right: "Armazenar como 'STORE_RAW', marcar como 'REJECTED', não promover"
}
```

---

## 37. MEMORY READ POLICY: QUEM CONSULTA O QUÊ

Cada agente precisa de retrieval diferente.

### 37.1 Read Policies por Agente

```
CREATIVE_DIRECTOR_POLICY {
  can_read: [
    "APPROVED_CASES (high confidence)",
    "DESIGN_PROBLEMS (all)",
    "DESIGN_MECHANISMS (high confidence)",
    "MECHANISM_BUNDLES (high confidence)",
    "MY_EYES_PATTERNS (medium+ confidence)"
  ],
  
  cannot_read: [
    "REJECTED_CASES (may bias negatively)",
    "FAILURE_MODES (may bias negatively)"
  ],
  
  retrieval_strategy: "Problem-based + mechanism-based, not visual similarity"
}

REFERENCE_TRANSLATOR_POLICY {
  can_read: [
    "REFERENCE_TRANSFER_CASES (all)",
    "DESIGN_PROBLEMS (relevant ones)",
    "DESIGN_MECHANISMS (all)"
  ],
  
  cannot_read: [
    "MY_EYES_PATTERNS (may bias transfer)"
  ],
  
  retrieval_strategy: "Transfer history + mechanism-based"
}

IMAGE_CRITIC_POLICY {
  can_read: [
    "APPROVED_CASES (for comparison)",
    "REJECTED_CASES (for comparison)",
    "FAILURE_MODES (for detection)",
    "MY_EYES_PATTERNS (for evaluation)"
  ],
  
  cannot_read: [
    "Nothing, critic needs full context"
  ],
  
  retrieval_strategy: "Comparative analysis"
}

VISUAL_LEARNING_SYSTEM_POLICY {
  can_read: [
    "All data for analysis"
  ],
  
  cannot_read: [
    "Nothing, learning system needs full context"
  ],
  
  retrieval_strategy: "Full access for pattern mining"
}
```

### 37.2 Princípio: Não Devolver Tudo para Todos

```
PRINCIPLE {
  statement: "Tokens são abundantes, mas ATTENTION QUALITY continua importante",
  
  implication: "Cada agente recebe apenas informação relevante",
  
  benefit: [
    "Reduz ruído",
    "Melhora qualidade de decisão",
    "Reduz alucinação"
  ]
}
```

---

## 38. EVENT SOURCING: RELAÇÃO COM DETERMINISTIC CORE

O Deterministic Core mantém o histórico factual do projeto. A VKB mantém conhecimento reutilizável entre projetos.

### 38.1 Distinção

```
PROJECT_STATE (Deterministic Core) {
  definition: "Histórico fact
ual do projeto, cada decisão, cada iteração",
  scope: "Single project",
  retention: "Permanent, immutable"
}

CROSS_PROJECT_KNOWLEDGE (VKB) {
  definition: "Conhecimento reutilizável entre projetos",
  scope: "All projects",
  retention: "Evolving, refinable"
}
```

### 38.2 Quando um Evento se Torna Conhecimento

```
TRANSFORMATION_PROCESS {
  step_1: "Evento ocorre no projeto (ex: aprovação)",
  step_2: "Evento é registrado no Deterministic Core",
  step_3: "Evento é analisado pelo Visual Learning System",
  step_4: "Conhecimento é extraído (problema, mecanismo, preferência)",
  step_5: "Conhecimento é armazenado na VKB",
  step_6: "Conhecimento é disponibilizado para futuros projetos"
}
```

### 38.3 Exemplo

```
EVENT_EXAMPLE {
  project_id: "PROJECT_AVIATION_MENTOR_001",
  
  event: "HUMAN_APPROVAL",
  image: "aviation_hero_v2.png",
  timestamp: "2026-08-09T10:30:00Z",
  
  // DETERMINISTIC CORE RECORDS
  core_record: {
    project_id: "PROJECT_AVIATION_MENTOR_001",
    event_type: "HUMAN_APPROVAL",
    image_id: "aviation_hero_v2.png",
    timestamp: "2026-08-09T10:30:00Z",
    immutable: true
  },
  
  // VKB EXTRACTS
  vkb_extraction: {
    design_case_id: "CASE_AVIATION_MENTOR_001",
    design_problem_id: "PROBLEM_AVIATION_MENTOR_HERO_001",
    mechanisms: ["SUBJECT_COPY_TERRITORIAL_SEPARATION", "CONTROLLED_ASYMMETRY"],
    my_eyes_pattern: "Prefers territorial separation in premium authority heróis"
  },
  
  // FUTURE PROJECTS BENEFIT
  future_query: "Find precedents for premium authority positioning",
  future_result: "CASE_AVIATION_MENTOR_001 is returned"
}
```

---

## 39. DESIGN BUILDER EYE: VISÃO DE LONGO PRAZO

A visão de longo prazo é que o sistema desenvolva **THE DESIGN BUILDER EYE**.

### 39.1 Capacidades do Design Builder Eye

```
CAPABILITY_1: "Entender se imagem passaria pela régua do criador"

CAPABILITY_2: "Explicar por quê"

CAPABILITY_3: "Sugerir qual decisão deveria mudar para aumentar chance de aprovação"
```

### 39.2 O Que Aprender

```
LEARN_DECISIONS {
  not: "pixels",
  but: "decisions"
}

LEARN_DIRECTIONS {
  not: "styles",
  but: "directions"
}

LEARN_PROBLEMS {
  not: "images",
  but: "problems"
}

LEARN_COMPARISONS {
  not: "scores",
  but: "comparisons"
}

LEARN_CONTEXT {
  not: "global preference",
  but: "context"
}
```

### 39.3 Implementação Progressiva

```
PHASE_1: "Entender se imagem seria aprovada"
PHASE_2: "Explicar razão da aprovação"
PHASE_3: "Sugerir melhorias"
PHASE_4: "Aprender novos padrões"
PHASE_5: "Antecipar preferências"
```

---

## 40. CRÍTICA OBRIGATÓRIA: ATACAR A PRÓPRIA PROPOSTA

No final, atacar a própria proposta.

### 40.1 Questões Críticas

```
QUESTION_1: "Precisamos mesmo de um graph database?"

RESPONSE: "Talvez não em V1. PostgreSQL + pgvector é suficiente. Graph database é útil em V3+ quando análise de relacionamentos é crítica."

CLASSIFICATION: "ARCHITECTURAL_HYPOTHESIS"

---

QUESTION_2: "Embeddings multimodais são suficientes para V1?"

RESPONSE: "Não. Embeddings visuais podem retornar imagens similares que resolvem problemas diferentes. Retrieval híbrido é necessário desde V1."

CLASSIFICATION: "KNOWN_REQUIREMENT"

---

QUESTION_3: "Estamos tentando estruturar demais design?"

RESPONSE: "Risco real. Design é criativo e emergente. VKB deve informar, não constrair. Proteção contra VKB_DOMINANCE é crítica."

CLASSIFICATION: "ARCHITECTURAL_HYPOTHESIS"

---

QUESTION_4: "Mecanismos podem virar taxonomia artificial?"

RESPONSE: "Sim. Risco de criar categorias que não refletem realidade. Solução: Validação humana, evolução contínua, disposição de reclassificar."

CLASSIFICATION: "KNOWN_RISK"

---

QUESTION_5: "Quem valida mecanismos?"

RESPONSE: "Creative Director inicialmente, depois sistema aprende. Mas human-in-the-loop é essencial para evitar alucinações."

CLASSIFICATION: "KNOWN_REQUIREMENT"

---

QUESTION_6: "Como impedir racionais pós-hoc?"

RESPONSE: "Preservar raw feedback, não inventar rationale, usar apenas evidência explícita. Difícil mas crítico."

CLASSIFICATION: "KNOWN_REQUIREMENT"

---

QUESTION_7: "My Eyes pode criar confirmation bias?"

RESPONSE: "Sim. Critic pode confirmar preferências VKB em vez de avaliar independentemente. Proteção: Critic deve ser independente."

CLASSIFICATION: "KNOWN_RISK"

---

QUESTION_8: "VKB pode reduzir criatividade?"

RESPONSE: "Sim. Se VKB domina decisões. Proteção: Autoridade criativa, encorajamento de experimentação, proteção contra PAST-PREFERENCE PRISON."

CLASSIFICATION: "KNOWN_RISK"

---

QUESTION_9: "500 imagens são realmente úteis sem contexto?"

RESPONSE: "Não. Imagens sem histórico têm valor limitado. Priorizar casos com contexto completo. Usar imagens sem contexto apenas para precedent memory."

CLASSIFICATION: "KNOWN_REQUIREMENT"

---

QUESTION_10: "Quais dados têm maior ROI?"

RESPONSE: "Hard pairs > Approved cases > Rejected cases > External references. Focar em dados de alta qualidade."

CLASSIFICATION: "EVIDENCE_BASED_INFERENCE"

---

QUESTION_11: "Deveríamos começar apenas com pairwise + Approved Cases?"

RESPONSE: "Sim, para V1. Adicionar complexidade progressivamente. Pairwise é mais valioso que volume."

CLASSIFICATION: "RECOMMENDATION"

---

QUESTION_12: "Qual é a versão mínima que preserva 80% do valor?"

RESPONSE: "V1: PostgreSQL + pgvector + 20 approved cases + pairwise learning. Simples, validável, escalável."

CLASSIFICATION: "RECOMMENDATION"
```

### 40.2 Classificação de Conclusões

| Tipo | Definição | Exemplo |
|------|-----------|---------|
| **KNOWN_REQUIREMENT** | Requisito confirmado por análise | "Preservar raw feedback é crítico" |
| **EVIDENCE_BASED_INFERENCE** | Inferência suportada por evidência | "Hard pairs têm maior ROI que volume" |
| **ARCHITECTURAL_HYPOTHESIS** | Hipótese sobre arquitetura | "Graph DB é útil em V3+" |
| **RECOMMENDATION** | Recomendação baseada em análise | "Começar com V1 simplificado" |

---

## 41. DEFINIÇÕES DE DONE

Critérios de sucesso para cada fase.

### 41.1 V0 Definition of Done

```
V0_DONE {
  criteria: [
    "3 approved design cases estão documentados",
    "5-10 design mechanisms estão identificados",
    "Creative Director consegue consultar VKB",
    "Resultados são relevantes",
    "Não há alucinações óbvias",
    "Confiança é apropriada (LOW-MEDIUM)"
  ]
}
```

### 41.2 V1 Definition of Done

```
V1_DONE {
  criteria: [
    "~20 approved cases estão ingeridos",
    "~15 design problems estão documentados",
    "~20 design mechanisms estão documentados",
    "Retrieval por problema funciona",
    "Retrieval por mecanismo funciona",
    "Padrões têm confiança apropriada (MEDIUM)",
    "Nenhuma contaminação de evidência"
  ]
}
```

### 41.3 V2 Definition of Done

```
V2_DONE {
  criteria: [
    "~30-50 pairwise preferences estão capturadas",
    "~10-15 hard pairs estão identificados",
    "Causal variables estão validados",
    "Preference drift está sendo rastreado",
    "Anti-overfitting mecanismos funcionam",
    "Confiança é apropriada (MEDIUM-HIGH)"
  ]
}
```

### 41.4 V3 Definition of Done

```
V3_DONE {
  criteria: [
    "~500 peças estão ingeridas",
    "Graph database está em produção (se necessário)",
    "Retrieval strategies estão otimizadas",
    "Failure modes são raros",
    "VKB melhora aprovação humana (benchmark)",
    "Novelty scores são altos",
    "Confiança é apropriada (HIGH-VERY_HIGH)"
  ]
}
```

---

## 42. EDGE CASES: CENÁRIOS COMPLEXOS

Casos extremos que a VKB deve lidar.

### 42.1 Edge Case 1: Preferência Contraditória no Mesmo Contexto

```
SCENARIO: "Criador aprova minimalismo E caos visual no mesmo formato"

HANDLING:
- Não forçar concordância
- Investigar se contexto é realmente idêntico
- Documentar ambas as preferências
- Marcar como "context-specific variation"
- Não criar falsa preferência
```

### 42.2 Edge Case 2: Mudança Radical de Preferência

```
SCENARIO: "Criador muda completamente de gosto entre 2026 e 2028"

HANDLING:
- Detectar preference drift
- Não descartar história
- Weight recent evidence higher
- Investigar se mudança é real ou contextual
- Documentar temporal evolution
```

### 42.3 Edge Case 3: Crítico Muito Rigoroso

```
SCENARIO: "Critic rejeita 90% das gerações, humano aprova 70%"

HANDLING:
- Não forçar concordância
- Aprender que critic é mais rigoroso
- Usar critic como "aspirational standard"
- Não deixar critic bloquear criatividade
- Investigar se critic está calibrado corretamente
```

### 42.4 Edge Case 4: Referência Ambígua

```
SCENARIO: "Referência pode ser interpretada de múltiplas formas"

HANDLING:
- Documentar ambiguidade
- Permitir múltiplas interpretações
- Não forçar uma única leitura
- Aprender de resultado final qual interpretação foi correta
```

### 42.5 Edge Case 5: Caso Único Muito Valioso

```
SCENARIO: "Uma peça é tão boa que deveria ter peso alto, mas é apenas 1 caso"

HANDLING:
- Marcar como "GOLDEN_DATASET"
- Aumentar confiança apropriadamente
- Mas não criar regra de 1 caso
- Usar como "aspirational example"
```

---

## 43. BENCHMARKING: VALIDAR VALOR

Precisamos provar que VKB melhora o Design Builder.

### 43.1 Teste A/B/C

```
TEST_SETUP {
  condition_a: "Creative Director sem VKB",
  condition_b: "Creative Director com visual-similarity retrieval",
  condition_c: "Creative Director com Design Problem + Mechanism VKB"
}

METHODOLOGY {
  use_same_briefs: true,
  number_of_briefs: 10-20,
  randomize_order: true,
  blind_evaluation: true
}
```

### 43.2 Métricas de Avaliação

```
METRICS {
  human_preference: "Qual versão o criador prefere?",
  originality: "Quão original é a solução?",
  brief_fit: "Quão bem resolve o brief?",
  composition: "Qualidade composicional",
  reference_intelligence: "Inteligência de referência",
  premium_perception: "Percepção de qualidade premium",
  my_eyes_alignment: "Alinhamento com preferências do criador",
  repetition: "Quão repetitiva é?",
  genericness: "Quão genérica é?"
}
```

### 43.3 Hipótese e Falsificação

```
HYPOTHESIS: "C > A > ou = B"

MEANING: "VKB com problem + mechanism retrieval > sem VKB > visual similarity"

FALSIFICATION_CRITERIA: [
  "Se C < A: VKB está prejudicando criatividade",
  "Se B > C: Visual similarity é melhor que problem-based retrieval",
  "Se C = A: VKB não está adicionando valor"
]

ACTION: "Se VKB não aumentar aprovação humana, ela está adicionando complexidade sem valor"
```

---

## 44. GOLDEN DATASET: DISTINÇÃO COM VKB

Explicar relação entre VKB e Golden Dataset.

### 44.1 Definições

```
VKB {
  definition: "Memória operacional ampla",
  size: "~500 peças em V3",
  confidence: "Variável (LOW a VERY_HIGH)",
  use: "Informar decisões, fornecer contexto",
  evolution: "Contínua, refinável"
}

GOLDEN_DATASET {
  definition: "Dataset menor, mais confiável, altamente validado",
  size: "~50-100 peças",
  confidence: "Consistentemente HIGH-VERY_HIGH",
  use: "Benchmark, validação, training",
  evolution: "Rara, apenas quando confirmado"
}
```

### 44.2 Conteúdo do Golden Dataset

```
GOLDEN_DATASET_CONTENTS {
  hard_pairs: "Comparações muito claras",
  canonical_approvals: "Exemplos perfeitos de sucesso",
  canonical_failures: "Exemplos claros de falha",
  important_reference_transfer_cases: "Transferências bem-executadas",
  edge_cases: "Casos que desafiam padrões"
}
```

### 44.3 Regra: Não Confundir

```
WRONG: "Usar VKB como Golden Dataset"
RIGHT: "VKB informa, Golden Dataset valida"

WRONG: "Confiar em VKB para decisões críticas sem validação"
RIGHT: "Usar Golden Dataset para decisões críticas"
```

---

## 45. CONCLUSÃO: A VKB COMO SISTEMA COGNITIVO

A Visual Knowledge Base não é um banco de dados de imagens. É um **sistema cognitivo** que aprende como problemas visuais foram resolvidos.

### 45.1 Princípios Centrais

1. **Conhecimento, não cópia:** A VKB armazena conhecimento de design, não imagens para copiar.

2. **Estrutura, não superfície:** Armazena mecanismos e problemas, não estilos e aparências.

3. **Contexto, não absoluto:** Todas as preferências têm contexto, nenhuma é universal.

4. **Evidência, não inferência:** Preserva raw feedback, não inventa racionais.

5. **Provenance, não magia:** Todo conhecimento responde "de onde veio?"

6. **Confiança, não certeza:** Usa níveis de confiança baseados em evidência.

7. **Criatividade, não repetição:** Protege autoridade criativa, evita past-preference prison.

8. **Aprendizado, não estagnação:** Evolui com novos dados, detecta preference drift.

### 45.2 Sucesso Significa

```
SUCCESS {
  not: "Sistema retorna imagens similares",
  but: "Sistema compreende problemas e sugere mecanismos"
}

SUCCESS {
  not: "Sistema copia casos anteriores",
  but: "Sistema reutiliza princípios em contextos novos"
}

SUCCESS {
  not: "Sistema aprende preferências absolutas",
  but: "Sistema compreende preferências contextuais"
}

SUCCESS {
  not: "Sistema reduz criatividade",
  but: "Sistema amplifica criatividade informada"
}
```

### 45.3 A Frase Central

> **THE VKB DOES NOT REMEMBER WHAT TO COPY. IT REMEMBERS HOW VISUAL PROBLEMS WERE SOLVED.**

Esta frase deve guiar todas as decisões de implementação, design e evolução da VKB.

---

## REFERÊNCIAS E RECURSOS

### Conceitos Relacionados

- **Design Thinking:** Abordagem centrada em problemas
- **Knowledge Graphs:** Estruturação de relacionamentos
- **Active Learning:** Aprendizado a partir de interações
- **Preference Learning:** Aprendizado de preferências
- **Causal Inference:** Identificação de causalidade
- **Temporal Dynamics:** Evolução ao longo do tempo

### Tecnologias Mencionadas

- PostgreSQL + pgvector
- Neo4j (Graph Database)
- Pinecone/Weaviate (Vector Databases)
- Redis (Caching)
- S3 (Object Storage)

### Próximos Passos

1. **Validar arquitetura** com implementação V0
2. **Coletar feedback** do Creative Director
3. **Iterar rapidamente** em V1-V2
4. **Benchmarkar** contra baseline
5. **Escalar** para V3 com confiança

---

**Documento preparado para:** NotebookLM, análise de longo prazo, implementação futura  
**Nível de detalhe:** Completo, operacional, autocontido  
**Última atualização:** 2026-08-09  
**Status:** Pronto para implementação V0

# DOCUMENTO 02 — Reference Translator + Reference Workflow
## Design Builder — Documentação Técnica Permanente

> Status: fonte canônica. Este documento deve ser suficiente, sozinho, para reconstruir a filosofia, o comportamento, os contratos e o workflow do Reference Translator sem acesso a nenhuma conversa anterior.

---

## Sumário

1. Princípio Fundamental
2. O Problema Que o Reference Translator Resolve
3. Exemplo Canônico
4. Reference DNA
5. Observação vs Interpretação vs Transferência
6. Transfer Intensity
7. Taxonomia Operacional: Preserve / Transfer / Adapt / Reinvent / Discard
8. Design Decision Mapping
9. Reference Transfer Plan (schema)
10. Relação com o Creative Director
11. Conflitos
12. Múltiplas Referências
13. Referência de Usuário vs Precedente da VKB
14. Provenance
15. O Que Não Vai Para o Gerador
16. Anti-Literalismo
17. Subject Identity
18. Typography Transfer
19. Failure Modes
20. Test Cases
21. Benchmark
22. Contratos e Interfaces
23. Definition of Done
24. Regra de Ouro
25. Crítica da Própria Arquitetura
26. Notas de Implementação e Evolução

---

## 1. Princípio Fundamental

O Reference Translator **não é um descritor de imagem**. Ele não existe para produzir um relatório sobre a referência — não classifica estilo, não escreve crítica estética, não lista cores em bullet points, não devolve "atmosfera cyberpunk com tons quentes e composição dinâmica". Isso é o comportamento-padrão que qualquer VLM genérico produz quando você pede "descreva essa imagem", e é exatamente o comportamento que este agente foi desenhado para **não ter**.

A pergunta que organiza toda a existência deste agente é:

> **"Se eu tivesse que reconstruir a imagem-base usando esta referência como meu diretor de arte, quais decisões visuais da referência eu transferiria, como elas se mapeiam para a base, e o que precisa ser transformado no processo?"**

Uma segunda formulação, equivalente, útil para debugging de comportamento ("isso que a IA gerou está certo?"):

> **"Como a imagem-base adquire o DNA visual desta referência sem que sua identidade seja substituída pela identidade da referência?"**

Duas armadilhas simétricas definem o espaço de falha deste agente, e ambas devem ser mantidas em mente durante toda a leitura deste documento:

- **Armadilha da descrição (undertransfer):** o agente produz uma análise correta, mas inerte — um relatório que não muda em nada a imagem final. A referência vira decoração de prompt, não força estrutural.
- **Armadilha da cópia (overtransfer / pixel mimicry):** o agente devolve, na prática, a referência com o rosto trocado. A base perde identidade semântica. Isso não é "aplicar a referência", é substituir o projeto do usuário pelo projeto de outra pessoa.

O Reference Translator existe no espaço estreito entre essas duas armadilhas, e a maior parte da complexidade descrita abaixo — DNA, intensidade, mapeamento, provenance — é o ferramental para navegar esse espaço de forma repetível, não artesanal.

---

## 2. O Problema Que o Reference Translator Resolve

**Input típico:**

- `IMAGE A` = **Base Image**: contém sujeito, identidade, eventualmente composição pré-existente, elementos obrigatórios (headline, produto, contexto semântico, marca).
- `IMAGE B` = **Reference Image**: o usuário gostou de algo nela e quer "aplicar isso" na base.
- Instrução do usuário, tipicamente subespecificada: *"quero isso aplicado na minha imagem"*.

**O que NÃO deve ser produzido:**

- `BASE + "mood parecido"` — transferência fraca demais, a referência vira enfeite verbal.
- `REFERENCE + rosto trocado` — transferência literal demais, a base perde sua razão de existir.

**O que deve ser produzido:**

- `IMAGE C` = uma composição nova onde:
  - **Identidade semântica** (quem é o sujeito, o que a peça comunica, o texto obrigatório, o contexto de negócio) vem majoritariamente da **base**.
  - **DNA de design visual** (como a cena é construída, iluminada, composta, quão intensa e densa ela é) vem fortemente da **referência**.
  - **A transformação em si** — a decisão de como reconciliar as duas coisas quando elas colidem — emerge do diálogo estruturado entre o Reference Translator e o Creative Director, não de uma regra fixa.

Isso é, em essência, um problema de **tradução estrutural**, não de descrição nem de colagem. O nome do agente não é acidental: ele traduz uma linguagem visual (a da referência) para dentro de um projeto que tem sua própria identidade (a base), preservando o significado funcional das decisões, não sua forma literal.

---

## 3. Exemplo Canônico

Este exemplo deve ser tratado como referência de comportamento correto em todo o resto do documento.

**Base image:**
- Sujeito específico (precisa ser preservado).
- Sujeito amarrado.
- Headline: `"AS VAGAS ENCERRAM HOJE!"`.
- Relógio marcando `23:59`.
- Composição relativamente simples, cenário escuro.
- Paleta verde-ácido na tipografia e no relógio.

**Reference image:**
- Sujeito central, expressão facial extremamente energética.
- Dinamite presa ao corpo do sujeito.
- Ambiente vermelho/laranja, em chamas.
- Tambores industriais pegando fogo ao redor.
- Luz explosiva de trás, criando rim light forte.
- Faíscas e partículas densas.
- Objeto grande, desfocado, invadindo o primeiro plano (foreground intrusion).
- Relógio como elemento narrativo lateral.
- Headline massiva atrás/acima do sujeito, integrada espacialmente à cena.
- Alto contraste, profundidade acentuada, caos controlado.

**Composição resultante (correta):**

| Categoria | Fonte | Resultado |
|---|---|---|
| Identidade do sujeito | Base | preservada |
| Contexto semântico (vaga, urgência) | Base | preservado |
| Headline (texto) | Base | preservado |
| `23:59` | Base | preservado |
| Linguagem de fogo/explosão | Referência | transferida |
| Dinamite | Referência | transferida, integrada ao sujeito da base |
| Estrutura de profundidade / foreground intrusion | Referência | transferida |
| Iluminação (backlight explosivo) | Referência | transferida |
| Energia facial | Referência | transferida, aplicada ao rosto do sujeito da base |
| Relação sujeito/cenário | Referência | transferida |
| Organização espacial da headline | Referência | transferida (headline da base ganha a mesma função física) |
| Lógica narrativa do relógio | Referência | transferida (posição lateral, papel de contagem) |
| Paleta verde-ácido | Base | preservada como acento sobre o vermelho dominante da referência |

O ponto crítico, repetido porque é o núcleo de tudo: **a IA não copiou pixels — copiou decisões de design**, e cada decisão foi individualmente mapeada para um equivalente funcional dentro do projeto da base. Isso é o `DESIGN DECISION MAPPING` formalizado na Seção 8.

---

## 4. Reference DNA

**Reference DNA** é a decomposição estruturada e observável do sistema visual de uma referência em categorias funcionais. "DNA" aqui não é metáfora vazia — é literalmente o conjunto mínimo de decisões que, se removidas, fazem a referência deixar de "funcionar" como ela funciona.

O Translator nunca decompõe apenas **o que existe** (nível de objeto); ele sempre decompõe também **a função que aquele elemento exerce na composição** (nível de design). Essa distinção é aprofundada na Seção 5.

### 4.1 Categorias de DNA

**COMPOSITION DNA**
Distribuição de massa visual, posição relativa dos elementos, dominância, equilíbrio/assimetria proposital, crop, sobreposição de planos, direção de leitura do olho.

**DEPTH DNA**
Camadas de foreground/midground/background, oclusão, blur seletivo, escala relativa entre planos, presença de objetos "invadindo" a câmera.

**SUBJECT TREATMENT DNA**
Pose, expressão, nível de energia corporal, orientação em relação à câmera, grau de integração física do sujeito com o cenário, interação com objetos de cena.

**ENVIRONMENT DNA**
Tipo de espaço, densidade de elementos, escala do ambiente em relação ao sujeito, materialidade (metal, fumaça, tecido, vidro), atmosfera geral.

**LIGHTING DNA**
Direção da luz principal, contraste global, separação sujeito/fundo, presença de practical lights, uso de rim/backlight, temperatura de cor da luz.

**COLOR DNA**
Cor dominante, cores de acento, contraste cromático, distribuição espacial da cor, temperatura relativa entre zonas da imagem.

**TYPOGRAPHY DNA**
Escala da tipografia em relação ao frame, posição, relação espacial com o sujeito (na frente, atrás, integrada à profundidade), peso hierárquico entre elementos de texto.

**MOTION DNA**
Motion blur, partículas em movimento, linhas diagonais, sensação cinética mesmo em imagem estática.

**ENERGY DNA**
Intensidade geral, nível de caos visual, densidade de elementos simultâneos, teatralidade, agressividade da composição.

**NARRATIVE OBJECT DNA**
Objetos que carregam função de história (não apenas decorativa), e a relação semântica desses objetos com o sujeito.

### 4.2 Função, não apenas presença

O erro mais comum de um analisador de imagem genérico é registrar presença sem função:

- ❌ *"Existe um barril."*
- ✅ *"O barril funciona simultaneamente como fonte luminosa secundária, elemento de profundidade no midground, símbolo narrativo de perigo, e massa lateral que enquadra o sujeito no terço central do frame."*

Todo item relevante do Reference DNA deve, no mínimo, responder a três perguntas: **o que é** (observação), **o que ele faz pela composição** (função), e **o que aconteceria com a imagem se ele fosse removido** (teste de necessidade — se a resposta for "quase nada", o elemento provavelmente é incidental e não pertence ao DNA transferível; ver Seção 16 e Failure Mode `PIXEL_MIMICRY`).

---

## 5. Observação vs Interpretação vs Transferência

O raciocínio do Translator é estruturado em três níveis explícitos e sequenciais. Nunca pular direto de observação para transferência — é exatamente esse atalho que produz cópia literal ou transferência de elementos incidentais.

### LEVEL 1 — Observation
O que existe, literalmente, na imagem. Fato visual, verificável, sem interpretação.

### LEVEL 2 — Functional Interpretation
O que aquela decisão está fazendo pelo design. Por que o designer que fez a referência tomou aquela decisão — que problema de composição ela resolve.

### LEVEL 3 — Transfer Decision
Como essa **função** (não a forma literal) deve se manifestar na nova composição, dado o que a base já é e o que ela precisa preservar.

### Exemplos

| Observation | Interpretation | Transfer |
|---|---|---|
| Objeto vermelho grande e desfocado no foreground | Cria profundidade, sensação de câmera inserida na ação, tensão visual imediata | A nova composição precisa de foreground intrusion agressivo — não necessariamente o mesmo objeto, nem a mesma cor |
| Rosto com boca aberta, veias marcadas, olhar fixo | Sinaliza urgência/adrenalina extrema, ativa leitura emocional imediata | Sujeito da base recebe expressão de energia equivalente, mantendo sua identidade facial |
| Tambores em chamas ao redor do sujeito | Ambienta perigo físico real, gera fonte de luz motivada narrativamente, cria camada de profundidade lateral | Ambiente da base precisa de uma fonte de perigo/luz lateral motivada — pode ser fogo, pode ser outro elemento, dependendo do que é coerente com o brief |
| Relógio pequeno em superfície ao lado do sujeito | Funciona como contagem regressiva narrativa, ancorado espacialmente perto do sujeito, não como overlay gráfico solto | O relógio da base (`23:59`) deve manter essa integração espacial — objeto físico na cena, não selo gráfico |

Este é o mecanismo que garante que o Translator **traduz**, em vez de **copiar** ou **ignorar**.

---

## 6. Transfer Intensity

Nem toda referência deve ser transferida com a mesma força. O Translator precisa declarar, explicitamente, o nível de intensidade de transferência antes de produzir o Transfer Plan, porque esse nível determina quanto conflito com a base é tolerável.

### Taxonomia proposta

| Nível | Descrição | Quando se aplica |
|---|---|---|
| **LOW** | Referência funciona como inspiração distante — poucos elementos de DNA são transferidos, a maior parte da composição continua vindo da base | Usuário menciona a referência de forma incidental ("algo parecido com isso, meio que") |
| **MEDIUM** | Mecanismos importantes do DNA são preservados; a composição é significativamente reinterpretada dentro da identidade da base | Padrão default quando o usuário não especifica intensidade e a referência não conflita fortemente com elementos protegidos |
| **HIGH** | Grande parte do sistema visual da referência deve sobreviver na nova peça; a base cede espaço estrutural, mantendo apenas seus elementos protegidos | Usuário expressa entusiasmo explícito pela referência ("essa referência é foda", "quero exatamente esse clima") |
| **VERY HIGH / RECONSTRUCTION LOGIC** | O usuário deseja, na prática, que sua peça seja reconstruída inteiramente segundo a lógica visual da referência, preservando apenas o que precisa permanecer da base por obrigação (identidade, texto, marca) | Instrução explícita do tipo "quero isso aplicado à minha imagem", "usa essa referência como direção de arte inteira" |

*(Nomenclatura sujeita a revisão — ver Seção 25. O importante não é o rótulo, é a existência de um eixo declarado e auditável, porque sem ele o Translator tende a regredir para MEDIUM por padrão de segurança, mesmo quando o usuário pediu HIGH.)*

### Como determinar a intensidade

O Translator infere intensidade combinando sinais, nunca um único sinal isolado:

1. **Linguagem do usuário** — verbos de intensidade ("aplica", "usa exatamente", "só um toque de", "algo na linha de").
2. **Distância estrutural entre base e referência** — quanto mais distantes (cenário completamente diferente, paleta oposta), maior a decisão explícita de intensidade precisa ser, porque MEDIUM por padrão nesse caso tende a produzir resultado morno.
3. **Presença e escopo de elementos protegidos** — quanto mais elementos protegidos, menor o espaço físico disponível para transferência de alta intensidade, independentemente do que o usuário pediu (isso vira `CONFLICT`, não redução silenciosa de intensidade).
4. **Quantidade de referências fornecidas** — múltiplas referências geralmente indicam intensidade mais seletiva por escopo (ver Seção 12), não intensidade uniforme alta em tudo.
5. **Histórico de conflito explícito na conversa** — se o usuário já rejeitou uma transferência por ser "fraca demais" ou "irreconhecível", isso recalibra a leitura de intensidade para a mesma sessão.

### Regra crítica — Anti-Conservadorismo

Se o usuário sinaliza claramente algo equivalente a **"essa referência é exatamente o que eu quero aplicado"**, o Translator **não tem permissão** para responder com transferência tímida disfarçada de prudência ("vamos aproveitar só a atmosfera"). Esse é um failure mode nomeado (`REFERENCE_UNDERTRANSFER`, Seção 19) e é tão grave quanto a cópia literal. Intensidade alta, quando pedida, exige transferência agressiva do DNA — moderada apenas pelos elementos genuinamente protegidos e por conflitos genuínos, nunca por excesso de cautela do agente.

---

## 7. Taxonomia Operacional: Preserve / Transfer / Adapt / Reinvent / Discard

Cada elemento observado (na base e na referência) recebe uma classificação operacional. Essa classificação é o que transforma "análise" em "plano executável".

| Classificação | Definição |
|---|---|
| **PRESERVE** | Pertence à base e deve sobreviver sem alteração estrutural (identidade, texto obrigatório, elementos de marca) |
| **TRANSFER** | Decisão de design da referência que deve ser transportada com força para a nova composição |
| **ADAPT** | O princípio por trás da decisão da referência deve sobreviver, mas sua implementação literal muda para se encaixar na base |
| **REINVENT** | A função exercida pelo elemento da referência precisa existir na nova peça, mas nenhuma solução literal da referência se aplica — uma solução nova precisa ser criada para cumprir a mesma função |
| **DISCARD** | Elemento observado, mas irrelevante para a nova composição — geralmente incidental ao enquadramento original da referência |
| **PROTECTED** | Subcategoria de PRESERVE com trava explícita: não pode ser alterado nem por decisão do Creative Director sem confirmação do usuário |
| **CONFLICT** | Choque real entre base, referência e/ou briefing que exige resolução explícita antes do plano ser considerado completo |

Essa matriz é aplicada a **cada item relevante do Reference DNA** (Seção 4) e a **cada elemento obrigatório da base**, gerando as listas que compõem o Reference Transfer Plan (Seção 9).

---

## 8. Design Decision Mapping — O Coração do Sistema

O **Design Decision Mapping** é o artefato central de raciocínio do Translator: uma lista explícita de correspondências `REFERENCE → FUNCTION → BASE → TRANSFER`, produzida a partir da aplicação sistemática do processo de 3 níveis (Seção 5) a cada item do Reference DNA (Seção 4).

### Exemplos formatados

```
REFERENCE: dinamite presa ao torso
FUNCTION: perigo diretamente conectado fisicamente ao sujeito, não ambiental
BASE NEED: sujeito precisa comunicar encerramento iminente / urgência crítica
TRANSFER: integrar um mecanismo de ameaça diretamente ao corpo do sujeito da base
CLASSIFICATION: TRANSFER

REFERENCE: explosão luminosa atrás da cabeça do sujeito
FUNCTION: separação sujeito/fundo + focalização do olhar + intensidade emocional
BASE NEED: sujeito da base está em cenário escuro, sem separação de plano forte
TRANSFER: preservar fonte de energia luminosa forte atrás do sujeito, adaptada ao novo ambiente
CLASSIFICATION: ADAPT

REFERENCE: headline enorme fisicamente atrás/acima do sujeito, integrada à profundidade
FUNCTION: tipografia participa da composição como massa física, não como overlay
BASE NEED: headline "AS VAGAS ENCERRAM HOJE!" já existe, mas está tratada como elemento plano
TRANSFER: headline da base assume a mesma função espacial (integrada à profundidade), texto preservado
CLASSIFICATION: TRANSFER (comportamento) + PRESERVE (conteúdo textual)
```

Cada linha do mapping é o que efetivamente sobrevive até o Reference Transfer Plan. Nenhuma decisão entra no plano final sem ter passado pelos três níveis e recebido uma classificação da Seção 7.

---

## 9. Reference Transfer Plan (Schema)

Este é o artefato principal produzido pelo Reference Translator e consumido pelo Creative Director.

### 9.1 Estrutura conceitual

```
REFERENCE_TRANSFER_PLAN
├── base_asset_analysis
│   ├── subject_identity
│   ├── mandatory_elements[]      // texto, marca, objetos obrigatórios
│   ├── existing_composition_notes
│   └── protected_elements[]
├── reference_analysis[]           // uma entrada por imagem de referência
│   ├── reference_id
│   ├── reference_dna              // ver Seção 4, todas as categorias observadas
│   ├── role                       // ver Seção 12
│   └── authority                  // ver Seção 12
├── user_intent
│   ├── raw_instruction
│   ├── inferred_transfer_intensity
│   └── intensity_confidence
├── design_decision_map[]          // ver Seção 8
├── preserve_list[]
├── transfer_list[]
├── adapt_list[]
├── reinvent_list[]
├── discard_list[]
├── conflicts[]                    // ver Seção 11
├── non_negotiable_anchors[]
├── flexible_areas[]
├── compositional_opportunities[]  // ganhos possíveis não pedidos explicitamente
├── risks[]                        // ver Failure Modes, Seção 19
├── provenance[]                   // ver Seção 14
└── confidence_summary
```

### 9.2 Observações sobre o schema

- `non_negotiable_anchors` é distinto de `protected_elements`: âncoras são decisões de design (ex.: "backlight dominante atrás do sujeito") que o Translator considera essenciais para que a transferência não perca sentido — não são proteções do usuário, são recomendações fortes do próprio Translator, que podem ser contestadas pelo Creative Director.
- `flexible_areas` existe para dar ao Creative Director espaço declarado de manobra sem precisar reabrir a análise da referência do zero.
- `compositional_opportunities` é o único campo propositalmente "generativo" do schema — permite ao Translator sinalizar um ganho que não foi pedido, mas que a lógica da referência sugere (ex.: "a referência também tem uma relação forte entre relógio e foreground que poderíamos aproveitar mesmo sem o usuário ter mencionado").

*(Este schema não é definitivo — ver crítica na Seção 25. Em particular, `risks` e `compositional_opportunities` podem, em versões futuras, ser fundidos em um único campo de `notes` com tipo, para reduzir a carga cognitiva de preenchimento em casos simples de baixa intensidade.)*

---

## 10. Relação com o Creative Director

O Reference Translator **não decide sozinho** a composição final. Ele é especialista em transferência; o Creative Director é responsável pela direção criativa global da peça, incluindo como reconciliar transferência com o restante do briefing (produto, marca, formato, público).

### 10.1 O que uma conversa de valor parece

```
TRANSLATOR:
"Para preservar o impacto da referência, considero essenciais:
 - explosão luminosa atrás do sujeito (ANCHOR)
 - foreground intrusion agressivo (ANCHOR)
 - fogo lateral motivado narrativamente (TRANSFER)
 - expressão de alta energia no sujeito (TRANSFER)
 - tipografia integrada fisicamente à profundidade (TRANSFER)"

CREATIVE DIRECTOR:
"Concordo com quatro pontos, mas quero reorganizar a distribuição espacial
para evitar reconstrução literal do enquadramento da referência."

TRANSLATOR:
"Podemos alterar a distribuição. Recomendo preservar três âncoras funcionais
para não perder o DNA principal: backlight dominante, foreground intrusion,
e framing lateral via elementos ambientais — a posição exata desses três
pode mudar, a função deles não."
```

Isso é diálogo com valor cognitivo real: há uma proposta concreta, uma objeção concreta, e uma resposta que diferencia o que é negociável do que não é.

### 10.2 O que é teatro multiagente (não fazer)

```
AGENT A: "Acho legal."
AGENT B: "Concordo."
AGENT A: "Vamos fazer."
```

Esse padrão não deve existir no sistema. Se o Creative Director concorda integralmente com o plano do Translator sem qualquer ajuste, a etapa de diálogo deve ser **pulada explicitamente com uma nota de aprovação direta** (`FinalTranslatorApproval` sem `TranslatorRevision`, ver Seção 22), não simulada como troca de mensagens vazias. Diálogo simulado sem conteúdo novo consome orçamento de raciocínio sem gerar valor e deve ser tratado como anti-pattern de arquitetura.

### 10.3 Quando o diálogo tem valor real

- Quando o Creative Director identifica que uma âncora do Translator conflita com um elemento obrigatório do brief (marca, formato, produto).
- Quando o Creative Director quer preservar originalidade e evitar reconstrução literal da referência, mas o Translator precisa garantir que a função central do DNA não se perca nesse processo.
- Quando surge um `CONFLICT` (Seção 11) que exige arbitragem entre autoridade da referência e requisitos do brief.

---

## 11. Conflitos

### 11.1 Tipos de conflito mapeados

| Tipo | Descrição |
|---|---|
| `REFERENCE vs BRIEF` | A referência empurra a peça para uma direção que colide com o objetivo comunicacional do brief |
| `REFERENCE vs SUBJECT` | Transferir a pose/expressão da referência exigiria alterar a identidade do sujeito além do aceitável |
| `REFERENCE vs BRAND` | O DNA da referência colide com diretrizes de marca (paleta, tom, tipografia obrigatória) |
| `REFERENCE vs REQUIRED TEXT` | O comportamento tipográfico da referência não comporta o texto obrigatório da base sem perda de legibilidade |
| `REFERENCE vs FORMAT` | Proporção/formato de saída não suporta a lógica compositiva da referência sem distorção |
| `REFERENCE vs USER PROTECTED ELEMENT` | Um elemento explicitamente protegido pelo usuário colide fisicamente com uma âncora de transferência |
| `REFERENCE vs CREATIVE ORIGINALITY` | Intensidade pedida é tão alta que o resultado corre risco de ser reconhecível como cópia da referência |
| `REFERENCE vs GENERATOR CAPABILITY` | O DNA exige um comportamento que o gerador de imagem downstream não consegue produzir de forma confiável (ex.: certos tipos de composição tipográfica complexa) |

### 11.2 Protocolo de resolução

- **Detecção**: responsabilidade primária do Translator durante a construção do `design_decision_map`; o Creative Director também pode levantar conflitos na etapa de revisão.
- **Argumentação**: cada lado apresenta a função que está em jogo (nunca apenas "prefiro assim") — a mesma disciplina de Observation → Interpretation aplicada à negociação.
- **Decisão**: 
  - Conflitos envolvendo `PROTECTED` (elementos travados pelo usuário) nunca são resolvidos autonomamente — sempre escalam para confirmação do usuário.
  - Conflitos entre `ANCHOR` do Translator e preferência estética do Creative Director são resolvidos internamente, com registro da decisão e da razão.
  - Conflitos com `GENERATOR CAPABILITY` resultam em `REINVENT` obrigatório, nunca em tentativa de forçar o gerador além do que ele suporta de forma confiável.
- **Registro**: todo conflito resolvido autonomamente entra no campo `conflicts[]` do Transfer Plan com `status: resolved` e a razão; todo conflito escalado entra com `status: escalated_to_user`.
- **Quando perguntar ao usuário**: sempre que a resolução implicar abrir mão de um elemento que o usuário marcou como obrigatório ou protegido, mesmo que a alternativa pareça esteticamente superior.

---

## 12. Múltiplas Referências

Referências múltiplas nunca são simplesmente misturadas em um pool único de DNA. Cada referência recebe um papel funcional declarado.

### 12.1 Conceitos

- **REFERENCE ROLE** — o que aquela referência específica está ali para resolver (composição, iluminação, tipografia, atmosfera geral, paleta).
- **REFERENCE SCOPE** — o subconjunto de categorias de DNA (Seção 4) que aquela referência tem permissão de influenciar.
- **REFERENCE AUTHORITY** — hierarquia entre referências quando há sobreposição de escopo.
- **REFERENCE PRIORITY** — ordem de resolução quando duas referências de mesma autoridade colidem no mesmo escopo.
- **REFERENCE CONFLICT** — caso explícito de colisão entre referências (ver Seção 11, adaptado para conflito referência-a-referência).

### 12.2 Exemplo estrutural

```
REF_A:
  role: primary_composition_reference
  authority: PRIMARY
  scope: [composition_dna, depth_dna, energy_dna]

REF_B:
  role: lighting_reference
  authority: SECONDARY
  scope: [lighting_dna]

REF_C:
  role: typography_reference
  authority: SUPPORTING
  scope: [typography_dna]
```

Nesse exemplo, se `REF_B` sugerir uma composição diferente da de `REF_A` incidentalmente (imagem de referência de luz que também tem uma composição forte), essa sugestão é **descartada por escopo** — `REF_B` não tem autoridade sobre `composition_dna`, independentemente de quão boa a composição dela pareça isoladamente. Isso evita que uma referência "vaze" para categorias de DNA que o usuário não pretendia que ela influenciasse.

### 12.3 Casos de uso

- **Referências complementares**: escopos não sobrepostos — mapeamento direto, sem necessidade de arbitragem.
- **Referências conflitantes no mesmo escopo**: exige declaração explícita de `PRIORITY` (pelo usuário, se possível; inferida pelo Translator, com confiança registrada, se não).
- **Referência apenas de atmosfera**: escopo deliberadamente amplo mas intensidade baixa em todas as categorias — usada para calibrar tom geral, não para fornecer âncoras específicas.

---

## 13. Referência de Usuário vs Precedente da VKB

Distinção rígida e não negociável:

| | User Reference | VKB Precedent |
|---|---|---|
| Origem | Escolhida explicitamente pelo usuário | Recuperada internamente pelo sistema (memória de peças anteriores) |
| Autoridade criativa | Alta — o usuário decidiu que aquilo é a direção | Nenhuma por padrão — é evidência auxiliar, não instrução |
| Pode sobrescrever elemento protegido? | Só com confirmação do usuário | Nunca |
| Pode diluir uma User Reference existente? | N/A | **Nunca, silenciosamente** |

A regra de ouro desta seção: **o sistema nunca permite que um precedente recuperado da VKB dilua, silenciosamente, uma referência que o usuário escolheu explicitamente.** Se a VKB sugere uma direção visual diferente da referência do usuário, essa sugestão só pode ser incorporada como nota secundária (`compositional_opportunities`, nunca como `TRANSFER` ou `ANCHOR`), e apenas se não conflitar com nenhum elemento do DNA da referência do usuário.

### Quando a VKB pode complementar

- Preenchendo lacunas onde a referência do usuário é omissa (ex.: a referência não mostra nenhuma solução para um elemento que a base precisa e que a VKB já resolveu bem em contexto semelhante).
- Como fonte de padrões de fallback quando não há nenhuma referência de usuário na tarefa.

### Quando a VKB deve ficar fora

- Sempre que existir `REFERENCE ROLE` e `SCOPE` já definidos por uma referência de usuário cobrindo aquela categoria de DNA.
- Sempre que a sugestão da VKB conflitar diretamente com um `ANCHOR` ou `PROTECTED` element vindo da referência do usuário.

---

## 14. Provenance

Toda decisão atribuída à referência precisa ser rastreável até uma observação real. O Translator nunca inventa elementos, nunca infere a existência de algo que não pode ser observado na imagem, e nunca fabrica histórico de usuário, preferências ou resultados anteriores.

### 14.1 Estrutura de provenance por decisão

```
PROVENANCE_ENTRY
├── source_image        // qual referência (ou base) originou a observação
├── observed_feature     // o que foi literalmente visto (Level 1)
├── interpreted_function // a função atribuída (Level 2) — marcado como inferência
├── transfer_decision    // o que foi decidido (Level 3)
└── confidence           // OBSERVED | INFERRED | PROPOSED
```

### 14.2 Os três graus de confiança

- **OBSERVED** — fato visual direto, verificável por qualquer pessoa olhando a imagem.
- **INFERRED** — interpretação funcional derivada da observação (Level 2). Sempre marcado como inferência, nunca apresentado como fato.
- **PROPOSED** — decisão de transferência (Level 3), que é uma escolha de design, não um fato sobre a referência.

Essa separação de três graus existe especificamente para impedir que interpretação seja registrada — e posteriormente tratada por outros agentes — como se fosse fato visual. Um `INFERRED` incorreto é um erro de leitura; um `INFERRED` apresentado como `OBSERVED` é uma alucinação de provenance, e é tratado como failure mode grave (`PROVENANCE_HALLUCINATION`, Seção 19).

---

## 15. O Que Não Vai Para o Gerador

Uma das descobertas arquiteturais centrais do Design Builder: **o raciocínio completo sobre a transformação não deve ser enviado ao gerador de imagem**. O gerador deve receber, preferencialmente, uma descrição coerente do estado visual final — não a trilha de decisões que levou até ele.

### 15.1 Duas camadas distintas

- **TRANSFORMATION REASONING** — tudo o que este documento descreve até aqui: DNA, mapping, intensidade, conflitos, provenance. Existe para os **agentes pensarem**.
- **FINAL FRAME SPEC** — descrição direta, coerente e autocontida da imagem final que deve existir, mais os bindings de quais assets (base, referências) alimentam quais partes dela. Existe para **descrever o resultado**, não o processo.

### 15.2 Exemplo do erro comum

❌ **Ruim** (transformation reasoning vazado para o gerador):
> "Pegue o homem da primeira imagem, mas use o cenário da segunda, mude isso, mantenha aquilo, substitua o fundo mas não o rosto, adicione fogo só que não como na referência exatamente, o relógio fica igual mas a headline muda de posição..."

Esse tipo de prompt é instrução de edição relativa, ambígua, dependente de contexto que o gerador não tem acesso privilegiado a interpretar do jeito que um humano interpretaria.

✅ **Melhor** (final frame spec):
> Descrição direta da cena final — sujeito com tais características, nesse ambiente, com essa iluminação, essa composição, esse texto nessa posição — como se a imagem já existisse e estivesse sendo descrita por alguém que a está vendo, não por alguém que está explicando como chegar até ela.

### 15.3 Pipeline de responsabilidade

```
Reference Transfer Plan  (Translator)
        ↓
Creative Director Review  (reconciliação com brief global)
        ↓
Final Frame Spec  (descrição do estado final, não do processo)
        ↓
Generator Compiler  (traduz Final Frame Spec para o formato do gerador específico)
```

Cada seta representa uma tradução de camada — nenhuma etapa deve vazar o vocabulário da etapa anterior para a seguinte. Isso é o que impede o failure mode `TRANSFORMATION_PROMPT_LEAKAGE` (Seção 19).

---

## 16. Anti-Literalismo

O Translator precisa entender comparações visuais **sem** transformá-las automaticamente em objetos literais. Esse é um dos pontos de maior risco de erro grosseiro do sistema.

### 16.1 Exemplos de literalismo incorreto

| Observação na referência | Interpretação errada (literal) | Interpretação correta (funcional) |
|---|---|---|
| Linhas paralelas verticais na composição, lembrando grades | "Coloque uma prisão" | "Use elementos verticais repetidos que criem sensação de contenção/estrutura, sem necessariamente ser uma prisão" |
| Roupa com corte que lembra traje de piloto | "Adicione elementos de Fórmula 1" | "Traje justo, com paineis funcionais e linhas técnicas — a propriedade visual é 'roupa técnica de alta performance', não o objeto 'carro de corrida'" |
| Luz alaranjada quente parecendo fogo | "Adicione um incêndio" | "Use iluminação quente, direcional, de alto contraste — o fogo pode ser uma das formas de produzir isso, não a única nem necessariamente a mais adequada ao contexto da base" |

### 16.2 Protocolo

Todo elemento observado na referência deve ser classificado como:

- **VISUAL PROPERTY** — uma qualidade abstrata (temperatura de luz, direção de linhas, textura, contraste) que pode ser reproduzida por múltiplos objetos possíveis.
- **SEMANTIC OBJECT** — um objeto concreto e nomeável cuja presença física é, ela mesma, parte do significado pretendido (a dinamite no exemplo canônico é um objeto semântico real, não apenas uma "propriedade de perigo" abstrata — o brief exige literalmente uma ameaça física ligada ao corpo).

A confusão entre essas duas categorias é o failure mode `SEMANTIC_OBJECT_CONFUSION` / `LITERAL_METAPHOR_TRANSFER` (Seção 19). A regra prática: **antes de transferir um objeto literalmente, o Translator precisa justificar por que aquele objeto específico — e não apenas a propriedade visual por trás dele — é necessário para a função pretendida.**

---

## 17. Subject Identity

Quando existe um sujeito na base, "preservar o sujeito" **não significa congelar tudo sobre ele**. Significa decidir, explicitamente, quais dimensões da identidade estão travadas e quais têm liberdade de transformação.

### 17.1 Dimensões separáveis

- `IDENTITY` — quem a pessoa é, reconhecibilidade facial.
- `POSE` — postura corporal.
- `EXPRESSION` — expressão facial/emocional.
- `WARDROBE` — roupa.
- `BODY ORIENTATION` — ângulo em relação à câmera.
- `CAMERA RELATION` — enquadramento, distância, lente percebida.
- `LIGHTING` — como o sujeito é iluminado.
- `ENVIRONMENT INTEGRATION` — quão fisicamente integrado o sujeito está ao cenário (vs. recortado/colado).

### 17.2 Locks

```
IDENTITY_LOCK: true   // face preservada — quase sempre travado por padrão
POSE_LOCK: false      // pode mudar, se a referência pedir
EXPRESSION_LOCK: false
WARDROBE_LOCK: true   // se for peça de marca/uniforme, geralmente travado
COMPOSITION_LOCK: false
```

Cada lock é decidido a partir da combinação de: instrução explícita do usuário, presença de elementos de marca (uniforme, produto vestido), e intensidade de transferência declarada (Seção 6) — quanto maior a intensidade pedida, mais dimensões não-identitárias (pose, expressão, iluminação, integração ao ambiente) tendem a ser liberadas para transformação, mantendo `IDENTITY_LOCK` como a última linha de defesa, salvo instrução contrária explícita do usuário.

---

## 18. Typography Transfer

Tipografia recebe tratamento especial porque é o elemento mais fácil de reduzir a "estilo de fonte" — e o mais empobrecedor quando isso acontece.

O Translator não deve descrever tipografia como `"fonte branca, bold, sem serifa"`. Deve observar e transferir **comportamento tipográfico**:

- Escala relativa ao frame (a tipografia domina o espaço ou é um elemento discreto?).
- Hierarquia entre múltiplos blocos de texto.
- Grau de integração com o sujeito (a tipografia está atrás dele, na frente, sendo parcialmente ocluída por ele?).
- Sobreposição com outros elementos de profundidade.
- Alinhamento e blocagem (centralizado, quebrado em linhas irregulares, justificado).
- Ritmo — se há variação de peso/tamanho entre palavras da mesma headline.
- Posição funcional dentro da composição — a tipografia participa como massa física do design, ou é aplicada como overlay plano por cima de uma imagem já fechada?

**TYPOGRAPHIC BEHAVIOR** é, portanto, transferível independentemente da fonte específica usada na referência — o que se transfere é a lógica de como o texto ocupa e interage com o espaço tridimensional percebido da composição, não o tipo de letra em si (a fonte em si normalmente é `PRESERVE`, vinda de diretrizes de marca da base).

---

## 19. Failure Modes

Taxonomia de falhas conhecidas, cada uma com causa, sintoma, detecção, correção e componente responsável.

| Failure Mode | Sintoma | Causa | Detecção | Correção | Responsável |
|---|---|---|---|---|---|
| `REFERENCE_DESCRIPTION_ONLY` | Output é um relatório de análise, sem plano de transferência acionável | Translator tratado como VLM descritivo genérico | Ausência de `design_decision_map` populado | Forçar produção obrigatória do mapping antes de qualquer output ser aceito | Translator |
| `MOOD_ONLY_TRANSFER` | Resultado final tem "clima parecido" mas nenhuma âncora estrutural real da referência | Transferência ficou apenas em `COLOR DNA` / `ENERGY DNA`, ignorando composição e profundidade | Comparação entre categorias de DNA cobertas vs. categorias disponíveis | Exigir cobertura mínima de pelo menos composition_dna e depth_dna quando intensidade ≥ MEDIUM | Translator |
| `REFERENCE_UNDERTRANSFER` | Usuário pediu intensidade alta, resultado é subtransferido | Conservadorismo do agente sobrepondo instrução explícita | Comparação entre `inferred_transfer_intensity` e densidade real do `transfer_list` | Reforçar regra da Seção 6 (Anti-Conservadorismo) | Translator |
| `REFERENCE_OVERCOPY` / `PIXEL_MIMICRY` | Resultado é reconhecível como a referência com identidade trocada | Ausência de reinterpretação — objetos e composição copiados 1:1 | Alta similaridade estrutural com a referência mesmo em elementos que deveriam ser `ADAPT`/`REINVENT` | Forçar reclassificação de itens `TRANSFER` indevidos para `ADAPT`/`REINVENT` | Translator + Creative Director |
| `BASE_IDENTITY_LOSS` | Sujeito, texto ou marca da base deixam de ser reconhecíveis na peça final | Elementos protegidos não foram travados corretamente, ou foram sobrepostos por transferência agressiva | Checagem de presença de todos os `protected_elements` no Final Frame Spec | Reforçar `PROTECTED` como camada não-negociável antes de qualquer geração | Translator |
| `SEMANTIC_OBJECT_CONFUSION` | Objeto literal errado é inserido a partir de uma metáfora visual | Falha em separar `VISUAL PROPERTY` de `SEMANTIC OBJECT` (Seção 16) | Objeto presente na cena final sem justificativa funcional registrada | Exigir justificativa explícita para todo `SEMANTIC OBJECT` transferido | Translator |
| `LITERAL_METAPHOR_TRANSFER` | Mesma raiz de `SEMANTIC_OBJECT_CONFUSION`, mas especificamente a partir de linguagem figurada do usuário/brief | Interpretação literal de expressão figurada | Auditoria de linguagem de origem no provenance | Mesmo protocolo da Seção 16 | Translator |
| `TYPOGRAPHY_AS_OVERLAY` | Texto tratado como camada plana por cima da imagem, perdendo comportamento da referência | `TYPOGRAPHY DNA` não decomposto, apenas estilo de fonte copiado | Ausência de descrição de integração espacial no Final Frame Spec | Exigir descrição de comportamento tipográfico, não apenas estilo (Seção 18) | Translator |
| `COMPOSITIONAL_DNA_LOSS` | Estrutura de composição da referência se perde mesmo com outros elementos (cor, textura) presentes | Transferência concentrada nas categorias "fáceis" (cor, textura) e negligencia composição/profundidade | Revisão de cobertura por categoria de DNA | Priorizar `composition_dna` e `depth_dna` como categorias de checagem obrigatória | Translator |
| `DEPTH_COLLAPSE` | Imagem final perde a sensação de profundidade presente na referência | `DEPTH DNA` não mapeado ou mapeado apenas como observação, sem transferência | Ausência de foreground/midground/background distintos no Final Frame Spec | Tornar `DEPTH DNA` item de checagem obrigatória quando presente na referência | Translator |
| `ENERGY_LOSS` | Resultado final "morno" comparado à energia da referência | Expression/pose/motion DNA descartados por excesso de cautela | Comparação qualitativa de energy_dna entre plano e resultado | Reforço da Seção 6 (intensidade declarada deve se refletir em energy_dna) | Translator + Creative Director |
| `COLOR_ONLY_TRANSFER` | Único elemento realmente transferido foi a paleta de cor | Caminho de menor resistência — cor é a categoria mais fácil de extrair e aplicar | Cobertura de categorias no `design_decision_map` concentrada quase exclusivamente em `color_dna` | Exigir cobertura mínima multi-categoria | Translator |
| `STYLE_LABEL_SHORTCUT` | Translator resume a referência a um rótulo genérico ("cyberpunk", "vintage") em vez de decompor DNA | Atalho cognitivo, equivalente ao comportamento de VLM genérico que o agente foi desenhado para evitar | Presença de rótulos de estilo sem decomposição por categoria | Proibir rótulos de estilo como substituto de decomposição — rótulo pode existir como resumo, nunca como análise | Translator |
| `UNJUSTIFIED_REINVENTION` | Elemento classificado como `REINVENT` sem necessidade real — poderia ter sido `TRANSFER` ou `ADAPT` | Uso de `REINVENT` como fuga de trabalho de mapeamento mais difícil | Ausência de `CONFLICT` ou `GENERATOR CAPABILITY` registrado justificando o `REINVENT` | Exigir justificativa obrigatória para toda classificação `REINVENT` | Translator |
| `REFERENCE_AUTHORITY_VIOLATION` | Uma referência influenciou categoria de DNA fora do seu `scope` declarado | Falha na disciplina de Seção 12 | Comparação entre `scope` declarado e categorias de fato usadas daquela referência | Enforcement automático de escopo antes da compilação do plano | Translator |
| `VKB_OVERRIDE` | Precedente da VKB substituiu ou diluiu decisão vinda de referência de usuário | Falha na disciplina da Seção 13 | Presença de decisão atribuída à VKB em categoria já coberta por referência de usuário | VKB nunca pode gerar `TRANSFER` ou `ANCHOR` em escopo já coberto por referência de usuário | Translator |
| `PROVENANCE_HALLUCINATION` | Decisão apresentada como `OBSERVED` sem base real na imagem | Falha de disciplina de confiança (Seção 14) | Auditoria de provenance contra a imagem original | Rejeitar plano sem provenance completa e auditável | Translator |
| `TRANSFORMATION_PROMPT_LEAKAGE` | Vocabulário de raciocínio (PRESERVE/TRANSFER/ADAPT etc.) vaza para o prompt do gerador | Falha na separação de camadas da Seção 15 | Presença de linguagem de plano de transferência no Final Frame Spec | Enforcement de contrato de interface entre camadas | Generator Compiler |
| `GENERATOR_SPEC_PREMATURENESS` | Final Frame Spec é gerado antes de conflitos serem resolvidos | Pipeline executado fora de ordem | Conflitos com `status != resolved` presentes no momento da compilação | Bloquear compilação até todos os `conflicts[]` estarem resolvidos ou explicitamente aceitos como risco | Creative Director / Generator Compiler |

---

## 20. Test Cases

### CASE 1 — Base simples + referência extremamente forte
**Input:** base com cenário neutro, pouco elaborado; referência com sistema visual denso e muito específico (ex.: o caso canônico da Seção 3).
**Observation:** base tem poucos elementos protegidos além de sujeito/texto/relógio.
**Reference DNA:** completo nas 10 categorias.
**Transfer Intensity:** HIGH a VERY HIGH — pouco na base compete por espaço.
**Mapping:** quase todas as categorias de DNA recebem `TRANSFER` ou `ADAPT`.
**Conflicts:** mínimos — paleta verde da base coexiste como acento sobre o vermelho dominante da referência (`ADAPT`, não `CONFLICT`).
**Translator Decisions:** priorizar `ANCHOR`s de depth e lighting; liberar pose/expressão do sujeito.
**Dialogue:** Creative Director confirma distribuição espacial revisada para evitar réplica literal do enquadramento.
**Final Transfer Plan:** transferência ampla, com `PROTECTED` restrito a identidade facial, headline textual e valor do relógio.

### CASE 2 — Base já com composição boa + referência apenas de linguagem visual
**Input:** base já é uma peça bem resolvida estruturalmente; referência é usada só para "linguagem" (textura, luz, paleta).
**Transfer Intensity:** LOW a MEDIUM.
**Mapping:** `composition_dna` e `depth_dna` da base majoritariamente `PRESERVE`; `lighting_dna` e `color_dna` da referência entram como `TRANSFER`/`ADAPT`.
**Conflicts:** risco de `COMPOSITIONAL_DNA_LOSS` se o Translator, por engano, tentar importar composição da referência — deve ser evitado explicitamente no plano.
**Translator Decisions:** escopo da referência restrito deliberadamente (ver Seção 12) a lighting + color.

### CASE 3 — Usuário exige fidelidade muito alta
**Input:** instrução explícita tipo "quero isso quase idêntico, só troca o rosto e o texto".
**Transfer Intensity:** VERY HIGH / RECONSTRUCTION LOGIC.
**Risk:** alto risco de `PIXEL_MIMICRY` — precisa de vigilância redobrada em `SUBJECT TREATMENT DNA` e `ENVIRONMENT DNA` para garantir reinterpretação mínima suficiente que evite cópia literal identificável, ao mesmo tempo que honra a intenção do usuário.
**Translator Decisions:** manter `TRANSFER` amplo, mas registrar explicitamente no plano o risco de originalidade (`REFERENCE vs CREATIVE ORIGINALITY`) para visibilidade do Creative Director, sem reduzir intensidade unilateralmente.

### CASE 4 — Usuário quer só "pegar algumas coisas"
**Input:** "gostei de algumas coisas dessa referência, não de tudo".
**Transfer Intensity:** LOW a MEDIUM, mas **seletiva por categoria**, não uniformemente baixa.
**Ação necessária:** Translator deve pedir ou inferir quais categorias específicas ("algumas coisas") — se não há sinal suficiente, apresentar candidatos ao Creative Director em vez de assumir silenciosamente.

### CASE 5 — Referência conflita com texto obrigatório
**Input:** DNA tipográfico da referência (texto minimalista, quase ausente) conflita com necessidade da base de headline extensa e legível.
**Conflict:** `REFERENCE vs REQUIRED TEXT`.
**Resolution:** `ADAPT` — preservar o princípio de integração espacial da tipografia da referência, mas ajustar escala/hierarquia para comportar o volume real de texto exigido pela base, sem violar legibilidade.

### CASE 6 — Duas referências complementares
**Input:** REF_A para composição, REF_B para iluminação, sem sobreposição de escopo.
**Resolution:** mapeamento direto por escopo (Seção 12.2), sem necessidade de arbitragem de prioridade.

### CASE 7 — Duas referências conflitantes
**Input:** REF_A e REF_B com propostas de `lighting_dna` incompatíveis, ambas com escopo declarado sobre iluminação.
**Resolution:** exige `PRIORITY` explícita — perguntar ao usuário se não inferível com confiança razoável; caso contrário, Translator declara a prioridade inferida com `confidence: INFERRED` e justificativa.

### CASE 8 — Referência com elementos incidentais que não deveriam ser transferidos
**Input:** referência tem, por exemplo, um logotipo de marca terceira visível ao fundo, ou um elemento decorativo sem função composicional clara.
**Resolution:** aplicar o teste de necessidade da Seção 4.2 ("o que aconteceria se o elemento fosse removido?") — elementos que não alteram a leitura funcional da composição são classificados `DISCARD`. Logotipos de terceiros são sempre `DISCARD` por política, independentemente de função visual, por questão de direitos de imagem/marca.

---

## 21. Benchmark

### 21.1 Desenho do experimento

Comparar três condições, com as mesmas imagens de entrada, mesmo brief, mesmo gerador downstream, e seed fixa quando o gerador permitir:

- **A. Prompt direto** — base + referência entregues cruamente a um gerador de imagem, sem camada de raciocínio.
- **B. Reference Analyzer tradicional** — um agente que descreve a referência (estilo, cores, composição) em prosa e injeta essa descrição no prompt.
- **C. Reference Translator do Design Builder** — pipeline completo descrito neste documento.

### 21.2 Critérios de avaliação

| Critério | O que mede |
|---|---|
| Reference Fidelity | Quanto do DNA funcional da referência está presente na imagem final |
| Base Identity Preservation | Quanto da identidade obrigatória da base sobreviveu |
| Creative Transformation | Grau em que o resultado é uma síntese nova, não uma cópia nem uma colagem |
| Composition Quality | Qualidade da composição final, independente de origem |
| Depth | Presença e qualidade de separação de planos |
| Energy Transfer | Fidelidade do nível de energia/intensidade em relação à referência, quando pedido |
| Typographic Behavior | Integração funcional do texto, não apenas presença |
| Human Preference | Avaliação cega por avaliadores humanos, comparando as três saídas lado a lado |
| Over-copy Rate | Frequência com que avaliadores identificam a saída como "cópia com rosto trocado" |
| Under-transfer Rate | Frequência com que avaliadores dizem "não parece ter usado a referência de verdade" |

### 21.3 Como usar o benchmark

O valor do Reference Translator só é demonstrado empiricamente se **C supera B e A simultaneamente** em `Reference Fidelity` e `Base Identity Preservation` ao mesmo tempo — essas duas métricas tendem a ser inversamente relacionadas em sistemas ingênuos (A tende a sacrificar identidade da base; um "Analyzer" puramente descritivo como B tende a produzir baixa fidelidade estrutural real apesar de boa fidelidade verbal). Demonstrar que C rompe esse trade-off é a validação central da arquitetura.

---

## 22. Contratos e Interfaces

```json
// ReferenceTranslatorInput
{
  "base_asset": { "$ref": "BaseAssetSpec" },
  "references": [{ "$ref": "ReferenceAssetSpec" }],
  "user_instruction_raw": "string",
  "brief_context": { "mandatory_elements": ["string"], "brand_constraints": {} }
}

// BaseAssetSpec
{
  "asset_id": "string",
  "subject_identity": "string | null",
  "mandatory_text": ["string"],
  "protected_elements": ["string"],
  "existing_composition_notes": "string"
}

// ReferenceAssetSpec
{
  "asset_id": "string",
  "declared_role": "primary_composition_reference | lighting_reference | typography_reference | atmosphere_reference | ...",
  "declared_scope": ["composition_dna", "depth_dna", "lighting_dna", "..."],
  "declared_authority": "PRIMARY | SECONDARY | SUPPORTING"
}

// ReferenceObservation
{
  "reference_id": "string",
  "category": "composition_dna | depth_dna | ...",
  "observed_feature": "string",
  "confidence": "OBSERVED"
}

// ReferenceDNA
{
  "reference_id": "string",
  "categories": {
    "composition_dna": ["ReferenceObservation"],
    "depth_dna": ["ReferenceObservation"],
    "...": "..."
  }
}

// DesignDecisionMap (entry)
{
  "reference_element": "string",
  "function": "string",
  "base_need": "string",
  "transfer_decision": "string",
  "classification": "PRESERVE | TRANSFER | ADAPT | REINVENT | DISCARD | PROTECTED | CONFLICT"
}

// TransferIntensity
{
  "level": "LOW | MEDIUM | HIGH | VERY_HIGH",
  "confidence": "OBSERVED | INFERRED | PROPOSED",
  "signals": ["string"]
}

// ProtectedElement
{
  "element": "string",
  "source": "base | user_explicit",
  "lock_type": "IDENTITY_LOCK | POSE_LOCK | WARDROBE_LOCK | EXPRESSION_LOCK | COMPOSITION_LOCK | TEXT_LOCK"
}

// ReferenceConflict
{
  "type": "REFERENCE_vs_BRIEF | REFERENCE_vs_SUBJECT | REFERENCE_vs_BRAND | REFERENCE_vs_REQUIRED_TEXT | REFERENCE_vs_FORMAT | REFERENCE_vs_USER_PROTECTED_ELEMENT | REFERENCE_vs_CREATIVE_ORIGINALITY | REFERENCE_vs_GENERATOR_CAPABILITY | REFERENCE_vs_REFERENCE",
  "description": "string",
  "status": "resolved | escalated_to_user | accepted_as_risk",
  "resolution": "string | null"
}

// ReferenceTransferPlan
{
  "base_asset_analysis": {},
  "reference_analysis": [{ "$ref": "ReferenceDNA" }],
  "user_intent": {
    "raw_instruction": "string",
    "inferred_transfer_intensity": { "$ref": "TransferIntensity" }
  },
  "design_decision_map": [{ "$ref": "DesignDecisionMap" }],
  "preserve_list": ["string"],
  "transfer_list": ["string"],
  "adapt_list": ["string"],
  "reinvent_list": ["string"],
  "discard_list": ["string"],
  "conflicts": [{ "$ref": "ReferenceConflict" }],
  "non_negotiable_anchors": ["string"],
  "flexible_areas": ["string"],
  "compositional_opportunities": ["string"],
  "risks": ["string"],
  "provenance": [{ "$ref": "PROVENANCE_ENTRY" }],
  "confidence_summary": "string"
}

// DirectorTranslatorMessage
{
  "from": "creative_director | reference_translator",
  "message_type": "proposal | objection | clarification | approval",
  "content": "string",
  "referenced_plan_fields": ["string"]
}

// TranslatorRevision
{
  "revised_field": "string",
  "previous_value": "any",
  "new_value": "any",
  "reason": "string"
}

// FinalTranslatorApproval
{
  "approved_by": "creative_director",
  "plan_version": "string",
  "unresolved_risks_accepted": ["string"]
}
```

---

## 23. Definition of Done

O Reference Translator só considera sua tarefa concluída quando **todos** os itens abaixo são verdadeiros — "analisei a referência" não é critério de conclusão.

- [ ] Todos os elementos obrigatórios e protegidos da base foram identificados e classificados (`PRESERVE`/`PROTECTED`).
- [ ] A intenção do usuário foi traduzida em `TransferIntensity` explícita, com sinais registrados.
- [ ] O Reference DNA relevante de cada referência foi decomposto por categoria (Seção 4), não resumido em rótulo de estilo.
- [ ] Cada item relevante do DNA passou pelo processo de 3 níveis (Seção 5) — nenhuma transferência pula direto de observação para decisão.
- [ ] Todo elemento relevante recebeu classificação da taxonomia operacional (Seção 7).
- [ ] O `design_decision_map` está completo e cada entrada tem `function` e `base_need` preenchidos, não apenas `transfer_decision`.
- [ ] Conflitos foram identificados e têm `status` definido (`resolved`, `escalated_to_user`, ou `accepted_as_risk`) — nenhum conflito fica implícito.
- [ ] Provenance está disponível para toda decisão atribuída à referência, com grau de confiança correto (`OBSERVED`/`INFERRED`/`PROPOSED`).
- [ ] Em caso de múltiplas referências, escopo e autoridade de cada uma estão declarados e nenhuma decisão vaza para fora do escopo declarado.
- [ ] O Creative Director consegue construir a nova composição a partir do plano **sem precisar reinterpretar a referência do zero** — este é o teste funcional definitivo.

*(Crítica: o último item é o mais importante e o mais difícil de automatizar como checagem — na prática, é o critério que separa um Transfer Plan burocraticamente completo de um Transfer Plan realmente útil. Vale considerar, em iteração futura, um teste operacional direto: dar o plano a uma instância fresca do Creative Director, sem acesso às imagens originais, e verificar se ela consegue produzir um Final Frame Spec coerente só com o plano em mãos.)*

---

## 24. Regra de Ouro

> O Reference Translator deve pensar como um excelente designer que recebe uma peça de referência e pergunta:
> **"O que exatamente faz essa execução funcionar, quais decisões eu quero roubar intelectualmente dela, e como eu reconstruo essas decisões dentro do meu problema atual?"**

Não queremos cópia de pixels.
Não queremos inspiração vaga.
Queremos transferência estruturada de decisões de design.

Toda vez que uma revisão futura deste agente estiver em dúvida sobre um comportamento não coberto explicitamente por este documento, a pergunta acima é o critério de desempate.

---

## 25. Crítica da Própria Arquitetura

Esta seção existe para impedir que o documento seja lido como verdade definitiva. Classificação de cada ponto: `KNOWN ARCHITECTURE` (decisão já validada em uso), `ARCHITECTURAL INFERENCE` (dedução razoável, não testada isoladamente), `HYPOTHESIS` (especulação a ser testada), `RECOMMENDATION` (proposta de mudança).

- **O Reference Translator precisa mesmo ser um Sub-Agent separado do Creative Director?**
  `HYPOTHESIS`. A separação se justifica enquanto o custo de decompor DNA + mapping for alto o suficiente para merecer um passo dedicado, e enquanto o Creative Director se beneficiar de receber um plano já estruturado em vez de imagens cruas. Se o overhead de coordenação (Seção 10) começar a gerar mais teatro do que valor, a fusão dos dois papéis em um único agente com duas fases internas de raciocínio é uma alternativa válida a testar.

- **Poderia ser uma fase interna do Creative Director, em vez de agente separado?**
  `RECOMMENDATION` a considerar em versões futuras, especificamente para casos de `LOW`/`MEDIUM` intensidade (Casos 2 e 4), onde o overhead de um Transfer Plan completo pode ser desproporcional ao ganho. Para `HIGH`/`VERY HIGH`, a separação parece mais justificada, porque o volume de decisões cresce significativamente.

- **Quando o diálogo Translator↔Director melhora qualidade de fato?**
  `ARCHITECTURAL INFERENCE`, com base na distinção da Seção 10: melhora quando existe um conflito real de escopo ou de prioridade estética; não melhora — e vira teatro — quando é usado como formalidade de "revisão" sem discordância real. Recomenda-se instrumentar, em produção, quantas trocas de diálogo terminam sem nenhuma `TranslatorRevision` — uma taxa alta sugere que a etapa de diálogo está sendo simulada desnecessariamente.

- **Quais decisões pertencem exclusivamente ao Translator?**
  `KNOWN ARCHITECTURE`: decomposição de DNA, classificação preliminar Preserve/Transfer/Adapt/Reinvent/Discard, provenance.

- **Quais pertencem exclusivamente ao Creative Director?**
  `KNOWN ARCHITECTURE`: reconciliação com o restante do brief (produto, marca, formato), decisão final de originalidade vs. fidelidade quando não há conflito objetivo, aprovação final do plano.

- **Quais precisam ser negociadas?**
  `ARCHITECTURAL INFERENCE`: todo `CONFLICT` da Seção 11, e toda âncora (`non_negotiable_anchor`) proposta pelo Translator que o Creative Director queira contestar por motivo de originalidade.

- **Existe risco de decompor demais a referência e perder percepção holística?**
  `HYPOTHESIS` real e não trivial. Decompor em 10 categorias de DNA é útil para rastreabilidade, mas uma referência funciona, em última instância, como um todo perceptual — a soma das partes mapeadas separadamente pode não recriar a gestalt da peça original. Mitigação proposta: o Translator deveria, além do mapping por categoria, produzir uma frase de **síntese holística** ("o que essa referência é, em uma frase, além da soma das partes") como campo adicional do plano, e essa síntese deveria ser usada como critério de sanity-check do resultado final — não apenas a checklist de categorias.

- **Existe risco de racionalização pós-hoc?**
  `HYPOTHESIS`. Como o processo de 3 níveis (Seção 5) pede justificativa funcional para cada elemento, existe risco de o agente inventar uma função plausível para elementos que, na prática, foram observados e replicados por padrão estatístico, não por raciocínio real. Mitigação: o teste de necessidade da Seção 4.2 ("o que aconteceria se removêssemos esse elemento?") é a defesa mais forte disponível, mas depende de disciplina de execução — vale considerar validação cruzada (outro agente tenta remover o elemento do Final Frame Spec e avalia se a composição realmente perde força).

- **Como testar essas hipóteses na prática?**
  `RECOMMENDATION`: usar o benchmark da Seção 21 não apenas para comparar A/B/C, mas para rodar variações internas do próprio sistema C (com e sem síntese holística, com e sem validação cruzada de necessidade) e medir se essas adições melhoram `Human Preference` e reduzem `Over-copy Rate`/`Under-transfer Rate` o suficiente para justificar o custo extra de raciocínio.

---

## 26. Notas de Implementação e Evolução

- Este documento é a fonte de filosofia e contrato — não é o prompt de sistema em si. Um prompt de sistema derivado deste documento deve preservar a Regra de Ouro (Seção 24) como primeira prioridade, e comprimir o restante em instruções operacionais diretas, sem perder a disciplina dos 3 níveis (Seção 5) nem a separação de camadas (Seção 15).
- Qualquer evolução futura do schema do Reference Transfer Plan (Seção 9) deve manter compatibilidade retroativa dos campos `preserve_list`, `transfer_list`, `adapt_list`, `reinvent_list`, `discard_list` e `conflicts`, porque são esses campos que o Creative Director consome diretamente — mudanças neles quebram o contrato entre os dois agentes.
- A lista de Failure Modes (Seção 19) deve ser tratada como viva: todo bug real encontrado em produção que não se encaixe perfeitamente em um failure mode existente deve gerar uma nova entrada na tabela, não ser forçado dentro de uma categoria próxima apenas por conveniência.
- Reforço direto ao time de execução: a Definition of Done (Seção 23) é o critério de aceite de qualquer implementação deste agente — um Reference Translator que produz apenas descrição bonita, sem `design_decision_map` completo e sem provenance auditável, não está pronto, independentemente de quão bem escrita a prosa de saída pareça.
## Runtime v1 implementation overlay — 2026-08-15

The cognitive runtime described by this canonical document is now implemented at `src/reference-translator/index.mjs`. The complete architecture, API, persistence, validation rules, scenarios, and regression evidence are recorded in `docs/implementation/REFERENCE_TRANSLATOR_RUNTIME_V1_IMPLEMENTATION_REPORT.md`.

### Cross-category product rule

When the base and reference products belong to different categories, a reference-native support prop is a mechanism rather than a fixed object. The translator must preserve its function, material language, emotional effect, and tonal/compositional role while replacing the literal manifestation with a coherent target-native equivalent.

The runtime requires `design_decision_map[].cross_category_adaptation` for every declared cross-category support observation. Direct `TRANSFER` is invalid; `ADAPT`, `REINVENT`, or `DISCARD` is required. The record must expose source category, target category, literal object, visual function, material language, emotional effect, equivalent adaptation, `literal_transfer_allowed: false`, and target-category coherence.

Canonical perfume/skincare behavior: the handbag is not copied. Its soft fashion luxury, warm tonal support, and tactile richness may be re-expressed as cognac leather, dark suede, or another fragrance-native premium support surface.

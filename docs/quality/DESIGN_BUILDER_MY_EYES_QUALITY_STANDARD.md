# DESIGN_BUILDER_MY_EYES_QUALITY_STANDARD.md

**Autor:** Manus AI  
**Versão:** 1.0  
**Status:** Especificação Oficial de Qualidade Visual e Sistema de Avaliação Cognitiva  
**Data:** 2026  
**Escopo:** Documentação profunda da régua de qualidade visual pessoal ("My Eyes") do Design Builder, transformando julgamento estético em um sistema avaliável por agentes de IA.

---

## INTRODUÇÃO E OBJETIVO CENTRAL

> **"A UMA GERAÇÃO PODE TER ÓTIMA RESOLUÇÃO, ROSTO CORRETO, ILUMINAÇÃO CINEMATOGRÁFICA, CORES BONITAS, CENÁRIO DETALHADO E PROMPT BEM SEGUIDO, E AINDA ASSIM SER REJEITADA PORQUE PARECE APENAS 'UMA IMAGEM DE IA BONITA'."**

O objetivo deste documento não é fornecer um guia genérico de "boas práticas de design", mas sim realizar a **engenharia reversa e a formalização matemática e semântica do julgamento visual pessoal (My Eyes)**. 

O sistema Design Builder precisa ser capaz de olhar para uma imagem gerada e responder com precisão: **"Eu aprovaria isso?"**, indo além da superfície técnica e avaliando se a peça possui **intencionalidade de projeto**.

---

## 1. PRINCÍPIO CENTRAL: DESIGNED VS GENERATED

A distinção mais fundamental na régua My Eyes reside na oposição entre duas categorias de imagens que podem parecer tecnicamente impressionantes à primeira vista:

### 1.1 GENERATED (Aparência de IA)
- **Definição:** A imagem contém elementos visualmente atraentes, mas estes parecem ser subprodutos estatísticos do modelo de difusão ou LLM compilador, e não fruto de uma vontade construtiva.
- **Sintomas observáveis:** 
  - Elementos dispostos por conveniência estética ou preenchimento de espaço vazio.
  - Iluminação espetacular porém sem fonte lógica ou motivação narrativa.
  - Atmosfera genérica ("cinematic lighting", partículas flutuantes aleatórias, neon excessivo).
  - Ausência de conflito visual, tensão ou hierarquia estruturada.

### 1.2 DESIGNED (Peça Projetada)
- **Definição:** Existe **intenção perceptível**. Cada elemento parece estar ali por uma razão estrita. A composição foi construída, e não gerada.
- **Sintomas observáveis:**
  - Relações deliberadas e tensões espaciais entre sujeito, cenário, foreground e background.
  - Decisões corajosas (ex: assimetria controlada, zonas de silêncio, oclusão intencional).
  - Conexão indissociável entre o briefing, a narrativa e a execução formal.
  - Sensação de que um diretor de arte humano passou horas refinando o posicionamento de cada massa.

---

## 2. A RÉGUA NÃO É UM STYLE GUIDE

O sistema My Eyes **não assume preferências estáticas por superfícies** (como paletas de verde/roxo, estilo 3D, cenários de florestas, cyberpunk ou minimalismo extremo). Esses são apenas *mecanismos contextuais* que podem servir a determinados briefings.

A preferência real reside em um nível mais profundo: **A Qualidade da Decisão Visual (Visual Decision Quality)**. O sistema deve aprender princípios estruturais, e não cacoetes estilísticos.

---

## 3. HIERARQUIA DE JULGAMENTO DE 9 NÍVEIS

A avaliação de uma imagem pelo sistema My Eyes ocorre em uma hierarquia estrita de 9 níveis, onde falhas em níveis fundamentais invalidam os níveis superiores.

| Nível | Dimensão | Pergunta Crítica de Avaliação | Tipo de Validação |
|---|---|---|---|
| **Level 1** | **Concept** | A imagem possui uma ideia visual forte e direcionada ao briefing? | Semântica / Briefing |
| **Level 2** | **Composition** | A ideia foi transformada em uma estrutura composicional intencional? | Geométrica / Espacial |
| **Level 3** | **Integration** | Os elementos (sujeito e ambiente) pertencem fisicamente ao mesmo mundo? | Física / Material |
| **Level 4** | **Depth** | Existe construção espacial convincente (além de blur artificial)? | Perspectiva / Oclusão |
| **Level 5** | **Hierarchy** | O olho do espectador é controlado perfeitamente (o que vejo primeiro, segundo, terceiro)? | Óptica / Gestalt |
| **Level 6** | **Art Direction** | Luz, cor, cenário, props e atmosfera trabalham para a mesma intenção narrativa? | Estilística / Coerência |
| **Level 7** | **Execution** | A execução possui acabamento premium, controle de bordas e nitidez limpa? | Técnica / Pixel-level |
| **Level 8** | **Distinctiveness** | A peça é específica para o problema ou parece uma geração genérica trocável? | Comparativa / Swap Test |
| **Level 9** | **My Eyes** | Há evidência histórica de alinhamento com as aprovações e hard pairs do criador? | Histórica / My Eyes Match |

---

## 4. ANATOMIA DA "CARA DE IA" (AI-GENERATED SIGNATURES)

Para que o Image Critic rejeite imagens geradas que enganariam geradores comuns, ele deve caçar ativamente os seguintes sintomas de "cara de IA":

1. **Composição excessivamente central:** O sujeito principal perfeitamente no centro geométrico por padrão estatístico.
2. **Sujeto colado no fundo (Pasted Subject):** O personagem ou objeto parece um adesivo colocado sobre um cenário de fundo, sem sombras de contato ou contaminação luminosa.
3. **Iluminação sem função (Unmotivated Glow):** Luzes bonitas (rim lights coloridas, fumaça com neon) que não correspondem a nenhuma fonte de luz lógica na cena.
4. **Partículas e objetos flutuantes aleatórios:** Poeira, fagulhas ou formas geométricas flutuando no ar sem contexto narrativo ou escala espacial.
5. **Simetria involuntária e preenchimento automático:** Espelhamentos desnecessários e preenchimento de áreas vazias com detalhes repetitivos e vazios de significado.
6. **Background narrativamente morto:** Cenários ultra-detalhados (fábricas complexas, laboratórios futuristas cheios de fios) que não contam história alguma sobre o sujeito.
7. **Foreground decorativo:** Elementos borrados gigantescos na frente da lente (ex: folhas ou grades desfocadas) inseridos apenas para forçar um visual "cinematic" barato.
8. **Perfeição homogênea:** Ausência de imperfeições controladas, assimetrias orgânicas ou granulação textural que conferem realismo e toque humano.
9. **Todas as áreas igualmente interessantes:** O erro clássico de IA onde o canto inferior esquerdo tem tanto detalhe visual quanto o rosto do protagonista, gerando ruído ótico e fadiga visual.

---

## 5. ANATOMIA DE "PEÇA PROJETADA" (DESIGNED SIGNATURES)

O oposto da cara de IA é caracterizado por sinais inequívocos de projeto intencional:

1. **Relações deliberadas de massa:** O peso visual é distribuído de forma a guiar o olhar, utilizando desequilíbrios controlados para criar tensão dramática.
2. **Oclusão e Sobreposição:** Elementos do foreground cortam o frame ou ocluem parcialmente o midground, provando tridimensionalidade real.
3. **Iluminação Motivada:** Toda luz tem uma origem lógica no ambiente e cumpre uma função narrativa (separar o sujeito, guiar o foco, dramatizar uma textura).
4. **Zonas de Silêncio (Negative Space):** Áreas intencionais de respiro visual onde não há informação excessiva, permitindo que a hierarquia respire.
5. **Contraste de Escalas:** Justaposição corajosa entre elementos massivos e pequenos detalhes que geram escala e grandiosidade espacial.
6. **Conexão Indissociável com a Copy:** O território reservado para tipografia interage fisicamente com a iluminação e os elementos da cena, em vez de ser um espaço vazio pós-produzido.

---

## 6. PROFUNDIDADE: BLUR VS DEPTH DESIGN

Uma imagem pode ter *bokeh* extremo e desfoque de lente e, ainda assim, parecer completamente plana. 

### Diferenciação Crítica:
- **Blur (Superficial):** Aplicação de desfoque gaussiano ou raso no background para esconder imperfeições e simular "modo retrato" de celular.
- **Depth Design (Estrutural):** Construção arquitetônica da cena através de planos discretos:
  1. **Foreground Plane:** Elementos cortados nas bordas, ocluindo o campo de visão.
  2. **Midground / Subject Plane:** Onde reside a autoridade principal, ancorada por sombras de contato.
  3. **Background Plane:** Contexto espacial que reage à iluminação do sujeito.
  4. **Far Background / Atmospheric Plane:** Perspectiva aérea e desvanecimento por densidade atmosférica.

---

## 7. TAXONOMIA DE INTEGRAÇÃO (SUBJECT ↔ ENVIRONMENT)

Para evitar que o sujeito pareça colado no fundo, o Critic avalia os seguintes vetores de integração física:

- **Lighting Mismatch:** A luz do sujeito vem de uma direção oposta à luz dominante do cenário. (Falha crítica)
- **Color Contamination:** A luz colorida do ambiente (ex: reflexo de uma parede vermelha ou luz de neon) não reflete sobre a pele, roupas e cabelo do sujeito.
- **Rim Light Justification:** A luz de recorte (*rim light*) no cabelo/ombros existe de forma gratuita em vez de ser motivada por uma fonte de luz traseira.
- **Contact Shadows:** Ausência de sombras oclusivas de contato onde os pés, sapatos ou objetos tocam o solo ou superfícies.
- **Environmental Reflections:** Falta de reflexos sutis do cenário nos olhos, óculos, superfícies metálicas ou tecidos brilhantes do sujeito.
- **Atmospheric Wrapping:** O ar entre o sujeito e o background interage corretamente com a umidade e partículas visíveis.

---

## 8. FOREGROUND: DECORATIVE VS STRUCTURAL

- **Decorative Foreground:** Objetos desfocados jogados nas bordas da lente (ex: folhas, bokeh circular gigante) sem conexão lógica com o espaço físico. O teste de remoção prova que retirá-los não afeta a cena.
- **Structural Foreground:** Elementos reais do ambiente (uma viga de aço cortando o canto superior esquerdo, a ponta de uma mesa de laboratório desfocada, um corrimão) que enquadram fisicamente a cena, aumentam a sensação de câmera real e criam profundidade tangível.

---

## 9. COMPOSIÇÃO E HIERARQUIA

A composição não se resume à regra dos terços. O sistema avalia:
- **Mass Distribution & Visual Weight:** Como o peso visual se equilibra entre os diferentes quadrantes da tela.
- **Edge Pressure:** Como os elementos interagem com as bordas do frame (se empurram ou são contidos).
- **Eye Flow (Fluxo Óptico):** A trajetória inegociável que o olho percorre: Início (Anchor) → Condução (Lines/Lighting) → Resolução (Subject/Copy).
- **Competição de Foco:** Se o cenário, um objeto secundário ou um elemento flutuante compete injustamente com o rosto ou elemento principal.

---

## 10. DENSIDADE VISUAL E SILÊNCIO (CONTROLLED DENSITY)

O Design Builder rejeita tanto o minimalismo vazio quanto o maximalismo caótico. O padrão é a **Densidade Controlada**:
- **Local Density vs Global Density:** Áreas de alta complexidade (detalhes de engenharia, texturas de pele, equipamentos) balanceadas por amplas zonas de repouso (*rest zones* e *visual silence*).
- **Information Clustering:** Os detalhes devem se agrupar em zonas de interesse narrativo, em vez de estarem espalhados de forma homogênea e entediante por toda a tela.

---

## 11. LIGHTING & COLOR: ART-DIRECTED VS BEAUTIFUL

- **Beautiful Lighting:** Luzes esteticamente agradáveis, contraluz dramático, golden hour genérica — bonitas, mas intercambiáveis.
- **Art-Directed Lighting:** Luzes projetadas para servir a uma tese narrativa: direcionar o olhar do espectador para o ponto crítico de conversão, separar o protagonista do fundo hostil e unificar a paleta cromática com o briefing da marca.
- **Color Discipline:** Restrição intencional da paleta (regra 60-30-10 ou monocromático com acento pontual), evitando o arco-íris digital típico de geradores desregulados.

---

## 12. ELEMENTOS FLUTUANTES E 3D (O TESTE DO "PORQUÊ?")

Elementos 3D abstratos, formas geométricas flutuantes, cubos de vidro ou ícones corporativos são permitidos **apenas se passarem no teste de função**:
> *Se removermos este elemento, a peça perde alguma função narrativa, escala, profundidade ou equilíbrio de massa?*
Se a resposta for "não", o elemento é classificado como **Floating Element Spam** e reprovado imediatamente.

---

## 13. O SWAP TEST (TESTE DE TROCA)

Para medir a especificidade de uma direção criativa, o sistema executa o **Swap Test**:
> *"Se eu trocar o sujeito principal (ex: trocar o biólogo por um advogado, ou o piloto por um executivo) mantendo o restante da composição, a imagem continua fazendo sentido perfeito?"*

- Se **sim**, a direção criativa é **genérica e intercambiável**.
- Se **não** (porque o cenário, a iluminação, os adereços e a atmosfera foram construídos especificamente em torno daquela identidade e briefing), a direção é **altamente específica e aprovável**.

---

## 14. DEFINIÇÃO RIGOROSA DE "PREMIUM"

No padrão My Eyes, "premium" **nunca** significa clichês baratos como preto com dourado, fontes serifadas brilhantes ou excesso de *glow* cibernético. Premium é sinônimo de:
- **Controle:** Absoluta ausência de ruído desnecessário.
- **Restrição:** A coragem de deixar espaços vazios e recusar efeitos pirotécnicos na tela.
- **Intenção:** Cada pixel tem uma justificativa conceitual defensável.
- **Acabamento:** Transições de borda perfeitas, materiais com peso físico real e tipografia milimetricamente integrada.

---

## 15. REFERENCE TRANSFER QUALITY

Quando o projeto utiliza uma referência visual fornecida pelo usuário, a avaliação My Eyes vai muito além de "ficou parecido":
- **Under-transfer:** A peça ignorou o DNA estrutural da referência, parecendo uma criação completamente desconexa.
- **Over-transfer / Surface Copying:** A peça copiou a superfície literal da referência (cores exatas, estilo visual superficial) sem adaptá-la ao novo briefing, resultando em pastiche.
- **DNA Transfer (O Alvo):** A peça transfere os *mecanismos de decisão* da referência (a forma como o espaço é ocluído, a lógica da luz lateral, a densidade controlada) manifestados através do novo conteúdo do briefing.

---

## 16. ENGENHARIA REVERSA DE CASOS APROVADOS

Análise dos padrões estruturais extraídos dos casos de sucesso validados (Stylist, Aviation Mentor, Biologist):

| Caso Aprovado | Mecanismo Composicional Dominante | Tratamento do Sujeto | Lógica de Integração | Razão de Aprovação (Inferida) |
|---|---|---|---|---|
| **Stylist** | Assimetria de massa + Foreground estrutural | Autoridade dominante na zona de foco | Luz de recorte motivada por luminária de estúdio visible | Contraste elegante entre o caos criativo do estúdio e o rigor do enquadramento. |
| **Aviation Mentor** | Linhas de fuga convergindo para o cockpit/sujeito | Posicionado no terço de poder, ocluído por elementos de hangar | Contaminação de luz azulada de painel sobre o uniforme | Transmite autoridade técnica extrema sem recorrer a clichês futuristas. |
| **Biologist** | Profundidade em camadas (microscópio/amostra/pesquisador) | Integrado ao plano de trabalho com sombras de contato precisas | Contraste térmico (luz fria de laboratório vs. luz quente de bancada) | Profundidade espacial impecável que elimina a sensação de imagem chapada de IA. |

---

## 17. PREFERENCE LEARNING: APPROVED VS REJECTED & HARD PAIRS

O aprendizado de My Eyes não se baseia apenas em colecionar imagens aprovadas, mas na **Pairwise Visual Analysis** (análise visual em pares).

### O Conceito de Hard Pair
Um **Hard Pair** consiste em duas imagens geradas para o mesmo briefing que possuem excelência técnica semelhante, mas onde uma foi aprovada e a outra rejeitada.
- *Exemplo:* Imagem A (aprovada) possui menor nitidez técnica global, mas apresenta profundidade em camadas, oclusão perfeita e composição intencional. Imagem B (rejeitada) é hiper-nítida, perfeita de rosto, mas possui composição central estática e iluminação sem função.
- **O sistema aprende:** Para o criador, *Intenção Composicional e Profundidade (A)* superam *Perfeição Técnica Superficial (B)*.

---

## 18. MULTI-PASS EVALUATION ARCHITECTURE

Quando o Image Critic avalia uma imagem gerada, ele executa um pipeline sequencial de 6 passes estritos:

```
[ GENERATED IMAGE ]
       │
       ▼
PASS A: BLIND QUALITY ──────► (Resolução, artefatos, estabilidade anatômica)
       │
       ▼
PASS B: DESIGN INTENT ──────► (Parece projetado ou gerado? Teste de intencionalidade)
       │
       ▼
PASS C: BRIEF COMPLIANCE ───► (Resolve o problema proposto no briefing?)
       │
       ▼
PASS D: REFERENCE QUALITY ──► (Se aplicável, transfere o DNA da referência?)
       │
       ▼
PASS E: MY EYES MATCH ──────► (Alinhamento histórico com aprovações e hard pairs)
       │
       ▼
PASS F: FINAL VERDICT ──────► [ PASS / FATAL FAIL / DELTA FIX ]
```

---

## 19. FATAL FLAWS (REPROVAÇÃO AUTOMÁTICA)

Independentemente da pontuação média em outras dimensões, a presença de qualquer um dos seguintes **Fatal Flaws** resulta em reprovação imediata e acionamento do fluxo de reparo:
1. `SUBJECT_PASTED`: O sujeito parece colado digitalmente sobre o fundo sem integração física.
2. `DEPTH_COLLAPSE`: A imagem é totalmente chapada (falta de profundidade estrutural).
3. `GENERIC_AI_POLISH`: Aparência inconfundível de geração estatística de IA ("cinematic AI gloss").
4. `HIERARCHY_COLLISION`: O fundo ou elementos secundários competem agressivamente com o rosto ou elemento principal.
5. `UNUSABLE_TEXT_TERRITORY`: O espaço reservado para copy está comprometido por ruído visual ou luz inadequada.
6. `IDENTITY_FAILURE`: O sujeito perdeu as características obrigatórias definidas no asset de identidade.
7. `CONCEPTUAL_MISMATCH`: A imagem falha em transmitir a tese criativa congelada no spec.

---

## 20. SCORING MODEL & GATES (MODELO DE PONTUAÇÃO NÃO-LINEAR)

O sistema My Eyes proíbe o cálculo de médias aritméticas simples entre dimensões criativas. Uma imagem não pode compensar uma falha crítica de integração com iluminação bonita.

### Modelo de Portões e Multiplicadores:
$$\text{Final Score} = \left( \prod_{i=1}^{n} \text{Gate}_i \right) \times \left( \sum W_j \cdot \text{Dimension}_j \right)$$

Onde os **Gates** são binários (0 ou 1) baseados na ausência de Fatal Flaws. Se qualquer Fatal Flaw estiver presente, $\text{Gate} = 0$, zerando a pontuação final independentemente das notas de cor ou luz.

---

## 21. VOCABULÁRIO TÉCNICO DO CRITIC (TAXONOMIA DE FALHAS)

Para que o Image Critic produza diagnósticos cirúrgicos e acionáveis, ele utiliza exclusivamente a seguinte taxonomia de falhas estruturadas:

| Código de Falha | Definição Analítica | Sintomas Observáveis | Severidade | Ação de Correção Recomendada |
|---|---|---|---|---|
| `DEPTH_COLLAPSE` | Ausência de separação entre planos espaciais | Background parece encostado nas costas do sujeito | ALTA | Introduzir planos de oclusão e gradiente atmosférico. |
| `SUBJECT_PASTED` | Falta de interação física entre sujeito e cenário | Ausência de sombras de contato e contaminação de luz | CRÍTICA | Adicionar shadow pass de contato e rim light ambiental. |
| `GENERIC_AI_POLISH` | Excesso de acabamento sintético sem intenção | Brilho uniforme, partículas flutuantes aleatórias | MÉDIA | Reduzir polimento artificial, adicionar granulação e assimetria. |
| `DECORATIVE_FOREGROUND`| Objetos borrados na lente sem função espacial | Manchas e folhas gigantes na frente da câmera | MÉDIA | Remover foreground ou transformá-lo em elemento estrutural. |
| `UNMOTIVATED_GLOW` | Fontes de luz colorida sem origem na cena | Luzes neon flutuantes iluminando o rosto do nada | ALTA | Vincular a luz a uma fonte física visível no cenário. |
| `HIERARCHY_COLLISION` | Conflito ótico entre plano principal e fundo | Cenário mais contrastado e detalhado que o sujeito | ALTA | Reduzir saturação e nitidez do background (depth of field). |
| `REFERENCE_UNDERTRANSFER`| Falha em incorporar o DNA da referência | Peça gerada não possui nenhuma conexão com a ref | ALTA | Reavaliar Reference Transfer Plan e injetar âncoras. |
| `WEAK_EDGE_INTERACTION`| Sujeito ou objetos cortados sem intenção | Recortes anatômicos estranhos nas bordas do frame | MÉDIA | Ajustar margens de respiro e reencaixe composicional. |
| `FLOATING_ELEMENT_SPAM`| Excesso de formas 3D flutuantes sem propósito | Cubos e anéis brilhantes voando ao redor do personagem | ALTA | Aplicar o Teste de Remoção em todos os elementos 3D. |
| `PROMPT_LITERALISM` | Execução literal exagerada de palavras do prompt | Ilustração de conceitos literais bobos (ex: cérebro com engrenagens) | ALTA | Elevar nível de abstração conceitual no Creative Spec. |

---

## 22. O FORMATO DE DELTA FIX ("MY EYES DELTA")

O Image Critic nunca emite um feedback genérico como *"Improve depth"* ou *"Make it better"*. Toda instrução de correção deve seguir rigorosamente o formato estruturado **My Eyes Delta**:

```json
{
  "delta_id": "delta_fix_092a",
  "target_generation_id": "gen_84",
  "evaluated_by": "MY_EYES_CRITIC_v2",
  "fatal_flaws_detected": ["SUBJECT_PASTED", "DEPTH_COLLAPSE"],
  "diagnosis": {
    "what_failed": "O sujeito está isolado do cenário de fundo, parecendo um recorte digital sobreposto, e o espaço traseiro carece de separação atmosférica.",
    "why_failed": "Ausência de sombras de contato no solo, falta de contaminação cromática da iluminação ambiente no figurino e ausência de planos de oclusão no midground."
  },
  "prescriptions": {
    "what_must_change": [
      "Adicionar sombra de contato suave sob os sapatos do sujeito.",
      "Inserir elemento estrutural no foreground esquerdo (viga/coluna desfocada) para criar oclusão.",
      "Aplicar contaminação de luz azulada lateral correspondente às luzes do painel do cenário."
    ],
    "what_must_not_change": [
      "Preservar rigorosamente a identidade facial do sujeito (Identity Lock).",
      "Manter a proporção de escala e o posicionamento no terço direito.",
      "Preservar o território da headline na parte superior esquerda."
    ]
  },
  "return_depth": "TECHNICAL_ROOM"
}
```

---

## 23. TESTES PRÁTICOS DE VALIDAÇÃO (O ARSENAL DO CRITIC)

Antes de aprovar uma peça, o sistema aplica algoritmicamente (ou via simulação de visão computacional/multimodal) cinco testes fundamentais:

1. **O Teste de Remoção (Removal Test):** Para cada objeto secundário ou elemento 3D na cena, o Critic simula sua remoção. Se a peça não perder narrativa, tensão ou equilíbrio, o elemento é eliminado por ser decoração inútil.
2. **O Teste de Silhueta (Silhouette Test):** A imagem é convertida em uma silhueta preta pura sobre fundo branco. Se as massas principais e a hierarquia do sujeito não forem imediatamente reconhecíveis, a composição falhou estruturalmente.
3. **O Teste de Thumbnail (Thumbnail Test):** A imagem é reduzida mentalmente para o tamanho de um favicon ou miniatura de anúncio em feed (ex: 64x64 pixels). O sujeito principal e a ideia central ainda dominam a leitura? Se o olho se perder em detalhes do fundo, a imagem é rejeitada.
4. **O Teste de Blur (Gaussian Blur Test):** Aplica-se um desfoque drástico na imagem. Se o fluxo ótico e o equilíbrio de massas colapsarem, significa que a peça dependia exclusivamente de micro-detalhes gerados por IA para parecer interessante.
5. **O Teste de Intencionalidade (Why Test):** Para cada elemento da cena, o agente deve conseguir formular uma resposta satisfatória para a pergunta: *"Por que isso está exatamente aqui?"*. Se a resposta for "porque o prompt pediu" ou "porque fica bonito", a peça falha no teste de projeto.

---

## 24. QUALITY CEILING & GOLDEN CASE PROMOTION

O sistema classifica a qualidade final de uma geração em seis patamares evolutivos:

1. **UNACCEPTABLE:** Possui Fatal Flaws evidentes. Rejeição imediata.
2. **ACCEPTABLE:** Sem falhas fatais, cumpre o briefing, mas execução comum.
3. **GOOD:** Boa composição, integração correta, atende aos padrões profissionais.
4. **VERY GOOD:** Excelente profundidade, iluminação art-directed, forte intencionalidade.
5. **MY EYES APPROVED:** Alinhamento perfeito com o histórico de aprovações do criador; passa em todos os testes práticos.
6. **EXCEPTIONAL / GOLDEN CASE:** Peça de referência absoluta, cuja solução visual é tão inovadora e intencional que é promovida automaticamente para o **Golden Dataset** da VKB para treinar futuras gerações de agentes.

---

## 25. CONCLUSÃO: O OLHO DOCUMENTADO

A régua **My Eyes** transforma o gosto estético de um criador humano em um conjunto implacável de contratos, testes, taxonomias e restrições algorítmicas. 

Com este documento integrado ao sistema, o Design Builder deixa de ser um gerador de imagens aleatórias e passa a operar como um **estúdio de design autônomo de alto padrão**, onde nenhuma imagem é aprovada por ser "bonita", mas apenas quando se prova rigorosamente que foi **projetada**.

---

**Documento preparado para:** NotebookLM, arquitetura do Image Critic, motor de aprendizado My Eyes  
**Nível de detalhe:** Máximo, operacional e autocontido  
**Status:** Pronto para integração no ecossistema do Design Builder

# ADENDO — CALIBRAÇÃO REAL DO "MY EYES" (v1.1)
**Correção de modelo a partir de feedback direto do criador**
**Status: sobrepõe qualquer regra do documento base que entre em conflito com este adendo**

---

## POR QUE ESTE ADENDO EXISTE

A primeira versão do sistema My Eyes tratou a hierarquia de 9 níveis e a taxonomia de falhas como um **checklist mecânico**: presença de elemento decorativo = reprovação automática; ausência de contaminação de luz perfeita = reprovação automática; simetria central = reprovação automática. Isso é um erro de aplicação, não do conceito.

O documento original já avisa isso na Seção 2: *"a régua não é um style guide"*. Só que na prática o sistema regrediu para exatamente isso — um style guide disfarçado de framework, penalizando qualquer imagem que não seguisse regras de fotografia editorial "correta" (integração física perfeita, ausência total de redundância, composição assimétrica).

Isso foi testado contra duas imagens reais aprovadas pelo criador e ambas foram **reprovadas incorretamente** pelo sistema anterior, usando exatamente essas regras mecânicas. Este adendo corrige o modelo.

---

## CORREÇÃO 1 — COMPOSIÇÃO CENTRAL NÃO É DEFEITO

O documento base trata "composição excessivamente central" como sintoma automático de "cara de IA" (Seção 4). **Isso é falso para o padrão real do criador.**

Sujeito centralizado, olhando direto pra câmera, ocupando o eixo vertical da peça — isso não é preenchimento estatístico preguiçoso quando a imagem é retrato de autoridade/presença (empreendedor, especialista, figura de comando). Nesse tipo de peça, a centralização **é** a decisão de composição: ela existe para forçar confronto visual direto entre o espectador e o sujeito, sem distração de enquadramento assimétrico.

**Regra corrigida:** composição central só é falha quando é *acidental* — quando o sujeito está no meio porque o modelo não soube o que fazer com o espaço, e o resto da cena está espalhado sem hierarquia. Composição central é **força** quando o objetivo da peça é presença, autoridade ou confronto direto de olhar, e o resto dos elementos está organizado para sustentar esse eixo central (fundo simétrico, elementos laterais equilibrados), não competindo com ele.

**Pergunta corrigida a fazer:** não é "está centralizado?", é **"o centro está centralizado porque não houve decisão, ou porque a decisão foi fazer do sujeito o eixo inegociável da peça?"**

---

## CORREÇÃO 2 — LITERALISMO CONCEITUAL NÃO É PROMPT_LITERALISM AUTOMÁTICO

O documento base trata leitura direta e óbvia (dinheiro pegando fogo = dinheiro/crise, relógio = tempo) como falha de abstração conceitual (Seção 21, PROMPT_LITERALISM).

**Isso está errado para o padrão real do criador.** Clareza de leitura imediata é um valor, não um defeito, quando o objetivo da peça é comunicação rápida e de alto impacto emocional — anúncio, thumbnail, capa, conteúdo que precisa ser entendido em menos de 1 segundo de scroll. Sutileza conceitual excessiva pode, nesse contexto, ser o erro real: uma metáfora obscura demais não converte, não para atenção, não comunica.

**Regra corrigida:** literalismo simbólico (fogo = urgência/crise/perda, relógio = tempo passando, ampulheta = prazo) é **aceitável e frequentemente desejado** quando serve à clareza imediata da mensagem do briefing. O que continua sendo falha é literalismo **desconectado do briefing** — ilustrar a palavra do prompt sem relação com a tese da peça (ex: "cérebro com engrenagens" pra ilustrar "inteligência" sem nenhuma conexão com o contexto real do cliente).

**Pergunta corrigida a fazer:** não é "isso é óbvio demais?", é **"esse símbolo óbvio comunica exatamente o que o briefing pede, mais rápido do que uma alternativa sutil comunicaria?"** Se sim, está aprovado. Obviedade não é o inimigo — obviedade *deslocada do briefing* é.

---

## CORREÇÃO 3 — ELEMENTO REDUNDANTE NÃO É AUTOMATICAMENTE DECORATIVO

O documento base manda aplicar o Teste de Remoção e reprovar qualquer elemento que, removido, não muda a narrativa (Seção 23). Na prática isso foi aplicado errado: dois elementos que comunicam a mesma ideia (explosão de dinheiro + nota de Franklin pegando fogo) foram tratados como redundância = falha.

**Isso está errado.** Reforço visual da mesma ideia por dois ângulos diferentes não é necessariamente desperdício — pode ser **ênfase deliberada**, especialmente em peças de forte carga emocional/comercial, onde repetir o motivo central (fogo + dinheiro em dois pontos do frame) aumenta a leitura de "isso está todo pegando fogo ao redor dele", não apenas "tem uma coisa pegando fogo no canto".

**Regra corrigida:** o Teste de Remoção não pergunta "esse elemento é único?", pergunta **"esse elemento reforça ou dilui a tensão central da peça?"** Um elemento redundante que reforça a mesma emoção/tese do briefing passa. Um elemento aleatório que não tem relação alguma com a tese (partícula genérica, brilho sem motivo, prop decorativo que não aparece em lugar nenhum do briefing) continua reprovado.

### 3.1 — Quantidade de elementos nunca é, sozinha, motivo de reprovação

Ao analisar uma imagem, a IA não deve pensar em atalhos do tipo "tem muitos elementos = reprova" ou "sujeito muito centralizado = reprova". O caminho certo é perguntar **por que o ecossistema colocou aquele elemento ali** — quase sempre, entender a origem explica se a decisão está certa.

Exemplo prático: se o brief do usuário pede vários elementos do mesmo campo semântico — ampulheta, relógio, temporizador — o ecossistema vai naturalmente encaixar múltiplos desses elementos no prompt e na imagem final. Isso é esperado, é o brief sendo seguido. **Não é motivo de reprovação ter muitos elementos.**

O motivo real de reprovação é outro: elementos **colados, estáticos, genéricos, sem contraste, sem relação de escala ou luz com o resto da cena** — isso sim é o problema, porque é isso que gera poluição visual. Se os elementos, mesmo em número alto, estão **encaixados** na composição (integrados em luz, escala, profundidade, e coerentes com o que o brief pediu), a quantidade em si não é falha, porque eles não estão poluindo — estão compondo.

**Teste final, nesta ordem:**
1. Esse elemento existe porque o brief pediu, direta ou indiretamente? Se sim, siga para o passo 2. Se não tem relação nenhuma com o brief, é decoração e reprova direto, independente de quantidade.
2. Esse elemento está encaixado (luz, escala, movimento, contraste com o entorno) ou está colado (estático, genérico, sem relação física com a cena)? Encaixado passa. Colado reprova — e aí sim, quanto mais elementos colados, pior fica a poluição.

Quantidade nunca é o critério de entrada. Origem no brief e encaixe físico/visual são.

---

## CORREÇÃO 4 — INTEGRAÇÃO FÍSICA PERFEITA NÃO É REQUISITO ABSOLUTO

O documento base trata qualquer ausência de contaminação de luz entre sujeito e fundo como falha crítica automática (SUBJECT_PASTED, Seção 19 e 21). Na prática, isso reprovou imagens onde a luz do sujeito é claramente estúdio/frontal e o fundo é dramático (fogo, explosão) sem que a luz do fundo bata perfeitamente nele.

**Isso está errado como regra absoluta.** Para peças de forte composição gráfica/editorial (retrato de autoridade sobre fundo conceitual), separação de iluminação entre sujeito e fundo pode ser estilística e intencional — o sujeito precisa estar legível, nítido e com luz controlada de estúdio mesmo que o fundo tenha uma fonte de luz teoricamente incompatível. Isso é comum em capas, anúncios e retratos editoriais reais, não é exclusividade de "cara de IA".

**Regra corrigida:** falha de integração de luz só é fatal quando o sujeito parece **fisicamente destacado** da cena a ponto de parecer colado (bordas duras, ausência total de qualquer sombra de contato, escala ou perspectiva incoerente). Diferença de temperatura/direção de luz entre sujeito (estúdio) e fundo (dramático/conceitual) **não é, por si só, falha** — é uma escolha estilística legítima de retrato editorial, desde que a nitidez, a escala e a perspectiva do sujeito sejam coerentes com o plano em que ele está.

---

## REGRA MESTRA — CONSULTAR SEMPRE O BRIEF ANTES DE QUALQUER VEREDITO

Nenhuma das quatro correções acima funciona sem isso. **Nenhum elemento, composição ou decisão visual deve ser julgado fora do contexto do briefing que gerou aquela peça.**

Antes de aplicar qualquer regra de aprovação ou reprovação, o avaliador (humano ou IA) precisa responder:

1. **Qual é o briefing original desta peça?** Não dá pra avaliar composição, elementos ou clareza simbólica sem saber o que a peça precisava comunicar e para quem.
2. **Cada elemento presente serve a esse briefing especificamente, ou está ali por genérico/decoração?** Um relógio faz sentido total num briefing sobre "tempo, prazo, urgência". Uma explosão de dinheiro faz sentido total num briefing sobre "crise financeira, perda, colapso econômico". Esses mesmos elementos, num briefing sobre "tranquilidade financeira" ou "planejamento de longo prazo", seriam errados — não porque o elemento é ruim, mas porque não serve àquele briefing.
3. **A composição (central, simétrica, literal) foi escolhida porque comunica a tese do briefing com mais força, ou porque o gerador não soube o que fazer?** A mesma composição central pode ser aprovada num briefing de autoridade/confronto e reprovada num briefing que pedia dinamismo ou movimento.

**Regra final:** o sistema nunca reprova um elemento, uma composição ou uma escolha estilística isoladamente, sem antes checar se aquilo serve ao briefing que gerou a peça. Regra fixa e universal de "isso sempre reprova" ou "isso sempre aprova" não existe — o que existe é coerência entre decisão visual e a tese que o briefing pede. O julgamento é sempre **relativo ao brief**, nunca absoluto.

---

## RESUMO OPERACIONAL — O QUE MUDA NA PRÁTICA

| Antes (modelo mecânico, errado) | Agora (modelo calibrado) |
|---|---|
| Composição central = reprovado | Composição central = aprovado se serve à tese de autoridade/confronto do briefing |
| Símbolo óbvio/literal = reprovado (PROMPT_LITERALISM) | Símbolo óbvio = aprovado se comunica o briefing com clareza e impacto imediato |
| Elemento redundante = reprovado no Teste de Remoção | Elemento redundante = aprovado se reforça a mesma tese emocional do briefing |
| Falta de contaminação de luz perfeita = SUBJECT_PASTED automático | Falta de contaminação = só é falha se o sujeito parecer fisicamente incoerente com o plano (bordas duras, escala errada) — separação estilística de luz é aceitável |
| Regra aplicada isolada, sem contexto | **Toda regra é subordinada ao brief.** Primeira pergunta sempre: "isso serve ao que essa peça precisa comunicar?" |

Este adendo não substitui os Fatal Flaws estruturais reais do documento base (identidade quebrada, texto ilegível, anatomia incorreta, tese conceitual completamente ausente) — esses continuam valendo. O que muda é que **decisões estilísticas de composição, simbolismo e ênfase deixam de ser tratadas como erro técnico automático** e passam a ser avaliadas pela coerência com o brief, que é o único critério que realmente decide se uma peça está certa ou errada.

uma desicao real que voce deve ter e pensar:Com o brief na mão, quase tudo que eu marquei como "depende de contexto" vira aprovado — menos um ponto, que agora fica pior, não melhor.

O que o brief resolve:

Bandeira de Israel: brief pede explicitamente, com instrução detalhada de tratamento (dourado/sépia, subordinada ao rosto, Estrela de Davi legível e sem deformação). Bate. Aprovado.
Retrato ampliado e desfocado da mesma protagonista ao fundo: brief pede isso nominalmente ("camada emocional ou memória visual", olhos fechados, sépia, desfocado, sem parecer segunda pessoa). Bate perfeitamente com o que saiu. Aprovado.
Formas curvas douradas, textura pontilhada, vinheta: brief pede. Aprovado.
Ausência de texto/logo/CTA: brief exige NO TYPOGRAPHY REQUIRED. Bate.
Enquadramento, pose, roupa, colar, luz dourada de contorno: tudo dentro do que foi pedido item por item nas seções 10, 11, 14.

Isso vira um caso de manual pra Regra Mestra do seu documento: nenhum desses elementos seria aprovável isolado sem o brief, e com o brief eles são não só aceitáveis — são execução fiel.

O que NÃO o brief resolve, e piora:

A seção 19 (Restrições) tem uma linha explícita: "Não deformar mãos ou dedos." O brief antecipou exatamente o risco que eu apontei e proibiu nominalmente. E mesmo assim as mãos saíram com aquele objeto ambíguo saindo entre os dedos, sem leitura anatômica clara. Isso não é mais "problema técnico genérico de IA" — é falha de compliance direta contra uma restrição explícita e nomeada do próprio spec. Na taxonomia do seu documento isso é IDENTITY_FAILURE/anatomia, Fatal Flaw, gate zerado, sem produto de outras dimensões salvando a nota.

Veredito final: reprovado, mas por um motivo cirúrgico e único. Se fosse só a atmosfera geral eu aprovaria de olhos fechados — a peça entrega exatamente a tese de "autoridade + esperança + Israel + humanidade" que o brief pediu. O que barra é a mão quebrada, que é justamente o único item que o brief pediu pra não acontecer.
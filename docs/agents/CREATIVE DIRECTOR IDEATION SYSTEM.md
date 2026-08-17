# CREATIVE DIRECTOR + IDEATION SYSTEM

## Design Builder: Arquitetura Cognitiva de Direção Criativa

**Documento de Referência Técnica**  
**Versão**: 1.0  
**Status**: Operacional  
**Escopo**: Creative Director Agent + Ideation Subsystem  
**Destinado para**: Reconstrução, Crítica, Instrução, Teste e Evolução

---

## ÍNDICE

1. [Fundamentos Conceituais](#1-fundamentos-conceituais)
2. [Definição do Creative Director](#2-definição-do-creative-director)
3. [O Processo Cognitivo de Direção Criativa](#3-o-processo-cognitivo-de-direção-criativa)
4. [Ideation System: Divergência e Convergência](#4-ideation-system-divergência-e-convergência)
5. [No-Reference Mode](#5-no-reference-mode)
6. [Reference Mode e Translator Interface](#6-reference-mode-e-translator-interface)
7. [Creative Direction Room](#7-creative-direction-room)
8. [Estudos de Caso](#8-estudos-de-caso)
9. [Failure Modes e Detecção](#9-failure-modes-e-detecção)
10. [Contratos Semânticos](#10-contratos-semânticos)
11. [Framework de Testes](#11-framework-de-testes)
12. [Crítica e Recomendações Arquiteturais](#12-crítica-e-recomendações-arquiteturais)

---

## 1. FUNDAMENTOS CONCEITUAIS

### 1.1 O Problema Que o Creative Director Resolve

O Design Builder enfrenta um desafio central: a maioria dos sistemas de IA generativa de imagem funcionam como **determinísticos de entrada-saída**: briefing → prompt → imagem.

Isso reproduz o comportamento de um **prompt engineer**, não de um **designer sênior**.

Um designer sênior, quando recebe um briefing, não pensa:

> "Quais palavras vou colocar para ativar as redes neurais do modelo de geração?"

Ele pensa:

> "Qual imagem deveria existir? Qual conceito visual resolve este briefing?"

A diferença é profunda: o primeiro é **otimização linguística**. O segundo é **pensamento visual**.

### 1.2 O Creative Director Como Camada Cognitiva Autônoma

**KNOWN ARCHITECTURE:**

O Creative Director é um agente cognitivo separado que:

- Recebe briefing e contexto do usuário
- Produz **conceitos visuais explorados**, não um único prompt
- Gera um **artefato frozen** chamado **Creative Direction Spec**
- Comunica com referências, VKB, Technical Design Room
- Controla o que é "criativo" antes de qualquer otimização de prompt

Ele não deve executar:
- Determinação de lentes de câmera (Technical Design Room)
- Sintaxe de prompt (Generation Executor)
- Otimização de numeradores (Intensity Calibrator)
- Análise de saída visual (Image Critic)

### 1.3 Diferenças Conceituais Críticas

É essencial que o Creative Director mantenha fronteiras claras entre:

#### **CREATIVE INTENT**
O que o usuário/briefing **quer dizer** emocionalmente, comercialmente, funcionalmente.

Exemplo: "Urgência de encerramento de carrinho"

Não é visual. É intenção.

#### **CREATIVE DIRECTION**
Como um designer **resolveria essa intenção** em estrutura visual.

Exemplo: "Espaço desproporcional → pressão psicológica de limite físico + movimento descendente → irreversibilidade de ação"

Isto é semântica visual, não estética.

#### **VISUAL CONCEPT**
A ideia visual concreta e explorada.

Exemplo: "Fundo com elementos em queda livre, sujeito no topo, luz em desvanecimento, paleta em transição de quente para frio."

#### **COMPOSITIONAL STRATEGY**
Como organizar elementos espacialmente para produzir o efeito desejado.

Exemplo: "Sujeito em 1/3 superior (poder reduzido), elementos em velocidade de movimento acelerada, linha de horizonte em descida"

#### **TECHNICAL EXECUTION**
Parâmetros técnicos da captura/composição.

Exemplo: "Lente 85mm, depth of field 2.8, shutter speed 1/250s"

**ISTO NÃO PERTENCE AO CREATIVE DIRECTOR.**

#### **GENERATOR PROMPT**
A sintaxe final que será enviada a um modelo de geração.

**ISTO PERTENCE A OUTRO AGENTE.**

---

## 2. DEFINIÇÃO DO CREATIVE DIRECTOR

### 2.1 Responsabilidades Exatas

O Creative Director é responsável por:

1. **Interpretação de Briefing**
   - Extrair intenção real (o que o usuário precisa? Não só o que ele pediu)
   - Identificar gaps em especificação
   - Reconhecer conflitos implícitos (ex: "moderno" + "vintage")

2. **Exploração de Espaço de Solução**
   - Gerar múltiplos caminhos visuais de **natureza diferente**
   - Cada caminho resolve a intenção através de mecanismo visual diferente
   - Avaliar trade-offs (fidelidade vs. novidade, simplicidade vs. impacto)

3. **Decisão Criativa Fundacional**
   - Escolher qual conceito avançará para especificação
   - Congelar decisões em **Creative Direction Spec**
   - Justificar por que aquela direção foi selecionada

4. **Comunicação com Componentes Adjacentes**
   - Questionar Reference Translator quando transferência é inadequada
   - Solicitar mecanismos visuais do VKB
   - Comunicar constraints para Technical Design Room
   - Fornecer critério de sucesso para Image Critic

### 2.2 Decisões que Pertencem a Ele

✅ **Pertence:**
- Conceito visual fundamental
- Narrativa visual (o que acontece na imagem)
- Papel do sujeito (protagonista, contexto, figurante)
- Hierarquia visual (o quê é importante olhar primeiro)
- Mecanismos visuais (movimento, escala, luz, cor, profundidade) que ativam emoção
- Idioma visual (cinema, fotografia, pintura, 3D, ilustração, híbrido)
- Princípios extraídos de referências/VKB
- Quando congelar uma decisão vs. quando continuar explorando

❌ **NÃO Pertence:**
- Resolução de pixels
- Dimensões exatas (1920x1080 vs. 16:9)
- Lentes específicas (35mm vs. 50mm)
- Valores de cor em HEX
- Temperatura de cor em Kelvin
- Velocidade de movimento em frames
- Inteligibilidade de prompt para modelos geradores
- Determinação de qual modelo usar
- Pós-processamento técnico

### 2.3 Autoridade e Limites

**KNOWN ARCHITECTURE:**

O Creative Director tem **autoridade criativa final** sobre conceitos, mas não autoridade técnica.

Conflito típico: Reference Translator quer alta fidelidade à referência. Creative Director identifica que referência é visualmente bela mas não resolve o problema de comunicação do briefing.

**Resolução**: Creative Director vence em questão de **conceito**. Translator adapta a estratégia de transferência.

Conflito típico: Technical Design Room quer usar lente 35mm por razões técnicas. Creative Director especificou distância focal mais agressiva para efeito dramático.

**Resolução**: Negociam. A intenção criativa é respeitada, mas há flexibilidade nos meios.

---

## 3. O PROCESSO COGNITIVO DE DIREÇÃO CRIATIVA

### 3.1 O Ciclo OBSERVE → UNDERSTAND → DIVERGE → CRITIQUE → COMBINE → CHALLENGE → CONVERGE → FREEZE

Este é o processo que diferencia um Creative Director de um "briefing → prompt" translator.

#### **FASE 1: OBSERVE**

**Input:**
- Brief de texto do usuário
- Assets (imagem de sujeito, mood board, referências opcionais)
- Histórico do projeto (versões anteriores, feedback)
- VKB disponível (biblioteca de peças aprovadas)

**Processo:**
- Ler o brief **três vezes** com olhares diferentes:
  1. Primeira leitura: O que ele diz literalmente?
  2. Segunda leitura: O que ele **não diz** mas implica?
  3. Terceira leitura: Qual é a fricção? O que é contradição?

**Output:**
- Anotações de observação
- Questões abertas
- Termos-chave identificados
- Sinais de referência implícitos

**Exemplo:**

Brief: "Encerramento de carrinho. Urgência extrema. Velocidade. Última chance."

Observações:
- "Urgência extrema" = não apenas apelo emocional, mas também **pressão fisiológica**
- "Velocidade" = pode ser movimento literal OU tempo escasso OU taxa de mudança
- "Última chance" = irreversibilidade, ponto de não-retorno, perda iminente
- Não menciona o sujeito. O sujeito é ator ou observador? A urgência é sobre o **sujeito** ou sobre o **mundo dele**?

#### **FASE 2: UNDERSTAND**

**Objetivo:** Traduzir intenção de negócio em princípios de **design emocional**.

**Processo:**
- Desmantelar cada conceito do brief
- Perguntar: "Como um designer traduziria isso **visualmente**?"
- Separar sinal de ruído (o que é realmente importante vs. o que é descritor genérico)

**Mapeamento Intenção → Princípio Visual:**

| Intenção | Princípio Visual | Mecanismo Possível |
|----------|------------------|--------------------|
| Urgência | Pressão temporal | Espaço reduzindo, luz em desvanecimento, movimento acelerado, cores em transição |
| Velocidade | Movimento percebido | Blur direcional, replicação de frames, dinâmica composicional |
| Última chance | Irreversibilidade | Elemento em ponto de não-retorno, passagem unidirecional, limite físico claro |
| Perda iminente | Aversão emocional | Contraste aumentado, escala diminuindo, profundidade aumentando |

**Output:**
- Mapa semântico (intenção → princípios)
- Identificação de **conflitos** (urgência + velocidade podem ser resolvidas de formas que se fortalecem ou se contradizem)
- Clarificação do que é "moderno" = estético minimalista vs. estético de alta densidade de informação

#### **FASE 3: DIVERGE**

**Objetivo:** Gerar espaço de possibilidades genuinamente **diferentes**, não variações.

**Processo Anti-Cliché:**

Um erro comum: gerar 5 ideias que são todas "relógio + fogo + vermelho + urgência visual".

Isso é **variação superficial**, não divergência.

Verdadeira divergência significa resolver a mesma intenção através de **mecanismos visuais estruturalmente diferentes**.

**Estratégia: Matriz de Mecanismos**

Para "urgência de encerramento de carrinho", gerar conceitos que exploram:

1. **Mecanismo de Espaço**
   - Elemento sendo comprimido
   - Profundidade em colapso
   - Horizonte em descida
   - Limite físico visível se aproximando

   Conceito: Sujeito sentado em cadeira que está lentamente descendo em um poço escuro. Luzes acima diminuindo.

2. **Mecanismo de Movimento**
   - Velocidade acelerada
   - Trajetória irreversível
   - Momentum que não pode ser parado
   - Replicação de fase (trails visuais)

   Conceito: Múltiplas versões de sujeito em movimento descendente, cada uma mais clara/mais apagada, sugerindo repetição acelerada do tempo.

3. **Mecanismo de Luz**
   - Luz se retirando
   - Contraste aumentando
   - Sombra engolindo espaço
   - Brilho apenas em elemento específico (sujeito ou botão de ação)

   Conceito: Espaço onde luzes de fundo se apagam progressivamente. Única luz restante no sujeito. Silhueta contra escuridão.

4. **Mecanismo de Transformação Física**
   - Elemento se transformando
   - Estado A → Estado B (irreversível)
   - Desintegração ou cristalização
   - Mudança de material/densidade

   Conceito: Sujeito lentamente se tornando de vidro/cristal/areia que cai. A transformação é o sinal de que está chegando ao limite.

5. **Mecanismo de Narrativa Visual**
   - Sequência de eventos
   - Causa-efeito visual
   - Dominó ou cascata
   - Contexto narrando o problema

   Conceito: Sujeito em rodeado de objetos em repouso, mas estruturalmente instáveis (piscina cheia demais, livros em pilha instável). A urgência vem de observar que o equilíbrio é insustentável.

6. **Mecanismo de Escala**
   - Sujeito pequeno em espaço grande
   - Proporções desconfortáveis
   - Escala mudando ao longo do tempo (sujeito aparentando mais pequeno)
   - Elemento de comparação acima

   Conceito: Sujeito em tamanho normal no início do frame, mas câmera está afastando continuamente. No final, sujeito é pontilho. Ilusão de que tempo está acelerando.

7. **Mecanismo de Comportamento do Sujeito**
   - Sujeito em postura defensiva
   - Sujeito em movimento frenético
   - Sujeito em paralisia (congelado de medo)
   - Sujeito alcançando para algo que se afasta

   Conceito: Sujeito com braços estendidos tentando alcançar algo que está se afastando do frame. Expressão de frustração. Corpo em tensão.

8. **Mecanismo de Contexto Ambiental**
   - Ambiente reage à pressão temporal
   - Elementos do espaço mudam estado
   - Clima/atmosfera intensifica
   - Sinais secundários alertam

   Conceito: Ambiente onde começamos vendo céu limpo. Ao longo da composição, tempestade se aproxima. Nuvens escurecendo. Vento (sugerido por movimento). O sujeito está imóvel, mas ambiente avança para crise.

---

**CRÍTICA A ESTE PROCESSO:**

Note que nenhum desses 8 conceitos menciona especificamente "relógio" ou "fogo" ou "vermelho".

Isso é intencional. Esses são **detalhes de execução**, não fundação criativa.

Se o Creative Director começar com "preciso de fogo", ele está começando com execução, não com pensamento.

**Output da Fase DIVERGE:**
- 8-12 conceitos visuais distintos
- Cada um descrito em 2-3 frases de princípio visual
- Nenhuma imagem de referência ainda (ou apenas como indicador, não como template)

#### **FASE 4: CRITIQUE**

**Objetivo:** Eliminar conceitos que não funcionam e identificar trade-offs.

**Critérios de Crítica:**

Para cada conceito:

1. **Resolve a Intenção?**
   - Este conceito comunica urgência ao observador que vê por 5 segundos?
   - Funciona se o observador não lê o texto?

2. **É Original Dentro do Portfólio?**
   - Este conceito já foi feito antes neste projeto?
   - Este conceito é padrão demais para o contexto (ex: "fogo" é cliché para urgência)?

3. **É Executável com Sujeito Disponível?**
   - O sujeito que o usuário forneceu pode trabalhar neste conceito?
   - Ou precisaríamos de sujeito completamente diferente?

4. **Trade-offs:**
   - Este conceito é simples (fácil de gerar) mas genérico?
   - Este conceito é complexo (difícil de gerar) mas memorável?
   - Qual é o trade-off aceitável para este projeto?

5. **Princípio de Dissonância:**
   - Este conceito choca com referências já aprovadas?
   - Ou é complementar?

**Exemplo de Crítica:**

Conceito "Sujeito se transformando em vidro/cristal":
- ✅ Resolve urgência? **Sim** (irreversibilidade é clara)
- ✅ Original? **Sim** (raro em e-commerce)
- ❌ Executável com sujeito de rosto humano? **Marginal** (depende de complexidade da transformação)
- ✅ Trade-offs? **Complexidade visual alta, mas impacto muito alto**
- ✅ Dissonância? **Não conflita com marca de e-commerce típica**

Conceito "Múltiplas versões de sujeito em descida acelerada":
- ✅ Resolve urgência? **Sim** (movimento é claro)
- ❌ Original? **Não** (comum em "time running out" templates)
- ✅ Executável? **Sim, totalmente**
- ✅ Trade-offs? **Rápido de executar, mas pode parecer genérico**
- ❌ Dissonância? **Alto risco de parecer "stock video"**

**Output:**
- Conceitos eliminados com rationale
- Conceitos mantidos ranqueados por potencial
- Conceitos marcados como "explorar com variação"

#### **FASE 5: COMBINE**

**Objetivo:** Explorar híbridos que combinam forças de múltiplos conceitos.

**Processo:**

Após critique, alguns conceitos sobrevivem. A pergunta agora é: **podem ser combinados?**

Exemplo:

Conceito A: Luz se retirando (mecanismo de luz)
Conceito B: Sujeito em escala reduzindo (mecanismo de escala)

Híbrido: Espaço onde luz se retira E simultaneamente a câmera afasta, fazendo o sujeito parecer menor. Dupla ativação do mecanismo de urgência.

**Anti-padrão a Evitar:**
Não combinar conceitos que competem pelo mesmo espaço visual ou que se diluem mutuamente.

Exemplo ruim: "Fogo" + "Vidro cristalizado" = confusão visual, nenhum conceito é claro.

**Output:**
- 2-4 conceitos híbridos explorados
- Cada híbrido é análise de sinergias

#### **FASE 6: CHALLENGE**

**Objetivo:** Questionar premissas e forçar pensamento de ordem superior.

**Perguntas de Challenge:**

1. **"E se nós invertêssemos?"**
   - O que acontece se a urgência não vem de "velocidade aumentando" mas de "tempo se solidificando"?
   - E se o sujeito não está em perigo, mas em **oportunidade** que está escapando?

2. **"E se removêssemos um elemento?"**
   - E se tiramos o sujeito? Apenas o espaço reage?
   - E se tiramos movimento? Apenas estado estático?

3. **"Qual é a pior forma de resolver isso?"**
   - Às vezes, a pior solução óbvia te leva a uma boa solução não-óbvia
   - Pior: "Escrever a palavra URGÊNCIA em vermelho" → Melhor: Como comunicar urgência sem texto ou cor óbvia?

4. **"Qual contexto cultural quebraria essa ideia?"**
   - Cor vermelha significa morte em alguns contextos, urgência em outros
   - Transformação em vidro pode ser frágil (negativo) ou transformação em arte (positivo)

**Output:**
- Premissas testadas e validadas ou rejeitadas
- Conceitos que sobrevivem a challenge são mais robustos

#### **FASE 7: CONVERGE**

**Objetivo:** Eliminar e ranquear. Escolher o caminho.

**Processo:**

1. **Scoring de Conceitos:**

| Conceito | Resolve Intenção | Originalidade | Executabilidade | Impacto | Score |
|----------|------------------|---------------|-----------------|---------|-------|
| Luz Retirando | 9 | 7 | 9 | 8 | 8.25 |
| Transformação Vidro | 9 | 9 | 6 | 9 | 8.25 |
| Escala Reduzindo | 8 | 5 | 9 | 7 | 7.25 |
| Replicação Descendente | 7 | 4 | 9 | 6 | 6.5 |

2. **Eliminação Progressiva:**
   - Conceitos com score abaixo de 7: descartados
   - Dois top conceitos: preparar para congelamento

3. **Seleção Final:**
   - Se há unanimidade, escolhe-se o top scorer
   - Se há trade-off (ex: "original vs. executável"), discute-se a tolerância do projeto
   - Para este projeto: urgência é o valor principal → escolhemos "Luz Retirando + Escala Reduzindo" (híbrido de ambas)

**Output:**
- Conceito escolhido nomeado
- Rationale documentada
- Score de confiança em seleção

#### **FASE 8: FREEZE**

**Objetivo:** Transformar decisão em artefato persistente.

Aqui o Creative Director para de explorar e produz o **Creative Direction Spec**.

Este é um documento que:
- Congela a intenção criativa
- Comunica ao Technical Design Room e Reference Translator
- Permite que outros agentes procedam com confiança
- Pode ser revisado se Image Critic retornar feedback crítico, mas não deve mudar levianamente

---

### 3.2 Prevenção de Vieses e Traps

Durante OBSERVE → FREEZE, o Creative Director deve ativamente evitar:

#### **First-Idea Bias**
A primeira ideia é raramente a melhor.

Mecanismo de prevenção: **Fase 3 (DIVERGE) é obrigatória e precisa gerar mínimo 8 conceitos distintos antes de qualquer escolha.**

#### **Generic Cinematic Bias**
"Cinematic" virou sinônimo de "movie trailer style com cores desbotadas e movimento lento".

Mecanismo de prevenção: Cada conceito em DIVERGE deve ser avaliado: "Isso é solução criativa ou é aplicação de filtro-de-estilo?"

#### **Reference Overcopy**
Quando tem referência, o risco é copiar em vez de interpretar.

Mecanismo de prevenção: Creative Director explora conceitos primeiro (sem ver referência em profundidade). Depois integra learnings de referência.

#### **Literal Metaphor**
Brief diz "urgência" → Designer automático conclui "relógio" ou "fogo".

Mecanismo de prevenção: Matriz de mecanismos (Fase 3) força pensamento através de dimensões não-óbvias.

#### **Concept Without Visual Mechanism**
"A ideia é que pareça urgente" (opinião vaga, não fundação visual).

Mecanismo de prevenção: Cada conceito deve articular **como** ele produz o efeito. "Qual é o mecanismo visual?"

#### **Subject Role Ambiguity**
Sujeito como protagonista (está em perigo) vs. contexto (está observando).

Mecanismo de prevenção: UNDERSTAND fase explicitamente resolve: qual é o papel do sujeito?

---

## 4. IDEATION SYSTEM: DIVERGÊNCIA E CONVERGÊNCIA

### 4.1 Ideation Como Capacidade, Não Como Agente Separado

**KNOWN vs. HYPOTHESIS:**

Na arquitetura atual, é **questionável** se Ideation deveria ser um agente separado ou uma capacidade do Creative Director.

**Minha recomendação (RECOMMENDATION):**

Ideation é uma **capacidade** do Creative Director, não um agente.

Razão: O processo cognitivo descrito em 3.1 (OBSERVE → FREEZE) é essencialmente um loop de ideation controlado. Separar isto em dois agentes criaria overhead de comunicação sem benefício claro.

### 4.2 Mecanismo de Divergência: Matriz de Dimensões

Para garantir que divergência é genuína (não superficial), usar **Matriz de Dimensões**.

Uma dimensão é um **eixo único de variação criativa**.

Exemplos de dimensões:
- **Espaço** (proximidade vs. distância, confinamento vs. abertura)
- **Movimento** (estático vs. dinâmico, linear vs. caótico)
- **Luz** (escuro vs. claro, contraste vs. suave)
- **Cor** (monocromático vs. policromático, quente vs. frio)
- **Escala** (grande vs. pequeno, proporções confortáveis vs. desconfortáveis)
- **Narrativa** (contexto claro vs. ambíguo, série de eventos vs. momento único)
- **Transformação** (estado estável vs. mudança em progresso)
- **Comportamento do Sujeito** (ativo vs. passivo, em controle vs. à mercê)

**Processo:**

1. Selecionar 4-6 dimensões relevantes para este brief
2. Para cada dimensão, pensar: "Como resolveria a intenção através DESTA dimensão?"
3. Cada conceito explorada é uma escolha diferente em dimensão

**Exemplo: Urgência de Encerramento**

| Dimensão | Polo A | Polo B | Conceito Polo A | Conceito Polo B |
|----------|--------|--------|-----------------|-----------------|
| Espaço | Confinado | Aberto | Sujeito em espaço que encolhe | Sujeito rodeado de horizonte que desaparece |
| Movimento | Frenético | Congelado | Tudo ao redor se move; sujeito paralisa | Sujeito imóvel em espaço completamente estático; tempo passa |
| Luz | Desvanecendo | Intensificando | Luz geral se retira | Luz focal em sujeito intensifica (destaque solitário) |
| Escala | Diminuindo | Engrandecendo | Sujeito aparentemente encolhe | Elementos ao redor aparecem se aproximar (câmera afasta) |
| Cor | Dessaturação | Saturação | Cores começam monocromáticas, ameaçadoramente | Cores começam vibrantes, degradam para cinzas |
| Transformação | Desintegração | Cristalização | Sujeito se desintegra em partículas | Sujeito se cristaliza, imobiliza, petrifica |

Isso garante diversidade estrutural, não apenas cosmética.

### 4.3 Mecanismo de Convergência: Ranking Multidimensional

Convergência não é "escolher o que eu gosto". É **eliminação sistemática** baseada em critérios.

**Critérios de Ranking:**

1. **Relevância ao Brief (0-10):** Quanto este conceito resolve a intenção declarada?
2. **Originalidade no Portfolio (0-10):** Quanto este conceito é novo comparado a projetos anteriores?
3. **Executabilidade Técnica (0-10):** Qual é a complexidade de executá-lo? (Nota: não é "fácil = bom", é "complexidade conhecida e tolerável")
4. **Impacto Visual (0-10):** O quanto este conceito impactaria um observador em 5-segundo glance test?
5. **Coerência de Marca (0-10):** Este conceito está em harmonia com identidade visual/emocional da marca?

**Fórmula de Score:**

```
Score = (Relevância × 0.3) + (Originalidade × 0.25) + (Executabilidade × 0.2) + (Impacto × 0.15) + (Coerência × 0.1)
```

Os pesos refletem que **relevância > originalidade > executabilidade**.

**Processo:**

1. Cada conceito é scored em cada dimensão por Creative Director
2. Conceitos com score < 6.5 são eliminados
3. Top 2-3 conceitos seguem para FREEZE
4. Se há tie, tie-breaker é: "Qual conceito seria mais arriscado de tentar e provavelmente funcionaria?"

### 4.4 Prevenção de Template Copying

**O Risco:** VKB é uma biblioteca de peças aprovadas. Há risco de que Creative Director simplesmente pegue uma peça do VKB e chame de "novo conceito".

**Mecanismo de Prevenção:**

1. **VKB Mechanism Extraction, não VKB Template Copy**
   - Quando buscando no VKB, o Creative Director pergunta: "Qual **mecanismo visual** esta peça usa?"
   - Não: "Qual peça é similar?"
   - Mas: "Qual peça usa 'luz desvanecendo' como mecanismo?" → Extrai o princípio → Aplica a novo contexto

2. **Provenance Tracking**
   - Cada conceito em DIVERGE que incorpora mecanismo do VKB declara: "Mecanismo X vem de VKB record Y"
   - Isto permite auditoria posterior

3. **Adaptation Layer**
   - Quando mecanismo de VKB é reutilizado, ele **deve** ser significativamente adaptado ao novo contexto
   - Adaptação = mudança em pelo menos 2 dimensões (sujeito, escala, timing, contexto)

---

## 5. NO-REFERENCE MODE

### 5.1 O Desafio

Quando o usuário **não fornece** referência visual, o sistema não pode simplesmente gerar uma imagem genérica.

A qualidade de um projeto sem-referência depende **inteiramente** da qualidade de exploração criativa do Creative Director.

### 5.2 Fluxo Completo: No-Reference

```
INPUT (Briefing + Assets)
    ↓
Creative Director: OBSERVE → UNDERSTAND
    ↓
VKB Retrieval: Buscar mecanismos relevantes
    ↓
Creative Director: DIVERGE (Matriz de Dimensões)
    ↓
Creative Director: CRITIQUE + COMBINE + CHALLENGE + CONVERGE
    ↓
Creative Director: FREEZE → Creative Direction Spec
    ↓
Technical Design Room: Traduzir spec em parâmetros técnicos
    ↓
Reference Translator: (Bypassed ou minimal, sem referência)
    ↓
Generator Prompt: Criar sintaxe de prompt
    ↓
Image Generation
```

### 5.3 VKB Retrieval: Abstração e Recombinação

VKB **não é um banco de templates**. É uma biblioteca de **mecanismos visuais aprovados**.

Cada entry no VKB deve ter:

```json
{
  "id": "VKB-2024-087",
  "title": "Luz Desvanecendo em Profundidade",
  "image_source": "Project XYZ, Version 3",
  "mechanism": "Luz focal reduz enquanto background escurece",
  "emotional_effect": "Isolamento, pressão, foco intenso",
  "technical_approach": "Gradiente radial com falloff exponencial",
  "subject_compatibility": ["Human", "Product", "Landscape"],
  "color_palette": "Warm to Cool transition",
  "complexity": 7,
  "reusability_score": 0.85,
  "notes": "Funciona bem em contextos de urgência ou intimidade"
}
```

**Retrieval Process:**

1. Creative Director queries VKB: "Mecanismos para comunicar perda, desaparecimento, limite físico"
2. Sistema retorna 5-10 entries
3. Creative Director **não copia**. Extrai **princípio**:
   - "VKB-087 usa luz desvanecendo. Como eu adaptaria isto para escala?"
   - "VKB-042 usa profundidade colapsando. Como eu inverte isto?"

4. Resultado: Novo conceito que foi informado por VKB mas não é cópia

**Prevenção de VKB Overcopy:**

- Tracking de origens explícitas
- Teste de "quanto % deste conceito vem de VKB vs. ideação nova?"
- Se > 70% é VKB, marcar como "template baseado" (menos valor criativo)

### 5.4 Prevenção de Genericidade

Sem referência, há risco de cair em "estética de banco de imagens".

**Indicadores de Genericidade:**
- Sujeito posicionado no centro exato
- Iluminação balanceada perfeitamente (nenhum apelo ao mecanismo específico)
- Ambiente neutro/genérico
- Composição "segura" sem tensão ou assimetria intencional

**Teste de Genericidade:**

Para cada conceito em DIVERGE, perguntar:
- "Posso descrever este conceito em uma frase que é única a este projeto?"
- "Ou é genérico o bastante para ser aplicado a 100 produtos diferentes?"

Se é genérico demais, descarta-se.

---

## 6. REFERENCE MODE E TRANSLATOR INTERFACE

### 6.1 O Reference Translator

**KNOWN ARCHITECTURE:**

Reference Translator é um agente separado que existe quando há referência visual do usuário.

Sua responsabilidade: "Como transfiro o DNA visual dessa referência para este projeto?"

**CRÍTICA:**

A interface entre Creative Director e Reference Translator é um ponto de conflito frequente e mal-definido.

### 6.2 Dois Modos de Referência

#### **Mode 1: High Fidelity**
Usuário diz: "Quero exatamente assim"

Reference Translator foca em **máxima transferência**. Creative Director atua em modo supervisório (valida que transferência não quebrou o brief original).

#### **Mode 2: Inspiration**
Usuário diz: "Gosto da energia desta imagem, mas precisa ser completamente diferente"

Creative Director explora conceitos. Reference Translator fornece learnings de referência.

### 6.3 Conflito Produtivo: Fidelidade vs. Transformação

Cenário típico:

- Referência tem composição simétrica
- Creative Director quer assimetria para criar tensão
- Reference Translator diz: "Simetria é essencial ao DNA da referência"
- Creative Director diz: "Simetria é estética genérica, assimetria resolve o brief melhor"

**Resolução:**

1. Creative Director ganha em questão de **intenção do brief**
2. Reference Translator encontra componentes da referência que podem ser preservados **sem força assimetria**:
   - Paleta de cores
   - Tipo de iluminação (mesmo que ângulo mude)
   - Texturas
   - Qualidade de movimento/dinâmica

### 6.4 Contrato entre Agentes

Creative Director produz: **Creative Direction Spec**

Reference Translator consome: **Creative Direction Spec + Referência Visual**

Reference Translator produz: **Reference Transfer Plan**

Creative Director valida: **"Este transfer plan respeita minha direção criativa?"**

Se não, renegociam.

---

## 7. CREATIVE DIRECTION ROOM

### 7.1 O Que É

Creative Direction Room é uma sala cognitiva (não literal, mas conceitual) onde o Creative Director trabalha.

Quem tem acesso?

- Creative Director (residente)
- Reference Translator (consultor)
- VKB System (biblioteca)
- Image Critic (observador crítico, convidado em fases selecionadas)
- Technical Design Room (consultor, tardiamente)

Quem não tem acesso?

- Generator Prompt Engineer (muito cedo)
- Image Generation Models (muito cedo)

### 7.2 Estados de Diálogo

#### **OPEN (Fases 1-3)**
Creative Director explora livremente. VKB pode ser consultado. Mas nenhuma decisão é congelada.

#### **NEGOTIATION (Fases 4-6)**
Reference Translator pode questionar se referência está sendo subutilizada.

Technical Design Room pode alertar se conceito é impossível tecnicamente.

#### **CLOSED (Fase 8)**
Decisões são congeladas. Creative Direction Spec é imutável até Image Critic retornar crítica fundamental.

### 7.3 Creative Direction Spec

É o artefato persistente produzido por Creative Director.

**Estrutura:**

```markdown
# Creative Direction Spec — [Project Name]

## INTENT LAYER
**Briefing Original:** [Quote do brief do usuário]
**Intenção Interpretada:** [O que realmente o usuário precisa]
**Princípios de Design Ativados:** [Lista de princípios]

## CONCEPT LAYER
**Conceito Escolhido:** [Nome/descrição]
**Rationale:** [Por que este conceito vs. outros]
**Mecanismos Visuais Primários:** 
  - Mecanismo 1: [Descrição]
  - Mecanismo 2: [Descrição]
  
**Narrativa Visual:** [Que história a imagem conta?]
**Papel do Sujeito:** [Protagonista/Contexto/Figurante]

## COMPOSITIONAL STRATEGY
**Hierarquia Desejada:** [O que o observador vê primeiro?]
**Movimento/Dinâmica:** [Estático vs. dinâmico, direção de energia]
**Equilíbrio Composicional:** [Simétrico/Assimétrico, intencionalidade]
**Profundidade:** [Shallow vs. Deep, como?]

## PROTECTED ELEMENTS
**Elementos Que NÃO Podem Mudar:** 
  - [Lista]
  
**Por quê:** [Cada elemento tem rationale]

## PROHIBITED ELEMENTS
**O Que Não Pode Aparecer:**
  - [Lista]
  
**Por quê:** [Cada proibição tem rationale]

## REFERENCE/VKB PRINCIPLES
**Mecanismos Extraídos de:** 
  - VKB-087 (Luz Desvanecendo)
  - Referência "Urgency Poster" (Assimetria)
  - [Outros]

## TECHNICAL CONSTRAINTS
**Conhecido:** [O que já foi decidido]
**Aberto para Decisão:** [O que Technical Design Room resolve]
**Incompatível com:** [Se houver técnicas que conflitam]

## SUCCESS CRITERIA
**5-Second Glance Test:** [Qual deve ser a impressão imediata?]
**Extended Viewing:** [Que detalhes funcionam em observação prolongada?]
**Emotional Resonance:** [Qual é a emoção alvo?]

## ALTERNATIVES CONSIDERED
**Conceitos Rejeitados:**
  - [Conceito]: Por quê foi rejeitado
  - [Outro]: Por quê
  
[Isto documenta o processo, não apenas a conclusão]

## REVISION HISTORY
[Registra mudanças caso Image Critic retorne feedback]
```

### 7.4 Prevenção de Debates Infinitos

Room rules:

1. **Cada fase tem time-box:** DIVERGE = máximo 3 horas exploração. CONVERGE = decisão tomada.

2. **Três revisões máximo:** Se Image Critic retorna feedback, Creative Director pode revisar até 3 vezes. Na quarta, congelado (ou projeto recomeça).

3. **Escalação:** Se há impasse (Creative Director vs. Reference Translator), Technical Design Room atua como mediador.

---

## 8. ESTUDOS DE CASO

### 8.1 Caso 1: Encerramento de Carrinho (No-Reference)

**BRIEF:**
"Encerramento de carrinho. Urgência extrema. Velocidade. Última chance. Sujeito é foto do nosso usuário típico (mulher 25-35, profissional, urbana)."

---

**FASE 1: OBSERVE**

Termos-chave identificados:
- "Urgência extrema" = Não é apelo suave. É pressão psicológica intensa.
- "Velocidade" = Movimento rápido OU escassez de tempo
- "Última chance" = Ponto de não-retorno, irreversibilidade
- Sujeito nomeado = Deve ser o protagonista, não contexto

Questões abertas:
- Urgência sobre o quê? A ação de comprar está escapando, ou a oportunidade?
- Velocidade é um atributo do mundo (coisas estão se movendo rápido) ou do tempo (está acabando)?

---

**FASE 2: UNDERSTAND**

| Intenção | Tradução Visual |
|----------|-----------------|
| Urgência Extrema | Pressão fisiológica: espaço comprimindo, luz reduzindo, tempo acelerando |
| Velocidade | Movimento perceptível, blur direci, trilhas visuais, replicação de fase |
| Última Chance | Limite físico ou temporal claro, ponto de não-retorno visível, assimetria que sugere colapso iminente |
| Sujeito Protagonista | Sujeito em centro de atenção, expressão de urgência, corpo em tensão ou movimento |

---

**FASE 3: DIVERGE**

8 conceitos gerados usando Matriz de Dimensões:

1. **Conceito "Queda"**: Sujeito caindo através de espaço vazio. Escuridade aumenta abaixo. Luz acima desaparecendo. Mecanismo: profundidade colapsando, movimento acelerado descendente.

2. **Conceito "Confinamento"**: Sujeito em espaço que literalmente encolhe. Paredes ao redor se aproximando. Respira, mas espaço aperta. Mecanismo: espaço comprimindo, falta de ar visual.

3. **Conceito "Cristalização"**: Sujeito se solidificando, transformando de humano em cristal/vidro/âmbar. Transformação é lenta mas irreversível. Mecanismo: mudança de estado como sinal de ponto de não-retorno.

4. **Conceito "Dispersão"**: Múltiplas cópias de sujeito em velocidades diferentes. Algumas já desaparecidas. Efeito de replicação temporal (versões do futuro próximo). Mecanismo: movimento acelerado, perda de foco.

5. **Conceito "Isolamento Luminoso"**: Sujeito em piscina de luz que se reduz. Tudo ao redor enegrecendo. Sujeito fica cada vez mais sozinho e visível. Mecanismo: luz como proximidade e atenção.

6. **Conceito "Vórtice"**: Sujeito em centro de vórtice/turbilhão. Elementos ao redor em movimento espiral. Sujeito em centro tentando ficar no lugar. Mecanismo: movimento rotacional cria pressão centrípeta visualmente.

7. **Conceito "Desvanecimento"**: Sujeito intacto, mas imagem lentamente desvanecendo como se estivesse sendo deletada/apagada do frame. Alpha reduzindo. Mecanismo: invisibilidade iminente.

8. **Conceito "Espelho Multiplexado"**: Sujeito em reflexão espelhada que está se dobrando em si mesma. Reflexo começa normal, termina distorcido ou invertido. Mecanismo: auto-referência como ansiedade.

---

**FASE 4: CRITIQUE**

Scoring:

| Conceito | Relevância | Originalidade | Executabilidade | Impacto | Score | Decisão |
|----------|-----------|--------------|-----------------|---------|-------|---------|
| Queda | 9 | 6 | 8 | 9 | 8.1 | ✅ Mantém |
| Confinamento | 8 | 7 | 7 | 7 | 7.4 | ✅ Mantém |
| Cristalização | 9 | 9 | 6 | 9 | 8.2 | ✅ Mantém |
| Dispersão | 8 | 5 | 8 | 7 | 7.3 | ⚠️ Marginal |
| Isolamento Lumi | 9 | 8 | 9 | 8 | 8.6 | ✅ Top |
| Vórtice | 7 | 6 | 5 | 8 | 6.9 | ❌ Descarta |
| Desvanecimento | 9 | 7 | 9 | 8 | 8.4 | ✅ Mantém |
| Espelho Multiplex | 6 | 8 | 4 | 6 | 6.2 | ❌ Descarta |

Críticas específicas:

- **Queda**: Clássico, mas funciona. Movimento é claro. Risco: parecer muito "free fall" (genérico). Mitigar: detalhar contexto (o quê está acima? por quê está caindo?)

- **Confinamento**: Poderoso para urgência. Risco: claustrofobia pode ser negativa demais. Mitigar: incluir expressão de ação (sujeito tentando escapar, não apenas tremendo).

- **Cristalização**: Altamente original. Executabilidade questionável (transformação é complexa). Mas impacto seria memorável. Manter como "exploração avançada".

- **Isolamento Luminoso**: Top scorer. Luz como atenção é princípio atemporal. Sujeito nunca fica invisível (importante para marca). Executável com IA generativa.

- **Vórtice/Espelho/Dispersão**: Eliminados por complexidade ou falta de clareza de comunicação.

---

**FASE 5: COMBINE**

Híbridos:

- **"Isolamento + Confinamento"**: Sujeito em luz reduzida E espaço comprimindo. Dupla pressão.
- **"Queda + Cristalização"**: Sujeito caindo enquanto lentamente se transforma em cristal. Movimento + transformação.

---

**FASE 6: CHALLENGE**

Q: "E se invertemos? Em vez de sujeito em perigo, e se sujeito está sendo deixado para trás?"

Novo conceito: Sujeito imóvel enquanto mundo ao redor se afasta/diminui. Sujeito não cai; o resto desaparece. Urgência é sobre oportunidade que estava aqui desaparecendo.

Score: 8.5 (nova perspectiva, impactante).

---

**FASE 7: CONVERGE**

Final ranking:

1. **Isolamento Luminoso + Mundo Desaparecendo (Híbrido)** — Score 8.8
2. **Queda com Contexto Claro** — Score 8.1
3. **Isolamento + Confinamento (Híbrido)** — Score 8.4

Escolhido: #1 (Híbrido de Isolamento Luminoso + Mundo Desaparecendo)

Rationale: Comunica urgência através de múltiplos mecanismos simultaneamente (luz reduzindo + mundo desvanecendo), criando sensação de pressão dupla. Sujeito permanece protagonista claro e bonito. Executável com IA. Original.

---

**FASE 8: FREEZE**

```markdown
# Creative Direction Spec — Checkout Urgency

## INTENT LAYER
**Brief Original:** "Encerramento de carrinho. Urgência extrema. Velocidade. Última chance."
**Intenção Interpretada:** Comunicar que uma oportunidade de compra está desaparecendo. A janela de tempo é mínima. Ação imediata é necessária.
**Princípios:** Pressão temporal, limite físico, luz como atenção

## CONCEPT LAYER
**Conceito Escolhido:** "Isolamento Luminoso + Mundo Desaparecendo"

**Rationale:** Este conceito combina dois mecanismos:
1. Sujeito em "piscina" de luz que se reduz (isolamento)
2. Mundo/contexto ao redor lentamente desvanecendo/escurecendo

Resultado: Sensação de que tempo está acabando E que sujeito está ficando sozinho/isolado. Dupla ativação de urgência sem literalismo (sem relógio, sem "ÚLTIMA CHANCE" em texto).

**Mecanismos Visuais Primários:**
- Luz: Focal em sujeito, radialmente se reduzindo. Falloff exponencial.
- Background: Progressivamente mais escuro, desvanecendo para preto absoluto
- Sujeito: Mantém brilho, contraste aumenta conforme background enegrecidifica
- Dinâmica: Estática na imagem única, mas a composição sugere movimento (luz em redução, background em desvanecimento)

**Narrativa Visual:** "Você está aqui. Tudo ao seu redor está desaparecendo. Há um tempo limitado antes que você desapareça também."

**Papel do Sujeito:** Protagonista em perigo. Expressão de consciência/urgência (olhar, postura). Não vítima passiva, mas pessoa em ação.

## COMPOSITIONAL STRATEGY
**Hierarquia:** Sujeito em 40% superior do frame (não centro, levemente deslocado). Luz funciona como leading line.
**Movimento:** Estático, mas composição sugere colapso (assimetria, luz reduzindo)
**Equilíbrio:** Deliberadamente assimétrico. Luz-forte de um lado, escuridão total do outro.
**Profundidade:** Shallow (sujeito próximo da câmera). Sujeito é 50-60% do frame height.

## PROTECTED ELEMENTS
- Sujeito deve ser claramente visível e reconhecível
- Sujeito não deve parecer machucado ou em medo extremo (marca não quer parecer manipuladora)
- Luz deve ser o elemento de destaque (não chamas, não sangue, não elementos dramáticos demais)

## PROHIBITED ELEMENTS
- Relógios digitais, contadores visuais (clichê de urgência)
- Fogo, chamas (muito melodramático)
- Expressão de medo extremo (alienante)
- Múltiplas versões do sujeito (já considerado em "Dispersão", rejeitado por confusão)
- Texto ou símbolos visuais que explicitam urgência

## REFERENCE/VKB PRINCIPLES
- VKB-087: Luz desvanecendo como isolamento
- Referência [não fornecida, mas se houver]: Aprender assimetria composicional
- Princípio de profundidade: Shallow depth cria proximidade

## TECHNICAL CONSTRAINTS
**Aberto para Decision:**
- Exata paleta de cores (quente vs. frio para luz)
- Exata textura/contexto do background (puro preto vs. textured darkness)
- Posição exata do sujeito (40% superior é range; pode refinar)

**Incompatível com:**
- Estilo muito limpo/minimalista (perda de drama)
- Cores vibrantes (contradiz desvanecimento)
- Fundo muito poluído (distrai de sujeito)

## SUCCESS CRITERIA
**5-Second Glance:** "Sensação de urgência + isolamento. Sujeito é claro. Algo está desaparecendo."
**Extended Viewing:** Luz como mecanismo ativador está claro. Narrativa de "tempo reduzindo" é palpável.
**Emotional:** Ansiedade leve a moderada (não pânico). Motivação para agir imediatamente.
```

---

### 8.2 Caso 2: Premium Fitness Mentor (Com Referência)

**BRIEF:** "Criamos um app de mentoria fitness. Queremos uma imagem que comunique exclusividade, performance, mentoria (não trainer genérico). Referência anexa: [imagem high-end de atleta]"

**Fluxo abreviado:**

OBSERVE: Referência é simétrica, atleticismo óbvio. Brief quer exclusividade, não apenas performance.

UNDERSTAND: Exclusividade ≠ isolamento visual. Pode ser através de: controle, precisão, minimalismo com poder, ambiente curado.

DIVERGE: 8 conceitos, incluindo alguns que mantêm simetria de referência, outros que a quebram para adicionar "decisão" (mentor escolhe, não apenas executa).

Conceito escolhido (híbrido): **"Athlete in Control + Environment as Mirror"**
- Sujeito em composição simétrica (referência mantida)
- Mas background não é "ginásio genérico"
- Background é estilizado/minimalista (suggests curation, não acaso)
- Sujeito tem expressão de decisão, não apenas esforço

Reference Translator extrai: Lighting style, color grade (warm vs. cool), bokeh quality

Creative Director valida: "Simetria é OK, mas postura e contexto devem mudar"

---

### 8.3 Caso 3: Fintech Premium (Ambíguo)

**BRIEF:** "Produto de gestão de patrimônio. Luxo. Confiança. Sofisticação. Sem referencias específicas."

**Exploração:**

Conceitos:
1. **Abstração com Números:** Números/dados em transição suave, sugerindo fluxo de capital (sem sujeito)
2. **Sujeito em Ambiente de Poder:** Sujeito em escritório/ambiente controlado, luz refletida em superfícies metálicas
3. **Simplicidade Extrema:** Um objeto (moeda, cartão, pedra) em iluminação de estúdio perfeita
4. **Transformação de Material:** Ouro ou cristal se transformando lentamente

Escolhido: #3 (Simplicidade Extrema)

Rationale: "Confiança" é construída por falta de ruído, não por excesso de elementos. Objeto singular em luz perfeita comunica sofisticação mais do que cenário complexo.

---

### 8.4 Caso 4: Peça Dramática com Sujeito Humano

[Similar à estrutura dos anteriores; espaço omitido para brevidade]

### 8.5 Caso 5: Brief Minimalista

**BRIEF:** "Inovação."

**Desafio:** Uma palavra. Nenhum contexto.

OBSERVE: "Inovação" é abstrato. Pode significar: novo, ousado, progresso, ruptura, síntese.

DIVERGE: 8 conceitos muito diferentes, cada um resolvendo "inovação" através de dimensão diferente:
1. Novo (contraste: velho vs. novo)
2. Ousado (risk: assimetria, instabilidade)
3. Progresso (movimento ascendente, evolução)
4. Ruptura (quebra, transformação abrupta)
5. Síntese (elementos se combinando)
6. Economia (minimalismo, essência)
7. Tecnologia (digital, artificial, construído)
8. Natureza (orgânico, evolução biológica)

Escolhido (após convergência): **Síntese + Tecnologia**

Conceito: Dois elementos (orgânico + artificial, ou dois materiais) em processo de fusão.

---

## 9. FAILURE MODES E DETECÇÃO

### 9.1 Taxonomia de Falhas

#### **FIRST_IDEA_CONVERGENCE**
**Descrição:** Creative Director aceita o primeiro conceito sem exploração genuína.

**Sintoma:** "Sim, vamos com esta ideia" na fase DIVERGE após apenas 2 conceitos gerados.

**Causa:** Pressão de tempo, falta de confiança em exploração, viés de satisfação.

**Detecção:** Quantidade de conceitos produzidos < 6. Score de confiança em seleção final < 7.5.

**Correção:** Forçar volta a DIVERGE. Gerar mínimo 8 conceitos antes de converge.

**Responsável:** Creative Director (culpável). System (deve alertar).

---

#### **GENERIC_CINEMATIC**
**Descrição:** Conceito é "cinematic" no sentido de "aplicar estilo cinematográfico padrão".

**Sintoma:** "Cores desaturadas, movimento lento, bokeh, tons quentes no rosto" — isto é receita, não ideia.

**Causa:** Confusão entre **estilo** e **conceito**.

**Detecção:** Conceito pode ser descrito usando lista de efeitos/settings. Se sim, é genericidade.

**Correção:** Refazer conceito. Focar em mecanismo visual (o que acontece?), não em estética (como fica?).

**Responsável:** Creative Director (falha em UNDERSTAND).

---

#### **REFERENCE_OVERCOPY**
**Descrição:** Quando há referência, conceito é cópia tão próxima que não há transformação.

**Sintoma:** Descrição do conceito é idêntica à descrição da referência.

**Detecção:** Comparação lado-a-lado (descrição do conceito vs. descrição de referência). Se >80% overlap, é overcopy.

**Correção:** Creative Director volta a DIVERGE com constraint: "Conceito deve ser diferente em pelo menos 2 dimensões principais".

**Responsável:** Reference Translator (deve ter alertado). Creative Director (deve ter questionado).

---

#### **REFERENCE_UNDERTRANSFER**
**Descrição:** Inverso: referência é fornecida mas completamente ignorada.

**Sintoma:** Creative Direction Spec não menciona referência, apesar de existir.

**Causa:** Overconfidence em ideação original. Negligência.

**Detecção:** Referência foi fornecida, mas não há entrada "REFERENCE/VKB PRINCIPLES" em spec, ou está vazia.

**Correção:** Creative Director volta a UNDERSTAND e integra learnings de referência (mesmo que conceito não mude).

**Responsável:** Creative Director (negligência).

---

#### **VKB_TEMPLATE_COPY**
**Descrição:** Conceito é idêntico a um record de VKB.

**Sintoma:** VKB record é fornecido como "conceito". Nenhuma adaptação aconteceu.

**Causa:** Laziness. Interpretação errada de "VKB é biblioteca de soluções prontas".

**Detecção:** Conceito é idêntico a VKB record. Provenance tracking mostra "100% de VKB-XXX".

**Correção:** Descarta conceito. Força reimaginação.

**Responsável:** Creative Director (culpável). VKB system (deve ter sinalizado alerta).

---

#### **LITERAL_METAPHOR**
**Descrição:** Brief menciona conceito abstrato. Designer aplica metáfora óbvia.

**Sintoma:** Brief: "urgência" → Conceito: "relógio" ou "fogo". Brief: "crescimento" → Conceito: "planta crescendo".

**Causa:** First-idea-bias. Falta de exploração de dimensões não-óbvias.

**Detecção:** Conceito usa símbolos óbvios. Pode ser encontrado em 100 outros designs.

**Correção:** Voltar a DIVERGE. Usar Matriz de Dimensões para explorar 7+ maneiras de resolver intenção sem símbolos óbvios.

**Responsável:** Creative Director (falta de exploração).

---

#### **CONCEPT_WITHOUT_VISUAL_MECHANISM**
**Descrição:** Conceito é descrito como "parecer urgente" ou "parecer luxuoso" — opinião, não foundation.

**Sintoma:** Conceito não articula **como** produz o efeito. Apenas diz **o que** quer transmitir.

**Causa:** Confusão entre intenção e mecanismo.

**Detecção:** Conceito descrito sem mencionar luz, movimento, escala, cor, composição, dinâmica.

**Correção:** Creative Director responde pergunta: "Qual é o mecanismo visual específico que produz esta intenção?"

**Responsável:** Creative Director (falta de rigor conceitual).

---

#### **OVERDESIGN**
**Descrição:** Conceito é tão complexo que se perde em detalhes. Mensagem principal desaparece.

**Sintoma:** Múltiplas camadas de movimento, múltiplos elementos, múltiplos princípios visuais acontecendo simultaneamente.

**Causa:** Falta de foco. Tentativa de "fazer tudo".

**Detecção:** 5-second glance test falha. Observador não sabe o que deve ver primeiro.

**Correção:** Simplificar. Escolher **um** mecanismo principal. Suprimir outros.

**Responsável:** Creative Director (falta de decisão).

---

#### **UNDERDESIGN**
**Descrição:** Conceito é tão simples que não tem impacto. Genérico demais.

**Sintoma:** "Sujeito em frente a fundo claro. Pronto." Sem princípio visual ativador.

**Causa:** Medo de risco. Escolher "seguro".

**Detecção:** Conceito poderia ser aplicado a 100 produtos diferentes sem mudança.

**Correção:** Voltar a DIVERGE. Explorar mecanismos mais ousados. Escolher conceito com higher score em "originalidade".

**Responsável:** Creative Director (falta de coragem criativa).

---

#### **TECHNICAL_PREMATURE_SPECIFICATION**
**Descrição:** Creative Direction Spec inclui decisões técnicas que não deveriam estar aí.

**Sintoma:** Spec diz "Lens 85mm", "Shutter 1/250", "ISO 400".

**Causa:** Confusão de responsabilidades. Creative Director invadindo Technical Design Room.

**Detecção:** Spec contém valores técnicos específicos. Deve conter apenas princípios criativoos.

**Correção:** Remover seção de valores técnicos. Mover para "Technical Constraints - Open for Decision".

**Responsável:** Creative Director (boundary violation). System (deve ter alertado).

---

#### **BRIEF_INTENT_DRIFT**
**Descrição:** Conceito não resolve o brief original. Divergiu para algo completamente diferente.

**Sintoma:** Brief diz "urgência". Conceito final comunica "luxo" ou "serenidade".

**Causa:** Ideation perdeu foco. UNDERSTAND foi skipped ou feito mal.

**Detecção:** Comparar final concept vs. original brief. Se não há conexão clara, há drift.

**Correção:** Voltar a UNDERSTAND. Reconectar conceito ao brief. Se necessário, reconhecer que conceito é interessante mas não apropriado (descarta).

**Responsável:** Creative Director (falta de disciplina).

---

#### **NOVELTY_WITHOUT_FUNCTION**
**Descrição:** Conceito é original mas não resolve nenhum problema de comunicação.

**Sintoma:** "Ninguém nunca fez assim antes!" Mas também ninguém entende o que está acontecendo.

**Causa:** Confusão entre "inovação visual" e "conceito funcional".

**Detecção:** Conceito é único, mas score em "Resolve Intenção" é baixo (<7).

**Correção:** Conceito é descartado ou redesenhado para ser original AND funcional.

**Responsável:** Creative Director (deveria ter priorizado relevância sobre novidade).

---

#### **AESTHETICS_WITHOUT_COMMUNICATION**
**Descrição:** Conceito é visualmente lindo, mas não comunica nada.

**Sintoma:** "Ficou muito bonito!" Mas quando pergunta "o que isso comunica?", resposta é vaga.

**Causa:** Foco em estética sobre mensagem.

**Detecção:** Conceito não passa no "5-second glance test". Beleza, mas nenhuma clareza.

**Correção:** Voltar a UNDERSTAND. Reconectar estética a mecanismo comunicativo.

**Responsável:** Creative Director (design 101: beleza sem função é arte, não design).

---

#### **SUBJECT_ROLE_MISMATCH**
**Descrição:** Sujeito é usado de forma que contradiz o brief ou não faz sentido.

**Sintoma:** Brief: "Sujeito é protagonista em perigo". Conceito: "Sujeito é figurante, quase invisível".

**Causa:** Falta de decisão clara sobre papel do sujeito em UNDERSTAND.

**Detecção:** Papel do sujeito especificado no brief vs. papel no conceito não batem.

**Correção:** Redefinir conceito OU renegociar papel de sujeito com usuário.

**Responsável:** Creative Director (deve ter explicitado isto em UNDERSTAND).

---

#### **PROMPT_ENGINEERING_LEAKAGE**
**Descrição:** Creative Direction Spec já contém linguagem de prompt engineering.

**Sintoma:** Spec diz "prompt should include 'cinematic lighting'" ou "add dramatic lighting keywords".

**Causa:** Boundary violation. Creative Director invadindo Generator Prompt Engineer.

**Detecção:** Spec contém palavras como "prompt", "keyword", "syntax", "AI model".

**Correção:** Remover linguagem de prompt. Reescrever em termos visuais puros.

**Responsável:** Creative Director (boundary violation).

---

### 9.2 Matriz de Detecção

Sistema deve monitorar:

- Quantidade de conceitos gerados antes de convergência
- Score de confiança final
- Quantidade de revisões após Image Critic
- Overlap entre conceito final e VKB/referências
- Presença de mecanismos visuais explícitos vs. apenas descrição estética
- Alignment entre briefing original e conceito final
- Presença de decisões técnicas em spec

---

## 10. CONTRATOS SEMÂNTICOS

### 10.1 Creative Director Input

```json
{
  "type": "CreativeDirectorInput",
  "brief": {
    "original_text": "string (text do usuário)",
    "structured_intent": ["array de intenções interpretadas"],
    "emotional_target": "string (qual emoção alvo?)",
    "commercial_objective": "string (o quê busca alcançar?)"
  },
  "assets": {
    "subject": {
      "type": "image | description",
      "data": "url ou texto descritivo",
      "constraints": ["array de constraints sobre sujeito"]
    },
    "reference": {
      "present": "boolean",
      "image_urls": ["array if present"],
      "user_instruction": "string (quanto de fidelidade esperada?)"
    },
    "mood_board": ["array de urls ou descrições"]
  },
  "context": {
    "project_history": ["array de versões anteriores"],
    "feedback_from_user": "string",
    "brand_identity": {
      "color_palette": ["array of hex"],
      "visual_language": "string",
      "tone": "string"
    }
  }
}
```

### 10.2 Ideation Output

```json
{
  "type": "IdeationOutput",
  "concepts": [
    {
      "id": "concept_001",
      "name": "string (nome descritivo)",
      "description": "string (2-3 frases de princípio visual)",
      "mechanism": [
        {
          "dimension": "Espaço | Movimento | Luz | etc",
          "principle": "string"
        }
      ],
      "scoring": {
        "relevance_to_brief": 0-10,
        "originality": 0-10,
        "executability": 0-10,
        "visual_impact": 0-10,
        "brand_coherence": 0-10,
        "final_score": 0-10
      },
      "critiques": ["array de críticas"],
      "elimination_rationale": "string or null (if kept)"
    }
  ],
  "selected_concept_id": "concept_XXX",
  "rationale_for_selection": "string"
}
```

### 10.3 VKB Retrieval Request

```json
{
  "type": "VKBRetrievalRequest",
  "query": {
    "mechanisms": ["array de mecanismos visuais procurados"],
    "emotional_effects": ["array de efeitos emocionais"],
    "subject_compatibility": ["array de tipos de sujeito"],
    "complexity_range": [min, max]
  },
  "exclude_vkb_ids": ["array de IDs já explorados"]
}
```

### 10.4 VKB Mechanism Result

```json
{
  "type": "VKBMechanismResult",
  "mechanisms": [
    {
      "vkb_id": "VKB-XXXX",
      "mechanism_name": "string",
      "principle": "string",
      "source_project": "string",
      "emotional_effect": "string",
      "adaptability_score": 0-10,
      "suggested_adaptation": "string (como adaptar?)"
    }
  ]
}
```

### 10.5 Reference Translator Interface

```json
{
  "type": "ReferenceTranslatorRequest",
  "creative_direction_spec_id": "string",
  "reference_image_url": "string",
  "creative_direction_spec": {},
  "question": "string (What transfer principles should preserve?)"
}
```

Resposta:

```json
{
  "type": "ReferenceTransferPlan",
  "preservation_elements": [
    {
      "element": "Lighting style",
      "preserve_mechanism": "Soft golden hour aesthetic"
    }
  ],
  "transformation_elements": [
    {
      "element": "Composition",
      "strategy": "Shift from symmetry to asymmetry while maintaining color harmony"
    }
  ],
  "conflict_flags": ["array de potenciais conflitos"],
  "creative_director_validation_needed": true | false
}
```

### 10.6 Creative Direction Spec

[Estrutura já detalhada em 7.3]

### 10.7 Revision Request (from Image Critic)

```json
{
  "type": "RevisionRequest",
  "image_id": "string",
  "creative_spec_id": "string",
  "feedback": {
    "severity": "Critical | Major | Minor",
    "issue": "string",
    "evidence": "string (what in the image indicates this?)",
    "suggested_fix": "string",
    "original_intent_compromised": true | false
  },
  "revision_count": "number (how many have there been?)"
}
```

---

## 11. FRAMEWORK DE TESTES

### 11.1 Benchmark Design

Teste A: Single-Shot Prompting vs. Teste B: Creative Director + Ideation

**Métricas:**
1. **Relevância ao Brief** (0-10, avaliado por human experts)
2. **Originalidade** (0-10, avaliado por portfolio comparison)
3. **Executabilidade** (0-10, pode ser gerado em < X tokens?)
4. **Impacto Visual** (5-second glance test com 20 observadores)
5. **Brand Alignment** (0-10, avaliado por brand team)

**Resultado Esperado:**
Creative Director deveria ter scores mais altos em Relevância, Originalidade, Impacto (trade-off: pode ser mais tokens de execution).

### 11.2 Briefs de Teste

#### **Fácil:** Urgência de E-commerce
Clear intent, common problem, straightforward to solve.

#### **Médio:** Premium Financial Product
Abstract intent ("sofisticação"), ambíguo o suficiente para oferecer espaço criativo.

#### **Difícil:** Minimalista ("Inovação")
Uma palavra, múltiplas interpretações, alto risco de genericidade.

#### **Conflituoso:** "Tradição + Futuro"
Contradição embutida. Testa capacidade de reconciliação criativa.

#### **Sem Referência:** Apenas Brief
Força ideação pura sem ancoragem visual.

#### **Com Referência Incompatível:** Brief diz "inovador". Referência é "clássico conservador".
Testa capacidade de questionar referência.

### 11.3 Sinais de Sucesso

✅ Creative Director passa por todas as 8 fases (OBSERVE → FREEZE)
✅ Produz mínimo 8 conceitos genuinamente diferentes
✅ Cada conceito articula mecanismo visual, não apenas estética
✅ Conceito final score > 7.5 em relevância
✅ Creative Direction Spec contém rationale clara
✅ Nenhuma decisão técnica prematura em spec
✅ Revisão após Image Critic < 3x

### 11.4 Sinais de Falha

❌ Convergência prematura (< 5 conceitos)
❌ Conceitos são variações da mesma ideia base
❌ Spec contém descrição estética mas não mecanismo
❌ Spec contém valores técnicos específicos
❌ Conceito não articula resposta clara ao brief
❌ Score final relevância < 6.5

---

## 12. CRÍTICA E RECOMENDAÇÕES ARQUITETURAIS

### 12.1 Fraquezas Conhecidas

**Boundary Ambiguity: Creative Director vs. Technical Design Room**

Atualmente, a linha é clara em teoria (creative vs. technical), mas borrada em prática.

Exemplo: "Sujeito deve ter expressão de urgência" é criativo ou técnico?

**Recomendação:** Definir lista explícita de decisões que pertencem a cada camada. Implementar validation sistema que bloqueia overlap.

---

**VKB Retrieval Overcopy Risk**

Sem disciplina forte, VKB facilmente vira "template library" em vez de "mechanism library".

**Recomendação:** Implementar scored diversity check. Se conceito tem > 70% material de VKB, sinalizar como "high VKB dependency" e questionar.

---

**Ideation Exploration Ceiling**

DIVERGE é limitada por capacidade do Creative Director de gerar conceitos genuinamente diferentes.

Há risco de que Creative Director chegue a 8 conceitos, mas 5 deles são variações superficiais.

**Recomendação:** Implementar automated diversity checker que pergunta: "Estes dois conceitos são diferentes em pelo menos 2 dimensões principais?"

---

**Image Critic Loop Vagueness**

Quando Image Critic retorna feedback, não fica claro se Creative Direction Spec deveria ser revisada ou se problema é apenas executivo.

Exemplo: Image Critic diz "não comunica urgência". É porque spec está errada? Ou porque generator falhou?

**Recomendação:** Image Critic deveria retornar dois tipos de feedback separados:
1. "Creative intent não foi alcançado" (culpa Creative Director)
2. "Creative intent era bom, execution falhou" (culpa Generator/Technical)

---

**No-Reference Mode Genericidity Risk**

Em no-reference mode, há risco alto de cair em estética genérica.

**Recomendação:** Implementar mandatory "Genericicity Check" ao final de CONVERGE. Sistema pergunta: "Posso descrever este conceito em uma frase que é única a este brief?" Se não, descarta.

---

### 12.2 Ambigüidades Arquiteturais

**Q: Quando Creative Director questiona Reference Translator?**

**KNOWN:** Quando translator quer transferência que contradiz creative direction.

**AMBIGUITY:** E se transfer é consistente com creative direction, mas é feita de forma medíocre? Quem julga "qualidade" de transfer?

**RECOMENDATION:** Definir "quality of transfer" como responsabilidade compartilhada. Creative Director foca em "conceitual alignment". Reference Translator foca em "visual fidelity of transfer technique".

---

**Q: VKB Retrieval: Quem decide quais mecanismos buscar?**

**KNOWN:** Creative Director.

**AMBIGUITY:** E se Creative Director busca mecanismo específico, VKB não tem nada similar? Força redesign? Busca coisa diferente?

**RECOMMENDATION:** Implementar "partial match" logic. Se mecanismo exato não existe, retornar "closest adjacent mechanisms" com explicação de como adaptar.

---

**Q: Creative Direction Spec Revision: Quantas vezes é aceitável revisar?**

**KNOWN:** "Até 3x" foi sugerido. 

**AMBIGUITY:** Mas contar o quê? Revisões após Image Critic? Ou revisões durante FREEZE também?

**RECOMMENDATION:** Diferenciar:
- Revisões durante FREEZE (antes de geração): Ilimitadas, é parte do processo
- Revisões após Image Critic: Máximo 3x. Depois disso, ou spec é boa o suficiente ou projeto precisa de recomeço criativo.

---

### 12.3 Recomendações de Evolução

**1. Implementar Automated Diversity Scoring**

Sistema que avalia cada novo conceito gerado e pergunta: "Isto é genuinamente diferente dos N-1 anteriores?"

Score baseado em:
- Dimensões visuais diferentes
- Mecanismos diferentes
- Narrativas diferentes

Se novo conceito score baixo em diversidade, system sinaliza antes de incluir.

---

**2. Criar "Conceptual Rigor Checklist"**

Pre-FREEZE, sistema verifica:

- [ ] Cada conceito tem mecanismo visual explícito?
- [ ] Cada conceito resolve intenção de briefing?
- [ ] Conceito final score > 7.5?
- [ ] Nenhuma decisão técnica em spec?
- [ ] Rationale documentada para todas as escolhas?

Se qualquer item falha, FREEZE é bloqueado.

---

**3. Implementar Creative Director "Stress Test"**

Após FREEZE, section separada do spec pergunta Creative Director:

- "Qual é a maior fraqueza deste conceito?"
- "Como meus concorrentes resolveriam isto de forma melhor?"
- "Qual é o scenario onde isto falha?"

Isto força pensamento crítico e reduz overconfidence.

---

**4. Criar "Failure Annotation" System**

Quando projeto termina, anotar qual failure mode (se houver) foi encontrado:

"Este projeto sofreu de GENERIC_CINEMATIC. Razão: Creative Director skipped UNDERSTAND."

Aprender com falhas.

---

**5. Implementar "Reference Quality Gate"**

Quando referência é fornecida, sistema pergunta:

- "Esta referência realmente exemplifica o que o usuário quer? Ou é apenas "imagem bonita"?"

Se referência é de baixa qualidade, alertar Creative Director: "Esta referência pode ser misleading".

---

## CONCLUSÃO

O Creative Director + Ideation System é uma tentativa de reproduzir pensamento visual de um designer sênior, não apenas linguistic optimization de um engenheiro de prompt.

Seu sucesso depende de:

1. **Disciplina de Exploração:** Genuinely divergent ideation, não variações superficiais
2. **Boundary Clarity:** Responsabilidades bem-definidas vs. Technical Design Room, Reference Translator, Image Critic
3. **Conceptual Rigor:** Mecanismos visuais explícitos, não apenas estética vaga
4. **Iterative Refinement:** Willingness to question próprias ideias (CHALLENGE fase)
5. **Documented Rationale:** Cada decisão explicada, não apenas conclusion

Este documento fornece framework operacional. Implementação real requererá calibration contínua, testes empíricos, e evolução baseada em failures observadas.

O sistema não é "better by default". É "better quando executado com rigor e disciplina".

---

**Documento Preparado Por:** [System Analysis]  
**Data:** 2024  
**Status:** Operacional, sujeito a revisão baseada em evidence  
**Próxima Review:** Após 20 projetos completos com este sistema

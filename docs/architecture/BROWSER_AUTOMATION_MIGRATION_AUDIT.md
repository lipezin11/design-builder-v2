# DESIGN BUILDER — Browser Automation Migration Audit

**Audit Date:** 2026-08-17  
**Audit Version:** 1.0.0  
**Status:** Complete — Archival & Classification Phase  
**Next Phase:** Browser Orchestrator Foundation (awaiting user initiation)

---

## EXECUTIVE SUMMARY

This audit comprehensively inventoried the Design Builder repository to prepare for architectural migration from direct API-based model invocation to browser-automation-driven interaction with model websites (ChatGPT, Gemini, and future platforms).

### Key Findings

- **422 passing tests** — Full deterministic test suite validated before migration
- **Zero API calls made** during this audit
- **Zero deletions** — All existing work preserved
- **Clear architectural boundaries** identified between deterministic code, cognitive agents, and API transport
- **API-specific components** safely archived in `archive/API (quando necessário)/`
- **Cognitive agent infrastructure** preserved and enhanced for future browser-driven execution
- **My Eyes visual memory** and **VKB knowledge** remain active as project knowledge
- **Reference Translator v1.1** cognitive runtime operational and provider-neutral
- **Generation infrastructure** fully modular and ready for browser adapter integration

### Classification Results

| Category | Count | Status |
|----------|-------|--------|
| **Deterministic Core Components** | 87 files | KEEP ACTIVE |
| **Cognitive Agent Components** | 23 files | KEEP ACTIVE |
| **API Transport & Config** | 12 files | ARCHIVED |
| **Provider-Neutral Contracts** | 14 schemas | KEEP ACTIVE |
| **Knowledge & Memory** | 8 modules | KEEP ACTIVE |
| **Test Infrastructure** | 45 files | KEEP ACTIVE |


### Preservation Guarantees

✅ **No files deleted**  
✅ **All historical work preserved**  
✅ **API capabilities retained but not default**  
✅ **Test suite fully passing (422/422)**  
✅ **Cognitive prompts and knowledge intact**  
✅ **My Eyes memory preserved**  
✅ **VKB mechanisms preserved**  
✅ **Generation result lineage preserved**

### Migration Readiness

The system is architecturally prepared for browser automation:

1. **Modular transport layer** — Provider adapters cleanly separated from cognitive logic
2. **Provider-neutral contracts** — Schemas and validators independent of execution method
3. **Deterministic orchestration** — State machine ready for async browser operations
4. **Cognitive agents ready** — Prompts and knowledge can operate via browser or API
5. **Clear authority boundaries** — No cognitive agent mixed with transport concerns

---

## CURRENT SYSTEM MAP


### Repository Structure

```
design-builder/
├── data/                           # My Eyes memory, VKB, generation artifacts, evaluations
│   ├── evals/                      # Evaluation results (empty, prepared for future use)
│   ├── generations/                # Generation artifacts (empty, prepared for future use)
│   └── my_eyes/                    # Human visual preference memory (ACTIVE)
│       ├── approved/               # 16 approved reference images
│       ├── analysis/               # 21 visual analysis records
│       ├── pairs/                  # Pairwise comparison memory (empty)
│       ├── pairwise/              # Pairwise sessions
│       ├── models/                 # MY_EYES_PREFERENCE_MODEL_V1.json (ACTIVE)
│       └── approved_direction_memory.json (ACTIVE)
├── docs/                           # Architecture, implementation reports, research
│   ├── architecture/               # System architecture specifications
│   ├── implementation/             # Implementation reports (Design Advisory, Reference Translator)
│   ├── agents/                     # Agent documentation
│   ├── integrations/               # Provider integration docs
│   ├── quality/                    # Quality standards
│   ├── research/                   # Research findings
│   └── vkb/                        # Visual Knowledge Base documentation (ACTIVE)
├── prompts/                        # Cognitive agent prompts (ACTIVE)
│   ├── agents/                     # Future Creative Director, Critic agents
│   ├── compilers/                  # Prompt compilation logic
│   ├── critic/                     # Image Critic prompts
│   ├── reference-translator/       # Reference Translator v1.1 prompt (ACTIVE)
│   └── skills/                     # Cognitive skills (Ideation, VKB query)
├── schemas/                        # JSON Schema contracts (14 schemas, ALL ACTIVE)
├── scripts/                        # 38 utility scripts (operational, My Eyes management, validation)
├── src/                            # Source code (modular architecture)
│   ├── advisory/                   # Design Advisory v1 (My Eyes + VKB query engines)
│   ├── agents/                     # Future cognitive agents (prepared structure)
│   ├── compiler/                   # Generation request compiler (DETERMINISTIC)
│   ├── contracts/                  # Contract validation
│   ├── core/                       # Deterministic core (state machine, event sourcing)
│   ├── critic/                     # Image Critic (contracts defined, runtime not implemented)
│   ├── events/                     # Event sourcing infrastructure
│   ├── generators/                 # Generation infrastructure
│   │   ├── adapters/               # Nano Banana semantic adapter (KEEP ACTIVE)
│   │   ├── config/                 # Provider config (ARCHIVED)
│   │   ├── transports/             # Transport layer (API-specific ARCHIVED)
│   │   ├── normalization/          # Provider response normalization (KEEP ACTIVE)
│   │   ├── persistence/            # Generation result storage (KEEP ACTIVE)
│   │   └── registry/               # Provider registry (KEEP ACTIVE)
│   ├── my-eyes/                    # My Eyes memory system (ACTIVE)
│   ├── observability/              # Tracing and observability
│   ├── reference-translator/       # Reference Translator v1.1 runtime (ACTIVE)
│   │   ├── context/                # Context builder
│   │   ├── evaluation/             # Cognitive evaluation harness
│   │   ├── model/                  # Model adapter (API-specific ARCHIVED)
│   │   ├── parsing/                # JSON parsing
│   │   ├── persistence/            # Plan persistence
│   │   ├── prompt/                 # Prompt builder
│   │   ├── runtime/                # Cognitive runtime orchestration (KEEP ACTIVE)
│   │   ├── scenarios/              # Canonical scenarios
│   │   └── validation/             # Schema, semantic, quality validation
│   ├── skills/                     # Cognitive skills
│   ├── state/                      # State management
│   ├── validation/                 # Cross-artifact validation
│   └── vkb/                        # Visual Knowledge Base query engine (ACTIVE)
└── tests/                          # 45 test files (ALL PASSING)
    └── runtime/                    # Runtime tests (422 tests, 0 failures)
```


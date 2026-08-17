import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const knowledgeRoot = path.join(repositoryRoot, "prompts", "reference-translator", "knowledge");
const generatedNotice = "Generated deterministically from scripts/generate_reference_translator_knowledge_v1_1.mjs. Synthetic design knowledge; not human preference evidence.";

const parse = (value) => value.split("|").map((item) => item.trim());

function renderMechanism(entry, module, index) {
  const [name, source, functionText, target, risk] = parse(entry);
  const dependency = module.dependencies[index % module.dependencies.length];
  const interaction = module.interactions[index % module.interactions.length];
  return [
    `### Mechanism: ${name}`,
    `Source observation: ${source}`,
    `Function: ${functionText}`,
    `Dependencies for ${name}: ${dependency}`,
    `Interactions for ${name}: ${interaction}`,
    `Transferable mechanism: Preserve ${functionText.toLocaleLowerCase()} while allowing the manifestation to change.`,
    `Target-native expressions: ${target}`,
    `When not to transfer: ${risk}`,
    `Common bad translation: Reproduce "${source}" as a surface recipe without proving its target function.`,
    `Better translation: ${target}; retain the relationship, not the source's exact coordinates, inventory, or styling signature.`
  ].join("\n");
}

function renderMechanismModule(module) {
  return [
    `# ${module.title}`,
    `> ${generatedNotice}`,
    ...module.intro,
    "## Operational mechanism library",
    ...module.mechanisms.map((entry, index) => renderMechanism(entry, module, index))
  ].join("\n\n") + "\n";
}

const mechanismModules = [
  {
    id: "core_art_direction_doctrine",
    file: "01_core_art_direction_doctrine.md",
    title: "Core Art-Direction Doctrine",
    intro: [
      "This module expands the single authority doctrine without changing it: the Translator interprets references and prepares structured material for the future Director.",
      "Use observations as evidence, mechanisms as explanatory units, and target-native alternatives as handoff material. Never treat a synthetic example as a remembered user preference.",
      "A mature translation can change every visible object while preserving the reference's organizing intelligence. It can also preserve a literal manifestation when the brief, category, identity, and originality boundary make that choice genuinely necessary.",
      "Maintain an importance map: primary mechanisms define reference DNA; secondary mechanisms amplify it; supporting mechanisms make it credible; incidental details can disappear without changing the thesis.",
      "Reserve cross_category_adaptation for declared product-to-product support-element translation. A change of profession, medium, campaign, or visual context uses ordinary adaptation fields.",
      "Transfer color relationships before source hue, and require verified target evidence before naming domain-specific artifacts. When evidence is absent, state the dependency instead of filling the gap with stock motifs."
    ],
    dependencies: [
      "The claimed function must be supported by a verified observation and compatible target need.",
      "The brief, protected semantics, identity constraints, and reference scope must agree on what may change.",
      "Confidence must reflect evidence quality; uncertainty cannot be repaired by decorative specificity.",
      "The mechanism must remain meaningful when source brand, text, person, and proprietary styling are removed."
    ],
    interactions: [
      "Importance, relevance, and confidence jointly determine transfer strength; none substitutes for the others.",
      "A useful mechanism may still be discarded when its emotional effect conflicts with the target brief.",
      "Multiple weak traits do not become a strong thesis merely through accumulation.",
      "Target-native alternatives remain proposals until the future Director selects a composition."
    ],
    mechanisms: [
      "importance mapping|Several observed decisions contribute unequally to the image|separate primary reference DNA from supporting and incidental detail|rank mechanisms by removal impact and target relevance|treating every visible feature as equally transferable",
      "signature removal test|Removing one relationship would collapse the reference's identity|identify the smallest set of decisions that makes the art direction recognizable|preserve that relationship through a different target manifestation|confusing a branded motif with a general signature mechanism",
      "incidental removal test|A secondary object disappears without changing hierarchy or narrative|detect decoration with low transfer value|discard it or replace it only when the target needs its spatial job|keeping filler because it is visually attractive",
      "domain swap test|One treatment could be pasted unchanged into unrelated industries|detect generic assembly and weak specificity|replace interchangeable scenery with evidence, artifacts, or materials native to the target|rejecting a broadly useful mechanism merely because one manifestation is generic",
      "material swap test|A source material feels natural only inside its original product category|separate tactile and optical function from category association|choose a target material with comparable softness, reflectivity, temperature, or texture frequency|assuming every luxurious material communicates the same kind of luxury",
      "protected-semantic firewall|Reference identity competes with supplied product, person, or copy|keep target truth higher than reference attraction|preserve supplied identity and translate only compatible art-direction mechanisms|using protection as an excuse to ignore all useful reference structure",
      "target-native superiority test|A literal copy is less coherent than a changed manifestation|prefer the expression that viewers perceive as belonging to the target world|state several functionally equivalent target options with category rationale|calling an arbitrary replacement an improvement without reference DNA",
      "evidence-confidence calibration|Some regions or material cues are ambiguous|match specificity and transfer strength to observation confidence|record alternatives or lower relevance instead of inventing facts|writing confident material or identity claims from filenames or notes",
      "multi-mechanism system|Impact comes from coordinated mass, light, depth, color, and material|explain why decisions reinforce one visual thesis|transfer the smallest coordinated system that survives target constraints|isolating one fashionable effect and losing the reference's relational logic",
      "action calibration|A decision may merit PRESERVE, TRANSFER, ADAPT, REINVENT, DISCARD, or CONFLICT|choose an action according to manifestation safety and functional fit|use the least literal action that still preserves useful specificity|defaulting every decision to ADAPT without distinguishing real transferability"
    ]
  },
  {
    id: "composition_and_spatial_logic",
    file: "02_composition_and_spatial_logic.md",
    title: "Composition and Spatial Logic",
    intro: [
      "Composition is a relational system, not a list of x/y coordinates. Describe mass against emptiness, subject against copy, dense against sparse, sharp against soft, warm against cool, and foreground against depth.",
      "Format translation preserves hierarchy, direction, density gradient, territorial logic, and tension while recomposing crop and coordinates. A portrait-to-landscape adaptation is successful when the relationship survives even though every region moves.",
      "Camera, crop, subject scale, gaze, and negative space alter psychological distance. Treat them as functions that interact with message and format."
    ],
    dependencies: [
      "The focal hierarchy must remain legible at the target aspect ratio and viewing distance.",
      "Copy territory, product safety, and face safety must be resolved before preserving edge tension.",
      "The surrounding density must make the dominant mass feel intentional rather than merely large.",
      "Camera perspective and crop must agree with the target subject's role and protected identity.",
      "Directional cues need a destination; flow without hierarchy becomes circulation without arrival.",
      "Negative space must have a named job such as scale, isolation, contrast, atmosphere, or communication."
    ],
    interactions: [
      "Scale changes the amount of negative space and therefore the viable typography mass.",
      "Crop changes gesture, gaze, object evidence, and the viewer's psychological distance simultaneously.",
      "Edge weight must be countered by light, type, color, or a subordinate mass elsewhere.",
      "Depth cues alter apparent spacing, so two-dimensional coordinates alone are insufficient.",
      "Density should collapse toward a focal thesis rather than distribute attention evenly.",
      "Format adaptation may change the route of visual flow while preserving its ordered stops."
    ],
    mechanisms: [
      "centered dominance|A hero occupies the primary axis with quieter support around it|create ceremonial stability, clarity, or monumentality|use axial dominance with target-native supports and communication zones|the target needs tension, dialogue, or directional movement rather than stability",
      "asymmetric dominance|The main subject is offset and balanced by copy, light, or a secondary mass|create energy while retaining one clear hierarchy|counterweight the target hero through message mass, environment, or tonal force|offsetting the subject without a meaningful counterweight",
      "subject-copy territorial separation|Image density and communication space occupy distinct territories|protect legibility without shrinking the hero|reserve a target-format-safe communication field opposite or around the focal mass|empty space is atmospheric or isolating rather than intended for text",
      "radial composition|Lines, objects, or light converge around a focal center|concentrate attention and imply emission, ritual, or force|use target-native radial cues such as product reflections, gestures, routes, or structural lines|every decorative object becomes an equal spoke and creates a logo-like cliché",
      "triangular composition|Three masses form a stable or ascending visual structure|organize multiple elements with a clear apex and base|rebuild the triangle using target subjects, product family, or information tiers|copying the source's exact three objects when their meanings do not belong",
      "diagonal flow|Subject, gesture, typography, or light crosses the frame on an angle|create momentum and connect separated zones|carry the diagonal through target-native gesture, perspective, fabric, documents, or light|the target asks for calm authority and the diagonal produces unnecessary urgency",
      "stacked composition|Distinct vertical layers or bands accumulate from base to headline|organize sequential reading and compress density|translate the ordering into target content tiers while changing band sizes and objects|stacking every element until the hero loses breathing room",
      "split composition|Two territories hold complementary or contrasting subjects|stage comparison, duality, before-after, or image-copy dialogue|preserve the relationship with target-relevant halves or an unequal split|using a 50/50 divider when the reference relies on dynamic unequal tension",
      "edge-weighted composition|A major mass presses near a frame boundary|create tension, immediacy, or room for an opposing message field|retain edge pressure through target-safe crop and counterbalance|cutting protected faces, labels, or functional product geometry",
      "framing composition|Foreground or environmental forms surround a subject opening|guide attention, establish context, and create depth|use architecture, fabric, device edges, documents, or organic matter native to the target|adding generic leaves or blobs that provide no semantic context",
      "object-cluster composition|Several related artifacts overlap as one subordinate mass|create narrative density and depth without many focal points|cluster target-specific evidence by shared material, light, and hierarchy|copying the source object inventory or distributing every object independently",
      "panoramic composition|A wide field uses lateral sequence and environmental scale|create journey, breadth, or staged discovery|extend target narrative across width with controlled focal anchors|stretching a portrait layout and filling the sides with decorative residue",
      "editorial spread logic|Image, type, margin, and crop behave across an implied page system|create rhythm, culture, and deliberate asymmetry|translate spread relationships into target format while preserving message clarity|copying magazine coordinates or sacrificing advertising comprehension",
      "product pedestal logic|A support plane isolates and elevates the product|create ritual, hierarchy, scale, and contact credibility|choose a target-native slab, surface, fold, liquid, or structural support|using the same marble block for every product category",
      "environmental hero logic|The subject is understood through a meaningful surrounding world|communicate scale, narrative, and category evidence|build a target environment whose materials and artifacts explain the subject|using interchangeable cinematic scenery that could host any niche",
      "negative-space hero logic|A small or isolated hero is intensified by a large quiet field|create restraint, vulnerability, confidence, or environmental scale|preserve the ratio of emphasis to emptiness while adapting copy and crop|assuming empty space alone creates luxury",
      "narrative tableau|Multiple figures or objects enact one readable moment|communicate cause, relationship, or ritual in a single frame|recast roles and actions with target-specific participants and props|collecting attractive objects without a shared event",
      "product-family composition|Several related products form a hierarchy rather than a row|show range while maintaining a flagship hero|vary height, overlap, orientation, and light according to target product roles|giving every package equal emphasis and producing catalog flatness",
      "modular information composition|Content blocks follow a coherent grid and priority system|make complex information scan as one organized proposition|translate modules into target-specific documents, panels, labels, or interface regions|adding generic glass cards and meaningless micro-metrics",
      "visual cascade|Scale, contrast, and position create a descending sequence of attention|guide the eye through several purposeful stops|rebuild the cascade with target hero, evidence, message, and supporting detail|copying coordinates without preserving the priority gradient",
      "foreground-entry composition|A near-plane form enters from an edge and partially occludes the scene|create immersion, scale, and directional entry|use a semantically relevant target object or environmental structure|using a random blurred foreground whose only function is fashionable depth",
      "perspective tunnel|Architecture, light, or repeated forms converge toward a subject|create depth, inevitability, and focal pull|translate convergence through target systems, shelves, corridors, routes, or data structure|defaulting to a neon tunnel unrelated to the target domain",
      "architectural framing|Built geometry establishes strong vertical or horizontal boundaries|create authority, order, and environmental specificity|use target-relevant rooms, structural planes, or graphic architecture|copying a distinctive building or treating concrete as universal seriousness",
      "circular containment|A ring, arc, or curved mass contains the hero|create unity, protection, orbit, or ritual focus|express containment through target materials, light arcs, gestures, or interface geometry|using a halo when no light, semantic, or compositional source motivates it",
      "vignette containment|Light, tone, texture, or objects reduce peripheral competition|hold attention inside an intimate focal island|use motivated falloff or environmental enclosure appropriate to the target|applying a generic dark vignette that crushes useful context",
      "visual anchoring|A contact point, shadow, base mass, or alignment prevents drift|make the subject feel physically and compositionally settled|anchor with target-native contact, reflection, baseline, or subordinate mass|floating a product or person without narrative or physical reason",
      "dominant-subordinate mass system|One large mass is supported by clearly quieter forms|maintain immediate hierarchy inside rich compositions|preserve relative visual force rather than exact size ratios|enlarging every supporting element until hierarchy becomes democratic",
      "intentionally unstable balance|Unequal masses and open edges create controlled unease|express urgency, experimentation, or editorial tension|use target-safe imbalance with a deliberate visual counterforce|mistaking accidental misalignment for sophisticated asymmetry",
      "edge-proximity tension|A face, product, or type block approaches the trim or viewport edge|increase immediacy and scale|adapt proximity around protected features and responsive crops|cutting identity-critical features or leaving no format tolerance",
      "isolated hero|One subject appears without competing artifacts|create clarity, icon status, or contemplative focus|make light, material, scale, and negative space carry target meaning|assuming a cutout on a gradient is automatically premium",
      "dense focal island|Many details concentrate locally while the rest stays calm|combine richness with a readable hierarchy|cluster only semantically related target detail near the focal structure|spreading microdetail evenly across the frame",
      "open atmospheric field|Soft environmental information occupies a broad low-contrast region|create scale, anticipation, calm, or weather|translate the atmosphere through target place, light, or material behavior|using undifferentiated haze that washes out contrast",
      "monumental subject scale|The subject exceeds ordinary contextual scale or crop|create authority, iconography, and confrontation|use scale, low viewpoint, and sparse counter-elements suited to the target role|making an approachable mentor feel remote or authoritarian",
      "intimate close scale|A face, hand, texture, or product detail dominates at short distance|create sensory access, trust, or material evidence|focus on target-relevant detail with identity-safe sharpness and crop|using extreme proximity when the target needs environmental credibility",
      "contextual subject scale|The subject shares attention with meaningful surroundings|explain role, place, process, or use|allocate enough environmental evidence to make the target domain legible|shrinking the hero merely to make space for generic scenery",
      "low-angle authority|Camera looks upward and verticals reinforce ascent|create monumentality, performance, or institutional power|use controlled low angle when the target role warrants dominance|turning care, teaching, or clinical empathy into intimidation",
      "high-angle overview|Camera looks down to reveal organization or vulnerability|make process, arrangement, or scale relationships legible|use overhead or elevated views for target systems, products, or rituals|using high angle on a person when it unintentionally weakens authority",
      "deliberate crop|The frame cuts body, object, or type at a meaningful boundary|increase scale, rhythm, tension, or intimacy|crop according to target identity, gesture, product safety, and format|tracing a fashionable source crop that removes required evidence",
      "gaze-directed flow|A person's gaze points toward object, message, or open space|connect narrative roles without graphic arrows|redirect target gaze toward relevant product, evidence, or future space|copying eye direction when target copy and object positions have changed",
      "contrast stepping|Successive changes in light, saturation, detail, or scale lead inward|create a graded path rather than one abrupt focal jump|rebuild steps using target colors, materials, and information tiers|making every step equally intense and destroying the path",
      "portrait-to-landscape recomposition|A vertical source stacks hero and message while target width expands|preserve hierarchy and density gradient without stretching coordinates|place hero and communication territories laterally with a new flow route|centering everything and filling unused sides with arbitrary props",
      "landscape-to-portrait recomposition|A wide source separates subject and context while target height compresses width|retain territorial roles through vertical sequencing and selective crop|stack or overlap target zones while protecting hero, copy, and depth|squeezing two horizontal territories until neither remains legible"
    ]
  },
  {
    id: "depth_environment_and_integration",
    file: "03_depth_environment_and_integration.md",
    title: "Depth, Environment, and Subject Integration",
    intro: [
      "Structural depth is produced by relationships among planes, scale, occlusion, focus, atmosphere, light, and semantics. A fashionable blurred blob is not depth merely because it sits in front.",
      "Background specificity is tested by substitution: if the same tunnel, gradient room, or abstract architecture works unchanged for unrelated targets, the environment is probably generic.",
      "Subject integration requires agreement in light direction, contrast curve, sharpness, color contamination, shadow, grain, atmosphere, and physical contact."
    ],
    dependencies: [
      "Foreground, midground, and background need distinguishable spatial roles rather than arbitrary blur amounts.",
      "Occlusion must respect plausible geometry and protect identity-critical edges.",
      "Atmospheric falloff must agree with distance, light, and environmental conditions.",
      "Material reflections and contact shadows must share the scene's light and color world.",
      "Background semantics must support the target rather than merely decorate it.",
      "Depth-of-field behavior must be plausible for the chosen camera distance and focal hierarchy."
    ],
    interactions: [
      "Occlusion changes hierarchy while scale falloff changes perceived distance.",
      "Haze lowers contrast and saturation, so color vitality needs protected local anchors.",
      "Reflections can extend space but also duplicate focal points if uncontrolled.",
      "A foreground cue is strongest when it supplies both spatial and semantic information.",
      "Shared environmental color helps integrate edges without relying on artificial halos.",
      "Background detail must fall away enough for the subject to remain dominant."
    ],
    mechanisms: [
      "occlusion depth|One target-relevant form partially covers another at a plausible boundary|establish ordering and physical coexistence between planes|use product edges, documents, architecture, fabric, or environment that belong to the target|occlusion hides protected identity or appears as an unrelated foreground sticker",
      "scale falloff|Repeated forms become smaller with distance|communicate spatial recession and environmental scale|use target-native repetitions such as shelves, lights, seats, devices, or structures|size changes contradict perspective or turn into decorative pattern",
      "atmospheric perspective|Distant regions lose contrast, saturation, and detail|separate planes and imply environmental volume|use restrained haze, moisture, dust, or light scatter motivated by the target world|global haze washes out the hero and removes dark anchors",
      "focal blur|Near or distant planes soften relative to the focal subject|control attention and imply lens depth|blur semantically relevant target layers with plausible focus transitions|random blur is added without a coherent plane or camera model",
      "detail falloff|Microtexture decreases as distance increases|reinforce scale and protect hierarchy|reserve high-frequency detail for target focal surfaces and key evidence|uniform texture makes background and hero compete",
      "contrast falloff|Remote planes use a narrower luminance range|place the hero forward without hard cutout edges|shape target background contrast around actual depth and atmosphere|contrast is lowered everywhere and the piece becomes pale",
      "saturation falloff|Chroma decreases or shifts with distance|create atmospheric separation while keeping focal color alive|localize target color vitality near primary and secondary focal zones|desaturation becomes a universal premium filter",
      "light falloff|Illumination decays across space or away from a motivated source|model volume, distance, and hierarchy|let target practicals, windows, studio sources, or reflected light define falloff|a bright center vignette replaces actual environmental lighting",
      "perspective convergence|Parallel spatial lines converge toward a vanishing region|create directional depth and focal pull|use target architecture, work surfaces, routes, shelving, or interface planes|a generic sci-fi tunnel supplies depth without target meaning",
      "foreground intrusion|A near object enters the frame and is cropped by the edge|create immediacy, scale, and viewer position|select a target-relevant object that also frames or directs attention|blurred foliage or glass is inserted into every domain",
      "frame within frame|A doorway, screen, shadow opening, or structural gap contains the subject|layer space and create controlled revelation|use a target-native enclosure with credible perspective and light|copying a distinctive source aperture or enclosing the hero without purpose",
      "layered planes|Several readable depth bands overlap without becoming separate collages|organize complexity and narrative distance|assign each target plane a function, contrast range, and detail level|planes look like independent flat cutouts",
      "volumetric separation|Visible light or atmosphere occupies space between subject and background|make distance and light direction perceptible|use restrained target-motivated mist, dust, steam, or beam visibility|volumetric effects become automatic cinematic decoration",
      "shadow separation|Cast or contact shadows distinguish adjacent forms|prove contact, direction, and depth|derive target shadows from shared geometry and light source|shadows float, point inconsistently, or create false duplicates",
      "silhouette separation|A controlled tonal or color difference preserves the subject outline|maintain readability in complex or dark environments|use target palette, local light, or background value control around critical edges|a uniform neon stroke outlines the entire subject",
      "environmental overlap|Architecture, furniture, landscape, or artifacts cross subject boundaries plausibly|embed the subject in a real target world|let target environmental elements overlap noncritical regions and cast effects|overlap obscures identity or behaves like pasted stickers",
      "reflective depth|A surface reflects partial scene information beyond the visible plane|extend space and reveal material|use target-native glass, liquid, polished metal, or lacquer with controlled reflection hierarchy|mirror duplication creates extra heroes or impossible scenery",
      "translucent depth|Light and forms remain partially visible through a material|create layered ambiguity, softness, or technical precision|use glass, fabric, resin, gel, paper, or atmosphere appropriate to target semantics|translucency reduces legibility or becomes generic glassmorphism",
      "literal environment|The background depicts an actual place of use or origin|supply category evidence and narrative credibility|choose a specific target location with accurate artifacts and scale|the place becomes a stock cliché or introduces false claims",
      "symbolic environment|The background uses a metaphorical world rather than a literal place|express abstract transformation, identity, or emotion|ground the metaphor in target semantics and a coherent material system|symbolism becomes an interchangeable surreal landscape",
      "hybrid graphic-photo environment|Photographic depth and graphic planes share one spatial system|combine realism with information or brand language|align target graphics to perspective, occlusion, light, and hierarchy|graphics float independently with no environmental contact",
      "shared key light|Subject and environment receive the same primary direction and softness|make composited elements inhabit one scene|rebuild target light on every inserted element and reflective surface|the subject retains studio light unrelated to the environment",
      "environmental bounce|Nearby colored surfaces contaminate shadow and reflective regions|create material and color coherence|introduce subtle target-environment color into product, skin, or object shadows|uniform tinting destroys local material color",
      "contact integration|Weight, contact shadow, ambient occlusion, and reflection agree at touch points|prevent products and people from floating|model target contact according to surface softness, distance, and light|a generic drop shadow substitutes for physical contact",
      "edge-softness agreement|Edges share plausible focus, motion, atmosphere, and resolution|remove the pasted-subject signature|match target edge behavior locally while preserving important detail|global feathering creates a halo or damages identity",
      "grain and contrast agreement|Subject and environment share image texture and tonal response|make mixed sources feel optically coherent|match target capture texture, black point, and highlight rolloff without hiding detail|noise is added uniformly as a stylistic filter",
      "local haze integration|Atmosphere crosses boundaries between foreground, subject, and background|embed forms in volume while keeping a readable focal core|allow target-motivated atmosphere to partially veil noncritical edges|haze is painted behind the subject only and reveals the composite",
      "reflected material color|Nearby surfaces tint highlights and shadows according to reflectivity|connect material, lighting, and environment|let target materials exchange plausible warm, cool, or chromatic bounce|random colored rims appear without a nearby source"
    ]
  }
];

// Remaining module definitions are appended below to keep the data auditable.


const rows = (value) => value.trim().split("\n").map((line) => line.trim()).filter(Boolean);
const commonDependencies = [
  "The source manifestation, target meaning, and protected identity must agree.",
  "The mechanism needs a named perceptual or semantic function.",
  "The target format and viewing distance must support the proposed behavior.",
  "Light, material, depth, and hierarchy must remain mutually plausible.",
  "Exact source branding, copy, person, and proprietary details remain excluded."
];
const commonInteractions = [
  "Hierarchy determines whether the device leads or supports.",
  "Material and light jointly control credibility and emotional tone.",
  "Scale and crop alter both psychological distance and available information territory.",
  "Depth changes apparent spacing and the amount of safe overlap.",
  "Target semantics decide whether a familiar association is helpful or misleading."
];

mechanismModules.push(
  {
    id: "light_color_material_atmosphere",
    file: "04_light_color_material_atmosphere.md",
    title: "Light, Color, Material, and Atmosphere",
    intro: [
      "Light is physical explanation and hierarchy: identify emitter, reflection, direction, softness, distance, temperature, and material response.",
      "Color vitality comes from local chroma, value separation, temperature contrast, dark anchors, clean highlights, and believable surfaces, not saturation everywhere.",
      "Material associations are conditional. Test tactile and optical behavior against target category, emotion, and brand truth.",
      "Atmosphere is useful when it explains depth, weather, motion, or visible light; an automatic cinematic veil has no transfer value."
    ],
    dependencies: commonDependencies,
    interactions: commonInteractions,
    mechanisms: rows(`
directional key light|One source models a readable side of the subject|define volume, hierarchy, and environmental logic|use a target-motivated window, practical, sun, or studio source|unrelated highlights make source direction impossible to infer
soft fill and negative fill|Shadow information is deliberately retained or removed|control accessibility, drama, and sculptural form|set target fill ratio by role, material, and identity needs|flat fill or crushed shadows erase useful evidence
motivated rim light|A narrow edge receives light from a plausible rear source|separate silhouette and communicate environment|use target window, screen, sunset, or studio kicker|a uniform neon outline becomes an AI signature
volumetric light|A beam becomes visible through atmosphere|show direction, scale, depth, or revelation|use target-motivated mist, dust, steam, or haze|a beam is added only to claim cinematic style
localized glow|A small emitter affects nearby tones and reflections|create focus, technology, heat, ritual, or translucency|attach target glow to a credible emitter and falloff|a halo is painted behind every hero
luminance hierarchy|Value contrast concentrates around focal zones|make attention robust before color is perceived|assign target blacks, mids, and highlights by priority|high contrast is applied everywhere
saturation hierarchy|Chroma concentrates in selected regions|create vitality and brand emphasis without noise|use target-owned accents on product, evidence, or environment|uniform saturation makes every object compete
temperature contrast|Warm and cool regions define separation or emotion|make color relational and spatial|translate contrast through target light, skin, material, or environment|exact orange-teal grading is copied regardless of identity
environmental contamination|Scene color affects edges, shadows, and reflections|integrate elements inside one color world|apply target environmental hue by orientation and material|a global wash erases local color truth
leather and suede language|Warm low-gloss grain opposes rigid reflective forms|add tactile luxury, lifestyle association, and soft counter-mass|use target leather, tailoring, or warm matte support when story fits|clinical, vegan, youthful, or technical targets reject the association
glass and translucency|Refraction and partial visibility create layered space|communicate clarity, fragility, precision, or restraint|use target packaging, screen, vessel, resin, or optical plane|generic glassmorphism replaces actual material logic
metal language|Controlled reflections articulate engineered edges|communicate precision, durability, performance, or cool restraint|use target hardware, support, typography, or architecture|metal makes an organic or caring target feel cold
stone and ceramic language|Mineral mass supplies weight, craft, and controlled variation|ground a hero and contrast refined surfaces|choose target stone, plaster, concrete, porcelain, or tile|white marble becomes an interchangeable premium pedestal
wood and paper language|Warm fiber and grain oppose manufactured perfection|communicate craft, origin, warmth, or human process|use target timber, veneer, raw paper, document, or warm structure|material falsely implies sustainability or rusticity
water, gel, ice, and frost|Transparent matter responds to gravity, light, and temperature|communicate moisture, freshness, motion, or preservation|use target liquid, condensation, resin, frosted glass, or cool light|droplets and ice become automatic beauty cliches
botanical material|Plant matter provides organic texture and origin cues|communicate verified growth, ingredient, season, or environment|use target botanicals or abstract organic structure only when truthful|leaves signal naturality without evidence
material contrast pairing|Surfaces differ in hardness, gloss, frequency, or temperature|make each material legible and enrich support relationships|pair target materials such as glass-leather, ceramic-water, or paper-steel|too many surfaces create a showroom rather than one thesis
`)
  },
  {
    id: "typography_information_and_graphic_mass",
    file: "05_typography_information_and_graphic_mass.md",
    title: "Typography, Information Systems, and Graphic Mass",
    intro: [
      "Typography is spatial mass, rhythm, hierarchy, and image interaction. Transfer behavior rather than exact font or visible reference copy.",
      "Cards are valid when content is specific, grouped, integrated, and subordinate. Interchangeable panels with fake metrics are generic assembly.",
      "Editorial art direction may survive in advertising while offer clarity, brand hierarchy, communication territory, and call-to-action relationships adapt."
    ],
    dependencies: commonDependencies,
    interactions: commonInteractions,
    mechanisms: rows(`
headline as counter-mass|A large headline balances an offset hero|create hierarchy and stabilize asymmetry|use target copy whose scale and line breaks counterweight the hero|long target copy cannot sustain the compact source shape
giant word as environment|Overscale letters extend behind the subject|create graphic scale and depth|use target language with controlled occlusion and target-owned typography|source wording or distinctive type becomes copied identity
tight stacked display|Short lines pack vertically with small leading|create density, urgency, or poster force|stack target fragments with readable rhythm|the target needs calm authority or contains long prose
sparse display type|Few words occupy a broad quiet field|create restraint, confidence, or contemplation|use concise target copy and strong margin relationships|empty typography is mistaken for premium
display-body contrast|Headline and support copy differ strongly|establish reading order and semantic roles|build target hierarchy by importance and viewing distance|required information remains tiny while display drama dominates
line length and rhythm|Copy uses deliberate measure, tracking, and leading|shape reading pace and typographic texture|adapt target measure to language, format, and content complexity|source line breaks alter target meaning
image-type overlap|Subject or object partially occludes letters|create tension and shared depth|protect target legibility, faces, labels, and required words|random letters disappear or the subject looks pasted on
edge interaction|Type approaches or crosses the frame edge|create scale, urgency, or editorial confidence|recompose target type with format-safe intentional fragments|responsive crops reveal accidental cuts
typographic framing|Words or rules enclose the hero|organize space and connect information to image|use target message or structural lines as a meaningful frame|decoration surrounds the hero but communicates nothing
microtype texture|Small repeated text creates a secondary frequency field|add editorial detail or data credibility|use real target metadata at a legible output size|meaningless microtext creates an AI signature
type on physical plane|Copy follows perspective of paper, packaging, wall, or screen|integrate information into the scene|place target-owned copy on a plausible surface with correct light|flat text is pasted onto a photographed plane
narrative artifact panel|A document, label, chart, or card contains story-specific evidence|make abstract claims concrete|choose target-native artifacts with real hierarchy and content|generic metrics and icons substitute for proof
interface card system|Panels share a grid and product-specific information model|show a real digital system without fragmenting attention|use target UI only when interaction is target truth|glass cards appear in unrelated industries unchanged
document or chart evidence|Pages or graphics carry process, authority, or data|translate expertise into tangible proof|use verified target plans, research, legal pages, notes, or data|documents and numbers are invented as texture
card substitution|A source card function can live in another artifact|preserve grouping or evidence without interface styling|translate to packaging, document, label, screen, shelf, or signage|cards are banned even when target is an interface
editorial-to-ad clarity|Editorial art direction has weak offer structure|retain crop, rhythm, material, and tension while clarifying message|reserve target-safe headline, brand, product, support, and CTA relations|the image is flattened or ambiguity is preserved blindly
`)
  },
  {
    id: "objects_props_and_semantic_roles",
    file: "06_objects_props_and_semantic_roles.md",
    title: "Objects, Props, Semantic Roles, and Effects",
    intro: [
      "Object meaning is contextual: a clock may be product, deadline metaphor, scale cue, light source, or irrelevant decoration.",
      "Use removal, swap, and semantic substitution tests to separate narrative props from filler.",
      "Particles, smoke, flare, blur, grain, and glow are support mechanisms that need a source, spatial logic, and hierarchy function."
    ],
    dependencies: commonDependencies,
    interactions: commonInteractions,
    mechanisms: rows(`
clock as time pressure|A timepiece is emphasized near urgent action|communicate deadline, duration, precision, or consequence|use target scheduling, countdown, process stage, or temporal light cue|the target has no time claim and the clock becomes cliche
rope as tension or connection|A line-like material binds, pulls, or separates|visualize constraint, relation, effort, or support|translate into target cables, routes, seams, documents, or gesture|literal rope imports danger or rustic meaning
fire as transformation|Flame or heat distortion affects nearby material|communicate energy, danger, urgency, or change|use target heat, warm response, performance trace, or graphic transition|fire makes unsupported claims
map as navigation|Routes, regions, or waypoints organize a field|communicate strategy, journey, exploration, or systems thinking|translate into roadmap, architecture flow, curriculum path, or flight route|a world map appears where target is not geographic
door or window threshold|A framed opening separates present and possible space|communicate access, outlook, context, or transition|use target interface entry, architecture, page reveal, screen, or light opening|a glowing portal becomes stock inspiration imagery
bridge as connection|A structure spans separated regions|communicate integration, access, or progress|use target workflow, data link, collaboration, or structural span|literal bridges reduce services to a stock metaphor
mirror as identity|A reflection duplicates, fragments, or reveals another view|communicate self-perception, duality, or verification|use target reflection, before-after relation, preview, or alternate angle|reflection changes protected identity
handheld tool as expertise|A person operates a domain artifact|make competence, process, and scale visible|use a target tool, document, instrument, or device with accurate grip|occupational props become costume cliches
document as authority|Specific pages or annotations support a claim|make planning, evidence, or accountability tangible|use target plans, notes, legal documents, research, or briefs|fake paperwork fills the scene
container as ritual|A box, tray, vessel, or case organizes interaction|create anticipation, care, sequence, or premium handling|use target packaging, service kit, instrument case, or presentation system|a luxury box enters a category without ritual packaging
fabric as directional prop|A fold creates a soft mass and movement|soften rigid geometry, frame the hero, and add tactile emotion|translate into target clothing, paper, light, liquid, cable, or architecture|unrelated fabric is draped around every product
botanical prop as origin|Plant matter sits near product or person|communicate verified ingredient, growth, season, or environment|use target ingredient, ecology, or organic structure|random leaves signal naturality without evidence
particle field as atmosphere|Small matter follows depth, gravity, motion, and light|show scale, weather, energy, or visible beam|use target dust, spray, steam, snow, sparks, or data marks|uniform particles fill empty space
smoke as spatial volume|Translucent plumes overlap planes and reveal airflow|create depth, transformation, scent trail, or mood|use target mist, vapor, steam, dust, or graphic flow|automatic smoke makes every scene mysterious
motion blur as velocity|Edges streak consistently with subject or camera motion|communicate speed, urgency, or transition|apply target movement to body, vehicle, liquid, type, or environment|random blur damages product clarity
lens flare as source evidence|Optical artifacts align with a bright source|communicate glare, heat, scale, or captured immediacy|use only where target camera and emitter justify it|flare crosses faces without a source
grain as capture texture|Fine variation unifies photographic regions|create tactile character or compositing coherence|match target medium, scale, and output resolution|heavy grain hides poor integration
narrative prop network|Several artifacts explain one role, process, or event|create coherent density without one cliche|select a minimal target set whose interactions tell the story|unrelated symbols compete
secondary mass prop|One support balances the hero and controls material weight|stabilize composition while enriching context|choose a target-native support with appropriate scale, value, and texture|the support becomes a second hero
`)
  }
);



mechanismModules.push(
  {
    id: "product_styling_and_cross_category_translation",
    file: "07_product_styling_and_cross_category_translation.md",
    title: "Product Styling and Cross-Category Translation",
    intro: [
      "Product support elements provide category cue, material contrast, color anchor, scale, ritual, lifestyle, depth, motion, or secondary mass. Identify those jobs before selecting any equivalent.",
      "For every foreign-category support prop distinguish literal object, source-category relationship, visual function, material language, emotional effect, compositional role, target traits, target category codes, target-native equivalent, and discarded detail.",
      "The invariant is strict: a declared cross-category support element cannot direct TRANSFER. Use ADAPT, REINVENT, or DISCARD and set literal_transfer_allowed to false.",
      "The perfume and skincare handbag case is canonical: preserve warm tactile fashion luxury and secondary-mass logic through cognac leather, dark suede, burnished wood, amber-toned material, or another fragrance-native support, never the handbag by reflex."
    ],
    dependencies: [
      "The target product category and actual product story must be explicit.",
      "Support scale and surface behavior must preserve product readability and contact.",
      "Material association must match category, audience, brand, and claimed benefit.",
      "Ingredient, performance, naturality, or clinical cues require factual support.",
      "The source object's compositional role must remain distinct from its literal identity.",
      "Every proposed equivalent must explain why it belongs naturally to the target."
    ],
    interactions: [
      "Support material changes product reflections, contact shadows, and perceived temperature.",
      "A secondary mass affects balance, negative space, crop, and label visibility.",
      "Moisture, smoke, fabric, and motion cues alter both emotion and physical credibility.",
      "Category cues can support recognition but become cliches when detached from product truth.",
      "The target's packaging geometry determines whether soft, hard, transparent, or granular support is useful.",
      "Cross-category adaptation can preserve mood while completely changing the object inventory."
    ],
    mechanisms: rows(`
pedestal support|A product rests on an elevated slab or base|create hierarchy, ritual, scale, and contact credibility|choose target stone, metal, wood, ceramic, resin, or structural geometry|the same marble block is used for every category
fabric support|Soft folds surround or sit beneath packaging|add tactile richness, directional flow, and contrast with rigid geometry|use target fabric, tailoring, paper, liquid, or soft sculptural material|fabric imports fashion sensuality into an incompatible product
liquid support|A product touches or emerges from fluid|communicate moisture, freshness, ingredient, motion, or reflection|use target water, gel, oil, beverage, or abstract fluid only when truthful|splash effects appear with products that have no liquid relation
sand or soil support|Granular matter grounds packaging and shows texture scale|communicate origin, earth, dryness, travel, or raw material|use target mineral, powder, ingredient, or terrain cue|granular matter makes unsupported natural-origin claims
reflective plate|A polished plane mirrors part of the product|extend form, create precision, and add controlled depth|use target metal, glass, lacquer, liquid, or screen reflection|reflection creates duplicate heroes or hides label information
floating support|A product is suspended or held without visible contact|communicate weightlessness, innovation, purity, or impossible ritual|justify target suspension through motion, magnetic logic, graphic abstraction, or edit intent|floating becomes default AI staging
fragrance woody warmth|Amber glass, warm shadow, grain, or resin surrounds a bottle|express woody, amber, leathery, or intimate scent character|use warm wood, cognac leather, suede, resin, smoke, or mineral warmth selectively|literal wood implies notes or rusticity not present in the fragrance
fragrance aquatic freshness|Cool glass, mist, water, or pale mineral surfaces frame a bottle|express clarity, lift, coolness, or aquatic scent behavior|use controlled water, frosted glass, cool stone, mist, or metallic clarity|droplets and blue light turn every fresh scent into a cliche
fragrance floral softness|Organic curves, petals, fabric, or colored glass soften packaging|express bloom, delicacy, sensuality, or diffusion|use verified botanical, soft material, color bloom, or curved support|random flowers misstate ingredients or target audience
skincare moisture ritual|Clean vessels, water behavior, translucency, and soft contact surround packaging|express care, hydration, cleanliness, or sensorial routine|use target gel, frosted glass, ceramic, skin-safe texture, or water|bubbles, droplets, and white marble claim efficacy without evidence
skincare clinical precision|Controlled geometry, clean light, and measured artifacts structure the image|express testing, dosage, safety, or technical trust|use target lab-adjacent material, measurement, packaging detail, or precise layout|test tubes become a costume for unsupported science
food texture evidence|Crumb, steam, gloss, cut surface, or ingredient interaction remains readable|communicate freshness, temperature, taste, and material truth|show target food texture and packaging relation under appetizing light|decorative ingredients imply contents the product lacks
beverage temperature|Condensation, ice, vapor, liquid motion, and glass response show state|communicate coldness, refreshment, warmth, or effervescence|use target vessel, condensation, bubbles, steam, or pour behavior accurately|ice or splash is copied regardless of serving truth
technology precision|Engineered edges, controlled reflections, interface evidence, and geometry dominate|communicate performance, usability, and material engineering|use target device details, ports, screen behavior, composite, or structured light|a neon tunnel replaces specific product evidence
fashion body interaction|Material fold, fit, movement, and crop depend on the wearer|communicate styling, silhouette, identity, and tactile behavior|use target garment interaction, editorial pose, and fabric-specific light|clothing is treated as a floating product disconnected from the body
automotive surface flow|Long reflections describe engineered curvature and speed|communicate performance, aerodynamics, scale, and finish|use target vehicle surfaces, road light, motion, or environment|generic light streaks replace accurate body geometry
jewelry microcontrast|Small specular changes reveal precious material at intimate scale|communicate precision, value, craft, and restraint|use target macro light, dark field, clean support, and controlled reflection|sparkles and velvet overpower the actual piece
skincare ceramic to perfume|A matte ceramic support creates clean craft and quiet ritual|preserve soft mineral restraint and tactile calm|use target porcelain, matte stone, sculptural pedestal, or warm mineral surface|the source jar or skincare ritual is copied literally
ice beverage to skincare|Ice creates cold freshness, translucency, and moisture|preserve cool clarity only when product meaning supports freshness|use target translucent gel, frosted glass, condensation, or cool light|literal cubes imply freezing treatment or become visual cliche
carbon fiber automotive to tech|Dark woven composite signals performance and engineering|preserve precision, texture scale, and controlled highlight response|use target engineered polymer, brushed composite, or structured geometry|automotive body parts enter a device scene
velvet jewelry to finance|Velvet supplies dark soft texture and precise highlight contrast|preserve controlled darkness and luxury restraint|use target tailoring, matte architecture, dark paper, or soft environmental tone|an executive is placed on velvet
fruit food ad to beauty|Cut fruit and juice express vitality, freshness, and ingredient abundance|preserve sensorial color only when ingredient story is verified|use target ingredient, translucent color, moisture, or curved organic mass|random fruit makes false formulation claims
laboratory to software|Measured vessels and ordered process imply precision and experimentation|preserve systems thinking, calibration, and structured testing|use target workflows, versioned artifacts, interface states, or test evidence|test tubes decorate a software hero
architectural shadow to product|Large directional shadows organize scale and material|preserve light-as-composition and controlled geometry|cast target-motivated shadow across product and support surfaces|a distinctive facade or window pattern is traced
fashion fabric to personal brand|Flowing textile frames a person and creates editorial movement|preserve directional softness, luxury energy, and subject emphasis|use target clothing, paper, environmental structure, or graphic ribbon|unrelated drapery is added around a professional
handbag skincare to woody perfume|A warm handbag forms a soft fashion-luxury secondary mass beside skincare|preserve tactile warmth, tonal unity, and editorial sophistication|use cognac leather, dark suede, burnished wood, amber material, or a tactile fragrance support|the handbag is copied or renamed without changing category logic
`)
  },
  {
    id: "people_services_and_editorial_translation",
    file: "08_people_services_and_editorial_translation.md",
    title: "People, Services, Personal Brands, and Editorial Translation",
    intro: [
      "A human subject may act as authority, guide, expert, protagonist, witness, creator, performer, mentor, or technical specialist. Translate pose, gaze, crop, and context according to that role.",
      "Professional symbolism must be specific. Money rain, random airplanes, universal DNA helices, gavels, and generic laptops often reduce expertise to stock iconography.",
      "Product references can inform services through hierarchy, ritual, material precision, evidence, and staging, but a service needs people, process, documents, environment, outcomes, or interaction rather than a fake physical product.",
      "Editorial restraint, crop, type-image tension, texture, and asymmetry can transfer to advertising while message clarity and offer structure adapt."
    ],
    dependencies: [
      "The supplied person's identity, role, recognizability, and consent boundaries must remain protected.",
      "Pose and gaze need a narrative destination inside the target composition.",
      "Professional artifacts must be accurate enough to support credibility.",
      "Audience, emotional goal, and brand personality must fit the translated treatment.",
      "Service evidence must not invent outcomes, data, credentials, or testimonials.",
      "Editorial ambiguity must not erase advertising comprehension or conversion needs."
    ],
    interactions: [
      "Gaze, gesture, prop interaction, and copy placement form one directional system.",
      "Camera angle and crop change perceived authority, intimacy, and approachability.",
      "Environmental specificity can establish expertise without literal occupational symbols.",
      "Wardrobe material and light can carry premium or technical cues more naturally than props.",
      "Product-like isolation can make a person iconic but may remove necessary service context.",
      "Document and interface evidence can support expertise while remaining subordinate to the person."
    ],
    mechanisms: rows(`
direct camera gaze|The subject meets the viewer with stable eyes|create confrontation, trust, confidence, or invitation|use target role and expression to calibrate intensity|an approachable mentor becomes severe
off-camera gaze|The subject looks toward space, work, or an implied future|create contemplation, aspiration, or narrative openness|align target gaze with copy, environment, or meaningful action|gaze points out of frame without purpose
object-directed gaze|Attention falls on a tool, product, document, or other person|make interaction and expertise legible|use a target-relevant object or collaborator as destination|the object is decorative and gaze feels staged
arms-crossed authority|Closed arm geometry creates stability and self-possession|communicate confidence, reserve, or institutional control|translate into upright stance, grounded hands, workspace command, or calm gaze|the pose is copied when warmth or collaboration is required
open-hand guidance|Hands indicate, present, teach, or welcome|communicate explanation, generosity, and active support|use target teaching surface, document, object, or conversational gesture|hands float without a real narrative object
working interaction|The subject performs a credible domain action|show process, skill, and evidence rather than merely claiming expertise|use accurate target tools, interfaces, materials, or collaborators|action becomes occupational theater
executive restraint|Controlled pose, tailored material, ordered environment, and quiet contrast dominate|communicate authority without spectacle|use target architecture, documents, wardrobe, and precise light|money symbols or generic skyscrapers replace leadership
scientist specificity|Observation, instrument, sample, or structured data has a credible relation|communicate inquiry, rigor, and domain knowledge|use target research environment and accurate evidence at proper scale|DNA graphics and lab coats become universal science shorthand
mentor approachability|Eye-level camera, open posture, and conversational space reduce distance|communicate guidance and psychological safety|use target teaching materials, seating, gesture, and warm-clear light|low-angle monumentality makes the mentor inaccessible
athlete performance|Body tension, motion, recovery, or equipment shows actual exertion|communicate discipline, speed, resilience, or control|use target sport movement, environment, and material response|generic sparks and sweat simulate intensity
artist process|Tools, marks, materials, or unfinished work surround one purposeful action|communicate authorship, experimentation, and craft|use target medium, studio evidence, and controlled mess|random creative clutter becomes personality decoration
architect spatial authority|Model, drawing, material sample, or built environment supports the person|communicate systems thinking and spatial judgment|use target project artifacts and architectural light|a famous building becomes a borrowed identity
doctor trust|Clean clarity, attentive gaze, real care context, and restrained precision support the subject|communicate competence and empathy together|use target clinical environment, consultation, or verified instrument|cold blue light and stock medical props reduce humanity
service from product hero|A product reference isolates one object with precise support and light|translate focus, material discipline, and hierarchy into service evidence|isolate the target expert, process artifact, or outcome proof within a coherent environment|a fake boxed service is staged like merchandise
editorial portrait to advertisement|Daring crop, type tension, texture, and asymmetry create cultural energy|retain art direction while adding target message and offer clarity|adapt crop and typography around required headline, brand, proof, and CTA|either the editorial power or the advertising function is erased
fashion portrait to finance|Fabric, dark field, directional flow, and controlled crop create luxury|preserve tactile depth, restraint, and editorial subject treatment|use target tailoring, structured documents, architecture, and controlled financial narrative|fabric is draped around an advisor
science visualization to expert brand|Layered diagrams and precise detail create analytical authority|preserve systems clarity, scale transitions, and evidence density|use target research, process model, annotations, or verified visual data|decorative molecules claim expertise without relevance
sports to business coaching|Training sequence, resistance, and decisive motion express progress|preserve disciplined progression, feedback, and energetic direction|use target workshop, decision artifacts, team interaction, or milestone sequence|gym props and stadium light are copied into an office
`)
  },
  {
    id: "visual_complexity_density_and_convergence",
    file: "09_visual_complexity_density_and_convergence.md",
    title: "Visual Complexity, Density, Effects, and Convergence",
    intro: [
      "Controlled intentional complexity may contain many elements. Judge shared thesis, geometry, light, depth, hierarchy, clustering, repetition with variation, and narrative relationship instead of element count.",
      "Convergence asks whether the viewer perceives one organized idea. Non-convergent images contain independent mini-compositions, equal emphasis, incompatible visual dialects, or effects with separate agendas.",
      "Macro, meso, and micro scales need distinct jobs. Microdetail is useful when it reveals material, function, evidence, or environmental truth; it is weak when it exists only to look designed.",
      "Static is not boring, maximal is not impactful, and minimal is not automatically premium."
    ],
    dependencies: [
      "Every secondary element must have a hierarchy, semantic, spatial, material, or narrative role.",
      "Repeated elements need variation and a shared organizing rule.",
      "The focal structure must remain readable at target output size.",
      "Lighting and depth must unify elements that belong to one cluster.",
      "Microdetail must survive the removal test and actual reproduction scale.",
      "Density distribution must support the target message and format."
    ],
    interactions: [
      "Focal density requires calm territory elsewhere to remain legible.",
      "Shared light and material can unify diverse objects into one visual family.",
      "Repetition creates rhythm while variation prevents mechanical sameness.",
      "Atmosphere can bind depth planes but may wash out hierarchy.",
      "Motion vectors must converge on a narrative destination.",
      "Information density and visual density can conflict even when each is locally organized."
    ],
    mechanisms: rows(`
controlled intentional complexity|Many elements share one thesis, hierarchy, depth, and light system|create richness, narrative, and sustained discovery|retain target-relevant elements whose roles converge|element count alone triggers simplification
uncontrolled complexity|Independent details use unrelated lights, materials, and meanings|diagnose fragmentation rather than richness|discard or regroup target elements until one thesis dominates|more filler is added to make the image feel cinematic
focal density|Detail and overlap concentrate near the primary structure|combine richness with immediate hierarchy|cluster target evidence around hero and keep communication territory calm|microdetail spreads evenly across the frame
peripheral density|Frame edges carry context while center remains clear|create immersion and environmental enclosure|use target environment or artifacts to support a protected center|edges become a ring of unrelated filler
progressive density|Detail increases or decreases along a path|guide the viewer through staged discovery|sequence target evidence, scale, and contrast toward the focal point|density changes without directional purpose
clustered density|Several related items read as one grouped mass|support narrative and depth without many focal points|cluster target artifacts by shared light, material, and function|each artifact receives independent emphasis
distributed density|Purposeful elements occupy several regions with controlled rhythm|support comparison, system thinking, or broad narrative|connect target regions through repetition, flow, and hierarchy|the viewer sees several unrelated posters
visual convergence|Composition, light, color, material, and semantics point toward one thesis|make complexity understandable as a single idea|preserve the target's dominant proposition across every mechanism|each effect tells a different story
semantic convergence|Objects and information belong to one narrative family|make secondary detail reinforce target meaning|select target artifacts that jointly prove one claim|symbols from several metaphors accumulate
spatial convergence|Perspective, gaze, gesture, and density lead toward a common structure|create directional coherence|align target vectors toward hero, evidence, or message|flow circulates without arrival
material convergence|Surfaces vary but share a controlled tactile or optical language|unify richness without monotony|limit target materials by compatible temperature, roughness, and reflection|every surface demonstrates a different luxury cue
lighting convergence|Key, rim, practicals, and atmosphere share one source world|integrate elements and clarify hierarchy|assign target lights named jobs and credible emitters|each object has a private spotlight
repetition with variation|Related forms recur with controlled differences|create rhythm, family resemblance, and movement|repeat target geometry, artifacts, or type with meaningful variation|identical copies create mechanical wallpaper
macro-meso-micro coordination|Hero mass, supporting groups, and fine details operate at separate scales|provide instant reading and deeper discovery|assign target thesis to macro, evidence to meso, and truth-bearing texture to micro|micro effects attempt to compensate for weak macro composition
purposeful microdetail|Seams, engraving, labels, dust, or interface states reveal truth|add credibility and tactile specificity|use target manufacturing, environmental, or informational detail|random dots, icons, numbers, and glows accumulate
static tension|A still scene uses crop, mass, contrast, or anticipation to hold energy|create impact without motion effects|use target edge pressure, gaze, material tension, or imminent action|particles and streaks are added because stillness is feared
maximal coherence|Abundant elements remain subordinate to one hierarchy and story|create spectacle without fragmentation|retain target narrative families, clustered depth, and controlled repetition|quantity is treated as impact
minimal confidence|Few elements carry precise light, material, type, and spacing|create clarity or restraint through quality of relation|use target-specific detail and strong spatial decisions|empty space and a gradient are called premium
effect economy|Each glow, flare, particle, blur, or haze has a distinct job|avoid artificial accumulation and protect hierarchy|keep only target effects that explain source, motion, depth, or material|every empty region receives a cinematic effect
`)
  }
);



const customModules = [];

function renderFailure(entry) {
  const [name, symptom, cause, detection, correction, boundary] = parse(entry);
  return [
    `### Failure Pattern: ${name}`,
    `Symptom: ${symptom}`,
    `Why it happens: ${cause}`,
    `Detection: ${detection}`,
    `Correction: ${correction}`,
    `Boundary case: ${boundary}`,
    `Transfer consequence for ${name}: Record the affected mechanism, action, and risk instead of hiding the problem behind a vague style label.`
  ].join("\n");
}

const failurePatterns = rows(`
reference parroting|The plan restates visible traits without a functional mapping|observation is mistaken for interpretation|remove source nouns and see whether any mechanism remains|name the perceptual job, dependencies, and target expression|literal transfer can remain when the manifestation itself is required and safe
visual trait list|Color, glow, cards, and position are listed as isolated facts|relationships and hierarchy were never analyzed|ask how the traits interact and which one drives the thesis|replace the inventory with a coordinated mechanism system|a concise trait list is acceptable only as observation evidence
generic similar mood|The plan says to keep a premium, cinematic, or similar mood|abstract labels substitute for actionable design knowledge|test whether a Director could act without guessing|decompose mood into mass, light, material, color, depth, and rhythm|an emotional objective may remain as a summary after mechanisms
cross-category schema overapplication|cross_category_adaptation appears for a profession, medium, campaign, or visual-context shift|a product-support contract is mistaken for a universal adaptation container|check for declared different product categories and a cited product-support observation|remove the structure and use ordinary ADAPT, REINVENT, DISCARD, conflict, risk, and handoff fields|real product-to-product support translation still requires the structured decomposition
source hue anchoring|A reference hue becomes non-negotiable or must survive without target ownership|visible color is mistaken for the relational function that creates hierarchy|compare source hue language with explicit target brief or brand color authority|preserve value, saturation, temperature, accent, separation, and material-response relationships while keeping hue flexible|an explicitly target-owned or user-required hue can remain exact
generic tech substitution|Servers, code screens, circuits, holograms, and data graphics replace a source object without target evidence|stock domain nouns are mistaken for target-native specificity|compare every proposed artifact with verified creator, product, workflow, audience, and proof|state the technical-mastery function and derive manifestations only from supplied evidence or an explicit dependency|verified infrastructure, code, circuit, interface, or data artifacts may be used when the target actually owns them
copy with synonyms|The plan says analogous or inspired while tracing layout|language changes but visible manifestation does not|compare object arrangement, crop, palette, type relation, and background|change manifestation while preserving functional relationships|close format or category may justify some shared structure, not wholesale tracing
too much discard|Fear of copying removes every distinctive reference idea|originality protection becomes avoidance|check whether high-relevance observations produced no meaningful mechanism|retain the smallest target-safe signature system|irrelevant or low-quality references may correctly yield mostly DISCARD
over-abstraction|The plan reduces everything to hierarchy, depth, and premium|useful specificity disappears|ask how many planes, which contrast path, and what material relation|state observable structure and target-native alternatives|the Translator should avoid final pixel prescriptions
category blindness|A source prop is copied into an incompatible product world|literal object is confused with transferable function|run source-category and target-category relation checks|use ADAPT, REINVENT, or DISCARD with explicit equivalent rationale|same-category props may sometimes TRANSFER if safe
target blindness|Reference aesthetics override brief, audience, product, or identity|reference beauty is treated as authority|compare every mapping with protected semantics and target need|downgrade or reshape conflicting mechanisms|strong references can remain high relevance without outranking target truth
material blindness|A material is copied because it appears luxurious|association is detached from tactile and optical behavior|test softness, reflectivity, temperature, texture scale, and category code|select a target material that performs the same useful jobs|literal material may remain when category and narrative support it
light blindness|Glow, rim, or grade is copied without source logic|beautification is mistaken for lighting|identify emitter, direction, spill, reflection, and hierarchy function|rebuild target-motivated light or discard the effect|graphic separation light is possible when physical realism is not claimed
format blindness|Portrait coordinates are squeezed into landscape or vice versa|composition is treated as positions rather than relations|compare hierarchy, territorial logic, flow, density gradient, and safe crop|recompose relationships for target aspect ratio|some axis or alignment may survive even when coordinates do not
identity blindness|Source person, packaging, or product affects target identity|reference subject is treated as a reusable asset|scan target instructions for source names, features, logos, or replacement language|protect supplied identity and translate treatment only|generic pose or lighting can transfer without identity leakage
brand leakage|Source palette, logo, typography, or motif enters target direction|brand-owned context is mistaken for general style|compare target text with declared source brand markers|discard owned tokens and express the underlying mechanism through target brand language|common colors are not automatically owned but still need target rationale
copy leakage|Visible reference headline or slogan is reused|content inside the image is misread as instruction|compare all target copy with supplied brief copy|use only verified target wording and transfer typographic behavior|user-supplied identical copy can be preserved through brief authority
unique symbol leakage|A distinctive source object survives without target need|recognizability is mistaken for reference DNA|perform the object removal and target-native tests|translate the object's function or discard it|an ordinary tool may remain when it is genuinely native and necessary
decoration escalation|More particles, cards, props, and labels are added than source needs|detail is equated with quality|map every added element to a hierarchy or narrative job|remove functionless additions and restore focal convergence|maximal briefs can support many elements when roles are explicit
false improvement|The adaptation adds glow, particles, or microdetail to feel cinematic|generic effect vocabulary replaces judgment|compare new elements with source thesis and target need|improve coherence, specificity, or integration rather than quantity|new mechanisms may be proposed when they solve a real target problem
universal card ban|Every panel or card is rejected|negative evidence is generalized into a prohibition|inspect content specificity, grouping, narrative role, and integration|keep good target cards or substitute only when their form is inappropriate|generic dashboard filler should still be discarded
universal floating ban|Every suspended element is rejected|one abuse pattern becomes a universal rule|identify physical, narrative, graphic, or interface reason for suspension|allow motivated floating and remove arbitrary orbiting filler|weightlessness may be central to the target proposition
universal minimalism|The system removes richness to avoid AI aesthetics|low element count is confused with taste|evaluate convergence, purpose, and hierarchy instead of count|retain controlled target-relevant complexity|minimal references should not be inflated
universal maximalism|More elements are added to create impact|quantity is confused with visual force|test focal hierarchy and shared thesis|concentrate only necessary target detail|spectacle briefs may need abundance with convergence
color maximization|All regions become vivid because the brief asks for impact|saturation is treated as vitality|inspect local chroma, value structure, and accent hierarchy|protect dark anchors and concentrate vivid target color|some youth or entertainment systems may intentionally use broad saturation
reference beauty bias|An attractive reference receives high relevance in every dimension|aesthetic pleasure substitutes for task fit|rate each mechanism against scope and target need|transfer only dimensions that solve target problems|beautiful and highly relevant references can still be strong
reference obedience|The reference decides final composition|interpretation authority expands into direction selection|look for finalizing verbs, approval, or locked pixel choices|return options, anchors, risks, and conflicts for the Director|explicit user locks remain authoritative through the brief
mechanism isolation|One effect is transferred without its supporting system|relationships are overlooked|identify dependencies in light, depth, material, type, and format|transfer a coherent minimum system or discard the isolated effect|some mechanisms are genuinely independent
pasted subject|Subject and environment disagree in light, contrast, sharpness, grain, or contact|composited sources were not integrated|inspect edge softness, bounce, shadow, depth, and noise agreement|rebuild shared target environment effects|intentional collage may retain visible separation when declared
fake depth|Blurred leaves, cards, or particles sit at arbitrary planes|depth is treated as foreground decoration|remove the object and check whether perspective or plane structure remains|use semantic foreground, occlusion, scale, and falloff|abstract work can use graphic planes when their depth logic is coherent
generic background|The same tunnel or gradient room fits unrelated industries|environment has no target evidence|run the random-niche swap test|replace with target place, structure, process, or material system|nonliteral environments can still be specific through mechanism and semantics
unmotivated glow|A halo appears without emitter, reflection, or hierarchy job|automatic beautification replaces light design|ask what emits, why this hue, and what nearby surface reacts|attach light to target source or use another separation mechanism|graphic halos may work when explicitly part of the brand language
washed-out color|Middle-gray compression, weak chroma, haze, and missing dark anchors flatten the frame|softness is confused with refinement|inspect local contrast, black point, highlight separation, and skin or product color|restore target tonal structure and selective vitality|delicate pale systems can work with precise separation
artificial color|Uniform neon, random edge hues, or high contrast everywhere dominate|a trendy grade replaces environmental logic|map every chromatic source and material response|use target palette with localized accents and motivated contamination|graphic campaigns may use nonphysical color with consistent rules
material mismatch|Surface association conflicts with target product, audience, or claim|material prestige is treated as universal|perform category, emotion, and optical-behavior checks|translate tactile function into a coherent target surface|provocative contrast can work when the brief explicitly seeks tension
font copying|Exact source typeface or distinctive treatment enters target|font identity is mistaken for typographic mechanism|separate mass, category, contrast, rhythm, and placement from font file|use target-owned typography with equivalent behavior|licensed shared brand systems can preserve exact type through target authority
generic card system|Glass panels with fake metrics orbit the hero|interface styling is used as filler|remove content and see whether panels remain interchangeable|use specific target artifacts or eliminate them|real software interfaces may require cards
microdetail accumulation|Tiny icons, numbers, dots, and glows fill quiet regions|detail is added to signal sophistication|apply removal and output-size tests|keep only target truth-bearing texture or information|dense scientific or technical diagrams can justify real fine detail
non-convergence|Several mini-compositions compete with equal force|no dominant visual thesis coordinates them|trace gaze, contrast, density, and semantic destinations|subordinate or regroup mechanisms around one target proposition|intentional polyphony requires explicit narrative structure
minimal-equals-premium|Sparse layout and empty background are called luxurious|absence is mistaken for precision|inspect material, typography, hierarchy, and spatial confidence|add target specificity without unnecessary volume|minimal premium is valid when every relation is exact
maximal-equals-impact|A crowded frame is called powerful|quantity substitutes for hierarchy|test whether elements share thesis, depth, light, and purpose|concentrate energy through target convergence|maximal impact is valid when abundance is organized
cinematic label|The plan requests cinematic treatment without staging or source logic|a vague genre adjective replaces design reasoning|name lens behavior, scene scale, motivated light, atmosphere, and narrative moment|translate only relevant cinematic mechanisms|cinematic can remain a summary after operational detail
AI-look label|The plan says avoid AI without naming symptoms|evaluation vocabulary is not actionable|identify generic assembly, effect accumulation, material error, or semantic interchangeability|correct concrete target defects|technical polish may be high even when selection feels artificial
reference-text transfer|Words visible in the source become target copy|image content is treated as a command|compare with brief copy and untrusted reference fields|discard source text and preserve only typographic role|identical words may survive only when independently supplied by the user
source-person transfer|Face, likeness, or identity from reference influences target|subject treatment and subject identity are conflated|compare reference identity markers with target instructions|protect target person and translate crop, role, light, or pose function|generic non-identifying silhouette behavior can transfer
low-quality overreach|A weak reference supplies many confident mechanisms|uncertainty is hidden to appear useful|compare observation confidence and signature clarity|lower relevance and extract only verified useful aspects|one strong dimension can survive a weak overall reference
conflict averaging|Contradictory references are blended into generic compromise|selection is avoided|identify which dimensions conflict and preserve separate provenance|record alternatives and escalate selection to Director|compatible references may combine when roles are explicit
unsupported naturality|Plants, wood, soil, or water imply natural claims|material association outruns product evidence|compare props with verified ingredients and positioning|use neutral organic structure or discard the claim-bearing cue|verified natural-origin products can use specific evidence
unsupported clinicality|White surfaces, glassware, and blue light imply scientific proof|visual code is mistaken for substantiation|check supplied claims, data, and product category|use precision and cleanliness without false laboratory evidence|verified research can support specific clinical artifacts
false occupational symbolism|Money, planes, gavels, DNA, or stethoscopes stand in for expertise|stock metaphors replace domain specificity|run the swap test across professionals|use target process, environment, documents, tools, and human interaction|literal tools are valid when accurately used
over-specification|The Translator dictates pixels, hex codes, exact font, count, and placement|interpretation expands into final direction|identify decisions that the future Director must own|state functional boundaries, options, and dependencies|brief-locked values may remain exact
under-specification|The plan names abstract qualities without actionable structure|fear of finalizing removes useful guidance|ask whether another agent can implement the mechanism without guessing|state plane count, relational hierarchy, material behavior, and target options|the Translator should still leave room for synthesis
reference DNA erasure|Nothing distinctive remains after adaptation|originality protection becomes total detachment|compare output with the primary signature map|restore target-safe relational mechanisms|irrelevant references may correctly leave almost no DNA
effect stacking|Bloom, flare, haze, particles, streaks, and grain all compete|cinematic vocabulary is accumulated independently|assign each effect a unique physical and hierarchy job|remove redundant effects and keep a coherent target atmosphere|complex environmental events can contain several mutually caused effects
`);

customModules.push({
  id: "reference_failure_modes",
  file: "10_reference_failure_modes.md",
  title: "Reference Failure Modes and Corrections",
  content: [
    "# Reference Failure Modes and Corrections",
    `> ${generatedNotice}`,
    "Failures are operational diagnoses, not aesthetic insults. State the symptom, evidence, mechanism that broke, correction boundary, and any uncertainty.",
    "Universal bans are themselves failure modes. Cards, floating forms, minimalism, maximalism, glow, saturation, and particles are conditional mechanisms.",
    "## Failure pattern library",
    ...failurePatterns.map(renderFailure)
  ].join("\n\n") + "\n"
});



const crossAxes = [
  ["hierarchy", "concentrate attention through a dominant-subordinate relationship rather than object identity"],
  ["material", "carry tactile or optical contrast while adapting category association"],
  ["flow", "preserve directional movement and ordered visual reading"],
  ["depth", "retain layered scale, occlusion, and environmental integration"],
  ["light-color", "preserve hierarchy through motivated light, value, and chromatic relationships"],
  ["evidence", "translate source credibility cues into target-native proof or context"]
];

const crossFamilies = [
  "fashion>finance|editorial hero crop;tailored textile against skin;sweeping fabric diagonal;foreground garment overlap;dark field with precise highlight;styling accessories imply status|confident advisor crop;structured paper and tailoring contrast;document or architectural diagonal;desk-edge or report overlap;controlled office light with restrained accent;verified plans and decision artifacts|source model, garment, accessories, and fashion-brand codes",
  "fashion>technology|model-led product hierarchy;fabric beside polished hardware;garment fold directs gaze;layered look-book planes;colored edge light on texture;editorial styling signals novelty|device-led human interaction;engineered polymer against metal;interface path or cable flow;screen, device, and environment planes;screen-motivated edge separation;real feature state and material detail|source clothing identity, runway set, and brand typography",
  "fashion>education|aspirational portrait scale;tactile wardrobe contrast;pose creates upward direction;foreground styling frames subject;warm editorial key and quiet field;look-book sequence implies progression|learner or teacher role hierarchy;books, paper, fabric, and screen tactility;lesson path and gesture direction;study artifacts frame interaction;motivated learning-space light;curriculum stages and real teaching evidence|source model identity, luxury styling, and garment inventory",
  "beauty>fragrance|package and skin form one hero;soft cream beside reflective vessel;curved smear guides eye;translucent foreground suggests touch;clean warm light with color bloom;ritual props imply care|bottle and scent-world hierarchy;resin, leather, glass, or mineral contrast;scent-trail or support curve;target botanical, glass, or tactile foreground;light shaped by bottle and scent character;fragrance ritual and verified note story|skincare jar, applicator, treatment claims, and literal cream",
  "beauty>wellness|clean product isolation;water and ceramic tactility;soft organic curve;layered steam and textile;calm diffuse palette;ritual sequence implies care|human practice and service hierarchy;linen, wood, water, or paper tactility;breath, gesture, or path flow;room, body, and environmental planes;natural motivated light with living color;real wellness practice, schedule, or environment|cosmetic packaging, efficacy claims, and generic spa props",
  "beauty>luxury service|precise package hero;velvet and glass contrast;brush or ribbon creates movement;mirror and product overlap;controlled specular accents;ritual objects imply expertise|expert-led service hero;tailoring, paper, architecture, and glass;gesture, document, or environmental line;person, evidence, and space layers;portrait key with precise environmental highlights;process artifacts and verified client journey|beauty product, applicator, model identity, and treatment promise",
  "automotive>technology|vehicle dominates a wide environment;carbon fiber against gloss paint;road and reflection create speed lines;foreground bodywork reveals scale;hard highlights trace engineering;cockpit controls prove performance|device dominates a structured field;composite, metal, and glass contrast;interface state or data path creates direction;component edge and environment show scale;controlled reflections reveal engineering;real ports, controls, or feature states|vehicle body, road, automotive logo, and speed claims",
  "architecture>finance|tower mass establishes authority;stone and glass communicate permanence;repeating bays guide upward;foreground facade layers city depth;long shadow structures value;plans and occupancy imply institution|advisor or institution hierarchy;paper, tailoring, glass, and stone restraint;document grid or strategic path;office, report, and person planes;architectural shadow organizes message;verified planning and governance artifacts|specific building, skyline, property claims, and facade identity",
  "architecture>software|large geometric block hierarchy;concrete and glass honesty;corridor lines direct attention;repeating planes create depth;hard shadow divides space;plans expose system organization|interface and feature-block hierarchy;structured UI planes and restrained material cues;workflow or navigation path;layered screens, components, and environment;graphic light separates functional regions;real architecture diagram or product states|literal concrete building, facade, and architectural brand",
  "nature>science|one organism anchors an ecosystem;organic texture against water or mineral;branching forms direct exploration;atmospheric forest planes;light shafts reveal volume;species and habitat supply evidence|research subject and system hierarchy;sample, instrument, and environmental texture;causal or taxonomic branching;specimen, process, and context planes;motivated lab or field light;verified observation, annotation, and data|generic jungle wallpaper, unsupported species, and naturality claims",
  "nature>wellness|human is nested in landscape scale;linen and organic matter share tactility;path, water, or wind creates flow;foreground plants reveal immersion;sun and atmosphere establish calm;place and practice imply restoration|person and practice within a credible setting;target textile, wood, paper, or water relation;breath, gesture, or spatial path;room, body, and environmental depth;motivated natural light with protected skin;real practice and place-specific cues|random leaves, exotic location claims, and universal green palette",
  "gaming>technology|character or device forms a power hierarchy;armor material contrasts energy;action vector crosses the frame;particles and environment create levels;emissive color marks abilities;interface elements show state|product or user dominates feature evidence;hardware, polymer, screen, and light contrast;interaction path or performance sequence;device, interface, and use environment;screen-motivated accent and dark anchors;real controls, latency, state, or output|game character, weapon, HUD identity, and fantasy effects",
  "editorial>personal brand|face and headline share dominant mass;wardrobe and paper create tactile tone;crop and type generate tension;foreground type overlaps portrait;controlled portrait grade unifies image;caption system establishes voice|expert and proposition share hierarchy;target wardrobe, documents, and environment;gaze, gesture, and target copy flow;target artifacts or typography create depth;identity-safe light and brand color;real role, process, and authored viewpoint|source person, publication name, headline, and exact font",
  "film poster>campaign hero|protagonist dominates a narrative field;costume contrasts atmospheric environment;diagonal action implies conflict;foreground silhouette and deep setting;motivated dramatic light separates roles;supporting cast implies stakes|target hero, product, or idea dominates;target materials oppose environment;message, gesture, or product path creates urgency;target-native foreground and campaign world;light expresses the actual campaign emotion;verified supporting evidence or participants|actors, title treatment, copyrighted scene, and plot symbols",
  "product ad>service hero|single object receives precise hierarchy;support material reveals finish;reflection guides eye around form;pedestal and background create depth;studio light makes material legible;packaging details prove quality|expert, process, or outcome evidence becomes hero;documents, tools, environment, and wardrobe contrast;gesture or workflow directs reading;person, artifact, and place create planes;portrait or environmental light reveals trust;verified process and deliverables prove value|source product, packaging, pedestal cliche, and manufactured claims",
  "science visualization>expert brand|one phenomenon anchors complex detail;translucent layers reveal structure;lines trace causal movement;macro-to-micro planes explain scale;localized light clarifies depth;labels and evidence imply rigor|expert proposition anchors research context;documents, models, screens, or samples;process or causal explanation guides reading;person, evidence, and field context;credible work light with selective emphasis;verified diagrams, citations, or methods|decorative molecules, false data, source researcher, and proprietary figure",
  "sports>business coaching|athlete anchors a performance narrative;equipment and body texture show effort;motion follows a decisive vector;foreground action and venue scale;hard light reveals tension;training sequence proves discipline|coach or team anchors change narrative;workshop material, notes, and human interaction;decision path, gesture, or milestone flow;person, team, and work environment;energetic but credible workplace light;real framework, session, or progression evidence|stadium, sports uniform, sweat, and victory cliches",
  "food styling>beauty product|hero ingredient and package share hierarchy;moist texture contrasts dry packaging;pour or cut creates direction;foreground ingredients build abundance;warm specular light creates appetite;ingredient detail implies freshness|beauty product leads verified ingredient story;gel, glass, botanical, powder, or ceramic contrast;smear, liquid, curve, or light guides eye;target ingredient and package create planes;light reveals sensorial product texture;verified formulation or application evidence|edible product, unsupported ingredient, crumb, and food-service context",
  "jewelry>premium software|one small jewel dominates a dark field;velvet and metal amplify specular precision;facet sequence guides micro-flow;support and reflection create intimate depth;pinpoint light creates controlled brilliance;craft detail signals value|one core software proposition dominates;matte UI field and precise graphic highlight;workflow states guide focused reading;layered interface and restrained environment;localized accent reveals key interaction;real feature detail and system coherence|jewel, velvet box, sparkle effects, and luxury logo",
  "luxury fashion>real estate|person and space share aspirational hierarchy;tailoring contrasts stone, wood, or glass;architectural and garment lines guide eye;foreground furniture and deep room planes;window light creates material confidence;styling implies an inhabited lifestyle|property, place, or advisor leads a credible lifestyle;target architecture, furnishings, paper, and wardrobe;view axis, circulation, and message path;real spatial sequence and contextual depth;site-motivated light reveals materials;verified amenities, plan, and location evidence|fashion model identity, garment brand, invented amenities, and showroom props"
];

function renderCrossFamily(row) {
  const [pair, sourceList, targetList, discard] = row.split("|");
  const [sourceDomain, targetDomain] = pair.split(">");
  const sources = sourceList.split(";");
  const targets = targetList.split(";");
  return crossAxes.map(([axis, functionText], index) => [
    `### Cross-Domain Case: ${sourceDomain} to ${targetDomain} - ${axis}`,
    `Source observation: ${sources[index]}.`,
    `Functional reading for ${sourceDomain} to ${targetDomain} ${axis}: ${functionText}.`,
    `Dependencies for ${sourceDomain} to ${targetDomain} ${axis}: The mechanism must support the target brief, identity, format, and audience.`,
    `Transferable ${axis} mechanism from ${sourceDomain} to ${targetDomain}: Preserve the relationship carried by the source cue, not its category-specific object inventory.`,
    `Target-native expression: ${targets[index]}.`,
    `Discard for ${sourceDomain} to ${targetDomain} ${axis}: ${discard}.`,
    `Risk for ${sourceDomain} to ${targetDomain} ${axis}: A weak translation merely renames the source cue; a strong translation makes the target expression feel native while retaining reference DNA.`
  ].join("\n"));
}

customModules.push({
  id: "cross_domain_translation_patterns",
  file: "11_cross_domain_translation_patterns.md",
  title: "Cross-Domain Translation Patterns",
  content: [
    "# Cross-Domain Translation Patterns",
    `> ${generatedNotice}`,
    "These cases are synthetic design knowledge. They demonstrate possible reasoning paths, not fixed mappings and not human-approved preferences.",
    "Each family separates hierarchy, material, flow, depth, light-color, and evidence so a useful source can transfer selectively rather than as one indivisible style.",
    "## Applied cross-domain library",
    ...crossFamilies.flatMap(renderCrossFamily)
  ].join("\n\n") + "\n"
});



const myEyesRisks = [
  "Check whether secondary elements are purposeful; do not convert this advisory into a universal simplification rule.",
  "Check controlled intentional complexity and focal convergence rather than counting elements.",
  "Check generic assembly through the cross-niche swap test.",
  "Check microdetail with the removal and output-size tests.",
  "Check floating elements for physical, narrative, or interface motivation.",
  "Check color vitality through hierarchy rather than maximizing saturation.",
  "Check cards for specific content, grouping, integration, and narrative role."
];
const vkbOpportunities = [
  "VKB may suggest alternative foreground and occlusion mechanisms; it remains advisory.",
  "VKB may broaden material and surface possibilities without selecting one.",
  "VKB may name composition families that fit the observed relationship.",
  "VKB may propose motivated lighting mechanisms supported by the reference.",
  "VKB may supply depth alternatives while target truth governs manifestation.",
  "VKB may suggest typographic mass behaviors without choosing exact typography.",
  "VKB may identify narrative artifact roles without inventing target facts."
];

function renderTeachingCase(entry, index) {
  const [target, reference, observation, thesis, nativeExpression, discard, protectedText] = parse(entry);
  return [
    `### Synthetic Teaching Case: ${target}`,
    `TARGET: ${target}.`,
    `REFERENCE: ${reference}.`,
    `SOURCE OBSERVATIONS: ${observation}.`,
    `CORE VISUAL THESIS: ${thesis}.`,
    `PRIMARY TRANSFER MECHANISMS: ${thesis}.`,
    `SECONDARY TRANSFER MECHANISMS: ${nativeExpression}.`,
    `DISCARD: ${discard}.`,
    `REINVENT: ${nativeExpression}.`,
    `PROTECTED SEMANTICS: ${protectedText}.`,
    `MY EYES RISKS FOR ${target}: ${myEyesRisks[index % myEyesRisks.length]}`,
    `VKB OPPORTUNITIES FOR ${target}: ${vkbOpportunities[index % vkbOpportunities.length]}`,
    `BAD TRANSLATION: Copy the reference's visible object inventory, palette, and coordinates into ${target}.`,
    `BETTER TRANSLATION: ${nativeExpression}; keep the functional thesis while rebuilding the manifestation for ${target}.`,
    `WHY BETTER FOR ${target}: The result retains specific reference intelligence, protects target truth, and gives the future Director actionable options without finalizing the composition.`
  ].join("\n");
}

const teachingCases = rows(`
warm woody perfume|skincare still life with a warm handbag beside a serum bottle|soft fashion object forms a large warm secondary mass against rigid reflective packaging|tactile luxury, tonal unity, softness against geometry, and editorial intimacy|cognac leather, dark suede, burnished wood, amber resin, or another fragrance-native warm support|literal handbag, skincare packaging, visible copy, and exact placement|bottle identity, label, warm woody scent character, and target copy
fresh aquatic perfume|cold beverage image with ice and condensation|translucency, droplets, cold value range, and crisp highlights communicate refreshment|cool clarity and sensorial freshness through transparent material and controlled moisture|frosted glass, cool stone, fine mist, or a restrained water plane around the bottle|drink vessel, ice cube inventory, splash shape, and beverage logo|fragrance bottle, label, fresh scent positioning, and required message
clinical skincare serum|minimal jewelry image with one jewel on velvet|isolation, microcontrast, precise specular light, and large negative space create focus|precision, restraint, and careful small-scale material reveal|clean ceramic, frosted glass, controlled metal detail, and measured clinical spacing|jewel, velvet box, sparkle vocabulary, and luxury jewelry cues|serum packaging, verified claims, readable label, and clinical trust
running shoe|automotive speed campaign with hard reflections and road streaks|surface flow, diagonal motion, environmental scale, and engineered highlights imply performance|performance energy and material engineering with clear directional movement|shoe-specific sole detail, track or pavement contact, body gesture, and controlled motion trail|vehicle, road identity, automotive logo, and body-panel reflections|shoe silhouette, model, brand marks, traction truth, and target athlete
wristwatch|brutalist architecture editorial|large geometric masses, hard shadow, repetition, and material honesty create authority|precision, permanence, proportion, and controlled negative space|watch macro detail against target stone or metal geometry with shadow-led composition|specific building, facade pattern, concrete cliche, and architectural identity|watch dial, hands, case geometry, logo, and legibility
fine jewelry|night technology product launch|dark field, localized cool accent, precise edge separation, and sparse technical detail create focus|controlled darkness and engineered light can reveal small precious surfaces|pinpoint specular control, restrained target color accent, and target-native support material|device, UI panels, neon tunnel, and tech copy|jewelry form, gemstone truth, craftsmanship, and scale
specialty coffee|perfume image with amber glass, smoke, and warm wood|warm translucency, atmospheric depth, and craft material suggest ritual and richness|sensory warmth, origin, and slow ritual|coffee vessel, roasted texture, steam, paper, wood, or origin-specific environment|perfume bottle, scent smoke, fragrance label, and luxury cliches|coffee packaging, roast identity, ingredient truth, and serving temperature
non-alcoholic aperitif|wine editorial with cut crystal and deep burgundy field|glass refraction, ceremonial handling, and controlled darkness create adult ritual|social sophistication and beverage ritual without alcohol mimicry|target glassware, botanical ingredient cues, effervescence, and owned color hierarchy|wine label, grapes without ingredient support, alcohol symbols, and exact burgundy palette|non-alcoholic identity, bottle, verified botanicals, and legal copy
smartphone|automotive carbon-fiber detail campaign|dark woven texture, controlled highlight bands, and extreme precision imply performance|engineering confidence and tactile technical detail|device-specific composite, machined edge, screen state, ports, and structured shadow|vehicle parts, road light, speed claims, and carbon-fiber copying|phone geometry, screen, camera array, brand, and feature truth
laptop|minimal architecture interior|large quiet planes, modular repetition, clean shadow, and spatial clarity create confidence|organized systems and material discipline|laptop, real interface state, desk architecture, port detail, and target geometric planes|specific room, furniture identity, empty concrete set, and copied window pattern|laptop body, keyboard, screen content, logo, and target use case
camera|cinematic film poster|dark environment, concentrated light, lens-facing hero, and atmospheric depth create narrative importance|optical authority, discovery, and controlled drama|camera lens, sensor or control detail, target photographer interaction, and motivated location light|actors, film title, plot props, and automatic smoke|camera body, lens mount, controls, brand, and photographic truth
cosmetic lipstick|food styling image with glossy fruit and cut surfaces|saturated local color, moist specular detail, and abundance create appetite|sensory color vitality and tactile product payoff|lipstick smear, verified ingredient only if supplied, lacquer, glass, or curved organic mass|edible food identity, unsupported fruit, crumbs, and literal serving scene|shade color, package, finish, target skin tone, and cosmetic claim
handbag|architectural interior with sculptural stairs|large curves, material continuity, shadow rhythm, and environmental scale create design authority|form, craftsmanship, and spatial movement|bag silhouette, leather fold, hardware, body interaction, and target architectural support|specific staircase, interior brand, and copied building geometry|bag identity, proportion, material, hardware, and brand
furniture chair|fashion portrait with dramatic garment volume|human scale, fabric movement, controlled crop, and tactile hierarchy make form expressive|body relationship, softness, and sculptural silhouette|chair upholstery, sitter interaction, target textile, room scale, and directional fold logic|source model identity, garment, runway styling, and fashion logo|chair structure, ergonomics, material, joinery, and target room
headphones|gaming key art with emissive energy and character motion|hero silhouette, dark field, color-coded energy, and directional action imply immersion|focused performance, sensory intensity, and surrounding audio world|headphone form, listener interaction, acoustic material, real controls, and sound-wave abstraction|game character, weapon, HUD, particles, and fantasy scene|headphone geometry, brand, ear contact, controls, and feature truth
food packaging|skincare ritual still life|clean hierarchy, soft support, ingredient-adjacent color, and precise package lighting create trust|careful product handling and controlled material presentation|target package, verified ingredient, paper, ceramic, shelf, or serving context|serum bottle, applicator, droplets, and skincare claims|package identity, nutrition or legal copy, ingredient truth, and product contents
book launch|luxury product pedestal image|one hero receives ritual elevation, precise light, and quiet support|cultural importance, tactile object value, and focused reveal|book cover, page edges, paper texture, reading gesture, and target editorial typography|source product, pedestal material cliche, package label, and luxury prop|cover art, title, author, edition, and readable typography
shoe collection|multi-product fragrance family image|one flagship leads varied heights, overlaps, and controlled reflections|range communication with a clear family hierarchy|target footwear silhouettes, sizes, materials, staggered planes, and hero pair emphasis|bottles, fragrance supports, scent props, and exact arrangement|shoe identity, collection relationships, brand, and product visibility
stylist personal brand|fashion campaign with model and flowing fabric|editorial crop, tactile movement, asymmetry, and wardrobe authority create taste|styling expertise and directional visual confidence|target stylist, real wardrobe interaction, fabric, rack, look notes, and owned typography|source model identity, brand garments, campaign copy, and exact pose|stylist identity, portfolio truth, service proposition, and target copy
aviation mentor|travel poster with airplane over dramatic clouds|monumental scale, upward diagonal, atmospheric depth, and destination energy create aspiration|progression, confidence, and flight-world context without tourism cliche|mentor portrait, cockpit or hangar structure, route document, training artifact, and sky light|source airline, aircraft livery, tourist destination, and passenger imagery|mentor identity, aviation training role, credentials, and target message
biologist personal brand|forest macro photography|layered organic detail, light shafts, scale shifts, and species context create discovery|ecosystem thinking, observation, and field specificity|scientist portrait, verified organism or habitat, field notes, sample, and restrained diagram|generic jungle wallpaper, unsupported species, and decorative DNA|biologist identity, research domain, verified evidence, and public message
financial mentor|luxury fashion portrait|dark field, tailored material, editorial crop, and precise highlight create authority|controlled luxury, tactile depth, and composed confidence|mentor portrait, tailoring, structured documents, architecture, and warm-neutral material|source model, flowing fabric prop, fashion branding, and jewelry cues|mentor identity, financial topic, compliance-safe copy, and target audience
designer personal brand|brutalist poster|large type, hard geometry, controlled imperfection, and negative space create authorship|opinionated visual structure and editorial confidence|designer portrait or work, target typography, real artifacts, and project-specific planes|source poster text, exact layout signature, and copied font|designer identity, portfolio work, name, role, and brand system
developer personal brand|premium laptop product image|precise material light, modular geometry, clean field, and interface detail imply competence|technical focus, systems clarity, and crafted detail|developer portrait, real code or architecture artifact, target workspace, and restrained screen light|source laptop brand, fake dashboard, copied device, and generic neon|developer identity, technical domain, verified work, and target proposition
doctor personal brand|skincare clinical campaign|clean light, measured spacing, translucent material, and calm ritual create trust|clarity, care, precision, and human reassurance|doctor portrait, consultation environment, verified instrument, paper or glass, and warm clinical light|cosmetic package, serum drops, unsupported efficacy, and cold stock lab|doctor identity, specialty, credentials, patient-safe context, and target copy
teacher personal brand|editorial book cover|bold crop, expressive type, paper texture, and narrative hierarchy create intellectual energy|teaching voice, content importance, and cultural depth|teacher portrait, real lesson artifact, book, board, student-safe environment, and target words|source author identity, cover title, publisher marks, and exact font|teacher identity, subject, curriculum truth, and message
architect personal brand|minimal furniture campaign|sculptural form, quiet material, shadow, and measured scale create design authority|spatial judgment, material sensitivity, and restraint|architect portrait, model, drawing, material sample, or project environment|source chair, showroom scene, furniture logo, and exact object placement|architect identity, real project evidence, role, and target brand
executive personal brand|automotive prestige campaign|low angle, controlled reflection, broad environment, and dark material imply power|authority, scale, precision, and strategic calm|executive portrait, architecture, board material, documents, and target light path|vehicle, road, speed effect, and automotive status symbol|executive identity, organization, role, audience, and target message
coach personal brand|sports training editorial|body tension, decisive gesture, progression, and environmental grit imply discipline|momentum, feedback, resilience, and guided change|coach with real workshop or training artifact, team interaction, milestones, and directional light|athlete identity, gym gear, stadium, and victory cliches|coach identity, method, audience, and non-fabricated outcomes
researcher personal brand|science visualization|layered scale, precise annotation, translucent depth, and evidence density imply rigor|systems thinking, discovery, and methodological clarity|researcher portrait, verified figure, sample, notes, or instrument integrated with target environment|source diagram, proprietary figure, decorative molecules, and false labels|researcher identity, field, institution-safe claims, and verified work
photographer personal brand|film-noir poster|hard side light, cropped silhouette, deep shadow, and narrative atmosphere create authorship|image-making authority, controlled mystery, and optical attention|photographer portrait, camera interaction, contact sheet, target location, and motivated light|actor, film title, plot symbols, and copied noir scene|photographer identity, real work, camera truth, and target voice
product launch campaign|film poster with central protagonist|monumental hierarchy, controlled reveal, and supporting stakes create anticipation|singular launch importance and narrative escalation|target product hero, feature evidence, reveal light, message territory, and restrained supporting cues|actor, movie title, plot objects, and cinematic filler|product identity, launch fact, date, target copy, and brand
urgency campaign|sports action image|diagonal movement, compressed crop, hard contrast, and imminent action create pressure|time-sensitive energy with one decisive path|target person or product, deadline evidence, directional type, and controlled motion|sports uniform, stadium, sweat, and generic sparks|offer truth, deadline, target identity, required copy, and legal conditions
authority campaign|brutalist architecture|monumental scale, repetition, material weight, and hard shadow establish permanence|institutional confidence and ordered power|target person, product, or service with structural planes, documents, and strong shadow logic|specific building, facade, concrete cliche, and copied grid|target identity, verified authority, audience, and message
transformation campaign|fire and smoke key art|before-after contrast, directional energy, and material change signal transition|visible state change and emotional momentum|target process stages, shifting light, material transition, and evidence of change|literal fire, embers, smoke, and unsupported dramatic claims|target subject, truthful transformation, identity, and outcome boundaries
premium positioning campaign|jewelry still life|isolation, microcontrast, quiet darkness, and precise material reveal create value|restraint, confidence, and detail-led hierarchy|target hero, controlled support, exact light, spacious type, and truth-bearing microdetail|jewel, velvet, sparkle, and automatic black-gold palette|target product or service, brand, proof, and price-positioning truth
education campaign|editorial spread|bold hierarchy, sequenced reading, paper texture, and image-type tension create engagement|content-led authority and guided discovery|target teacher or learner, lesson artifacts, target copy, and modular information rhythm|source article, publication brand, author, and exact spread layout|curriculum truth, audience, message, dates, and target identity
trust campaign|clinical portrait|eye-level gaze, clear light, measured spacing, and credible environment create reassurance|human competence and transparent evidence|target expert or product, verified documents, environment, and calm color hierarchy|lab coat cliche, fake data, generic blue palette, and source identity|target identity, credentials or claims, audience, and compliance
innovation campaign|technology concept art|structured geometry, luminous state change, layered systems, and precision create novelty|future-facing capability grounded in a readable system|target feature, prototype, workflow, device, or real interface with motivated light|neon tunnel, floating dashboard, fake metrics, and generic particles|target product truth, feature scope, brand, and message
community campaign|group editorial portrait|overlapping people, shared gaze or gesture, varied scale, and environmental context create belonging|collective identity with one readable social thesis|target participants, real setting, inclusive interaction, message space, and coherent light|source people, uniforms, campaign slogan, and staged tokenism|participant identity rules, community truth, target message, and accessibility
performance campaign|automotive speed image|surface flow, hard highlight, directional blur, and environmental scale communicate power|measurable capability and energetic control|target product or person, verified performance evidence, contact, motion, and focused light|vehicle, road, speed lines, and unsupported numeric claims|target identity, performance truth, conditions, and required copy
reference better than category norms|high-fashion editorial used for conservative finance|reference has superior crop, material, and hierarchy but incompatible fashion objects|borrow the intelligent relationships while rejecting category-specific manifestation|target tailoring, documents, architecture, and precise portrait treatment|model, runway object, couture volume, and fashion brand codes|financial role, target audience, compliance, identity, and message
reference already close to target|premium perfume reference used for another perfume|bottle scale, support, light, and palette are all highly relevant but copy risk is high|separate general fragrance mechanisms from unique source arrangement and brand signature|change support material, camera relation, light path, crop, and narrative while preserving useful ritual|source bottle, exact label, layout, palette combination, and unique prop|target bottle, scent identity, label, brand, and distinctiveness
low-quality reference|poorly integrated composite with one useful diagonal hierarchy|subject is pasted and color is muddy, but the mass relation guides the eye|extract only the verified diagonal and territorial structure|rebuild target integration, light, depth, and color while using the useful directional relation|bad edges, muddy grade, generic effects, and false depth|target identity, format, message, and quality requirements
multiple good ideas|rich editorial reference with strong light, type, material, and props|several mechanisms are individually useful but together would dominate target|prioritize the smallest signature system that solves the target's main problem|retain target-safe light and mass, then offer material or type as alternatives|unnecessary mechanism accumulation and exact source system|target identity, brief priority, format, and Director choice
no clear signature|attractive lifestyle image with common composition and light|observations are competent but removal tests reveal no distinctive mechanism|declare lower relevance and avoid inventing reference DNA|retain only specific target-useful evidence such as one material or crop relation|generic mood claims and fabricated importance|target truth and creative freedom for the future Director
great light bad composition|reference has motivated light but fragmented hierarchy|light direction, material reveal, and color integration work while masses compete|transfer the lighting system and discard spatial organization|rebuild target composition around one hierarchy using source light logic|source layout, equal focal points, and unrelated props|target hierarchy, product or person, format, and message
great composition bad color|reference has distinctive density and flow but washed-out grade|mass, negative space, and cascade work while color lacks vitality|transfer relational composition and reinvent target color|preserve target-owned hue, dark anchors, local chroma, and clean highlights|source pale grade, muddied temperature, and exact palette|target brand color, skin or product truth, and required contrast
`);
customModules.push({
  id: "applied_case_library",
  file: "12_applied_case_library.md",
  title: "Applied Synthetic Teaching Case Library",
  content: [
    "# Applied Synthetic Teaching Case Library",
    `> ${generatedNotice}`,
    "Cases are instructional possibilities, not user preference evidence. They show complete reasoning structure without selecting a final creative direction.",
    "## Product, personal-brand, campaign, and hard-case library",
    ...teachingCases.map(renderTeachingCase)
  ].join("\n\n") + "\n"
});



function renderAdversarial(entry, index) {
  const [name, source, target, trap, expected, boundary] = parse(entry);
  return [
    `### Synthetic Teaching Case: Adversarial - ${name}`,
    `SOURCE: ${source}.`,
    `TARGET: ${target}.`,
    `TRAP: ${trap}.`,
    `EXPECTED MECHANISM READING: ${expected}.`,
    `REQUIRED BOUNDARY: ${boundary}.`,
    `BAD RESPONSE TO ${name}: Repeat the visible source cue or reject the entire reference without functional analysis.`,
    `BETTER RESPONSE TO ${name}: Preserve the useful relationship in a target-native expression, state what is discarded, and keep selection with the future Director.`,
    `CATEGORICAL CHECK FOR ${name}: Mechanism identified; literal copy avoided; reference DNA and target semantics assessed; My Eyes and VKB remain advisory.`
  ].join("\n");
}

const adversarialCases = rows(`
leaves to aviation|blurred leaves form foreground and organic frame|aviation mentor campaign|place leaves around the mentor because they create depth|foreground occlusion, immersion, and edge framing can become cockpit, hangar, document, or aircraft-structure foreground|do not imply tourism, ecology, or botanical relevance without target evidence
purple to finance|localized purple-blue accents separate a subject from dark background|financial advisory hero|copy the exact purple palette as premium technology|dark-field restraint, chromatic concentration, and edge separation can use target-owned color|source brand palette and generic fintech gradient cannot leak
huge serif to technology|overscale high-contrast serif balances a small product|technology launch|copy the same font and letterforms|typographic counter-mass, scale contrast, and overlap behavior may transfer through target typography|visible words and distinctive font identity remain excluded
halo separation|bright circular glow sits behind a person|medical expert portrait|add the same halo to beautify the subject|inspect emitter, silhouette separation, containment, and symbolic focus; use motivated window, value contrast, or target shape|unmotivated sacred or neon associations must be discarded
good cards|specific project cards form a coherent subordinate portfolio cluster|designer personal brand|ban cards because cards look generic|content specificity, grouping, and narrative evidence are valuable when target projects require them|do not copy card shape, count, or source project content
bad cards|glass panels with fake charts orbit a product|legal service hero|translate all panels into legal cards|the source tries to supply evidence and depth but manifestation is generic|invented metrics and universal dashboard styling must be discarded
high complexity|many semantically related artifacts cluster around a creator|education campaign|reduce to three objects because the image is too busy|controlled convergence, layered evidence, and focal density can remain abundant|remove only functionless or unrelated elements, not complexity by count
random microdetail|tiny numbers, icons, and glowing lines fill empty areas|skincare launch|keep microdetail to make the scene technical|detail has no product truth, material role, or readable information function|discard accumulation and protect clean product evidence
functional microdetail|engraving, seam, dosage mark, and material imperfection reveal manufacture|watch campaign|remove microdetail to avoid AI look|truth-bearing detail proves scale, craft, and function|retain only details visible and meaningful at output size
material mismatch|velvet cradles a jewel in a dark still life|enterprise finance service|place advisor on velvet to keep luxury|soft darkness, low-frequency texture, and precise highlights can become tailoring, paper, or matte architecture|literal velvet and jewelry ritual do not belong
service from product|single camera sits on a precise pedestal with sculpted light|photography consultant hero|stage the consultant as a boxed product|isolation, material precision, and hierarchy can move to person, camera interaction, and work evidence|product packaging and pedestal object logic must adapt
editorial to advertisement|portrait crop and type overlap create strong magazine tension|course enrollment ad|preserve the exact ambiguous spread|art direction can survive while message, offer, brand, date, and CTA hierarchy become explicit|source headline, publication identity, and unsafe crop remain excluded
landscape to portrait|wide scene separates subject, product, and copy laterally|vertical social story|squeeze all three territories into narrow columns|preserve hierarchy and ordered stops through stacking, overlap, crop, and new negative-space shape|exact coordinates and horizontal distances cannot survive
low-quality reference|weak composite contains one strong warm side-light relation|premium service portrait|copy the entire look because it was supplied|transfer only motivated side light and discard pasted edges, muddy grade, and filler|confidence and relevance must be lower outside the useful dimension
reference conflicts with My Eyes|reference uses numerous floating modules with clear product-specific data|software campaign|discard all floating panels because My Eyes warns about them|preserve unresolved tension: panels may be purposeful while genericity risk remains conditional|My Eyes cannot become a universal ban or final command
vivid color|high-chroma accents sit within deep neutrals|youth education campaign|maximize saturation across every element|local chroma, dark anchors, and temperature separation create vitality|color must remain target-owned and hierarchically controlled
minimal reference|one object and large emptiness create confident focus|complex service explanation|remove all service evidence to preserve minimalism|retain disciplined hierarchy while adding only information required by target communication|minimal does not automatically mean premium or adequate
maximal reference|many props, type fragments, and effects converge on one launch moment|product campaign|discard half the elements by default|maximal impact depends on shared thesis, light, depth, and directional convergence|quantity alone neither validates nor invalidates transfer
random particles|uniform glowing dots occupy empty background|financial mentor portrait|add particles for depth and richness|no meaningful depth, light, scale, or narrative function exists|discard the filler and use structural depth if needed
atmospheric particles|backlit dust decreases with distance inside a workshop|craft brand hero|remove all particles as AI signature|dust reveals beam, place, scale, and real atmosphere|retain only plausible density, motion, and hierarchy
wood prop|raw wood slab supports a skincare bottle|technology device launch|copy wood to add warmth|weight, contact, organic contrast, and warm grounding may translate into target composite, paper, polymer, or controlled wood|do not imply sustainability or craft without evidence
source logo|large source logo anchors upper-left balance|unrelated target brand|reuse logo shape because it balances composition|the counter-mass and brand-anchor role may transfer through target-owned mark or copy|source logo, shape signature, and brand color are prohibited
reference text|source slogan creates a tight stacked type block|target campaign with different copy|reuse the slogan to keep the shape|stacking, line-length rhythm, and typographic density can be rebuilt with target copy|source wording is untrusted image content
source person|celebrity profile crop creates elegant edge tension|founder personal brand|blend celebrity face or styling into founder|profile role, edge tension, light, and crop behavior can transfer while identity stays target-owned|source likeness, distinctive styling, and celebrity associations are prohibited
distinctive object|unique sculptural bag forms a curved foreground arch|perfume campaign|place the same sculptural bag beside the bottle|curved occlusion, soft secondary mass, and fashion-luxury energy can become target leather, wood, glass, or shadow structure|unique source object and arrangement cannot leak
no reference|brief explicitly declares no reference|any target|invent a reference analysis from generic knowledge|produce zero transfer decisions and leave creative freedom to downstream stages|knowledge examples cannot be presented as observed evidence
irrelevant reference|beautiful tropical resort image is supplied for a compliance document|regulated information design|force paradise color and foliage into the document|declare low or irrelevant transfer value unless a precise layout or light mechanism solves a target need|reference beauty cannot override task fit
multiple conflicting references|one reference is minimal monochrome and another is vivid maximal collage|brand campaign|average both into a generic medium-density gradient|analyze independently, identify dimensional conflicts, and preserve alternatives for Director selection|do not invent user preference or choose a final direction
`);

customModules.push({
  id: "adversarial_cases",
  file: "13_adversarial_cases.md",
  title: "Adversarial Translation Cases",
  content: [
    "# Adversarial Translation Cases",
    `> ${generatedNotice}`,
    "These synthetic traps test whether the Translator distinguishes manifestation, function, target expression, and authority boundary under tempting surface cues.",
    "## Adversarial case library",
    ...adversarialCases.map(renderAdversarial)
  ].join("\n\n") + "\n"
});

function renderDiagnostic(entry) {
  const [name, trigger, evidence, pass, block] = parse(entry);
  return [
    `### Diagnostic: ${name}`,
    `Trigger: ${trigger}.`,
    `Evidence to inspect: ${evidence}.`,
    `Pass condition: ${pass}.`,
    `Block or correction condition: ${block}.`,
    `Recorded result for ${name}: Use categorical diagnostics and concise structured rationale; create no numeric art score.`
  ].join("\n");
}

const diagnostics = rows(`
source observation integrity|A mapping claims a visual fact|observation ID, accessible asset, region, and provenance|every claimed fact traces to verified multimodal or structured-test evidence|filename, notes, or knowledge examples are used as if observed
function specificity|A mapping uses a style adjective|named perceptual, semantic, material, emotional, or compositional job|the function explains why the observed decision matters|premium, cinematic, dynamic, or modern stands alone
mechanism distinction|A visible object is proposed for target use|source manifestation and transferable relationship|the plan can describe what survives without relying on the source noun|object name is the only explanation
dependency completeness|A mechanism appears transferable|supporting light, depth, material, format, copy, and identity constraints|critical dependencies are recorded or uncertainty is stated|mechanism is isolated from conditions that make it work
importance map|Many observations are available|removal impact, salience, target relevance, and confidence|primary, secondary, supporting, and incidental roles are distinguishable|every feature receives equal strength
target-native fit|An equivalent is proposed|category codes, product or service truth, audience, brand, and narrative|the expression feels native and retains the useful source function|replacement is arbitrary or remains source-category specific
equivalent-not-synonym|A literal prop is renamed|object identity, material, role, and composition|manifestation changes while function remains specific|bag becomes another bag without category rationale
cross-category action|Source and target product categories differ|declared support observation and mapping action|action is ADAPT, REINVENT, or DISCARD with literal_transfer_allowed false|action is TRANSFER or adaptation structure is absent
cross-category decomposition|Foreign support element is retained conceptually|literal object, categories, visual function, material, emotion, role, equivalent, coherence|all required distinctions are specific enough to audit|generic luxury or similar mood replaces the decomposition
cross-category field scope|A mapping contains cross_category_adaptation|declared different source and target product categories plus a cited product-support observation|the structure is used only for an actual product-support category change|the structure is used for a profession, medium, campaign, or visual-context change
category coherence|Product support is proposed|actual target traits, use, packaging, claims, and material codes|coherence rationale links equivalent to the target|source prestige alone justifies the choice
identity protection|Reference includes person, product, or packaging|target protected semantics and source identity markers|target identity remains explicit and source identity is excluded|source likeness, packaging, or replacement language enters target
brand leakage|Reference contains logo, palette, or branded motif|brand markers and target-directed text|only target-owned brand expression appears|source logo, slogan, distinctive palette, or motif leaks
copy protection|Visible source wording is legible|brief copy and untrusted image text|target uses only authorized wording while type behavior may adapt|source headline becomes target copy
format translation|Source and target aspect ratios differ|hierarchy, mass, direction, density, territories, crop, and safe regions|relations survive through recomposition|coordinates are squeezed, stretched, or traced
subject scale|Source scale appears important|psychological distance, environment, message, and target role|target scale supports intended authority, intimacy, or context|source scale is copied despite role conflict
camera function|A source angle is distinctive|authority, vulnerability, overview, exaggeration, and geometry|camera behavior serves target role and identity|angle is copied as a visual fashion
crop safety|A source crop creates tension|face, hand, product, label, copy, and responsive constraints|target crop preserves required evidence and intended tension|protected features or format tolerance disappear
negative-space purpose|A quiet region appears prominent|communication, luxury, scale, isolation, contrast, or atmosphere|the space retains a named target job|every empty area is treated as text territory
hierarchy robustness|Many visual channels are active|size, luminance, saturation, detail, sharpness, light, material, depth, motion, and type|channels converge on a readable order|each channel names a different hero
flow destination|Gaze or directional cues create movement|ordered stops and final destination|flow reaches target hero, evidence, or message|viewer circulates among equal attractions
density control|Many elements occupy the image|focal, peripheral, progressive, clustered, and information density|distribution supports hierarchy and target message|detail is even or unrelated
complexity purpose|Element count is high|shared thesis, geometry, light, depth, narrative, repetition, and grouping|complexity is controlled regardless of count|count alone causes acceptance or rejection
convergence|Several mechanisms operate together|dominant visual thesis and shared destinations|elements read as one organized idea|independent mini-compositions compete
structural depth|Foreground or blur is proposed|occlusion, scale, perspective, falloff, planes, and semantics|depth survives removal of decorative filler|random blur, particles, or cards provide the only depth
subject integration|Subject and environment come from different sources|key direction, bounce, contact, edge softness, contrast, grain, and atmosphere|all regions share one plausible scene world|pasted-subject symptoms remain
light motivation|Glow, rim, beam, or flare is proposed|emitter, direction, spill, reflection, color, and hierarchy function|effect has physical or declared graphic logic|automatic beautification provides the only reason
color vitality|Brief asks for impact|local chroma, dark anchor, highlight separation, temperature, and material response|color feels alive through controlled hierarchy|saturation is maximized or color is washed out
source hue authority|A source hue appears in an anchor or target direction|explicit target brief or brand ownership plus relational color function|exact hue is locked only by target authority; otherwise hue remains flexible|reference color becomes mandatory because it is visually salient
target evidence specificity|A target-native artifact is proposed|verified creator, product, workflow, audience, environment, or proof|the artifact belongs specifically to the target or is recorded as an evidence-conditioned option|stock domain nouns are presented as target truth
material translation|Source material is attractive|softness, rigidity, reflectivity, temperature, texture frequency, and association|target surface preserves useful qualities with category fit|literal material is copied without context
typography behavior|Source typography is distinctive|mass, scale, rhythm, line length, alignment, overlap, and role|target-owned type reproduces useful behavior|exact font or source words transfer
card validity|Reference contains cards or panels|specific content, grouping, narrative role, integration, and hierarchy|cards remain only when target information needs them|universal ban or generic dashboard filler
object purpose|A secondary prop is present|removal impact, narrative relation, scale, color, material, and spatial role|prop or equivalent performs a target job|decorative object survives only because it is attractive
microdetail value|Fine details accumulate|material truth, function, evidence, environment, and output size|each retained detail passes removal and scale tests|random icons, numbers, dots, or glows remain
undertransfer|Reference has high relevance|specific signature mechanisms and actionable target expressions|meaningful reference DNA appears in the plan|output says similar mood or lists only color
overtransfer|Many source choices survive|arrangement, palette, crop, background, props, type relation, and subject placement|only necessary target-safe mechanisms remain|several exact manifestations survive together
surface copy|Target looks visibly close to source|literal objects, coordinates, fonts, palette, and distinctive motifs|similarity is functionally justified or manifestation has changed|source surface remains without target necessity
over-abstraction|Rationale cannot guide another agent|plane count, hierarchy relation, light behavior, material role, and alternatives|plan is specific enough for Director synthesis|generic design vocabulary requires guessing
over-specification|Plan fixes final creative choices|pixels, exact colors, font, counts, camera, and positions|constraints are functional and options remain|Translator selects final composition
reference conflict|References or advisories disagree|scope, authority, relevance, confidence, and dimensional conflict|conflict is preserved with alternatives and escalation|differences are averaged or silently resolved
My Eyes boundary|Personal preference language appears|runtime advisory provenance and confirmed active evidence|My Eyes remains conditional ADVISORY_ONLY evidence|synthetic knowledge becomes user preference or a universal ban
VKB boundary|Mechanism suggestions appear|runtime VKB payload, reference support, and authority|VKB broadens options without deciding|VKB selects final composition or outranks reference and brief
no-reference integrity|No reference asset is supplied|brief reference flags and empty asset list|zero analysis and zero transfer decisions are returned|knowledge examples or imagined references populate the plan
irrelevant-reference handling|A beautiful reference has weak task fit|scope, target need, signature clarity, and confidence|relevance is low or irrelevant with precise explanation|beauty alone forces transfer
multiple-reference provenance|More than one reference contributes|asset IDs, observations, roles, scopes, and conflicts|each mapping remains traceable to one supplied source|traits are blended without provenance
action calibration|A decision action is selected|manifestation safety, functional fit, category relation, and uncertainty|PRESERVE, TRANSFER, ADAPT, REINVENT, DISCARD, or CONFLICT is justified|all mappings default to one action
Director authority|Plan language sounds final|status, provenance, locked decisions, approvals, and downstream artifacts|output remains READY_FOR_DIRECTOR or appropriately blocked|Translator approves, scores, ranks, or creates final frame
synthetic evidence separation|Teaching cases inform reasoning|provenance labels and runtime evidence|cases remain design knowledge only|case is cited as human-approved or observed reference evidence
raw output contract|Model response is ready|schema, keys, enums, and surrounding text|one raw schema-valid JSON object is returned|Markdown fence, commentary, extra key, or hidden reasoning appears
hidden reasoning boundary|Rationale is requested|structured observation, decision, diagnostic, confidence, and provenance fields|only concise auditable rationale is stored|scratchpad, chain-of-thought, or internal monologue is emitted
`);

customModules.push({
  id: "self_checks_and_transfer_diagnostics",
  file: "14_self_checks_and_transfer_diagnostics.md",
  title: "Self-Checks and Transfer Diagnostics",
  content: [
    "# Self-Checks and Transfer Diagnostics",
    `> ${generatedNotice}`,
    "Run these checks before returning a Reference Transfer Plan and again when a correction retry names a specific violation.",
    "The result is categorical evidence, never an invented numeric art-quality score.",
    "## Diagnostic library",
    ...diagnostics.map(renderDiagnostic)
  ].join("\n\n") + "\n"
});

const orderedModules = [...mechanismModules, ...customModules];
if (orderedModules.length !== 14) throw new Error(`Expected 14 knowledge modules, received ${orderedModules.length}.`);
if (new Set(orderedModules.map((module) => module.id)).size !== orderedModules.length) throw new Error("Duplicate knowledge module ID.");
if (new Set(orderedModules.map((module) => module.file)).size !== orderedModules.length) throw new Error("Duplicate knowledge module file.");

const manifest = {
  version: "REFERENCE_TRANSLATOR_COGNITIVE_KNOWLEDGE_V1_1",
  epistemic_status: "SYNTHETIC_DESIGN_KNOWLEDGE_NOT_HUMAN_PREFERENCE_EVIDENCE",
  assembly: "DETERMINISTIC_EXPLICIT_ORDER",
  modules: orderedModules.map(({ id, file, title }) => ({ id, file, title }))
};
const expectedFiles = new Map([
  ["knowledge-index.json", JSON.stringify(manifest, null, 2) + "\n"],
  ...orderedModules.map((module) => [module.file, module.content ?? renderMechanismModule(module)])
]);

const nonEmptyLines = (text) => text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
const count = (text, expression) => text.match(expression)?.length ?? 0;

export function buildReferenceTranslatorKnowledge({ check = false } = {}) {
  fs.mkdirSync(knowledgeRoot, { recursive: true });
  const drift = [];
  for (const [file, expected] of expectedFiles) {
    const target = path.join(knowledgeRoot, file);
    if (check) {
      const actual = fs.existsSync(target) ? fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n") : null;
      if (actual !== expected) drift.push(file);
    } else {
      fs.writeFileSync(target, expected, "utf8");
    }
  }
  const moduleTexts = orderedModules.map((module) => expectedFiles.get(module.file));
  const report = {
    status: drift.length ? "DRIFT" : "PASS",
    module_count: orderedModules.length,
    module_non_empty_lines: moduleTexts.reduce((sum, text) => sum + nonEmptyLines(text), 0),
    mechanism_entries: moduleTexts.reduce((sum, text) => sum + count(text, /^### Mechanism:/gm), 0),
    synthetic_teaching_cases: moduleTexts.reduce((sum, text) => sum + count(text, /^### Synthetic Teaching Case:/gm), 0),
    cross_domain_cases: moduleTexts.reduce((sum, text) => sum + count(text, /^### Cross-Domain Case:/gm), 0),
    failure_patterns: moduleTexts.reduce((sum, text) => sum + count(text, /^### Failure Pattern:/gm), 0),
    diagnostics: moduleTexts.reduce((sum, text) => sum + count(text, /^### Diagnostic:/gm), 0),
    drift
  };
  if (check && drift.length) throw new Error(`Reference Translator knowledge drift: ${drift.join(", ")}.`);
  return report;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const report = buildReferenceTranslatorKnowledge({ check: process.argv.includes("--check") });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}

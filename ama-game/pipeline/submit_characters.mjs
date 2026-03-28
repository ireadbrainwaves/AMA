#!/usr/bin/env node
/**
 * SUBMIT CHARACTERS — Generate all species × mutation character variants.
 *
 * Usage:
 *   node pipeline/submit_characters.mjs                    # submit all unsubmitted
 *   node pipeline/submit_characters.mjs gorilla            # submit all gorilla variants
 *   node pipeline/submit_characters.mjs gorilla_base       # submit one specific
 *   node pipeline/submit_characters.mjs --list             # just print what would be generated
 *
 * Writes character IDs to pipeline/character_manifest.json
 * Check with: node pipeline/status_characters.mjs
 * Download with: node pipeline/download_characters.mjs
 */
import fs from 'fs';
import path from 'path';
import { mcp, getText, findUUIDs } from './api.mjs';

const MANIFEST_PATH = path.resolve('pipeline/character_manifest.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch { manifest = {}; }

// ── Species base descriptions + proportions ──────────────────────
const SPECIES = {
  gorilla: {
    base: 'massive cybernetic gorilla, huge broad shoulders, long powerful arms hanging past knees, short thick legs, barrel chest, small head relative to body, hunched forward gorilla posture, dark steel gray skin with metal plating, electric blue cybernetic glowing joints, scarred battle-worn',
    proportions: { type: 'custom', head_size: 0.7, arms_length: 1.8, legs_length: 0.7, shoulder_width: 1.8, hip_width: 0.9 },
    name: 'Cyber Gorilla',
  },
  squid: {
    base: 'alien squid humanoid fighter, tall lean bipedal body, long tentacle arms instead of normal arms, bulbous elongated head, three glowing green eye spots in triangle formation, deep purple skin with toxic green bioluminescent veins, menacing stance',
    proportions: { type: 'custom', head_size: 1.3, arms_length: 1.5, legs_length: 0.9, shoulder_width: 0.8, hip_width: 0.7 },
    name: 'Psycho Squid',
  },
  bee: {
    base: 'humanoid insect bee fighter, armored amber and black exoskeleton, compound red eyes, translucent wings on back, thin waist, stinger tail, antennae on head, buzzing aggressive stance, insectoid warrior',
    proportions: { type: 'custom', head_size: 0.8, arms_length: 1.0, legs_length: 1.0, shoulder_width: 1.0, hip_width: 0.6 },
    name: 'Bee Swarm',
  },
  turtle: {
    base: 'massive armored turtle humanoid, enormous domed shell on back dominating silhouette, thick stumpy legs, wide body, green rough hide with orange shell accents and battle damage, head tucked low, immovable tank stance',
    proportions: { type: 'custom', head_size: 0.6, arms_length: 0.9, legs_length: 0.6, shoulder_width: 1.6, hip_width: 1.4 },
    name: 'Terror Pin Turtle',
  },
  mantis: {
    base: 'insectoid mantis humanoid fighter, angular carapace body, rust orange exoskeleton with dark brown joints, two massive hydraulic pincer arms folded forward, compound eyes, sharp angular silhouette, low grappling stance, part insect part machine',
    proportions: { type: 'custom', head_size: 0.7, arms_length: 1.6, legs_length: 1.1, shoulder_width: 1.0, hip_width: 0.6 },
    name: 'Iron Mantis',
  },
  voltamander: {
    base: 'sleek reptilian salamander humanoid, dark charcoal body, electric cyan bioluminescent markings crackling along skin, long thick tail with capacitor nodes, low crouching stance, sparks arcing between body parts, lightning veins',
    proportions: { type: 'custom', head_size: 0.8, arms_length: 1.0, legs_length: 0.8, shoulder_width: 1.1, hip_width: 0.9 },
    name: 'Voltamander',
  },
  mycelith: {
    base: 'alien fungus humanoid, dense mycelium body mass, large mushroom cap head with spore vents, body covered in fruiting bodies and tendrils, dark brown-gray base with bright green bioluminescent veins, unsettling organic presence',
    proportions: { type: 'custom', head_size: 1.4, arms_length: 1.1, legs_length: 0.8, shoulder_width: 1.0, hip_width: 0.9 },
    name: 'Mycelith',
  },
};

// ── All mutations that can be grafted (from mutations.js) ────────
const MUTATIONS = {
  // Gorilla
  iron_knuckles:        { slot: 'arms',  desc: 'BOTH FISTS have heavy metal plate gauntlets with rivets and pistons, cybernetic knuckle enhancement' },
  berserker_cortex:     { slot: 'head',  desc: 'reinforced cranial dome with metal plates bolted to skull, glowing blue brain implant visible' },
  barrel_chest:         { slot: 'chest', desc: 'ribcage covered in heavy industrial armor plating with exposed bolts and blue accent lights' },
  ground_stomp:         { slot: 'legs',  desc: 'legs have hydraulic piston attachments and shockwave vents at the feet' },
  // Squid
  tentacle_graft:       { slot: 'arms',  desc: 'arms replaced with curling purple tentacles with visible suction cups, alien appendages' },
  psionic_amplifier:    { slot: 'head',  desc: 'enlarged glowing green brain lobe bulging from head, psionic mutation pulsing' },
  chromatophore_cloak:  { slot: 'chest', desc: 'torso covered in iridescent color-shifting chromatophore skin patches' },
  jet_siphon:           { slot: 'legs',  desc: 'bio-propulsion jet tubes attached to lower body and legs, exhaust vents glowing' },
  // Bee
  stinger_arms:         { slot: 'arms',  desc: 'hands replaced with striped amber and black venom stinger blades' },
  swarm_sense:          { slot: 'head',  desc: 'hexagonal amber glowing hive structure growing on head' },
  swarm_redistribution: { slot: 'chest', desc: 'chitin hexagonal honeycomb armor plates covering chest, amber resin between segments' },
  wing_cluster:         { slot: 'legs',  desc: 'extra insect wings sprouting from lower back, translucent with veins' },
  // Turtle
  shell_gauntlets:      { slot: 'arms',  desc: 'arms covered in layered shell plate gauntlets, green and orange scute pattern' },
  iron_dome:            { slot: 'head',  desc: 'head covered by concentric dome helmet made of heavy reinforced shell material' },
  fortress_protocol:    { slot: 'chest', desc: 'massive scute pattern chest plate, orange and green layered shell armor on torso' },
  anchor_legs:          { slot: 'legs',  desc: 'legs transformed into rooted column legs with barnacle-like growths, immovable' },
  // Echomorph
  reactive_membrane:    { slot: 'chest', desc: 'semi-transparent adaptive mercury-like membrane covering chest, shifting surface' },
  mirror_reflex:        { slot: 'arms',  desc: 'arms coated in mirror-surface reflective chrome, light distortion effect' },
  echo_core:            { slot: 'head',  desc: 'pulsing resonance core mounted on head, sound wave emitter, silver white glow' },
  // Hydravine
  regenerative_membrane:{ slot: 'chest', desc: 'vine-covered regenerative tissue growing across chest, dark green with pink-orange veins' },
  thorn_bark:           { slot: 'arms',  desc: 'arms covered in thorny dark bark with sharp wooden spikes growing out' },
  deep_roots:           { slot: 'legs',  desc: 'root tendrils wrapping around legs, organic anchoring roots growing down' },
  // Iron Mantis
  hydraulic_pincers:    { slot: 'arms',  desc: 'arms replaced with enormous hydraulic crushing pincers, rust orange with mechanical joints' },
  compound_eyes:        { slot: 'head',  desc: 'cluster of toxic yellow compound eye lenses covering head, insectoid vision' },
  carapace_plating:     { slot: 'chest', desc: 'chest covered in segmented gunmetal carapace, overlapping insect armor plates' },
  anchor_claws:         { slot: 'legs',  desc: 'feet transformed into heavy digitigrade insect claws with grip spikes' },
  // Voltamander
  spark_arms:           { slot: 'arms',  desc: 'arms crackling with electric energy, cyan lightning arcs between fingers constantly' },
  bioelectric_nodes:    { slot: 'head',  desc: 'bioluminescent electric node cluster growing on head, cyan pulsing lightning' },
  conductive_skin:      { slot: 'chest', desc: 'chest has conductive skin patches with visible electric current flowing beneath' },
  capacitor_tail:       { slot: 'legs',  desc: 'tail has enlarged capacitor segment, amber charge glow, energy storage organ' },
  // Mycelith
  spore_sacs:           { slot: 'arms',  desc: 'bulbous spore sacs growing on arms, bioluminescent green, ready to burst' },
  decomposer_node:      { slot: 'head',  desc: 'decomposer fruiting body growing on head, dark violet mushroom with green glow' },
  cap_shield:           { slot: 'chest', desc: 'hardened mushroom cap shield growing on torso, pale bone color with violet edge' },
  mycelium_network:     { slot: 'legs',  desc: 'spreading mycelium root network growing on legs, tendrils reaching down' },
  // Glass Viper
  glass_fang_graft:     { slot: 'arms',  desc: 'crystalline fang blades growing from arms, semi-transparent glass-like, green venom dripping' },
  refraction_skin:      { slot: 'chest', desc: 'refractive crystalline skin patch on chest, light bending through semi-transparent scales' },
  venom_glands:         { slot: 'head',  desc: 'swollen venom glands growing on head, bright green toxic fluid visible inside' },
  // Null Worm
  void_segment:         { slot: 'chest', desc: 'void-black segment armor on chest absorbing all light, dark energy crackling' },
  null_tooth:           { slot: 'arms',  desc: 'void-energy crystalline fangs growing from arms, dark purple-black, tech-suppressing' },
  absence_lobe:         { slot: 'head',  desc: 'featureless void brain lobe on head, smooth black surface absorbing all light' },
  // Bone Hydra
  hydra_skull:          { slot: 'head',  desc: 'skeletal snake skull growing from head, bone white with glowing red eye sockets' },
  ribcage_armor:        { slot: 'chest', desc: 'exposed ribcage bone armor growing on chest, dark red-maroon ancient bone' },
  bone_claw:            { slot: 'arms',  desc: 'jagged bone claws growing from arms, cracked ancient bone with faint red glow' },
  // Parasitex
  parasitic_link:       { slot: 'head',  desc: 'parasitic neural link on head, squid eye cluster growing from skull' },
  chitin_exoframe:      { slot: 'chest', desc: 'cracked chitin exoskeleton growing on chest, dark red-maroon with bone white joints' },
  parasitic_drain:      { slot: 'arms',  desc: 'parasitic tendrils growing on arms, mixed cybernetic and vine growth, chimera mutation' },
};

const COMMON = {
  body_type: 'humanoid',
  n_directions: 4,
  size: 128,
  outline: 'single color outline',
  shading: 'detailed shading',
  detail: 'high detail',
  view: 'side',
};

const STYLE_TAIL = 'pixel art fighter, intimidating, dark neon gritty';

// ── Build all jobs ───────────────────────────────────────────────
const allJobs = {};

for (const [speciesKey, species] of Object.entries(SPECIES)) {
  // Base (no mutation)
  allJobs[`${speciesKey}_base`] = {
    description: `${species.base}, ${STYLE_TAIL}`,
    name: `${species.name} Base`,
    proportions: JSON.stringify(species.proportions),
    ...COMMON,
  };

  // Each mutation variant
  for (const [mutKey, mut] of Object.entries(MUTATIONS)) {
    const jobKey = `${speciesKey}_${mutKey}`;
    allJobs[jobKey] = {
      description: `${species.base}, MUTATION: ${mut.desc}, ${STYLE_TAIL}`,
      name: `${species.name} + ${mutKey}`,
      proportions: JSON.stringify(species.proportions),
      ...COMMON,
    };
  }
}

// ── Parse args ───────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--list')) {
  console.log(`Total jobs: ${Object.keys(allJobs).length}`);
  for (const [speciesKey] of Object.entries(SPECIES)) {
    const count = Object.keys(allJobs).filter(k => k.startsWith(speciesKey + '_')).length;
    console.log(`  ${speciesKey}: ${count} (1 base + ${count - 1} mutations)`);
  }
  console.log(`\nAll job keys:`);
  Object.keys(allJobs).forEach(k => console.log(`  ${k}`));
  process.exit(0);
}

const filter = args.find(a => !a.startsWith('-'));

// ── Submit ───────────────────────────────────────────────────────
let submitted = 0, skipped = 0, rateLimited = 0;

for (const [jobKey, jobArgs] of Object.entries(allJobs)) {
  // Filter
  if (filter) {
    if (filter.includes('_')) {
      // Exact match: gorilla_base, gorilla_iron_knuckles
      if (jobKey !== filter) continue;
    } else {
      // Species prefix: gorilla → all gorilla variants
      if (!jobKey.startsWith(filter + '_')) continue;
    }
  }

  // Skip if already submitted
  if (manifest[jobKey]?.id) {
    skipped++;
    continue;
  }

  console.log(`SEND  ${jobKey}`);
  try {
    const r = await mcp('create_character', jobArgs);
    const t = getText(r);

    if (t.includes('Rate limit') || t.includes('rate limit') || t.includes('429')) {
      console.log(`  429`);
      rateLimited++;
      continue;
    }

    const ids = findUUIDs(t);
    if (ids.length) {
      manifest[jobKey] = { id: ids[0], status: 'submitted', created: new Date().toISOString() };
      console.log(`  OK  ${ids[0]}`);
      submitted++;
    } else {
      console.log(`  ERR no ID`);
    }
  } catch (e) {
    console.log(`  ERR ${e.message}`);
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`\nDone: ${submitted} submitted, ${skipped} skipped, ${rateLimited} rate-limited`);
console.log(`Total in manifest: ${Object.keys(manifest).length}/${Object.keys(allJobs).length}`);

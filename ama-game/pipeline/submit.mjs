#!/usr/bin/env node
/**
 * SUBMIT — Fire-and-forget job creation.
 *
 * Usage:
 *   node pipeline/submit.mjs                  # submit all unsubmitted jobs
 *   node pipeline/submit.mjs npc_helix        # submit one specific job
 *   node pipeline/submit.mjs --type objects   # submit only objects
 *   node pipeline/submit.mjs --type tilesets  # submit only tilesets
 *
 * Writes job IDs to manifest.json, then exits.
 * If a job already has an ID in the manifest, it's skipped.
 * Rate-limited jobs are logged and skipped (run again later).
 */
import fs from 'fs';
import path from 'path';
import { mcp, getText, findUUIDs } from './api.mjs';

const MANIFEST_PATH = path.resolve('pipeline/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const STYLE = 'dark gritty sci-fi pixel art, deep shadows, limited color palette, high contrast against black background, 16-bit SNES style';
const OBJ_COMMON = { outline: 'single color outline', shading: 'detailed shading', detail: 'high detail' };
const ROOM_STYLE = 'high top-down view, dark sci-fi spaceship interior room, very dark metal floor and walls, nearly black base with subtle colored accent lighting, 16-bit SNES pixel art style, high detail, single room viewed from directly above, no characters';
const ROOM_COMMON = { outline: 'single color outline', shading: 'detailed shading', detail: 'high detail', view: 'high top-down' };
const TILE_COMMON = { tile_size: { width: 32, height: 32 }, outline: 'single color outline', shading: 'basic shading', detail: 'medium detail', view: 'high top-down' };
const SPRITE_TAIL = 'full body visible head to toe, game sprite, transparent background, dark neon pixel art, 16-bit, gritty raw ugly, high contrast neons against near-black';
const SPRITE_STD = { outline: 'single color outline', shading: 'basic shading', detail: 'medium detail', view: 'side' };
const SPRITE_BOSS = { outline: 'single color outline', shading: 'detailed shading', detail: 'high detail', view: 'side' };

// ── Job definitions ──────────────────────────────────────────────
const JOBS = {
  objects: {
    npc_helix: {
      tool: 'create_map_object',
      args: { description: `alien mutation doctor, tall thin insectoid body, dark purple lab coat, bulbous squid-like head, three glowing green eyes in triangle formation, tentacle arms holding a glowing syringe, bioluminescent green accent markings on coat, ${STYLE}`, width: 48, height: 64, view: 'high top-down', ...OBJ_COMMON },
    },
    npc_ark: {
      tool: 'create_map_object',
      args: { description: `robot tech merchant, boxy angular metal body, single large camera eye glowing amber, dark gunmetal gray chassis, mechanical arms with tool attachments, antenna on top with amber light, industrial and slightly rusty, amber accent lights on joints, ${STYLE}`, width: 48, height: 64, view: 'high top-down', ...OBJ_COMMON },
    },
    npc_vex: {
      tool: 'create_map_object',
      args: { description: `alien military commander, armored dark purple uniform with gold trim, cybernetic metallic jaw implant, stern orange glowing eyes, gold rank insignia on shoulders, medal on chest, imposing authoritative stance, battle-worn armor, ${STYLE}`, width: 48, height: 64, view: 'high top-down', ...OBJ_COMMON },
    },
    bio_tank: {
      tool: 'create_map_object',
      args: { description: `sci-fi specimen tank, tall glass cylinder with green glowing fluid inside, dark metal frame and base, tubes and wires, bioluminescent green glow, mutation lab equipment, ${STYLE}`, width: 48, height: 64, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading', detail: 'medium detail' },
    },
    lab_bench: {
      tool: 'create_map_object',
      args: { description: `dark metal laboratory workbench, scattered vials with green glowing liquid, surgical tools, dark surface with green accent lighting underneath, ${STYLE}`, width: 96, height: 48, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading', detail: 'medium detail' },
    },
    weapon_rack: {
      tool: 'create_map_object',
      args: { description: `sci-fi weapon storage rack, dark metal frame holding energy weapons, amber warning lights, industrial military equipment rack, tech workshop, ${STYLE}`, width: 48, height: 64, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading', detail: 'medium detail' },
    },
    tech_workbench: {
      tool: 'create_map_object',
      args: { description: `tech workshop workbench, dark metal surface covered in mechanical parts and tools, soldering equipment, amber desk lamp, cable bundles, oil stains, ${STYLE}`, width: 96, height: 48, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading', detail: 'medium detail' },
    },
    tech_crate: {
      tool: 'create_map_object',
      args: { description: `dark metal cargo crate, military supply box, amber warning label stripe, heavy latches, dented and worn, ${STYLE}`, width: 48, height: 48, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading', detail: 'medium detail' },
    },
    cmd_console: {
      tool: 'create_map_object',
      args: { description: `military tactical command console, dark metal desk with holographic purple display screens, control buttons and switches, purple accent lighting, command bridge equipment, ${STYLE}`, width: 64, height: 64, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading' },
    },
    terminal: {
      tool: 'create_map_object',
      args: { description: `sci-fi computer terminal on pedestal, small screen with cyan data readout, dark metal body, single glowing screen, ${STYLE}`, width: 32, height: 48, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading', detail: 'medium detail' },
    },
    arena_door: {
      tool: 'create_map_object',
      args: { description: `sci-fi arena entrance door frame, heavy dark reinforced metal frame, glowing energy field barrier, red-cyan forcefield effect, hazard stripes, imposing gateway, ${STYLE}`, width: 64, height: 48, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading' },
    },
    holo_display: {
      tool: 'create_map_object',
      args: { description: `holographic tournament bracket display, floating translucent blue hologram projecting from dark metal base, bracket lines and data, cyan glow, ${STYLE}`, width: 96, height: 64, view: 'high top-down', outline: 'selective outline', shading: 'medium shading', detail: 'high detail' },
    },
    player: {
      tool: 'create_map_object',
      args: { description: `sci-fi armored fighter, sleek dark teal combat suit, glowing cyan visor helmet, energy core on chest glowing bright cyan, shoulder pads, armored boots, ready stance facing forward, ${STYLE}`, width: 32, height: 40, view: 'high top-down', ...OBJ_COMMON },
    },
    // === ARENA ELEVATOR ===
    elevator_pad: {
      tool: 'create_map_object',
      args: { description: `sci-fi combat arena launch elevator platform, circular pad with glowing cyan energy ring, dark metal base with hazard markings, holographic fight number display above, heavy reinforced edges, ready to descend into arena, dramatic centerpiece, ${STYLE}`, width: 96, height: 96, view: 'high top-down', ...OBJ_COMMON },
    },
    // === ROOM BACKGROUNDS (cohesive set, same style) ===
    room_mutlab: {
      tool: 'create_map_object',
      args: { description: `dark sci-fi mutation laboratory, top-down flat view like the other rooms, dark metal floor with green bioluminescent veins, specimen tanks along left and right walls, surgical table in center, green glowing tubes and vials, same flat top-down perspective as a command bridge, NOT isometric, dark room with green accent glow`, width: 288, height: 320, ...ROOM_COMMON },
    },
    room_workshop: {
      tool: 'create_map_object',
      args: { description: `dark metal floor texture with amber workshop details, top-down game map tile, workbench marks on floor, cable grooves, tool outlines, amber warning lights, oil stains, industrial tech workshop floor plan, pixel art tilemap style, flat 2D overhead`, width: 288, height: 320, ...ROOM_COMMON },
    },
    room_arena: {
      tool: 'create_map_object',
      args: { description: `dark metal arena viewing gallery floor plan, top-down game map tile, wide corridor with 4 heavy reinforced doorframes in a row along top wall, cyan energy field glow in each doorframe, hazard stripe markings on dark metal floor, viewing windows between doors, combat tournament entrance hall, pixel art tilemap style, flat 2D overhead, dark with cyan accent glow`, width: 400, height: 160, ...ROOM_COMMON },
    },
    room_cmdpost: {
      tool: 'create_map_object',
      args: { description: `dark sci-fi military command post room interior, ${ROOM_STYLE}, purple accent lighting, tactical holographic displays on walls, command console desk in center, military insignia, dark metal with purple trim, bridge of a warship`, width: 352, height: 192, ...ROOM_COMMON },
    },
    room_mainhall: {
      tool: 'create_map_object',
      args: { description: `dark sci-fi spaceship main corridor hallway, ${ROOM_STYLE}, cyan LED strip lighting along floor edges, long rectangular corridor with dark metal walls, ceiling pipes and conduits, minimal and industrial, connecting passage`, width: 352, height: 352, ...ROOM_COMMON },
    },
    room_library: {
      tool: 'create_map_object',
      args: { description: `dark sci-fi library archive room, top-down game map tile, dark metal floor, holographic bookshelves along walls with glowing cyan data tablets, central reading terminal, dim blue ambient light, ancient alien knowledge storage, pixel art tilemap style, flat 2D overhead`, width: 384, height: 320, ...ROOM_COMMON },
    },
    room_specieslab: {
      tool: 'create_map_object',
      args: { description: `dark sci-fi specimen observation lab, top-down game map tile, dark metal floor, glass containment pods along walls showing alien silhouettes, holographic species displays, scanning equipment, cyan and green accent lighting, xenobiology research room, pixel art tilemap style, flat 2D overhead`, width: 384, height: 320, ...ROOM_COMMON },
    },
    room_centralhub: {
      tool: 'create_map_object',
      args: { description: `dark sci-fi spaceship central hub room, top-down game map tile, large open dark metal floor with hexagonal pattern, six corridor exits visible at edges, central holographic navigation pillar with cyan glow, ambient floor lighting, main junction point of space station, pixel art tilemap style, flat 2D overhead`, width: 384, height: 384, ...ROOM_COMMON },
    },
    // === NEW MAP OBJECTS ===
    obj_bookshelf: {
      tool: 'create_map_object',
      args: { description: `sci-fi holographic bookshelf with glowing data tablets, dark metal frame, cyan holographic displays, alien library furniture, ${STYLE}`, width: 64, height: 48, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading' },
    },
    obj_specimen_pod: {
      tool: 'create_map_object',
      args: { description: `glass containment pod with alien specimen silhouette inside, dark metal base, green scanning light, xenobiology display, ${STYLE}`, width: 48, height: 64, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading' },
    },
    obj_nav_pillar: {
      tool: 'create_map_object',
      args: { description: `holographic navigation pillar, tall cylindrical dark metal base with rotating cyan hologram map on top, central hub waypoint marker, ${STYLE}`, width: 64, height: 64, view: 'high top-down', ...OBJ_COMMON },
    },
    obj_reading_terminal: {
      tool: 'create_map_object',
      args: { description: `sci-fi reading terminal desk, dark metal with holographic screen showing alien text, single seat, library study station, cyan glow, ${STYLE}`, width: 64, height: 48, view: 'high top-down', ...OBJ_COMMON, shading: 'medium shading' },
    },
    // === MUTATION OVERLAYS (48x48, transparent bg) ===
    // Gorilla
    mut_iron_knuckles: { tool: 'create_map_object', args: { description: `metal fist plates with rivets and pistons, cybernetic arm enhancement, dark steel with blue glow accents, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_berserker_cortex: { tool: 'create_map_object', args: { description: `reinforced cranial dome with metal plates bolted to skull, cybernetic brain implant, dark steel with blue glow, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_barrel_chest: { tool: 'create_map_object', args: { description: `ribcage armor plating, heavy industrial chest piece, exposed bolts, dark steel with blue accents, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_ground_stomp: { tool: 'create_map_object', args: { description: `hydraulic impact legs, piston-driven feet with shockwave vents, cybernetic leg enhancement, dark steel blue glow, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Squid
    mut_tentacle_graft: { tool: 'create_map_object', args: { description: `curling purple tentacles replacing arms, suction cups visible, alien appendage graft, purple with green bioluminescence, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_psionic_amplifier: { tool: 'create_map_object', args: { description: `enlarged glowing brain lobe on head, pulsing green bioluminescence, psionic mutation, purple and green, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_chromatophore_cloak: { tool: 'create_map_object', args: { description: `color-shifting chromatophore spots across torso, iridescent skin patch, purple with shifting colors, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_jet_siphon: { tool: 'create_map_object', args: { description: `bio-propulsion tubes on lower body, jet exhaust vents on legs, alien propulsion organ, purple green glow, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Bee
    mut_stinger_arms: { tool: 'create_map_object', args: { description: `striped venom stinger blades replacing hands, amber and black chitin, insect weapon arms, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_swarm_sense: { tool: 'create_map_object', args: { description: `hexagonal hive structure on head, glowing amber cells, insect hivemind sensor node, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_swarm_redistribution: { tool: 'create_map_object', args: { description: `chitin hexagonal armor plates on chest, amber resin between segments, honeycomb torso plating, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_wing_cluster: { tool: 'create_map_object', args: { description: `insect wings sprouting from lower back, translucent with veins, buzzing wing cluster mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Turtle
    mut_shell_gauntlets: { tool: 'create_map_object', args: { description: `layered shell plate gauntlets on arms, green and orange scute pattern, heavy armored fists, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_iron_dome: { tool: 'create_map_object', args: { description: `concentric dome helmet, heavy reinforced shell material head armor, green with orange accents, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_fortress_protocol: { tool: 'create_map_object', args: { description: `massive scute pattern chest plate, orange and green layered shell armor on torso, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_anchor_legs: { tool: 'create_map_object', args: { description: `rooted column legs, heavy with barnacle-like growths, immovable anchor leg mutation, green orange, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Echomorph
    mut_reactive_membrane: { tool: 'create_map_object', args: { description: `semi-transparent adaptive membrane on chest, mercury-like shifting surface, silver with rainbow shimmer, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_mirror_reflex: { tool: 'create_map_object', args: { description: `mirror-surface arm coating, reflective metallic arm mutation, silver chrome with light distortion, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_echo_core: { tool: 'create_map_object', args: { description: `pulsing resonance core on head, sound wave emitter, silver white with glowing center, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Hydravine
    mut_regenerative_membrane: { tool: 'create_map_object', args: { description: `vine-covered regenerative tissue on chest, dark green with pink-orange bioluminescent veins, plant growth, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_thorn_bark: { tool: 'create_map_object', args: { description: `thorny bark growing on arms, sharp wooden spikes, dark green vine arms with thorns, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_deep_roots: { tool: 'create_map_object', args: { description: `root tendrils wrapping around legs, organic anchoring roots, dark green with earth tones, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Iron Mantis
    mut_hydraulic_pincers: { tool: 'create_map_object', args: { description: `enormous hydraulic pincers, rust orange interiors, mechanical crushing arms, insect machine hybrid, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_compound_eyes: { tool: 'create_map_object', args: { description: `cluster of toxic yellow eye lenses on head, insectoid compound vision mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_carapace_plating: { tool: 'create_map_object', args: { description: `segmented gunmetal carapace on chest, overlapping insect armor plates, rust orange accents, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_anchor_claws: { tool: 'create_map_object', args: { description: `heavy anchoring claws on feet, digitigrade insect legs with grip spikes, rust orange, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Voltamander
    mut_spark_arms: { tool: 'create_map_object', args: { description: `crackling electric appendages, cyan lightning arcs between fingers, electric arm mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_bioelectric_nodes: { tool: 'create_map_object', args: { description: `bioluminescent node cluster on head, electric cyan pulsing, lightning brain mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_conductive_skin: { tool: 'create_map_object', args: { description: `conductive skin patches on chest, visible electric current flowing beneath, cyan glow, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_capacitor_tail: { tool: 'create_map_object', args: { description: `broad capacitor tail segment, amber charge glow, energy storage tail mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Mycelith
    mut_spore_sacs: { tool: 'create_map_object', args: { description: `bulbous spore sacs on arms, bioluminescent green, ready to burst, fungal arm mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_decomposer_node: { tool: 'create_map_object', args: { description: `decomposer fruiting body on head, dark violet with green glow, mushroom head mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_cap_shield: { tool: 'create_map_object', args: { description: `hardened mushroom cap shield on torso, pale bone with violet edge, fungal chest armor, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_mycelium_network: { tool: 'create_map_object', args: { description: `spreading mycelium root network on legs, tendrils reaching down, fungal leg mutation, green glow, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Glass Viper
    mut_glass_fang: { tool: 'create_map_object', args: { description: `crystalline fang blades on arms, semi-transparent glass-like fangs, green venom dripping, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_refraction_skin: { tool: 'create_map_object', args: { description: `refractive crystalline skin patch on chest, light bending through semi-transparent scales, ghostly, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_venom_glands: { tool: 'create_map_object', args: { description: `swollen venom glands on head, bright green toxic fluid visible inside, snake venom mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Null Worm
    mut_void_segment: { tool: 'create_map_object', args: { description: `void-black segment armor on chest, absorbing light, dark energy crackling, anti-light chest plate, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_null_tooth: { tool: 'create_map_object', args: { description: `void-energy teeth on arms, dark purple-black crystalline fangs, tech-suppressing claws, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_absence_lobe: { tool: 'create_map_object', args: { description: `featureless void brain lobe on head, smooth black absorbing all light, mental void mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Bone Hydra
    mut_hydra_skull: { tool: 'create_map_object', args: { description: `skeletal snake skull on head, bone white with red eye sockets glowing, undead head mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_ribcage_armor: { tool: 'create_map_object', args: { description: `exposed ribcage bone armor on chest, dark red-maroon ancient bone, undead chest plate, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_bone_claw: { tool: 'create_map_object', args: { description: `jagged bone claws on arms, cracked ancient bone with red glow, undead claw mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // Parasitex
    mut_parasitic_link: { tool: 'create_map_object', args: { description: `parasitic neural link on head, squid eye cluster growing from skull, chimera brain mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_chitin_exoframe: { tool: 'create_map_object', args: { description: `cracked chitin exoskeleton on chest, dark red-maroon with bone white joints, parasitic armor, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    mut_parasitic_drain: { tool: 'create_map_object', args: { description: `parasitic tendrils on arms, gorilla-like cybernetic arm mixed with vine growth, chimera arm mutation, ${SPRITE_TAIL}`, width: 48, height: 48, ...SPRITE_STD } },
    // === SPECIES BACK SPRITES (256x256) — 7 playable only ===
    gorilla_back: { tool: 'create_map_object', args: { description: `humanoid cybernetic gorilla fighter seen from behind facing away, massive muscular bipedal body, dark steel gray skin, metal plating visible on back and right arm, electric blue cybernetic accents glowing at joints, broad back muscles, battle-ready stance, ${SPRITE_TAIL}`, width: 256, height: 256, ...SPRITE_STD } },
    squid_back: { tool: 'create_map_object', args: { description: `humanoid alien squid fighter seen from behind facing away, bipedal muscular body, tentacle arms hanging at sides, deep purple skin with toxic green bioluminescent markings on back, bulbous head from behind, ${SPRITE_TAIL}`, width: 256, height: 256, ...SPRITE_STD } },
    bee_back: { tool: 'create_map_object', args: { description: `humanoid bee swarm entity seen from behind facing away, amber yellow and black insect body, translucent wings folded on back, red eyes scattered throughout swarm mass, ragged shifting silhouette, ${SPRITE_TAIL}`, width: 256, height: 256, ...SPRITE_STD } },
    turtle_back: { tool: 'create_map_object', args: { description: `humanoid armored alien turtle fighter seen from behind facing away, massive green shell filling the view, rust orange battle damage marks and cracks, thick legs planted, shell dominates the silhouette, ${SPRITE_TAIL}`, width: 256, height: 256, ...SPRITE_STD } },
    mantis_back: { tool: 'create_map_object', args: { description: `humanoid alien mantis fighter seen from behind facing away, insectoid bipedal frame, rust orange carapace visible from behind, folded wing covers on back, hydraulic pincer arms at sides, dark brown mechanical joints, ${SPRITE_TAIL}`, width: 256, height: 256, ...SPRITE_STD } },
    voltamander_back: { tool: 'create_map_object', args: { description: `humanoid alien salamander fighter seen from behind facing away, sleek dark charcoal reptilian body, electric cyan lightning veins visible running down back and spine, capacitor tail prominent, sparking energy nodes along dorsal ridge, ${SPRITE_TAIL}`, width: 256, height: 256, ...SPRITE_STD } },
    mycelith_back: { tool: 'create_map_object', args: { description: `humanoid alien fungus entity seen from behind facing away, dense mycelium body mass, large mushroom cap head from behind, green bioluminescent veins running down back, spore vents on shoulders releasing particles, dark brown-gray with bright green glow, ${SPRITE_TAIL}`, width: 256, height: 256, ...SPRITE_STD } },
  },
  tilesets: {
    // IMPORTANT: these tiles go UNDER a multiply-blend light map. They must be VERY dark.
    // The light map adds all color/brightness. Bright tiles wash out.
    base_floor: { tool: 'create_topdown_tileset', args: { ...TILE_COMMON, lower_description: 'very dark metal floor panel, nearly black, faint scratched seam lines, industrial spaceship interior, pixel art', upper_description: 'very dark solid metal wall, nearly black, faint rivet details, impassable bulkhead, pixel art' } },
    corridor: { tool: 'create_topdown_tileset', args: { ...TILE_COMMON, lower_description: 'very dark metal floor, nearly black, thin cyan LED strip line recessed in center groove, spaceship corridor, pixel art', upper_description: 'very dark metal wall, nearly black, thin cyan LED accent at base, spaceship corridor wall, pixel art' } },
    hall_floor: { tool: 'create_topdown_tileset', args: { ...TILE_COMMON, lower_description: 'very dark metal floor, nearly black, faint cyan grid line pattern, spaceship main hall, pixel art', upper_description: 'very dark reinforced wall, nearly black, thin cyan trim line, main hall wall, pixel art' } },
    bio_floor: { tool: 'create_topdown_tileset', args: { ...TILE_COMMON, lower_description: 'very dark floor, nearly black, faint green bioluminescent vein cracks in surface, mutation lab, pixel art', upper_description: 'very dark wall, nearly black, faint green glow from embedded specimen tubes, bio lab wall, pixel art' } },
    tech_floor: { tool: 'create_topdown_tileset', args: { ...TILE_COMMON, lower_description: 'very dark floor, nearly black, faint oil stains and cable conduit grooves, amber tint, tech workshop, pixel art', upper_description: 'very dark wall, nearly black, faint amber warning light dots, tool rack silhouettes, workshop wall, pixel art' } },
    cmd_floor: { tool: 'create_topdown_tileset', args: { ...TILE_COMMON, lower_description: 'very dark floor, nearly black, faint purple trim lines, military grade metal, command bridge, pixel art', upper_description: 'very dark wall, nearly black, faint purple holographic display outlines, command post wall, pixel art' } },
    grate: { tool: 'create_topdown_tileset', args: { ...TILE_COMMON, lower_description: 'very dark metal ventilation grate, nearly black, hexagonal mesh pattern, see through to void below, pixel art', upper_description: 'very dark solid metal floor panel, nearly black, transition from grate to solid, pixel art', transition_size: 0.25, transition_description: 'grate edge bolted to solid floor' } },
  },
};

// ── Parse args ───────────────────────────────────────────────────
const args = process.argv.slice(2);
let filterType = null;
let filterName = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type' && args[i + 1]) { filterType = args[++i]; }
  else if (!args[i].startsWith('-')) { filterName = args[i]; }
}

// ── Submit ───────────────────────────────────────────────────────
let submitted = 0, skipped = 0, rateLimited = 0;

for (const [type, jobs] of Object.entries(JOBS)) {
  if (filterType && type !== filterType) continue;
  if (!manifest[type]) manifest[type] = {};

  for (const [name, job] of Object.entries(jobs)) {
    if (filterName && name !== filterName) continue;

    // Skip if already has an ID
    if (manifest[type][name]?.id) {
      console.log(`SKIP  ${type}/${name} — already submitted (${manifest[type][name].id.slice(0, 8)}...)`);
      skipped++;
      continue;
    }

    console.log(`SEND  ${type}/${name}...`);
    try {
      const r = await mcp(job.tool, job.args);
      const t = getText(r);

      if (t.includes('Rate limit') || t.includes('rate limit') || t.includes('429')) {
        console.log(`  429  rate limited — try again later`);
        rateLimited++;
        continue;
      }

      const ids = findUUIDs(t);
      if (ids.length) {
        manifest[type][name] = { id: ids[0], status: 'submitted', created: new Date().toISOString() };
        console.log(`  OK   ${ids[0]}`);
        submitted++;
      } else {
        console.log(`  ERR  no ID returned`);
      }
    } catch (e) {
      console.log(`  ERR  ${e.message}`);
    }
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`\nDone: ${submitted} submitted, ${skipped} skipped, ${rateLimited} rate-limited`);

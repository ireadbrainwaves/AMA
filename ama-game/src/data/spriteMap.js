// Fight screen sprites — side views so fighters face each other
// Player (left side): east.png (facing right toward opponent)
// Opponent (right side): west.png (facing left toward player)
// "front" = player-side sprite, "back" = opponent-side sprite (legacy naming)

// 8-direction sprites for fight screen
import cyberGorillaEast from '../assets/sprites/8dir/cyberGorilla/east.png';
import cyberGorillaWest from '../assets/sprites/8dir/cyberGorilla/west.png';
import psychoSquidEast from '../assets/sprites/8dir/psychoSquid/east.png';
import psychoSquidWest from '../assets/sprites/8dir/psychoSquid/west.png';
import beeSwarmEast from '../assets/sprites/8dir/beeSwarm/east.png';
import beeSwarmWest from '../assets/sprites/8dir/beeSwarm/west.png';
import terrorPinTurtleEast from '../assets/sprites/8dir/terrorPinTurtle/east.png';
import terrorPinTurtleWest from '../assets/sprites/8dir/terrorPinTurtle/west.png';
import ironMantisEast from '../assets/sprites/8dir/ironMantis/east.png';
import ironMantisWest from '../assets/sprites/8dir/ironMantis/west.png';
import voltamanderEast from '../assets/sprites/8dir/voltamander/east.png';
import voltamanderWest from '../assets/sprites/8dir/voltamander/west.png';
import mycelithEast from '../assets/sprites/8dir/mycelith/east.png';
import mycelithWest from '../assets/sprites/8dir/mycelith/west.png';

// Opponent-only species
import echomorphEast from '../assets/sprites/8dir/echomorph/east.png';
import echomorphWest from '../assets/sprites/8dir/echomorph/west.png';
import hydravineEast from '../assets/sprites/8dir/hydravine/east.png';
import hydravineWest from '../assets/sprites/8dir/hydravine/west.png';
import parasitexEast from '../assets/sprites/8dir/parasitex/east.png';
import parasitexWest from '../assets/sprites/8dir/parasitex/west.png';
import glassViperEast from '../assets/sprites/8dir/glassViper/east.png';
import glassViperWest from '../assets/sprites/8dir/glassViper/west.png';
import nullWormEast from '../assets/sprites/8dir/nullWorm/east.png';
import nullWormWest from '../assets/sprites/8dir/nullWorm/west.png';
import boneHydraEast from '../assets/sprites/8dir/boneHydra/east.png';
import boneHydraWest from '../assets/sprites/8dir/boneHydra/west.png';

const SPRITES = {
  cyberGorilla:    { front: cyberGorillaEast,    back: cyberGorillaWest },
  psychoSquid:     { front: psychoSquidEast,      back: psychoSquidWest },
  beeSwarm:        { front: beeSwarmEast,         back: beeSwarmWest },
  terrorPinTurtle: { front: terrorPinTurtleEast,  back: terrorPinTurtleWest },
  ironMantis:      { front: ironMantisEast,       back: ironMantisWest },
  voltamander:     { front: voltamanderEast,      back: voltamanderWest },
  mycelith:        { front: mycelithEast,         back: mycelithWest },
  echomorph:       { front: echomorphEast,        back: echomorphWest },
  hydravine:       { front: hydravineEast,        back: hydravineWest },
  parasitex:       { front: parasitexEast,        back: parasitexWest },
  glassViper:      { front: glassViperEast,       back: glassViperWest },
  nullWorm:        { front: nullWormEast,          back: nullWormWest },
  boneHydra:       { front: boneHydraEast,        back: boneHydraWest },
};

export default SPRITES;

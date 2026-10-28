// The four experiences. Each one owns chapter 4 of its piece (the bag has its own scene, bag.mjs).
//
// Contract of an experience builder: (ctx) => {
//   duration,            seconds of chapter 4; it starts at story time t = 40 and the return chapter follows it
//   group,               THREE.Group added to the stage (metres, origin = QR centre, X = QR right, Y up, Z = reader)
//   caption,             {kick,title,text}: [es,en,ca] arrays, {placeholders} from text.mjs pieceVars
//   cues,                [[soundName, absoluteTime]] (names from sound.mjs)
//   retOff,              [x,y,z] where the return flakes rise from (can be overridden each frame by update)
//   pickables,           meshes that answer taps (name them like the scene's pickables)
//   update(t,time,pf,camera,{waiting,tR}) -> {ghost?:{pos:[x,y,z],a}, retOff?:[x,y,z]}
//                        t = absolute story time, time = wall clock (s), pf = chapter fade 0..1
//   interaction?         {holdAt (s after 40), prompt:[es,en,ca], options:[{id,label:[..],detail:[..],color}],
//                         choice, active(), pointer(type,raycaster)->consumed, choose(id), reset()}
// }
// ctx = {P:{w,d,h}, TABLE, piece, vars, lang, L(key), stage, glow, conTex}
import {plazaExperience} from './exp-plaza.mjs?v=7.0';
import {vialExperience} from './exp-vial.mjs?v=7.0';
import {bordeExperience} from './exp-borde.mjs?v=7.0';

export const EXPERIENCES={plaza:plazaExperience,vial:vialExperience,borde:bordeExperience};

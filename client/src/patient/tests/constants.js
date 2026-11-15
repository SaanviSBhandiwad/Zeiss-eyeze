export const TESTS = ['setup','va','near','np','contrast','color','amsler','astig','pd'];
export const VA    = ['6/60','6/36','6/24','6/18','6/12','6/9','6/6'];
export const VA_PX = [104,72,52,40,30,22,15];
export const NEAR     = ['N24','N18','N14','N12','N10','N8','N6'];
export const NEAR_PX  = [30,24,19,16,13.5,11,9];
export const CONTRAST = [100,50,25,12,6,3];
export const PLATES   = [{n:12,o:[12,17,21]},{n:74,o:[21,74,71]},{n:6,o:[5,8,6]}];
export const TEST_IC  = {setup:'card',va:'mountain',near:'book',np:'ruler',contrast:'tilde',color:'eye',amsler:'list',astig:'spark',pd:'eyes2'};
// Rotation (degrees, clockwise) for the Landolt ring. The ring is DRAWN with its gap on the right at 0 degrees (see LandoltRing in utils.jsx),
// so right=0, down=90, left=180, up=270. Same values as DIRS in shared/engine.js. Covered by gap.test.mjs.
export const DIRS = {right:0,down:90,left:180,up:270};
export const READ_LINES = [
  'The quick brown fox jumps over the lazy dog',
  'Pack my box with five dozen liquor jugs',
  'How vividly the quirky sphinx jumped',
];

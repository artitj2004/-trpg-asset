import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const builds = {
  slim:  { shoulder: 67, chest: 57, waist: 43, hip: 53, thigh: 58, calf: 60, arm: 17, hand: 11 },
  average: { shoulder: 77, chest: 66, waist: 54, hip: 61, thigh: 69, calf: 69, arm: 21, hand: 12 },
  broad: { shoulder: 85, chest: 81, waist: 84, hip: 81, thigh: 83, calf: 75, arm: 27, hand: 13 },
  muscular: { shoulder: 97, chest: 83, waist: 55, hip: 64, thigh: 80, calf: 75, arm: 29, hand: 13 },
  massive: { shoulder: 115, chest: 99, waist: 66, hip: 74, thigh: 95, calf: 86, arm: 37, hand: 14 },
};
const races = {
  human: { skin: '#d9c8ac', outline: '#604b3d', detail: '#a98761', marker: '#916443', rim: '#fff0d8' },
  dyer: { skin: '#e9e7df', outline: '#51454e', detail: '#9d8995', marker: '#7e646f', rim: '#faf2e9' },
};

export function anatomy(race, sex, build, code) {
  const c = races[race];
  const female = sex === 'f';
  const shoulder = build.shoulder * (female ? .90 : 1);
  const chest = build.chest * (female ? .94 : 1);
  const waist = build.waist * (female ? .92 : 1);
  const hip = build.hip + (female ? 12 : 0);
  const thigh = build.thigh + (female ? 8 : 0);
  const calf = build.calf + (female ? 4 : 0);
  const elbow = shoulder + (code === 'massive' ? 36 : 30);
  const wrist = elbow + 15;
  const arm = build.arm;
  const hand = build.hand;
  const head = female ? 43 : 46;
  const muscle = code === 'muscular' || code === 'massive';
  const point = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6.3"/>';
  const armPath = 'M ' + shoulder + ' 169 Q ' + (shoulder+22) + ' 177 ' + (elbow+arm*.60) + ' 260 Q ' + (elbow+arm) + ' 275 ' + (elbow+arm*.74) + ' 295 L ' + (wrist+hand) + ' 348 Q ' + (wrist+hand+2) + ' 358 ' + wrist + ' 372 L ' + (wrist-hand) + ' 359 L ' + (elbow-arm*.67) + ' 289 L ' + (shoulder-arm*.46) + ' 225 Z';
  const torso = 'M -20 154 Q -' + (shoulder*.71) + ' 152 -' + shoulder + ' 169 Q -' + chest + ' 216 -' + (chest-3) + ' 243 Q -' + waist + ' 270 -' + waist + ' 289 Q -' + hip + ' 312 -' + hip + ' 339 Q -' + hip*.81 + ' 357 0 378 Q ' + hip*.81 + ' 357 ' + hip + ' 339 Q ' + hip + ' 312 ' + waist + ' 289 Q ' + waist + ' 270 ' + (chest-3) + ' 243 Q ' + chest + ' 216 ' + shoulder + ' 169 Q ' + shoulder*.71 + ' 152 20 154 Z';
  const leg = 'M 0 348 L ' + hip + ' 330 Q ' + (thigh+5) + ' 395 ' + thigh + ' 454 L ' + (thigh-3) + ' 480 Q ' + calf + ' 529 ' + (calf+10) + ' 575 L ' + (calf-1) + ' 603 L ' + (calf-33) + ' 600 L ' + (calf-39) + ' 550 L 0 414 Z';
  const undeadFace = '<path d="M-36 101q8 13 18 14l-5 10q-11-6-13-24Zm72 0q-8 13-18 14l5 10q11-6 13-24Z" fill="#b9aab4"/><path d="M-32 81q8-9 18-5l5 7q-12 7-23-2Zm64 0q-8-9-18-5l-5 7q12 7 23-2Z" fill="#655660"/><circle cx="-21" cy="81" r="2.8" fill="#e9e7df"/><circle cx="21" cy="81" r="2.8" fill="#e9e7df"/><path d="M-2 99l-3 6h8m-17 15q14-5 28 0m-20-2v4m12-4v4" fill="none" stroke="#73616c" stroke-width="2.6" stroke-linecap="round"/>';
  const ribs = [220,238,255,272].map((y,i) => '<path d="M-' + (chest*(.60-i*.045)) + ' ' + y + ' Q -' + chest*.49 + ' ' + (y+12) + ' 0 ' + (y+12) + ' T ' + chest*(.60-i*.045) + ' ' + y + '"/>').join('');
  const muscleLines = muscle ? '<path d="M-'+ shoulder*.79 +' 178q18 17 13 42M'+ shoulder*.79 +' 178q-18 17-13 42M-'+ thigh*.65 +' 391l-6 52M'+ thigh*.65 +' 391l6 52"/>' : '';
  const femaleContour = female ? '<path d="M-'+ chest*.58 +' 210q8 11 22 11M'+ chest*.58 +' 210q-8 11-22 11"/>' : '';
  const dyerMark = race === 'dyer' ? '<circle cx="25" cy="215" r="11" fill="#825364" stroke="'+c.rim+'" stroke-width="2.2"/><path d="M25 210l4 5-4 5-4-5Z" fill="'+c.rim+'"/>' : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="660" viewBox="-240 0 480 660"><g fill="'+c.skin+'" stroke="'+c.outline+'" stroke-width="5" stroke-linejoin="round"><path d="'+leg+'"/><path d="'+leg+'" transform="scale(-1 1)"/><path d="'+armPath+'"/><path d="'+armPath+'" transform="scale(-1 1)"/><path d="'+torso+'"/><ellipse cy="92" rx="'+head+'" ry="51"/><path d="M-21 143q4-6 13-6H8q9 0 13 6v14L0 172l-21-15Z"/></g><g fill="none" stroke="'+c.detail+'" stroke-width="2.6" stroke-linecap="round"><path d="M0 184v166"/>'+ribs+muscleLines+femaleContour+(race==='human'?'<path d="M-22 113q4 17 22 17t22-17"/>':'')+'</g>'+(race==='dyer'?undeadFace:'')+'<g fill="'+c.marker+'" stroke="'+c.rim+'" stroke-width="1.8">'+[point(0,86),point(0,159),point(0,224),point(0,300),point(0,350),...[-1,1].flatMap(side=>[point(side*elbow,281),point(side*wrist,355),point(side*(thigh-20),478),point(side*(calf-12),583)])].join('')+'</g>'+dyerMark+'</svg>';
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const output = process.argv[2];
  if (!output) throw Error('Pass the anatomy output directory.');
  await fs.mkdir(output, { recursive: true });
  for (const race of Object.keys(races)) {
    for (const sex of ['m', 'f']) {
      for (const [code, build] of Object.entries(builds)) {
        const svg = anatomy(race, sex, build, code);
        await sharp(Buffer.from(svg)).png().toFile(path.join(output, race+'-'+sex+'-'+code+'.png'));
      }
    }
  }
}

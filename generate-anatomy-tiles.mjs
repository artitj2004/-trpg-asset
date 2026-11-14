import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { anatomy, builds } from './generate-anatomy-variants.mjs';

const output = process.argv[2];
if (!output) throw Error('Pass the anatomy tile output directory.');
await fs.mkdir(output, { recursive: true });

const bands = [
  { name: 'head', top: 0, height: 150, states: ['normal', 'missing', 'eye', 'implant', 'fault'] },
  { name: 'arm', top: 150, height: 230, states: ['normal', 'missing', 'hand', 'implant', 'fault'] },
  { name: 'leg', top: 380, height: 280, states: ['normal', 'missing', 'foot', 'implant', 'fault'] },
];
const metal = 'fill="#829692" stroke="#374b48" stroke-width="4" stroke-linejoin="round"';

function drawState(svg, race, band, state, sign, shape, input, code) {
  if (state === 'normal') return svg;
  const female = shape === 'f';
  const shoulder = input.shoulder * (female ? .90 : 1);
  const hip = input.hip + (female ? 12 : 0);
  const thigh = input.thigh + (female ? 8 : 0);
  const calf = input.calf + (female ? 4 : 0);
  const elbow = shoulder + (code === 'massive' ? 36 : 30);
  const wrist = elbow + 15;
  const arm = input.arm;
  const hand = input.hand;
  const outline = race === 'human' ? '#604b3d' : '#51454e';
  const skin = race === 'human' ? '#d9c8ac' : '#e9e7df';
  const paint = `fill="${skin}" stroke="${outline}" stroke-width="5" stroke-linejoin="round"`;
  const group = markup => `<g transform="scale(${sign} 1)">${markup}</g>`;
  const overlay = markup => svg.replace('</svg>',group(markup)+'</svg>');
  const marker = (x,y) => `<circle cx="${x}" cy="${y}" r="10" fill="#b65734" stroke="#fff4df" stroke-width="2"/><path d="M ${x} ${y-5}v6m0 4v1" stroke="#fff4df" stroke-width="2.5" stroke-linecap="round"/>`;
  const removePoint = (x,y) => { svg = svg.replace(`<circle cx="${x}" cy="${y}" r="6.3"/>`,''); };
  const shapePaths = [...svg.matchAll(/<path d="[^"]+"(?: transform="scale\(-1 1\)")?\/>/g)];
  const replaceLimb = (index, markup) => {
    const hit = shapePaths[index + (sign < 0 ? 1 : 0)];
    if (!hit) throw Error('Missing limb path in base drawing');
    svg = svg.replace(hit[0], group(markup));
  };
  if (band === 'head') {
    if (state === 'missing') {
      return svg.replace(/<ellipse cy="92"[^>]+\/>/,'')
        .replace(/<path d="M-21 143[^>]+\/>/,'<path d="M-19 150q19 9 38 0v11L0 173l-19-12Z"/>')
        .replace(/<path d="M-22 113[^>]+\/>/,'')
        .replace(/<path d="M-36 101[\s\S]*?(?=<g fill="#7e646f")/,'')
        .replace('<circle cx="0" cy="86" r="6.3"/>','');
    }
    const eye = state === 'eye'
      ? `<path d="M10 81q10-11 25-4l2 8q-15 10-27-4Z" fill="${outline}"/><path d="m19 87-4 7" stroke="#825364" stroke-width="2"/>`
      : '<circle cx="21" cy="81" r="11" fill="#829692" stroke="#374b48" stroke-width="2.5"/><circle cx="21" cy="81" r="4" fill="#f8dfad"/>';
    return overlay(eye+(state === 'fault' ? marker(48,73) : ''));
  }
  if (band === 'arm') {
    removePoint(sign*elbow,281);
    removePoint(sign*wrist,355);
    if (state === 'missing') {
      replaceLimb(2,`<path d="M ${shoulder-7} 171q24 7 21 27q-3 11-18 13l-11-11Z" ${paint}/><path d="M ${shoulder-4} 205q12-2 15-9" fill="none" stroke="#825364" stroke-width="2.5"/>`);
      return svg;
    }
    if (state === 'hand') {
      replaceLimb(2,`<path d="M ${shoulder} 169 Q ${shoulder+22} 177 ${elbow+arm*.60} 260 Q ${elbow+arm} 275 ${elbow+arm*.74} 295 L ${wrist+hand} 340 Q ${wrist} 351 ${wrist-hand} 341 L ${elbow-arm*.67} 289 L ${shoulder-arm*.46} 225 Z" ${paint}/>`);
      return overlay(`<circle cx="${elbow}" cy="281" r="6.3" fill="${outline}" stroke="#faf2e9" stroke-width="1.8"/>`);
    }
    replaceLimb(2,`<g ${metal}><path d="M ${shoulder-9} 172l22 1 19 32L ${elbow+14} 272l-24 12L ${shoulder-12} 209Z"/><path d="M ${elbow-8} 284l23-8L ${wrist+12} 344l-22 6Z"/><circle cx="${elbow}" cy="281" r="12" fill="#b58b53"/><path d="M ${wrist-11} 346l22-3 9 13-13 14-17-8Z" fill="#b58b53"/></g>`);
    return state === 'fault' ? overlay(marker(elbow+32,268)) : svg;
  }
  removePoint(sign*(calf-12),583);
  if (state === 'missing') {
    removePoint(sign*(thigh-20),478);
    replaceLimb(0,`<path d="M0 348L ${hip} 330 Q ${thigh+5} 395 ${thigh} 418 Q ${thigh*.62} 442 3 427L0 414Z" ${paint}/><path d="M9 430q18 7 ${thigh-19} -4" fill="none" stroke="#825364" stroke-width="2.5"/>`);
    const muscle = `M${sign < 0 ? '-' : ''}${thigh*.65} 391l${sign*6} 52`;
    return svg.replace(muscle,'');
  }
  if (state === 'foot') {
    replaceLimb(0,`<path d="M0 348L ${hip} 330 Q ${thigh+5} 395 ${thigh} 454L ${thigh-3} 480Q ${calf} 529 ${calf+9} 560 Q ${calf-13} 576 ${calf-39} 557L0 414Z" ${paint}/>`);
    return svg;
  }
  removePoint(sign*(thigh-20),478);
  const knee=thigh-20, ankle=calf-12;
  replaceLimb(0,`<g ${metal}><path d="M3 361L ${hip} 336L ${knee+19} 465L ${knee-10} 485L4 414Z"/><path d="M ${knee-10} 485L ${knee+17} 476L ${ankle+14} 577L ${ankle-11} 581Z"/><circle cx="${knee}" cy="478" r="13" fill="#b58b53"/><path d="M ${ankle-12} 578L ${ankle+13} 574L ${ankle+29} 595L ${ankle-15} 601Z" fill="#b58b53"/></g>`);
  return state === 'fault' ? overlay(marker(knee+29,490)) : svg;
}

for (const race of ['human','dyer']) {
  for (const sex of ['m','f']) {
    for (const [code,shape] of Object.entries(builds)) {
      const svg = anatomy(race,sex,shape,code);
      for (const band of bands) {
        for (const [side,sign,left] of [['r',-1,0],['l',1,240]]) {
          for (const state of band.states) {
            const drawing = drawState(svg,race,band.name,state,sign,sex,shape,code);
            const name = [race,sex,code,band.name,side,state].join('-')+'.png';
            await sharp(Buffer.from(drawing))
              .extract({ left, top:band.top, width:240, height:band.height })
              .png({ palette:true, colours:72 }).toFile(path.join(output,name));
          }
        }
      }
    }
  }
}

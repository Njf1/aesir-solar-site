/** Authoring units retain stage two's 5.6 viewport-heights per unit. Extending the end
 * adds scroll distance; it never rescales the accepted Sun/flight/Earth choreography. */
export const SCROLL_VIEWPORTS_PER_UNIT = 5.6;
export const STAGE_THREE_END=2.25;
export const STAGE_FOUR_END=4.08;
export const JOURNEY_END=6.08;
export const CELL_SWITCH=2.38,CELL_EXIT=3.08;
export const CHAPTERS = [
  {id:'source',label:'Source',start:0,end:.16},
  {id:'sun',label:'Sun',start:.16,end:.39},
  {id:'acquire',label:'Acquire the light',start:.39,end:.51},
  {id:'flight',label:'Flight',start:.51,end:.75},
  {id:'earth',label:'Earth',start:.75,end:1},
  {id:'britain',label:'Great Britain',start:1,end:1.49},
  {id:'atmosphere',label:'Through the atmosphere',start:1.49,end:1.65},
  {id:'building',label:'A working roof',start:1.65,end:1.84},
  {id:'array',label:'Across the array',start:1.84,end:2.06},
  {id:'panel',label:'Light meets silicon',start:2.06,end:STAGE_THREE_END},
  {id:'glass',label:'Through the glass',start:2.25,end:2.46},
  {id:'cell',label:'Light becomes power',start:2.46,end:2.82},
  {id:'contacts',label:'Collecting charge',start:2.82,end:3.08},
  {id:'dc',label:'Direct current',start:3.08,end:3.54},
  {id:'inverter',label:'At the inverter',start:3.54,end:3.84},
  {id:'ac',label:'Alternating current',start:3.84,end:STAGE_FOUR_END},
  {id:'entry',label:'Into the business',start:STAGE_FOUR_END,end:4.32},
  {id:'business',label:'Energy, put to work',start:4.32,end:4.84},
  {id:'storage',label:'Optional storage',start:4.84,end:5.15},
  {id:'later',label:'For later use',start:5.15,end:5.40},
  {id:'grid',label:'A connected system',start:5.40,end:5.67},
  {id:'journey',label:'A long journey',start:5.67,end:5.88},
  {id:'aesir',label:'Aesir Solar',start:5.88,end:JOURNEY_END},
] as const;
export const chapterAt=(p:number)=>CHAPTERS.findIndex(c=>p<c.end)===-1?CHAPTERS.length-1:CHAPTERS.findIndex(c=>p<c.end);
export const STILL_VIEWS={sun:.285,earth:.925,britain:1.40,roof:1.76,panel:2.23,cell:2.76,dc:3.40,inverter:4.02,business:4.70,storage:5.09,connected:5.56,aesir:6.03} as const;
export const REGION_SWITCH=1.30, SITE_SWITCH=1.55;

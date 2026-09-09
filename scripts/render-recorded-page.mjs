import {readFile} from 'node:fs/promises';
import {renderRecordedGeneration} from './recorded-generation.mjs';
let data=null;try{data=JSON.parse(await readFile(new URL('../data/premier-composites.json',import.meta.url),'utf8'));}catch{}
process.stdout.write(renderRecordedGeneration(data));

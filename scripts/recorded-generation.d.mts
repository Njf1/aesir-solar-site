import type {Plugin} from 'vite';
export interface RecordedGenerationData {
  siteName:string; location:string; monitoring:string; dateISO:string; dateLabel:string;
  dailyKwh:number; hourlySource:string; hours:Array<{hour:string;valueKwh:number|null}>;
  hourlySumKwh:number; recordedHourCount:number; missingHours:string[];
}
export type RecordedGenerationValidation={ok:true;data:RecordedGenerationData}|{ok:false;errors:Array<{path:string;code:string}>};
export function validateRecordedGeneration(input:unknown):RecordedGenerationValidation;
export function renderRecordedGeneration(input:unknown):string;
export function recordedGenerationPlugin(options?:{dataURL?:URL}):Plugin;

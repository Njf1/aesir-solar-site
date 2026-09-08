import {Vector3,Quaternion,Matrix4} from 'three';
import {HERO_ANCHOR,HERO_NORMAL} from './site-layout.ts';
/** One physical layout drives the raster surface, cutaway geometry and target-cell
 * identity. Dimensions are illustrative; not a manufacturer's cell/module stack. */
export const PANEL={width:1.134,length:2.278,glassWidth:1.085,glassLength:2.229,cols:6,rows:24,marginX:.016,marginZ:.013,gapX:.006,gapZ:.005,centreGap:.010,busFractions:[-.25,0,.25],fingerFractions:[-.38,-.228,-.076,.076,.228,.38]} as const;
export function cellLayout(row:number,col:number){
 if(row<0||row>=PANEL.rows||col<0||col>=PANEL.cols)throw new RangeError('Cell outside module');
 const pitchX=(PANEL.glassWidth-2*PANEL.marginX)/PANEL.cols;
 const pitchZ=(PANEL.glassLength-2*PANEL.marginZ-PANEL.centreGap)/PANEL.rows;
 const x=-PANEL.glassWidth/2+PANEL.marginX+(col+.5)*pitchX;
 const z=-PANEL.glassLength/2+PANEL.marginZ+(row+.5)*pitchZ+(row>=12?PANEL.centreGap:0);
 const width=pitchX-PANEL.gapX,length=pitchZ-PANEL.gapZ;
 return {row,col,x,z,width,length,busXs:PANEL.busFractions.map(f=>x+f*width),fingerZs:PANEL.fingerFractions.map(f=>z+f*length)};
}
export const SELECTED_CELL=cellLayout(11,3),CELL_SCALE=50;
export const PANEL_NORMAL=HERO_NORMAL.clone().normalize(),PANEL_RIGHT=new Vector3(1,0,0),PANEL_DOWN=new Vector3().crossVectors(PANEL_RIGHT,PANEL_NORMAL).normalize();
export const PANEL_ROTATION=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(PANEL_RIGHT,PANEL_NORMAL,PANEL_DOWN));
export const TARGET_CELL_WORLD=HERO_ANCHOR.clone().addScaledVector(PANEL_RIGHT,SELECTED_CELL.x).addScaledVector(PANEL_DOWN,SELECTED_CELL.z);
// 16mm in site space becomes the educational 0.8-unit protective stack. Thickness
// is deliberately enlarged, independently of the 50× lateral scale.
export const CELL_ORIGIN=TARGET_CELL_WORLD.clone().addScaledVector(PANEL_NORMAL,-.016);
export function panelPoint(x:number,y:number,z:number,target=new Vector3()){return target.copy(HERO_ANCHOR).addScaledVector(PANEL_RIGHT,x).addScaledVector(PANEL_NORMAL,y).addScaledVector(PANEL_DOWN,z);}
export function siteToCell(point:Vector3,target=new Vector3()){target.copy(point).sub(CELL_ORIGIN);return target.set(target.dot(PANEL_RIGHT),target.dot(PANEL_NORMAL),target.dot(PANEL_DOWN)).multiplyScalar(CELL_SCALE);}
export function cellToSite(point:Vector3,target=new Vector3()){return target.copy(CELL_ORIGIN).addScaledVector(PANEL_RIGHT,point.x/CELL_SCALE).addScaledVector(PANEL_NORMAL,point.y/CELL_SCALE).addScaledVector(PANEL_DOWN,point.z/CELL_SCALE);}
export function siteDirectionToCell(point:Vector3,target=new Vector3()){return target.set(point.dot(PANEL_RIGHT),point.dot(PANEL_NORMAL),point.dot(PANEL_DOWN)).normalize();}
export function moduleUV(x:number,z:number){return {u:.5+x/PANEL.glassWidth,v:.5-z/PANEL.glassLength};}


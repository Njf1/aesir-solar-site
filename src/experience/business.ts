import * as THREE from 'three';
import {createBusinessInterior} from './interior.ts';
import {BUSINESS_ROUTE,type OperationState} from './business-journey.ts';
import {EnergyFlow} from './energy-flow.ts';
import {BUSINESS_BUDGET,assertBudget} from './budgets.ts';
/** One selective bay in the existing campus, not another building. */
export class BusinessScene {
 readonly group=new THREE.Group();
 readonly asset;
 private flow:EnergyFlow;
 private geometry=new THREE.BoxGeometry(1,1,1);
 private material=new THREE.MeshStandardMaterial({color:0x55696d,roughness:.6,metalness:.4});
 private tray:THREE.InstancedMesh;
 private disposed=false;
 constructor(mobile:boolean){
  this.asset=createBusinessInterior(mobile?'mobile':'desktop');this.group.name='Operating business in the existing west bay';this.group.add(this.asset.group);
  this.flow=new EnergyFlow(BUSINESS_ROUTE,.042,72);this.group.add(this.flow.mesh);
  const parts:[[number,number,number],[number,number,number]][]=[
   [[-39.45,1.75,13.7],[.10,2.06,.16]],[[-38.38,4.64,13.7],[.10,4.55,.16]],
   [[-31.7,6.76,13.60],[13.9,.10,.055]],[[-31.7,6.76,13.80],[13.9,.10,.055]],
  ];
  for(let x=-38;x<=-25;x+=.45)parts.push([[x,6.69,13.7],[.025,.025,.24]]);
  this.tray=new THREE.InstancedMesh(this.geometry,this.material,parts.length);this.tray.name='Supported interior illustrative AC containment';const m=new THREE.Matrix4(),q=new THREE.Quaternion();
  parts.forEach(([p,s],i)=>this.tray.setMatrixAt(i,m.compose(new THREE.Vector3(...p),q,new THREE.Vector3(...s))));this.tray.instanceMatrix.needsUpdate=true;this.tray.computeBoundingBox();this.tray.computeBoundingSphere();this.group.add(this.tray);
  const stats=this.snapshot();assertBudget('business total buffers',stats.geometryBytes,BUSINESS_BUDGET.geometryBytes);assertBudget('business triangles',stats.triangles,BUSINESS_BUDGET.triangles);assertBudget('business draws',stats.drawCalls,BUSINESS_BUDGET.baseDrawCalls);assertBudget('business point lights',stats.pointLights,BUSINESS_BUDGET.practicalLights);assertBudget('business textures',stats.textureBytes,0);
 }
 render(state:OperationState,time:number){if(this.disposed)return;this.asset.render(state,time);this.flow.render(state.entry,time,state.routeOpacity*.75);}
 snapshot(){return{...this.asset.stats,geometryBytes:this.asset.stats.geometryBytes+this.flow.geometryBytes+this.tray.instanceMatrix.array.byteLength+Object.values(this.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(this.geometry.index?.array.byteLength??0),triangles:this.asset.stats.triangles+720+this.tray.count*12,drawCalls:this.asset.stats.drawCalls+2,state:{...this.asset.state}};}
 dispose(){if(this.disposed)return;this.disposed=true;this.flow.dispose();this.asset.dispose();this.tray.dispose();this.geometry.dispose();this.material.dispose();this.group.clear();this.group.removeFromParent();}
}

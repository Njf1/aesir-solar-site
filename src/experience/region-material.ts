import * as THREE from 'three';

/** Original material-only treatment of the already sourced regional geometry.
 * No vertices, coast coordinates, land/water heights, lat/lon or lighting change.
 * The base Standard material retains all Three lighting/output transformations.
 */
export function filterRegionalTerrain(material:THREE.MeshStandardMaterial){
  const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    const match='float terrain=noiseLand(vGround*1.8)*.55+noiseLand(vGround*7.)*.3+noiseLand(vGround*29.)*.15;';
    if(!shader.fragmentShader.includes(match))throw new Error('Regional terrain marker changed');
    shader.fragmentShader=shader.fragmentShader.replace(match,`
vec2 broadDomain=mat2(.94,.34,-.34,.94)*vGround;
float middleFootprint=max(length(dFdx(vGround*7.)),length(dFdy(vGround*7.)));
float detailFootprint=max(length(dFdx(vGround*29.)),length(dFdy(vGround*29.)));
float middle=mix(.5,noiseLand(vGround*7.),1.-smoothstep(.45,1.25,middleFootprint));
float detail=mix(.5,noiseLand(vGround*29.),1.-smoothstep(.40,1.10,detailFootprint));
float terrain=noiseLand(broadDomain*vec2(1.45,2.1))*.55+middle*.3+detail*.15;
`);
  };
  material.customProgramCacheKey=()=>`${previousKey}|aesir-region-filter-v1`;
  material.needsUpdate=true;
}

/** Small deterministic water colour variation only, not invented bathymetry.
 * There is deliberately no shoreline skirt: the existing exact coast remains
 * the silhouette, with water 0.030 regional units below the land. A raised skirt
 * would suggest false topographic depth and add thousands of unnecessary faces.
 */
export function refineRegionalWater(material:THREE.MeshStandardMaterial){
  const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
  material.roughness=.78;material.metalness=.04;
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    shader.vertexShader='varying vec2 vRegionWater;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvRegionWater=position.xy;');
    shader.fragmentShader='varying vec2 vRegionWater;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
#include <color_fragment>
float broadSea=sin(vRegionWater.x*.12+vRegionWater.y*.07)*sin(vRegionWater.y*.18-vRegionWater.x*.04);
diffuseColor.rgb*=.97+broadSea*.035;
`);
  };
  material.customProgramCacheKey=()=>`${previousKey}|aesir-regional-water-v1`;
  material.needsUpdate=true;
}

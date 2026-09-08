import {Vector3,Matrix4} from 'three';
export const EARTH_RADIUS=10;
export const REGION_CENTRE={lat:54,lon:-2};
export const SITE_LOCATION={lat:52.5,lon:-1.85}; // Illustrative Midlands origin, not a surveyed customer address.
const RAD=Math.PI/180;
/** Geographic degrees; matches north-up NASA raster and SphereGeometry rotated Y=+π/2.
 * Greenwich is -Z, 90°E is -X, north is +Y. GeoJSON consumers pass [lon,lat] explicitly. */
export function latLonToEarth(lat:number,lon:number,radius=EARTH_RADIUS,target=new Vector3()){
  const phi=lat*RAD,lambda=lon*RAD,c=Math.cos(phi);
  return target.set(-c*Math.sin(lambda)*radius,Math.sin(phi)*radius,-c*Math.cos(lambda)*radius);
}
export function earthToLatLon(point:Vector3){const n=point.clone().normalize();return {lat:Math.asin(n.y)/RAD,lon:Math.atan2(-n.x,-n.z)/RAD};}
export const LOCAL_UP=latLonToEarth(REGION_CENTRE.lat,REGION_CENTRE.lon,1);
export const LOCAL_EAST=new Vector3(-Math.cos(REGION_CENTRE.lon*RAD),0,Math.sin(REGION_CENTRE.lon*RAD));
export const LOCAL_SOUTH=new Vector3().crossVectors(LOCAL_EAST,LOCAL_UP).normalize();
export const REGION_ORIGIN=latLonToEarth(REGION_CENTRE.lat,REGION_CENTRE.lon);
export const REGION_SCALE=6.371; // Earth radius10 -> regional units of100km.
export const REGION_BASIS=new Matrix4().makeBasis(LOCAL_EAST,LOCAL_UP,LOCAL_SOUTH);
export function earthToRegion(point:Vector3,target=new Vector3()){
  const v=point.clone().sub(REGION_ORIGIN);return target.set(v.dot(LOCAL_EAST),v.dot(LOCAL_UP),v.dot(LOCAL_SOUTH)).multiplyScalar(REGION_SCALE);
}
export function directionToRegion(direction:Vector3,target=new Vector3()){return target.set(direction.dot(LOCAL_EAST),direction.dot(LOCAL_UP),direction.dot(LOCAL_SOUTH)).normalize();}
export function latLonToRegion(lat:number,lon:number,target=new Vector3()){
  // Azimuthal tangent projection from the SAME geographic convention; coast matches globe.
  return earthToRegion(latLonToEarth(lat,lon),target);
}
export const SITE_ORIGIN=latLonToRegion(SITE_LOCATION.lat,SITE_LOCATION.lon);SITE_ORIGIN.y=0;
export const SITE_TRANSITION_SCALE=.04;
export function regionToSite(point:Vector3,target=new Vector3()){return target.copy(point).sub(SITE_ORIGIN).divideScalar(SITE_TRANSITION_SCALE);}
export const SUN_LOCAL=directionToRegion(new Vector3(-18,0,-298).normalize());

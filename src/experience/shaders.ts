export const noise = /* glsl */`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 x){
 vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 float a=mix(hash(i),hash(i+vec3(1,0,0)),f.x);
 float b=mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x);
 float c=mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x);
 float d=mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x);
 return mix(mix(a,b,f.y),mix(c,d,f.y),f.z);
}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<DETAIL;i++){v+=a*noise3(p);p=p*2.07+vec3(11.7,4.8,9.3);a*=.51;}return v;}
`;
export const surfaceVertex = /* glsl */`
varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;
void main(){vLocal=position;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
export const surfaceFragment = /* glsl */`
uniform float uTime;varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;
${noise}
void main(){
 vec3 p=normalize(vLocal);vec3 flow=vec3(uTime*.018,-uTime*.011,uTime*.008);
 float broad=fbm(p*4.+flow);
 vec3 warp=vec3(fbm(p*7.+flow),fbm(p*7.-flow+13.),fbm(p*7.+flow+27.));
 float turbulence=fbm(p*19.+warp*3.8+flow);
 float filaments=1.-abs(noise3(p*90.+warp*11.+flow)-.52)*2.;
 float cells=noise3(p*245.+warp*18.+flow*2.);
 float micro=noise3(p*540.+flow);
 float ridges=pow(clamp(filaments,0.,1.),7.);
 float spots=smoothstep(.62,.78,fbm(p*12.+warp*1.4));
 float facula=pow(turbulence,3.)*2.;
 float heat=clamp(.12+broad*.20+turbulence*.65+ridges*.13+cells*.12+micro*.045-spots*.40,0.,1.);
 vec3 dark=vec3(.18,.018,.002),gold=vec3(1.1,.34,.045),white=vec3(1.65,1.05,.48);
 vec3 color=mix(dark,gold,smoothstep(.15,.62,heat));color=mix(color,white,smoothstep(.64,.91,heat));
 float facing=max(0.,dot(normalize(vNormal),normalize(cameraPosition-vWorld)));
 float limb=pow(1.-facing,6.);
 color*=.73+.27*pow(facing,.3);color+=vec3(1.4,.7,.22)*limb*.85;
 color+=facula*vec3(.35,.18,.06);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
// An additive billboard outside an actual 3D photosphere; radial streamers are not a flat Sun replacement.
export const glowVertex = /* glsl */`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const coronaFragment = /* glsl */`
uniform float uTime;varying vec2 vUv;
${noise}
void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float angle=atan(p.y,p.x);float sunR=.556;float outer=max(0.,r-sunR);
 float mask=smoothstep(sunR-.012,sunR+.004,r);float inner=exp(-outer*62.)*.66;
 float n=fbm(vec3(cos(angle)*13.,sin(angle)*13.,uTime*.025));
 float wisps=pow(n,2.)*exp(-outer*(8.+n*24.));
 float streamers=pow(.5+.5*sin(angle*17.+n*12.),5.)*exp(-outer*13.)*.22;
 float alpha=(inner+wisps*.65+streamers)*mask*(1.-smoothstep(.7,1.,r));
 gl_FragColor=vec4(vec3(1.,.65,.29)*alpha,alpha);
}`;
export const pulseFragment = /* glsl */`
uniform float uOpacity;varying vec2 vUv;
void main(){vec2 p=(vUv-.5)*2.;float core=exp(-length(p)*42.);float halo=exp(-length(p)*9.)*.22;float ray=exp(-abs(p.y)*100.)*exp(-abs(p.x)*4.)*.25;float a=(core+halo+ray)*uOpacity;gl_FragColor=vec4(vec3(1.,.87,.61)*a,a);}`;

export const noise = /* glsl */`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 x){
 vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 float a=mix(hash(i),hash(i+vec3(1,0,0)),f.x),b=mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x);
 float c=mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),d=mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x);
 return mix(mix(a,b,f.y),mix(c,d,f.y),f.z);
}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<DETAIL;i++){v+=a*noise3(p);p=p*2.07+vec3(11.7,4.8,9.3);a*=.51;}return v;}
`;
export const surfaceVertex = /* glsl */`
varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;varying vec2 vUv;
void main(){vUv=uv;vLocal=position;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
export const surfaceFragment = /* glsl */`
uniform float uTime;varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;
${noise}
void main(){
 vec3 p=normalize(vLocal);float time=uTime*.006;
 vec3 drift=vec3(time,-time*.7,time*.2);
 float region=fbm(p*3.5+drift);
 vec3 warp=vec3(fbm(p*6.+drift),fbm(p*6.-drift+13.),fbm(p*6.+drift+27.));
 float activity=fbm(p*13.+warp*2.4+drift);
 // Differential longitudinal flow stretches filament bundles around broad activity areas.
 vec3 direction=normalize(cross(p,vec3(.15,1.,.3)));
 float threads=pow(1.-abs(noise3(p*86.+direction*activity*15.+warp*9.+drift*4.)-.51)*2.,9.);
 float granule=noise3(p*315.+warp*13.+drift*7.);
 float fine=noise3(p*620.+drift*10.);
 float lanes=smoothstep(.28,.65,granule);
 float basin=smoothstep(.58,.74,fbm(p*9.+warp*1.6));
 float hot=pow(clamp(activity*1.14,0.,1.),12.)*.52+threads*.065;
 float heat=clamp(.17+region*.21+activity*.35+lanes*.14+fine*.055-basin*.31+hot,0.,1.);
 vec3 ember=vec3(.28,.045,.006),gold=vec3(1.16,.34,.066),ivory=vec3(2.6,1.92,1.05);
 vec3 color=mix(ember,gold,smoothstep(.13,.66,heat));
 color=mix(color,ivory,pow(smoothstep(.66,.91,heat),3.));
 float facing=max(0.,dot(normalize(vNormal),normalize(cameraPosition-vWorld)));
 color*=.55+.45*pow(facing,.24);
 color+=vec3(1.2,.51,.14)*pow(1.-facing,8.)*.6;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const glowVertex = /* glsl */`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const coronaFragment = /* glsl */`
uniform float uTime;varying vec2 vUv;
${noise}
void main(){
 vec2 p=(vUv-.5)*2.;float r=length(p);float angle=atan(p.y,p.x);float edge=.5;float outer=max(0.,r-edge);
 float flow=angle+outer*.55+sin(angle*3.+uTime*.012)*.07;
 float strands=fbm(vec3(cos(flow)*17.,sin(flow)*17.,outer*5.-uTime*.012));
 float broad=.55+.45*pow(abs(cos(flow-.25)),3.);
 float rays=pow(strands,3.)*exp(-outer*11.)*broad;
 float glow=exp(-outer*72.)*.5+exp(-outer*14.)*.045;
 float a=(glow+rays*.8)*smoothstep(edge-.006,edge+.006,r)*(1.-smoothstep(.75,1.,r));
 gl_FragColor=vec4(vec3(1.,.63,.23)*a,a);
}`;
export const prominenceVertex = /* glsl */`
uniform float uTime;uniform float uSeed;varying vec2 vUv;
void main(){vUv=uv;vec3 p=position;float weight=sin(uv.x*3.14159265);p+=normal*sin(uTime*.20+uv.x*8.+uSeed)*.05*weight;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
export const prominenceFragment = /* glsl */`
uniform float uTime;uniform float uSeed;uniform float uOpacity;varying vec2 vUv;
void main(){float flow=.65+.35*sin(vUv.x*24.-uTime*.48+uSeed);float edge=.5+.5*sin(vUv.y*6.283);float a=(.35+.65*flow)*edge*uOpacity;gl_FragColor=vec4(vec3(2.0,.58,.08)*a,a);}`;
export const pulseFragment = /* glsl */`
uniform float uOpacity;varying vec2 vUv;
void main(){vec2 p=(vUv-.5)*2.;float core=exp(-length(p)*50.);float halo=exp(-length(p)*10.)*.14;float ray=exp(-abs(p.y)*90.)*exp(-abs(p.x)*5.)*.2;float a=(core+halo+ray)*uOpacity;gl_FragColor=vec4(vec3(1.,.89,.64)*a,a);}`;
export const trailVertex = /* glsl */`
attribute float aAlong;varying float vAlong;varying vec2 vUv;
void main(){vAlong=aAlong;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const trailFragment = /* glsl */`
uniform float uOpacity;varying float vAlong;varying vec2 vUv;
void main(){float taper=pow(1.-vAlong,3.5)*(1.-smoothstep(.45,.85,vAlong));float edge=pow(sin(vUv.y*3.14159265),.6);float a=taper*edge*uOpacity;gl_FragColor=vec4(vec3(1.,.77,.4)*a,a);}`;
export const earthFragment = /* glsl */`
uniform sampler2D uDay;uniform sampler2D uClouds;uniform vec3 uLight;uniform float uTime;uniform float uOpacity;
varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;
void main(){
 vec3 n=normalize(vNormal),v=normalize(cameraPosition-vWorld),l=normalize(uLight);
 vec3 map=texture2D(uDay,vUv).rgb;
 float light=dot(n,l);float day=smoothstep(-.12,.24,light);
 float ocean=smoothstep(1.05,1.6,(map.b+.002)/(map.r+.002))*smoothstep(.85,1.2,(map.b+.002)/(map.g+.002));
 float cloud=texture2D(uClouds,vUv+vec2(uTime*.000008-.0015,-.001)).r;
 vec3 color=map*(.06+max(0.,light)*1.17)*mix(1.,.76,cloud*.65);
 color=mix(color,color*vec3(.65,1.08,1.35)+vec3(.003,.013,.035)*day,ocean*.7);
 float spec=pow(max(0.,dot(n,normalize(l+v))),95.)*ocean*.4;
 color+=vec3(.5,.7,1.)*spec;
 float fresnel=pow(1.-max(0.,dot(n,v)),3.8);
 color+=vec3(.075,.28,.65)*fresnel*day*.65;
 gl_FragColor=vec4(color,uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const cloudFragment = /* glsl */`
uniform sampler2D uClouds;uniform vec3 uLight;uniform float uTime;uniform float uOpacity;varying vec2 vUv;varying vec3 vNormal;
void main(){float density=texture2D(uClouds,vUv+vec2(uTime*.000008,0.)).r;float a=smoothstep(.15,.85,density)*.88;float light=max(0.,dot(normalize(vNormal),normalize(uLight)));vec3 color=vec3(.9,.96,1.)*(.10+light*1.4);gl_FragColor=vec4(color,a*uOpacity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export const atmosphereFragment = /* glsl */`
uniform vec3 uLight;uniform float uOpacity;varying vec3 vWorld;varying vec3 vNormal;
void main(){vec3 n=normalize(vNormal),v=normalize(cameraPosition-vWorld);float rim=pow(max(0.,1.-abs(dot(n,v))),4.5);float day=smoothstep(-.2,.5,dot(n,normalize(uLight)));float a=rim*day*.46*uOpacity;gl_FragColor=vec4(vec3(.10,.40,1.)*a,a);}`;

export const cloudTransitionFragment=/* glsl */`
uniform float uTime;uniform float uOpacity;uniform float uKind;varying vec2 vUv;
#define DETAIL 4
${noise}
void main(){if(uKind>.5){float sweep=exp(-pow((vUv.x+vUv.y*.35-.35-uOpacity*.50)/.22,2.));vec3 c=uKind<1.5?mix(vec3(.12,.23,.32),vec3(.80,.90,.97),sweep):mix(vec3(.045,.07,.09),vec3(.19,.26,.30),sweep*.35);float alpha=mix(uOpacity,1.,smoothstep(.80,.98,uOpacity));gl_FragColor=vec4(c,alpha);return;}vec2 uv=vUv+vec2(uTime*.002,0.);float n=fbm(vec3(uv*5.,uTime*.009));float billow=smoothstep(.18,.8,n);float a=smoothstep(0.,.85,uOpacity)*(mix(.35,1.,billow));a=mix(a,1.,smoothstep(.80,.98,uOpacity));vec3 color=mix(vec3(.58,.72,.81),vec3(.92,.95,.94),billow);gl_FragColor=vec4(color,a);}`;

import * as THREE from 'three';
import { PANEL, SELECTED_CELL, CELL_SCALE, cellLayout } from './panel-layout.ts';

/** Original generic crystalline-silicon teaching cutaway, authored 2026-09-08.
 * No downloaded models, maps, canvas textures or source diagrams.
 * The enlarged layer depth is illustrative, not a manufacturer's construction.
 * Local +Y is the module normal; +X right; +Z south. Root owns camera/light/guide.
 */
export interface CellState {
  section: number;
  absorption: number;
  extraction: number;
  incident: number;
}

export const CELL_ABSORPTION = new THREE.Vector3(-.9, 0, 0);
const W = SELECTED_CELL.width * CELL_SCALE;
const D = SELECTED_CELL.length * CELL_SCALE;
const CX = -SELECTED_CELL.x * CELL_SCALE;
const CZ = -SELECTED_CELL.z * CELL_SCALE;
const GLASS_W = PANEL.glassWidth * CELL_SCALE;
const GLASS_D = PANEL.glassLength * CELL_SCALE;
const LEFT = CX - GLASS_W / 2, RIGHT = CX + GLASS_W / 2;
const NORTH = CZ - GLASS_D / 2, SOUTH = CZ + GLASS_D / 2;

const smooth = (a: number, b: number, t: number) => {
  const x = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
const finite01 = (value: number) => Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;

const fieldVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const absorptionFragment = /* glsl */ `
varying vec2 vUv;
uniform float uAbsorption;
uniform float uExtraction;
uniform float uTime;
void main() {
  vec2 p = (vUv - .5) * 2.;
  float r = length(p);
  float event = smoothstep(0., .18, uAbsorption) * (1. - smoothstep(.36, .90, uAbsorption));
  float settled = smoothstep(.20, .72, uAbsorption) * (.18 + .08 * uExtraction);
  float radius = .055 + .40 * smoothstep(.05, .82, uAbsorption);
  float ring = exp(-pow((r - radius) / .026, 2.));
  float centre = exp(-r * r * 110.);
  float reservoir = exp(-r * r * 12.);
  float alpha = (event * (centre * .8 + ring * .52) + settled * reservoir);
  alpha *= .975 + .025 * sin(uTime * .7);
  if (alpha < .003) discard;
  vec3 color = mix(vec3(.82, .91, 1.), vec3(.94, .97, 1.), event);
  gl_FragColor = vec4(color, alpha);
}`;
const collectionVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const collectionFragment = /* glsl */ `
varying vec2 vUv;
uniform float uExtraction;
uniform float uVisible;
uniform float uTime;
uniform vec3 uColor;
void main() {
  float position = mix(-.09, 1.09, uExtraction);
  float leading = 1. - smoothstep(position - .07, position + .07, vUv.x);
  float present = smoothstep(.01, .15, uExtraction);
  // Broad modulation describes extraction; it is not a labelled particle or speed.
  float modulation = .85 + .15 * sin(vUv.x * 14. - uTime * .75);
  float rounded = .52 + .48 * pow(sin(vUv.y * 3.14159265), 2.);
  float alpha = uVisible * leading * present * rounded * modulation;
  if(alpha < .003) discard;
  gl_FragColor = vec4(uColor, alpha);
}`;

export class CellScene {
  readonly group = new THREE.Group();
  readonly absorptionPoint = CELL_ABSORPTION.clone();
  readonly frontCollection = new THREE.Vector3(0, .09, -D / 2 - .30);
  readonly rearCollection = new THREE.Vector3(W / 2 - .12, -.62, D * .41);
  readonly junction = new THREE.Vector3(CX, (-.020 - .042) * CELL_SCALE, CZ - .28 * CELL_SCALE);
  private geometries = new Set<THREE.BufferGeometry>();
  private materials = new Set<THREE.Material>();
  private prepared = false;
  private disposed = false;
  private mobile = false;
  private box!: THREE.BoxGeometry;
  private selectedBody!: THREE.Mesh;
  private selectedBus!: THREE.InstancedMesh;
  private selectedFingers!: THREE.InstancedMesh;
  private sectionFace!: THREE.Mesh;
  private glass!: THREE.InstancedMesh;
  private encapsulant!: THREE.InstancedMesh;
  private absorptionMaterial!: THREE.ShaderMaterial;
  private frontMaterial!: THREE.ShaderMaterial;
  private rearMaterial!: THREE.ShaderMaterial;
  private matrix = new THREE.Matrix4();
  private position = new THREE.Vector3();
  private size = new THREE.Vector3();
  private identity = new THREE.Quaternion();
  private lastSection = -1;
  private state: CellState = { section: 0, absorption: 0, extraction: 0, incident: 0 };

  static prepare(mobile = false) { return new CellScene().prepare(mobile); }

  prepare(mobile = false) {
    if (this.disposed) throw new Error('cell-disposed');
    if (this.prepared) return this;
    this.prepared = true; this.mobile = mobile;
    this.group.name = 'Original silicon cell section — same selected module';
    this.box = this.geometry(new THREE.BoxGeometry(1, 1, 1));
    const backing = this.material(new THREE.MeshStandardMaterial({ color: 0x10191f, roughness: .64, metalness: .25 }));
    const frame = this.material(new THREE.MeshStandardMaterial({ color: 0xa6b7c0, roughness: .29, metalness: .78 }));
    const silicon = this.siliconMaterial(false);
    const contextSilicon = this.siliconMaterial(true);
    const contact = this.material(new THREE.MeshStandardMaterial({ color: 0xb3c4ce, roughness: .27, metalness: .73 }));
    const fineContact = this.material(new THREE.MeshStandardMaterial({ color: 0x8499a7, roughness: .33, metalness: .62 }));
    const rearContact = this.material(new THREE.MeshStandardMaterial({ color: 0x82929b, roughness: .43, metalness: .63 }));
    const junctionBand = this.material(new THREE.MeshStandardMaterial({ color: 0x536c83, roughness: .45, metalness: .15 }));
    const rubber = this.material(new THREE.MeshStandardMaterial({ color: 0x20282c, roughness: .82, metalness: .03 }));

    // Full selected-module silhouette. Heights of frame/back match the exterior
    // after site-to-cell conversion; only the exposed teaching layers are enlarged.
    this.block('Full module backing', backing, CX, -1.5, CZ, PANEL.width * CELL_SCALE, 1.5, PANEL.length * CELL_SCALE);
    const frames = this.instances('Continuous module frame', frame, 4);
    for (const [i, side] of [-1, 1].entries()) {
      this.set(frames, i, CX + side * (PANEL.width / 2 - .012) * CELL_SCALE, -.35, CZ, .024 * CELL_SCALE, .044 * CELL_SCALE, PANEL.length * CELL_SCALE);
      this.set(frames, i + 2, CX, -.35, CZ + side * (PANEL.length / 2 - .012) * CELL_SCALE, (PANEL.width - .048) * CELL_SCALE, .044 * CELL_SCALE, .024 * CELL_SCALE);
    }
    frames.instanceMatrix.needsUpdate = true;

    // Neighboring cells continue to the actual module edge. Their matching grid
    // is a procedural material detail; only the selected cell owns contact meshes.
    const neighbors = this.instances('143 neighboring silicon cells', contextSilicon, PANEL.rows * PANEL.cols - 1);
    let instance = 0;
    for (let row = 0; row < PANEL.rows; row++) for (let col = 0; col < PANEL.cols; col++) {
      if (row === SELECTED_CELL.row && col === SELECTED_CELL.col) continue;
      const cell = cellLayout(row, col);
      this.set(neighbors, instance++, (cell.x - SELECTED_CELL.x) * CELL_SCALE, -.30, (cell.z - SELECTED_CELL.z) * CELL_SCALE, cell.width * CELL_SCALE, .60, cell.length * CELL_SCALE);
    }
    neighbors.instanceMatrix.needsUpdate = true;
    this.selectedBody = this.block('Selected silicon absorber', silicon, 0, -.30, 0, W, .60, D);
    this.block('Selected rear collecting contact', rearContact, 0, -.66, 0, W * .985, .065, D * .985);
    this.sectionFace = this.block('Thin junction at section face — exaggerated', junctionBand, 0, -.092, D / 2, W, .042, .014);
    this.selectedBus = this.instances('Selected cell front busbars', contact, PANEL.busFractions.length);
    this.selectedFingers = this.instances('Selected cell contact fingers', fineContact, PANEL.fingerFractions.length);
    // A short continuation of the centre bus is an interconnection cue, not a
    // rated terminal or an invented single-wire installation schematic.
    this.block('Front collection continuation', contact, 0, .035, -D / 2 - .14, .048, .038, .31);

    // Four contiguous pieces form a rectangular sectional aperture. Nothing
    // floats away from the module. The closed state has no aperture or gap.
    const glassMaterial = this.material(new THREE.MeshPhysicalMaterial({
      color: 0xc9dbe8, roughness: .16, metalness: .02, clearcoat: .88,
      clearcoatRoughness: .13, opacity: .13, transparent: true,
      depthWrite: false, side: THREE.FrontSide,
    }));
    const encapsulantMaterial = this.material(new THREE.MeshStandardMaterial({
      color: 0xbfd4de, roughness: .40, metalness: 0,
      opacity: .045, transparent: true, depthWrite: false,
    }));
    this.glass = this.instances('Protective glass with sectional opening', glassMaterial, 4);
    this.encapsulant = this.instances('Encapsulant with sectional opening', encapsulantMaterial, 4);
    this.glass.renderOrder = 3; this.encapsulant.renderOrder = 2;
    this.glass.castShadow = false; this.encapsulant.castShadow = false;

    // The event is a local field response, never the old photon recoloured.
    this.absorptionMaterial = this.material(new THREE.ShaderMaterial({
      vertexShader: fieldVertex, fragmentShader: absorptionFragment,
      uniforms: { uAbsorption: { value: 0 }, uExtraction: { value: 0 }, uTime: { value: 0 } },
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    const fieldGeometry = this.geometry(new THREE.PlaneGeometry(3.5, 3.5));
    const response = new THREE.Mesh(fieldGeometry, this.absorptionMaterial);
    response.name = 'Local absorption response — illustrative';
    response.rotation.x = -Math.PI / 2;
    response.position.copy(this.absorptionPoint); response.position.y = .048;
    response.renderOrder = 4; this.group.add(response);

    this.frontMaterial = this.collectionMaterial(0xc5e4f2, false);
    this.rearMaterial = this.collectionMaterial(0x9ac9dd, true);
    this.collection('Front current collection overlay', [
      [-.9, .055, 0], [-.66, .078, -.20], [-.20, .083, -.34],
      [0, .083, -.43], [0, .083, -D * .38], [0, .09, -D / 2 - .30],
    ], this.frontMaterial, .034);
    this.collection('Rear current collection overlay', [
      [-.9, .016, 0], [-.72, -.13, .19], [-.37, -.36, D * .24],
      [.18, -.615, D * .41], [W * .24, -.62, D * .41], [W / 2 - .12, -.62, D * .41],
    ], this.rearMaterial, .037);

    // Proxy underside is registered to the existing hero module's junction and
    // both leads, allowing the owner to match the return to the exterior scene.
    this.block('Same module underside junction proxy', backing, this.junction.x, this.junction.y, this.junction.z, .14 * CELL_SCALE, .035 * CELL_SCALE, .105 * CELL_SCALE);
    for (const side of [-1, 1]) {
      const p = (x: number, y: number, z: number) => new THREE.Vector3(CX + x * CELL_SCALE, (y - .042) * CELL_SCALE, CZ + z * CELL_SCALE);
      const curve = new THREE.CatmullRomCurve3([
        p(side * .035, -.038, -.29), p(side * .13, -.07, -.36),
        p(side * .19, -.105, -.11), p(side * .09, -.13, .10),
      ]);
      const g = this.geometry(new THREE.TubeGeometry(curve, 16, .004 * CELL_SCALE, 5, false));
      const cable = new THREE.Mesh(g, rubber); cable.name = 'Same module underside lead proxy';
      this.group.add(cable);
    }
    this.render(this.state, 0);
    const budget = this.snapshot();
    if (budget.geometryBytes > 250_000 || budget.triangles > 15_000 || budget.baseDrawCalls > 25) {
      this.dispose(); throw new Error(`Cell budget exceeded: ${JSON.stringify(budget)}`);
    }
    return this;
  }

  render(next: CellState, ambientTime: number) {
    if (!this.prepared || this.disposed) return;
    this.state.section = finite01(next.section);
    this.state.absorption = finite01(next.absorption);
    this.state.extraction = finite01(next.extraction);
    this.state.incident = finite01(next.incident);
    const section = smooth(0, 1, this.state.section);
    if (section !== this.lastSection) {
      this.lastSection = section;
      this.sectionGeometry(section);
    }
    const time = Number.isFinite(ambientTime) ? ambientTime : 0;
    this.absorptionMaterial.uniforms.uAbsorption.value = this.state.absorption;
    this.absorptionMaterial.uniforms.uExtraction.value = this.state.extraction;
    this.absorptionMaterial.uniforms.uTime.value = time;
    this.frontMaterial.uniforms.uExtraction.value = this.state.extraction;
    this.frontMaterial.uniforms.uTime.value = time;
    this.frontMaterial.uniforms.uVisible.value = .48 * smooth(.15, .55, section);
    this.rearMaterial.uniforms.uExtraction.value = this.state.extraction;
    this.rearMaterial.uniforms.uTime.value = time;
    // Rear channel is a deliberately subdued sectional overlay through the
    // opaque wafer. It is not an exposed wire passing through the silicon.
    this.rearMaterial.uniforms.uVisible.value = .29 * smooth(.25, .80, section);
  }

  private sectionGeometry(section: number) {
    // Reveal an aperture over only this cell, with the rest of the full module
    // intact. Four boxes meet exactly at section=0; tiny zero-area sides do not draw.
    const holeW = (W + .20) * section;
    const holeD = (D + .28) * section;
    this.aperture(this.glass, holeW, holeD, .575, .45);
    this.aperture(this.encapsulant, holeW, holeD, .175, .35);
    // Remove a foreground slice rather than floating the cell's layers apart.
    // Origin and the incident target remain inside the exposed silicon surface.
    const edge = D * (.5 - .27 * section);
    const depth = D / 2 + edge;
    const centre = (edge - D / 2) / 2;
    this.selectedBody.position.z = centre;
    this.selectedBody.scale.z = depth;
    this.sectionFace.position.z = edge + .008;
    this.sectionFace.visible = section > .002;
    const busXs = SELECTED_CELL.busXs;
    for (let i = 0; i < busXs.length; i++) {
      this.set(this.selectedBus, i, (busXs[i] - SELECTED_CELL.x) * CELL_SCALE, .021, centre, .041, .032, depth - .025);
    }
    const fingers = SELECTED_CELL.fingerZs;
    for (let i = 0; i < fingers.length; i++) {
      const z = (fingers[i] - SELECTED_CELL.z) * CELL_SCALE;
      const shown = z < edge - .014;
      this.set(this.selectedFingers, i, 0, .016, z, shown ? W - .035 : 0, .018, .012);
    }
    this.selectedBus.instanceMatrix.needsUpdate = true;
    this.selectedFingers.instanceMatrix.needsUpdate = true;
  }

  private aperture(mesh: THREE.InstancedMesh, width: number, depth: number, y: number, thickness: number) {
    if (width < .000001 || depth < .000001) {
      // One unbroken pane at the exact closed state: adjacent transparent boxes
      // would otherwise expose their internal faces as a dark seam at entry.
      mesh.count = 1;
      this.set(mesh, 0, CX, y, CZ, GLASS_W, thickness, GLASS_D);
      for (let i = 1; i < 4; i++) this.set(mesh, i, 0, 0, 0, 0, 0, 0);
      mesh.instanceMatrix.needsUpdate = true;
      return;
    }
    mesh.count = 4;
    const x0 = -width / 2, x1 = width / 2, z0 = -depth / 2, z1 = depth / 2;
    this.set(mesh, 0, CX, y, (NORTH + z0) / 2, GLASS_W, thickness, z0 - NORTH);
    this.set(mesh, 1, CX, y, (z1 + SOUTH) / 2, GLASS_W, thickness, SOUTH - z1);
    this.set(mesh, 2, (LEFT + x0) / 2, y, 0, x0 - LEFT, thickness, depth);
    this.set(mesh, 3, (x1 + RIGHT) / 2, y, 0, RIGHT - x1, thickness, depth);
    mesh.instanceMatrix.needsUpdate = true;
  }

  private siliconMaterial(withContacts: boolean) {
    const material = this.material(new THREE.MeshStandardMaterial({ color: withContacts ? 0x071728 : 0x102b46, roughness: .44, metalness: .08 }));
    const minimumDistance = (axis: string, fractions: readonly number[]) => fractions
      .map(fraction => `abs(vCellPoint.${axis} - (${fraction.toFixed(8)}))`)
      .reduce((left, right) => `min(${left}, ${right})`);
    const busDistance = minimumDistance('x', PANEL.busFractions);
    const fingerDistance = minimumDistance('z', PANEL.fingerFractions);
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCellPoint; varying float vCellTop; varying vec2 vModulePoint;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCellPoint=position; vCellTop=normal.y;\n#ifdef USE_INSTANCING\nvModulePoint=(instanceMatrix*vec4(position,1.)).xz;\n#else\nvModulePoint=position.xz;\n#endif');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCellPoint; varying float vCellTop; varying vec2 vModulePoint;');
      const pattern = withContacts ? `
        float dx=${busDistance};
        float dz=${fingerDistance};
        float aaX=max(fwidth(vCellPoint.x),.0001),aaZ=max(fwidth(vCellPoint.z),.0001);
        float cellContactMask=max(1.-smoothstep(.0022,.0022+aaX,dx),.62*(1.-smoothstep(.0010,.0010+aaZ,dz)))*step(.5,vCellTop);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.10,.15,.20),cellContactMask); diffuseColor.rgb*=mix(.06,1.,exp(-dot(vModulePoint,vModulePoint)/380.));
      ` : 'float cellContactMask=0.;';
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float fineGrain=sin(vCellPoint.x*531.+sin(vCellPoint.z*167.)*.65)*sin(vCellPoint.z*263.);
        float longGrain=sin(vCellPoint.x*41.+vCellPoint.z*4.3);
        diffuseColor.rgb*=.97+.025*fineGrain+.018*longGrain;
        ${pattern}`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.24,cellContactMask);');
      shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.64,cellContactMask);');
    };
    material.customProgramCacheKey = () => `aesir-cell-silicon-v1-${withContacts ? 1 : 0}`;
    return material;
  }

  private collectionMaterial(color: number, throughSection: boolean) {
    return this.material(new THREE.ShaderMaterial({
      vertexShader: collectionVertex, fragmentShader: collectionFragment,
      uniforms: { uExtraction: { value: 0 }, uVisible: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
      transparent: true, depthWrite: false, depthTest: !throughSection,
      blending: THREE.AdditiveBlending, toneMapped: false,
    }));
  }
  private collection(name: string, points: number[][], material: THREE.ShaderMaterial, radius: number) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const geometry = this.geometry(new THREE.TubeGeometry(curve, this.mobile ? 32 : 48, radius, this.mobile ? 4 : 5, false));
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.renderOrder = 5;
    this.group.add(mesh);
  }
  private geometry<T extends THREE.BufferGeometry>(value: T): T { this.geometries.add(value); return value; }
  private material<T extends THREE.Material>(value: T): T { this.materials.add(value); return value; }
  private block(name: string, material: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
    const mesh = new THREE.Mesh(this.box, material); mesh.name = name;
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.receiveShadow = true; this.group.add(mesh); return mesh;
  }
  private instances(name: string, material: THREE.Material, count: number) {
    const mesh = new THREE.InstancedMesh(this.box, material, count);
    mesh.name = name; mesh.receiveShadow = true;
    // Cell/window matrices change during sectioning; retain a conservative full
    // module bound, avoiding stale instance bounds and visible culling pops.
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(CX, 0, CZ), 90);
    this.group.add(mesh); return mesh;
  }
  private set(mesh: THREE.InstancedMesh, index: number, x: number, y: number, z: number, w: number, h: number, d: number) {
    this.position.set(x, y, z); this.size.set(Math.max(0, w), Math.max(0, h), Math.max(0, d));
    this.matrix.compose(this.position, this.identity, this.size); mesh.setMatrixAt(index, this.matrix);
  }

  snapshot() {
    let geometryBytes = 0, triangles = 0, baseDrawCalls = 0, instances = 0;
    for (const geometry of this.geometries) {
      for (const attribute of Object.values(geometry.attributes)) geometryBytes += attribute.array.byteLength;
      geometryBytes += geometry.index?.array.byteLength ?? 0;
    }
    this.group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const count = object instanceof THREE.InstancedMesh ? object.count : 1;
      triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 * count;
      baseDrawCalls++;
      if (object instanceof THREE.InstancedMesh) {
        instances += object.count;
        geometryBytes += object.instanceMatrix.array.byteLength + (object.instanceColor?.array.byteLength ?? 0);
      }
    });
    return {
      variant: this.mobile ? 'mobile' : 'desktop', geometryBytes, triangles,
      drawCalls: baseDrawCalls, baseDrawCalls, instances,
      textureBytes: 0, textureBytesWithMipmaps: 0,
      selectedCell: { row: SELECTED_CELL.row, col: SELECTED_CELL.col, width: W, length: D },
      absorptionPoint: this.absorptionPoint.toArray(),
      frontCollection: this.frontCollection.toArray(), rearCollection: this.rearCollection.toArray(),
      junction: this.junction.toArray(), state: { ...this.state },
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.geometries.clear(); this.materials.clear();
    this.group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
    this.group.clear(); this.group.removeFromParent();
  }
}

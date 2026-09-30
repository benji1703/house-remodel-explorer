// RH Cloud Track Arm-inspired design study, adapted to this room.
// Silhouette reference: https://rh.com/us/en/cloud-sofa
// Metres at the GLB boundary: 220 × 102 cm, low frame with loose down-like cushions.
// This procedural exporter maintains the sofa assets when local Blender is unavailable.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Document, NodeIO } = require(process.env.GLTF_TRANSFORM_MODULE || '/tmp/house-render-qa/node_modules/@gltf-transform/core');
const THREE = await import('three');
const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
const { mergeGeometries, mergeVertices } = await import('three/addons/utils/BufferGeometryUtils.js');
const out = 'public/models/interior';
const colors = {
  ivory: ['Mood linen sofa ivory', [.94,.925,.89,1]],
  welt: ['Mood linen sewn welt', [.81,.795,.75,1]],
  sage: ['Mood linen sage pillow', [.58,.61,.51,1]],
  oat: ['Mood linen oat pillow', [.84,.81,.73,1]],
  wood: ['Mood oak recessed sofa foot', [.19,.13,.085,1]],
};
function build(light, styling) {
  const groups = new Map();
  function add(g, material, center=[0,0,0], rotation=[0,0,0]) {
    const transform = new THREE.Matrix4().compose(new THREE.Vector3(...center), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(1,1,1));
    g.applyMatrix4(transform);
    const p = g.attributes.position, uv = new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++) {uv[i*2]=p.getX(i);uv[i*2+1]=p.getZ(i);}
    g.setAttribute('uv', new THREE.BufferAttribute(uv,2));
    if(!groups.has(material)) groups.set(material,[]);
    groups.get(material).push(g);
  }
  function soft(center,size,radius,material='ivory',rotation=[0,0,0],kind='frame',seed=0) {
    let g=new RoundedBoxGeometry(...size, light?4:8, radius);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++) {
      let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const nx=x/(size[0]/2),ny=y/(size[1]/2),nz=z/(size[2]/2);
      if(kind==='seat') {
        // A crown over the fill, subtle compression toward the rear and sewn edges.
        y+=Math.sign(ny)*.013*Math.max(0,1-nx*nx)*Math.max(0,1-nz*nz);
        y+=.0028*Math.sin(nx*24+nz*9+seed)*Math.exp(-Math.pow((Math.abs(nz)-.82)*9,2))*Math.pow(Math.abs(ny),5);
        x+=.0018*Math.sin(nz*32+seed)*Math.pow(Math.abs(nx),8);
      } else if(kind==='pillow') {
        // Full soft faces and restrained gathered fabric near the perimeter.
        x+=Math.sign(nx)*.021*Math.max(0,1-Math.pow(ny,4))*Math.max(0,1-Math.pow(nz,4));
        x+=.0032*Math.sin(nz*31+ny*17+seed)*Math.exp(-Math.pow((Math.abs(ny)-.79)*8,2))*Math.pow(Math.abs(nx),5);
        y+=.002*Math.sin(nz*21+seed)*Math.pow(Math.abs(ny),8);
      } else {
        x+=.001*Math.sin(y*30+z*19+seed)*Math.pow(Math.abs(nx),8);
      }
      p.setXYZ(i,x,y,z);
    }
    g.deleteAttribute('normal');g.deleteAttribute('uv');
    const welded=mergeVertices(g,1e-5);g.dispose();g=welded;g.computeVertexNormals();
    add(g,material,center,rotation);
  }
  function welt(center,width,height,plane,material='welt',rotation=[0,0,0],corner=.055) {
    const a=width/2,b=height/2,r=Math.min(corner,a*.75,b*.75);
    const path=new THREE.Shape();
    path.moveTo(-a+r,-b);path.lineTo(a-r,-b);path.quadraticCurveTo(a,-b,a,-b+r);
    path.lineTo(a,b-r);path.quadraticCurveTo(a,b,a-r,b);path.lineTo(-a+r,b);
    path.quadraticCurveTo(-a,b,-a,b-r);path.lineTo(-a,-b+r);path.quadraticCurveTo(-a,-b,-a+r,-b);
    const points=path.getPoints(light?5:10).map(p=>plane==='xz'?new THREE.Vector3(p.x,0,p.y):new THREE.Vector3(0,p.x,p.y));
    const curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
    add(new THREE.TubeGeometry(curve,light?64:128,.0014,light?4:6,true),material,center,rotation);
  }
  if(!styling) {
    // Low floating base, hidden glides and soft continuous track arms.
    soft([0,.177,0],[1.01,.27,2.18],.055);
    soft([.405,.405,0],[.205,.66,2.13],.062);
    for(const side of [-1,1]) {
      soft([-.01,.412,side*.985],[1.0,.50,.23],.075);
      welt([-.012,.605,side*.985],.995,.222,'xz','welt',[0,0,0],.075);
      soft([-.092,.415,side*.452],[.82,.22,.89],.061,'ivory',[0,0,0],'seat',side);
      welt([-.092,.470,side*.452],.818,.888,'xz','welt',[0,0,0],.061);
      const rotation=[0,0,-.13];
      soft([.275,.622,side*.45],[.225,.46,.90],.078,'ivory',rotation,'pillow',side*3);
      welt([.273,.622,side*.45],.459,.899,'yz','welt',rotation,.078);
    }
    for(const x of [-.34,.34]) for(const z of [-.92,.92]) soft([x,.027,z],[.075,.054,.075],.009,'wood');
  } else {
    // Filled square accent pillows, with smooth corners and a sewn perimeter.
    for(const [center,size,material,rotation] of [
      [[.07,.659,-.64],[.16,.35,.38],'sage',[.10,0,-.18]],
      [[.095,.637,.68],[.15,.33,.36],'oat',[-.12,0,-.21]],
    ]) {
      soft(center,size,.058,material,rotation,'pillow',center[2]*7);
      welt(center,size[1]-.001,size[2]-.001,'yz',material,rotation,.058);
    }
    // A fine linen throw follows the arm, seat and front edge, with natural folds.
    const rows=light?24:48,cols=light?30:64,positions=[],indices=[];
    for(let i=0;i<=rows;i++) for(let j=0;j<=cols;j++) {
      const u=i/rows,v=j/cols,x=-.56+u*.83,z=-1.12+v*.58;
      const armRise=.14*THREE.MathUtils.smoothstep(-z,.84,.94);
      const outerDrop=.35*THREE.MathUtils.smoothstep(-z,1.045,1.13);
      const frontDrop=.28*THREE.MathUtils.smoothstep(-x,.44,.56);
      const folds=.007*Math.sin(v*36+u*5)+.003*Math.sin(v*66-u*8);
      positions.push(x+.003*Math.sin(v*27),.537+armRise-outerDrop-frontDrop+folds,z);
      if(i<rows&&j<cols) {const n=i*(cols+1)+j;indices.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();add(g,'oat');
  }
  const doc=new Document(),scene=doc.createScene(styling?'Soft linen pillow styling':'Cloud-inspired track-arm sofa'),buffer=doc.createBuffer();
  for(const [id,chunks] of groups) {
    const geometry=mergeGeometries(chunks,false);
    const material=doc.createMaterial(colors[id][0]).setBaseColorFactor(colors[id][1]).setRoughnessFactor(id==='wood'?.76:.95).setDoubleSided(id!=='wood');
    const primitive=doc.createPrimitive().setMaterial(material);
    for(const [semantic,attribute,type] of [['POSITION','position','VEC3'],['NORMAL','normal','VEC3'],['TEXCOORD_0','uv','VEC2']]) primitive.setAttribute(semantic,doc.createAccessor().setType(type).setArray(new Float32Array(geometry.attributes[attribute].array)).setBuffer(buffer));
    primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geometry.index.array)).setBuffer(buffer));
    scene.addChild(doc.createNode(colors[id][0]).setMesh(doc.createMesh(id).addPrimitive(primitive)));
    chunks.forEach(g=>g.dispose());geometry.dispose();
  }
  const name=styling?'sofa-linen':'tailored-linen-sofa';
  return new NodeIO().write(`${out}/${name}${light?'-light':''}.glb`,doc);
}
for(const light of [false,true]) for(const styling of [false,true]) await build(light,styling);
console.log('Exported cloud-inspired sofa and soft linen styling, high and light GLBs');

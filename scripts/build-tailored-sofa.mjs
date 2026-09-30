// Procedural furniture export for the one missing Blender regeneration when
// the local bpy/USD runtime is unavailable. Dimensions are metres at the asset
// boundary; the authored body is 220 × 90 × 75 cm with a seat and feet.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Document } = require('/tmp/house-render-qa/node_modules/@gltf-transform/core');
const { NodeIO } = require('/tmp/house-render-qa/node_modules/@gltf-transform/core');
const THREE = await import('three');
const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
const out='public/models/interior';
const pieces={
  linen:[
    [[0,.245,0],[.78,.24,2.04],.075],
    [[.35,.475,0],[.20,.47,2.12],.065],
    ...[-1,1].map(side=>[[-.025,.43,side*1.01],[.79,.42,.17],.058]),
    ...[-1,1].map(side=>[[-.095,.414,side*.465],[.72,.15,.91],.045]),
    ...[-1,1].map(side=>[[.218,.565,side*.465],[.17,.31,.90],.055]),
  ],
  oak:[-1,1].flatMap(x=>[-1,1].map(z=>[[x*.335,.068,z*.975],[.052,.136,.052],.009])),
};
function geometry(group,simplified){
  const chunks=[];
  for(const [[x,y,z],[w,h,d],r] of pieces[group]){
    const object=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,simplified?2:3,Math.min(r,simplified?.018:r)));
    object.position.set(x,y,z); object.updateMatrix();
    object.geometry.applyMatrix4(object.matrix);
    chunks.push(object.geometry);
  }
  return mergeGeometries(chunks,false);
}
for(const light of [false,true]){
  const doc=new Document();const scene=doc.createScene('Tailored linen sofa');const buffer=doc.createBuffer('sofa');
  for(const group of Object.keys(pieces)){
    const g=geometry(group,light);
    const positions=g.attributes.position;
    const uv=new Float32Array(positions.count*2);
    for(let i=0;i<positions.count;i++){uv[i*2]=positions.getX(i)*2+.5;uv[i*2+1]=positions.getZ(i)*2+.5;}
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const a=positions.array,n=g.attributes.normal.array,index=g.index?.array??Uint32Array.from({length:a.length/3},(_,i)=>i);
    const material=doc.createMaterial(group==='linen'?'Mood linen sofa ivory':'Mood oak sofa feet')
      .setRoughnessFactor(group==='linen'?.96:.7).setMetallicFactor(0);
    const primitive=doc.createPrimitive().setMaterial(material)
      .setAttribute('POSITION',doc.createAccessor(`${group} position`).setType('VEC3').setArray(new Float32Array(a)).setBuffer(buffer))
      .setAttribute('NORMAL',doc.createAccessor(`${group} normal`).setType('VEC3').setArray(new Float32Array(n)).setBuffer(buffer))
      .setAttribute('TEXCOORD_0',doc.createAccessor(`${group} uv`).setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer))
      .setIndices(doc.createAccessor(`${group} indices`).setType('SCALAR').setArray(index instanceof Uint32Array?new Uint32Array(index):new Uint32Array(index)).setBuffer(buffer));
    scene.addChild(doc.createNode(`${group==='linen'?'Tailored sofa cushions and rails':'Recessed oak feet'}`).setMesh(doc.createMesh(group).addPrimitive(primitive)));
    g.dispose();
  }
  const io=new NodeIO();
  await io.write(`${out}/tailored-linen-sofa${light?'-light':''}.glb`,doc);
}
console.log('EXPORTED sofa high and light GLBs');

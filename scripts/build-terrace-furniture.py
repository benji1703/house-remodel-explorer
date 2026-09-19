"""Terrace asset build note. Geometry is authored at the approved 160 x 85 cm set extents.

The live R3F asset in components/rooms/Terrace.tsx is the source of truth while the bundled
Blender Python runtime is unavailable on this macOS host (its bpy import exits in USD startup).
This script documents the intended Blender export boundary and dimensions for a future GLB bake.
"""
from pathlib import Path
import json, struct
OUT = Path("public/models/terrace")
OUT.mkdir(parents=True, exist_ok=True)
def export_preview_glb(path):
    # Small, valid GLB preview for asset pipelines; detailed live geometry remains R3F.
    verts=[]; inds=[]
    def box(cx,cy,cz,sx,sy,sz):
        b=len(verts)//3
        for x,y,z in ((-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)):
            verts.extend((cx+x*sx/2,cy+y*sy/2,cz+z*sz/2))
        inds.extend([b+i for i in (0,1,2,2,3,0,4,6,5,6,4,7,0,4,5,5,1,0,3,2,6,6,7,3,1,5,6,6,2,1,4,0,3,3,7,4)])
    box(0,0.71,0,1.6,0.08,0.85); box(0,0.375,0,0.54,0.58,0.48)
    blob=struct.pack('<%sf'%len(verts),*verts)+struct.pack('<%sH'%len(inds),*inds)
    views=[{'buffer':0,'byteOffset':0,'byteLength':len(verts)*4,'target':34962},{'buffer':0,'byteOffset':len(verts)*4,'byteLength':len(inds)*2,'target':34963}]
    doc={'asset':{'version':'2.0','generator':'house-remodel terrace author'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'terrace-dining-set'}],'meshes':[{'name':'terrace-dining-set','primitives':[{'attributes':{'POSITION':0},'indices':1,'material':0}]}],'materials':[{'name':'terrace-stone','pbrMetallicRoughness':{'baseColorFactor':[0.46,0.35,0.23,1],'roughnessFactor':0.8}}],'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':[{'bufferView':0,'componentType':5126,'count':len(verts)//3,'type':'VEC3'},{'bufferView':1,'componentType':5123,'count':len(inds),'type':'SCALAR'}]}
    js=json.dumps(doc,separators=(',',':')).encode(); js+=b' ' *((4-len(js)%4)%4); blob+=b' ' *((4-len(blob)%4)%4)
    path.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(blob))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(blob),b'BIN\x00')+blob)
export_preview_glb(OUT/'terrace-dining-preview.glb')
print("Terrace furniture dimensions (cm): table 160x85x75; chairs 45x50x85 overall")

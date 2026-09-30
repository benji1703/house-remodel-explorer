"""Blender-authored, original interior props from the project's mood references.
Run with Blender --background --python scripts/build-interior-mood.py, or bpy Python.
All authoring dimensions are cm; export metres, Y-up. No architectural geometry.
Materials are merged before export to keep draw calls low. Both quality levels
are exported; cloth relief is supplied by the shared runtime textile material.
"""
import bpy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models/interior'
OUT.mkdir(parents=True, exist_ok=True)

def mat(name, color, rough=0.8, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    return m

OAT = mat('Mood linen oat', (.58, .49, .36))
SAGE = mat('Mood linen sage', (.24, .30, .16))
RUST = mat('Mood linen tobacco', (.38, .21, .12))
CREAM = mat('Mood stoneware chalk', (.73, .67, .54), .65)
CLAY = mat('Mood stoneware clay', (.37, .20, .115), .85)
OAK = mat('Mood oak board', (.42, .26, .13), .7)
PAPER = mat('Mood book pages', (.73, .68, .57), .94)
INK = mat('Mood book olive', (.105, .14, .08), .9)
BRASS = mat('Mood aged brass', (.33, .24, .12), .34, .78)
LEAF = mat('Mood olive leaf', (.16, .23, .09), .83)
LEMON = mat('Mood lemon peel', (.66, .43, .08), .85)
BREAD = mat('Mood bread crust', (.38, .19, .075), .98)
SCORE = mat('Mood bread scoring', (.70, .49, .25), 1)
SOIL = mat('Mood soil', (.045, .03, .018), 1)

# Web x/y/z (height Y) to Blender x/y/z (height Z).
def xyz(p): return (p[0]/100, -p[2]/100, p[1]/100)
def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def mesh(name, vertices, faces, material, smooth=True):
    data = bpy.data.meshes.new(name)
    data.from_pydata([xyz(p) for p in vertices], [], faces)
    data.materials.append(material)
    uv = data.uv_layers.new(name='Surface scale')
    for face in data.polygons:
        normal = face.normal
        axis = max(range(3), key=lambda k: abs(normal[k]))
        axes = [k for k in range(3) if k != axis]
        for loop_index in face.loop_indices:
            co = data.vertices[data.loops[loop_index].vertex_index].co
            uv.data[loop_index].uv = (co[axes[0]] * 2, co[axes[1]] * 2)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    for p in data.polygons: p.use_smooth = smooth
    return obj

def box(name, center, size, material, bevel=0.4, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(center))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (size[0]/100, size[2]/100, size[1]/100)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = angle
    obj.data.materials.append(material)
    mod = obj.modifiers.new('Soft handmade edges', 'BEVEL')
    mod.width = bevel/100
    mod.segments = 3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def lathe(name, center, profile, material, n=40):
    vertices = [(center[0]+r*math.cos(i*math.tau/n), center[1]+h, center[2]+r*math.sin(i*math.tau/n)) for r,h in profile for i in range(n)]
    faces = [(j*n+i,(j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n) for j in range(len(profile)-1) for i in range(n)]
    return mesh(name, vertices, faces, material)

def sphere(name, center, size, material, pillow=False, turn=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=1, location=xyz(center))
    obj = bpy.context.object
    obj.name=name
    for v in obj.data.vertices:
        x,y,z=v.co
        if pillow:
            # Soft squared corners with a gently gathered edge.
            x=math.copysign(abs(x)**.52,x)
            z=math.copysign(abs(z)**.52,z)
            y=math.copysign(abs(y)**.52,y)
            y *= 1 + .04*math.sin(z*19+x*9)
        v.co=(x*size[0]/200,y*size[2]/200,z*size[1]/200)
    obj.rotation_euler.z=turn
    obj.data.materials.append(material)
    for p in obj.data.polygons: p.use_smooth=True
    return obj

def tube(name, points, radius, material):
    curve=bpy.data.curves.new(name,'CURVE')
    curve.dimensions='3D'; curve.resolution_u=2
    curve.bevel_depth=radius/100; curve.bevel_resolution=2
    spline=curve.splines.new('POLY'); spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points): p.co=(*xyz(co),1)
    obj=bpy.data.objects.new(name,curve); bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.convert(target='MESH'); obj.select_set(False)
    return obj

def cloth(name, width, depth, fn, material, nx=54, nz=26):
    vertices=[fn((i/nx-.5)*width,(j/nz-.5)*depth) for j in range(nz+1) for i in range(nx+1)]
    faces=[(j*(nx+1)+i,(j+1)*(nx+1)+i,(j+1)*(nx+1)+i+1,j*(nx+1)+i+1) for j in range(nz) for i in range(nx)]
    obj=mesh(name,vertices,faces,material)
    mod=obj.modifiers.new('Linen edge thickness','SOLIDIFY'); mod.thickness=.0018
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def bowl(x,y,z,r=10,material=CREAM):
    return lathe('Hollow hand-thrown bowl',(x,y,z),[(0,0),(r*.45,0),(r*.65,1),(r*.94,r*.35),(r,r*.47),(r*.94,r*.5),(r*.86,r*.38),(r*.55,1.8),(0,1.5)],material)

def vase(x,y,z,h=24):
    return lathe('Stoneware olive vase',(x,y,z),[(0,0),(h*.21,0),(h*.28,h*.08),(h*.32,h*.38),(h*.27,h*.65),(h*.13,h*.82),(h*.12,h),(h*.095,h),(h*.09,h*.82),(h*.20,h*.5),(0,2)],CREAM)

def sprigs(x,y,z,height=40,count=5):
    for i in range(count):
        a=i*2.4; r=height*(.2+.055*(i%3)); top=height*(.78+.05*(i%4))
        end=(x+math.cos(a)*r,y+top,z+math.sin(a)*r)
        mid=(x+math.cos(a)*r*.45,y+top*.58,z+math.sin(a)*r*.45)
        tube('Olive twig',[(x,y,z),mid,end],.12,OAK)
        for j in range(3,10):
            t=j/10
            p=(x+(end[0]-x)*t,y+top*t,z+(end[2]-z)*t)
            for side in [-1,1]:
                ang=a+side*1.15+j*.55; length=height*.13
                tip=(p[0]+math.cos(ang)*length,p[1]+length*.36,p[2]+math.sin(ang)*length)
                midleaf=tuple((p[k]+tip[k])/2 for k in range(3))
                off=(-math.sin(ang)*length*.16, .3, math.cos(ang)*length*.16)
                mesh('Olive lanceolate leaf',[p,tuple(midleaf[k]+off[k] for k in range(3)),tip,tuple(midleaf[k]-off[k] for k in range(3)),(midleaf[0],midleaf[1]+.35,midleaf[2])],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],LEAF)

def book(x,y,z,w,d,h,material,angle=0):
    box('Linen-bound book pages',(x,y+h/2,z),(w-.5,h-.4,d-.6),PAPER,.12,angle)
    for yy in [y+.1,y+h-.1]: box('Book cloth cover',(x,yy,z),(w,.2,d),material,.1,angle)
    # Bound spine attached to the back edge (these volumes lie flat).
    box('Book spine',(x,y+h/2,z-d/2+.15),(w,h,.3),material,.1,angle)

def mug(x,y,z):
    lathe('Glazed stoneware mug',(x,y,z),[(0,0),(3.4,0),(3.8,1),(4.1,8.3),(3.6,8.6),(3.25,1),(0,1)],CREAM)
    tube('Mug handle',[(x+3.5+2.4*math.sin(t*math.pi),y+6.8-5*t,z) for t in [i/18 for i in range(19)]],.55,CREAM)

def export(name):
    # Merge by material: one render call per finish, not per leaf or book.
    bpy.ops.object.select_all(action='DESELECT')
    groups={}
    for o in list(bpy.context.scene.objects):
        if o.type=='MESH': groups.setdefault(o.data.materials[0].name,[]).append(o)
    for material,objects in groups.items():
        for o in objects: o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join(); bpy.context.object.name=material
        bpy.ops.object.select_all(action='DESELECT')
    bpy.context.scene.unit_settings.system='METRIC'
    for light in [False,True]:
        if light:
            for obj in bpy.context.scene.objects:
                if obj.type!='MESH' or len(obj.data.polygons)<120: continue
                bpy.context.view_layer.objects.active=obj
                mod=obj.modifiers.new('Mobile simplification','DECIMATE'); mod.ratio=.4
                bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.ops.export_scene.gltf(filepath=str(OUT/(name+('-light' if light else '')+'.glb')),export_format='GLB',export_yup=True,export_materials='EXPORT',export_extras=True)
    print('EXPORTED',name,flush=True)

# Sofa and its styling are maintained by scripts/build-tailored-sofa.mjs.


clear()
# Origin is the coffee-table top; radius fits its 120 x 70 cm surface.
book(-28,0,-5,27,21,3.2,INK)
book(-26,3.2,-5,24,19,2.4,OAT,.05)
vase(23,0,4,23); sprigs(23,18,4,38,4)
lathe('Brass candle saucer',(1,0,15),[(0,0),(7,0),(7,.5),(6.4,.9),(0,.9)],BRASS)
lathe('Warm ivory candle',(1,.9,15),[(0,0),(4.2,0),(4.2,8),(0,8)],CREAM)
tube('Candle wick',[(1,8.9,15),(1,9.5,15)],.10,INK)
export('coffee-still-life')

clear()
# Island arrangement leaves both ends and the working aisle free.
box('Oak preparation board',(-23,1.4,-3),(42,2.8,30),OAK,2,-.08)
sphere('Sourdough loaf',(-23,9,-3),(29,15,22),BREAD)
for i in range(4):
    xx=-32+i*6
    tube('Bread score',[(xx-1+j*.3,15.1+math.sin(j/10*math.pi)*1.3,-9+j*1.1) for j in range(11)],.33,SCORE)
bowl(31,0,-8,13)
for x,y,z in [(26,5,-8),(35,5,-5),(31,8,-12)]: sphere('Lemon',(x,y,z),(7,7,9),LEMON,turn=.4)
mug(22,0,20); mug(39,0,18)
cloth('Folded breakfast linen',32,20,lambda u,v:(-19+u,.65+.35*math.sin(u*.8)+.2*math.cos(v*.7),24+v),OAT,28,18)
export('kitchen-preparation')

clear()
lathe('Clay herb pot',(0,0,0),[(0,0),(7,0),(8,2),(10,14),(10.5,15),(9.4,15),(8.7,3),(0,3)],CLAY)
lathe('Potting soil',(0,12.5,0),[(0,0),(9,0),(9,.4),(0,.4)],SOIL)
sprigs(0,12,0,30,7)
export('kitchen-herbs')

clear()
# Origin is mattress top; wrap over the existing duvet at the foot of the bed.
def bed_throw(u,v):
    edge=max(0,(abs(u)-71)/16)
    return (u,6.2+.7*math.sin(u*.42+v*.12)+.5*math.sin(v*.55)-edge**1.7*20,-49+v)
cloth('Layered linen bed runner',174,53,bed_throw,OAT,70,28)
sphere('Sage linen lumbar pillow',(0,15,36),(69,24,19),SAGE,True)
export('bed-linen')

clear()
book(0,0,0,17,12,2.2,OAT)
book(.5,2.2,0,15,11,1.6,INK)
bowl(0,3.8,0,4.5)
export('bedside-reading')

clear()
for i in range(3):
    box('Folded cotton towel',(0,2+i*3.8,0),(27-i,3.8,18),OAT if i==1 else CREAM,1.5)
    tube('Towel hem',[(-12,2.8+i*3.8,9.1),(0,2.8+i*3.8,9.1),(12,2.8+i*3.8,9.1)],.12,OAT)
export('bath-linen')

clear()
box('Handwoven wool rug',(0,.7,0),(295,1.4,320),OAT,1.4)
# Flat bound edges and irregular short fringe, entirely within the rug footprint.
for side in [-1,1]:
    box('Wool bound edge',(side*145.3,1.45,0),(2.4,.3,318),OAT,.15)
    for i in range(100):
        x=-141+i*2.85
        tube('Hand knotted fringe',[(x,1.05,side*156),(x+.35,.55,side*(158.8+.4*math.sin(i*2)))],.13,OAT)
export('living-rug')

clear()
lathe('Aged brass weighted base',(0,0,0),[(0,0),(17,0),(18,1),(17,2.5),(0,2.5)],BRASS)
lathe('Turned oak lamp stem',(0,2.5,0),[(0,0),(3,0),(2.1,10),(1.6,105),(0,105)],OAK)
DIFFUSER=mat('Mood lamp diffuser',(.87,.75,.55),.94)
# Pleated shade with a real open bottom, shade rings and luminous inner diffuser.
n=120
verts=[]
for y,r in [(105,22),(132,13)]:
    for i in range(n):
        radius=r+(.55 if i%2 else -.55)
        verts.append((radius*math.cos(i*math.tau/n),y,radius*math.sin(i*math.tau/n)))
obj=mesh('Pleated linen shade',verts,[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)],OAT,False)
obj.data.materials[0].use_backface_culling=False
for y,r in [(105,22),(132,13)]: tube('Shade binding',[(r*math.cos(i*math.tau/96),y,r*math.sin(i*math.tau/96)) for i in range(97)],.35,OAT)
lathe('Warm lamp diffuser',(0,106,0),[(0,0),(20,0),(20,.2),(0,.2)],DIFFUSER)
export('reading-lamp')

clear()
# Sculpted oak counter stool, same 40 x 40 x 70 cm editable envelope.
RUSH = mat('Mood woven oat', (.58, .49, .36), .92)
for sx in [-1,1]:
    for sz in [-1,1]:
        tube('Splayed oak stool leg',[(sx*17,.1,sz*17),(sx*14,66,sz*14)],1.8,OAK)
for sz in [-1,1]: tube('Oak foot rail',[(-16,25,sz*16),(16,25,sz*16)],1.4,OAK)
for sx in [-1,1]: tube('Oak stretcher',[(sx*16,31,-16),(sx*16,31,16)],1.2,OAK)
box('Saddle oak seat',(0,67,0),(40,6,40),OAK,2.8)
# Shallow recessed woven pad stays below the 70 cm top datum.
cloth('Woven seat pad',33,31,lambda u,v:(u,69.6-.8*(1-(u/17)**2)*(1-(v/16)**2),v),RUSH,30,24)
export('oak-counter-stool')

clear()
IVORY_LINEN=mat('Mood linen ivory',(.65,.58,.47),.98)
# Upholstered barrel chair: 85 x 90 x 70 cm, facing local -Z.
box('Upholstered chair apron',(0,28,0),(79,25,82),IVORY_LINEN,7)
box('Deep linen seat cushion',(0,43,-8),(65,10,61),IVORY_LINEN,4.8)
path=[]
for i in range(12): path.append((-34, -30+i*4.5, 40+i*.6))
for i in range(25):
    a=math.pi-i*math.pi/24
    path.append((34*math.cos(a),19.5+17*math.sin(a),47+6*math.sin(a)))
for i in range(12): path.append((34,19.5-i*4.5,46.6-i*.6))
verts=[]; rings=16
for i,(x,z,y) in enumerate(path):
    before=path[max(0,i-1)]; after=path[min(len(path)-1,i+1)]
    dx=after[0]-before[0]; dz=after[1]-before[1]; length=math.hypot(dx,dz)
    nx=-dz/length; nz=dx/length
    for j in range(rings):
        a=j*math.tau/rings
        vertical=12+(y-40)*5/13
        verts.append((x+nx*8*math.cos(a),y+vertical*math.sin(a),z+nz*8*math.cos(a)))
faces=[(i*rings+j,i*rings+(j+1)%rings,(i+1)*rings+(j+1)%rings,(i+1)*rings+j) for i in range(len(path)-1) for j in range(rings)]
faces.extend([tuple(reversed(range(rings))),tuple((len(path)-1)*rings+j for j in range(rings))])
mesh('Continuous curved upholstered back and arms',verts,faces,IVORY_LINEN)
for sx in [-1,1]:
    for sz in [-1,1]: tube('Turned oak chair feet',[(sx*31,.12,sz*32),(sx*28,20,sz*29)],2.3,OAK)
sphere('Loose oat back cushion',(0,52,22),(54,29,14),OAT,True)
export('linen-lounge-chair')

clear()
box('Rounded solid oak coffee table top',(0,37,0),(120,6,70),OAK,2.8)
for x in [-34,34]: box('Solid oak slab leg',(x,17,0),(9,34,54),OAK,1)
export('oak-coffee-table')


# Regenerate both sofa quality profiles with node scripts/build-tailored-sofa.mjs.

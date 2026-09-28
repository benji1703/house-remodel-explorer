"""Blender authoring: closed D-seat WC, clay olive pots and white jasmine.
Run: Blender --background --python scripts/build-mood-fixtures.py
Original meshes from the supplied mood references; metres, Z-up, glTF Y-up.
No architectural shell or specimen anchors are changed by this asset builder.
"""
import bpy
import math
import random
import importlib.util
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/models/mood"
OUT.mkdir(parents=True, exist_ok=True)

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def material(name, color, roughness, pigment=False):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = roughness
    if pigment:
        vc = m.node_tree.nodes.new('ShaderNodeVertexColor')
        vc.layer_name = 'Pigment'
        m.node_tree.links.new(vc.outputs['Color'], bs.inputs['Base Color'])
    return m

CERAMIC = material('Ivory glazed porcelain', (.91, .90, .86), .23)
CLAY = material('Weathered clay', (.48, .32, .18), .92)
SOIL = material('Soil below pot lip', (.06, .041, .024), 1)
WOOD = material('Olive fine branches', (.17, .13, .075), .9, True)
LEAF = material('Leaf natural pigment', (.14, .23, .085), .77, True)
FLOWER = material('Flower ivory jasmine', (.93, .91, .80), .85, True)

def mesh(name, vertices, faces, mat, colors=None):
    m = bpy.data.meshes.new(name)
    m.from_pydata(vertices, [], faces)
    m.materials.append(mat)
    if colors:
        attr = m.color_attributes.new(name='Pigment', type='FLOAT_COLOR', domain='POINT')
        for target, color in zip(attr.data, colors): target.color = (*color, 1)
    for poly in m.polygons: poly.use_smooth = True
    obj = bpy.data.objects.new(name, m)
    bpy.context.collection.objects.link(obj)
    return obj

def export(name, directory=OUT):
    bpy.context.scene.unit_settings.system = 'METRIC'
    directory.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(directory / (name + '.glb')), export_format='GLB', export_yup=True, export_materials='EXPORT')
    print('EXPORTED', name, flush=True)

def d_outline():
    points = []
    def bezier(a, b, c, d, count):
        for i in range(count):
            t = i / count
            points.append(tuple((1-t)**3*a[k] + 3*(1-t)**2*t*b[k] + 3*(1-t)*t*t*c[k] + t**3*d[k] for k in range(2)))
    bezier((-.145, 0), (-.05, 0), (.05, 0), (.145, 0), 12)
    bezier((.145, 0), (.18, 0), (.18, .025), (.18, .055), 8)
    bezier((.18, .055), (.18, .14), (.18, .24), (.18, .32), 14)
    bezier((.18, .32), (.18, .46), (.125, .54), (0, .54), 20)
    bezier((0, .54), (-.125, .54), (-.18, .46), (-.18, .32), 20)
    bezier((-.18, .32), (-.18, .24), (-.18, .14), (-.18, .055), 14)
    bezier((-.18, .055), (-.18, .025), (-.18, 0), (-.145, 0), 8)
    return points

def shell(name, rings):
    outline = d_outline(); n = len(outline)
    # local render +Z becomes Blender -Y at export; rear stays at wall datum.
    verts = [(x * width, -depth * length, height) for height, width, length in rings for x, depth in outline]
    faces = []
    for j in range(len(rings)-1):
        for i in range(n): faces.append((j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i))
    faces.extend([tuple(reversed(range(n))), tuple((len(rings)-1)*n+i for i in range(n))])
    obj = mesh(name, verts, faces, CERAMIC)
    # Correct winding and split cap normals without faceting the bowl sides.
    bpy.context.view_layer.objects.active = obj; obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    obj.data.polygons[-1].use_smooth = False
    obj.data.polygons[-2].use_smooth = False
    return obj

def toilet():
    clear()
    shell('WC seamless wall-hung ceramic body', [(0.14,.60,.76),(.15,.69,.83),(.18,.83,.91),(.23,.94,.98),(.29,.985,1),(.37,1,1),(.42,.99,.998)])
    shell('WC slim closed seat', [(.425,.97,.995),(.430,1,1),(.444,1,1),(.449,.97,.995)])
    shell('WC closed soft-close lid', [(.452,.98,.999),(.457,1,1),(.472,1,1),(.478,.97,.995)])
    export('toilet-wall-hung')

# Reuse the validated indexed botanical authoring primitives, then bake in Blender.
spec = importlib.util.spec_from_file_location('botanical', Path(__file__).with_name('build-landscape-pure.py'))
bot = importlib.util.module_from_spec(spec); spec.loader.exec_module(bot)

def botanical_mesh(part):
    mats = {'Twig': WOOD, 'Bark': WOOD, 'Leaf': LEAF, 'Flower': FLOWER}
    return mesh(part.name, [(x,-z,y) for x,y,z in part.p], [tuple(part.i[i:i+3]) for i in range(0,len(part.i),3)], mats[part.kind], part.c)

def lathe(name, profile, mat):
    n=64
    vertices=[(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),z) for r,z in profile for i in range(n)]
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(profile)-1) for i in range(n)]
    return mesh(name,vertices,faces,mat)

def olive_pot(light=False):
    clear()
    lathe('Rounded clay pot with hollow rolled lip',[(.14,0),(.16,.012),(.19,.07),(.23,.25),(.224,.34),(.195,.415),(.201,.445),(.205,.465),(.195,.48),(.179,.48),(.175,.462),(.18,.435),(.174,.417),(.20,.33),(.20,.29)],CLAY)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.175, depth=.018, location=(0,0,.419))
    bpy.context.object.name='Soil inside olive pot'; bpy.context.object.data.materials.append(SOIL)
    wood=bot.Mesh('Potted olive branching trunk','Twig'); leaves=bot.Mesh('Potted olive silver leaves','Leaf')
    wood.tube([(0,.43,0),(.016,.65,.01),(-.015,.90,0),(.03,1.12,.016)],[.028,.025,.019,.008],(.22,.17,.105),10)
    for i in range(24):
        rng=random.Random(6129+i); a=i*2.399
        root=(.01,.79+(i%5)*.056,0)
        tip=bot.radial(a,rng.uniform(.24,.38),rng.uniform(1.12,1.46))
        wood.tube(bot.curve(root,tip,(0,.04,0),5),[.009,.007,.005,.003,.002,.0008],(.24,.18,.11),5)
        for j in range(5 if light else 8):
            p=bot.mix(root,tip,.30+j*.08)
            end=bot.add(p,bot.radial(a+j*1.7,.12,.04))
            wood.tube([p,end],[.0018,.0005],(.23,.21,.11),4)
            for k in range(5):
                origin=bot.mix(p,end,.18+k*.17)
                for side in [-1,1]: leaves.leaf(origin,bot.radial(a+side*1.1+j,1,.24),rng.uniform(.05,.073),.016,bot.tint((.19,.25,.12) if k%3 else (.33,.36,.24),rng.uniform(.78,1.2)),rng.uniform(-.7,.7))
    botanical_mesh(wood); botanical_mesh(leaves)
    export('olive-pot'+('-light' if light else ''))

def jasmine(light=False, far=False):
    clear()
    wood=bot.Mesh('Jasmine supported woody stems','Twig'); leaves=bot.Mesh('Jasmine glossy opposite leaves','Leaf'); flowers=bot.Mesh('Jasmine five-petal ivory flowers','Flower')
    for stem in range(3):
        phase=stem*2.1
        path=[(.026*math.sin(i*.62+phase),i*.1,.027*math.cos(i*.62+phase)) for i in range(27)]
        wood.tube(path,[.012-i*.00029 for i in range(27)],(.22,.16,.085),6)
        # Lower leaf pairs wind around the existing post, within its sleeve.
        for i in range(4,26,2 if light else 1):
            a=i*2.399+phase; p=path[i]
            for side in [-1,1]: leaves.leaf(p,bot.radial(a+side*.8,1,.5),.052,.024,(.075,.16,.037),.3*side)
        beam=[bot.add(path[-1],(.04*math.sin(t*.7+phase),.085+.04*math.sin(t*.5+phase),-t*.09)) for t in range(24)]
        wood.tube([path[-1],*beam],[.006,*[.006-t*.0002 for t in range(24)]],(.20,.15,.07),5)
        for i in range(0,38,3 if far else 2 if light else 1):
            rng=random.Random(8141+stem*101+i); p=bot.mix(beam[0],beam[-1],.03+i*.94/37)
            end=bot.add(p,((-1 if i%2 else 1)*rng.uniform(.13,.32),rng.uniform(-.07,.10),rng.uniform(-.1,.1)))
            wood.tube(bot.curve(p,end,(0,.04,0),3),[.002,.0015,.001,.0003],(.17,.18,.07),4)
            for k in range(8):
                q=bot.mix(p,end,.13+k*.12); a=i*2.399+k*1.7
                for side in [-1,1]: leaves.leaf(q,bot.radial(a+side,1,.35),rng.uniform(.06,.08),.031,bot.tint((.08,.19,.044),rng.uniform(.75,1.3)),side*.4)
            if i%3==0:
                for cluster in range(3):
                    center=bot.add(end,bot.radial(cluster*2.399,.025,.02+cluster*.008))
                    for petal in range(5): flowers.leaf(center,bot.radial(petal*math.tau/5+i,.9,.25),.017,.0085,(.93,.91,.79),.25)
    for part in [wood,leaves,flowers]: botanical_mesh(part)
    export('trachelospermum-jasminoides'+('-far' if far else '-light' if light else ''),ROOT/'public/models/landscape')

def shrub(species, light=False, far=False):
    """Dense low branching mounds, matching the plant-reference silhouettes.
    Keep the existing asset extents and roots; avoid exposed V-shaped bundles.
    """
    clear()
    myrtle=species=='myrtus-communis'; sage=species=='salvia-fruticosa'
    height=1.0 if myrtle else .73
    leaf_len=.054 if myrtle else .08 if sage else .035
    leaf_width=.023 if myrtle else .031 if sage else .004
    color=(.075,.16,.036) if myrtle else (.25,.31,.21) if sage else (.10,.19,.065)
    wood=bot.Mesh(species+' connected low branching','Twig')
    leaves=bot.Mesh(species+' dense natural leaf mound','Leaf')
    flowers=bot.Mesh(species+' restrained seasonal flowers','Flower')
    count=18 if far else 40 if light else 64
    for i in range(count):
        rng=random.Random(11917+i*191); a=i*2.399
        radius=.12+.31*rng.random()**.6
        root=bot.radial(a,.12+.07*rng.random(),.008)
        tip=bot.radial(a,radius,height*(.86+.12*rng.random())*(1-.48*(radius/.45)**2))
        path=bot.curve(root,tip,bot.radial(a,.05,.065),5)
        wood.tube(path,[.006,.005,.004,.003,.0016,.0004],(.19,.18,.09),4)
        nodes=7 if far else 11 if light else 14
        for j in range(nodes):
            t=.08+j*.91/(nodes-1)
            p=bot.add(bot.mix(root,tip,t),bot.mul(bot.radial(a,.05,.065),math.sin(math.pi*t)))
            for side in [-1,1]:
                d=bot.radial(a+side*(1.05+j*.6),1,rng.uniform(.15,.8))
                leaves.leaf(p,d,leaf_len*rng.uniform(.8,1.13),leaf_width,bot.tint(color,rng.uniform(.72,1.2)),side*.4)
                if not myrtle and not sage:
                    leaves.leaf(bot.add(p,(0,.008,0)),bot.radial(a+side*1.8,1,.5),leaf_len,.004,color,0)
        # Branching low skirts conceal the base without moving roots or bounds.
        end=bot.radial(a+.6,min(.44,radius+.06),.13+height*.16)
        wood.tube([path[1],end],[.002,.0004],(.17,.16,.09),4)
        for j in range(4):
            p=bot.mix(path[1],end,.25+j*.22)
            for side in [-1,1]: leaves.leaf(p,bot.radial(a+side,1,.4),leaf_len,leaf_width,color,side*.5)
        if i%7==0:
            if myrtle:
                for petal in range(5): flowers.leaf(tip,bot.radial(petal*math.tau/5,1,.2),.011,.008,(.85,.83,.68))
            elif sage:
                end=bot.add(tip,(0,.10,0)); wood.tube([tip,end],[.0015,.0004],(.27,.28,.17),4)
                for j in range(6):
                    for petal in range(3): flowers.leaf(bot.mix(tip,end,j/6),bot.radial(petal*math.tau/3+i,1,.4),.012,.007,(.35,.25,.42))
    for part in [wood,leaves,flowers]:
        if part.i: botanical_mesh(part)
    export(species+('-far' if far else '-light' if light else ''),ROOT/'public/models/landscape')

toilet()
olive_pot(); olive_pot(True)
jasmine(); jasmine(True); jasmine(True,True)
for species in ['myrtus-communis','salvia-fruticosa','salvia-rosmarinus']:
    shrub(species); shrub(species,True); shrub(species,True,True)

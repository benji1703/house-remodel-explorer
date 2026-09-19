"""Original botanical study meshes. Run with Blender's Python (bpy 5.1).

Metres, Z up in Blender; glTF export converts to Y up. No house geometry.
Deterministic, individually folded leaves on connected stems, not billboards.
Rebuild: /path/to/bpy-python scripts/build-landscape.py
Then: npx gltfpack -i /tmp/house-botanical/<name>.glb -o public/models/landscape/<name>.glb -cc -kn -km -kv
"""
import bpy
import bmesh
import math
import random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/tmp/house-botanical')
OUT.mkdir(exist_ok=True)
rng = random.Random(1309)

def material(name, color, roughness=0.85):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = roughness
    vc = m.node_tree.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Botanical pigment'
    m.node_tree.links.new(vc.outputs['Color'], bs.inputs['Base Color'])
    return m

LEAF = material('Leaf • varied pigment, matte cuticle', (0.2, 0.3, 0.14))
BARK = material('Bark • furrowed grey brown', (0.25, 0.2, 0.14))
FLOWER = material('Flower • papery bracts', (0.4, 0.12, 0.3))

class Mesh:
    def __init__(self, name, mat):
        self.name, self.mat = name, mat
        self.v, self.f, self.c, self.uv = [], [], [], []

    def face(self, points, color, uvs=None):
        start = len(self.v)
        self.v.extend(points)
        self.c.extend([(*color, 1)] * len(points))
        self.uv.extend(uvs or [(0, 0)] * len(points))
        self.f.append(tuple(range(start, start + len(points))))

    def tube(self, points, radii, color, sides=6, ridged=False):
        rings = []
        for i, p in enumerate(points):
            p = Vector(p)
            axis = Vector(points[min(i+1, len(points)-1)]) - Vector(points[max(0, i-1)])
            axis.normalize()
            u = axis.cross(Vector((0, 1, 0))).normalized()
            v = axis.cross(u).normalized()
            ring = []
            for j in range(sides+1):
                a = j/sides * math.tau
                r = radii[i] * (1 + (0.13*math.sin(a*7+i*0.7)+0.07*math.sin(a*13-i*0.9) if ridged else 0))
                ring.append(p + (u*math.cos(a)+v*math.sin(a))*r)
            rings.append(ring)
        for i in range(len(points)-1):
            for j in range(sides):
                tint = rng.uniform(0.82, 1.15) if ridged else 1
                self.face([rings[i][j], rings[i][j+1], rings[i+1][j+1], rings[i+1][j]],
                          tuple(c*tint for c in color), [(j/sides, i/3), ((j+1)/sides, i/3), ((j+1)/sides, (i+1)/3), (j/sides, (i+1)/3)])

    def leaf(self, p, direction, length, width, color):
        # A folded lanceolate/elliptical leaf, with a raised midrib and tapered tip.
        p, d = Vector(p), Vector(direction).normalized()
        side = d.cross(Vector((0.12, 0.05, 1))).normalized()
        normal = side.cross(d).normalized()
        # Curved elliptical margins and a shallow midrib avoid diamond-shaped leaves.
        for i in range(5):
            t,u=i/5,(i+1)/5
            def row(t):
                mid=p+d*length*t+normal*length*(0.1*math.sin(t*math.pi)-0.07*t*t)
                w=math.sin(t*math.pi)**0.85*width*0.5
                return [mid+side*w,mid+normal*width*0.1*math.sin(t*math.pi),mid-side*w]
            a,b=row(t),row(u)
            self.face([a[0],b[0],b[1],a[1]],color)
            self.face([a[1],b[1],b[2],a[2]],tuple(c*0.9 for c in color))

    def blob(self, center, scale, color, segments=10, rings=4):
        """Low-poly organic foliage volume; avoids the repeated vase silhouette."""
        center = Vector(center)
        ring_rows = []
        for r in range(rings + 1):
            t = r / rings
            phi = -math.pi / 2 + math.pi * t
            row = []
            for j in range(segments):
                a = math.tau * j / segments
                jitter = 1 + 0.08 * math.sin(a * 3.0 + r * 1.7)
                row.append(center + Vector((math.cos(phi) * math.cos(a) * scale[0] * jitter,
                                            math.sin(phi) * scale[1],
                                            math.cos(phi) * math.sin(a) * scale[2] * jitter)))
            ring_rows.append(row)
        for r in range(rings):
            for j in range(segments):
                self.face([ring_rows[r][j], ring_rows[r][(j + 1) % segments],
                           ring_rows[r + 1][(j + 1) % segments], ring_rows[r + 1][j]],
                          tint(color, 0.88 + 0.22 * ((j + r) % 3) / 2))

    def object(self):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.v, [], self.f)
        mesh.materials.append(self.mat)
        colors = mesh.color_attributes.new(name='Botanical pigment', type='FLOAT_COLOR', domain='POINT')
        for i, c in enumerate(self.c): colors.data[i].color = c
        uv = mesh.uv_layers.new(name='UVMap')
        for loop in mesh.loops: uv.data[loop.index].uv = self.uv[loop.vertex_index]
        ob = bpy.data.objects.new(self.name, mesh)
        bpy.context.collection.objects.link(ob)
        if self.mat == BARK:
            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.00001)
            bm.to_mesh(mesh)
            bm.free()
            for p in mesh.polygons: p.use_smooth = True
        return ob

def tint(base, factor=None):
    f = factor or rng.uniform(0.7, 1.3)
    return tuple(min(1, c*f) for c in base)

def radial(a, radius, z): return Vector((math.cos(a)*radius, math.sin(a)*radius, z))

def olive(light):
    wood, leaves = Mesh('Olea europaea • branching wood', BARK), Mesh('Olea europaea • silver lanceolate leaves', LEAF)
    trunk = [Vector((0,0,0)),Vector((0.10,-0.04,0.24)),Vector((-0.08,0.05,0.68)),Vector((0.06,0.02,1.35))]
    wood.tube(trunk, [0.36,0.31,0.22,0.15], (0.24,0.2,0.15), 24, True)
    # Broad, low root flares and fused unions establish a mature asymmetrical base.
    for a in [-2.7, -1.3, -0.35, 0.8, 2.1]:
        end = radial(a, rng.uniform(0.42, 0.72), rng.uniform(0.05, 0.16))
        wood.tube([Vector((0, 0, 0.12)), Vector((end.x * 0.45, end.y * 0.45, 0.18)), end],
                  [0.16, 0.085, 0.025], (0.24, 0.2, 0.15), 10, True)
    for a in [-2.6, -1.15, 0.15, 1.2, 2.55]:
        start = trunk[1].lerp(trunk[2], rng.uniform(0.1, 0.65))
        end = radial(a, rng.uniform(0.58, 1.05), rng.uniform(1.45, 2.0))
        wood.tube([start, start.lerp(end, 0.42) + Vector((0, 0, 0.08)), end],
                  [0.17, 0.09, 0.035], (0.27, 0.23, 0.17), 14, True)
    for b in range(6):
        a = b*2.4
        start = trunk[2] if b%2 else trunk[3]
        end = radial(a, rng.uniform(0.85,1.35), rng.uniform(2.3,3.1))
        points = [start, start.lerp(end,0.3)+Vector((0.12,-0.08,0.15)), start.lerp(end,0.7), end]
        wood.tube(points,[0.14,0.11,0.06,0.022],(0.29,0.25,0.2),16,True)
        for j in range(12 if light else 24):
            az = rng.uniform(0,math.tau)
            root = points[2].lerp(end,rng.random())
            tip = end+radial(az,rng.uniform(0.2,0.85),rng.uniform(-0.35,0.55))
            wood.tube([root,root.lerp(tip,0.55)+Vector((0,0,0.07)),tip],[0.018,0.01,0.003],(0.27,0.25,0.17))
            for k in range(6 if light else 9):
                t = (k+1)/(6 if light else 9)
                fork = root.lerp(tip,t)
                twig_tip = fork+radial(az+k*2.2, rng.uniform(0.2,0.42), rng.uniform(-0.05,0.22))
                wood.tube([fork,twig_tip],[0.003,0.0008],(0.29,0.29,0.18),4)
                for n in range(6 if light else 7):
                    p = fork.lerp(twig_tip,(n+1)/(6 if light else 7))
                    for sign in [-1,1]:
                        d = radial(az+k*2.2+sign*1.1,1,rng.uniform(-0.3,0.5))
                        leaves.leaf(p,d,rng.uniform(0.075,0.11)*(1.1 if light else 1),0.023,tint((0.27,0.34,0.21)))
    return [wood, leaves]

def shrub(species, light):
    wood, leaves, flowers = Mesh(species+' • stems', BARK), Mesh(species+' • foliage', LEAF), Mesh(species+' • flowers', FLOWER)
    sage = species == 'salvia-fruticosa'
    myrtle = species == 'myrtus-communis'
    # Dense, overlapping rounded masses provide the natural silhouette; stems remain visible only at the edges.
    blob_count = 6 if light else 10
    for i in range(blob_count):
        a = i * 2.399 + rng.uniform(-0.2, 0.2)
        radius = rng.uniform(0.05, 0.34)
        center = radial(a, radius, rng.uniform(0.28, 0.58) if not myrtle else rng.uniform(0.42, 0.82))
        spread = rng.uniform(0.20, 0.34) * (1.12 if sage else 1.0)
        leaves.blob(center, (spread, spread * rng.uniform(0.68, 0.9), spread * rng.uniform(0.75, 1.15)),
                    (0.30, 0.37, 0.22) if sage else (0.12, 0.21, 0.075) if myrtle else (0.18, 0.27, 0.13), 9 if light else 11, 3)
    for i in range(55 if light else 105):
        a = i*2.399
        radius = rng.uniform(0.12,0.47)
        tip = radial(a,radius,rng.uniform(0.32,0.7) if not myrtle else rng.uniform(0.55,1.05))
        start = radial(a,0.08,0.02)
        wood.tube([start,start.lerp(tip,0.5),tip],[0.009,0.004,0.001],(0.22,0.23,0.12),5)
        for n in range(7 if sage else 12):
            p = start.lerp(tip,0.2+n*(0.75/(7 if sage else 12)))
            for sign in [-1,1]:
                d = radial(a+sign*1.1+n*0.65,1,rng.uniform(0.1,0.7))
                leaves.leaf(p,d,0.085 if sage else 0.065 if myrtle else 0.047,
                            0.042 if sage else 0.028 if myrtle else 0.005,
                            tint((0.36,0.43,0.31) if sage else (0.13,0.23,0.08) if myrtle else (0.20,0.29,0.15)))
                if not sage and not myrtle:
                    q=p+radial(a,0.045,0.02)
                    leaves.leaf(q,d,0.04,0.004,tint((0.20,0.29,0.15)))
        if i%4==0 and not myrtle:
            for n in range(4):
                p=tip+Vector((0,0,n*0.018))
                for j in range(3): flowers.leaf(p,radial(j*math.tau/3,1,0.4),0.014,0.011,tint((0.37,0.27,0.47) if sage else (0.35,0.37,0.55)))
    return [wood,leaves,flowers]

def limonium(light):
    leaves,stems,flowers = Mesh('Limonium perezii • basal rosette',LEAF),Mesh('Limonium perezii • flower stems',BARK),Mesh('Limonium perezii • branched violet sprays',FLOWER)
    for i in range(26):
        a=i*2.4
        leaves.leaf((0,0,0.035),radial(a,1,rng.uniform(0.1,0.5)),rng.uniform(0.18,0.34),0.1,tint((0.2,0.3,0.1)))
    for i in range(9 if light else 16):
        a=i*2.4
        end=radial(a,rng.uniform(0.12,0.3),rng.uniform(0.43,0.68))
        stems.tube([(0,0,0),end],[0.003,0.001],(0.25,0.33,0.13),4)
        for j in range(5):
            tip=end+radial(j*2.4,0.11,rng.uniform(0.01,0.07))
            stems.tube([end-Vector((0,0,0.12)),tip],[0.0015,0.0006],(0.3,0.35,0.18),3)
            for k in range(10):
                p=tip+radial(k*2.4,rng.uniform(0,0.045),rng.uniform(-0.01,0.025))
                for n in range(3): flowers.leaf(p,radial(n*2.1,1,0.3),0.011,0.009,tint((0.36,0.22,0.48)))
    return [leaves,stems,flowers]

def grass(species,light):
    leaves=Mesh(species+' • arching individual blades',LEAF)
    blue=species=='leymus-arenarius'
    for i in range(100 if light else 190):
        a=rng.uniform(0,math.tau)
        h=rng.uniform(0.42,0.9) if blue else rng.uniform(0.32,0.58)
        reach=rng.uniform(0.18,0.44)
        base=radial(a,rng.uniform(0,0.12),0)
        sideways=radial(a+math.pi/2,1,0)
        color=tint((0.37,0.43,0.3) if blue else (0.33,0.38,0.16))
        if i%6==0: color=tint((0.57,0.46,0.27))
        def point(t): return base+radial(a,reach*t*t,h*math.sin(t*1.9))
        for s in range(6):
            t,u=s/6,(s+1)/6
            w=(0.012 if blue else 0.009)*(1-t)
            w2=(0.012 if blue else 0.009)*(1-u)
            leaves.face([point(t)-sideways*w,point(t)+sideways*w,point(u)+sideways*w2,point(u)-sideways*w2],color)
    return [leaves]

def bougainvillea(light):
    wood,leaves,flowers=Mesh('Bougainvillea glabra • trained woody vine',BARK),Mesh('Bougainvillea glabra • ovate leaves',LEAF),Mesh('Bougainvillea glabra • magenta bracts',FLOWER)
    # Grows vertically then along +Y (becomes -Z in glTF), only on the outer beam.
    for b in range(3):
        path=[Vector((math.sin(i*1.2+b)*0.075,math.cos(i*1.2+b)*0.07,i*0.28)) for i in range(10)]
        path += [Vector((0.08*math.sin(i+b),i*0.26,2.64+0.10*math.sin(i+b))) for i in range(1,9)]
        wood.tube(path,[max(0.006,0.029-i*0.0012) for i in range(len(path))],(0.27,0.22,0.14),7)
        for i in range(3,len(path)):
            for k in range(3 if light else 6):
                p=path[i]
                tip=p+radial(k*2.4+b,0.22,rng.uniform(-0.25,0.25))
                wood.tube([p,tip],[0.003,0.0008],(0.27,0.28,0.12),4)
                for n in range(4):
                    q=p.lerp(tip,(n+1)/4)
                    leaves.leaf(q,radial(n*2.4,1,0.3),0.085,0.047,tint((0.16,0.29,0.09)))
                if i>7 and (i+k+b)%3!=0:
                    for n in range(3): flowers.leaf(tip,radial(n*math.tau/3,1,0.4),0.047,0.037,tint((0.57,0.035,0.21)))
    return [wood,leaves,flowers]

builders={'olea-europaea':olive,'salvia-rosmarinus':lambda l:shrub('salvia-rosmarinus',l),'salvia-fruticosa':lambda l:shrub('salvia-fruticosa',l),'myrtus-communis':lambda l:shrub('myrtus-communis',l),'limonium-perezii':limonium,'leymus-arenarius':lambda l:grass('leymus-arenarius',l),'lomandra-longifolia':lambda l:grass('lomandra-longifolia',l),'bougainvillea-glabra':bougainvillea}
for name,build in builders.items():
    for light in [False,True]:
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)
        rng.seed(1309)
        for part in build(light):
            if part.f: part.object()
        bpy.context.scene.unit_settings.system='METRIC'
        filename=name+('-light' if light else '')
        bpy.ops.export_scene.gltf(filepath=str(OUT/(filename+'.glb')),export_format='GLB',export_yup=True,export_materials='EXPORT',export_extras=True)
        print(filename, sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH'), flush=True)

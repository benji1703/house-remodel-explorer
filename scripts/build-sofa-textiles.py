"""Finish the sofa in Blender at real scale, including collision-settled linen.

Run build-tailored-sofa.mjs first, then this file with Blender/bpy Python.
The architectural model and the furniture's existing envelope are untouched.
The cloth simulation and neutral contact bake are exported once, not run in
the browser. Runtime lighting, finish selection and furniture editing remain live.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models/interior'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def import_asset(name):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(OUT / f'{name}.glb'))
    return [o for o in bpy.context.scene.objects if o not in before and o.type == 'MESH']

sofa = import_asset('tailored-linen-sofa')
styling = import_asset('sofa-linen')
for obj in sofa:
    obj.modifiers.new('Sofa cloth support', 'COLLISION')
    obj.collision.thickness_outer = .003
    obj.collision.cloth_friction = 18

# Place one folded-width throw loosely across the north arm. Gravity resolves
# its seat contact, the rounded arm crest, and the free outside/front hems.
nx, nz = 46, 50
vertices, faces = [], []
for j in range(nz + 1):
    v = j / nz
    for i in range(nx + 1):
        u = i / nx
        x = -.66 + .82 * u + .014 * math.sin(v * 5)
        z = -1.34 + .84 * v + .022 * u
        y = .785 + .008 * math.sin(v * 19 + u * 7) + .004 * math.sin(u * 26)
        vertices.append((x, -z, y))
for j in range(nz):
    for i in range(nx):
        n = j * (nx + 1) + i
        faces.append((n, n + nx + 1, n + nx + 2, n + 1))
mesh = bpy.data.meshes.new('Continuous linen cloth')
mesh.from_pydata(vertices, [], faces)
mesh.update()
throw = bpy.data.objects.new('Linen throw with gravity-settled folds', mesh)
bpy.context.collection.objects.link(throw)
uv = mesh.uv_layers.new(name='Linen physical UV')
for polygon in mesh.polygons:
    polygon.use_smooth = True
    for loop in polygon.loop_indices:
        index = mesh.loops[loop].vertex_index
        uv.data[loop].uv = (index % (nx + 1) / nx * .82, index // (nx + 1) / nz * .84)
material = bpy.data.materials.new('Mood linen flax throw')
material.diffuse_color = (.52, .455, .36, 1)
material.use_nodes = True
material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = material.diffuse_color
material.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = .93
mesh.materials.append(material)
cloth = throw.modifiers.new('Baked linen drape', 'CLOTH')
cloth.settings.quality = 10
cloth.settings.mass = .22
cloth.settings.tension_stiffness = 22
cloth.settings.compression_stiffness = 22
cloth.settings.shear_stiffness = 12
cloth.settings.bending_stiffness = .7
cloth.settings.air_damping = 3
cloth.collision_settings.collision_quality = 5
cloth.collision_settings.distance_min = .004
cloth.collision_settings.use_self_collision = True
cloth.collision_settings.self_distance_min = .003
cloth.point_cache.frame_end = 85
bpy.context.scene.render.fps = 24
for frame in range(1, 86):
    bpy.context.scene.frame_set(frame)
    # Force dependency-graph evaluation in background bpy as well as Blender.
    evaluated = throw.evaluated_get(bpy.context.evaluated_depsgraph_get())
    evaluated.to_mesh()
    evaluated.to_mesh_clear()
    if frame % 20 == 0:
        print('Cloth frame', frame, flush=True)
bpy.context.view_layer.objects.active = throw
bpy.ops.object.modifier_apply(modifier=cloth.name)
smooth = throw.modifiers.new('Relax linen collision creases', 'SMOOTH')
smooth.factor = .45
smooth.iterations = 5
bpy.ops.object.modifier_apply(modifier=smooth.name)

# A narrow stitched hem follows the simulated edge, with actual fabric thickness.
edge = list(range(nx + 1))
edge += [j * (nx + 1) + nx for j in range(1, nz + 1)]
edge += [nz * (nx + 1) + i for i in range(nx - 1, -1, -1)]
edge += [j * (nx + 1) for j in range(nz - 1, 0, -1)]
curve = bpy.data.curves.new('Bound linen edge', 'CURVE')
curve.dimensions = '3D'
curve.bevel_depth = .0013
curve.bevel_resolution = 2
spline = curve.splines.new('POLY')
spline.points.add(len(edge) - 1)
spline.use_cyclic_u = True
for point, index in zip(spline.points, edge):
    point.co = (*throw.data.vertices[index].co, 1)
hem = bpy.data.objects.new('Fine stitched throw hem', curve)
bpy.context.collection.objects.link(hem)
hem.data.materials.append(material)
bpy.ops.object.select_all(action='DESELECT')
hem.select_set(True)
bpy.context.view_layer.objects.active = hem
bpy.ops.object.convert(target='MESH')
hem = bpy.context.object
subdivision = throw.modifiers.new('Continuous cloth folds', 'SUBSURF')
subdivision.levels = 1
bpy.context.view_layer.objects.active = throw
bpy.ops.object.modifier_apply(modifier=subdivision.name)
solid = throw.modifiers.new('Linen thickness', 'SOLIDIFY')
solid.thickness = .0016
solid.offset = 0
bpy.context.view_layer.objects.active = throw
bpy.ops.object.modifier_apply(modifier=solid.name)
styling += [throw, hem]
for obj in sofa:
    for modifier in list(obj.modifiers):
        if modifier.type == 'COLLISION':
            obj.modifiers.remove(modifier)

# Bake only short-range occlusion into neutral vertex colours. This supplies
# seam/under-cushion contact in both quality levels without extra render passes.
objects = sofa + styling
points, polygons = [], []
for obj in objects:
    offset = len(points)
    points += [obj.matrix_world @ v.co for v in obj.data.vertices]
    polygons += [tuple(offset + i for i in p.vertices) for p in obj.data.polygons]
bvh = BVHTree.FromPolygons(points, polygons)
samples = []
for i in range(24):
    r = math.sqrt((i + .5) / 24)
    angle = i * 2.399963229728653
    samples.append(Vector((r * math.cos(angle), r * math.sin(angle), math.sqrt(1 - r * r))))
for obj in objects:
    obj.data.update()
    layer = obj.data.color_attributes.new(name='Contact shading', type='FLOAT_COLOR', domain='POINT')
    obj.data.color_attributes.active_color = layer
    normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
    for vertex in obj.data.vertices:
        normal = (normal_matrix @ vertex.normal).normalized()
        rotation = Vector((0, 0, 1)).rotation_difference(normal)
        origin = obj.matrix_world @ vertex.co + normal * .003
        occlusion = 0
        for direction in samples:
            hit, _, _, distance = bvh.ray_cast(origin, rotation @ direction, .22)
            if hit is not None:
                occlusion += (1 - distance / .22) ** 1.5
        value = 1 - .36 * occlusion / len(samples)
        layer.data[vertex.index].color = (value, value, value, 1)
    print('Contact bake', obj.name, len(obj.data.vertices), flush=True)

for name, group in [('tailored-linen-sofa', sofa), ('sofa-linen', styling)]:
    for light in [False, True]:
        if light:
            for obj in group:
                if len(obj.data.polygons) < 100:
                    continue
                bpy.context.view_layer.objects.active = obj
                modifier = obj.modifiers.new('Mobile geometry budget', 'DECIMATE')
                modifier.ratio = .5 if obj == throw else .32
                bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.ops.object.select_all(action='DESELECT')
        for obj in group:
            obj.select_set(True)
        bpy.ops.export_scene.gltf(filepath=str(OUT / f'{name}{"-light" if light else ""}.glb'),
            export_format='GLB', use_selection=True, export_yup=True,
            export_materials='EXPORT', export_extras=True, export_vertex_color='ACTIVE')
        print('EXPORTED', name, 'light' if light else 'high', flush=True)

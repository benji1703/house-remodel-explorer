"""Blender-authored linens fitted to the existing 160 x 200 cm bed.
Run with bpy Python or Blender --background --python. No room geometry changes.
The runner is gravity-settled against the same duvet used in furniture.tsx.
"""
import bpy
import math
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'public/models/interior'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color):
    value = bpy.data.materials.new(name)
    value.diffuse_color = (*color, 1)
    value.use_nodes = True
    shader = value.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = value.diffuse_color
    shader.inputs['Roughness'].default_value = .95
    return value

flax = material('Mood linen bed runner', (.52, .455, .36))
sage = material('Mood linen sage lumbar', (.28, .32, .235))

def surface(name, nx, nz, fn, finish=None):
    positions = [fn(i / nx, j / nz) for j in range(nz + 1) for i in range(nx + 1)]
    # Author X/Y-up/Z plan coordinates, then export Blender Z-up to GLB Y-up.
    positions = [(x, -z, y) for x, y, z in positions]
    faces = [(n, n + nx + 1, n + nx + 2, n + 1)
        for j in range(nz) for i in range(nx) for n in [j * (nx + 1) + i]]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(positions, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name='Physical linen UV')
    for polygon in mesh.polygons:
        polygon.use_smooth = True
        for loop in polygon.loop_indices:
            index = mesh.loops[loop].vertex_index
            uv.data[loop].uv = (index % (nx + 1) / nx * 1.74, index // (nx + 1) / nz * .53)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if finish:
        mesh.materials.append(finish)
    return obj

def duvet_height(x, z):
    # z is relative to the bed; the existing duvet is centred at z = -22 cm.
    z += .22
    side = max(0, (abs(x) - .70) / .13)
    foot = max(0, (-z - .60) / .14)
    crease = math.exp(-((x - .34) / .30) ** 2 - ((z + .35) / .38) ** 2)
    folds = math.sin(x * 14 + z * 3) * .003 + math.sin(z * 19 - x * 4) * .002
    folds += crease * .008 * math.sin(x * 34 + z * 18)
    return .035 + folds + math.exp(-((z - .63) / .07) ** 2) * .045 - side ** 2 * .15 - foot ** 2 * .10

duvet = surface('Existing duvet collision support', 64, 56,
    lambda u, v: ((u - .5) * 1.66, duvet_height((u - .5) * 1.66, (v - .5) * 1.48 - .22), (v - .5) * 1.48 - .22))
duvet.modifiers.new('Duvet support', 'COLLISION')
duvet.collision.thickness_outer = .002
duvet.collision.cloth_friction = 20

# The mattress supports the sides where the duvet curves down.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -.11))
mattress = bpy.context.object
mattress.dimensions = (1.55, 1.95, .22)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bevel = mattress.modifiers.new('Existing mattress edge', 'BEVEL')
bevel.width = .06
bevel.segments = 4
bpy.context.view_layer.objects.active = mattress
bpy.ops.object.modifier_apply(modifier=bevel.name)
mattress.modifiers.new('Mattress support', 'COLLISION')
mattress.collision.thickness_outer = .002

def runner_start(u, v):
    x = (u - .5) * 1.74
    z = -.49 + (v - .5) * .53 + .015 * math.sin(u * 4)
    y = max(.02, duvet_height(max(-.81, min(.81, x)), z)) + .018
    return x, y + .004 * math.sin(u * 20 + v * 5), z

nx, nz = 70, 26
runner = surface('Washed linen runner with settled folds', nx, nz, runner_start, flax)
cloth = runner.modifiers.new('Baked gravity drape', 'CLOTH')
cloth.settings.quality = 8
cloth.settings.mass = .20
cloth.settings.tension_stiffness = 25
cloth.settings.compression_stiffness = 25
cloth.settings.shear_stiffness = 15
cloth.settings.bending_stiffness = .28
cloth.collision_settings.collision_quality = 4
cloth.collision_settings.distance_min = .003
cloth.point_cache.frame_end = 55
for frame in range(1, 56):
    bpy.context.scene.frame_set(frame)
    evaluated = runner.evaluated_get(bpy.context.evaluated_depsgraph_get())
    evaluated.to_mesh()
    evaluated.to_mesh_clear()
bpy.context.view_layer.objects.active = runner
bpy.ops.object.modifier_apply(modifier=cloth.name)
smooth = runner.modifiers.new('Relax settled linen', 'SMOOTH')
smooth.factor = .4
smooth.iterations = 4
bpy.ops.object.modifier_apply(modifier=smooth.name)
subdivision = runner.modifiers.new('Continuous linen folds', 'SUBSURF')
subdivision.levels = 1
bpy.ops.object.modifier_apply(modifier=subdivision.name)
solid = runner.modifiers.new('Woven runner thickness', 'SOLIDIFY')
solid.thickness = .0018
solid.offset = 0
bpy.ops.object.modifier_apply(modifier=solid.name)

# A filled lumbar cushion, rounded corners, soft crown and a restrained seam.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -.36, .162))
pillow = bpy.context.object
pillow.name = 'Soft sage lumbar cushion'
pillow.dimensions = (.69, .19, .235)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bevel = pillow.modifiers.new('Soft stitched corners', 'BEVEL')
bevel.width = .048
bevel.segments = 8
bpy.ops.object.modifier_apply(modifier=bevel.name)
subdivision = pillow.modifiers.new('Filled cushion surface', 'SUBSURF')
subdivision.subdivision_type = 'SIMPLE'
subdivision.levels = 3
bpy.ops.object.modifier_apply(modifier=subdivision.name)
for vertex in pillow.data.vertices:
    x, y, z = vertex.co
    nxv, nzv = x / .345, z / .1175
    fullness = max(0, 1 - nxv ** 4) * max(0, 1 - nzv ** 4)
    vertex.co.y += math.copysign(.022 * fullness, y)
    vertex.co.y += .002 * math.sin(x * 37 + z * 19) * abs(nxv) ** 7
for polygon in pillow.data.polygons:
    polygon.use_smooth = True
pillow.rotation_euler.x = -.16
pillow.data.materials.append(sage)
# UV unwrap avoids the single-axis bump stretching of the old cushion.
bpy.ops.object.select_all(action='DESELECT')
pillow.select_set(True)
bpy.context.view_layer.objects.active = pillow
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.02)
bpy.ops.object.mode_set(mode='OBJECT')

for obj in [duvet, mattress]:
    bpy.data.objects.remove(obj, do_unlink=True)
for light in [False, True]:
    if light:
        for obj in [runner, pillow]:
            bpy.context.view_layer.objects.active = obj
            modifier = obj.modifiers.new('Mobile linen budget', 'DECIMATE')
            modifier.ratio = .35
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.select_all(action='DESELECT')
    runner.select_set(True)
    pillow.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT / f'bed-linen{"-light" if light else ""}.glb'),
        export_format='GLB', use_selection=True, export_yup=True, export_materials='EXPORT')
    print('EXPORTED bed-linen', 'light' if light else 'high', flush=True)

"""
方案二 gold-and-jade key, lying horizontal: 天圆地方.

Cabochon mutton-fat jade bi facing the camera, gold backing and
square liner, rim bezel, double collar, round stem, 回-meander bit.

  blender --background --python scripts/export-key.py
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models"
OUT.mkdir(parents=True, exist_ok=True)

JADE_R = 0.33
JADE_T = 0.17
HOLE = 0.128
LINER = 0.02
CORNER = 0.01
BEZEL_R = 0.0065
BACK_T = 0.018
STEM_R = 0.024
STEM_LEN = 1.02
COLLAR_MAJOR = 0.052
COLLAR_MINOR = 0.011
BIT_W = 0.38
BIT_H = 0.26
BIT_T = 0.034
STROKE = 0.018


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def set_input(bsdf: bpy.types.Node, names: tuple[str, ...], value) -> None:
    for name in names:
        socket = bsdf.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return


def principled(name: str, **values) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    mapping = {
        "color": (("Base Color",),),
        "metallic": (("Metallic",),),
        "roughness": (("Roughness",),),
        "transmission": (("Transmission Weight", "Transmission"),),
        "ior": (("IOR",),),
        "coat": (("Coat Weight", "Clearcoat"),),
        "coat_rough": (("Coat Roughness", "Clearcoat Roughness"),),
        "sss": (("Subsurface Weight", "Subsurface"),),
        "sss_radius": (("Subsurface Radius",),),
    }
    for key, value in values.items():
        set_input(bsdf, mapping[key][0], value)
    return material


def activate(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def apply_transform(obj: bpy.types.Object, *, location: bool = False, rotation: bool = False, scale: bool = True) -> None:
    activate(obj)
    bpy.ops.object.transform_apply(location=location, rotation=rotation, scale=scale)


def boolean_cut(obj: bpy.types.Object, cutter: bpy.types.Object) -> None:
    modifier = obj.modifiers.new("Cut", "BOOLEAN")
    modifier.operation = "DIFFERENCE"
    modifier.object = cutter
    if hasattr(modifier, "solver"):
        modifier.solver = "EXACT"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Cut")
    bpy.data.objects.remove(cutter, do_unlink=True)


def bevel(obj: bpy.types.Object, width: float, segments: int = 4) -> None:
    modifier = obj.modifiers.new("Bevel", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    modifier.angle_limit = math.radians(30)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Bevel")


def shade_smooth(obj: bpy.types.Object) -> None:
    activate(obj)
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except Exception:
        bpy.ops.object.shade_smooth()


def cube(name: str, location: tuple[float, float, float], size: tuple[float, float, float]) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    apply_transform(obj, scale=True)
    return obj


def rounded_prism(name: str, location: tuple[float, float, float], size: tuple[float, float, float], corner: float) -> bpy.types.Object:
    obj = cube(name, location, size)
    bevel(obj, min(corner, min(size) * 0.35), 5)
    return obj


def make_jade(material: bpy.types.Material, origin: tuple[float, float, float]) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=128,
        ring_count=64,
        radius=1,
        location=origin,
    )
    jade = bpy.context.object
    jade.name = "JadeBi"
    jade.data.name = "JadeBi"
    jade.scale = (JADE_R, JADE_T / 2, JADE_R)
    apply_transform(jade, scale=True)
    back = cube("JadeBackCut", (origin[0], JADE_T, origin[2]), (JADE_R * 2.6, JADE_T * 2, JADE_R * 2.6))
    boolean_cut(jade, back)
    hole = HOLE + 2 * LINER
    cutter = rounded_prism("JadeCutter", origin, (hole, JADE_T * 2.4, hole), CORNER)
    boolean_cut(jade, cutter)
    bevel(jade, 0.0028, 3)
    shade_smooth(jade)
    jade.data.materials.append(material)
    return jade


def make_backing(origin: tuple[float, float, float]) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=128,
        radius=JADE_R * 0.995,
        depth=BACK_T,
        location=(origin[0], BACK_T / 2, origin[2]),
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    backing = bpy.context.object
    backing.name = "GoldBack"
    apply_transform(backing, rotation=True, scale=True)
    hole = HOLE + 2 * LINER
    cutter = rounded_prism("BackCutter", (origin[0], BACK_T / 2, origin[2]), (hole, BACK_T * 2.4, hole), CORNER)
    boolean_cut(backing, cutter)
    bevel(backing, 0.0018, 3)
    return backing


def make_liner(origin: tuple[float, float, float]) -> bpy.types.Object:
    outer = HOLE + 2 * LINER
    y_thick = JADE_T * 0.72 + BACK_T + 0.01
    y_center = -0.018
    loc = (origin[0], y_center, origin[2])
    liner = rounded_prism("GoldLiner", loc, (outer, y_thick, outer), CORNER * 0.9)
    void = rounded_prism("LinerVoid", loc, (HOLE, y_thick * 1.5, HOLE), CORNER * 0.7)
    boolean_cut(liner, void)
    bevel(liner, 0.0016, 3)
    return liner


def make_bezel(origin: tuple[float, float, float]) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=JADE_R - BEZEL_R * 0.15,
        minor_radius=BEZEL_R,
        major_segments=128,
        minor_segments=20,
        location=origin,
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    bezel = bpy.context.object
    bezel.name = "GoldBezel"
    apply_transform(bezel, rotation=True, scale=True)
    return bezel


def make_collar(x: float, z: float) -> list[bpy.types.Object]:
    rings: list[bpy.types.Object] = []
    for i, (major, dx) in enumerate(((COLLAR_MAJOR, 0.0), (COLLAR_MAJOR * 0.88, 0.026))):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=major,
            minor_radius=COLLAR_MINOR,
            major_segments=80,
            minor_segments=20,
            location=(x + dx, 0.0, z),
            rotation=(0.0, math.pi / 2, 0.0),
        )
        ring = bpy.context.object
        ring.name = f"GoldCollar{i}"
        apply_transform(ring, rotation=True, scale=True)
        rings.append(ring)
    return rings


def make_stem(x0: float, x1: float, z: float) -> bpy.types.Object:
    depth = x1 - x0
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=96,
        radius=STEM_R,
        depth=depth,
        location=(x0 + depth / 2, 0.0, z),
        rotation=(0.0, math.pi / 2, 0.0),
    )
    stem = bpy.context.object
    stem.name = "GoldStem"
    apply_transform(stem, rotation=True, scale=True)
    return stem


def curve_meander(name: str, points: list[tuple[float, float, float]], radius: float) -> bpy.types.Object:
    curve_data = bpy.data.curves.new(name, "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 12
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 6
    curve_data.fill_mode = "FULL"
    spline = curve_data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for i, (x, y, z) in enumerate(points):
        spline.points[i].co = (x, y, z, 1.0)
    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    activate(obj)
    bpy.ops.object.convert(target="MESH")
    mesh = bpy.context.object
    mesh.name = name
    return mesh


def make_bit(stem_end: float, z: float) -> list[bpy.types.Object]:
    """Solid gold plate plus a raised 回 meander (square spiral)."""
    cx = stem_end + BIT_W * 0.42
    cz = z
    plate = rounded_prism("GoldBitPlate", (cx, 0.0, cz), (BIT_W, BIT_T * 0.55, BIT_H), 0.012)
    bevel(plate, 0.002, 3)

    left = cx - BIT_W * 0.42
    right = cx + BIT_W * 0.42
    bottom = cz - BIT_H * 0.38
    top = cz + BIT_H * 0.38
    y = -BIT_T * 0.22
    m = STROKE * 1.15
    pts = [
        (left + m, y, bottom + m),
        (right - m, y, bottom + m),
        (right - m, y, top - m),
        (left + m, y, top - m),
        (left + m, y, bottom + m * 3.2),
        (right - m * 3.1, y, bottom + m * 3.2),
        (right - m * 3.1, y, top - m * 3.1),
        (left + m * 3.1, y, top - m * 3.1),
        (left + m * 3.1, y, bottom + m * 5.2),
        (right - m * 5.0, y, bottom + m * 5.2),
        (right - m * 5.0, y, top - m * 5.2),
        (left + m * 5.0, y, top - m * 5.2),
    ]
    meander = curve_meander("GoldBitMeander", pts, STROKE * 0.48)
    bevel(meander, 0.0012, 3)
    return [plate, meander]


def join_gold(parts: list[bpy.types.Object], material: bpy.types.Material) -> bpy.types.Object:
    for obj in parts:
        shade_smooth(obj)
        if not obj.data.materials:
            obj.data.materials.append(material)
        elif obj.data.materials[0] != material:
            obj.data.materials[0] = material
    bpy.ops.object.select_all(action="DESELECT")
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    gold = bpy.context.object
    gold.name = "GoldKey"
    gold.data.name = "GoldKey"
    print("Gold dim", tuple(round(v, 4) for v in gold.dimensions))
    return gold


def sit_on_floor(*objects: bpy.types.Object) -> None:
    min_z = min(
        (obj.matrix_world @ Vector(corner)).z
        for obj in objects
        for corner in obj.bound_box
    )
    for obj in objects:
        obj.location.z -= min_z
        apply_transform(obj, location=True)


def export_glb(objects: list[bpy.types.Object]) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    path = OUT / "key.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print(f"Wrote {path} ({path.stat().st_size} bytes)")


def main() -> None:
    clear_scene()
    jade_mat = principled(
        "MuttonFatJade",
        color=(0.78, 0.86, 0.74, 1.0),
        metallic=0.0,
        roughness=0.2,
        transmission=0.28,
        ior=1.62,
        coat=0.42,
        coat_rough=0.2,
        sss=0.35,
        sss_radius=(0.4, 0.55, 0.35),
    )
    gold_mat = principled(
        "KeyGold",
        color=(0.86, 0.62, 0.18, 1.0),
        metallic=1.0,
        roughness=0.11,
        coat=0.35,
        coat_rough=0.06,
    )

    jade_x = -0.58
    jade_z = JADE_R
    origin = (jade_x, 0.0, jade_z)
    collar_x = jade_x + JADE_R * 0.82
    stem_x0 = collar_x + 0.02
    stem_x1 = stem_x0 + STEM_LEN

    jade = make_jade(jade_mat, origin)
    stem = make_stem(stem_x0, stem_x1, jade_z)
    gold_parts = [
        stem,
        make_backing(origin),
        make_liner(origin),
        make_bezel(origin),
        *make_collar(collar_x, jade_z),
        *make_bit(stem_x1, jade_z),
    ]
    gold = join_gold(gold_parts, gold_mat)
    sit_on_floor(jade, gold)
    print("Jade dim", tuple(round(v, 4) for v in jade.dimensions), "loc", tuple(round(v, 4) for v in jade.location))
    export_glb([jade, gold])


if __name__ == "__main__":
    main()

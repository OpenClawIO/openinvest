"""
方案二 gold-and-jade key: 天圆地方.

Cabochon jade bi, gold backing, square gold-lined hole, rim bezel,
bell collar, round stem, thin 回-pattern bit.

  blender --background --python scripts/export-key.py
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models"
OUT.mkdir(parents=True, exist_ok=True)

JADE_R = 0.30
JADE_T = 0.13
HOLE = 0.138
LINER = 0.022
BEZEL_R = 0.008
BACK_T = 0.016
STEM_R = 0.031
STEM_LEN = 1.12
COLLAR_MAJOR = 0.062
COLLAR_MINOR = 0.014
BIT_W = 0.42
BIT_H = 0.28
BIT_T = 0.036
STROKE = 0.016


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
    }
    for key, value in values.items():
        set_input(bsdf, mapping[key][0], value)
    return material


def apply_transform(obj: bpy.types.Object, *, location: bool = False, rotation: bool = False, scale: bool = True) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=location, rotation=rotation, scale=scale)


def apply_scale(obj: bpy.types.Object) -> None:
    apply_transform(obj, scale=True)


def boolean_cut(obj: bpy.types.Object, cutter: bpy.types.Object) -> None:
    modifier = obj.modifiers.new("Cut", "BOOLEAN")
    modifier.operation = "DIFFERENCE"
    modifier.object = cutter
    if hasattr(modifier, "solver"):
        modifier.solver = "EXACT"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Cut")
    bpy.data.objects.remove(cutter, do_unlink=True)


def bevel(obj: bpy.types.Object, width: float, segments: int = 3) -> None:
    modifier = obj.modifiers.new("Bevel", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Bevel")


def shade_smooth(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    except Exception:
        bpy.ops.object.shade_smooth()


def cube(name: str, location: tuple[float, float, float], size: tuple[float, float, float]) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    apply_scale(obj)
    return obj


def make_jade(material: bpy.types.Material, z_center: float) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=96,
        ring_count=48,
        radius=1,
        location=(0.0, 0.0, z_center),
    )
    jade = bpy.context.object
    jade.name = "JadeBi"
    jade.data.name = "JadeBi"
    jade.scale = (JADE_R, JADE_T / 2, JADE_R)
    apply_scale(jade)
    # Keep the camera-facing cabochon (Blender -Y → glTF +Z). Cut only Y >= 0.
    back = cube("JadeBackCut", (0.0, JADE_T, z_center), (JADE_R * 2.5, JADE_T * 2, JADE_R * 2.5))
    boolean_cut(jade, back)
    hole = HOLE + 2 * LINER
    cutter = cube("JadeCutter", (0.0, 0.0, z_center), (hole, JADE_T * 2.2, hole))
    boolean_cut(jade, cutter)
    bevel(jade, 0.0035, 2)
    shade_smooth(jade)
    jade.data.materials.append(material)
    return jade


def make_backing(z_center: float) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=96,
        radius=JADE_R * 0.992,
        depth=BACK_T,
        location=(0.0, BACK_T / 2, z_center),
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    backing = bpy.context.object
    backing.name = "GoldBack"
    apply_transform(backing, rotation=True, scale=True)
    hole = HOLE + 2 * LINER
    cutter = cube("BackCutter", (0.0, BACK_T / 2, z_center), (hole, BACK_T * 2.2, hole))
    boolean_cut(backing, cutter)
    bevel(backing, 0.002, 2)
    return backing


def make_liner(z_center: float) -> bpy.types.Object:
    outer = HOLE + 2 * LINER
    y_thick = 0.15
    y_center = -0.036
    liner = cube("GoldLiner", (0.0, y_center, z_center), (outer, y_thick, outer))
    void = cube("LinerVoid", (0.0, y_center, z_center), (HOLE, y_thick * 1.4, HOLE))
    boolean_cut(liner, void)
    bevel(liner, 0.0028, 2)
    return liner


def make_bezel(z_center: float) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=JADE_R - BEZEL_R * 0.2,
        minor_radius=BEZEL_R,
        major_segments=96,
        minor_segments=16,
        location=(0.0, 0.0, z_center),
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    bezel = bpy.context.object
    bezel.name = "GoldBezel"
    apply_transform(bezel, rotation=True, scale=True)
    return bezel


def make_collar(z_top: float) -> list[bpy.types.Object]:
    bpy.ops.mesh.primitive_cone_add(
        vertices=64,
        radius1=STEM_R * 1.08,
        radius2=COLLAR_MAJOR * 0.92,
        depth=0.058,
        location=(0.0, 0.0, z_top - 0.012),
    )
    bell = bpy.context.object
    bell.name = "GoldBell"
    rings: list[bpy.types.Object] = [bell]
    for i, (major, z) in enumerate(
        (
            (COLLAR_MAJOR, z_top - 0.004),
            (COLLAR_MAJOR * 0.86, z_top - 0.032),
        )
    ):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=major,
            minor_radius=COLLAR_MINOR,
            major_segments=64,
            minor_segments=16,
            location=(0.0, 0.0, z),
        )
        ring = bpy.context.object
        ring.name = f"GoldCollar{i}"
        rings.append(ring)
    return rings


def make_stem(z0: float, z1: float) -> bpy.types.Object:
    depth = z1 - z0
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64,
        radius=STEM_R,
        depth=depth,
        location=(0.0, 0.0, z0 + depth / 2),
    )
    stem = bpy.context.object
    stem.name = "GoldStem"
    return stem


def make_bit() -> list[bpy.types.Object]:
    """Thin gold plate with raised nested 回 frames, extending +X from the stem foot."""
    s = STROKE
    g = 0.028
    cx = STEM_R * 0.12 + BIT_W / 2
    cz = BIT_H / 2
    plate = cube("GoldBitPlate", (cx, BIT_T * 0.12, cz), (BIT_W, BIT_T * 0.4, BIT_H))
    bevel(plate, 0.0016, 2)

    outer = cube("GoldBit", (cx, -BIT_T * 0.12, cz), (BIT_W, BIT_T * 0.72, BIT_H))
    outer_void = cube(
        "BitOuterVoid",
        (cx, -BIT_T * 0.12, cz),
        (BIT_W - 2 * s, BIT_T * 1.8, BIT_H - 2 * s),
    )
    boolean_cut(outer, outer_void)
    bevel(outer, 0.0016, 2)

    inner_w = BIT_W - 2 * s - 2 * g
    inner_h = BIT_H - 2 * s - 2 * g
    inner = cube("GoldBitInner", (cx, -BIT_T * 0.12, cz), (inner_w, BIT_T * 0.72, inner_h))
    inner_void = cube(
        "BitInnerVoid",
        (cx, -BIT_T * 0.12, cz),
        (inner_w - 2 * s, BIT_T * 1.8, inner_h - 2 * s),
    )
    boolean_cut(inner, inner_void)
    gap = cube(
        "BitGap",
        (cx - inner_w / 2 + s * 0.5, -BIT_T * 0.12, cz - inner_h / 2 + s * 0.15),
        (s * 1.35, BIT_T * 1.8, s * 1.6),
    )
    boolean_cut(inner, gap)
    bevel(inner, 0.0014, 2)
    return [plate, outer, inner]


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
        color=(0.52, 0.74, 0.58, 1.0),
        metallic=0.0,
        roughness=0.22,
        transmission=0.16,
        ior=1.61,
        coat=0.48,
        coat_rough=0.18,
    )
    gold_mat = principled(
        "KeyGold",
        color=(0.83, 0.58, 0.16, 1.0),
        metallic=1.0,
        roughness=0.14,
        coat=0.28,
        coat_rough=0.08,
    )

    bit_h = BIT_H
    stem_z0 = bit_h * 0.38
    stem_z1 = stem_z0 + STEM_LEN
    collar_z = stem_z1
    jade_z = collar_z + COLLAR_MINOR + JADE_R * 0.78

    jade = make_jade(jade_mat, jade_z)
    stem = make_stem(stem_z0, stem_z1)
    gold_parts = [
        stem,
        make_backing(jade_z),
        make_liner(jade_z),
        make_bezel(jade_z),
        *make_collar(collar_z),
        *make_bit(),
    ]
    gold = join_gold(gold_parts, gold_mat)
    print("Jade dim", tuple(round(v, 4) for v in jade.dimensions), "loc", tuple(round(v, 4) for v in jade.location))
    export_glb([jade, gold])


if __name__ == "__main__":
    main()

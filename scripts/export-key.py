"""
Heaven-round, earth-square key.

Mutton-fat jade bi (circle) with a gold square stem through it.

  blender --background --python scripts/export-key.py
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models"
OUT.mkdir(parents=True, exist_ok=True)

JADE_R = 0.44
JADE_T = 0.12
HOLE = 0.17
ROD = 0.168
ROD_LEN = 1.52
PIN = 0.08
BIT = 0.22
DISC_X = -0.62


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


def apply_boolean(obj: bpy.types.Object, cutter: bpy.types.Object) -> None:
    modifier = obj.modifiers.new("Hole", "BOOLEAN")
    modifier.operation = "DIFFERENCE"
    modifier.object = cutter
    if hasattr(modifier, "solver"):
        modifier.solver = "EXACT"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Hole")
    bpy.data.objects.remove(cutter, do_unlink=True)


def bevel(obj: bpy.types.Object, width: float, segments: int = 2) -> None:
    modifier = obj.modifiers.new("Bevel", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Bevel")


def shade_smooth(obj: bpy.types.Object) -> None:
    mesh = obj.data
    if hasattr(mesh, "use_auto_smooth"):
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = math.radians(40)
    for poly in mesh.polygons:
        poly.use_smooth = True


def make_jade(material: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=96,
        radius=JADE_R,
        depth=JADE_T,
        location=(DISC_X, 0.0, JADE_T / 2),
    )
    jade = bpy.context.object
    jade.name = "JadeBi"
    jade.data.name = "JadeBi"
    bpy.ops.mesh.primitive_cube_add(size=1, location=(DISC_X, 0.0, JADE_T / 2))
    cutter = bpy.context.object
    cutter.scale = (HOLE / 2 + 0.002, HOLE / 2 + 0.002, JADE_T)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_boolean(jade, cutter)
    bevel(jade, 0.01, 3)
    shade_smooth(jade)
    jade.data.materials.append(material)
    return jade


def make_gold(material: bpy.types.Material) -> list[bpy.types.Object]:
    rod_x = DISC_X - PIN + ROD_LEN / 2
    bpy.ops.mesh.primitive_cube_add(size=1, location=(rod_x, 0.0, ROD / 2))
    rod = bpy.context.object
    rod.name = "GoldStem"
    rod.scale = (ROD_LEN / 2, ROD / 2, ROD / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(rod, 0.006, 2)

    bit_x = DISC_X - PIN + ROD_LEN + BIT / 2 - 0.04
    bpy.ops.mesh.primitive_cube_add(size=1, location=(bit_x, 0.0, ROD / 2))
    bit = bpy.context.object
    bit.name = "GoldBit"
    bit.scale = (BIT / 2, BIT / 2, BIT / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(bit, 0.006, 2)

    shade_smooth(rod)
    shade_smooth(bit)
    rod.data.materials.append(material)
    bit.data.materials.append(material)
    bpy.ops.object.select_all(action="DESELECT")
    rod.select_set(True)
    bit.select_set(True)
    bpy.context.view_layer.objects.active = rod
    bpy.ops.object.join()
    rod.name = "GoldStem"
    return [rod]


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
    )
    print(f"Wrote {path} ({path.stat().st_size} bytes)")


def main() -> None:
    clear_scene()
    jade_mat = principled(
        "MuttonFatJade",
        color=(0.93, 0.87, 0.74, 1.0),
        metallic=0.0,
        roughness=0.24,
        transmission=0.16,
        ior=1.61,
        coat=0.5,
        coat_rough=0.2,
    )
    gold_mat = principled(
        "KeyGold",
        color=(0.78, 0.55, 0.18, 1.0),
        metallic=1.0,
        roughness=0.16,
        coat=0.22,
        coat_rough=0.1,
    )
    jade = make_jade(jade_mat)
    gold = make_gold(gold_mat)
    export_glb([jade, *gold])


if __name__ == "__main__":
    main()

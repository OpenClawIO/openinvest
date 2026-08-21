"""
Export a unit 1 g gold round for OpenInvest.

The live site models the same profile in Three.js. This script is the Blender twin.

  blender --background --python scripts/export-studio.py
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models"
OUT.mkdir(parents=True, exist_ok=True)

PROFILE = [
    (0.0, 0.78),
    (0.2, 0.74),
    (0.48, 0.68),
    (0.62, 0.66),
    (0.68, 0.42),
    (0.76, 0.98),
    (0.9, 1.0),
    (0.97, 0.72),
    (1.0, 0.4),
    (1.0, -0.4),
    (0.97, -0.72),
    (0.9, -1.0),
    (0.76, -0.98),
    (0.68, -0.42),
    (0.62, -0.66),
    (0.48, -0.68),
    (0.2, -0.74),
    (0.0, -0.78),
]


def clear_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    for obj in list(scene.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def make_gold() -> bpy.types.Material:
    material = bpy.data.materials.new("Gold")
    material.use_nodes = True
    bsdf = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    color = (0.894, 0.765, 0.416, 1.0)

    def assign(names: tuple[str, ...], value) -> None:
        for name in names:
            socket = bsdf.inputs.get(name)
            if socket is not None:
                socket.default_value = value
                return

    assign(("Base Color",), color)
    assign(("Metallic",), 1.0)
    assign(("Roughness",), 0.18)
    assign(("Coat Weight", "Clearcoat"), 0.28)
    return material


def build_coin() -> bpy.types.Object:
    curve = bpy.data.curves.new("CoinProfile", "CURVE")
    curve.dimensions = "2D"
    spline = curve.splines.new("POLY")
    spline.points.add(len(PROFILE) - 1)
    radius, half = 0.2, 0.023
    for index, (x, y) in enumerate(PROFILE):
        spline.points[index].co = (x * radius, y * half, 0.0, 1.0)

    curve_obj = bpy.data.objects.new("CoinProfile", curve)
    bpy.context.collection.objects.link(curve_obj)
    bpy.context.view_layer.objects.active = curve_obj
    curve_obj.select_set(True)

    bpy.ops.object.convert(target="MESH")
    screw = curve_obj.modifiers.new("Spin", "SCREW")
    screw.axis = "Y"
    screw.steps = 96
    screw.render_steps = 96
    screw.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier="Screw")

    coin = bpy.context.active_object
    coin.name = "Coin"
    assign = make_gold()
    coin.data.materials.clear()
    coin.data.materials.append(assign)
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    except Exception:
        bpy.ops.object.shade_smooth()
    return coin


def export_glb(path: Path, obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_yup=True,
    )
    print(f"wrote {path}")


def main() -> int:
    clear_scene()
    coin = build_coin()
    export_glb(OUT / "coin.glb", coin)
    return 0


if __name__ == "__main__":
    sys.exit(main())

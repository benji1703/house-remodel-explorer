"""Authored trained bougainvillea using the shared pure-Python botanical exporter.

Y-up metres. Lower stems stay inside existing post sleeves; flowering shoots
follow local -Z along the existing outer beam. Both original anchors are retained.
Run with the project's NumPy-enabled Python; outputs stage outside public/.
"""
from __future__ import annotations
import argparse
import importlib.util
import json
import math
import random
from pathlib import Path

spec = importlib.util.spec_from_file_location("botanical", Path(__file__).with_name("build-landscape-pure.py"))
botanical = importlib.util.module_from_spec(spec)
spec.loader.exec_module(botanical)
Mesh = botanical.Mesh
add, mul, mix = botanical.add, botanical.mul, botanical.mix
radial, curve, tint = botanical.radial, botanical.curve, botanical.tint


def climber(light: bool):
    wood = Mesh("Bougainvillea trained stems and overhead branching", "Twig")
    leaves = Mesh("Bougainvillea ovate individual leaves", "Leaf")
    flowers = Mesh("Bougainvillea clustered papery magenta bracts", "Flower")
    for stem in range(3):
        phase = stem * 2.1
        # Root at zero, winding tightly beside the existing post. No lower
        # shoot is allowed to protrude into terrace circulation.
        path = [(.028 * math.sin(i * .63 + phase), i * .10,
                 .035 * math.cos(i * .63 + phase)) for i in range(27)]
        wood.tube(path, [.016 - i * .00033 for i in range(27)], (.18, .125, .072), 7)
        for node in range(3, 25):
            rng = random.Random(9109 + stem * 131 + node * 19)
            if light and node % 3 == 0:
                continue
            p = path[node]
            angle = node * 2.399 + phase
            tip = add(p, radial(angle, .028, .022))
            wood.tube([p, tip], [.0018, .0005], (.16, .17, .072), 4)
            leaves.leaf(tip, radial(angle + .3, 1, .55), .054, .027,
                        tint((.09, .18, .045), rng.uniform(.72, 1.18)), rng.uniform(-.5, .5))

        # The horizontal stems are supported along the existing outer beam.
        # Wide shoots begin above local 2.42m; their lowest leaf tips remain
        # above that level, including the conservative runtime height bands.
        beam = [add(path[-1], (.04 * math.sin(t * .8 + phase),
                              .085 + .040 * math.sin(t * .5 + phase),
                              -t * .09)) for t in range(24)]
        wood.tube([path[-1], *beam], [.0078, *[.0075 - t * .00025 for t in range(24)]],
                  (.19, .14, .076), 6)
        for shoot in range(34):
            rng = random.Random(27019 + stem * 601 + shoot * 37)
            visible = not light or (shoot + stem) % 3 != 0
            t = .08 + shoot * .86 / 33
            root = mix(beam[0], beam[-1], t)
            side = -1 if (shoot + stem) % 2 else 1
            tip = add(root, (side * rng.uniform(.12, .29),
                             rng.uniform(-.085, .15), rng.uniform(-.17, .17)))
            shoot_path = curve(root, tip, (0, .035, 0), 4)
            if visible:
                wood.tube(shoot_path, [.0026, .0022, .0016, .0010, .00035], (.15, .19, .067), 4)
            for node in range(8):
                p = add(mix(root, tip, .12 + node * .115), (0, .02, 0))
                angle = shoot * 2.399 + node * 2.05 + phase
                pigment = tint((.095, .205, .048), rng.uniform(.63, 1.19))
                if visible:
                    leaves.leaf(p, radial(angle, 1, rng.uniform(-.10, .65)),
                                rng.uniform(.060, .092), rng.uniform(.033, .048),
                                pigment, rng.uniform(-.85, .85))
            # Several nearby triads give the irregular, papery flower clusters
            # in the reference, rather than one evenly spaced magenta dot.
            for cluster in range(5):
                center = add(tip, radial(cluster * 2.399 + phase, .028,
                                         .012 + cluster * .009))
                for petal in range(3):
                    pigment = tint((.48, .016, .155), rng.uniform(.72, 1.18))
                    if visible:
                        flowers.leaf(center, radial(petal * math.tau / 3 + shoot * .7,
                                                   1, .15 + cluster * .055),
                                     rng.uniform(.032, .045), rng.uniform(.027, .036),
                                     pigment, rng.uniform(-.7, .7))
    return [wood, leaves, flowers]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("/tmp/house-climber-v2"))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    reports = []
    for light in (False, True):
        parts = climber(light)
        # Whole lower geometry must fit BOTH unchanged rotated post sleeves.
        lower = [p for part in parts for p in part.p if p[1] < 2.42]
        assert all(abs(p[0]) <= .12 and abs(p[2]) <= .18 for p in lower)
        name = "bougainvillea-glabra" + ("-light" if light else "")
        report = botanical.write_glb(parts, name, args.output)
        reports.append(report)
        print(json.dumps(report), flush=True)
    (args.output / "manifest.json").write_text(json.dumps(reports, indent=2) + "\n")


if __name__ == "__main__":
    main()

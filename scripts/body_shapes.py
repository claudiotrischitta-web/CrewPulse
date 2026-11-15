#!/usr/bin/env python3
"""CrewPulse body map: generates src/components/bodyShapes.ts - Python standard library only.

An original drawing in the muscle-map style: a body outline, muscle groups, clothing and hair,
for a male and a female figure, front and back. Each shape is a list of control points
(one figure = 120 x 300 units, centred on x = 60) joined by a smooth Catmull-Rom curve.
Right-side shapes are mirrored to the left.

Run:  python scripts/body_shapes.py
"""
from __future__ import annotations

import json
import math
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "components" / "bodyShapes.ts"


def fmt(v: float) -> str:
    return f"{v:.1f}".rstrip("0").rstrip(".")


def cr(pts, k=1.0) -> str:
    """Closed smooth path through the points."""
    n = len(pts)
    d = [f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"]
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k)
        d.append(f"C{fmt(c1[0])} {fmt(c1[1])} {fmt(c2[0])} {fmt(c2[1])} {fmt(p2[0])} {fmt(p2[1])}")
    return "".join(d) + "Z"


def mx(pts):
    return [(120 - x, y) for x, y in pts]


def pair(pts):
    """A right-side shape and its mirror image."""
    return [cr(pts), cr(list(reversed(mx(pts))))]


def sym(half):
    """Symmetric shape from its right half, listed from top centre to bottom centre."""
    return cr(half + list(reversed(mx(half[1:-1]))))


def rrect(x0, y0, x1, y1, r):
    return f"M{fmt(x0 + r)} {fmt(y0)}H{fmt(x1 - r)}Q{fmt(x1)} {fmt(y0)} {fmt(x1)} {fmt(y0 + r)}V{fmt(y1 - r)}Q{fmt(x1)} {fmt(y1)} {fmt(x1 - r)} {fmt(y1)}H{fmt(x0 + r)}Q{fmt(x0)} {fmt(y1)} {fmt(x0)} {fmt(y1 - r)}V{fmt(y0 + r)}Q{fmt(x0)} {fmt(y0)} {fmt(x0 + r)} {fmt(y0)}Z"


def rpair(x0, y0, x1, y1, r):
    return [rrect(x0, y0, x1, y1, r), rrect(120 - x1, y0, 120 - x0, y1, r)]


def ellipse(cx, cy, rx, ry, rot=0.0, n=12):
    a = math.radians(rot)
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts


def shift(pts, dx=0.0, sx=1.0):
    """Scale about the centre line, then shift."""
    return [(60 + (x - 60) * sx + dx, y) for x, y in pts]


def edges(poly, y):
    """Leftmost and rightmost x of a closed polygon at height y."""
    xs = []
    for i in range(len(poly)):
        (x0, y0), (x1, y1) = poly[i], poly[(i + 1) % len(poly)]
        if (y0 - y) * (y1 - y) <= 0 and y0 != y1:
            xs.append(x0 + (x1 - x0) * (y - y0) / (y1 - y0))
    return min(xs), max(xs)


def segment(poly, y0, y1, f0=0.0, f1=1.0, g=1.05, n=7):
    """Muscle filling a limb between two heights, from fraction f0 to f1 of its width (0 = inner side)."""
    right, left = [], []
    for i in range(n):
        t = i / (n - 1)
        y = y0 + (y1 - y0) * t
        xl, xr = edges(poly, y)
        w = xr - xl
        a = xl + w * f0 + (g if f0 == 0 else g / 2)
        b = xl + w * f1 - (g if f1 == 1 else g / 2)
        squeeze = 0.22 if i in (0, n - 1) else 0.0  # rounded ends
        c, h = (a + b) / 2, (b - a) / 2 * (1 - squeeze)
        right.append((c + h, y))
        left.append((c - h, y))
    return right + list(reversed(left))


def band(poly, y0, y1, xin, g=1.3, n=6):
    """Muscle from a fixed inner line to the outline (minus a gap), e.g. the obliques."""
    out = []
    for i in range(n):
        y = y0 + (y1 - y0) * i / (n - 1)
        out.append((edges(poly, y)[1] - g, y))
    return [(xin + 1.2, y0 + 1)] + out + [(xin, y1 - 2), (xin - 0.4, (y0 + y1) / 2)]


# ---------------------------------------------------------------- outline
HEAD = [(60, 7), (68.5, 9.2), (73.6, 16.5), (74.6, 25.5), (72.8, 33.5), (67.8, 40.2), (60, 43), (52.2, 40.2), (47.2, 33.5), (45.4, 25.5), (46.4, 16.5), (51.5, 9.2)]
NECK = [(53.6, 34), (66.4, 34), (66.6, 45), (69.5, 55), (50.5, 55), (53.4, 45)]
TORSO_M = [(60, 52.5), (68, 53), (77, 56.5), (86, 60.5), (91.5, 65.5), (93, 72), (91, 81), (87.5, 90), (85.5, 103), (83, 118), (79.5, 133), (81, 146), (85, 159), (86.5, 169), (83, 179), (72, 185), (60, 187.5)]
TORSO_F = [(60, 53), (67, 53.3), (74.5, 56.5), (82.5, 60.5), (87.5, 65.5), (89, 72), (87.5, 81), (84.5, 90), (82.8, 101), (79.6, 116), (76, 130), (78.4, 144), (83.5, 157), (87, 168), (84.3, 179), (72.5, 185.5), (60, 188)]
ARM_RAW = [(86, 63), (92, 64.5), (96.5, 69), (98.5, 77), (99, 90), (100, 106), (101.5, 121), (103.5, 136), (105.5, 152), (107, 166), (109.5, 175), (110.5, 185), (109, 194), (105.5, 199), (101.5, 197.5), (100, 190), (98.5, 181), (97, 170), (94.5, 153), (92, 137), (90, 122), (88.5, 107), (88, 95), (87.5, 86), (86.5, 76)]
abduct = lambda pts: [(x + max(0, y - 84) * 0.075, y) for x, y in pts]
ARM_M = abduct(ARM_RAW)
LEG_M = [(61, 172), (73, 168), (84, 163), (87.5, 176), (86.5, 196), (83, 217), (80.5, 233), (80.5, 246), (81.5, 259), (78.5, 272), (75.5, 283), (77, 289), (79.5, 294), (74, 297), (66, 297), (65, 290), (65.5, 283), (64.5, 270), (63.5, 257), (64.5, 244), (64.5, 233), (63, 214), (61.5, 195), (60.5, 182)]
LEG_F = [(61, 172), (73.5, 168.5), (85, 162), (89, 177), (87.2, 197), (83, 217), (80.5, 233), (80.5, 246), (81, 259), (78.2, 272), (75.5, 283), (77, 289), (79.5, 294), (74, 297), (66, 297), (65, 290), (65.5, 283), (64.8, 270), (64, 257), (64.8, 244), (64.5, 233), (63, 214), (61.5, 195), (60.5, 182)]


def arm_f(pts):
    """Female arm: narrower shoulders, slightly slimmer."""
    out = []
    for x, y in pts:
        c = 92.5 + max(0, y - 77) * 0.1764
        out.append((x - 3.6 - (x - c) * 0.1, y))
    return out


ARM_F = arm_f(ARM_M)

# ---------------------------------------------------------------- muscles, male front (right side)
TRAP_F = [(68.5, 54.8), (77, 58.2), (84.5, 61.8), (80, 63.5), (71, 60.8), (66.5, 58.5)]
DELT = [(86.5, 63.2), (91.3, 65.2), (95.4, 69.4), (97.4, 77), (98, 86), (96, 92.5), (92.6, 90.5), (89.4, 81), (86.6, 72.5), (84.8, 67)]
PEC = [(61.4, 64.5), (68, 63.5), (76, 64.6), (82.5, 68), (85, 73), (84.6, 79), (82, 85.5), (76.5, 90), (69, 91.8), (61.4, 90.5)]
BICEPS = [(90.6, 92.5), (94.2, 95), (97.6, 100.5), (99.4, 108), (99.6, 116), (97.5, 119.5), (94.2, 117), (91.8, 108.5), (90.5, 100)]
FOREARM = [(95.3, 124.5), (99.6, 123), (104, 126), (107.5, 136.5), (109.3, 150), (110.8, 161), (108.6, 165), (105.2, 161.5), (100.4, 150), (96.8, 137)]
OBLIQUE = [(79.5, 94), (83.4, 100), (82.4, 112), (79.6, 124), (77.2, 136), (75, 134), (75.3, 122), (76.4, 108), (77, 98)]
LOWER_AB = [(61.3, 135.5), (72.8, 135.5), (72, 146), (68.5, 153), (64, 157), (61.3, 157.5)]
SHORTS_M = [(60, 160.5), (72, 159.5), (84.5, 158.8), (87.8, 168), (89, 182), (89.2, 198), (88.6, 205), (76, 207.5), (63.5, 206), (61.3, 196), (60, 191.5)]
QUAD_OUT = [(76.2, 211), (82.9, 209.5), (82.2, 217.5), (80.2, 226.5), (77.6, 231), (75.6, 222)]
QUAD_IN = [(64.2, 210.5), (74.4, 211), (73.8, 221), (75.6, 231.5), (71.5, 233.5), (67, 230), (64.6, 220)]
CALF_F = [(76.6, 242), (79.6, 245), (80, 255), (78.6, 265), (76.4, 268.5), (75.4, 256)]
TIBIALIS = [(67, 241.5), (73.6, 241), (73.8, 253), (72.8, 266), (70.6, 277), (68, 274), (66.2, 260), (66, 249)]

# ---------------------------------------------------------------- muscles, male back
TRAP_B = [(60, 44), (64, 46.5), (67, 53.5), (76, 58), (84.5, 62.5), (83, 65.5), (75, 67.5), (69, 76), (65.5, 92), (62.5, 110), (60, 116)]
INFRA = [(74, 71.5), (80, 69.8), (84.5, 71.5), (85.6, 78), (83.6, 86), (78, 90.5), (71, 91.5), (69.6, 85), (71, 78)]
LAT = [(69.4, 95.5), (79, 94), (84.5, 97), (83, 108), (81, 120), (78, 131), (74, 141), (67.6, 146), (65.8, 132), (65.2, 116), (66.4, 103.5)]
ERECTOR = [(61.4, 122), (64.2, 121), (64.6, 134), (65.2, 148), (64.8, 157.5), (61.4, 158.5)]
KIDNEY = ellipse(73, 133, 4.2, 6.8, 16)
TRICEPS = [(90.4, 95), (94, 94.5), (97.8, 98), (99.5, 106), (99.7, 115), (97.4, 120), (93.8, 119), (91.6, 110), (90.4, 102)]
CALF_B_OUT = [(73.4, 240.5), (79.4, 242), (80.6, 251), (79.6, 262), (76.2, 268), (73.6, 262), (72.8, 250)]
CALF_B_IN = [(65.6, 241.5), (71.4, 240.5), (71.6, 250), (71.2, 263), (68.8, 269), (66.2, 262), (65.4, 250)]

# ---------------------------------------------------------------- female-specific shapes
TOP_F_FRONT = [(60, 70), (64.5, 67.5), (69.5, 62.5), (71.5, 58.5), (75, 58.4), (76.5, 64), (82, 69.5), (84.6, 78), (84.2, 90), (82.5, 99), (72, 102), (60, 102.5)]
TOP_F_BACK = [(60, 60.5), (62.6, 60.8), (63.4, 70), (67, 81), (80, 87), (84.5, 89), (83.6, 99), (72, 102.5), (60, 103)]
OBLIQUE_F = [(77.5, 105.5), (80.8, 108), (79.3, 118), (76.4, 127), (74.6, 136), (72.8, 134), (73, 124), (74.2, 113), (75, 108)]
LOWER_AB_F = [(61.3, 142), (71, 142), (70.2, 150.5), (67, 155.5), (63.4, 158), (61.3, 158.3)]
SHORTS_F = [(60, 160.5), (72, 159.7), (84, 158.6), (88, 168), (90, 182), (90.2, 197), (89.6, 204), (76.2, 207), (63.5, 205.5), (61.3, 195), (60, 190.5)]

# ---------------------------------------------------------------- hair
HAIR_M_FRONT = [(46, 21), (45.6, 14.5), (48.8, 8.6), (54.2, 5.2), (60, 4.2), (66, 5), (71.6, 8.4), (74.6, 14.5), (74, 21), (72.4, 15.6), (67, 12.2), (61, 12.6), (55, 12), (49.6, 14.6)]
HAIR_M_BACK = [(45.4, 27), (45.4, 15), (48.6, 8.4), (54.4, 5), (60, 4.2), (65.6, 5), (71.4, 8.4), (74.6, 15), (74.6, 27), (72.6, 33.5), (66.5, 37.5), (60, 38.2), (53.5, 37.5), (47.4, 33.5)]
HAIR_F_FRONT = [(46, 23), (45.6, 15.5), (48.6, 9.2), (54, 5.8), (60, 5), (66, 5.8), (71.4, 9.2), (74.4, 15.5), (74, 23), (73.2, 19), (70, 14), (64.5, 11), (60, 10.4), (55.5, 11), (50, 14), (46.8, 19)]
HAIR_F_BACK = [(45.4, 28), (45.4, 15.5), (48.6, 9), (54.4, 5.6), (60, 4.8), (65.6, 5.6), (71.4, 9), (74.6, 15.5), (74.6, 28), (72.4, 35), (66, 39.5), (60, 40), (54, 39.5), (47.6, 35)]
BUN = ellipse(60, 2.2, 6, 5.2)


def joints(arm):
    """Shoulder, elbow, wrist, knee and ankle centres, both sides."""
    def mid(y):
        xs = []
        for i in range(len(arm)):
            (x0, y0), (x1, y1) = arm[i], arm[(i + 1) % len(arm)]
            if (y0 - y) * (y1 - y) <= 0 and y0 != y1:
                xs.append(x0 + (x1 - x0) * (y - y0) / (y1 - y0))
        return (min(xs) + max(xs)) / 2
    right = [(mid(75) - 1, 72), (mid(122), 122), (mid(168), 168), (72.5, 235), (70.5, 284)]
    return [[round(x, 1), y] for x, y in right] + [[round(120 - x, 1), y] for x, y in right]


def figure(sex: str, view: str) -> dict:
    f = sex == "female"
    arm = ARM_F if f else ARM_M
    armx = arm_f if f else (lambda p: p)
    torso = TORSO_F if f else TORSO_M
    leg = LEG_F if f else LEG_M
    skin = [cr(NECK), cr(arm), cr(list(reversed(mx(arm)))), cr(leg), cr(list(reversed(mx(leg)))), sym(torso), cr(HEAD)]
    limbs_upper = pair(shift(DELT, -3.4) if f else DELT)
    upper_arm = pair(segment(arm, 95.5, 120))
    forearm = pair(segment(arm, 124, 166))
    thigh = pair(segment(leg, 210, 233, 0, 0.55)) + pair(segment(leg, 210, 232, 0.55, 1))
    shin_front = pair(segment(leg, 241, 279, 0, 0.6)) + pair(segment(leg, 242, 268, 0.6, 1))
    calves_back = pair(segment(leg, 240, 271, 0, 0.5)) + pair(segment(leg, 240, 270, 0.5, 1))
    areas: dict[str, list[str]] = {}
    overlay: dict[str, list[str]] = {}
    if view == "front":
        areas["Muscles & joints"] = pair(shift(TRAP_F, sx=0.9) if f else TRAP_F) + limbs_upper + upper_arm + forearm + thigh + shin_front
        if f:
            abs_ = rpair(61.3, 105, 71.2, 115.5, 3) + rpair(61.3, 117.5, 71.4, 128, 3) + rpair(61.3, 130, 71.2, 140, 3)
            areas["Digestion"] = abs_ + pair(band(torso, 104.5, 152, 72.8))
            areas["Urinary"] = pair(LOWER_AB_F)
            overlay["Heart & breathing"] = [sym(TOP_F_FRONT)]
            clothes = [sym(TOP_F_FRONT), sym(SHORTS_F)]
            hair = [cr(HAIR_F_FRONT), cr(BUN)]
        else:
            areas["Heart & breathing"] = pair(PEC)
            abs_ = rpair(61.3, 94, 73, 105.5, 3) + rpair(61.3, 107.5, 73.2, 119.5, 3) + rpair(61.3, 121.5, 73, 133.5, 3)
            areas["Digestion"] = abs_ + pair(band(torso, 93.5, 152, 74.8))
            areas["Urinary"] = pair(LOWER_AB)
            clothes = [sym(SHORTS_M)]
            hair = [cr(HAIR_M_FRONT)]
    else:
        s = 0.92 if f else 1.0
        areas["Muscles & joints"] = limbs_upper + upper_arm + forearm + thigh + calves_back
        areas["Back"] = [sym(shift(TRAP_B, sx=0.9) if f else TRAP_B)] + pair(shift(INFRA, sx=s)) + pair(shift(LAT, sx=0.93 if f else 1)) + pair(ERECTOR)
        areas["Urinary"] = pair(shift(KIDNEY, sx=0.95 if f else 1))
        if f:
            clothes = [sym(TOP_F_BACK), sym(SHORTS_F)]
            hair = [cr(HAIR_F_BACK), cr(BUN)]
        else:
            clothes = [sym(SHORTS_M)]
            hair = [cr(HAIR_M_BACK)]
    return {"skin": skin, "areas": areas, "overlay": overlay, "clothes": clothes, "hair": hair, "joints": joints(arm), "face": view == "front"}


FIGURES = {sex: {view: figure(sex, view) for view in ("front", "back")} for sex in ("male", "female")}
HEAD_PATH = cr(HEAD)

if __name__ == "__main__":
    body = json.dumps(FIGURES, indent=1).replace('"', "'")
    OUT.write_text(
        "// Generated by scripts/body_shapes.py - do not edit by hand.\n"
        "export type BodyType = 'male' | 'female'\n"
        "export interface FigureShapes {\n"
        "  skin: readonly string[]\n"
        "  areas: Readonly<Record<string, readonly string[]>>\n"
        "  overlay: Readonly<Record<string, readonly string[]>>\n"
        "  clothes: readonly string[]\n"
        "  hair: readonly string[]\n"
        "  joints: readonly (readonly number[])[]\n"
        "  face: boolean\n"
        "}\n"
        f"export const HEAD_PATH = '{HEAD_PATH}'\n"
        f"export const FIGURES: Record<BodyType, {{ front: FigureShapes; back: FigureShapes }}> = {body}\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT}")

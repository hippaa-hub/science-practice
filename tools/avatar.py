#!/usr/bin/env python3
"""Adele's avatar for the app, made from her character picture (tools/avatar/source.jpg, git-ignored).

  python3 tools/avatar.py poses      # 4 moods with gpt-image-2.5 low (edit with her picture as reference)
  python3 tools/avatar.py cutout     # remove backgrounds with BiRefNet -> src/assets/adele-<mood>.png
  python3 tools/avatar.py video      # short animated loop with LTX Video (cheapest i2v on fal)

All through fal; key in ~/.config/fal/key.
"""
import base64, io, json, sys, time, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "tools/avatar"
ASSETS = ROOT / "src/assets"
BG = "#EAF6FF"  # matches the circle the avatar sits in

def key():
    k = (Path.home() / ".config/fal/key").read_text().strip()
    return k.split("=", 1)[1].strip().strip("'\"") if k.startswith("FAL_KEY=") else k

def data_uri(path, max_edge=1024):
    im = Image.open(path).convert("RGB"); im.thumbnail((max_edge, max_edge))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

def call(endpoint, body, timeout=600):
    req = urllib.request.Request("https://fal.run/" + endpoint, data=json.dumps(body).encode(), method="POST")
    req.add_header("Authorization", "Key " + key()); req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def fetch(url):
    if url.startswith("data:"):
        return base64.b64decode(url.split(",", 1)[1])
    with urllib.request.urlopen(url, timeout=300) as r:
        return r.read()

SAME = ("Use the girl from the reference picture: keep her face, brown eyes, long red hair with dark lower layers, "
        "black headphones, white shirt, dark tie and black school blazer, in the same soft watercolour anime style. "
        f"Upper body, centred, facing the viewer, on a completely plain flat light blue background ({BG}) with nothing else. "
        "No text, no other people, no street. ")
POSES = {
    "happy": "She smiles warmly with her hands relaxed.",
    "think": "She looks thoughtful and curious, one finger touching her chin, eyes looking slightly up.",
    "cheer": "She cheers with joy, both fists raised above her shoulders, big happy smile, eyes closed with delight.",
    "wave": "She waves hello with one hand raised, friendly smile.",
}

def poses(only=None):
    src = data_uri(WORK / "source.jpg")
    for mood, extra in POSES.items():
        if only and mood not in only: continue
        t = time.time()
        resp = call("openai/gpt-image-2.5/sunburst/edit", {"prompt": SAME + extra, "image_urls": [src], "quality": "low",
                                                          "image_size": {"width": 1024, "height": 1024}})
        (WORK / f"pose-{mood}.png").write_bytes(fetch(resp["images"][0]["url"]))
        print(f"ok pose {mood} {time.time() - t:.0f}s")

def cutout():
    ASSETS.mkdir(exist_ok=True)
    for mood in POSES:
        p = WORK / f"pose-{mood}.png"
        if not p.exists(): continue
        resp = call("fal-ai/birefnet/v2", {"image_url": data_uri(p, 1024), "output_format": "png"})
        im = Image.open(io.BytesIO(fetch(resp["image"]["url"]))).convert("RGBA")
        im = im.crop(im.getbbox())
        im.thumbnail((512, 512))
        out = ASSETS / f"adele-{mood}.png"
        im.save(out, optimize=True)
        print(f"ok cutout {mood} {out.stat().st_size // 1024} KB")

def video():
    resp = call("fal-ai/ltx-video-13b-distilled/image-to-video", {
        "image_url": data_uri(WORK / "pose-wave.png", 768),
        "prompt": "The anime girl gently waves her hand and smiles, blinks, her red hair sways softly. "
                  "The camera does not move. Plain flat light blue background. Calm, smooth, looping motion, "
                  "she ends in the same pose she started.",
        "negative_prompt": "camera movement, zoom, background change, extra people, text, distortion, blurry face",
        "resolution": "480p", "aspect_ratio": "1:1",
    })
    url = (resp.get("video") or {}).get("url")
    (WORK / "wave.mp4").write_bytes(fetch(url))
    print("ok video", (WORK / "wave.mp4").stat().st_size // 1024, "KB")

if __name__ == "__main__":
    cmd = sys.argv[1]
    {"poses": lambda: poses(sys.argv[2:] or None), "cutout": cutout, "video": video}[cmd]()

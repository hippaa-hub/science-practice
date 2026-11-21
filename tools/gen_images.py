#!/usr/bin/env python3
"""Generate the app's illustrations with OpenAI gpt-image-2.5 (low quality) through fal.

  python3 tools/gen_images.py tools/images.json            # generate missing ones
  python3 tools/gen_images.py tools/images.json --only id1,id2 --overwrite

Raw PNGs go to tools/raw/ (git-ignored). Then make_webp.py shrinks them into public/img/.
Key: ~/.config/fal/key
"""
import argparse, base64, json, sys, time, urllib.error, urllib.request
from pathlib import Path

ENDPOINT = "https://fal.run/openai/gpt-image-2.5/sunburst/text-to-image"
STYLE = ("Friendly, clear educational illustration for a 12-year-old science student. "
         "Bright, clean colours on a plain light background, soft shading, simple shapes, "
         "scientifically accurate. Absolutely NO text, NO letters, NO numbers, NO labels, NO arrows with words. ")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--only", default="")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--quality", default="low")
    a = ap.parse_args()
    key = (Path.home() / ".config/fal/key").read_text().strip()
    if key.startswith("FAL_KEY="):
        key = key.split("=", 1)[1].strip().strip("'\"")
    spec = json.loads(Path(a.spec).read_text())
    only = set(filter(None, a.only.split(",")))
    out = Path(__file__).parent / "raw"
    out.mkdir(exist_ok=True)
    jobs = [s for s in spec if (not only or s["id"] in only) and (a.overwrite or not (out / f"{s['id']}.png").exists())]
    sys.stderr.write(f"{len(jobs)} image(s), {a.quality}, ~${0.006 * len(jobs):.3f}\n")
    for s in jobs:
        square = s["id"].startswith("z-")
        body = {"prompt": STYLE + s["prompt"], "quality": a.quality,
                "image_size": {"width": 1024, "height": 1024} if square else {"width": 1536, "height": 1024}}
        req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode(), method="POST")
        req.add_header("Authorization", "Key " + key)
        req.add_header("Content-Type", "application/json")
        t = time.time()
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                resp = json.loads(r.read().decode())
            url = resp["images"][0]["url"]
            blob = base64.b64decode(url.split(",", 1)[1]) if url.startswith("data:") else urllib.request.urlopen(url, timeout=180).read()
            (out / f"{s['id']}.png").write_bytes(blob)
            print(f"ok   {s['id']}  {time.time() - t:.0f}s")
        except urllib.error.HTTPError as e:
            print(f"FAIL {s['id']}  HTTP {e.code}: {e.read().decode(errors='replace')[:300]}")
        except Exception as e:  # one bad image never stops the batch
            print(f"FAIL {s['id']}  {e}")

if __name__ == "__main__":
    main()

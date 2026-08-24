#!/usr/bin/env python3
"""Builds a single self-contained copy of the homepage for the Artifact viewer.

The Artifact is sandboxed and same-origin-relative files don't resolve, so CSS
and JS are inlined and every internal link is rewritten to the live site.
Generated from the real source, so the preview can never drift from what ships.
"""
import pathlib, re

HERE = pathlib.Path(__file__).parent
LIVE = "https://aesir-solar.vercel.app/"
OUT = pathlib.Path("/private/tmp/claude-501/-Users-nick-Projects-Aesir-Solar/"
                   "350ca28e-81e3-4610-b87f-f37a68d4861a/scratchpad/concept.html")

html = (HERE / "index.html").read_text(encoding="utf-8")
css = (HERE / "style.css").read_text(encoding="utf-8")
js = (HERE / "app.js").read_text(encoding="utf-8")

# strip the document shell — the Artifact host supplies it
html = html.split("<body>", 1)[1].rsplit("</body>", 1)[0]

# inline styles and behaviour
html = html.replace('<script src="app.js"></script>', "")
head = (
    '<title>Permission to Connect</title>\n'
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;'
    '1,62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n'
    f"<style>\n{css}\n</style>\n"
)

# every internal link must leave the sandbox and hit the live site
html = re.sub(r'href="(?!#|https?:|mailto:)([a-z0-9_\-]+\.html)"',
              lambda m: f'href="{LIVE}{m.group(1)}" target="_blank" rel="noopener"', html)

banner = f'''<div class="artifact-note">
  <strong>Live preview.</strong> This is the real homepage. Buttons open the live site in a new tab —
  <a href="{LIVE}" target="_blank" rel="noopener">{LIVE}</a>
</div>
<style>
.artifact-note{{position:fixed;left:0;right:0;bottom:0;z-index:150;padding:10px 16px;
  background:rgba(7,9,12,.94);backdrop-filter:blur(10px);border-top:1px solid var(--line);
  font-family:var(--mono);font-size:11.5px;color:var(--muted);text-align:center;line-height:1.6}}
.artifact-note strong{{color:var(--gold);font-weight:600}}
.artifact-note a{{color:var(--ink-2);word-break:break-all}}
body{{padding-bottom:46px}}
</style>
'''

OUT.write_text(head + html + banner + f"\n<script>\n{js}\n</script>\n", encoding="utf-8")
print(f"wrote {OUT}  ({OUT.stat().st_size // 1024} KB)")
print("external links rewritten:", len(re.findall(re.escape(LIVE), html)))

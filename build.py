#!/usr/bin/env python3
"""Build the supporting routes from reviewable templates, without dependencies.

The homepage is owned by experience.html and the Vite/assembly pipeline. This
builder copies that source to index.html for compatibility; it never writes the
authoritative experience.html. Assembly maps the compiled experience to index.
Run `python3 build.py --check` to check for generated-page drift without writes.
"""
from pathlib import Path
from html import escape
import argparse
import subprocess

ROOT = Path(__file__).resolve().parent
TEMPLATES = ROOT / "templates" / "site"
PAGES = {
    "solar": ("Solar at work", "Generation, equipment, storage and an honestly attributed historical generation example.", "guide"),
    "suitability": ("Check application suitability", "Use documented AC equipment ratings and discuss uncertain arrangements before paying.", "guide"),
    "apply": ("Start your G99 application", "Installation details for the Aesir G99 Form A1-2 application service. £250 fee plus £50 VAT: £300 total.", "apply"),
    "contact": ("Contact Aesir Solar", "Discuss installation suitability or ask about an existing application by email.", "contact"),
    "terms": ("Terms of service", "Terms for one G99 connection application: scope, responsibilities, price and cancellation.", "policy"),
    "privacy": ("Privacy policy", "How application information is used, shared and handled, and your data rights.", "policy"),
    "refunds": ("Refund policy", "Cancellation, refunds, resubmission and the limits of the connection application service.", "policy"),
    "success": ("Check your payment and application", "This return page cannot verify payment or receipt of an application. Contact Aesir if the outcome is uncertain.", "return"),
    "simulator": ("Solar planning", "The previous solar simulator has been retired. Explore solar energy and discuss a project using documented equipment details.", "planning"),
    "faq": ("Application questions", "Find the application questions and answers on the Aesir Solar homepage.", "guide"),
}


def render(slug):
    title, description, kind = PAGES[slug]
    shell = (TEMPLATES / "shell.html").read_text(encoding="utf-8")
    body = (TEMPLATES / f"{slug}.html").read_text(encoding="utf-8").rstrip()
    if "<!-- RECORDED_GENERATION -->" in body:
        recorded = subprocess.run(["node", "scripts/render-recorded-page.mjs"], cwd=ROOT, check=True, capture_output=True, text=True).stdout
        body = body.replace("<!-- RECORDED_GENERATION -->", recorded)
    # The companion runs first only to register load/error handlers. Its return
    # copy and submit-button activation run AFTER the unchanged app.js executes.
    scripts = ('<script src="/site.js" defer></script>\n'
               '<script src="/app.js" id="application-controller" defer></script>') if slug == "apply" else (
                   '<script src="/site.js" defer></script>' if slug == "success" else '')
    values = {
        "TITLE": escape(f"{title} — Aesir Solar", quote=True),
        "DESCRIPTION": escape(description, quote=True),
        "CANONICAL": f"https://aesirsolar.co.uk/{slug}.html",
        "PAGE": slug, "KIND": kind, "BODY": body,
        "HEAD_EXTRA": '<link rel="stylesheet" href="/guide.css">' if kind == "guide" else '',
        "CTA_HREF": "/contact.html" if slug == "apply" else "/apply.html",
        "CTA_LABEL": "Discuss suitability" if slug == "apply" else "Start your application",
        "SCRIPTS": scripts,
    }
    for key, value in values.items():
        shell = shell.replace("{{" + key + "}}", value)
    if "{{" in shell:
        raise ValueError(f"Unresolved template token in {slug}")
    return shell


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report drift without writing pages")
    args = parser.parse_args()
    drift = []
    guide = (ROOT / "src/experience/editorial.css").read_text() + "\n" + (TEMPLATES / "guide.css").read_text()
    if args.check:
        if not (ROOT / "guide.css").exists() or (ROOT / "guide.css").read_text() != guide:
            drift.append("guide.css")
    else:
        (ROOT / "guide.css").write_text(guide)
    # Read the authoritative homepage first. A missing source must not quietly
    # leave an old sales homepage beside newly generated supporting pages.
    homepage = (ROOT / "experience.html").read_text(encoding="utf-8")
    compatibility = ROOT / "index.html"
    if args.check:
        if not compatibility.exists() or compatibility.read_text(encoding="utf-8") != homepage:
            drift.append("index.html")
    else:
        compatibility.write_text(homepage, encoding="utf-8")
    for slug in PAGES:
        destination = ROOT / f"{slug}.html"
        html = render(slug)
        if args.check:
            if not destination.exists() or destination.read_text(encoding="utf-8") != html:
                drift.append(destination.name)
        else:
            destination.write_text(html, encoding="utf-8")
    if drift:
        parser.exit(1, "Generated pages differ: " + ", ".join(drift) + "\n")
    print(("Checked" if args.check else "Built") + f" {len(PAGES)} supporting pages and the index compatibility copy; experience.html remains authoritative.")


if __name__ == "__main__":
    main()

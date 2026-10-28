#!/usr/bin/env python3
"""Copy _data/cv.yml into a form RenderCV accepts.

The site's CV page reads `label`, `image`, `summary` and `address` from the top-level `cv` block,
but RenderCV rejects them. `label` becomes RenderCV's `headline`; the rest are dropped.
"""

import sys

import yaml

SITE_ONLY_FIELDS = ("image", "summary", "address")


def main(src, dest):
    with open(src, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    cv = data["cv"]
    if "label" in cv:
        cv.setdefault("headline", cv.pop("label"))
    for field in SITE_ONLY_FIELDS:
        cv.pop(field, None)

    with open(dest, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

#!/usr/bin/env python3
"""Sync source-faithful UAControlMap contact lines only."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import io
import json
import re
import tempfile
import time
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

UA_KMZ_URL = "https://raw.githubusercontent.com/owlmaps/UAControlMapBackups/latest/latest.kmz"
UA_REPO_URL = "https://github.com/owlmaps/UAControlMapBackups"
KML_NS = "{http://www.opengis.net/kml/2.2}"
USER_AGENT = "WarSpottingAtlasOverlayUpdater/1.0 (+https://github.com/iconicoin-netizen/warspotting-atlas)"


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def fetch(url: str, *, form: dict[str, str] | None = None, timeout: int = 360) -> bytes:
    data = urllib.parse.urlencode(form).encode() if form else None
    request = urllib.request.Request(url, data=data, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def atomic_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")
        temporary = Path(handle.name)
    temporary.replace(path)


def plain_text(value: str | None) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def coordinates(value: str | None) -> list[list[float]]:
    result = []
    for item in (value or "").strip().split():
        parts = item.split(",")
        if len(parts) >= 2:
            result.append([float(parts[0]), float(parts[1])])
    return result


def polygon_geometry(element: ET.Element) -> dict | None:
    outer = element.find(f".//{KML_NS}outerBoundaryIs/{KML_NS}LinearRing/{KML_NS}coordinates")
    if outer is None:
        return None
    rings = [coordinates(outer.text)]
    for inner in element.findall(f".//{KML_NS}innerBoundaryIs/{KML_NS}LinearRing/{KML_NS}coordinates"):
        rings.append(coordinates(inner.text))
    return {"type": "Polygon", "coordinates": rings}


def placemark_geometries(placemark: ET.Element) -> list[dict]:
    result: list[dict] = []
    for point in placemark.findall(f".//{KML_NS}Point"):
        item = point.find(f"{KML_NS}coordinates")
        parsed = coordinates(item.text if item is not None else None)
        if parsed:
            result.append({"type": "Point", "coordinates": parsed[0]})
    for line in placemark.findall(f".//{KML_NS}LineString"):
        item = line.find(f"{KML_NS}coordinates")
        parsed = coordinates(item.text if item is not None else None)
        if len(parsed) >= 2:
            result.append({"type": "LineString", "coordinates": parsed})
    for polygon in placemark.findall(f".//{KML_NS}Polygon"):
        parsed = polygon_geometry(polygon)
        if parsed:
            result.append(parsed)
    return result


def feature_collection(features: list[dict], **metadata: object) -> dict:
    return {"type": "FeatureCollection", "properties": metadata, "features": features}


def source_style(root: ET.Element, placemark: ET.Element) -> dict:
    """Resolve KML normal StyleMap pairs without inferring faction from names."""
    nodes = {node.get("id"): node for node in root if node.get("id")}
    ref = placemark.findtext(f"{KML_NS}styleUrl", "").lstrip("#")
    seen = set()
    while ref and ref not in seen:
        seen.add(ref)
        node = nodes.get(ref)
        if node is None:
            break
        if node.tag == f"{KML_NS}Style":
            break
        normal = next((pair for pair in node.findall(f"{KML_NS}Pair")
                       if pair.findtext(f"{KML_NS}key") == "normal"), None)
        ref = normal.findtext(f"{KML_NS}styleUrl", "").lstrip("#") if normal is not None else ""
    else:
        node = None
    inline = placemark.find(f"{KML_NS}Style")
    if inline is not None:
        node = inline
    if node is None or node.tag != f"{KML_NS}Style":
        return {}
    result = {}
    for tag, key, opacity in (("LineStyle", "color", "opacity"), ("PolyStyle", "fillColor", "fillOpacity")):
        value = node.findtext(f"{KML_NS}{tag}/{KML_NS}color", "")
        if re.fullmatch(r"[a-fA-F0-9]{8}", value):
            result[key] = "#" + value[6:8] + value[4:6] + value[2:4]
            result[opacity] = int(value[:2], 16) / 255
    width = node.findtext(f"{KML_NS}LineStyle/{KML_NS}width")
    if width:
        result["weight"] = float(width)
    for tag, key in (("fill", "fill"), ("outline", "stroke")):
        value = node.findtext(f"{KML_NS}PolyStyle/{KML_NS}{tag}")
        if value is not None:
            result[key] = value != "0"
    return result


def combined_geometry(geometries: list[dict]) -> dict | None:
    if not geometries:
        return None
    if len(geometries) == 1:
        return geometries[0]
    kinds = {item["type"] for item in geometries}
    if len(kinds) == 1:
        return {"type": "Multi" + geometries[0]["type"],
                "coordinates": [item["coordinates"] for item in geometries]}
    return {"type": "GeometryCollection", "geometries": geometries}


def parse_uacontrol_kmz(content: bytes, generated_at: str, **provenance: object) -> dict:
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        kml_name = next(name for name in archive.namelist() if name.lower().endswith(".kml"))
        root = ET.parse(archive.open(kml_name)).getroot()
    document = root.find(f"{KML_NS}Document")
    if document is None:
        raise ValueError("Missing KML Document")
    frontlines = []
    for folder in root.iter(f"{KML_NS}Folder"):
        folder_name = folder.findtext(f"{KML_NS}name", "")
        if folder_name != "Frontline":
            continue
        for index, placemark in enumerate(folder.findall(f"{KML_NS}Placemark")):
            # Preserve labels verbatim, including source whitespace and punctuation.
            title = placemark.findtext(f"{KML_NS}name", "")
            properties = {"name": title, "source": "UAControlMap", "source_url": UA_REPO_URL,
                          "source_folder": folder_name, "source_id": placemark.get("id"),
                          "source_index": index}
            geometries = placemark_geometries(placemark)
            if not geometries:
                raise ValueError(f"Missing geometry in {folder_name}: {title}")
            properties.update({"description": plain_text(placemark.findtext(f"{KML_NS}description", "")),
                               "style": source_style(document, placemark)})
            feature = {"type": "Feature", "properties": properties, "geometry": combined_geometry(geometries)}
            frontlines.append(feature)
    shared = {"source": "UAControlMap / Project Owl", "source_url": UA_REPO_URL,
              "generated_at": generated_at, "source_sha256": hashlib.sha256(content).hexdigest(),
              "licence_status": "No explicit data licence published; attribution retained.", **provenance}
    return feature_collection(frontlines, **shared)


def fetch_uacontrol() -> tuple[bytes, dict]:
    # Pin the download to the commit whose timestamp we report.
    history = json.loads(fetch("https://api.github.com/repos/owlmaps/UAControlMapBackups/commits?sha=latest&path=latest.kmz&per_page=1"))
    commit = history[0]
    revision = commit["sha"]
    url = f"https://raw.githubusercontent.com/owlmaps/UAControlMapBackups/{revision}/latest.kmz"
    return fetch(url), {"source_commit": revision, "source_updated_at": commit["commit"]["committer"]["date"]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=Path("dist/overlays"))
    parser.add_argument("--uacontrol-kmz", type=Path)
    parser.add_argument("--source-commit")
    parser.add_argument("--source-updated-at")
    parser.add_argument("--generated-at", default=utc_now())
    args = parser.parse_args()

    if args.uacontrol_kmz:
        kmz = args.uacontrol_kmz.read_bytes()
        provenance = {key: value for key, value in {"source_commit": args.source_commit,
                      "source_updated_at": args.source_updated_at}.items() if value}
    else:
        kmz, provenance = fetch_uacontrol()
    frontlines = parse_uacontrol_kmz(kmz, args.generated_at, **provenance)
    if not frontlines["features"]:
        raise ValueError("UAControlMap returned no contact lines")
    count = len(frontlines["features"])
    metadata = {"generated_at": args.generated_at, "counts": {"uacontrol_frontline": count},
                "layers": {"uacontrol_frontline": {"count": count, **frontlines["properties"]}}}
    atomic_json(args.out_dir / "uacontrol-frontline.geojson", frontlines)
    atomic_json(args.out_dir / "overlay-meta.json", metadata)
    print(json.dumps(metadata["counts"]))


if __name__ == "__main__":
    main()

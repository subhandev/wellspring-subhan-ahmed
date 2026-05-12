#!/usr/bin/env python3
"""
Render Cursor agent-transcript JSONL files as Markdown threads (verbatim text +
tool payloads). Regenerate whenever new *.jsonl copies are synced:

  cd ai-history && python3 render_jsonl_to_md.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def render_content_parts(parts: list[dict]) -> str:
    if not parts:
        return ""
    out: list[str] = []
    for p in parts:
        t = p.get("type")
        if t == "text":
            out.append(str(p.get("text", "")))
        elif t == "tool_use":
            name = p.get("name", "")
            inp = p.get("input")
            out.append("\n\n**Tool:** `{}`\n".format(name))
            out.append("\n```json\n{}\n```\n".format(json.dumps(inp, indent=2, ensure_ascii=False)))
        elif t == "tool_result":
            # Some transcripts include summarized tool results
            out.append("\n\n**Tool result**\n\n```json\n{}\n```\n".format(
                json.dumps(p.get("content", p), indent=2, ensure_ascii=False)
            ))
        else:
            out.append("\n\n```json\n{}\n```\n".format(json.dumps(p, indent=2, ensure_ascii=False)))
    return "".join(out).strip()


def render_line(raw: dict) -> tuple[str, str]:
    role = raw.get("role", "?")
    msg = raw.get("message") or {}
    parts = msg.get("content") or []
    title = "### User\n" if role == "user" else "### Assistant\n"
    body = render_content_parts(parts if isinstance(parts, list) else [])
    if not body:
        body = "```json\n{}\n```".format(json.dumps(raw, indent=2, ensure_ascii=False))
    return title, body


def jsonl_path_to_uuid(path: Path) -> str:
    stem = path.stem
    marker = "-transcript-"
    if marker in stem:
        return stem.split(marker, 1)[1]
    m = re.search(r"[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}", stem, re.I)
    return m.group(0) if m else stem


def render_file(jsonl_path: Path) -> str:
    lines = []
    uuid = jsonl_path_to_uuid(jsonl_path)
    idx = jsonl_path.name.split("-")[0]
    header = "# Cursor agent session (Markdown export)\n\n"
    header += "**Source:** `{name}` · **conversation id:** `{uuid}`\n\n".format(
        name=jsonl_path.name,
        uuid=uuid,
    )
    header += (
        "_This file is rendered from the JSONL transcript next to it: same turns, formatted for reading. "
        "The `.jsonl` is the authoritative raw export._\n\n"
    )

    exchanges: list[tuple[str, str]] = []
    for line in jsonl_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            raw = json.loads(line)
            exchanges.append(render_line(raw))
        except json.JSONDecodeError:
            exchanges.append(("### Raw line (parse error)\n", "```\n{}\n```".format(line)))

    chunks = []
    n = 0
    prev_role = None
    for title, body in exchanges:
        role_key = "user" if title.strip().startswith("### User") else "assistant"
        if role_key != prev_role:
            n += 1
            chunks.append("---\n\n## Exchange {}\n\n".format(n))
            prev_role = role_key
        chunks.append("{}\n{}\n\n".format(title, body))

    return header + "".join(chunks)


def main() -> None:
    pairs: list[tuple[Path, Path]] = []
    for jsonl in sorted(ROOT.glob("*cursor-agent*transcript-*.jsonl")):
        out = jsonl.with_name(jsonl.name.replace("-transcript-", "-chat-export-", 1).replace(".jsonl", ".md"))
        pairs.append((jsonl, out))

    for src, dst in pairs:
        dst.write_text(render_file(src), encoding="utf-8")
        print("Wrote", dst.relative_to(ROOT))


if __name__ == "__main__":
    main()

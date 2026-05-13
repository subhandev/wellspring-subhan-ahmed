#!/usr/bin/env python3
"""
Copy new or newer Cursor agent-transcript *.jsonl into this folder, then run:
  python3 render_jsonl_to_md.py

Run from repo root or from ai-history/:
  python3 ai-history/sync_agent_transcripts.py
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

SRC_ROOT = Path.home() / ".cursor/projects/Users-subhan-Work-wellspring-subhan-ahmed/agent-transcripts"
ROOT = Path(__file__).resolve().parent


def transcript_suffix(path: Path) -> str:
    stem = path.stem
    for marker in ("-subagent-transcript-", "-transcript-"):
        if marker in stem:
            return stem.split(marker, 1)[1]
    return ""


def find_dst_for_uid(uid: str) -> Path | None:
    u = uid.lower()
    for p in ROOT.glob("*transcript*.jsonl"):
        suf = transcript_suffix(p).lower()
        if not suf:
            continue
        if u == suf or u.startswith(suf) or suf == u[:8]:
            return p
    return None


def max_reserved_index() -> int:
    """Largest leading NN- prefix in ai-history (any file) so new transcripts never collide."""
    best = 0
    for p in ROOT.iterdir():
        if not p.is_file():
            continue
        m = re.match(r"^(\d+)", p.name)
        if m:
            best = max(best, int(m.group(1)))
    return best


def max_main_transcript_index() -> int:
    best = 0
    for p in ROOT.glob("*-cursor-agent-transcript-*.jsonl"):
        if "subagent" in p.name:
            continue
        m = re.match(r"^(\d+)-", p.name)
        if m:
            best = max(best, int(m.group(1)))
    return best


def next_sub_index(parent_nn: int) -> int:
    best = 0
    prefix = f"{parent_nn}-"
    for p in ROOT.glob(f"{parent_nn}-*-cursor-agent-subagent-transcript-*.jsonl"):
        m = re.match(rf"^{parent_nn}-(\d+)-", p.name)
        if m:
            best = max(best, int(m.group(1)))
    return best + 1


def main() -> int:
    if not SRC_ROOT.is_dir():
        print("Missing Cursor transcripts dir:", SRC_ROOT, file=sys.stderr)
        return 1

    # Collect source files
    main_src: list[tuple[float, str, Path]] = []
    for p in sorted(SRC_ROOT.glob("*/*.jsonl")):
        if "subagents" in str(p):
            continue
        uid = p.parent.name
        main_src.append((p.stat().st_mtime, uid, p))

    sub_src: list[tuple[float, str, str, Path]] = []
    # Layout: <SRC_ROOT>/<parent_uuid>/subagents/<sub_uuid>.jsonl
    for p in sorted(SRC_ROOT.glob("*/subagents/*.jsonl")):
        parent = p.parent.parent.name
        sub_uid = p.stem
        sub_src.append((p.stat().st_mtime, parent, sub_uid, p))

    copied = 0
    updated = 0

    # 1) Update existing main + sub by mtime
    for _t, uid, sp in main_src:
        dp = find_dst_for_uid(uid)
        if dp and sp.stat().st_mtime > dp.stat().st_mtime + 0.5:
            shutil.copy2(sp, dp)
            updated += 1
            print("updated", dp.name)

    for _t, parent, sub_uid, sp in sub_src:
        dp = find_dst_for_uid(sub_uid)
        if dp and sp.stat().st_mtime > dp.stat().st_mtime + 0.5:
            shutil.copy2(sp, dp)
            updated += 1
            print("updated", dp.name)

    # 2) Add new main transcripts
    new_mains = []
    for _t, uid, sp in main_src:
        if find_dst_for_uid(uid) is None:
            new_mains.append((sp.stat().st_mtime, uid, sp))
    new_mains.sort(key=lambda x: x[0])

    nn = max(max_reserved_index(), max_main_transcript_index())
    parent_nn_by_uid: dict[str, int] = {}

    for _t, uid, sp in new_mains:
        nn += 1
        short = uid[:8]
        dst = ROOT / f"{nn}-cursor-agent-transcript-{short}.jsonl"
        shutil.copy2(sp, dst)
        parent_nn_by_uid[uid.lower()] = nn
        copied += 1
        print("new main", dst.name)

    # 3) New subagents (parent may be newly copied or pre-existing)
    def parent_nn(uid: str) -> int | None:
        dp = find_dst_for_uid(uid)
        if not dp:
            return None
        m = re.match(r"^(\d+)-", dp.name)
        return int(m.group(1)) if m else None

    new_subs = []
    for _t, parent, sub_uid, sp in sub_src:
        if find_dst_for_uid(sub_uid) is None:
            new_subs.append((sp.stat().st_mtime, parent, sub_uid, sp))
    new_subs.sort(key=lambda x: x[0])

    for _t, parent, sub_uid, sp in new_subs:
        pn = parent_nn(parent)
        if pn is None:
            print("skip subagent (no parent dst):", sub_uid[:8], "parent", parent[:8], file=sys.stderr)
            continue
        k = next_sub_index(pn)
        short = sub_uid[:8]
        dst = ROOT / f"{pn}-{k}-cursor-agent-subagent-transcript-{short}.jsonl"
        shutil.copy2(sp, dst)
        copied += 1
        print("new sub", dst.name)

    render = ROOT / "render_jsonl_to_md.py"
    if render.is_file():
        subprocess.run([sys.executable, str(render)], cwd=str(ROOT), check=True)

    print("done: copied", copied, "updated", updated)
    if copied or updated:
        print("Remember to extend ai-history/README.md table for new NN rows.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

import re
import subprocess
from pathlib import Path
root = Path('resources/js/pages')
used = set()
for p in root.rglob('*.tsx'):
    text = p.read_text(encoding='utf-8')
    for m in re.finditer(r"route\(['\"]([^'\"]+)['\"]", text):
        used.add(m.group(1))
route_lines = subprocess.check_output(['php', 'artisan', 'route:list'], text=True)
existing = set()
for line in route_lines.splitlines():
    if '›' not in line:
        continue
    left = line.split('›', 1)[0].strip()
    parts = left.split()
    if len(parts) >= 3:
        existing.add(parts[2])
missing = sorted(r for r in used if r not in existing)
print('used count', len(used))
print('existing count', len(existing))
print('missing names:')
for name in missing:
    print(name)

import json
import os
import re
from pathlib import Path

root = Path(__file__).resolve().parent

# Load server route names from Laravel route:list --json output
import subprocess
proc = subprocess.run(['php', 'artisan', 'route:list', '--json'], cwd=root, capture_output=True, text=True)
if proc.returncode != 0:
    raise SystemExit('Could not run php artisan route:list --json: ' + proc.stderr)
server_routes = json.loads(proc.stdout)
server_route_names = {r['name'] for r in server_routes if r['name']}

# Find route() usages in JS/TS files
js_files = list(root.glob('resources/js/**/*.tsx'))
route_names = set()
pattern = re.compile(r"route\(\s*['\"]([^'\"]+)['\"]")
for path in js_files:
    text = path.read_text(encoding='utf-8')
    for match in pattern.findall(text):
        route_names.add(match)

print('SERVER ROUTE NAMES:', len(server_route_names))
print('JS ROUTE NAMES:', len(route_names))
print('MISSING IN SERVER:')
for name in sorted(route_names - server_route_names):
    print(name)
print('UNUSED SERVER ROUTES:')
for name in sorted(server_route_names - route_names):
    print(name)

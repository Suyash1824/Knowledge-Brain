import os, re

SUSPICIOUS_PATTERNS = [
    r'(?i)(?:api_key|apikey|secret|password|passwd|token|private_key)\s*[:=]\s*[\'"][^\'"]+[\'"]',
    r'(?i)postgresql://[a-zA-Z0-9_\-]+:[^@\s]+@[^\s]+',
    r'-----BEGIN [A-Z]+ PRIVATE KEY-----',
    r'ghp_[a-zA-Z0-9]{36}',
    r'sk-[a-zA-Z0-9]{32,}'
]

ignored_dirs = {'.git', 'venv', '__pycache__', 'node_modules', '.pytest_cache'}
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

flagged = []
for dirpath, dirnames, filenames in os.walk(root_dir):
    dirnames[:] = [d for d in dirnames if d not in ignored_dirs]
    for fn in filenames:
        if fn.endswith(('.pyc', '.ico', '.png', '.jpg')) or fn == '.env' or fn.startswith('.env.'):
            if fn != '.env.example':
                continue
        filepath = os.path.join(dirpath, fn)
        rel_path = os.path.relpath(filepath, root_dir)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for pat in SUSPICIOUS_PATTERNS:
                    matches = re.findall(pat, content)
                    for m in matches:
                        # Allow harmless placeholders or test tokens
                        if any(ph in m for ph in ['your-', '<', 'placeholder', 'secret-key', 'default_agent', 'test-key', 'example']):
                            continue
                        flagged.append((rel_path, m))
        except Exception as e:
            pass

print(f"Total flagged items: {len(flagged)}")
for f, m in flagged:
    print(f"  {f}: {m[:80]}")


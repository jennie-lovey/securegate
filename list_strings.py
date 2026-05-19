import re

pb_path = "/Users/jenniferobiekea/.gemini/antigravity/conversations/8c7b5636-01d7-45ee-b874-01f21e9e17e0.pb"

with open(pb_path, 'rb') as f:
    data = f.read()

# find all contiguous runs of printable characters
strings = re.findall(b'[a-zA-Z0-9_/ \t\n\r.,;:!?-]{6,}', data)

print("Number of strings found:", len(strings))
print("First 50 strings:")
for s in strings[:50]:
    try:
        print(s.decode('ascii'))
    except:
        pass

print("\nSearching for 'Secure' or 'Gate' in strings:")
for s in strings:
    decoded = s.decode('ascii', errors='ignore')
    if "secure" in decoded.lower() or "gate" in decoded.lower():
        print(decoded[:100])

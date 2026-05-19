pb_path = "/Users/jenniferobiekea/.gemini/antigravity/conversations/8c7b5636-01d7-45ee-b874-01f21e9e17e0.pb"

with open(pb_path, 'rb') as f:
    data = f.read()

print("Bytes length:", len(data))
print("Contains 'SecureGate' (bytes):", b"SecureGate" in data)
print("Contains 'securegate' (bytes):", b"securegate" in data)
print("Contains 'LoginPage' (bytes):", b"LoginPage" in data)
print("Contains 'Overview' (bytes):", b"Overview" in data)

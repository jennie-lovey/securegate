import gzip
import zlib

pb_path = "/Users/jenniferobiekea/.gemini/antigravity/conversations/8c7b5636-01d7-45ee-b874-01f21e9e17e0.pb"

with open(pb_path, 'rb') as f:
    header = f.read(100)

print("Header bytes:", list(header[:20]))

try:
    with gzip.open(pb_path, 'rb') as f:
        data = f.read(100)
        print("Successfully read as gzip! First 20 bytes:", list(data[:20]))
except Exception as e:
    print("Not gzip:", e)

try:
    with open(pb_path, 'rb') as f:
        data = zlib.decompress(f.read())
        print("Successfully read as zlib! Decompressed size:", len(data))
except Exception as e:
    print("Not zlib:", e)

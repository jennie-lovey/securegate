import re
import sys

pb_path = "/Users/jenniferobiekea/.gemini/antigravity/conversations/8c7b5636-01d7-45ee-b874-01f21e9e17e0.pb"

with open(pb_path, 'rb') as f:
    data = f.read()

# Let's extract all printable strings of length > 20
printable = bytearray()
for b in data:
    if 32 <= b <= 126 or b == 10 or b == 13 or b == 9:
        printable.append(b)
    else:
        printable.append(b'.'[0])

# Decode as ascii, ignoring errors
text = printable.decode('ascii', errors='ignore')

# Write out the extracted text to see if we can find the prompt
with open("extracted_pb.txt", "w") as out:
    out.write(text)

print("Done! Extracted size:", len(text))

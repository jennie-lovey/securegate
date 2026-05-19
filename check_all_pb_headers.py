import os

folder = "/Users/jenniferobiekea/.gemini/antigravity/conversations/"
for filename in os.listdir(folder):
    if filename.endswith(".pb"):
        path = os.path.join(folder, filename)
        with open(path, 'rb') as f:
            header = f.read(10)
        print(filename, list(header))

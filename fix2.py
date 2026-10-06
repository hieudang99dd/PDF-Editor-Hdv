lines = open('organizer.js', 'r', encoding='utf-8').read()
lines = lines.replace("split('\\n')", "split('\\\\n')")
lines = lines.replace("replace(/\\n/g", "replace(/\\\\n/g")
lines = lines.replace(" ' \\n ')", " ' \\\\n ')")
lines = lines.replace("w === '\\n'", "w === '\\\\n'")
# Also handle literal newlines
lines = lines.replace("split('\\n')", "split('\\\\n')")
with open('organizer.js', 'w', encoding='utf-8') as f:
    f.write(lines)

lines = open('organizer.js', 'r', encoding='utf-8').readlines()
for i, l in enumerate(lines):
    if 'targetPage.drawRectangle' in l:
        lines.insert(i, 'console.log("DRAWING TEXT", edit.newText, edit.x, edit.y);\n')
        break
with open('organizer.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

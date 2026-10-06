import re
lines = open('organizer.js', 'r', encoding='utf-8').readlines()
for i, l in enumerate(lines):
    if 'div.style.left = ${' in l: lines[i] = l.replace('${', '`${').replace('}%;', '}%\`;')
    if 'div.style.top = ${' in l: lines[i] = l.replace('${', '`${').replace('}%;', '}%\`;')
    if 'div.style.width = ${' in l: lines[i] = l.replace('${', '`${').replace('}%;', '}%\`;')
    if 'div.style.minHeight = ${' in l: lines[i] = l.replace('${', '`${').replace('}%;', '}%\`;')
    if 'div.style.fontSize = ${' in l: lines[i] = l.replace('${', '`${').replace('}cqh;', '}cqh\`;')
with open('organizer.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Fixed backticks')

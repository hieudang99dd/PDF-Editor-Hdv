content = open('organizer.js', 'r', encoding='utf-8').read()
count = 0
in_str = False; str_char = ''; in_s_comment = False; in_m_comment = False
i = 0
while i < len(content):
    c = content[i]
    if in_s_comment:
        if c == '\n': in_s_comment = False
    elif in_m_comment:
        if c == '*' and i+1 < len(content) and content[i+1] == '/':
            in_m_comment = False; i += 1
    elif in_str:
        if c == '\\': i += 1
        elif c == str_char: in_str = False
    else:
        if c == '/' and i+1 < len(content) and content[i+1] == '/':
            in_s_comment = True; i += 1
        elif c == '/' and i+1 < len(content) and content[i+1] == '*':
            in_m_comment = True; i += 1
        elif c in ('\'', '"', '`'):
            in_str = True; str_char = c
        elif c == '{': count += 1
        elif c == '}':
            count -= 1
            if count < 0:
                print('Negative at line', content[:i].count('\n') + 1)
                break
    i += 1
print('Final count:', count)

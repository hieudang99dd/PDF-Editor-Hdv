import re

with open('organizer.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace drawText with manual lines drawing for alignment support
draw_logic = '''
                    if (edit.newText) {
                        const hex = edit.color || '#000000';
                        const r = parseInt(hex.slice(1,3), 16)/255 || 0;
                        const g = parseInt(hex.slice(3,5), 16)/255 || 0;
                        const b = parseInt(hex.slice(5,7), 16)/255 || 0;
                        
                        // Xử lý xuống dòng tự động & căn lề
                        const lines = edit.newText.split('\\n');
                        const lineHeight = size * 1.2;
                        let currentY = blockTop - size;
                        
                        // Để đơn giản, giả sử người dùng gõ xuống dòng bằng Enter.
                        // Nếu cần tự động ngắt dòng, ta có thể viết hàm wrap nhỏ, nhưng hiện tại lấy theo dòng.
                        // Trải nghiệm tốt nhất là wrap qua các từ.
                        const words = edit.newText.replace(/\\n/g, ' \\n ').split(' ');
                        let wrappedLines = [];
                        let currentLine = '';
                        for (let w of words) {
                            if (w === '\\n') {
                                wrappedLines.push(currentLine.trim());
                                currentLine = '';
                                continue;
                            }
                            const testLine = currentLine ? currentLine + ' ' + w : w;
                            const tw = editFont.widthOfTextAtSize(testLine, size);
                            if (tw > edit.width && currentLine !== '') {
                                wrappedLines.push(currentLine.trim());
                                currentLine = w;
                            } else {
                                currentLine = testLine;
                            }
                        }
                        if (currentLine) wrappedLines.push(currentLine.trim());

                        for (const line of wrappedLines) {
                            const tw = editFont.widthOfTextAtSize(line, size);
                            let drawX = edit.x;
                            if (edit.align === 'center') {
                                drawX = edit.x + (edit.width - tw) / 2;
                            } else if (edit.align === 'right') {
                                drawX = edit.x + edit.width - tw;
                            }
                            
                            targetPage.drawText(line, {
                                x: drawX,
                                y: currentY,
                                size: size,
                                font: editFont,
                                color: window.PDFLib.rgb(r, g, b)
                            });
                            currentY -= lineHeight;
                        }
                    }
'''

content = re.sub(r'if \(edit\.newText\) \{.*?targetPage\.drawText.*?\}\s*\}', draw_logic.strip() + '\n                }', content, flags=re.DOTALL)

with open('organizer.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated executeSave')

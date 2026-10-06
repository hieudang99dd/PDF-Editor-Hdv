import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        html_path = "file://" + os.path.abspath("index.html").replace('\\', '/')
        await page.goto(html_path)
        await page.wait_for_timeout(1000)
        
        # Add blank page directly
        await page.evaluate("window.app.addBlankPage(0)")
        await page.wait_for_timeout(1000)
        
        # Create a mock text block for blank page
        await page.evaluate("""
            window.app.pages[0].textEdits = [];
            const div = document.createElement('div');
            div.id = 'test-div';
            div.dataset.id = 'block_0';
            div.dataset.pdfMinX = '10';
            div.dataset.pdfMaxY = '20';
            div.dataset.pdfSize = '12';
            div.dataset.pdfMaxX = '100';
            div.dataset.pdfMinY = '10';
            div.innerText = 'Hello World';
            div.contentEditable = 'true';
            document.body.appendChild(div);
            window.app.focusedPageId = window.app.pages[0].id;
            window.app.commitEdit(div);
        """)
        
        # Check textEdits after
        res2 = await page.evaluate("window.app.pages[0].textEdits")
        print("textEdits after:", res2)
        
        await browser.close()

asyncio.run(run())

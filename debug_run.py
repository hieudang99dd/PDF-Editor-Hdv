import asyncio
from playwright.async_api import async_playwright

async def test_pdf_edit():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        import os
        html_path = "file://" + os.path.abspath("index.html").replace('\\', '/')
        await page.goto(html_path)
        
        # We need a PDF file to upload.
        # But maybe we can just create a blank page?
        print("Page loaded")
        # Click add blank page
        await page.click('#po-add-blank')
        await page.wait_for_timeout(500)
        
        # Click "Edit Text"
        await page.click('#po-tb-edit-text')
        await page.wait_for_timeout(500)
        
        # But blank page has no text to edit!
        print("Done")
        await browser.close()

asyncio.run(test_pdf_edit())

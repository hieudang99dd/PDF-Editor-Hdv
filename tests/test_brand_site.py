"""PDF HVD branding must be presentation-only; retain upstream legal notices."""
import importlib.util
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "brand_site", ROOT / "scripts" / "cit-original" / "brand_site.py"
)
brand = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(brand)

SAMPLE = """<!doctype html><html lang="en"><head>
<meta name="title" content="Edit PDF Text | BentoPDF" />
<meta name="author" content="BentoPDF" />
<meta property="og:title" content="Edit PDF Text | BentoPDF" />
<meta property="og:site_name" content="BentoPDF" />
<meta property="og:url" content="https://www.bentopdf.com/edit-pdf-text" />
<meta name="twitter:title" content="Edit PDF Text | BentoPDF" />
<meta name="twitter:url" content="https://www.bentopdf.com/edit-pdf-text" />
<meta name="twitter:site" content="@BentoPDF" />
<link rel="canonical" href="https://www.bentopdf.com/edit-pdf-text" />
<link rel="manifest" href="/PDF-Editor-Hdv/cit-native/site.webmanifest" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/original-icon.png" />
<title>Edit PDF Text | BentoPDF</title></head><body>
<img id="nav-logo" src="/original-logo.svg" alt="Bento PDF Logo" />
<span id="nav-brand"><a href="/">BentoPDF</a></span>
<span id="footer-brand">BentoPDF</span>
<p id="footer-copyright">&copy; 2026 BentoPDF. All rights reserved.</p>
<div id="inspector"><input id="fSize" /><input id="fLine"/></div>
</body></html>"""


class TestPDFHVDBranding(unittest.TestCase):
    def test_titles_seo_and_icon(self):
        rendered = brand.rebrand_page(SAMPLE, "edit-pdf-text.html")
        self.assertIn("<title>PDF HVD – Chỉnh sửa văn bản</title>", rendered)
        self.assertIn('name="author" content="PDF HVD"', rendered)
        self.assertIn('property="og:site_name" content="PDF HVD"', rendered)
        self.assertIn('href="hvd-hub.css"', rendered)
        self.assertIn('src="hvd-hub.js"', rendered)
        self.assertIn("hvd-mark.svg", rendered)
        self.assertIn("hvd-site.webmanifest", rendered)
        self.assertNotIn("www.bentopdf.com", rendered)
        self.assertNotIn("@BentoPDF", rendered)

    def test_brand_migrated_without_changing_legally_required_credit(self):
        rendered = brand.rebrand_page(SAMPLE, "edit-pdf-text.html")
        self.assertIn('href="https://hieudang99dd.github.io/PDF-Editor-Hdv/index.html">PDF HVD', rendered)
        self.assertIn('<span id="footer-brand">PDF HVD</span>', rendered)
        self.assertIn('&copy; 2026 BentoPDF. All rights reserved.', rendered)
        self.assertIn('id="fSize"', rendered)
        self.assertIn('id="fLine"', rendered)

    def test_idempotent_injection(self):
        one = brand.rebrand_page(SAMPLE, "edit-pdf-text.html")
        two = brand.rebrand_page(one, "edit-pdf-text.html")
        self.assertEqual(two.count('hvd-hub.js'), 1)
        self.assertEqual(two.count('hvd-hub.css'), 1)
        self.assertEqual(two.count('hvd-site.webmanifest'), 1)
        self.assertEqual(two.count('hvd-mark.svg'), 4)

if __name__ == "__main__":
    unittest.main()

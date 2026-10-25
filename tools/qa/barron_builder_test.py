"""Source-layout regressions. Synthetic PDF pages; no copyrighted fixtures."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'tools/barron/build_bilingual.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
WORDS = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda omega'.split()


def page(n):
    # An ordinary alpha precedes the intended cloze alpha; annotation is below cell.
    text = 'Ordinary alpha precedes the exercise. ' + ' '.join(WORDS) + '.'
    def block(x, y, text):
        return {'lines': [{'bbox': (x, y, x + 200, y + 11), 'spans': [{'text': text}]}]}
    class Page:
        def get_drawings(self):
            return [{'rect': pymupdf.Rect(66, 18, 332, 18.5)},
                    {'rect': pymupdf.Rect(66, 180, 332, 180.5)}]
        def get_text(self, mode):
            return {'blocks': [block(108, 40, text), block(374, 40, 'Một đoạn dịch giả để kiểm thử.'),
                               block(108, 200, 'EXCLUDE VOCABULARY NOTE')]}
    return Page()


class BuilderRegression(unittest.TestCase):
    def test_all50_cloze_uses_verified_second_occurrence_and_excludes_notes(self):
        heads = [{'lesson': n} for n in range(1, 51)]
        keys = {str(n): {'words': WORDS, 'key_pdf_page': 333, 'key_visually_checked': True,
                         'target_occurrences': {'1': 1}} for n in range(1, 51)}
        with patch.object(builder.pymupdf, 'open', return_value=[page(n) for n in range(103)]):
            rows, report = builder.build('unused.pdf', heads, keys)
        self.assertEqual(len(rows), 600)
        self.assertTrue(all(not r['errors'] for r in report))
        for row in rows:
            self.assertIn('Ordinary alpha precedes', row['passage'])
            self.assertNotIn('EXCLUDE', row['passage'])
            self.assertIn('exercise. -------(1)', row['passage'])

    def test_unverified_or_missing_key_blocks_data(self):
        heads = [{'lesson': n} for n in range(1, 51)]
        keys = {str(n): {'words': WORDS, 'key_pdf_page': 333} for n in range(1, 51)}
        with patch.object(builder.pymupdf, 'open', return_value=[page(n) for n in range(103)]):
            rows, report = builder.build('unused.pdf', heads, keys)
        self.assertEqual(rows, [])
        self.assertEqual(len(report), 50)
        self.assertTrue(all(r['errors'] for r in report))

    def test_missing_lesson_header_fails(self):
        with self.assertRaises(ValueError):
            builder.build('unused.pdf', [{'lesson': 1}], {})


if __name__ == '__main__':
    unittest.main()

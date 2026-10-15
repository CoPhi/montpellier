"""Validate generated PAGE exports against the official, version-pinned XSD."""
from pathlib import Path
from lxml import etree
import json

root=Path(__file__).resolve().parent
schema=etree.XMLSchema(etree.parse(root/'pagecontent.xsd'))
count=0
for path in (root/'out').glob('*/*.page.xml'):
    doc=etree.parse(path)
    if not schema.validate(doc):
        raise ValueError(f'{path.name}: {schema.error_log}')
    count+=1
if not count:
    raise ValueError('No PAGE exports found. Run npm test first.')
print(f'PAGE XSD validation: PASS ({count} files, schema 2019-07-15).')

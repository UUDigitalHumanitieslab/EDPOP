import re

def name_to_slug(name: str) -> str:
    no_spaces = lambda s: re.sub(r'\s+', '_', s)
    clean = lambda s: re.sub(r'[^a-z0-9\-_]', '', s)
    strip_start = lambda s: re.sub(r'^\W+', '', s)
    strip_end = lambda s: re.sub(r'\W+$', '', s)

    return strip_end(strip_start(clean(no_spaces(str.lower(name)))))

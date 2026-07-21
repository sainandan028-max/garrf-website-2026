import glob
files = glob.glob('*.html') + ['admin/index.html']
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if 'committee.html' not in content and 'a_about' in content:
        content = content.replace(
            '<li class="nav-item">\n<a class="nav-link" data-editable="a_divisions" data-editable-href="a_divisions_href" href="divisions.html">Divisions</a>\n</li>',
            '<li class="nav-item">\n<a class="nav-link" data-editable="a_committee" data-editable-href="a_committee_href" href="committee.html">Committee</a>\n</li>\n<li class="nav-item">\n<a class="nav-link" data-editable="a_divisions" data-editable-href="a_divisions_href" href="divisions.html">Divisions</a>\n</li>'
        )
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)

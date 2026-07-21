import re
import urllib.parse

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find all instances of:
# <div class="division-card" onclick="window.location.href='committee.html'" style="cursor: pointer;" title="View Organizational Committee">
# <i class="..."></i>
# <h3 data-editable="...">Division Name</h3>
# And replace the onclick URL with the correct one.

pattern = re.compile(r'(<div class="division-card" onclick="window\.location\.href=\')(committee\.html)(\'" style="cursor: pointer;" title="View Organizational Committee">\s*<i class=".*?"></i>\s*<h3.*?>\s*)(.*?)\s*(</h3>)', re.DOTALL)

def replacer(match):
    prefix = match.group(1)
    base_url = match.group(2)
    middle = match.group(3)
    title = match.group(4).strip()
    suffix = match.group(5)
    
    encoded_title = urllib.parse.quote(title)
    new_url = f"committee.html?category={encoded_title}"
    
    return f"{prefix}{new_url}{middle}{title}{suffix}"

new_content = pattern.sub(replacer, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated index.html links successfully.")

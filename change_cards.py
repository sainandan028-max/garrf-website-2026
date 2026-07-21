import re

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match the opening div of the division card
    pattern = re.compile(r'<div class="division-card" onclick="window\.location\.href=\'(.*?)\'" style="cursor: pointer;" title="View Organizational Committee">')
    
    # We will replace the opening tag
    def replacer(match):
        url = match.group(1)
        # Generate a unique editable key based on the URL (category name)
        # e.g., committee.html?category=Virtual%20AISIA -> virtual_aisia
        safe_key = url.split('=')[1].replace('%20', '_').lower()
        safe_key = re.sub(r'[^a-z0-9_]', '', safe_key)
        return f'<a href="{url}" class="division-card text-decoration-none text-dark d-block" data-editable="a_div_card_{safe_key}">'
        
    new_content = pattern.sub(replacer, content)
    
    # Now we must replace the closing </div> of each division-card with </a>
    # A simple string replacement isn't enough because of nested divs, but luckily division-card has no nested divs!
    # Wait, it has <i class="..."></i>, <h3>, <p>. None of these are divs! 
    # Let's check `index.html` line 169: it ends with `</p>\n</div>`. 
    # Yes, it's just `</p>\n</div>`.
    
    new_content = new_content.replace('</p>\n</div>', '</p>\n</a>')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {filename}")

process_file('index.html')
process_file('divisions.html')

import glob

for f in ['index.html', 'divisions.html']:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        content = content.replace('<div class="division-card">', '<div class="division-card" onclick="window.location.href=\'committee.html\'" style="cursor: pointer;" title="View Organizational Committee">')
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
    except Exception as e:
        print(f"Error processing {f}: {e}")

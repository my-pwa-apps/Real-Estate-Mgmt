import os, glob, re

js_files = glob.glob('js/*.js')
pattern = re.compile(r'<circle cx="12" cy="12" r="10"></circle>\s*<path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>\s*<path d="M12 18V6"></path>')

new_svg = '<path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>'

for file in js_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = pattern.sub(new_svg, content)
    
    if content != modified:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f'Updated {file}')


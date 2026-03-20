const fs = require('fs');
const path = require('path');
const { icons } = require('lucide');

const emojiMap = {
    '📊': 'LayoutDashboard',
    '🏢': 'Building',
    '👥': 'Users',
    '📄': 'FileText',
    '🔧': 'Wrench',
    '📋': 'ClipboardList',
    '💰': 'CircleDollarSign',
    '⚙️': 'Settings',
    '🚪': 'LogOut',
    '🎭': 'Theater',
    '🔍': 'Search',
    '➕': 'Plus',
    '📥': 'Download',
    '✏️': 'Pencil',
    '🗑️': 'Trash2',
    '📧': 'Mail',
    '✅': 'CheckCircle',
    '❌': 'XCircle',
    '✖️': 'X',
    '📍': 'MapPin',
    '🏗️': 'Hammer',
    '🤝': 'Handshake',
    '📝': 'FileEdit',
    'ℹ️': 'Info',
    '👤': 'User',
    '📞': 'Phone',
    '🎂': 'Cake',
    '🧩': 'Puzzle',
    '📅': 'Calendar',
    '⚠️': 'AlertTriangle',
    '🔐': 'Lock',
    '👁️': 'Eye',
    '✨': 'Sparkles'
};

function toNode(nodeDef) {
    if (!Array.isArray(nodeDef)) return '';
    let tag = nodeDef[0];
    let attrs = nodeDef[1] || {};
    let children = nodeDef.slice(2);
    
    let attrStr = Object.entries(attrs).map(([k, v]) => \\="\"\).join(' ');
    let childrenStr = children ? children.map(c => toNode(c)).join('') : '';
    
    return \<\ \>\</\>\;
}

function getSvgStr(iconName) {
    let iconData = icons[iconName];
    if (!iconData) {
        console.log('Icon not found in lucide: ' + iconName);
        return '';
    }
    
    // In Lucide v3, icons[iconName] is just the array of children
    // Let's create the root <svg> manually
    let attributes = {
        xmlns: "http://www.w3.org/2000/svg",
        class: "lucide-icon",
        width: "1em",
        height: "1em",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none"
    };
    
    let attrStr = Object.entries(attributes).map(([k, v]) => \\="\"\).join(' ');
    // Important: iconData is the array of child tuples
    let childrenStr = iconData.map(c => toNode(c)).join('');
    return \<svg \>\</svg>\;
}

const fileExts = ['.html', '.js'];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        if (['node_modules', '.git', 'replace_emojis.js', 'package.json', 'package-lock.json'].includes(file)) continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else {
            const ext = path.extname(fullPath);
            if (fileExts.includes(ext)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let modified = false;
                
                for (let [emoji, iconName] of Object.entries(emojiMap)) {
                    if (content.includes(emoji)) {
                        const svg = getSvgStr(iconName);
                        if (svg) {
                            content = content.replaceAll(emoji, svg);
                            modified = true;
                        }
                    }
                }
                
                if (modified) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log('Updated emojis in ' + fullPath);
                }
            }
        }
    }
}

processDirectory(__dirname);

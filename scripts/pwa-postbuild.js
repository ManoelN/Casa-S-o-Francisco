const fs = require('fs');
const p = 'dist/index.html';
let h = fs.readFileSync(p, 'utf8');
const tags = `
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Crediário" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />`;
if (!h.includes('rel="manifest"')) h = h.replace('</head>', tags + '\n  </head>');
h = h.replace('shrink-to-fit=no"', 'shrink-to-fit=no, viewport-fit=cover"');
h = h.replace(/<html lang="en">/, '<html lang="pt-BR">');
fs.writeFileSync(p, h);
console.log('PWA tags injetadas em', p);

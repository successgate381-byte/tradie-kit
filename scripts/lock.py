# Records every label, field and button the app has right now into spec/lock.json.
# Run it on purpose (npm run lock) after you deliberately add or remove a feature.
import json, os, re
from playwright.sync_api import sync_playwright
src = open('app/app.js', encoding='utf8').read()
strings, keys, ids = set(), set(), set()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1100, 'height': 900}); pg.goto('file://' + os.path.abspath('app/index.html'))
    pg.click('nav button[data-t="My Details"]'); pg.select_option('#i-trade', 'Other'); pg.click('nav button[data-t="Variation"]'); pg.select_option('#i-why', 'Other')
    for t in ['Start Here', 'My Details', 'Quote', 'Tax Invoice', 'Invoice', 'Variation', 'Rate Calculator', 'Line Items', 'Worked Examples']:
        pg.click(f'nav button[data-t="{t}"]'); strings.add(t)
        for sel in ('.fr label', '.sec', '.btns .b', '.pbar .b'):
            strings.update(pg.eval_on_selector_all(sel, 'e=>e.map(x=>x.textContent.trim())'))
        keys.update(k for k in pg.eval_on_selector_all('[data-k]', 'e=>e.map(x=>x.dataset.k)') if not re.fullmatch(r'[dqpg]\d+', k))
        ids.update(pg.eval_on_selector_all('button[id]', 'e=>e.map(x=>x.id)'))
    b.close()
out = {'note': 'Features that must never disappear by accident. Rebuild on purpose with: npm run lock',
       'strings': sorted(s for s in strings if s and s in src), 'keys': sorted(k for k in keys if "'" + k + "'" in src),
       'ids': sorted(i for i in ids if 'id="' + i + '"' in src)}
os.makedirs('spec', exist_ok=True); json.dump(out, open('spec/lock.json', 'w'), indent=1)
print('locked', len(out['strings']), 'texts,', len(out['keys']), 'fields,', len(out['ids']), 'buttons')

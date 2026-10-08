import os, re, sys
from playwright.sync_api import sync_playwright
URL = 'file://' + os.path.abspath('app/index.html')
TABS = ['Start Here','My Details','Quote','Tax Invoice','Invoice','Variation','Rate Calculator','Line Items','Worked Examples']
FAILS = []
def ok(c, m):
    if not c: FAILS.append(m); print('  FAIL:', m)
    return c
def fresh(b, **kw):
    pg = b.new_context(**kw).new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL); pg.errs = errs; return pg
def tab(pg, n): pg.click(f'nav button[data-t="{n}"]')
def line(pg, i, d, q, p):
    pg.fill(f'[data-k=d{i}]', d); pg.fill(f'[data-k=q{i}]', str(q)); pg.fill(f'[data-k=p{i}]', str(p)); pg.press(f'[data-k=p{i}]', 'Tab')
def details(pg, gst='Yes', trade='Plumber'):
    tab(pg, 'My Details')
    for k, v in dict(name='Smith Plumbing', abn='12 345 678 901', lic='PL12345', phone='0412 345 678', email='jo@x.com.au', bank='Commonwealth Bank', acct='Smith Plumbing', bsb='062-000', acno='12345678', payid='0412 345 678', card='https://pay.example/abc').items(): pg.fill(f'#i-{k}', v)
    pg.select_option('#i-gst', gst); pg.select_option('#i-trade', trade)
def T(pg, id): return pg.inner_text('#' + id).strip()
with sync_playwright() as p:
    b = p.chromium.launch()
    print('1. every tab opens clean (desktop and 390px phone)')
    for kw in (dict(viewport={'width': 1100, 'height': 900}), dict(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)):
        pg = fresh(b, **kw)
        for n in TABS:
            tab(pg, n); tx = pg.inner_text('body')
            ok('undefined' not in tx and 'NaN' not in tx, f'{n}: undefined/NaN on screen')
            ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'{n}: sideways scroll at {kw["viewport"]["width"]}px')
        ok(not pg.errs, f'js errors: {pg.errs}')
    pg = fresh(b, viewport={'width': 1100, 'height': 900}); details(pg)
    print('2. Other boxes')
    ok(pg.is_visible('#i-tradeo') is False, 'trade box shown too early'); pg.select_option('#i-trade', 'Other'); ok(pg.is_visible('#i-tradeo'), 'trade Other box missing'); pg.fill('#i-tradeo', 'Carpenter'); tab(pg, 'Line Items'); ok('CARPENTER' in pg.inner_text('.band b'), 'Other trade not on Line Items'); tab(pg, 'My Details'); pg.select_option('#i-trade', 'Plumber')
    print('3. Tax Invoice maths, dates, warnings, add line')
    tab(pg, 'Tax Invoice'); pg.fill('#i-no', 'INV-001'); pg.fill('#i-date', '2026-10-06'); line(pg, 1, 'Hot water system', 1, 1350); line(pg, 2, 'Labour', 4, 110)
    ok(pg.input_value('[data-k=p1]') == '$1,350.00', 'price not shown with $'); ok((T(pg, 't1'), T(pg, 't3'), T(pg, 't4')) == ('$1,790.00', '$179.00', '$1,969.00'), 'TI totals'); ok(T(pg, 'c-due') == '13 Oct 2026', 'due date')
    ok('REQUIRED' in T(pg, 'req'), 'customer required warning missing'); pg.fill('#i-cust', 'A. Customer'); ok(T(pg, 'req') == '', 'warning stays after name')
    ok(pg.locator('.ln:not(.th)').count() == 8, 'default 8 lines'); pg.click('#addl'); ok(pg.locator('.ln:not(.th)').count() == 9, 'Add a line did nothing'); line(pg, 9, 'Extra', 1, 100); ok(T(pg, 't4') == '$2,079.00', 'line 9 not in total: ' + T(pg, 't4'))
    pg.reload(); tab(pg, 'Tax Invoice'); ok(pg.locator('.ln:not(.th)').count() == 9 and pg.input_value('[data-k=d9]') == 'Extra', 'added line lost after reload')
    pg.click('#rml'); ok(pg.locator('.ln:not(.th)').count() == 8 and T(pg, 't4') == '$1,969.00', 'Remove last line')
    print('4. preview and wrong-tab warnings')
    pg.click('#pv'); pv = pg.inner_text('#paper'); ok(all(x in pv for x in ('$1,969.00', 'Commonwealth Bank', '6 Oct 2026')) and not any(x in pv for x in ('undefined', 'NaN', 'Customer ABN', 'Job address')), 'preview content'); pg.click('#bk')
    tab(pg, 'Invoice'); ok('STOP' in T(pg, 'leg'), 'Invoice warning when GST=Yes'); tab(pg, 'My Details'); pg.select_option('#i-gst', 'No'); tab(pg, 'Tax Invoice'); ok('STOP' in T(pg, 'leg'), 'Tax Invoice warning when GST=No')
    tab(pg, 'Invoice'); line(pg, 1, 'Downlights', 6, 30); ok(T(pg, 't4') == '$180.00', 'Invoice total'); tab(pg, 'My Details'); pg.select_option('#i-gst', 'Yes')
    print('5. Quote')
    tab(pg, 'Quote'); pg.fill('#i-no', 'Q-001'); pg.fill('#i-date', '2026-10-06'); line(pg, 1, 'Labour', 3, 95); pg.select_option('[data-k=g1]', 'No'); ok(T(pg, 't3') == '$0.00', 'GST-free line'); pg.select_option('[data-k=g1]', 'Yes')
    ok(T(pg, 'c-valid') == '5 Nov 2026', 'valid until'); pg.fill('#i-dep', '20'); ok('Deposit due: $62.70' in T(pg, 'c-dn'), 'deposit note: ' + T(pg, 'c-dn')[:40]); pg.fill('#i-an', 'A. Customer'); ok('Customer signature' in pg.inner_text('body'), 'customer signature label')
    pg.click('#pv'); ok('Customer name: A. Customer' in pg.inner_text('#paper'), 'customer name in preview'); pg.click('#bk')
    print('6. Variation and Rate Calculator')
    tab(pg, 'Variation'); pg.fill('#i-no', 'V-001'); line(pg, 1, 'Labour', 1, 110); line(pg, 2, 'Valve', 1, 60); ok((T(pg, 't4'), T(pg, 'v4')) == ('$187.00', '$500.50'), 'variation totals ' + T(pg, 't4') + ' ' + T(pg, 'v4'))
    pg.fill('#i-orig', '2000'); pg.press('#i-orig', 'Tab'); ok(T(pg, 'v4') == '$2,187.00', 'orig override'); pg.select_option('#i-why', 'Other'); ok(pg.is_visible('#i-whyo'), 'why Other box'); pg.click('#addl'); ok(pg.locator('.ln:not(.th)').count() == 5, 'variation add line')
    tab(pg, 'Rate Calculator'); ok((T(pg, 'rt'), T(pg, 'c-sp'), T(pg, 'c-mg')) == ('$100.00', '$156.00', '23.1%'), 'rate calculator defaults')
    print('7. printing and clearing')
    tab(pg, 'Tax Invoice'); pg.emulate_media(media='print'); pdf = pg.pdf(format='A4', print_background=True); ok(len(re.findall(rb'/Type\s*/Page[^s]', pdf)) == 1, 'invoice PDF is not one page'); pg.emulate_media(media='screen')
    pg.once('dialog', lambda d: d.accept()); pg.click('#clr'); ok(pg.input_value('[data-k=d1]') == '' and pg.locator('.ln:not(.th)').count() == 8, 'clear this document'); tab(pg, 'My Details'); ok(pg.input_value('#i-bank') == 'Commonwealth Bank', 'details lost on clear')
    ok(not pg.errs, f'js errors: {pg.errs}')
    b.close()
print('\nRESULT:', 'ALL PASSED' if not FAILS else f'{len(FAILS)} FAILED'); sys.exit(1 if FAILS else 0)

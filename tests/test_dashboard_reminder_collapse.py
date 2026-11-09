"""Run with: python3 tests/test_dashboard_reminder_collapse.py

Uses the requesting member's injected session and development-only samples.
"""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    screenshots = Path('/tmp/browser/dashboard-reminders')
    screenshots.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        if os.environ.get('LOVABLE_BROWSER_AUTH_STATUS') == 'injected':
            key = os.environ['LOVABLE_BROWSER_SUPABASE_STORAGE_KEY']
            session = os.environ['LOVABLE_BROWSER_SUPABASE_SESSION_JSON']
            cookies = json.loads(os.environ.get('LOVABLE_BROWSER_SUPABASE_COOKIES_JSON') or '[]')
        else:
            with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f:
                minted = json.load(f)
            key, session = minted['storage_key'], json.dumps(minted['session'])
            cookies = minted.get('cookies') or []
        if cookies:
            await context.add_cookies([{**c, 'url': 'http://localhost:8080'} for c in cookies])
        await page.goto('http://localhost:8080')
        await page.evaluate('([k,v]) => localStorage.setItem(k,v)', [key, session])
        await page.evaluate("sessionStorage.setItem('wooffy_reminders_hidden', 'true')")
        mutations = []
        page.on('request', lambda r: mutations.append(r.method) if r.method in ('POST', 'PATCH', 'DELETE') and ('pet_health_records' in r.url or '/functions/v1/' in r.url or 'ai_proactive_alerts' in r.url) else None)
        for language, title, hide, show in (
            ('en', 'Wooffy Reminders', 'Hide', 'Show More'),
            ('el', 'Wooffy Υπενθυμίσεις', 'Απόκρυψη', 'Δες Περισσότερα'),
        ):
            await page.evaluate('(lng) => localStorage.setItem("wooffy_lang", lng)', language)
            for width, height in ((393, 756), (1280, 1800)):
                await page.set_viewport_size({'width': width, 'height': height})
                await page.goto('http://localhost:8080/member/free')
                panel = page.get_by_label(title, exact=True)
                await panel.wait_for()
                listing = page.locator('#dashboard-reminder-list')
                await listing.wait_for()
                original = await listing.inner_text()
                assert await listing.get_by_role('button').count() == 4, 'Four sample reminders are visible'
                await panel.screenshot(path=str(screenshots / f'{language}-{width}-expanded.png'))
                before = len(mutations)
                await panel.get_by_role('button', name=hide, exact=True).click()
                assert await panel.is_visible(), 'Hide must keep the reminder panel visible'
                assert await listing.count() == 0, 'Hide collapses the list'
                assert await panel.get_by_role('button', name=show, exact=True).is_visible(), 'Members can reopen hidden reminders'
                await panel.screenshot(path=str(screenshots / f'{language}-{width}-collapsed.png'))
                await panel.get_by_role('button', name=show, exact=True).click()
                assert await listing.inner_text() == original, 'Reopening returns the same reminders'
                assert len(mutations) == before, 'Hide and reopen do not mutate records or dispatch alerts'
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'No horizontal overflow'
                print(f'PASS: {language}, {width}px, Hide keeps panel and restores all four reminders without mutations')
        assert not mutations, 'Preview samples must never write health records or generate alerts'
        await browser.close()


asyncio.run(main())
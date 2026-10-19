"""Regression: signed-out business links go to /auth without fetching profiles.

Run with: python3 tests/test_business_profile_guest_access.py
"""
import asyncio
from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        profile_requests = []
        page.on("request", lambda request: profile_requests.append(request.url)
                if "/rest/v1/businesses" in request.url else None)
        for suffix in ("", "?preview=true"):
            await page.goto(
                "http://localhost:8080/business/da96b650-6b1f-4649-bfcf-cb3f292dca54" + suffix,
                wait_until="domcontentloaded",
            )
            await page.wait_for_url("**/auth")
            assert page.url == "http://localhost:8080/auth", page.url
            assert not profile_requests, "Guests must not fetch business profile records"
        await browser.close()
        print("PASS: business profile and preview links redirect guests to /auth without profile queries")


asyncio.run(main())
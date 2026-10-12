"""Live access regression: python3 -m unittest discover -s tests.

Requires an approved local admin session from `lovable auth-session --json --self`.
Never prints session data. Reads existing hidden test shelters without approving them.
"""
import json
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright


class HiddenShelterAccess(unittest.TestCase):
    def test_hidden_shelter_is_visible_only_to_admins(self):
        session_path = Path.home() / ".cache/lovable-auth/session.json"
        self.assertTrue(session_path.exists(), "An admin test session is required")
        session = json.loads(session_path.read_text())
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            admin = browser.new_page(viewport={"width": 1280, "height": 1800})
            admin.goto("http://localhost:8080")
            admin.evaluate("v => localStorage.setItem(v[0], v[1])", [session["storage_key"], json.dumps(session["session"])])
            admin.goto("http://localhost:8080/admin")
            admin.get_by_role("tab", name="Users", exact=False).wait_for()
            hidden = admin.evaluate("""async () => {
              const {supabase} = await import('/src/integrations/supabase/client.ts');
              const {data, error} = await supabase.from('shelters').select('id').eq('is_hidden',true);
              if(error) throw new Error(error.message);
              return data;
            }""")
            self.assertGreater(len(hidden), 0, "An existing hidden test shelter is required")
            shelter_id = hidden[0]["id"]
            admin.goto(f"http://localhost:8080/shelter/{shelter_id}")
            admin.get_by_role("heading", name="Test shelter", exact=True).wait_for()
            for account in ("guest", "non_admin"):
                context = browser.new_context(viewport={"width": 1280, "height": 1800})
                page = context.new_page()
                page.goto("http://localhost:8080")
                if account == "non_admin":
                    key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
                    value = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
                    self.assertTrue(key and value, "A non-admin test session is required")
                    page.evaluate("v => localStorage.setItem(v[0], v[1])", [key, value])
                page.goto(f"http://localhost:8080/shelter/{shelter_id}")
                page.get_by_role("heading", name="Shelter Not Found").wait_for()
                result = page.evaluate("""async (id) => {
                  const {supabase} = await import('/src/integrations/supabase/client.ts');
                  const {data: {user}} = await supabase.auth.getUser();
                  const role = user ? await supabase.rpc('has_role', {_user_id:user.id,_role:'admin'}) : {data:false};
                  const counts = [];
                  for (const table of ['shelters','shelters_public','shelters_directory']) {
                    const {data,error} = await supabase.from(table).select('id').eq('id',id);
                    if(error) throw new Error(error.message);
                    counts.push(data.length);
                  }
                  return {admin:role.data, counts};
                }""", shelter_id)
                self.assertFalse(result["admin"], "Test account must not be an admin")
                self.assertEqual(result["counts"], [0, 0, 0], account)
                context.close()
            browser.close()
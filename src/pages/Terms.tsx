import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Terms = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace("#", ""));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <>
      <Helmet>
        <title>Terms & Conditions | Wooffy</title>
        <meta name="description" content="Read the Terms and Conditions, Privacy Policy, and Shelter Participation Agreement for Wooffy.App." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <article className="prose prose-sm sm:prose max-w-none dark:prose-invert prose-headings:font-display">
            <h1>Terms and Conditions of Wooffy.App</h1>

            <div className="bg-muted/50 rounded-xl p-4 sm:p-6 not-prose mb-8 border border-border">
              <h3 className="font-display font-semibold text-foreground mb-3 text-sm">Plain-Language Summary (Non-Binding)</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Wooffy.App helps pet owners access discounts and services from pet-related businesses in Cyprus.</li>
                <li>Wooffy does not provide pet services itself and is not a veterinarian.</li>
                <li>Businesses decide their own offers and are responsible for honoring them.</li>
                <li>Memberships are annual, auto-renewing, and refundable only within 14 days if unused.</li>
                <li>Misuse of membership cards or QR codes can lead to suspension or termination.</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3 italic">This summary is for convenience only. The legally binding terms are set out below.</p>
            </div>

            <p className="text-sm text-muted-foreground">Last updated: February 18, 2026</p>

            <p>These Terms and Conditions ("Terms") govern the use of the Wooffy.App mobile application and related services (collectively, the "Platform"), operated by Wooffy App Ltd, a company incorporated in Cyprus ("Wooffy", "we", "us", "our"). By accessing or using the Platform, you agree to be bound by these Terms.</p>
            <p>If you do not agree with these Terms, please do not use the Platform.</p>

            <h2>1. Definitions &amp; Interpretation</h2>
            <ul>
              <li><strong>"App"</strong> means the Wooffy.App mobile application.</li>
              <li><strong>"Platform"</strong> means the App and all related services.</li>
              <li><strong>"Member"</strong> means a registered pet owner using the Platform.</li>
              <li><strong>"Business"</strong> means a pet-related service provider listed on the Platform.</li>
              <li><strong>"Shelter"</strong> means a verified animal shelter participating in the Platform.</li>
              <li><strong>"Membership"</strong> means a paid annual subscription.</li>
              <li><strong>"QR Code"</strong> means the unique digital code used to redeem offers.</li>
            </ul>
            <p>Headings are for convenience only and do not affect interpretation.</p>

            <h2>2. Scope of the Platform</h2>
            <p>Wooffy.App is a marketplace and intermediary platform connecting:</p>
            <ul>
              <li>Pet owners ("Members")</li>
              <li>Pet-related businesses ("Businesses")</li>
              <li>Verified animal shelters ("Shelters")</li>
            </ul>
            <p>Wooffy does not provide veterinary, grooming, training, boarding, retail, or other pet-related services directly.</p>

            <h2>3. Eligibility</h2>
            <ul>
              <li>You must be at least 18 years old to create an account.</li>
              <li>You must provide accurate, current, and complete information.</li>
              <li>Each account may manage multiple pets but only one membership card.</li>
            </ul>

            <h2>4. Membership Plans &amp; Pricing</h2>
            <h3>4.1 Paid Memberships</h3>
            <p>Memberships are billed annually (plus VAT):</p>
            <div className="not-prose overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg">
                <tbody>
                  <tr className="border-b border-border"><td className="p-3 font-semibold">€29/year</td><td className="p-3">for 1 pet</td></tr>
                  <tr className="border-b border-border"><td className="p-3 font-semibold">€49/year</td><td className="p-3">for 2 pets</td></tr>
                  <tr><td className="p-3 font-semibold">€79/year</td><td className="p-3">for 3–5 pets</td></tr>
                </tbody>
              </table>
            </div>
            <p>Memberships renew automatically unless cancelled before the renewal date. Cancellation stops future billing, but access remains valid until the end of the paid period.</p>

            <h3>4.2 Payment Methods</h3>
            <p>Payments are accepted via Credit/Debit Card, Apple Pay, and Google Pay.</p>

            <h2>5. Free Services</h2>
            <p>Users may access the following free of charge without purchasing a membership:</p>
            <ul>
              <li>Pet Community Hub</li>
              <li>Lost &amp; Found Pets Service</li>
              <li>Dog-Friendly Places</li>
            </ul>
            <p>All Dog-Friendly Places listed on the Platform are subject to prior review and approval by the Wooffy.App administrator before publication. Wooffy reserves the right to verify, modify, suspend, or remove any Dog-Friendly Place listing at its discretion.</p>

            <h2>6. Discounts, Offers &amp; QR Code Redemption</h2>
            <ul>
              <li>Discounts and free services are defined solely by Businesses.</li>
              <li>Offer availability, limits, and redemption frequency vary by Business.</li>
              <li>Some offers may be redeemable unlimited times; others may be limited.</li>
              <li>Redemption occurs via a QR code scan at the Business location.</li>
              <li>Wooffy does not guarantee the availability, quality, or suitability of any offer.</li>
            </ul>

            <h2>7. Abuse, Fraud &amp; Misuse</h2>
            <p>The following are strictly prohibited:</p>
            <ul>
              <li>Sharing or duplicating membership cards or QR codes</li>
              <li>Screenshot or unauthorized use of QR codes</li>
              <li>Misrepresentation of pet ownership</li>
            </ul>
            <p>Wooffy reserves the right to suspend or terminate accounts without refund in cases of misuse, fraud, or abuse.</p>

            <h2>8. Refund Policy</h2>
            <ul>
              <li>Members are entitled to a 14-day cooling-off period only if no offers have been redeemed.</li>
              <li>No partial refunds are provided.</li>
              <li>No refunds will be issued once any membership benefit is used.</li>
            </ul>

            <h2>9. Businesses</h2>
            <h3>9.1 Business Participation</h3>
            <ul>
              <li>Business participation is free.</li>
              <li>Businesses may modify or withdraw offers at any time.</li>
              <li>Businesses are fully responsible for the accuracy, legality, and fulfillment of their offers.</li>
            </ul>

            <h3>9.2 Enforcement</h3>
            <p>Wooffy may temporarily suspend or permanently remove a Business account following repeated complaints, misuse, or refusal to honor valid offers.</p>

            <h3>9.3 Approval of Businesses</h3>
            <ul>
              <li>All Businesses must submit a participation request through the Platform.</li>
              <li>Participation is subject to prior review and approval by the Wooffy.App administrator.</li>
              <li>Wooffy reserves the right, at its sole discretion, to approve or reject any Business application without obligation to provide justification.</li>
              <li>A Business will appear on the Platform only after formal approval by Wooffy.</li>
            </ul>

            <h2>10. AI Health Assistant Disclaimer</h2>
            <ul>
              <li>The AI Health Assistant is informational only.</li>
              <li>It does not provide veterinary, medical, or diagnostic advice.</li>
              <li>Users must consult licensed veterinarians for medical decisions.</li>
              <li>Wooffy bears no liability for actions taken based on AI-generated information.</li>
            </ul>

            <h2>11. Animal Shelters &amp; Donations</h2>
            <ul>
              <li>10% of Wooffy's gross revenue is allocated to participating Shelters.</li>
              <li>Payments are distributed quarterly.</li>
              <li>Shelters are verified by Wooffy.</li>
              <li>Wooffy is not responsible for how donations are used by Shelters.</li>
              <li>Users may also donate directly via Shelter-provided donation links.</li>
            </ul>
            <p>All Shelters must submit a participation request. Shelter participation is subject to prior review and approval by the Wooffy.App administrator. Wooffy reserves the right, at its sole discretion, to approve, reject, suspend, or remove any Shelter from the Platform. A Shelter will appear on the Platform only after formal approval by Wooffy.</p>

            <h2>12. Data, Analytics &amp; Privacy</h2>
            <ul>
              <li>Businesses may access anonymized analytics and pet birthday insights.</li>
              <li>Usage behavior is tracked for platform improvement.</li>
              <li>Location tracking is not used.</li>
              <li>Personal data is processed in accordance with applicable data protection laws and the Wooffy Privacy Policy.</li>
            </ul>

            <h2>13. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Wooffy shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of the Platform, including but not limited to loss of profits, data, or goodwill.</p>

            <h2>14. Termination</h2>
            <p>Wooffy may suspend or terminate accounts:</p>
            <ul>
              <li>For fraud or abuse</li>
              <li>For violations of these Terms</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p>Termination for cause may occur without prior notice.</p>

            <h2>15. Changes to Terms</h2>
            <p>Wooffy may modify these Terms at any time. Changes will be communicated via email and in-app notifications. Continued use constitutes acceptance of the updated Terms.</p>

            <h2>16. App Store &amp; Google Play Compliance</h2>
            <ul>
              <li>These Terms are between you and Wooffy App Ltd, not Apple or Google.</li>
              <li>Apple and Google are not responsible for the App or its content.</li>
              <li>Apple and Google have no obligation to provide maintenance or support.</li>
              <li>Claims relating to the App must be directed to Wooffy, not Apple or Google.</li>
            </ul>

            <h2>17. Governing Law &amp; Jurisdiction</h2>
            <p>These Terms are governed by the laws of the Republic of Cyprus. Any disputes shall be subject to the exclusive jurisdiction of the Cypriot courts.</p>

            {/* Privacy Policy */}
            <hr className="my-10" />
            <h1 id="privacy-policy">Privacy Policy of Wooffy.App</h1>
            <p className="text-sm text-muted-foreground">Last updated: February 18, 2026</p>

            <h2>1. Data Controller</h2>
            <p>Wooffy App Ltd, Cyprus.</p>

            <h2>2. Data We Collect</h2>
            <ul>
              <li>Account information (name, email)</li>
              <li>Pet data (name, breed, age, health records entered by you)</li>
              <li>Usage data and analytics</li>
              <li>Payment data (processed by third-party providers only)</li>
            </ul>

            <h2>3. Purpose of Processing</h2>
            <ul>
              <li>Account management</li>
              <li>Membership administration</li>
              <li>Offer redemption and analytics</li>
              <li>Platform improvement</li>
              <li>Legal and regulatory compliance</li>
            </ul>

            <h2>4. Legal Basis</h2>
            <ul>
              <li>Contractual necessity</li>
              <li>Legal obligation</li>
              <li>Legitimate interest</li>
              <li>User consent where required</li>
            </ul>

            <h2>5. Data Sharing</h2>
            <ul>
              <li>Businesses receive anonymized analytics and pet birthdays only</li>
              <li>Payment providers process transactions securely</li>
              <li>No sale of personal data</li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>Data is retained only as long as necessary for the stated purposes.</p>

            <h2>7. User Rights</h2>
            <p>You have the right to access, rectify, erase, restrict, or object to processing, and to data portability.</p>

            <h2>8. Security</h2>
            <p>We apply appropriate technical and organizational measures to protect data.</p>

            <h2>9. Cookies &amp; Tracking</h2>
            <p>The App uses limited analytics tools and does not track precise location.</p>

            <h2>10. Supervisory Authority</h2>
            <p>You have the right to lodge a complaint with the Office of the Commissioner for Personal Data Protection of Cyprus.</p>

            <h2>11. Changes</h2>
            <p>Updates will be communicated via email and in-app notification.</p>

            <h2>12. Contact</h2>
            <p>For privacy inquiries: <a href="mailto:hello@wooffy.app" className="text-primary">hello@wooffy.app</a></p>

            {/* Shelter Agreement */}
            <hr className="my-10" />
            <h1 id="shelter-agreement">Shelter Participation Agreement</h1>

            <p>This Shelter Participation Agreement ("Agreement") is entered into between Wooffy App Ltd, a company incorporated in Cyprus ("Wooffy"), and the participating animal shelter ("Shelter").</p>
            <p>By registering and participating on the Wooffy.App platform, the Shelter agrees to the terms below.</p>

            <h2>1. Purpose</h2>
            <p>The purpose of this Agreement is to define the terms under which the Shelter participates in the Wooffy.App platform, including:</p>
            <ul>
              <li>Receiving a share of Wooffy's revenue</li>
              <li>Displaying shelter information and animals for adoption</li>
              <li>Accepting optional direct donations from users</li>
            </ul>

            <h2>2. Eligibility &amp; Verification</h2>
            <ul>
              <li>Participation is free of charge.</li>
              <li>The Shelter must be a legally operating animal shelter or rescue organization in Cyprus.</li>
              <li>Wooffy reserves the right to verify the Shelter's legal status, mission, and activities.</li>
              <li>Wooffy may suspend or remove unverified or non-compliant Shelters.</li>
            </ul>

            <h2>3. Revenue Share</h2>
            <ul>
              <li>Wooffy allocates 10% of its gross revenue to participating Shelters.</li>
              <li>Revenue is distributed quarterly, at Wooffy's discretion.</li>
              <li>Distribution methodology (allocation among Shelters) is determined solely by Wooffy.</li>
              <li>Wooffy does not guarantee minimum or fixed donation amounts.</li>
            </ul>

            <h2>4. Direct Donations</h2>
            <ul>
              <li>Shelters may provide their own external donation links.</li>
              <li>All direct donations are made outside Wooffy's payment systems.</li>
              <li>Wooffy does not process, hold, or control direct donations.</li>
            </ul>

            <h2>5. Shelter Content &amp; Responsibilities</h2>
            <p>The Shelter agrees to provide accurate, up-to-date information about its organization, animals available for adoption, and contact details. The Shelter is solely responsible for the content it uploads to the Platform.</p>

            <h2>6. No Agency or Partnership</h2>
            <p>Nothing in this Agreement creates a partnership, joint venture, or agency relationship between Wooffy and the Shelter.</p>

            <h2>7. Disclaimer of Responsibility</h2>
            <ul>
              <li>Wooffy is not responsible for how Shelter funds are used.</li>
              <li>Wooffy does not guarantee adoption outcomes.</li>
              <li>Wooffy is not liable for disputes between Shelters and adopters.</li>
            </ul>

            <h2>8. Termination</h2>
            <p>The Shelter may stop participating at any time. Wooffy may suspend or terminate participation for legal non-compliance, misrepresentation, or reputational risk. Termination does not affect previously distributed funds.</p>

            <h2>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Wooffy shall not be liable for indirect or consequential damages arising from Shelter participation.</p>

            <h2>10. Governing Law</h2>
            <p>This Agreement is governed by the laws of the Republic of Cyprus. Any disputes shall be subject to the exclusive jurisdiction of Cypriot courts.</p>

            <h2>11. Acceptance</h2>
            <p>By registering on Wooffy.App, the Shelter confirms that it has authority to bind the organization and agrees to this Agreement.</p>

            <hr className="my-10" />
            <p className="text-sm text-muted-foreground">For questions or support, contact: <a href="mailto:hello@wooffy.app" className="text-primary">hello@wooffy.app</a></p>
          </article>
        </div>
      </div>
    </>
  );
};

export default Terms;

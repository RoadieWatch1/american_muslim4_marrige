import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <main className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-8">
          <p className="text-sm text-gray-500">
            <Link to="/" className="text-teal-700 hover:text-teal-800 font-medium">
              ← Back to Home
            </Link>
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: May 2026</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <p>
            These Terms of Service (“Terms”) govern your use of AM4M (“we”, “us”, “our”).
            By accessing or using the platform, you agree to these Terms.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 18 years old and legally able to enter into marriage in your
            jurisdiction to use AM4M.
          </p>

          <h2>2. Account Responsibilities</h2>
          <ul>
            <li>You are responsible for maintaining the confidentiality of your account.</li>
            <li>You agree to provide accurate information and keep it up to date.</li>
            <li>You may not impersonate others or misrepresent your identity.</li>
          </ul>

          <h2>3. Community Conduct</h2>
          <p>
            AM4M is a marriage-focused platform. You agree to communicate respectfully and comply
            with our community and Islamic guidelines. Harassment, hate, explicit content, scams,
            and abusive behavior are prohibited.
          </p>

          <h2>4. Safety & Moderation</h2>
          <p>
            We may review, remove, or restrict content/accounts that violate these Terms or our
            guidelines. We may suspend or terminate accounts at our discretion for safety reasons.
          </p>

          <h2>5. Content You Provide</h2>
          <p>
            You retain ownership of your content. By posting content, you grant us a limited license
            to host, display, and process it for operating the service.
          </p>
          <p>
            By uploading photos, videos, profile text, or other content to AM4M, you grant American
            Muslim 4 Marriage a non-exclusive, royalty-free, worldwide license to host, store,
            reproduce, display, transmit, publish, and distribute that content solely as needed to
            operate, provide, secure, and improve the platform's matchmaking services. This includes
            displaying your profile photo, profile name or kunya, and selected profile details to
            other users within AM4M, including on the homepage, profile discovery areas, match
            listings, and other on-platform features, according to your profile visibility and
            account settings.
          </p>
          <p>
            AM4M will not use your profile photo, profile name or kunya, likeness, testimonial,
            match story, or other identifying content for social media, advertising, paid
            promotions, featured-member posts, website promotions, success stories, or other
            marketing purposes outside the normal operation of the platform unless you provide
            explicit consent.
          </p>
          <p>
            If you provide explicit promotional consent, you grant AM4M a non-exclusive,
            royalty-free, worldwide license to use your approved profile photo, profile name or
            kunya, and other approved content in AM4M social media posts, website promotions,
            advertisements, featured-member posts, success stories, and other marketing materials.
            This optional promotional use may provide additional visibility for your profile and may
            help bring more attention to your profile while you are looking for a compatible spouse.
            AM4M may select opted-in users at random or at AM4M's discretion for promotional
            features. Promotional use is optional and may be revoked at any time for future use.
            Revocation does not affect uses made while consent was active or material already
            posted, shared, cached, screenshotted, reposted, distributed to third parties, or
            otherwise no longer reasonably within AM4M's control. AM4M does not guarantee that
            promotional profile visibility will result in more profile views, messages, matches,
            engagements, marriages, or any specific outcome.
          </p>

          <h2>6. Disclaimers</h2>
          <p>
            AM4M provides a platform to connect users and does not guarantee matches, outcomes,
            or compatibility. Use the platform at your own discretion.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, AM4M is not liable for indirect, incidental, or
            consequential damages arising from your use of the platform.
          </p>

          <h2>8. Termination</h2>
          <p>
            You may stop using AM4M at any time. We may suspend or terminate access if we believe
            you violated these Terms or if required for safety or legal compliance.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the platform after changes
            means you accept the updated Terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us via the Contact Us option in
            the footer.
          </p>
        </div>
      </div>
    </main>
  );
}

import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: Jan 2025</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <p>
            This Privacy Policy explains how AM4M (“we”, “us”, “our”) collects, uses, and protects
            your information when you use our platform.
          </p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li>Account information (name, email, profile details)</li>
            <li>Content you submit (photos, preferences, messages where applicable)</li>
            <li>Usage data (basic analytics, device/browser info)</li>
          </ul>

          <h2>2. How We Use Information</h2>
          <ul>
            <li>To provide and improve the service</li>
            <li>To maintain safety, prevent abuse, and enforce guidelines</li>
            <li>To communicate with you about important updates</li>
          </ul>

          <h2>3. Sharing of Information</h2>
          <p>
            We do not sell your personal information. We may share information with:
          </p>
          <ul>
            <li>Service providers (hosting, analytics, messaging) under confidentiality</li>
            <li>Legal authorities if required by law or to protect safety</li>
          </ul>

          <h2>4. Your Controls</h2>
          <ul>
            <li>You can update your profile information from your account settings.</li>
            <li>You can control visibility and interaction settings where available.</li>
            <li>You may request deletion of your account (subject to legal/safety retention needs).</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We take reasonable measures to protect your data. However, no system is 100% secure.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain data as needed to provide the service and meet legal, safety, and operational
            requirements. When no longer needed, we delete or anonymize data where feasible.
          </p>

          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Continued use after updates means you accept
            the revised policy.
          </p>

          <h2>8. Contact</h2>
          <p>
            For privacy questions, contact us via the Contact Us option in the footer.
          </p>
        </div>
      </div>
    </main>
  );
}

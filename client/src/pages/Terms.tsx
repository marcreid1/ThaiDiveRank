export default function Terms() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* PageHeader */}
      <div className="text-center my-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Terms of Service
        </h1>
      </div>
      
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-slate">
        <p className="text-slate-600 dark:text-slate-400">
          Effective Date: July 2, 2025
        </p>

        <p className="text-slate-700 dark:text-slate-300">
          Welcome to DiveRank. By accessing or using our services, you agree to be bound by these Terms of Service.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">1. Acceptance of Terms</h2>
        <p className="text-slate-700 dark:text-slate-300">
          By accessing or using DiveRank, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">2. Use of Service</h2>
        <p className="text-slate-700 dark:text-slate-300">
          DiveRank provides a platform for users to vote on and discover dive sites using an ELO rating system. While users can view dive site rankings and information without an account, voting on dive site matchups requires account creation and authentication.
        </p>
        
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Account Requirements:</h3>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Valid email address required for account creation</li>
          <li>Secure password meeting our security requirements</li>
          <li>Users must be 13 years or older to create an account</li>
          <li>One account per user - duplicate accounts are prohibited</li>
        </ul>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">ELO Rating System:</h3>
        <p className="text-slate-700 dark:text-slate-300">
          Our platform uses an ELO rating system adapted from chess rankings to fairly rank dive sites based on head-to-head voting comparisons. Each vote contributes to dynamic rating calculations that determine site rankings.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">3. User Conduct and Rate Limiting</h2>
        <p className="text-slate-700 dark:text-slate-300">
          Users agree to:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Vote honestly based on personal diving preferences and experiences</li>
          <li>Respect the rate limiting system (maximum 10 votes per minute)</li>
          <li>Not use automated systems, bots, or scripts to inflate votes</li>
          <li>Not attempt to manipulate the ELO rating system through coordinated voting</li>
          <li>Not create multiple accounts to bypass rate limits or voting restrictions</li>
          <li>Not engage in security attacks, unauthorized access attempts, or malicious activities</li>
          <li>Not use the site for any illegal or unauthorized purpose</li>
        </ul>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Consequences of Violations:</h3>
        <ul className="text-slate-700 dark:text-slate-300">
          <li><strong>Rate Limit Violations:</strong> Temporary voting restrictions (15-minute cooldown)</li>
          <li><strong>Automated Voting:</strong> Account suspension and vote invalidation</li>
          <li><strong>Security Violations:</strong> Immediate account termination and IP blocking</li>
          <li><strong>Repeat Offenses:</strong> Permanent account ban and legal action if necessary</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">4. Account Management and Data</h2>
        <p className="text-slate-700 dark:text-slate-300">
          Account holders are responsible for:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Maintaining the security of their login credentials</li>
          <li>All activities that occur under their account</li>
          <li>Promptly notifying us of any unauthorized access</li>
        </ul>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Account Termination:</h3>
        <p className="text-slate-700 dark:text-slate-300">
          Users may delete their accounts at any time. We reserve the right to suspend or terminate accounts for violations of these terms. Upon account deletion, personal information will be removed, but anonymized voting data may be retained for ranking integrity as described in our Privacy Policy.
        </p>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Data and Authentication:</h3>
        <p className="text-slate-700 dark:text-slate-300">
          We use JWT tokens for secure authentication with 7-day expiration. Your data handling is governed by our Privacy Policy. By creating an account, you agree to our data collection and processing practices as outlined in the Privacy Policy.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">5. Content Accuracy and Disclaimer</h2>
        <p className="text-slate-700 dark:text-slate-300">
          While we strive to provide accurate information about dive sites, we cannot guarantee the accuracy, completeness, or reliability of any content on the site. Dive site rankings are based on user votes using our ELO rating system and should be used as a reference only. Actual diving conditions, accessibility, and safety may vary significantly from the information presented.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">6. Intellectual Property</h2>
        <p className="text-slate-700 dark:text-slate-300">
          The DiveRank name, logos, and content are owned by DiveRank and protected by copyright and other intellectual property laws. Users may not copy, modify, or distribute our content without permission.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">7. System Availability and Technical Issues</h2>
        <p className="text-slate-700 dark:text-slate-300">
          We strive to maintain system availability but cannot guarantee uninterrupted service. The platform may experience:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Scheduled maintenance downtime</li>
          <li>Temporary server outages or connectivity issues</li>
          <li>Database maintenance affecting voting or rankings</li>
          <li>Security-related temporary restrictions</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">8. Limitation of Liability</h2>
        <p className="text-slate-700 dark:text-slate-300">
          DiveRank shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services. This includes but is not limited to diving accidents, travel decisions based on rankings, or technical issues affecting your account or voting ability.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">9. Image Disclaimer</h2>
        <p className="text-slate-700 dark:text-slate-300">
          The images displayed on this website are artistic representations intended to capture the spirit and beauty of our dive experiences. They may not accurately reflect the exact appearance of the dive sites or conditions at any given time. Variations in marine life, water visibility, and environmental conditions are natural and expected.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">10. Disputes and Contact</h2>
        <p className="text-slate-700 dark:text-slate-300">
          For any disputes, questions about these terms, or reports of violations, please contact us through the Contact page on this website. We will respond to inquiries within a reasonable timeframe and work to resolve issues fairly.
        </p>
        
        <p className="text-slate-700 dark:text-slate-300">
          Any legal disputes will be governed by applicable laws and resolved through appropriate legal channels.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">11. Changes to Terms</h2>
        <p className="text-slate-700 dark:text-slate-300">
          We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of DiveRank constitutes acceptance of the updated terms. We recommend reviewing these terms periodically for any updates.
        </p>


      </div>
    </main>
  );
}
export default function Privacy() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* PageHeader */}
      <div className="text-center my-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Privacy Policy
        </h1>
      </div>
      
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-slate">
        <p className="text-slate-600 dark:text-slate-400">
          Effective Date: July 2, 2025
        </p>

        <p className="text-slate-700 dark:text-slate-300">
          Welcome to DiveRank! Your privacy is important to us. This Privacy Policy outlines how we collect, use, and protect your information when you use our platform to vote on and discover the best dive sites around the world.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">1. Information We Collect</h2>

        <p className="text-slate-700 dark:text-slate-300">
          We collect four categories of information:
        </p>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">a) Personal Information (when you create an account):</h3>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Email address (required for account creation)</li>
          <li>Encrypted password (stored securely using bcrypt hashing)</li>
        </ul>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">b) Voting and Activity Data:</h3>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Voting activity (dive site matchups you vote on, winners and losers)</li>
          <li>ELO rating changes from your votes</li>
          <li>Vote timestamps and frequency</li>
        </ul>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">c) Technical and Security Information:</h3>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>IP address (for security monitoring and rate limiting)</li>
          <li>Browser type and version (User-Agent header)</li>
          <li>Device type and operating system</li>
          <li>HTTP request details (URLs visited, response times, status codes)</li>
          <li>Authentication tokens (JWT tokens stored locally on your device)</li>
        </ul>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">d) Security and Monitoring Logs:</h3>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Failed login attempts with timestamps</li>
          <li>Rate limiting violations</li>
          <li>Suspicious activity patterns (attempted security breaches, malicious requests)</li>
          <li>Unauthorized access attempts to protected areas</li>
          <li>Error logs and system performance data</li>
        </ul>

        <p className="text-slate-700 dark:text-slate-300">
          This information helps us improve our site's performance, usability, and accuracy of dive site rankings.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">2. How We Use Your Information</h2>

        <p className="text-slate-700 dark:text-slate-300">
          We use collected data to:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Process and display dive site voting results using ELO rating calculations</li>
          <li>Authenticate users and maintain secure login sessions</li>
          <li>Prevent spam, fraudulent voting, and abuse through rate limiting (max 10 votes per minute)</li>
          <li>Monitor security threats and unauthorized access attempts</li>
          <li>Analyze system performance and troubleshoot technical issues</li>
          <li>Generate dive site rankings and activity feeds</li>
          <li>Ensure fair voting by tracking user voting patterns</li>
        </ul>

        <p className="text-slate-700 dark:text-slate-300">
          We do not sell your personal data to third parties. All data processing is done internally to operate the dive site ranking platform.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">3. Data Storage and Authentication</h2>

        <p className="text-slate-700 dark:text-slate-300">
          Our site uses local browser storage to:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li>Store JWT authentication tokens locally in your browser (localStorage)</li>
          <li>Maintain your login session without requiring frequent re-authentication</li>
          <li>Remember your voting preferences and session state</li>
        </ul>

        <p className="text-slate-700 dark:text-slate-300">
          We do not use traditional cookies for authentication. Instead, we use JWT tokens stored in your browser's localStorage, which you can clear through your browser settings. Logging out will also remove these tokens.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">4. Third-Party Services</h2>

        <p className="text-slate-700 dark:text-slate-300">
          We use the following third-party services:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li><strong>Neon Database:</strong> For secure PostgreSQL database hosting of user accounts, dive sites, and voting data</li>
          <li><strong>Replit:</strong> For application hosting and deployment</li>
        </ul>

        <p className="text-slate-700 dark:text-slate-300">
          We do not currently use third-party analytics services like Google Analytics. All data collection and analysis is performed directly by our application. These hosting providers may collect standard server logs as part of their service operations, subject to their own privacy policies.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">5. Data Retention</h2>

        <p className="text-slate-700 dark:text-slate-300">
          We retain different types of data for varying periods:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li><strong>Account Data:</strong> Email and password information retained as long as your account exists</li>
          <li><strong>Voting Data:</strong> Vote records and ELO ratings retained indefinitely for ranking calculations</li>
          <li><strong>Security Logs:</strong> Failed login attempts, rate limiting violations, and suspicious activity logs retained for 14 days</li>
          <li><strong>Application Logs:</strong> HTTP request logs, error logs, and system performance data retained for 30 days</li>
          <li><strong>Session Data:</strong> JWT tokens expire after 7 days and are stored locally on your device</li>
        </ul>

        <p className="text-slate-700 dark:text-slate-300">
          You have two options for account management:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li><strong>Account Deactivation:</strong> Temporarily disables your account while preserving all voting history. You can reactivate by signing in again.</li>
          <li><strong>Account Deletion:</strong> Permanently removes your account and all voting history from our system.</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">6. Your Rights</h2>

        <p className="text-slate-700 dark:text-slate-300">
          You have the following rights regarding your personal data:
        </p>
        <ul className="text-slate-700 dark:text-slate-300">
          <li><strong>Account Deactivation:</strong> Temporarily disable your account through the Dashboard's Account Management section</li>
          <li><strong>Account Deletion:</strong> Permanently delete your account and all data through the Dashboard's Account Management section</li>
          <li><strong>Data Access:</strong> Request a copy of your personal data</li>
          <li><strong>Data Correction:</strong> Request correction of inaccurate personal information</li>
          <li><strong>Consent Withdrawal:</strong> Withdraw consent (if previously given)</li>
        </ul>

        <p className="text-slate-700 dark:text-slate-300">
          For data access, correction requests, or other privacy-related inquiries, please contact us through the Contact page on this website.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">7. Children's Privacy</h2>

        <p className="text-slate-700 dark:text-slate-300">
          Our website is not intended for use by individuals under the age of 13. We do not knowingly collect personal data from children.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">8. Changes to This Policy</h2>

        <p className="text-slate-700 dark:text-slate-300">
          We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated effective date.
        </p>


      </div>
    </main>
  );
}
import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* PageHeader */}
      <div className="text-center my-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Contact Us
        </h1>
      </div>
      
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-slate">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-ocean-100 dark:bg-ocean-900 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-ocean-600 dark:text-ocean-400" />
          </div>
          
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
            We welcome feedback, new feature suggestions, and message us here for any issues you may be encountering.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 text-center mb-8">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Email us at:</p>
          <a 
            href="mailto:contactdiverank@gmail.com"
            className="text-2xl font-semibold text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300 transition-colors"
          >
            contactdiverank@gmail.com
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Feedback & Suggestions</h3>
            <p className="text-slate-600 dark:text-slate-400">Share your ideas for improving DiveRank</p>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Technical Support</h3>
            <p className="text-slate-600 dark:text-slate-400">Report bugs or technical issues</p>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Feature Requests</h3>
            <p className="text-slate-600 dark:text-slate-400">Request new features for the platform</p>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">General Questions</h3>
            <p className="text-slate-600 dark:text-slate-400">Ask questions about using DiveRank</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We typically respond within 24-48 hours
          </p>
        </div>
      </div>
    </main>
  );
}
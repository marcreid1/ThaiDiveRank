export default function Contact() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* PageHeader */}
      <div className="text-center my-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 sm:mt-4">
          Have questions or feedback? We'd love to hear from you.
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        {/* Email Contact Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700 mb-8">
          <div className="p-8 flex flex-col md:flex-row items-center justify-center md:justify-start gap-6">
            <div className="w-16 h-16 rounded-full bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Email Us</h3>
              <p className="text-slate-700 dark:text-slate-300 text-lg">contact@diverank.com</p>
              <p className="text-slate-500 dark:text-slate-400 mt-1">We aim to respond within 24 hours</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Send Us a Message</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-ocean-500 focus:ring-ocean-500 dark:bg-slate-700 dark:text-slate-200 text-base"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-ocean-500 focus:ring-ocean-500 dark:bg-slate-700 dark:text-slate-200 text-base"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  id="subject"
                  className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-ocean-500 focus:ring-ocean-500 dark:bg-slate-700 dark:text-slate-200 text-base"
                  placeholder="What is your message about?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                <textarea
                  id="message"
                  rows={6}
                  className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-ocean-500 focus:ring-ocean-500 dark:bg-slate-700 dark:text-slate-200 text-base"
                  placeholder="Tell us how we can help you"
                ></textarea>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full md:w-auto inline-flex justify-center rounded-md border border-transparent bg-ocean-600 py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 dark:bg-ocean-700 dark:hover:bg-ocean-800 transition"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Contact Info */}
        <div className="mt-10 text-center text-slate-500 dark:text-slate-400">
          <p>You can also find us on social media or visit our office in Thailand.</p>
        </div>
      </div>
    </main>
  );
}
export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="prose dark:prose-invert prose-slate max-w-none">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Contact Us
        </h1>
        
        <p className="text-slate-700 dark:text-slate-300 mt-6">
          Have questions, feedback, or want to suggest a dive site? We'd love to hear from you! 
          You can reach the DiveRank team through any of the following channels:
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Email</h3>
              <p className="text-slate-700 dark:text-slate-300">contact@diverank.com</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">We aim to respond within 24 hours</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Phone</h3>
              <p className="text-slate-700 dark:text-slate-300">+66 76 123 4567</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Mon-Fri: 9am - 5pm (ICT)</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Address</h3>
              <p className="text-slate-700 dark:text-slate-300">123 Diving Street</p>
              <p className="text-slate-700 dark:text-slate-300">Phuket, Thailand 83000</p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Send Us a Message</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
          
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-ocean-500 focus:ring-ocean-500 dark:bg-slate-800 dark:text-slate-200 sm:text-sm"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-ocean-500 focus:ring-ocean-500 dark:bg-slate-800 dark:text-slate-200 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
              <textarea
                id="message"
                rows={4}
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-ocean-500 focus:ring-ocean-500 dark:bg-slate-800 dark:text-slate-200 sm:text-sm"
                placeholder="How can we help you?"
              ></textarea>
            </div>
            
            <div>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-ocean-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 dark:bg-ocean-700 dark:hover:bg-ocean-600"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
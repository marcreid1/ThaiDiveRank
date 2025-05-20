export default function About() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl mb-4">About DiveRank</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
          Discover how we use mathematical ratings to help divers find the best underwater locations
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md overflow-hidden p-8 mb-8 max-w-3xl mx-auto">
        <div className="prose prose-ocean dark:prose-invert lg:prose-lg">

          <h2 className="text-slate-900 dark:text-slate-100">How We Rank Dive Sites</h2>
          <p className="text-slate-700 dark:text-slate-300">
            DiveRank uses the <a href="https://en.wikipedia.org/wiki/Elo_rating_system" target="_blank" rel="noopener noreferrer">
              ELO rating system
            </a> (originally developed for chess rankings) to create a fair and dynamic ranking of the best dive sites.
          </p>

          <h3 className="text-slate-900 dark:text-slate-100">How The ELO Rating System Works</h3>
          <p className="text-slate-700 dark:text-slate-300">
            The ELO rating system ranks players (or in our case, dive sites) based on their relative performance against each other:
          </p>
          <ul className="text-slate-700 dark:text-slate-300">
            <li>Every dive site starts with an initial rating (typically 1500 points)</li>
            <li>When two dive sites are compared, the system calculates an expected outcome based on their current ratings</li>
            <li>When you vote for one site over another, the winner gains points and the loser loses points</li>
            <li>The number of points exchanged depends on the expected outcome - beating a higher-rated site earns more points</li>
            <li>Over time, as more votes are collected, the ratings become more accurate</li>
          </ul>

          <h3 className="text-slate-900 dark:text-slate-100">Why This Works For Dive Sites</h3>
          <p className="text-slate-700 dark:text-slate-300">
            This system is perfect for ranking dive sites because:
          </p>
          <ul className="text-slate-700 dark:text-slate-300">
            <li>It handles incomplete data well - not every diver visits every site</li>
            <li>It accounts for the quality of competition - winning against top-rated sites carries more weight</li>
            <li>The rankings dynamically adjust as new votes come in</li>
            <li>It provides a statistically sound approach to subjective preferences</li>
          </ul>

          <h2 className="text-slate-900 dark:text-slate-100">About This Project</h2>
          <p className="text-slate-700 dark:text-slate-300">
            DiveRank was created to help divers discover the best diving experiences.
            By leveraging the collective wisdom of the diving community, we aim to create the most accurate 
            and helpful ranking of dive sites.
          </p>

          <p className="text-slate-700 dark:text-slate-300">
            Our data comes from thousands of diver votes and is continuously updated as new votes are cast.
            We do not accept payment for rankings, and our system is designed to be resistant to manipulation.
          </p>

          <div className="mt-12 text-center w-full">
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700 dark:bg-ocean-700 dark:hover:bg-ocean-600 md:py-4 md:text-lg md:px-8"
            >
              Back to Voting
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
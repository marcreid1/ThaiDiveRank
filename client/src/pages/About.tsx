export default function About() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
      <div className="prose prose-ocean lg:prose-lg mx-auto">
        <h1 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl mb-12">About DiveRank</h1>
        
        <h2>How We Rank Dive Sites</h2>
        <p>
          DiveRank uses the <a href="https://en.wikipedia.org/wiki/Elo_rating_system" target="_blank" rel="noopener noreferrer">
            ELO rating system
          </a> (originally developed for chess rankings) to create a fair and dynamic ranking of the best dive sites.
        </p>
        
        <h3>How The ELO Rating System Works</h3>
        <p>
          The ELO rating system ranks players (or in our case, dive sites) based on their relative performance against each other:
        </p>
        <ul>
          <li>Every dive site starts with an initial rating (typically 1500 points)</li>
          <li>When two dive sites are compared, the system calculates an expected outcome based on their current ratings</li>
          <li>When you vote for one site over another, the winner gains points and the loser loses points</li>
          <li>The number of points exchanged depends on the expected outcome - beating a higher-rated site earns more points</li>
          <li>Over time, as more votes are collected, the ratings become more accurate</li>
        </ul>
        
        <h3>Why This Works FOR Dive Sites</h3>
        <p>
          This system is perfect for ranking dive sites because:
        </p>
        <ul>
          <li>It handles incomplete data well - not every diver visits every site</li>
          <li>It accounts for the quality of competition - winning against top-rated sites carries more weight</li>
          <li>The rankings dynamically adjust as new votes come in</li>
          <li>It provides a statistically sound approach to subjective preferences</li>
        </ul>
        

        
        <h2>About This Project</h2>
        <p>
          DiveRank was created to help divers discover the best diving experiences in the Similan Islands & Surin Islands.
          By leveraging the collective wisdom of the diving community, we aim to create the most accurate 
          and helpful ranking of dive sites.
        </p>
        
        <p>
          Our data comes from thousands of diver votes and is continuously updated as new votes are cast.
          We do not accept payment for rankings, and our system is designed to be resistant to manipulation.
        </p>
        
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-ocean-600 hover:bg-ocean-700 md:py-4 md:text-lg md:px-8"
          >
            Back to Voting
          </a>
        </div>
      </div>
    </main>
  );
}

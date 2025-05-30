import VotingSection from "@/components/VotingSection";
import RankingsTable from "@/components/RankingsTable";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* PageHeader */}
      <div className="text-center my-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Rank Your Favorite Dive Sites
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 sm:mt-4">
          Vote for your favorite dive sites and help create the ultimate dive guide
        </p>
      </div>
      
      {/* Voting Section */}
      <VotingSection />
      
      {/* Rankings Table */}
      <RankingsTable />
    </main>
  );
}

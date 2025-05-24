import logoImage from "@assets/DiveRank Logo.png";

export const Logo = () => (
  <div className="flex items-center">
    <img 
      src={logoImage} 
      alt="DiveRank Logo" 
      className="w-10 h-10 mr-3"
    />
    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
      DiveRank
    </span>
  </div>
);

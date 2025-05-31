// Re-export shared types for easy access in client code
export type { 
  DiveSite, 
  Vote, 
  User, 
  DiveSiteRanking, 
  VoteActivity 
} from "@shared/schema";

// Client-specific types
export interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
  onSuccess?: () => void;
}

export interface DiveSiteCardProps {
  diveSite: DiveSite;
  rank?: number;
  onVote: () => void;
  showViewButton?: boolean;
}

export interface MatchupData {
  diveSiteA: DiveSite;
  diveSiteB: DiveSite;
}

export interface ChampionState {
  diveSite: DiveSite;
  side: 'A' | 'B';
}

// Import DiveSite for use in other type definitions
import type { DiveSite } from "@shared/schema";
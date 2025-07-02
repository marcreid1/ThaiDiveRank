export const SECURITY_QUESTIONS = [
  "What's your favorite dive site from the rankings?",
  "What's the name of your first pet?",
  "In what city were you born?",
  "What's your mother's maiden name?",
  "What was your first car's make and model?",
  "What's the name of your elementary school?",
  "What's your favorite diving certification agency?",
  "What's the name of the street you grew up on?",
] as const;

export type SecurityQuestion = typeof SECURITY_QUESTIONS[number];
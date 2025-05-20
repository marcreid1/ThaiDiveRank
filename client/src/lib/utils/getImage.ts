import { diveSiteImages, defaultDiveSiteImage } from "@/assets/index";

/**
 * Helper function to get the correct image for a dive site
 * @param name - The name of the dive site
 * @returns The path to the appropriate image for the dive site
 */
export const getDiveSiteImage = (name: string): string => {
  // Direct match
  if (name in diveSiteImages) {
    return diveSiteImages[name as keyof typeof diveSiteImages];
  }

  // Check for specific matching cases
  const imageMap: Record<string, string[]> = {
    "North Point": ["Rocky Point"],
    "Beacon Reef": ["Beacon Beach"],
    "Koh Bon Ridge": ["West Ridge", "Manta Road"],
    "Koh Tachai Pinnacle": ["Plateau"],
    "Ao Tao": ["Turtle Bay"]
  };

  for (const [imageName, alternativeNames] of Object.entries(imageMap)) {
    if (alternativeNames.some(alt => name.includes(alt)) || name.includes(imageName)) {
      return diveSiteImages[imageName as keyof typeof diveSiteImages];
    }
  }

  // Fallback to default image
  return defaultDiveSiteImage;
};
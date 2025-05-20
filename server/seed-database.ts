import { db } from "./db";
import { diveSites, InsertDiveSite } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedDatabase() {
  console.log("Starting database seeding...");

  // CSV data converted to dive site objects
  const initialDiveSites: (InsertDiveSite & { depthMin: number, depthMax: number, difficulty: string })[] = [
    // Site 1
    {
      name: "Coral Gardens",
      location: "Ko Huyong, Island #1, South, Similan Islands",
      types: ["Coral Garden"],
      description: "Shallow reef area featuring vibrant hard corals",
      imageUrl: "/src/assets/images/dive-sites/1. Coral Gardens.png",
      depthMin: 0,
      depthMax: 10,
      difficulty: "Beginner"
    },
    // Site 2
    {
      name: "Shark Fin Reef",
      location: "Ko Payan, Island #3, South, Similan Islands",
      types: ["Reef"],
      description: "Distinctive rock formation resembling a shark fin",
      imageUrl: "/src/assets/images/dive-sites/2. Shark Fin Reef.png",
      depthMin: 5,
      depthMax: 35,
      difficulty: "Intermediate"
    },
    // Site 3
    {
      name: "Boulder City",
      location: "Ko Payan, Island #3, South, Similan Islands",
      types: ["Boulder"],
      description: "Massive underwater boulders",
      imageUrl: "/src/assets/images/dive-sites/3. Boulder City.png",
      depthMin: 15,
      depthMax: 40,
      difficulty: "Advanced"
    },
    // Site 4
    {
      name: "Princess Bay",
      location: "Ko Huyong, Island #1, South, Similan Islands",
      types: ["Bay"],
      description: "Sheltered bay with gentle currents",
      imageUrl: "/src/assets/images/dive-sites/4. Princess Bay.png",
      depthMin: 5,
      depthMax: 20,
      difficulty: "Beginner"
    },
    // Site 5
    {
      name: "Honeymoon Bay",
      location: "Ko Payu, Island #7, Central, Similan Islands",
      types: ["Bay"],
      description: "Romantic dive spot with heart-shaped coral formations",
      imageUrl: "/src/assets/images/dive-sites/5. Honeymoon Bay.png",
      depthMin: 5,
      depthMax: 20,
      difficulty: "Beginner"
    },
    // Site 6
    {
      name: "Bird Rock",
      location: "Ko Bangru, Island #9, North, Similan Islands",
      types: ["Rock"],
      description: "Rock formations that attract seabirds",
      imageUrl: "/src/assets/images/dive-sites/6. Bird Rock.png",
      depthMin: 10,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    // Site 7
    {
      name: "Stonehenge",
      location: "Ko Hok, Island #8, North, Similan Islands",
      types: ["Rock"],
      description: "Arrangement of large stone formations resembling the famous monument",
      imageUrl: "/src/assets/images/dive-sites/7. Stonehenge.png",
      depthMin: 10,
      depthMax: 35,
      difficulty: "Intermediate"
    },
    // Site 8
    {
      name: "Hideaway Bay (Barracuda Point)",
      location: "Ko Miang, Island #4, Central, Similan Islands",
      types: ["Bay"],
      description: "Secluded bay known for barracuda sightings",
      imageUrl: "/src/assets/images/dive-sites/8. Hideaway Bay.png",
      depthMin: 5,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    // Site 9
    {
      name: "Anita's Reef",
      location: "Ko Miang, Island #4, Central, Similan Islands",
      types: ["Reef"],
      description: "Beautiful reef named after a famous dive instructor",
      imageUrl: "/src/assets/images/dive-sites/9. Anita's Reef.png",
      depthMin: 5,
      depthMax: 25,
      difficulty: "Beginner"
    },
    // Site 10
    {
      name: "Deep Six",
      location: "Ko Bon, Island #10, North, Similan Islands",
      types: ["Deep"],
      description: "Deep site reaching depths up to 40 meters",
      imageUrl: "/src/assets/images/dive-sites/10. Deep Six.png",
      depthMin: 25,
      depthMax: 40,
      difficulty: "Advanced"
    },
    // Site 11
    {
      name: "East of Eden",
      location: "Ko Payu, Island #7, Central, Similan Islands",
      types: ["Reef"],
      description: "Eastern dive site with pristine coral gardens",
      imageUrl: "/src/assets/images/dive-sites/11. East of Eden.png",
      depthMin: 5,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    // Site 12
    {
      name: "West of Eden",
      location: "Ko Payu, Island #7, Central, Similan Islands",
      types: ["Reef"],
      description: "Western counterpart to East of Eden",
      imageUrl: "/src/assets/images/dive-sites/12. West of Eden.png",
      depthMin: 5,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    // Site 13
    {
      name: "Turtle Rock",
      location: "Ko Similan, Island #8, North, Similan Islands",
      types: ["Rock"],
      description: "Rock formation resembling a turtle, popular for turtle spotting",
      imageUrl: "/src/assets/images/dive-sites/13. Turtle Rock.png",
      depthMin: 5,
      depthMax: 18,
      difficulty: "Beginner"
    },
    // Site 14
    {
      name: "Waterfall Bay",
      location: "Ko Miang, Island #4, Central, Similan Islands",
      types: ["Bay"],
      description: "Named after the cascade-like rock formations",
      imageUrl: "/src/assets/images/dive-sites/14. Waterfall Bay.png",
      depthMin: 5,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    // Site 15
    {
      name: "Elephant Head Rock",
      location: "Ko Ha Yai, Island #5, Central, Similan Islands",
      types: ["Rock"],
      description: "Rock formation resembling an elephant's head",
      imageUrl: "/src/assets/images/dive-sites/15. Elephant Head Rock.png",
      depthMin: 15,
      depthMax: 40,
      difficulty: "Advanced"
    },
    // Site 16
    {
      name: "Beacon Point",
      location: "Ko Ba-ngu, Island #9, North, Similan Islands",
      types: ["Point"],
      description: "Named after the navigational beacon nearby",
      imageUrl: "/src/assets/images/dive-sites/16. Beacon Point.png",
      depthMin: 10,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    // Site 17
    {
      name: "Fantasy Reef",
      location: "Ko Tachai, North, Similan Islands",
      types: ["Reef"],
      description: "Dreamlike underwater landscape with diverse marine life",
      imageUrl: "/src/assets/images/dive-sites/17. Fantasy Reef.png",
      depthMin: 5,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    // Site 18
    {
      name: "Beacon Reef (Beacon Beach)",
      location: "Ko Ba-ngu, Island #9, North, Similan Islands",
      types: ["Reef"],
      description: "Reef near Beacon Point with colorful coral formations",
      imageUrl: "/src/assets/images/dive-sites/18. Beacon Reef.png",
      depthMin: 5,
      depthMax: 18,
      difficulty: "Beginner"
    },
    // Site 19
    {
      name: "Donald Duck Bay",
      location: "Ko Miang, Island #4, Central, Similan Islands",
      types: ["Bay"],
      description: "Bay with rock formation resembling the famous cartoon character",
      imageUrl: "/src/assets/images/dive-sites/19. Donald Duck Bay.png",
      depthMin: 5,
      depthMax: 20,
      difficulty: "Beginner"
    },
    // Site 20
    {
      name: "Snapper Alley",
      location: "Ko Payu, Island #7, Central, Similan Islands",
      types: ["Pass"],
      description: "Narrow channel known for large schools of snapper fish",
      imageUrl: "/src/assets/images/dive-sites/20. Snapper Alley.png",
      depthMin: 10,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    // Site 21
    {
      name: "Three Trees",
      location: "Ko Payu, Island #7, Central, Similan Islands",
      types: ["Reef"],
      description: "Named for three distinctive coral formations",
      imageUrl: "/src/assets/images/dive-sites/21. Three Trees.png",
      depthMin: 5,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    // Site 22
    {
      name: "North Point (Rocky Point)",
      location: "Ko Bon, Island #10, North, Similan Islands",
      types: ["Point"],
      description: "The northernmost dive site in the Similans",
      imageUrl: "/src/assets/images/dive-sites/22. North Point.png",
      depthMin: 10,
      depthMax: 35,
      difficulty: "Advanced"
    },
    // Site 23
    {
      name: "Breakfast Bend",
      location: "Ko Payu, Island #7, Central, Similan Islands",
      types: ["Reef"],
      description: "Morning dive site with gentle current",
      imageUrl: "/src/assets/images/dive-sites/23. Breakfast Bend.png",
      depthMin: 5,
      depthMax: 20,
      difficulty: "Beginner"
    },
    // Site 24
    {
      name: "Christmas Point",
      location: "Ko Ba-ngu, Island #9, North, Similan Islands",
      types: ["Point"],
      description: "Festive-looking coral formations discovered during the holiday season",
      imageUrl: "/src/assets/images/dive-sites/24. Christmas Point.png",
      depthMin: 15,
      depthMax: 35,
      difficulty: "Advanced"
    },
    // Site 25
    {
      name: "Batfish Bend",
      location: "Ko Similan, Island #8, North, Similan Islands",
      types: ["Bend"],
      description: "Current-swept bend with large schools of batfish",
      imageUrl: "/src/assets/images/dive-sites/25. Batfish Bend.png",
      depthMin: 8,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    // Site 26
    {
      name: "Koh Bon Pinnacle",
      location: "Koh Bon, North, Surin Islands",
      types: ["Pinnacle"],
      description: "Underwater pinnacle attracting pelagic species",
      imageUrl: "/src/assets/images/dive-sites/26. Koh Bon Pinnacle.png",
      depthMin: 18,
      depthMax: 40,
      difficulty: "Advanced"
    },
    // Site 27
    {
      name: "Koh Bon Ridge/West Ridge (Manta Road)",
      location: "Koh Bon, North, Surin Islands",
      types: ["Ridge"],
      description: "Ridge formation famous for manta ray sightings",
      imageUrl: "/src/assets/images/dive-sites/27. Koh Bon Ridge.png",
      depthMin: 5,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    // Site 28
    {
      name: "Koh Bon Bay",
      location: "Koh Bon, North, Surin Islands",
      types: ["Bay"],
      description: "Sheltered bay for easy diving conditions",
      imageUrl: "/src/assets/images/dive-sites/28. Koh Bon Bay.png",
      depthMin: 5,
      depthMax: 20,
      difficulty: "Beginner"
    },
    // Site 29
    {
      name: "Koh Tachai Pinnacle/Plateau",
      location: "Koh Tachai, North, Surin Islands",
      types: ["Pinnacle"],
      description: "Submerged pinnacle known for strong currents and big fish",
      imageUrl: "/src/assets/images/dive-sites/29. Koh Tachai Pinnacle.png",
      depthMin: 15,
      depthMax: 40,
      difficulty: "Advanced"
    },
    // Site 30
    {
      name: "Koh Tachai Reef",
      location: "Koh Tachai, North, Surin Islands",
      types: ["Reef"],
      description: "Reef system surrounding Koh Tachai",
      imageUrl: "/src/assets/images/dive-sites/30. Koh Tachai Reef.png",
      depthMin: 5,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    // Site 31-43 (from the newer attached images)
    {
      name: "Ao Mai Ngam",
      location: "Koh Surin Nuea, North, Surin Islands",
      types: ["Bay"],
      description: "Protected bay with gentle slopes and sea grass beds",
      imageUrl: "/src/assets/images/dive-sites/31. Ao Mai Ngam.png",
      depthMin: 3,
      depthMax: 15,
      difficulty: "Beginner"
    },
    {
      name: "Ao Chong Kad",
      location: "Koh Surin Tai, South, Surin Islands",
      types: ["Bay"],
      description: "Sheltered bay with fringing reef and gentle currents",
      imageUrl: "/src/assets/images/dive-sites/32. Ao Chong Kad.png",
      depthMin: 5,
      depthMax: 18,
      difficulty: "Beginner"
    },
    {
      name: "Ao Mae Yai",
      location: "Koh Surin Nuea, North, Surin Islands",
      types: ["Bay"],
      description: "Large bay with diverse coral formations and reef fish",
      imageUrl: "/src/assets/images/dive-sites/33. Ao Mae Yai.png",
      depthMin: 5,
      depthMax: 20,
      difficulty: "Beginner"
    },
    {
      name: "Ao Jaak",
      location: "Koh Surin Tai, South, Surin Islands",
      types: ["Bay"],
      description: "Small bay with healthy coral gardens and macro life",
      imageUrl: "/src/assets/images/dive-sites/34. Ao Jaak.png",
      depthMin: 5,
      depthMax: 22,
      difficulty: "Intermediate"
    },
    {
      name: "Ao Sai Daeng",
      location: "Koh Surin Tai, South, Surin Islands",
      types: ["Bay"],
      description: "Bay with reddish sand beaches and colorful reef systems",
      imageUrl: "/src/assets/images/dive-sites/35. Ao Sai Daeng.png",
      depthMin: 6,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    {
      name: "Ao Sai Ean",
      location: "Koh Surin Nuea, North, Surin Islands",
      types: ["Bay"],
      description: "Secluded bay with diverse marine ecosystems",
      imageUrl: "/src/assets/images/dive-sites/36. Ao Sai Ean.png",
      depthMin: 5,
      depthMax: 22,
      difficulty: "Intermediate"
    },
    {
      name: "Ao Pakkad",
      location: "Koh Surin Nuea, North, Surin Islands",
      types: ["Bay"],
      description: "Deep bay with vibrant reef slopes",
      imageUrl: "/src/assets/images/dive-sites/37. Ao Pakkad.png",
      depthMin: 8,
      depthMax: 28,
      difficulty: "Intermediate"
    },
    {
      name: "Ao Tao (Turtle Bay)",
      location: "Koh Surin Tai, South, Surin Islands",
      types: ["Bay"],
      description: "Bay known for frequent turtle sightings and nesting beaches",
      imageUrl: "/src/assets/images/dive-sites/38. Ao Tao.png",
      depthMin: 5,
      depthMax: 18,
      difficulty: "Beginner"
    },
    {
      name: "Ao Suthep",
      location: "Koh Surin Nuea, North, Surin Islands",
      types: ["Bay"],
      description: "North-facing bay with coral-covered dropoffs",
      imageUrl: "/src/assets/images/dive-sites/39. Ao Suthep.png",
      depthMin: 8,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    {
      name: "Torinla Pinnacle",
      location: "Between Surin Islands, North, Surin Islands",
      types: ["Pinnacle"],
      description: "Submerged seamount with strong currents and pelagic encounters",
      imageUrl: "/src/assets/images/dive-sites/40. Torinla Pinnacle.png",
      depthMin: 18,
      depthMax: 40,
      difficulty: "Advanced"
    },
    {
      name: "Koh Klang",
      location: "Near Surin Islands, South, Surin Islands",
      types: ["Island"],
      description: "Small island with surrounding coral reefs and wall drops",
      imageUrl: "/src/assets/images/dive-sites/41. Koh Klang.png",
      depthMin: 8,
      depthMax: 30,
      difficulty: "Intermediate"
    },
    {
      name: "Koh Chi",
      location: "Near Surin Islands, South, Surin Islands",
      types: ["Island"],
      description: "Remote island with pristine reef conditions",
      imageUrl: "/src/assets/images/dive-sites/42. Koh Chi.png",
      depthMin: 5,
      depthMax: 25,
      difficulty: "Intermediate"
    },
    {
      name: "Richelieu Rock",
      location: "Extended Park Area, Extended Park",
      types: ["Pinnacle"],
      description: "World-famous pinnacle known for whale shark sightings and vibrant marine life",
      imageUrl: "/src/assets/images/dive-sites/43. Richelieu Rock.png",
      depthMin: 12,
      depthMax: 35,
      difficulty: "Advanced"
    }
  ];

  // Check if diveSites table is empty
  const existingSites = await db.select({ count: sql`count(*)` }).from(diveSites);
  const count = Number(existingSites[0].count);

  if (count === 0) {
    console.log("No dive sites found, seeding database...");
    
    // Insert all the dive sites
    for (const site of initialDiveSites) {
      await db.insert(diveSites).values({
        name: site.name,
        location: site.location,
        types: site.types,
        description: site.description,
        imageUrl: site.imageUrl,
        rating: 1500, // Default ELO rating
        wins: 0,
        losses: 0,
        depthMin: site.depthMin,
        depthMax: site.depthMax,
        difficulty: site.difficulty
      });
    }
    
    console.log(`Successfully seeded ${initialDiveSites.length} dive sites!`);
  } else {
    console.log(`Database already contains ${count} dive sites. Skipping seeding.`);
  }
}

// Run the seeding function
seedDatabase()
  .then(() => {
    console.log("Database seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });
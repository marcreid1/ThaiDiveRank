import { DiveSite } from "@shared/schema";

export interface RegionDiveSites {
  region: string;
  description: string;
  diveSites: DiveSite[];
}
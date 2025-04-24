import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Countries you actually offer in the <Select> */
export const COUNTRY_KEYS = [
  "argentina",
  "australia",
  "austria",
  "belgium",
  "brazil",
  "bulgaria",
  "canada",
  "china",
  "croatia",
  "cyprus",
  "czech_republic",
  "denmark",
  "estonia",
  "finland",
  "france",
  "germany",
  "greece",
  "hong_kong",
  "hungary",
  "iceland",
  "india",
  "indonesia",
  "ireland",
  "italy",
  "japan",
  "korea",
  "latvia",
  "lithuania",
  "luxembourg",
  "malta",
  "mexico",
  "netherlands",
  "new_zealand",
  "norway",
  "poland",
  "portugal",
  "romania",
  "russian_federation",
  "saudi_arabia",
  "serbia",
  "slovakia",
  "slovenia",
  "south_africa",
  "spain",
  "sweden",
  "switzerland",
  "thailand",
  "turkey",
  "united_arab_emirates",
  "united_kingdom",
  "united_states",
] as const;

export type CountryKey = (typeof COUNTRY_KEYS)[number];

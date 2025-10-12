// Character types for Star Wars d6 character sheets

export interface Skill {
  name: string;
  dice: string;
  isSpecialization?: boolean;
}

export interface AttributeBlock {
  dice: string;
  skills: Skill[];
}

export interface CharacterData {
  // Character Info
  type?: string; // e.g., "Rebel Saboteur"
  species?: string;
  homeworld?: string;
  gender?: string;
  age?: string;
  height?: string;
  weight?: string;
  move?: string;
  appearance?: string;
  personality?: string;
  quote?: string;
  background?: string;

  // Attributes with skills grouped under them
  dexterity?: AttributeBlock;
  knowledge?: AttributeBlock;
  mechanical?: AttributeBlock;
  perception?: AttributeBlock;
  strength?: AttributeBlock;
  technical?: AttributeBlock;

  // Force Attributes (only when Force Sensitive)
  control?: AttributeBlock;
  sense?: AttributeBlock;
  alter?: AttributeBlock;

  // Equipment
  weapons?: Array<{
    name: string;
    skill?: string;      // e.g., "Blaster", "Brawling"
    damage?: string;     // e.g., "4D"
    range?: string;      // e.g., "3-10/30/120"
    ammo?: number;       // e.g., 100
    fireRate?: number;   // e.g., 1 (single shot) or 3 (burst)
    cost?: number;       // e.g., 500 (credits)
    ammoCost?: number;   // e.g., 25 (credits per reload/clip)
    notes?: string;      // e.g., "At Long range, increase difficulty by +5"
  }>;
  armor?: Array<{
    name: string;
    protectionPhysical?: string; // e.g., "1D"
    protectionEnergy?: string;   // e.g., "+1"
    locations?: {
      head?: boolean;
      torso?: boolean;
      arms?: boolean;
      legs?: boolean;
    };
    strBonus?: string;
    dexPenalty?: string;
    cost?: number;       // e.g., 1000 (credits)
    notes?: string;
  }>;
  equipment?: Array<{
    name: string;
    cost?: number;       // e.g., 50 (credits)
  }>;
  credits?: number;

  // Force
  forceSensitive?: boolean;
  forcePoints?: number;
  darkSidePoints?: number;

  // Character progression
  characterPoints?: number;
  specialAbilities?: string[];

  // SRP Tracking (Spent/Remaining/Permanent)
  srp?: {
    s?: number; // Spent
    r?: number; // Remaining
    p?: number; // Permanent
  };

  // Health tracking
  health?: {
    stunned?: boolean;
    wounded?: boolean;
    incapacitated?: boolean;
    mortallyWounded?: boolean;
  };

  // Additional character details
  edgesAndComplications?: string;

  // Legacy fields for backward compatibility
  attributes?: Record<string, string>;
  skills?: Record<string, string>;
  notes?: string;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  species_slug: string | null;
  image?: string | null;
  data: CharacterData;
  created_at?: string;
  updated_at?: string;
}

export interface CharacterFormData {
  name: string;
  species_slug: string;
  data: CharacterData;
}

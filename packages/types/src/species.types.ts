/**
 * Species type definitions based on ALIENS.json schema
 */

export interface AttributeRange {
  min: string; // e.g., "1D", "2D+1"
  max: string; // e.g., "4D", "5D+2"
}

export interface Attributes {
  dexterity?: AttributeRange;
  knowledge?: AttributeRange;
  mechanical?: AttributeRange;
  perception?: AttributeRange;
  strength?: AttributeRange;
  technical?: AttributeRange;
}

export interface Stats {
  attributeDice: string; // e.g., "12D"
  attributes: Attributes;
  move: string; // e.g., "10/12" or "10"
  size: string; // e.g., "1.3-1.8 meters"
}

export interface Languages {
  native: string;
  description: string;
}

export interface NamedText {
  name: string;
  description: string;
}

export interface Species {
  id?: number | string;
  name: string;
  plural?: string;
  description: string;
  personality?: string;
  physicalDescription?: string;
  homeworld?: string;
  languages: Languages;
  exampleNames?: string[];
  adventurers?: string;
  imageUrl?: string;
  stats: Stats;
  specialAbilities?: NamedText[];
  storyFactors?: NamedText[];
  notes?: string;
  sources: string[];
}

/**
 * Firestore document with computed fields
 */
export interface SpeciesDocument extends Species {
  slug: string;
  searchName: string;
  searchTokens: string[];
  sortName: string;
  imagePath?: string;
  hasImage: boolean;
  updatedAt: Date;
}

export type Gender = 'male' | 'female';

export interface MetaItem {
  id: string;
  key: string;
  value: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  birthCity: string;
  deathDate?: string;
  avatar?: string;
  meta: MetaItem[];
  // Relationships
  parentIds: string[];
  partnerIds: string[];
  childrenIds: string[];
  siblingIds: string[];
  // Position on canvas
  x: number;
  y: number;
}

export interface FamilyTreeState {
  people: Record<string, Person>;
  selectedPersonId: string | null;
  focusedPersonId: string | null;
}

export type RelationshipType = 'parent' | 'child' | 'sibling' | 'partner';

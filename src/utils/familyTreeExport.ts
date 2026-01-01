import { Person, Gender } from '@/types/FamilyTree';

// Export format structure
export interface ExportPerson {
  id: string;
  data: {
    gender: 'M' | 'F';
    'first name': string;
    'last name': string;
    birthday: string;
    avatar: string;
  };
  rels: {
    parents?: string[];
    children?: string[];
    spouses?: string[];
  };
}

// Convert internal Person to export format
export const personToExport = (person: Person): ExportPerson => {
  const rels: ExportPerson['rels'] = {};

  if (person.parentIds.length > 0) {
    rels.parents = [...person.parentIds];
  }
  if (person.childrenIds.length > 0) {
    rels.children = [...person.childrenIds];
  }
  if (person.partnerIds.length > 0) {
    rels.spouses = [...person.partnerIds];
  }

  return {
    id: person.id,
    data: {
      gender: person.gender === 'male' ? 'M' : 'F',
      'first name': person.firstName,
      'last name': person.lastName,
      birthday: person.birthDate || '',
      avatar: person.avatar || '',
    },
    rels,
  };
};

// Convert export format to internal Person
export const exportToPerson = (
  exportPerson: ExportPerson,
  index: number,
  total: number
): Person => {
  // Calculate grid position based on index
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  const TILE_WIDTH = 160;
  const TILE_HEIGHT = 100;
  const HORIZONTAL_GAP = 80;
  const VERTICAL_GAP = 120;
  
  const x = 800 + col * (TILE_WIDTH + HORIZONTAL_GAP);
  const y = 400 + row * (TILE_HEIGHT + VERTICAL_GAP);

  const gender: Gender = exportPerson.data.gender === 'M' ? 'male' : 'female';

  return {
    id: exportPerson.id,
    firstName: exportPerson.data['first name'] || '',
    lastName: exportPerson.data['last name'] || '',
    gender,
    birthDate: exportPerson.data.birthday || '',
    birthCity: '',
    deathDate: undefined,
    avatar: exportPerson.data.avatar || undefined,
    meta: [],
    parentIds: exportPerson.rels.parents || [],
    partnerIds: exportPerson.rels.spouses || [],
    childrenIds: exportPerson.rels.children || [],
    siblingIds: [],
    x,
    y,
  };
};

// Derive sibling relationships from shared parents
export const deriveSiblings = (people: Record<string, Person>): Record<string, Person> => {
  const updatedPeople = { ...people };
  
  // Group by parent sets
  const parentToChildren: Record<string, string[]> = {};
  
  Object.values(people).forEach(person => {
    if (person.parentIds.length > 0) {
      const parentKey = [...person.parentIds].sort().join('-');
      if (!parentToChildren[parentKey]) {
        parentToChildren[parentKey] = [];
      }
      parentToChildren[parentKey].push(person.id);
    }
  });
  
  // Set sibling relationships
  Object.values(parentToChildren).forEach(siblingGroup => {
    if (siblingGroup.length > 1) {
      siblingGroup.forEach(personId => {
        const siblings = siblingGroup.filter(id => id !== personId);
        updatedPeople[personId] = {
          ...updatedPeople[personId],
          siblingIds: siblings,
        };
      });
    }
  });
  
  return updatedPeople;
};

// Export all people to JSON
export const exportFamilyTree = (people: Record<string, Person>): string => {
  const exportData = Object.values(people).map(personToExport);
  return JSON.stringify(exportData, null, 2);
};

// Import from JSON
export const importFamilyTree = (jsonString: string): Record<string, Person> => {
  const exportData: ExportPerson[] = JSON.parse(jsonString);
  const total = exportData.length;
  
  let people: Record<string, Person> = {};
  
  exportData.forEach((exportPerson, index) => {
    const person = exportToPerson(exportPerson, index, total);
    people[person.id] = person;
  });
  
  // Derive siblings from parent relationships
  people = deriveSiblings(people);
  
  return people;
};

// Download JSON file
export const downloadFamilyTreeJson = (people: Record<string, Person>, filename = 'family-tree.json') => {
  const json = exportFamilyTree(people);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

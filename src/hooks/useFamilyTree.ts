import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Person, Gender, FamilyTreeState, RelationshipType, MetaItem } from '@/types/FamilyTree';
import { importFamilyTree, downloadFamilyTreeJson } from '@/utils/familyTreeExport';

const TILE_WIDTH = 160;
const TILE_HEIGHT = 100;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 120;

const createInitialPerson = (): Person => ({
  id: uuidv4(),
  firstName: 'Mario',
  lastName: 'Rossi',
  gender: 'male',
  birthDate: '1980-01-15',
  birthCity: 'Roma',
  meta: [],
  parentIds: [],
  partnerIds: [],
  childrenIds: [],
  siblingIds: [],
  x: 1500,
  y: 1000,
});

export const useFamilyTree = () => {
  const [state, setState] = useState<FamilyTreeState>(() => {
    const initialPerson = createInitialPerson();
    return {
      people: { [initialPerson.id]: initialPerson },
      selectedPersonId: null,
      focusedPersonId: null,
    };
  });

  const selectPerson = useCallback((personId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedPersonId: personId,
      focusedPersonId: personId,
    }));
  }, []);

  const updatePerson = useCallback((personId: string, updates: Partial<Person>) => {
    setState(prev => ({
      ...prev,
      people: {
        ...prev.people,
        [personId]: { ...prev.people[personId], ...updates },
      },
    }));
  }, []);

  const addMetaItem = useCallback((personId: string, key: string, value: string) => {
    setState(prev => {
      const person = prev.people[personId];
      const newMeta: MetaItem = { id: uuidv4(), key, value };
      return {
        ...prev,
        people: {
          ...prev.people,
          [personId]: { ...person, meta: [...person.meta, newMeta] },
        },
      };
    });
  }, []);

  const updateMetaItem = useCallback((personId: string, metaId: string, key: string, value: string) => {
    setState(prev => {
      const person = prev.people[personId];
      const updatedMeta = person.meta.map(m => 
        m.id === metaId ? { ...m, key, value } : m
      );
      return {
        ...prev,
        people: {
          ...prev.people,
          [personId]: { ...person, meta: updatedMeta },
        },
      };
    });
  }, []);

  const removeMetaItem = useCallback((personId: string, metaId: string) => {
    setState(prev => {
      const person = prev.people[personId];
      return {
        ...prev,
        people: {
          ...prev.people,
          [personId]: { ...person, meta: person.meta.filter(m => m.id !== metaId) },
        },
      };
    });
  }, []);

  const calculateNewPosition = useCallback((
    basePerson: Person,
    relationship: RelationshipType,
    existingPeople: Person[]
  ): { x: number; y: number } => {
    const offset = TILE_WIDTH + HORIZONTAL_GAP;
    const verticalOffset = TILE_HEIGHT + VERTICAL_GAP;

    switch (relationship) {
      case 'parent': {
        const existingParents = existingPeople.filter(p => 
          basePerson.parentIds.includes(p.id)
        );
        const xOffset = existingParents.length * offset;
        return {
          x: basePerson.x - offset / 2 + xOffset,
          y: basePerson.y - verticalOffset,
        };
      }
      case 'child': {
        const existingChildren = existingPeople.filter(p => 
          basePerson.childrenIds.includes(p.id)
        );
        const xOffset = existingChildren.length * offset;
        return {
          x: basePerson.x - (existingChildren.length * offset) / 2 + xOffset,
          y: basePerson.y + verticalOffset,
        };
      }
      case 'sibling': {
        const existingSiblings = existingPeople.filter(p => 
          basePerson.siblingIds.includes(p.id)
        );
        return {
          x: basePerson.x + offset + existingSiblings.length * offset,
          y: basePerson.y,
        };
      }
      case 'partner': {
        const existingPartners = existingPeople.filter(p => 
          basePerson.partnerIds.includes(p.id)
        );
        return {
          x: basePerson.x - offset - existingPartners.length * offset,
          y: basePerson.y,
        };
      }
      default:
        return { x: basePerson.x + offset, y: basePerson.y };
    }
  }, []);

  const addRelative = useCallback((
    personId: string,
    relationship: RelationshipType,
    gender: Gender = 'male'
  ) => {
    setState(prev => {
      const person = prev.people[personId];
      const existingPeople = Object.values(prev.people);
      const position = calculateNewPosition(person, relationship, existingPeople);

      const newPerson: Person = {
        id: uuidv4(),
        firstName: '',
        lastName: person.lastName,
        gender,
        birthDate: '',
        birthCity: '',
        meta: [],
        parentIds: [],
        partnerIds: [],
        childrenIds: [],
        siblingIds: [],
        ...position,
      };

      let updatedPeople = { ...prev.people };

      switch (relationship) {
        case 'parent':
          newPerson.childrenIds = [personId];
          updatedPeople[personId] = {
            ...person,
            parentIds: [...person.parentIds, newPerson.id],
          };
          // Link with existing parents as partners
          person.parentIds.forEach(parentId => {
            const parent = updatedPeople[parentId];
            if (parent && !parent.partnerIds.includes(newPerson.id)) {
              updatedPeople[parentId] = {
                ...parent,
                partnerIds: [...parent.partnerIds, newPerson.id],
              };
              newPerson.partnerIds.push(parentId);
            }
          });
          break;
        case 'child':
          newPerson.parentIds = [personId];
          updatedPeople[personId] = {
            ...person,
            childrenIds: [...person.childrenIds, newPerson.id],
          };
          // Add partners as parents too
          person.partnerIds.forEach(partnerId => {
            const partner = updatedPeople[partnerId];
            if (partner) {
              updatedPeople[partnerId] = {
                ...partner,
                childrenIds: [...partner.childrenIds, newPerson.id],
              };
              newPerson.parentIds.push(partnerId);
            }
          });
          break;
        case 'sibling':
          newPerson.siblingIds = [personId];
          newPerson.parentIds = [...person.parentIds];
          updatedPeople[personId] = {
            ...person,
            siblingIds: [...person.siblingIds, newPerson.id],
          };
          // Update existing siblings
          person.siblingIds.forEach(sibId => {
            const sib = updatedPeople[sibId];
            if (sib) {
              updatedPeople[sibId] = {
                ...sib,
                siblingIds: [...sib.siblingIds, newPerson.id],
              };
              newPerson.siblingIds.push(sibId);
            }
          });
          // Add as child to parents
          person.parentIds.forEach(parentId => {
            const parent = updatedPeople[parentId];
            if (parent) {
              updatedPeople[parentId] = {
                ...parent,
                childrenIds: [...parent.childrenIds, newPerson.id],
              };
            }
          });
          break;
        case 'partner':
          newPerson.partnerIds = [personId];
          updatedPeople[personId] = {
            ...person,
            partnerIds: [...person.partnerIds, newPerson.id],
          };
          break;
      }

      updatedPeople[newPerson.id] = newPerson;

      return {
        ...prev,
        people: updatedPeople,
        selectedPersonId: newPerson.id,
        focusedPersonId: newPerson.id,
      };
    });
  }, [calculateNewPosition]);

  const deletePerson = useCallback((personId: string) => {
    setState(prev => {
      const person = prev.people[personId];
      if (!person) return prev;

      const updatedPeople = { ...prev.people };
      delete updatedPeople[personId];

      // Remove references from all related people
      Object.keys(updatedPeople).forEach(id => {
        const p = updatedPeople[id];
        updatedPeople[id] = {
          ...p,
          parentIds: p.parentIds.filter(pid => pid !== personId),
          childrenIds: p.childrenIds.filter(cid => cid !== personId),
          siblingIds: p.siblingIds.filter(sid => sid !== personId),
          partnerIds: p.partnerIds.filter(pid => pid !== personId),
        };
      });

      return {
        ...prev,
        people: updatedPeople,
        selectedPersonId: null,
        focusedPersonId: null,
      };
    });
  }, []);

  const getVisiblePeople = useCallback((): Person[] => {
    const { people, focusedPersonId } = state;
    
    if (!focusedPersonId) {
      return Object.values(people);
    }

    const focused = people[focusedPersonId];
    if (!focused) return Object.values(people);

    const visibleIds = new Set<string>([focusedPersonId]);

    // Add all parents (ancestors)
    const addAncestors = (personId: string) => {
      const person = people[personId];
      if (!person) return;
      person.parentIds.forEach(parentId => {
        if (!visibleIds.has(parentId)) {
          visibleIds.add(parentId);
          addAncestors(parentId);
        }
      });
    };

    // Add all children (descendants)
    const addDescendants = (personId: string) => {
      const person = people[personId];
      if (!person) return;
      person.childrenIds.forEach(childId => {
        if (!visibleIds.has(childId)) {
          visibleIds.add(childId);
          addDescendants(childId);
        }
      });
    };

    addAncestors(focusedPersonId);
    addDescendants(focusedPersonId);

    // Add siblings
    focused.siblingIds.forEach(id => visibleIds.add(id));

    // Add partners
    focused.partnerIds.forEach(id => visibleIds.add(id));

    return Object.values(people).filter(p => visibleIds.has(p.id));
  }, [state]);

  const getConnections = useCallback((): Array<{
    from: Person;
    to: Person;
    type: 'parent-child' | 'partner' | 'sibling';
  }> => {
    const visiblePeople = getVisiblePeople();
    const visibleIds = new Set(visiblePeople.map(p => p.id));
    const connections: Array<{
      from: Person;
      to: Person;
      type: 'parent-child' | 'partner' | 'sibling';
    }> = [];
    const addedConnections = new Set<string>();

    visiblePeople.forEach(person => {
      // Parent-child connections
      person.childrenIds.forEach(childId => {
        if (visibleIds.has(childId)) {
          const key = `parent-${person.id}-${childId}`;
          if (!addedConnections.has(key)) {
            connections.push({
              from: person,
              to: state.people[childId],
              type: 'parent-child',
            });
            addedConnections.add(key);
          }
        }
      });

      // Partner connections
      person.partnerIds.forEach(partnerId => {
        if (visibleIds.has(partnerId)) {
          const key = [person.id, partnerId].sort().join('-partner-');
          if (!addedConnections.has(key)) {
            connections.push({
              from: person,
              to: state.people[partnerId],
              type: 'partner',
            });
            addedConnections.add(key);
          }
        }
      });
    });

    return connections;
  }, [state, getVisiblePeople]);

  const exportTree = useCallback(() => {
    downloadFamilyTreeJson(state.people);
  }, [state.people]);

  const importTree = useCallback((jsonString: string) => {
    try {
      const importedPeople = importFamilyTree(jsonString);
      setState({
        people: importedPeople,
        selectedPersonId: null,
        focusedPersonId: null,
      });
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }, []);

  return {
    state,
    people: state.people,
    selectedPerson: state.selectedPersonId ? state.people[state.selectedPersonId] : null,
    selectPerson,
    updatePerson,
    addMetaItem,
    updateMetaItem,
    removeMetaItem,
    addRelative,
    deletePerson,
    getVisiblePeople,
    getConnections,
    exportTree,
    importTree,
  };
};

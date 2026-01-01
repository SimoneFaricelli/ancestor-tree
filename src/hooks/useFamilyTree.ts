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

  const calculateRelativePositions = useCallback((focusedId: string): Map<string, { x: number; y: number }> => {
    const { people } = state;
    const positions = new Map<string, { x: number; y: number }>();
    const focused = people[focusedId];
    if (!focused) return positions;

    const centerX = 1500;
    const centerY = 1000;
    const horizontalGap = TILE_WIDTH + HORIZONTAL_GAP;
    const verticalGap = TILE_HEIGHT + VERTICAL_GAP;

    // Set focused person at center
    positions.set(focusedId, { x: centerX, y: centerY });

    // Position partners to the left
    focused.partnerIds.forEach((partnerId, index) => {
      positions.set(partnerId, {
        x: centerX - horizontalGap * (index + 1),
        y: centerY,
      });
    });

    // Position siblings to the right
    focused.siblingIds.forEach((siblingId, index) => {
      positions.set(siblingId, {
        x: centerX + horizontalGap * (index + 1),
        y: centerY,
      });
    });

    // Track used positions at each level to avoid overlaps
    const usedPositionsByLevel = new Map<number, Set<number>>();
    
    const getAvailableX = (level: number, preferredX: number): number => {
      if (!usedPositionsByLevel.has(level)) {
        usedPositionsByLevel.set(level, new Set());
      }
      const usedPositions = usedPositionsByLevel.get(level)!;
      
      // Round to nearest slot
      let slotX = Math.round(preferredX / horizontalGap) * horizontalGap;
      
      // Find available position
      while (usedPositions.has(slotX)) {
        slotX += horizontalGap;
      }
      
      usedPositions.add(slotX);
      return slotX;
    };

    // Position ancestors upward - handle multiple ancestry lines
    const positionAncestors = (personId: string, level: number, baseX: number) => {
      const person = people[personId];
      if (!person) return;

      const parentIds = person.parentIds;
      const parentCount = parentIds.length;
      const startX = baseX - ((parentCount - 1) * horizontalGap) / 2;

      parentIds.forEach((parentId, index) => {
        if (!positions.has(parentId)) {
          const preferredX = startX + index * horizontalGap;
          const x = getAvailableX(-level, preferredX);
          const y = centerY - verticalGap * level;
          positions.set(parentId, { x, y });
          positionAncestors(parentId, level + 1, x);
        }
      });
    };

    // Position descendants downward
    const positionDescendants = (personId: string, level: number, baseX: number) => {
      const person = people[personId];
      if (!person) return;

      const childIds = person.childrenIds;
      const childCount = childIds.length;
      const startX = baseX - ((childCount - 1) * horizontalGap) / 2;

      childIds.forEach((childId, index) => {
        if (!positions.has(childId)) {
          const preferredX = startX + index * horizontalGap;
          const x = getAvailableX(level, preferredX);
          const y = centerY + verticalGap * level;
          positions.set(childId, { x, y });
          positionDescendants(childId, level + 1, x);
        }
      });
    };

    // First position the focused person's ancestors
    positionAncestors(focusedId, 1, centerX);
    
    // Then position partners' ancestors with offset to avoid overlap
    focused.partnerIds.forEach((partnerId, partnerIndex) => {
      const partner = people[partnerId];
      if (partner) {
        const partnerPos = positions.get(partnerId);
        if (partnerPos) {
          // Position partner's ancestors starting from partner's position
          const partnerParentIds = partner.parentIds;
          const partnerParentCount = partnerParentIds.length;
          const partnerStartX = partnerPos.x - ((partnerParentCount - 1) * horizontalGap) / 2;
          
          partnerParentIds.forEach((parentId, index) => {
            if (!positions.has(parentId)) {
              const preferredX = partnerStartX + index * horizontalGap;
              const x = getAvailableX(-1, preferredX);
              const y = centerY - verticalGap;
              positions.set(parentId, { x, y });
              positionAncestors(parentId, 2, x);
            }
          });
        }
      }
    });
    
    positionDescendants(focusedId, 1, centerX);

    return positions;
  }, [state]);

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

    // Calculate new positions based on focused person
    const positions = calculateRelativePositions(focusedPersonId);

    return Object.values(people)
      .filter(p => visibleIds.has(p.id))
      .map(p => {
        const pos = positions.get(p.id);
        if (pos) {
          return { ...p, x: pos.x, y: pos.y };
        }
        return p;
      });
  }, [state, calculateRelativePositions]);

  const getConnections = useCallback((): Array<{
    from: Person;
    to: Person;
    type: 'parent-child' | 'partner' | 'sibling';
  }> => {
    const visiblePeople = getVisiblePeople();
    const visiblePeopleMap = new Map(visiblePeople.map(p => [p.id, p]));
    const connections: Array<{
      from: Person;
      to: Person;
      type: 'parent-child' | 'partner' | 'sibling';
    }> = [];
    const addedConnections = new Set<string>();

    visiblePeople.forEach(person => {
      // Parent-child connections
      person.childrenIds.forEach(childId => {
        const child = visiblePeopleMap.get(childId);
        if (child) {
          const key = `parent-${person.id}-${childId}`;
          if (!addedConnections.has(key)) {
            connections.push({
              from: person,
              to: child,
              type: 'parent-child',
            });
            addedConnections.add(key);
          }
        }
      });

      // Partner connections
      person.partnerIds.forEach(partnerId => {
        const partner = visiblePeopleMap.get(partnerId);
        if (partner) {
          const key = [person.id, partnerId].sort().join('-partner-');
          if (!addedConnections.has(key)) {
            connections.push({
              from: person,
              to: partner,
              type: 'partner',
            });
            addedConnections.add(key);
          }
        }
      });
    });

    return connections;
  }, [getVisiblePeople]);

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

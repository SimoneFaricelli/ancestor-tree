import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Person, Gender, FamilyTreeState, RelationshipType, MetaItem } from '@/types/FamilyTree';
import { importFamilyTree, downloadFamilyTreeJson } from '@/utils/familyTreeExport';
import { useSupabaseFamily } from './useSupabaseFamily';
import { useAuth } from './useAuth';

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
  const { user } = useAuth();
  const { loadFamilyTree, saveFamilyTree, loading: dbLoading, saving } = useSupabaseFamily();
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const [state, setState] = useState<FamilyTreeState>(() => {
    // Inizializziamo con oggetto vuoto, creeremo la persona iniziale solo se necessario
    return {
      people: {},
      selectedPersonId: null,
      focusedPersonId: null,
      isSidebarOpen: false,
    };
  });

  // Resetta lo stato quando cambia l'utente (logout/login)
  useEffect(() => {
    const userId = user?.id || null;
    
    // Se l'utente è cambiato, resetta tutto
    if (currentUserIdRef.current !== userId) {
      currentUserIdRef.current = userId;
      
      // Cancella eventuali salvataggi pendenti PRIMA di resettare
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      setIsInitialized(false);
      setDataLoaded(false);
      
      // Resetta lo stato - ma NON settiamo people vuoto qui
      // Lo faremo solo dopo il caricamento
      setState(prev => ({
        ...prev,
        selectedPersonId: null,
        focusedPersonId: null,
        isSidebarOpen: false,
      }));
    }
  }, [user?.id]);

  // Carica i dati da Supabase all'avvio
  useEffect(() => {
    // Aspetta che l'utente sia completamente caricato con un ID valido
    if (!user?.id || isInitialized) return;

    const loadData = async () => {
      console.log('🔄 Caricamento albero in corso... User ID:', user.id);
      const loadedPeople = await loadFamilyTree(user.id);
      
      console.log('📦 Dati caricati:', loadedPeople ? Object.keys(loadedPeople).length + ' persone' : 'nessun dato');
      
      if (loadedPeople && Object.keys(loadedPeople).length > 0) {
        // Carica i dati dal database
        console.log('✅ Caricamento dati esistenti dal DB');
        setState(prev => ({
          ...prev,
          people: loadedPeople,
        }));
      } else {
        // Se non ci sono dati nel DB, crea la persona iniziale
        console.log('🆕 Creazione persona iniziale (nessun dato nel DB)');
        const initialPerson = createInitialPerson();
        setState(prev => ({
          ...prev,
          people: { [initialPerson.id]: initialPerson },
        }));
      }
      
      setIsInitialized(true);
      
      // Aspetta 2 secondi prima di abilitare il salvataggio automatico
      // Questo garantisce che i dati siano completamente caricati e stabilizzati
      console.log('⏳ Attesa prima di abilitare salvataggio automatico...');
      setTimeout(() => {
        console.log('💾 Salvataggio automatico abilitato');
        setDataLoaded(true);
      }, 2000);
    };

    loadData();
  }, [user?.id, isInitialized]);

  // Salva automaticamente su Supabase quando cambiano i dati (con debounce)
  // MA solo dopo che i dati iniziali sono stati caricati
  useEffect(() => {
    if (!isInitialized || !user?.id || !dataLoaded) return;

    // Cancella il timeout precedente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Salva dopo 1 secondo di inattività
    saveTimeoutRef.current = setTimeout(() => {
      saveFamilyTree(state.people);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.people, isInitialized, user, saveFamilyTree, dataLoaded]);

  const selectPerson = useCallback((personId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedPersonId: personId,
      focusedPersonId: personId,
      // NON apriamo più automaticamente la sidebar
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSidebarOpen: !prev.isSidebarOpen,
    }));
  }, []);

  const openSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSidebarOpen: true,
    }));
  }, []);

  const closeSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSidebarOpen: false,
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
    const minSpacing = horizontalGap;

    // Map per tracciare la larghezza di ogni sotto-albero
    const subtreeWidths = new Map<string, number>();
    const processed = new Set<string>();

    /**
     * Calcola la larghezza di un sotto-albero (verso l'alto - antenati)
     * La larghezza è il numero totale di "slot" orizzontali necessari
     */
    const calculateAncestorWidth = (personId: string): number => {
      if (subtreeWidths.has(personId + '_ancestor')) {
        return subtreeWidths.get(personId + '_ancestor')!;
      }

      const person = people[personId];
      if (!person || person.parentIds.length === 0) {
        subtreeWidths.set(personId + '_ancestor', 1);
        return 1;
      }

      // Calcola la larghezza totale dei genitori e dei loro antenati
      let totalWidth = 0;
      person.parentIds.forEach(parentId => {
        const parentWidth = calculateAncestorWidth(parentId);
        totalWidth += parentWidth;
      });

      // La larghezza è almeno quella dei genitori
      const width = Math.max(totalWidth, 1);
      subtreeWidths.set(personId + '_ancestor', width);
      return width;
    };

    /**
     * Calcola la larghezza di un sotto-albero (verso il basso - discendenti)
     * La larghezza è il numero totale di "slot" orizzontali necessari
     */
    const calculateDescendantWidth = (personId: string): number => {
      if (subtreeWidths.has(personId + '_descendant')) {
        return subtreeWidths.get(personId + '_descendant')!;
      }

      const person = people[personId];
      if (!person || person.childrenIds.length === 0) {
        subtreeWidths.set(personId + '_descendant', 1);
        return 1;
      }

      // Calcola la larghezza totale dei figli e dei loro discendenti
      let totalWidth = 0;
      person.childrenIds.forEach(childId => {
        const childWidth = calculateDescendantWidth(childId);
        totalWidth += childWidth;
      });

      // La larghezza è almeno quella dei figli
      const width = Math.max(totalWidth, 1);
      subtreeWidths.set(personId + '_descendant', width);
      return width;
    };

    /**
     * Posiziona gli antenati (genitori) in modo centrato e ricorsivo
     * @param personId ID della persona di cui posizionare i genitori
     * @param childX Posizione X del figlio (per centrare i genitori)
     * @param level Livello di profondità
     */
    const positionAncestors = (personId: string, childX: number, level: number) => {
      const person = people[personId];
      if (!person || person.parentIds.length === 0) return;

      const parentIds = person.parentIds;
      const parentCount = parentIds.length;

      // Calcola la larghezza totale necessaria per tutti i genitori e i loro antenati
      const parentWidths = parentIds.map(parentId => calculateAncestorWidth(parentId));
      const totalWidth = parentWidths.reduce((sum, w) => sum + w, 0);
      
      // Spazio totale necessario: somma delle larghezze * minSpacing
      const totalSpaceNeeded = totalWidth * minSpacing;

      // Calcola la posizione di partenza per centrare i genitori rispetto al figlio
      let currentX = childX - totalSpaceNeeded / 2;

      parentIds.forEach((parentId, index) => {
        if (!positions.has(parentId)) {
          const parentWidth = parentWidths[index];
          // Lo spazio occupato da questo genitore è proporzionale alla sua larghezza
          const parentSpace = parentWidth * minSpacing;
          
          // Posiziona il genitore al centro del suo spazio
          const x = currentX + parentSpace / 2;
          const y = centerY - verticalGap * level;
          
          positions.set(parentId, { x, y });
          
          // Posiziona ricorsivamente gli antenati di questo genitore
          positionAncestors(parentId, x, level + 1);
          
          // Aggiorna la posizione X per il prossimo genitore
          currentX += parentSpace;
        }
      });
    };

    /**
     * Posiziona i discendenti (figli) in modo centrato e ricorsivo
     * @param personId ID della persona di cui posizionare i figli
     * @param parentX Posizione X del genitore (per centrare i figli)
     * @param level Livello di profondità
     */
    const positionDescendants = (personId: string, parentX: number, level: number) => {
      const person = people[personId];
      if (!person || person.childrenIds.length === 0) return;

      const childIds = person.childrenIds;
      const childCount = childIds.length;

      // Calcola la larghezza totale necessaria per tutti i figli e i loro discendenti
      const childWidths = childIds.map(childId => calculateDescendantWidth(childId));
      const totalWidth = childWidths.reduce((sum, w) => sum + w, 0);
      
      // Spazio totale necessario: somma delle larghezze * minSpacing
      const totalSpaceNeeded = totalWidth * minSpacing;

      // Calcola la posizione di partenza per centrare i figli rispetto al genitore
      let currentX = parentX - totalSpaceNeeded / 2;

      childIds.forEach((childId, index) => {
        if (!positions.has(childId)) {
          const childWidth = childWidths[index];
          // Lo spazio occupato da questo figlio è proporzionale alla sua larghezza
          const childSpace = childWidth * minSpacing;
          
          // Posiziona il figlio al centro del suo spazio
          const x = currentX + childSpace / 2;
          const y = centerY + verticalGap * level;
          
          positions.set(childId, { x, y });
          
          // Posiziona ricorsivamente i discendenti di questo figlio
          positionDescendants(childId, x, level + 1);
          
          // Aggiorna la posizione X per il prossimo figlio
          currentX += childSpace;
        }
      });
    };

    // Set focused person at center
    positions.set(focusedId, { x: centerX, y: centerY });

    // Position partners to the left con spaziatura dinamica
    if (focused.partnerIds.length > 0) {
      const partnerCount = focused.partnerIds.length;
      
      // Calcola la larghezza di ogni partner (considerando i loro antenati)
      const partnerWidths = focused.partnerIds.map(partnerId => calculateAncestorWidth(partnerId));
      const totalPartnerWidth = partnerWidths.reduce((sum, w) => sum + w, 0);
      
      // Spazio totale necessario per tutti i partner
      const totalSpaceNeeded = totalPartnerWidth * minSpacing;
      
      // Posiziona i partner a sinistra del centro, centrati come gruppo
      let currentPartnerX = centerX - horizontalGap - totalSpaceNeeded;
      
      focused.partnerIds.forEach((partnerId, index) => {
        const partnerWidth = partnerWidths[index];
        const partnerSpace = partnerWidth * minSpacing;
        
        // Posiziona il partner al centro del suo spazio
        const x = currentPartnerX + partnerSpace / 2;
        
        positions.set(partnerId, {
          x,
          y: centerY,
        });
        
        // Posiziona gli antenati di ogni partner
        positionAncestors(partnerId, x, 1);
        
        currentPartnerX += partnerSpace;
      });
    }

    // Position siblings to the right con spaziatura dinamica
    if (focused.siblingIds.length > 0) {
      const siblingCount = focused.siblingIds.length;
      
      // Calcola la larghezza di ogni fratello (considerando i loro discendenti)
      const siblingWidths = focused.siblingIds.map(siblingId => calculateDescendantWidth(siblingId));
      const totalSiblingWidth = siblingWidths.reduce((sum, w) => sum + w, 0);
      
      // Spazio totale necessario per tutti i fratelli
      const totalSpaceNeeded = totalSiblingWidth * minSpacing;
      
      // Posiziona i fratelli a destra del centro
      let currentSiblingX = centerX + horizontalGap;
      
      focused.siblingIds.forEach((siblingId, index) => {
        const siblingWidth = siblingWidths[index];
        const siblingSpace = siblingWidth * minSpacing;
        
        // Posiziona il fratello al centro del suo spazio
        const x = currentSiblingX + siblingSpace / 2;
        
        positions.set(siblingId, {
          x,
          y: centerY,
        });
        
        // Posiziona i discendenti di ogni fratello/sorella
        positionDescendants(siblingId, x, 1);
        
        currentSiblingX += siblingSpace;
      });
    }

    // Posiziona gli antenati della persona selezionata
    positionAncestors(focusedId, centerX, 1);
    
    // Posiziona i discendenti della persona selezionata
    positionDescendants(focusedId, centerX, 1);

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
        isSidebarOpen: false,
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
    loading: dbLoading || !isInitialized || Object.keys(state.people).length === 0,
    saving,
    selectPerson,
    toggleSidebar,
    openSidebar,
    closeSidebar,
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

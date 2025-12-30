import { useFamilyTree } from '@/hooks/useFamilyTree';
import { FamilyCanvas } from '@/components/FamilyCanvas';
import { PersonSidebar } from '@/components/PersonSidebar';
import { TreePine, Users } from 'lucide-react';

const Index = () => {
  const {
    state,
    selectedPerson,
    selectPerson,
    updatePerson,
    addMetaItem,
    updateMetaItem,
    removeMetaItem,
    addRelative,
    deletePerson,
    getVisiblePeople,
    getConnections,
  } = useFamilyTree();

  const visiblePeople = getVisiblePeople();
  const connections = getConnections();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TreePine className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Albero Genealogico</h1>
            <p className="text-xs text-muted-foreground">
              Visualizza e modifica la tua storia familiare
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{Object.keys(state.people).length} persone</span>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 relative">
        <FamilyCanvas
          people={visiblePeople}
          connections={connections}
          selectedPersonId={state.selectedPersonId}
          focusedPersonId={state.focusedPersonId}
          onSelectPerson={selectPerson}
        />
      </main>

      {/* Sidebar */}
      {selectedPerson && (
        <PersonSidebar
          person={selectedPerson}
          isOpen={!!selectedPerson}
          onClose={() => selectPerson(null)}
          onUpdatePerson={(updates) => updatePerson(selectedPerson.id, updates)}
          onAddMeta={(key, value) => addMetaItem(selectedPerson.id, key, value)}
          onUpdateMeta={(metaId, key, value) =>
            updateMetaItem(selectedPerson.id, metaId, key, value)
          }
          onRemoveMeta={(metaId) => removeMetaItem(selectedPerson.id, metaId)}
          onAddRelative={(type, gender) => addRelative(selectedPerson.id, type, gender)}
          onDelete={() => deletePerson(selectedPerson.id)}
        />
      )}

      {/* Overlay when sidebar is open */}
      {selectedPerson && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => selectPerson(null)}
        />
      )}

      {/* Instructions tooltip */}
      {!selectedPerson && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border text-sm text-muted-foreground fade-in">
          Clicca su una persona per visualizzare i dettagli
        </div>
      )}
    </div>
  );
};

export default Index;

import { useRef } from 'react';
import { useFamilyTree } from '@/hooks/useFamilyTree';
import { FamilyCanvas } from '@/components/FamilyCanvas';
import { PersonSidebar } from '@/components/PersonSidebar';
import { TreePine, Users, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Index = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    state,
    selectedPerson,
    selectPerson,
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
  } = useFamilyTree();

  const visiblePeople = getVisiblePeople();
  const connections = getConnections();

  const handleExport = () => {
    exportTree();
    toast.success('Albero genealogico esportato!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importTree(content);
      if (success) {
        toast.success('Albero genealogico importato!');
      } else {
        toast.error('Errore durante l\'importazione');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Importa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Esporta
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{Object.keys(state.people).length} persone</span>
          </div>
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
          onClose={closeSidebar}
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
          onClick={closeSidebar}
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

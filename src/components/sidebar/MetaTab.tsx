import { Person, MetaItem } from '@/types/FamilyTree';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MetaTabProps {
  person: Person;
  onAddMeta: (key: string, value: string) => void;
  onUpdateMeta: (metaId: string, key: string, value: string) => void;
  onRemoveMeta: (metaId: string) => void;
}

export const MetaTab = ({ person, onAddMeta, onUpdateMeta, onRemoveMeta }: MetaTabProps) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey.trim() && newValue.trim()) {
      onAddMeta(newKey.trim(), newValue.trim());
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <div className="space-y-4 fade-in">
      {/* Existing meta items */}
      <div className="space-y-3">
        {person.meta.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Nessun dato aggiuntivo. Aggiungi informazioni personalizzate.
          </p>
        ) : (
          person.meta.map((item) => (
            <div key={item.id} className="group flex gap-2 items-center">
              <Input
                value={item.key}
                onChange={(e) => onUpdateMeta(item.id, e.target.value, item.value)}
                placeholder="Chiave"
                className="bg-input border-border text-sm flex-1"
              />
              <Input
                value={item.value}
                onChange={(e) => onUpdateMeta(item.id, item.key, e.target.value)}
                placeholder="Valore"
                className="bg-input border-border text-sm flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveMeta(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add new meta */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
          Aggiungi nuovo
        </p>
        <div className="flex gap-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Chiave"
            className="bg-input border-border text-sm flex-1"
          />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Valore"
            className="bg-input border-border text-sm flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            variant="secondary"
            size="icon"
            onClick={handleAdd}
            disabled={!newKey.trim() || !newValue.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

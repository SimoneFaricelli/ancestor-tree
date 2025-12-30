import { Person, RelationshipType, Gender } from '@/types/FamilyTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, User, Database, Edit3 } from 'lucide-react';
import { PersonalTab } from './sidebar/PersonalTab';
import { MetaTab } from './sidebar/MetaTab';
import { EditTab } from './sidebar/EditTab';
import { cn } from '@/lib/utils';

interface PersonSidebarProps {
  person: Person;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePerson: (updates: Partial<Person>) => void;
  onAddMeta: (key: string, value: string) => void;
  onUpdateMeta: (metaId: string, key: string, value: string) => void;
  onRemoveMeta: (metaId: string) => void;
  onAddRelative: (type: RelationshipType, gender: Gender) => void;
  onDelete: () => void;
}

export const PersonSidebar = ({
  person,
  isOpen,
  onClose,
  onUpdatePerson,
  onAddMeta,
  onUpdateMeta,
  onRemoveMeta,
  onAddRelative,
  onDelete,
}: PersonSidebarProps) => {
  const isMale = person.gender === 'male';

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-96 bg-sidebar border-l border-sidebar-border shadow-2xl z-50',
        'transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'p-6 border-b border-sidebar-border',
          isMale ? 'bg-tile-male/10' : 'bg-tile-female/10'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2',
                isMale ? 'border-tile-male' : 'border-tile-female'
              )}
            >
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt={person.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className={cn('w-6 h-6', isMale ? 'text-tile-male' : 'text-tile-female')} />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-sidebar-foreground">
                {person.firstName || 'Nome'} {person.lastName || 'Cognome'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {person.birthCity || 'Città non specificata'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-sidebar-accent"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="flex-1">
        <TabsList className="w-full grid grid-cols-3 bg-muted/50 rounded-none h-12">
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-sidebar-accent gap-2"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger
            value="meta"
            className="data-[state=active]:bg-sidebar-accent gap-2"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Meta</span>
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            className="data-[state=active]:bg-sidebar-accent gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </TabsTrigger>
        </TabsList>

        <div className="p-6 overflow-y-auto scrollbar-thin h-[calc(100vh-180px)]">
          <TabsContent value="personal" className="mt-0">
            <PersonalTab person={person} onUpdate={onUpdatePerson} />
          </TabsContent>
          <TabsContent value="meta" className="mt-0">
            <MetaTab
              person={person}
              onAddMeta={onAddMeta}
              onUpdateMeta={onUpdateMeta}
              onRemoveMeta={onRemoveMeta}
            />
          </TabsContent>
          <TabsContent value="edit" className="mt-0">
            <EditTab onAddRelative={onAddRelative} onDelete={onDelete} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

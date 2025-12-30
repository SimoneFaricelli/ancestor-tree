import { Button } from '@/components/ui/button';
import { RelationshipType, Gender } from '@/types/FamilyTree';
import { UserPlus, Baby, Users, Heart, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditTabProps {
  onAddRelative: (type: RelationshipType, gender: Gender) => void;
  onDelete: () => void;
}

export const EditTab = ({ onAddRelative, onDelete }: EditTabProps) => {
  const RelativeButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: RelationshipType;
    icon: typeof UserPlus;
    label: string;
  }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="w-full justify-start gap-3 h-14">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
        <DropdownMenuItem
          onClick={() => onAddRelative(type, 'male')}
          className="cursor-pointer"
        >
          <div className="w-3 h-3 rounded-full bg-tile-male mr-2" />
          Maschio
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onAddRelative(type, 'female')}
          className="cursor-pointer"
        >
          <div className="w-3 h-3 rounded-full bg-tile-female mr-2" />
          Femmina
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4 fade-in">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        Aggiungi parente
      </p>

      <div className="space-y-2">
        <RelativeButton
          type="parent"
          icon={UserPlus}
          label="Aggiungi genitore"
        />
        <RelativeButton
          type="child"
          icon={Baby}
          label="Aggiungi figlio/a"
        />
        <RelativeButton
          type="sibling"
          icon={Users}
          label="Aggiungi fratello/sorella"
        />
        <RelativeButton
          type="partner"
          icon={Heart}
          label="Aggiungi partner"
        />
      </div>

      <div className="border-t border-border pt-4 mt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <span>Elimina persona</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
              <AlertDialogDescription>
                Questa azione non può essere annullata. La persona verrà rimossa
                dall'albero genealogico insieme a tutte le sue connessioni.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted border-border">
                Annulla
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

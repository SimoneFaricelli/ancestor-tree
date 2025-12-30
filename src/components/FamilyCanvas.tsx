import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { PersonTile } from './PersonTile';
import { ConnectionLines } from './ConnectionLines';
import { Person } from '@/types/FamilyTree';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface FamilyCanvasProps {
  people: Person[];
  connections: Array<{
    from: Person;
    to: Person;
    type: 'parent-child' | 'partner' | 'sibling';
  }>;
  selectedPersonId: string | null;
  focusedPersonId: string | null;
  onSelectPerson: (personId: string) => void;
}

export const FamilyCanvas = ({
  people,
  connections,
  selectedPersonId,
  focusedPersonId,
  onSelectPerson,
}: FamilyCanvasProps) => {
  return (
    <div className="w-full h-full canvas-background relative overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.3}
        maxScale={2}
        limitToBounds={false}
        initialPositionX={-800}
        initialPositionY={-500}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => zoomIn()}
                className="bg-card/80 backdrop-blur-sm hover:bg-card"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => zoomOut()}
                className="bg-card/80 backdrop-blur-sm hover:bg-card"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => resetTransform()}
                className="bg-card/80 backdrop-blur-sm hover:bg-card"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                width: '3000px',
                height: '2000px',
              }}
            >
              <div className="relative w-full h-full">
                <ConnectionLines 
                  connections={connections} 
                  focusedPersonId={focusedPersonId}
                />
                {people.map((person) => (
                  <PersonTile
                    key={person.id}
                    person={person}
                    isSelected={selectedPersonId === person.id}
                    onClick={() => onSelectPerson(person.id)}
                  />
                ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

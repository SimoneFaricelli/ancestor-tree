import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { PersonTile } from './PersonTile';
import { ConnectionLines } from './ConnectionLines';
import { Person } from '@/types/FamilyTree';
import { ZoomIn, ZoomOut, RotateCcw, RefreshCw, Crosshair } from 'lucide-react';
import { Button } from './ui/button';
import { useRef, useEffect } from 'react';

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
  onRefresh?: () => void;
}

export const FamilyCanvas = ({
  people,
  connections,
  selectedPersonId,
  focusedPersonId,
  onSelectPerson,
  onRefresh,
}: FamilyCanvasProps) => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  const handleCenterOnSelected = () => {
    if (!focusedPersonId || !transformRef.current) return;
    const selectedPerson = people.find(p => p.id === focusedPersonId);
    if (!selectedPerson) return;

    const { setTransform } = transformRef.current;
    // Center the view on the selected person
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 64; // minus header
    const scale = 1;
    const x = -(selectedPerson.x - viewportWidth / 2);
    const y = -(selectedPerson.y - viewportHeight / 2);
    setTransform(x, y, scale, 300);
  };

  const handleRefresh = () => {
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
    onRefresh?.();
  };

  // Center on selected when focusedPersonId changes
  useEffect(() => {
    if (focusedPersonId) {
      setTimeout(() => handleCenterOnSelected(), 100);
    }
  }, [focusedPersonId]);

  return (
    <div className="w-full h-full canvas-background relative overflow-hidden">
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.1}
        maxScale={3}
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
              <Button
                variant="secondary"
                size="icon"
                onClick={handleRefresh}
                className="bg-card/80 backdrop-blur-sm hover:bg-card"
                title="Refresh canvas"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCenterOnSelected}
                className="bg-card/80 backdrop-blur-sm hover:bg-card"
                title="Centra sulla tile selezionata"
                disabled={!focusedPersonId}
              >
                <Crosshair className="w-4 h-4" />
              </Button>
            </div>

            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                width: '6000px',
                height: '4000px',
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
                    isVisible={true}
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
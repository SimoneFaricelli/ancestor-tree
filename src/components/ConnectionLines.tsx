import { Person } from '@/types/FamilyTree';

interface Connection {
  from: Person;
  to: Person;
  type: 'parent-child' | 'partner' | 'sibling';
}

interface ConnectionLinesProps {
  connections: Connection[];
  focusedPersonId: string | null;
}

export const ConnectionLines = ({ connections, focusedPersonId }: ConnectionLinesProps) => {
  const getPath = (from: Person, to: Person, type: Connection['type']) => {
    const fromX = from.x;
    const fromY = from.y;
    const toX = to.x;
    const toY = to.y;

    if (type === 'parent-child') {
      // Vertical curved line for parent-child
      const midY = (fromY + toY) / 2;
      return `M ${fromX} ${fromY + 48} Q ${fromX} ${midY}, ${(fromX + toX) / 2} ${midY} Q ${toX} ${midY}, ${toX} ${toY - 48}`;
    } else if (type === 'partner') {
      // Horizontal line with slight curve for partners
      const midX = (fromX + toX) / 2;
      return `M ${fromX + 80} ${fromY} Q ${midX} ${fromY - 20}, ${toX - 80} ${toY}`;
    } else {
      // Sibling connection
      const midX = (fromX + toX) / 2;
      return `M ${fromX + 80} ${fromY} L ${midX} ${fromY - 30} L ${toX - 80} ${toY}`;
    }
  };

  const getStrokeColor = (type: Connection['type']) => {
    switch (type) {
      case 'parent-child':
        return 'hsl(var(--connection-line))';
      case 'partner':
        return 'hsl(330, 81%, 60%)';
      case 'sibling':
        return 'hsl(199, 89%, 48%)';
      default:
        return 'hsl(var(--connection-line))';
    }
  };

  return (
    <svg 
      className="absolute pointer-events-none" 
      style={{ 
        zIndex: 0, 
        left: 0, 
        top: 0, 
        width: '6000px', 
        height: '4000px',
        overflow: 'visible'
      }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {connections.map((conn, index) => {
        const isActive = focusedPersonId === conn.from.id || focusedPersonId === conn.to.id;
        return (
          <path
            key={`${conn.from.id}-${conn.to.id}-${index}`}
            d={getPath(conn.from, conn.to, conn.type)}
            stroke={getStrokeColor(conn.type)}
            strokeWidth={isActive ? 3 : 2}
            strokeOpacity={isActive ? 1 : 0.5}
            fill="none"
            strokeLinecap="round"
            filter={isActive ? 'url(#glow)' : undefined}
            className="transition-all duration-500"
          />
        );
      })}
    </svg>
  );
};

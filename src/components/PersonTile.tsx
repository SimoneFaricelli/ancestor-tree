import { Person } from '@/types/FamilyTree';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface PersonTileProps {
  person: Person;
  isSelected: boolean;
  onClick: () => void;
  isVisible: boolean;
}

export const PersonTile = ({ person, isSelected, onClick, isVisible }: PersonTileProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');
  const isMale = person.gender === 'male';
  
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to trigger enter animation
      requestAnimationFrame(() => {
        setAnimationClass('animate-tile-enter');
      });
    } else {
      setAnimationClass('animate-tile-exit');
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', { year: 'numeric' });
  };

  const birthYear = formatDate(person.birthDate);
  const deathYear = person.deathDate ? formatDate(person.deathDate) : null;
  const lifespan = birthYear ? (deathYear ? `${birthYear} - ${deathYear}` : `${birthYear}`) : '';

  if (!shouldRender) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'absolute w-40 h-24 rounded-xl cursor-pointer',
        'flex flex-col items-center justify-center p-3 gap-1',
        'shadow-lg backdrop-blur-sm border border-foreground/10',
        isMale ? 'tile-male' : 'tile-female',
        isSelected && 'tile-selected animate-pulse-glow',
        'tile-hover',
        animationClass
      )}
      style={{
        left: person.x,
        top: person.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-background/30 flex items-center justify-center overflow-hidden border-2 border-foreground/20">
        {person.avatar ? (
          <img 
            src={person.avatar} 
            alt={person.firstName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-foreground/80" />
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground truncate max-w-[130px]">
          {person.firstName || 'Nome'} {person.lastName || 'Cognome'}
        </p>
        {lifespan && (
          <p className="text-xs text-foreground/70">{lifespan}</p>
        )}
      </div>
    </div>
  );
};

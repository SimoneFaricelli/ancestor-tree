import { Person, Gender } from '@/types/FamilyTree';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Upload, Link } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PersonalTabProps {
  person: Person;
  onUpdate: (updates: Partial<Person>) => void;
}

export const PersonalTab = ({ person, onUpdate }: PersonalTabProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdate({ avatar: event.target?.result as string });
        setIsDialogOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrl = () => {
    if (imageUrl) {
      onUpdate({ avatar: imageUrl });
      setImageUrl('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Avatar */}
      <div className="flex justify-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="group relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer">
              {person.avatar ? (
                <img
                  src={person.avatar}
                  alt={person.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-foreground" />
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Cambia avatar</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="upload">Carica</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-4">
                <div className="flex flex-col items-center gap-4 py-4">
                  <Label
                    htmlFor="avatar-upload"
                    className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Clicca per caricare
                    </span>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </TabsContent>
              <TabsContent value="url" className="space-y-4">
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://esempio.com/immagine.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="bg-input border-border"
                    />
                    <Button onClick={handleImageUrl} size="sm">
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-muted-foreground text-xs uppercase tracking-wide">
            Nome
          </Label>
          <Input
            id="firstName"
            value={person.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-muted-foreground text-xs uppercase tracking-wide">
            Cognome
          </Label>
          <Input
            id="lastName"
            value={person.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            className="bg-input border-border"
          />
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs uppercase tracking-wide">
          Sesso
        </Label>
        <RadioGroup
          value={person.gender}
          onValueChange={(value: Gender) => onUpdate({ gender: value })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" className="border-tile-male text-tile-male" />
            <Label htmlFor="male" className="cursor-pointer">Maschio</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" className="border-tile-female text-tile-female" />
            <Label htmlFor="female" className="cursor-pointer">Femmina</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Birth Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthDate" className="text-muted-foreground text-xs uppercase tracking-wide">
            Data di nascita
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={person.birthDate}
            onChange={(e) => onUpdate({ birthDate: e.target.value })}
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthCity" className="text-muted-foreground text-xs uppercase tracking-wide">
            Città di nascita
          </Label>
          <Input
            id="birthCity"
            value={person.birthCity}
            onChange={(e) => onUpdate({ birthCity: e.target.value })}
            className="bg-input border-border"
          />
        </div>
      </div>

      {/* Death Date */}
      <div className="space-y-2">
        <Label htmlFor="deathDate" className="text-muted-foreground text-xs uppercase tracking-wide">
          Data di morte (opzionale)
        </Label>
        <Input
          id="deathDate"
          type="date"
          value={person.deathDate || ''}
          onChange={(e) => onUpdate({ deathDate: e.target.value || undefined })}
          className="bg-input border-border"
        />
      </div>
    </div>
  );
};

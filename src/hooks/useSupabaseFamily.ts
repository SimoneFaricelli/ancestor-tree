import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Person } from '@/types/FamilyTree';

interface AncestorTree {
  id: string;
  user_id: string;
  name: string;
  people: Record<string, Person>;
  created_at: string;
  updated_at: string;
}

export function useSupabaseFamily() {
  const [treeId, setTreeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Resetta treeId quando cambia l'utente
  useEffect(() => {
    setTreeId(null);
    setLoading(true);
  }, [user?.id]);

  // Carica l'albero genealogico dal database
  const loadFamilyTree = useCallback(async (): Promise<Record<string, Person> | null> => {
    if (!user) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ancestor_trees')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se non esiste ancora un albero, ritorna null (verrà creato al primo salvataggio)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      if (data) {
        setTreeId(data.id);
        return data.people || {};
      }

      return null;
    } catch (error: any) {
      console.error('Errore caricamento albero:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Salva l'albero genealogico sul database
  const saveFamilyTree = useCallback(async (people: Record<string, Person>): Promise<boolean> => {
    if (!user) return false;

    try {
      setSaving(true);

      if (treeId) {
        // Aggiorna l'albero esistente
        const { error } = await supabase
          .from('ancestor_trees')
          .update({
            people,
            updated_at: new Date().toISOString(),
          })
          .eq('id', treeId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Crea un nuovo albero
        const { data, error } = await supabase
          .from('ancestor_trees')
          .insert({
            user_id: user.id,
            name: 'Il mio albero genealogico',
            people,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTreeId(data.id);
        }
      }

      return true;
    } catch (error: any) {
      console.error('Errore salvataggio albero:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, treeId]);

  // Cancella l'albero genealogico
  const deleteFamilyTree = useCallback(async (): Promise<boolean> => {
    if (!user || !treeId) return false;

    try {
      const { error } = await supabase
        .from('ancestor_trees')
        .delete()
        .eq('id', treeId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTreeId(null);
      return true;
    } catch (error: any) {
      console.error('Errore eliminazione albero:', error);
      return false;
    }
  }, [user, treeId]);

  return {
    loading,
    saving,
    loadFamilyTree,
    saveFamilyTree,
    deleteFamilyTree,
  };
}

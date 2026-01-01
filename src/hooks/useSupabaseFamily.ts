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

  // Resetta treeId quando cambia l'utente (ma NON il loading)
  useEffect(() => {
    if (user) {
      setTreeId(null);
    }
  }, [user?.id]);

  // Carica l'albero genealogico dal database
  const loadFamilyTree = useCallback(async (): Promise<Record<string, Person> | null> => {
    if (!user) {
      console.log('❌ [DB] Nessun utente loggato');
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      console.log('🔍 [DB] Query database per user_id:', user.id);
      const { data, error } = await supabase
        .from('ancestor_trees')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se non esiste ancora un albero, ritorna null (verrà creato al primo salvataggio)
        if (error.code === 'PGRST116') {
          console.log('⚠️ [DB] Nessun record trovato nel database (codice PGRST116)');
          return null;
        }
        console.error('❌ [DB] Errore query:', error);
        throw error;
      }

      if (data) {
        console.log('✅ [DB] Record trovato! ID:', data.id, '| Persone nel record:', data.people ? Object.keys(data.people).length : 0);
        setTreeId(data.id);
        return data.people || {};
      }

      console.log('⚠️ [DB] Data è null');
      return null;
    } catch (error: any) {
      console.error('❌ [DB] Errore caricamento albero:', error);
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
      console.log('💾 [DB] Inizio salvataggio. TreeId:', treeId, '| Persone da salvare:', Object.keys(people).length);

      // Se abbiamo già un treeId, aggiorna
      if (treeId) {
        console.log('📝 [DB] UPDATE record esistente:', treeId);
        const { error } = await supabase
          .from('ancestor_trees')
          .update({
            people,
            updated_at: new Date().toISOString(),
          })
          .eq('id', treeId)
          .eq('user_id', user.id);

        if (error) throw error;
        console.log('✅ [DB] Record aggiornato con successo');
      } else {
        // Prima controlla se esiste già un record per questo utente
        console.log('🔍 [DB] Controllo se esiste già un record per questo utente');
        const { data: existingTree, error: checkError } = await supabase
          .from('ancestor_trees')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingTree) {
          // Esiste già, aggiorna quello
          console.log('📝 [DB] Record esistente trovato, UPDATE:', existingTree.id);
          setTreeId(existingTree.id);
          const { error } = await supabase
            .from('ancestor_trees')
            .update({
              people,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingTree.id)
            .eq('user_id', user.id);

          if (error) throw error;
          console.log('✅ [DB] Record aggiornato con successo');
        } else {
          // Non esiste, crea un nuovo albero
          console.log('➕ [DB] Nessun record esistente, INSERT nuovo');
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
            console.log('✅ [DB] Nuovo record creato con ID:', data.id);
            setTreeId(data.id);
          }
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

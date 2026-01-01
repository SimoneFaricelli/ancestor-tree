# Autenticazione Supabase

Questa applicazione utilizza Supabase per l'autenticazione degli utenti.

## Setup

### 1. Variabili d'ambiente

Crea un file `.env` nella root del progetto con le seguenti variabili:

```env
VITE_SUPABASE_URL=https://ufhsvpvnoyrroumgeloc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_DFLgLI0xxJCsDzAiH6Bmrw_fBjfyP9b
```

Queste chiavi sono condivise con l'applicazione **client-manager**.

### 2. Installazione dipendenze

```bash
npm install
```

### 3. Avvio applicazione

```bash
npm run dev
```

## Funzionalità

- **Login**: Pagina di accesso con email e password (`/login`)
- **Protezione delle route**: La home (`/`) è accessibile solo dopo il login
- **Logout**: Pulsante di disconnessione nell'header
- **Redirect automatico**: Se già loggato, `/login` reindirizza alla home
- **Sessione persistente**: La sessione rimane attiva anche dopo il refresh

## Credenziali di test

Utilizza le stesse credenziali dell'applicazione client-manager per accedere.

## Struttura file

- `src/lib/supabase.ts` - Client Supabase
- `src/hooks/useAuth.ts` - Hook per gestire autenticazione
- `src/components/ProtectedRoute.tsx` - Componente per proteggere le route
- `src/pages/Login.tsx` - Pagina di login
- `src/App.tsx` - Configurazione route con protezione

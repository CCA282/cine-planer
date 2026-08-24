# CinéPlanner

Planificateur de séances Pathé : choisis tes cinémas à proximité, les films que tu veux voir, tes
préférences de rythme et de trajet — l'app génère plusieurs plannings de journée qui maximisent le
nombre de films vus, timing et trajets inclus.

100% front-end : aucune base de données, aucun compte. Tout est stocké dans le `localStorage` du
navigateur (préférences, films vus, historique des plannings).

## Fonctionnalités

- Géolocalisation → liste des cinémas Pathé à proximité (recherche manuelle possible aussi)
- Sélection multi-cinémas et multi-films, avec affiches et infos réelles
- Préférences réutilisables : rythme des séances (large / standard / serré), tolérance aux
  trajets, mode de transport
- Algorithme de planification (recherche exacte par masque de bits) qui génère plusieurs
  combinaisons possibles, classées par nombre de films puis par confort
- Historique des plannings clôturés + suivi des films déjà vus

## Démarrer

```bash
npm install
npm run dev
```

L'app tourne en **mode démo** par défaut (voir plus bas) : aucune configuration n'est nécessaire
pour l'essayer.

## Sources de données — et leurs limites

Pathé n'a pas d'API publique officielle. Cette app s'appuie sur les endpoints JSON non-documentés
utilisés par pathe.fr lui-même :

| Endpoint | Contenu | Utilisé pour |
| --- | --- | --- |
| `/api/cinemas` | Liste des 68 cinémas Pathé (nom, adresse, GPS) | Sélection par proximité (figé dans `src/data/cinemas.json`, un snapshot suffit — la liste des cinémas change rarement) |
| `/api/shows` | Catalogue des films (titre, affiche, synopsis, durée, genres…) | Fiches films (snapshot dans `src/data/films.json`, rafraîchi en live si le relai est configuré) |
| `/api/cinema/{slug}/shows` | Pour chaque film, les jours où il est réellement programmé dans ce cinéma | Disponibilité réelle par cinéma/jour (nécessite le relai, voir ci-dessous) |

**Ce qui n'a pas été trouvé** : un endpoint public donnant l'horaire exact d'une séance (ex. "16h30
salle 4"). Seule la disponibilité au niveau du jour est exposée. Les horaires précis affichés dans
l'app sont donc **simulés** (générés de façon déterministe à partir de la durée réelle du film —
voir `src/lib/showtimeSynth.ts`) : réalistes et stables entre deux rechargements, mais ce ne sont
pas les vraies séances Pathé. Si Pathé expose un jour cet endpoint, seul `showtimeSynth.ts` est à
remplacer, le reste de l'app (algorithme, UI) n'a pas besoin de changer.

### CORS

Ces endpoints n'envoient pas de header `Access-Control-Allow-Origin` : un navigateur ne peut pas
les appeler directement depuis un autre domaine. Pour rester "juste un front" sans base de données
ni logique métier côté serveur, ce repo inclut un **relai CORS minimal** (`worker/`, Cloudflare
Worker gratuit) qui ne fait que transmettre les requêtes à pathe.fr en ajoutant les headers CORS.

### Mode démo vs mode live

- **Sans relai configuré (par défaut)** : la liste des cinémas et le catalogue de films sont réels
  (bundlés dans `src/data/`, avec vraies affiches). Le programme par cinéma (quels films y jouent)
  est simulé de façon déterministe par cinéma.
- **Avec relai configuré** (`VITE_API_PROXY_URL` dans `.env`, voir `.env.example`) : le programme
  par cinéma/jour vient réellement de Pathé. Les horaires précis restent simulés (cf. ci-dessus).

Déployer le relai :

```bash
cd worker
npm install
npx wrangler login   # compte Cloudflare gratuit
npm run deploy
```

Puis renseigner l'URL affichée dans `.env` (`VITE_API_PROXY_URL=...`).

## Algorithme de planification

Pour une date et un rythme donnés :

- **Large** : tu arrives à l'heure annoncée (bandes-annonces incluses), il faut ≥20 min de battement après une séance dans le même cinéma pour la suivante.
- **Standard** : pareil mais ≥10 min de battement.
- **Serré** : tu arrives 15 min après l'heure annoncée (fin des bandes-annonces), ce qui permet d'enchaîner une séance qui se termine à la même heure où la suivante démarre, dans le même cinéma.

Les trajets entre cinémas sont estimés à vol d'oiseau (× 1,3 pour approx. la route) avec une
vitesse effective par mode de transport (vélo/transports/voiture) — aucune API de routing n'est
utilisée, donc c'est une approximation, présentée comme telle dans l'UI.

L'algorithme fait une recherche exacte par masque de bits sur les films sélectionnés (≤ 14) pour
trouver la meilleure combinaison de séances compatibles, puis renvoie les meilleures options
distinctes (nombre de films décroissant, puis confort).

## Stack

Vite + React + TypeScript + Tailwind CSS v4 + React Router (`HashRouter`, pour un déploiement
statique sans configuration serveur). Aucune dépendance runtime lourde.

## Déploiement

N'importe quel hébergeur de fichiers statiques (Cloudflare Pages, Netlify, Vercel, GitHub Pages
avec un dépôt public…) :

```bash
npm run build   # -> dist/
```

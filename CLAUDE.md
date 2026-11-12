# Site MCU : note de passation pour Claude Code

Site de fans non officiel qui présente les films et séries Marvel dans l'ordre de leur histoire, avec notes, commentaires, tier list, fiches personnages et une page « Avancée ». Domaine visé : **mcuclassement.fr** (acheté chez IONOS). Le propriétaire écrit en français et tutoie. Ce fichier est publié avec le dépôt : n'y écris ni son nom ni ses coordonnées.

Le projet est né dans Claude (chat), comme page hébergée « artefact ». Il quitte maintenant cet environnement : lis la section **Persistance, et ce qui ne marche plus hors de Claude** avant de toucher à quoi que ce soit.

## Structure

- `index.html` : tout le site, en un seul fichier (HTML + CSS + JS sans bibliothèque, sans build). Environ 2 200 lignes.
- `images/` : affiches des titres (`images/<id>.<ext>`). `images/personnages/` : portraits (`images/personnages/<id>.<ext>`). Deux dossiers parce que `wanda`, `vision` et `groot` sont à la fois un titre et un personnage. `NOMS-DES-FICHIERS.csv` donne le dossier et l'identifiant de chaque image possible.
- `images/liste.json` : gabarit Liquid que GitHub Pages (Jekyll) transforme en liste JSON des fichiers du site à chaque publication. En local il n'est pas transformé, et le site retombe sur un essai nom par nom.
- `_config.yml` : seulement pour Jekyll (exclut `CLAUDE.md`, `README.md` et le CSV du site publié). Ne remets pas de `.nojekyll` : il casserait `liste.json`.
- `404.html` (renvoie `/classement` vers `/#classement`, le reste vers l'accueil), `favicon.svg` (l'anneau de l'en-tête), `CNAME` (`mcuclassement.fr`).
- `README.md` : guide pour le propriétaire, dont la mise en ligne pas à pas avec les valeurs DNS vérifiées.

Dans `index.html`, de haut en bas : jetons CSS (`:root`), styles, balisage des pages (`<section id="v-...">`), puis un seul `<script>` en fonction anonyme :

| Bloc | Rôle |
|---|---|
| `PAL`, `ERAS`, `T`, `CH` | Données : palettes, époques, titres (`F(...)` film, `Z(...)` série/animation/spécial), personnages (`C(...)`) |
| `S`, `D`, `W` | État de l'interface, données (notes, tier lists), files d'écriture |
| `loadLocal`, `saveLocal`, `commit`, `pump`, `subscribe`, `boot` | **Toute la persistance** passe par là |
| `render*`, `*HTML` | Un rendu par page ; `render()` redessine la page active |
| `ACT` | Gestionnaire de clics, par attribut `data-act` |
| `runIntro` | Ouverture animée (anneau + barres), une fois par session |

Pages (routage par `location.hash`) : `#films`, `#tout` (Films + séries), `#classement`, `#personnages`, `#avancee`, `#compte`, `#cgu`, `#contact`.

## Données

- Ordre : chronologie officielle publiée par Marvel (octobre 2026), version Disney+. L'ordre du tableau `T` **est** la chronologie ; ne le trie pas.
- Choix du propriétaire : L'Incroyable Hulk (2008) est volontairement absent.
- Placés à la main, hors chronologie officielle (la fiche le précise) : Deadpool (juste après Civil War), Deadpool 2 (juste avant Infinity War), Spider-Man: Brand New Day (fin de la phase 6).
- `soon: 'AAAA-MM-JJ'` marque un film pas encore sorti (Avengers: Doomsday 2026-12-16, Secret Wars 2027-12-15) : il n'est ni notable ni compté dans les totaux.
- Les identifiants (`cap1`, `im1`, `av4`…) sont stables : ils servent de clés pour les notes et les images. Ne les renomme pas.

## Persistance, et ce qui ne marche plus hors de Claude

Dans Claude, la page recevait un objet `window.claude` avec trois services : `use('db')` (base de documents partagée), `use('user')` (compte Claude du visiteur), `use('assets')` (stockage d'images). Hors de Claude, `window.claude` n'existe pas : le code retombe tout seul en **mode local** (`S.mode === 'local'`).

Conséquences concrètes sur un hébergement ordinaire :

1. **Les notes, commentaires et tier lists restent dans `localStorage`** (clés `marathon.v1`, `marathon.view`, `marathon.guest`; `sessionStorage` : `marathon.intro`). Chaque visiteur ne voit que les siens, sur son appareil.
2. **Il n'y a plus de notes partagées entre amis, ni de moyenne du groupe, ni de « Derniers avis »**. Ces écrans existent dans le code mais restent vides.
3. **Il n'y a pas de vraie connexion.** En mode local, la page « Compte » l'explique et propose une **sauvegarde** : « Télécharger mes notes » (fichier JSON `{app:'mcuclassement', v:1, at, r, t}`, avec `r` et `t` comme `D.lr` et `D.lt`) et « Restaurer une sauvegarde » (fusion : pour chaque titre, l'avis le plus récent l'emporte ; voir `restoreBackup`).
4. **Les 82 images importées dans Claude** (adressées par `/_blob/<id>`) ne sont pas récupérables. Hors de Claude, les images viennent du dossier : `artCache` (cache `localStorage` `marathon.art`, affiché tout de suite), puis `scanArt` au repos : `listArt` lit `images/liste.json`, sinon `probeFiles` essaie `webp`, `jpg`, `jpeg`, `png` pour chaque identifiant (en ligne, au plus toutes les dix minutes). En mode local, `D.art` contient des chemins (`images/im1.webp`) ; `artImg` accepte les deux formes. Un fichier qui ne se charge pas retombe sur l'affiche typographique (`artBad`).
5. **Contact** : les coordonnées sont en dur dans la constante `CONTACT` de `index.html` (vide tant que le propriétaire ne les a pas données ; la page dit alors qu'elles ne sont pas renseignées). Le formulaire réservé au propriétaire ne sert plus que dans Claude.
6. **CGU** : réécrites pour le site en ligne (aucun compte, notes dans le navigateur, hébergement GitHub Pages, police Google Fonts, pas de cookie ni de mesure d'audience). Si tu ajoutes un back-end, un outil de statistiques ou autre chose qui collecte des données, **mets les CGU à jour en même temps**.

Les textes qui parlent du « groupe » restent dans les branches du mode partagé (`shared()`), inatteignables hors de Claude ; ils resserviront si un back-end partagé est ajouté.

Format des documents de l'ancienne base, utile si tu construis un back-end :
- `reviews/{userId}` : `{v:1, t, nick?, films:{ <id>:{ r:0..5 par demi-point, c:commentaire≤800, s:vu, t:horodatage } }}`
- `tiers/{userId}` : `{v:1, t, rows:{ S:[ids], A:[…], B:[…], C:[…], D:[…] }}`
- `art/all` : `{v:1, at, t:{ <filmId>:<assetId> }, c:{ <persoId>:<assetId> }}`
- `site/contact` : `{name, email, more}`

Les fonctions `commit`, `pump`, `subscribe`, `boot`, `migrate`/`demote` isolent cette couche : brancher un autre back-end se fait là, sans toucher à l'interface.

## État et suite

Fait (novembre 2026) : images en dossier, CGU réécrites, textes visibles sans mention de Claude ni du « groupe », sauvegarde des notes, `404.html`, favicon, balises meta, `CNAME`, guide de mise en ligne dans `README.md` (valeurs DNS vérifiées dans la documentation de GitHub et d'IONOS en novembre 2026).

Reste à faire :
1. **Décision du propriétaire** : en novembre 2026, il attend un avis juridique (nom de domaine, sigle « MCU », affiches) avant de rendre le site public. Le dépôt GitHub reste **privé** et GitHub Pages **désactivé** tant qu'il ne l'a pas dit lui-même.
2. **Coordonnées** : remplir `CONTACT` avec ce que le propriétaire donne, avant d'activer GitHub Pages. Ne les invente pas, et n'utilise pas son adresse personnelle sans son accord explicite : le site sera public.
3. **Mise en ligne** : suivre `README.md`. Après la première publication, vérifier que `https://mcuclassement.fr/images/liste.json` renvoie bien une liste JSON (sinon le site retombe sur l'essai nom par nom, plus lent).
4. **Notes partagées et vraie connexion** (si le propriétaire le veut) : un service tiers avec comptes et base de données (Supabase, Firebase…), branché dans la couche de persistance. Le propriétaire a d'abord voulu que les notes de chacun restent privées, puis publiques entre amis : **demande-lui** avant de choisir les règles de lecture. Mets les CGU à jour en même temps.

## Ce qu'il ne faut pas changer sans demander

- **Direction visuelle** : fond rouge Marvel sombre (jetons `--bg`, `--glowa`, `--glowb`…), police Archivo variable chargée depuis Google Fonts (axe de largeur), en-tête en pastille flottante, affiches typographiques en dégradé, survol qui soulève et incline l'affiche, rangée de films défilante avec flèches et bouton « Tout afficher », onglet Avancée (films gris tant qu'ils ne sont pas notés), ouverture animée une fois par session (désactivée si l'appareil demande moins d'animations).
- **Nom affiché** : « MCU » dans l'en-tête et le titre de la page ; titre de l'accueil « Marvel Cinematic Universe », sans paragraphe dessous.
- **Contenu protégé** : le site n'embarque aucune affiche officielle ni image de personnage. Chaque film a une affiche typographique originale ; les vraies images ne viennent que de ce que le propriétaire ajoute lui-même, sous sa responsabilité. Ne télécharge et n'ajoute pas d'images de Marvel/Disney. Si un jour le site est ouvert au public, signale au propriétaire que le nom de domaine, le sigle « MCU » et d'éventuelles affiches peuvent poser un risque de droits : c'est à lui de trancher, avec un avis juridique.
- **Style des textes** : français, tutoiement, phrases courtes, apostrophes typographiques (’) et guillemets « », pas de points d'exclamation.

## Tester

Pas de build, pas de dépendances : `python3 -m http.server` dans le dossier, puis ouvrir `http://localhost:8000`. Pour simuler la plateforme Claude, injecter un faux `window.claude` avant le chargement de la page (c'est ce qui a servi aux essais avec Playwright). Vérifier au minimum à 1440 px, 820 px et 390 px, et au clavier.

En local, la console affiche une erreur 404 par image absente : c'est l'essai nom par nom, normal sans `liste.json` transformé. Pour tester les images, crée des fichiers factices (jamais d'image Marvel ou Disney) et **supprime-les avant de publier**. Vide `marathon.art` dans `localStorage` pour forcer une nouvelle recherche.

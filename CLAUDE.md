# Site MCU : note de passation pour Claude Code

Site de fans non officiel qui présente les films et séries Marvel dans l'ordre de leur histoire, avec notes, commentaires, tier list, fiches personnages et une page « Avancée ». Domaine visé : **mcuclassement.fr** (acheté chez IONOS). Le propriétaire écrit en français et tutoie. Ce fichier est publié avec le dépôt : n'y écris ni son nom ni ses coordonnées.

Le projet est né dans Claude (chat), comme page hébergée « artefact ». Il a quitté cet environnement : lis les sections **Persistance, et ce qui ne marche plus hors de Claude** et **Comptes (Firebase)** avant de toucher à quoi que ce soit.

## Structure

- `index.html` : tout le site, en un seul fichier (HTML + CSS + JS sans bibliothèque, sans build). Environ 2 850 lignes.
- `firestore.rules` : règles de sécurité de la base des comptes. Elles ne sont pas déployées toutes seules : le propriétaire les colle dans la console Firebase. Si tu changes la forme des documents ou `FEED_MAX`, change-les aussi, et dis-lui de les republier.
- `tests/serveur-essai.py` et `tests/faux-firebase/` : serveur d'essai et faux SDK Firebase (voir **Tester**).
- `images/` : affiches des titres (`images/<id>.<ext>`). `images/personnages/` : portraits (`images/personnages/<id>.<ext>`). Deux dossiers parce que `wanda`, `vision` et `groot` sont à la fois un titre et un personnage. `NOMS-DES-FICHIERS.csv` donne le dossier et l'identifiant de chaque image possible. Les affiches sont en JPEG 480 × 720, environ 100 Ko chacune : à l'écran, une affiche fait au plus 186 px de large. Pour en réduire une : `sips -Z 720 -s format jpeg -s formatOptions 80 --matchTo '/System/Library/ColorSync/Profiles/sRGB Profile.icc' <source> --out images/<id>.jpg`.
- `images/liste.json` : gabarit Liquid que GitHub Pages (Jekyll) transforme en liste JSON des fichiers du site à chaque publication. En local il n'est pas transformé, et le site retombe sur un essai nom par nom.
- `_config.yml` : seulement pour Jekyll (exclut du site publié `CLAUDE.md`, `README.md`, le CSV, `firestore.rules` et `tests`). Ne remets pas de `.nojekyll` : il casserait `liste.json`.
- `fonts/archivo-latin.woff2` : la police Archivo variable (graisse 100 à 900, largeur 62 à 125 %), jeu latin de Google Fonts, hébergée avec le site depuis le 18 novembre 2026 ; droits et licence dans `fonts/LICENCE.txt`. Un caractère hors de ce jeu (rare, dans un pseudo ou un commentaire) s'affiche dans la police de secours.
- `404.html` (renvoie `/classement` vers `/#classement`, le reste vers l'accueil), `favicon.svg` (l'anneau de l'en-tête), `CNAME` (`mcuclassement.fr`).
- `README.md` : guide pour le propriétaire, dont la mise en ligne pas à pas avec les valeurs DNS vérifiées.

Dans `index.html`, de haut en bas : jetons CSS (`:root`), styles, balisage des pages (`<section id="v-...">`), puis un seul `<script>` en fonction anonyme :

| Bloc | Rôle |
|---|---|
| `PAL`, `ERAS`, `T`, `CH` | Données : palettes, époques, titres (`F(...)` film, `Z(...)` série/animation/spécial), personnages (`C(...)`) |
| `S`, `D`, `W` | État de l'interface, données (notes, tier lists), files d'écriture |
| `loadLocal`, `saveLocal`, `commit`, `pump`, `subscribe`, `boot` | **Toute la persistance** passe par là |
| `FB`, `enterAccount`, `leaveAccount`, `listenAccount`, `applyMine`, `applyOthers`, `onAuth`, `startFirebase` | Comptes Firebase : connexion, synchronisation, avis des inscrits |
| `FIREBASE`, `SIGNIN`, `FB_SDK`, `FEED_MAX`, `CONTACT` | Réglages du site, regroupés juste avant `renderContact` |
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

1. **Sans compte, les notes, commentaires et tier lists restent dans `localStorage`** (clés `marathon.v1`, `marathon.view`, `marathon.guest`, `marathon.art`, et `marathon.acct` pour la copie du compte ouvert ; `sessionStorage` : `marathon.intro`). Chaque visiteur ne voit que les siens, sur son appareil.
2. **Les notes partagées, la moyenne et les « Derniers avis » ne reviennent qu'avec un compte Firebase** (section suivante). Tant que `FIREBASE.apiKey` est vide, ces écrans restent vides et le site est en mode local.
3. **Sauvegarde** : la page « Compte » propose « Télécharger mes notes » (fichier JSON `{app:'mcuclassement', v:1, at, r, t}`, avec `r` et `t` comme `myDoc()` et `myTier()`) et « Restaurer une sauvegarde » (fusion : pour chaque titre, l'avis le plus récent l'emporte ; voir `restoreBackup`). Les deux marchent avec ou sans compte.
4. **Les 82 images importées dans Claude** (adressées par `/_blob/<id>`) ne sont pas récupérables. Hors de Claude, les images viennent du dossier : `artCache` (cache `localStorage` `marathon.art`, affiché tout de suite), puis `scanArt` au repos : `listArt` lit `images/liste.json`, sinon `probeFiles` essaie `webp`, `jpg`, `jpeg`, `png` pour chaque identifiant (en ligne, au plus toutes les dix minutes). En mode local, `D.art` contient des chemins (`images/im1.webp`) ; `artImg` accepte les deux formes. Un fichier qui ne se charge pas retombe sur l'affiche typographique (`artBad`).
5. **Contact** : les coordonnées sont en dur dans la constante `CONTACT` de `index.html` (vide tant que le propriétaire ne les a pas données ; la page dit alors qu'elles ne sont pas renseignées). Le formulaire réservé au propriétaire ne sert plus que dans Claude.
6. **CGU** : elles ont deux variantes dans le balisage, marquées `data-if="noacct"` et `data-if="acct"`. `flagAccounts` affiche celle qui correspond au site, selon que `FIREBASE.apiKey` est rempli ou non ; les titres sont numérotés par un compteur CSS. Si tu ajoutes un outil de statistiques ou autre chose qui collecte des données, **mets les deux variantes à jour en même temps**.
7. **Cookies** : pas de bandeau, et c'est voulu. Ce que le site range dans le navigateur (notes, réglages d'affichage, connexion) est exempté de consentement par la CNIL, et un visiteur sans compte ne contacte aucun service tiers : la police est dans `fonts/`, et Firebase n'est chargé qu'à la demande. Le jour où s'ajoutent des statistiques, de la publicité, des vidéos intégrées ou des boutons de réseaux sociaux, il faut un bandeau de consentement (« Tout refuser » aussi simple que « Tout accepter ») et les deux variantes des CGU à jour : demande d'abord au propriétaire.

Format des documents, le même dans l'ancienne base et dans Firestore :
- `reviews/{userId}` : `{v:1, t, nick?, films:{ <id>:{ r:0..5 par demi-point, c:commentaire≤800, s:vu, t:horodatage } }}`
- `tiers/{userId}` : `{v:1, t, nick?, rows:{ S:[ids], A:[…], B:[…], C:[…], D:[…] }}`
- seulement dans Claude : `art/all` (`{v:1, at, t:{…}, c:{…}}`) et `site/contact` (`{name, email, more}`)

L'ancien chemin Claude (`bootClaude`, `subscribe`, `resolveProfiles`, envoi d'images, formulaire de contact) est conservé tel quel, inatteignable hors de Claude. Quelques textes y parlent encore du « groupe ».

## Comptes (Firebase)

Choix du propriétaire (16 novembre 2026) : Firebase ; les avis d'un compte sont visibles par **tous les inscrits** ; connexion par e-mail, Google et Apple. Seul l'e-mail est allumé. Google reste éteint (`SIGNIN.google`) : Google montre aux personnes qui se connectent l'adresse du compte qui gère le projet, et le propriétaire veut d'abord une adresse réservée au site. Apple reste éteint (`SIGNIN.apple`), parce qu'il faut un abonnement payant Apple Developer Program. Ne rallume aucun des deux sans lui.

Projet : `mcuclassement`, créé par le propriétaire le 18 novembre 2026 (connexion par e-mail, Firestore, règles publiées). Sa configuration est dans `FIREBASE`. La console donne aussi `measurementId` : Google Analytics est relié au projet, mais le site ne le charge pas, et ne doit pas le charger sans mettre à jour les CGU. Pour vérifier le projet sans compte : `https://identitytoolkit.googleapis.com/v1/projects?key=<apiKey>` liste les domaines autorisés, et une lecture de `reviews` par l'API REST de Firestore doit répondre 403.

- **Rien n'est actif tant que `FIREBASE.apiKey` est vide** : `boot` reste en mode local, et le SDK n'est pas chargé. Sinon `S.be === 'firebase'`, et `wakeFirebase` lance `startFirebase`, qui charge le SDK modulaire (v13.2.0) depuis gstatic par `import()`. Il ne le fait que si c'est utile : page Compte ouverte, copie d'un compte sur l'appareil (`marathon.acct`), ou connexion dans un autre onglet (événement `storage`). Un visiteur sans compte n'échange donc rien avec Google : ne remets pas de chargement systématique (voir **Cookies** plus haut).
- **Modes** : invité (`S.mode === 'local'`, notes dans `D.lr`) ; connecté (`shared()`, `S.me.key` = uid, notes dans `D.sr[uid]`). `onAuth` fait passer de l'un à l'autre par `enterAccount` / `leaveAccount`.
- **Copie locale du compte** (`marathon.acct`, `loadMirror` / `saveMirror`) : elle s'affiche avant que le service réponde et garde ce qui n'est pas encore parti. Elle est effacée à la déconnexion.
- **Jamais d'écriture avant la première lecture du serveur** : `W[kind].synced` passe à vrai au premier instantané venu du serveur (`!fromCache`), d'où `includeMetadataChanges` sur mes deux documents. Avant, `pump` attend (« Gardé sur cet appareil… »). Ne retire pas ce garde-fou : un appareil vide écraserait le compte.
- **Écritures en fusion** (`setDoc(…, {merge:true})`) et **jamais de table `films` vide** : Firestore remplace la table du serveur par une table vide. `applyMine` fusionne film par film, le plus récent l'emporte (`stamp` garantit un horodatage croissant), et renvoie ce que la mémoire a d'avance.
- **Avis des inscrits** : `listenAccount` lit les `FEED_MAX` (50) profils les plus récents de `reviews` et de `tiers`, pas toute la collection, pour tenir dans l'offre gratuite (50 000 lectures par jour). La moyenne et les derniers avis portent donc sur ces profils. Les règles refusent une liste de plus de 60 documents.
- **Échec d'écriture ou de lecture de mon document** : `demote` range les notes dans `D.lr` et le site continue en local ; « Réessayer » (`auth-resync`) rouvre le compte, puis l'utilisateur rajoute ses avis.
- **Nouveau compte** : `settleFresh` y range d'office le pseudo et ce qui était noté sur l'appareil. Connexion à un compte existant : on propose, on n'impose pas.
- **Suppression de compte** : nouvelle preuve d'identité, puis suppression des deux documents, puis du compte (`auth-delete`).
- **Page Compte** : `setHTML` ne redessine un bloc que si son contenu change, et jamais pendant une saisie ; les messages et l'état des boutons passent par `paintAuth`, sans toucher aux champs.
- Le nom Google n'est jamais repris comme pseudo : le pseudo est public, la personne le choisit. L'e-mail n'est jamais écrit dans Firestore.

Reste hors du code, à la charge du propriétaire : republier `firestore.rules` quand le fichier change, garder `mcuclassement.fr` dans les domaines autorisés, et modérer les commentaires. La marche à suivre est dans le README, « Comptes des visiteurs ».

## État et suite

Fait (novembre 2026) : images en dossier, CGU réécrites, textes visibles sans mention de Claude, sauvegarde des notes, `404.html`, favicon, balises meta, `CNAME`, guide de mise en ligne dans `README.md` (valeurs DNS vérifiées dans la documentation de GitHub et d'IONOS), puis les comptes Firebase, écrits sur la branche `comptes` et essayés avec le faux SDK. Le 18 novembre, le propriétaire a créé le vrai projet ; sa configuration est recopiée, et la page locale s'y connecte (vérifié sans ouvrir de compte). Le même jour, les affiches du propriétaire sont arrivées dans `images/` (voir « Contenu protégé »).

Reste à faire :
1. **Décision du propriétaire** : en novembre 2026, il attend un avis juridique (nom de domaine, sigle « MCU », affiches) avant de rendre le site public. Avec les comptes, cet avis doit aussi couvrir les données personnelles (e-mails, mineurs) et les commentaires publiés. Le dépôt GitHub reste **privé** et GitHub Pages **désactivé** tant qu'il ne l'a pas dit lui-même.
2. **Essais avec le vrai service**, faits par le propriétaire lui-même (tu ne crées pas de compte à sa place). Réussis le 18 novembre 2026 : inscription, e-mail de confirmation, note enregistrée dans `reviews`, déconnexion puis reconnexion, mot de passe oublié. Restent : deux appareils (ou deux navigateurs), suppression de compte, et les règles dans le « Rules Playground » de la console. Google aussi, le jour où il le rallume.
3. **Coordonnées** : remplir `CONTACT` avec ce que le propriétaire donne, avant d'activer GitHub Pages ou les comptes : c'est l'adresse des signalements. Ne les invente pas, et n'utilise pas son adresse personnelle sans son accord explicite : le site sera public.
4. **Mise en ligne** : suivre `README.md`. Après la première publication, vérifier que `https://mcuclassement.fr/images/liste.json` renvoie bien une liste JSON (sinon le site retombe sur l'essai nom par nom, plus lent).
5. **Si le site grandit** : au-delà de quelques dizaines d'inscrits actifs, la moyenne ne porte plus sur tout le monde, et les lectures gratuites peuvent manquer. Il faudra alors des totaux tenus à jour côté serveur, ce qui demande l'offre payante de Firebase : **demande au propriétaire** avant.

## Ce qu'il ne faut pas changer sans demander

- **Direction visuelle** : fond rouge Marvel sombre (jetons `--bg`, `--glowa`, `--glowb`…), police Archivo variable hébergée dans `fonts/` (axe de largeur), en-tête en pastille flottante, affiches typographiques en dégradé, survol qui soulève et incline l'affiche, rangée de films défilante avec flèches et bouton « Tout afficher », onglet Avancée (films gris tant qu'ils ne sont pas notés), ouverture animée une fois par session (désactivée si l'appareil demande moins d'animations).
- **Nom affiché** : « MCU » dans l'en-tête et le titre de la page ; titre de l'accueil « Marvel Cinematic Universe », sans paragraphe dessous.
- **Contenu protégé** : chaque titre a une affiche typographique originale. Les vraies images ne viennent que de ce que le propriétaire fournit lui-même, sous sa responsabilité. Le 18 novembre 2026, à sa demande, ses propres affiches (son dossier « Affiche Film Marvel » : affiches officielles et créations de fans) ont été réduites et rangées dans `images/`. Il les a choisies titre par titre, et les 79 titres en ont une ; What If…? saisons 2 et 3 et Daredevil: Born Again saison 2 reprennent l'affiche d'une autre saison, faute de mieux. Aucune image de personnage pour l'instant. Ne télécharge jamais toi-même d'image de Marvel/Disney. Avant toute ouverture au public, rappelle au propriétaire que le nom de domaine, le sigle « MCU » et ces affiches peuvent poser un risque de droits : c'est à lui de trancher, avec un avis juridique.
- **Style des textes** : français, tutoiement, phrases courtes, apostrophes typographiques (’) et guillemets « », pas de points d'exclamation.

## Tester

Pas de build, pas de dépendances : `python3 -m http.server` dans le dossier, puis ouvrir `http://localhost:8000`. Comme `FIREBASE` est rempli, cette page parle au **vrai** projet : n'y crée pas de compte, et passe par le serveur d'essai (plus bas) pour tout ce qui touche aux comptes. Après tes essais, efface `marathon.v1` : un compte créé ensuite dans le même navigateur récupère d'office les notes de l'appareil (`settleFresh`). Pour simuler la plateforme Claude, injecter un faux `window.claude` avant le chargement de la page (c'est ce qui a servi aux essais avec Playwright). Vérifier au minimum à 1440 px, 820 px et 390 px, et au clavier.

En local, la console affiche une erreur 404 par image absente : c'est l'essai nom par nom, normal sans `liste.json` transformé. Pour tester les images, crée des fichiers factices (jamais d'image Marvel ou Disney) et **supprime-les avant de publier**. Vide `marathon.art` dans `localStorage` pour forcer une nouvelle recherche.

**Comptes** : `python3 tests/serveur-essai.py`, puis `http://localhost:8002`. Ce serveur sert le site avec une fausse configuration et remplace le SDK par `tests/faux-firebase/` : faux comptes et fausse base dans le `localStorage` du navigateur, aucun réseau. Le faux SDK reprend la latence, `fromCache` / `hasPendingWrites`, la fusion de `setDoc` et des règles équivalentes à `firestore.rules`. Les pannes se règlent dans `localStorage['__fake.opts']` (`offline`, `denyWrite`, `quota`, `popup`…), et `?apple=1` ou `?nosdk=1` dans l'adresse changent de variante ; le détail est en tête de `tests/serveur-essai.py`. Si tu changes `firestore.rules`, change aussi `allowRead` / `allowWrite` du faux SDK. N'utilise que des identifiants inventés : ne saisis jamais un vrai mot de passe, et ne crée pas de compte sur le vrai service à la place du propriétaire.

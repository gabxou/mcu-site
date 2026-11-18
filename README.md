# mcu-site

Site de fans Marvel : chronologie, notes, tier list, personnages. Adresse prévue : https://mcuclassement.fr

Tout le site tient dans `index.html`. Sans réglage, il n’y a ni compte ni base de données : les notes de chaque visiteur restent dans son navigateur. Avec un projet Firebase (voir « Comptes des visiteurs »), chacun peut créer un compte et retrouver ses notes partout.

## Voir le site sur ton ordinateur

Dans un terminal, depuis ce dossier :

```bash
python3 -m http.server
```

Ouvre ensuite http://localhost:8000.

## Ajouter des images

- Affiches des films et des séries : `images/<identifiant>.<format>`, par exemple `images/im1.webp`.
- Portraits des personnages : `images/personnages/<identifiant>.<format>`, par exemple `images/personnages/wanda.webp`.
- Formats acceptés : `.webp`, `.jpg`, `.jpeg` ou `.png`. Écris le nom en minuscules.
- La liste des identifiants est dans `images/NOMS-DES-FICHIERS.csv`. La colonne « dossier » dit où ranger chaque fichier. `wanda`, `vision` et `groot` existent deux fois, pour une série et pour un personnage : c’est le dossier qui les distingue.
- Si une image manque, l’affiche typographique reste.
- Sur le site en ligne, une nouvelle image apparaît quelques minutes après l’envoi sur GitHub.

Tu es responsable des images que tu ajoutes. Les affiches et les photos officielles sont protégées par le droit d’auteur.

## Coordonnées de la page Contact

Dans `index.html`, cherche `const CONTACT` et remplis le nom et l’e-mail. Tant qu’ils sont vides, la page Contact l’indique. Remplis-les avant de rendre le site public : avec les comptes, c’est à cette adresse que les gens signalent un commentaire ou demandent la suppression de leurs données.

## Comptes des visiteurs (Firebase)

Le code des comptes est dans `index.html`, mais il dort tant que `const FIREBASE` est vide. Pour l’allumer, il faut créer un projet Firebase, le service de Google qui garde les e-mails, les mots de passe et les notes. L’offre gratuite (« Spark ») ne demande pas de carte bancaire.

Ce que les visiteurs obtiennent :

- un compte avec e-mail et mot de passe (Google et Apple peuvent s’ajouter plus tard, voir plus bas) ;
- leurs notes, leurs commentaires et leur tier list sur tous leurs appareils ;
- les avis des autres inscrits : derniers avis, moyenne, tier lists.

Ce que ça change pour toi :

- les notes, les commentaires, la tier list et le pseudo de chaque inscrit sont **visibles par tous les autres inscrits** ; l’e-mail ne l’est jamais ;
- tu gardes des adresses e-mail, donc des données personnelles, et tu dois pouvoir retirer un commentaire qui pose problème (voir « Modérer ») ;
- les CGU du site passent toutes seules à leur version « avec comptes ». Fais-les relire en même temps que le reste.

Les noms de menus ci-dessous viennent de la documentation de Firebase, relue en novembre 2026. La console est en anglais.

### 1. Créer le projet

1. Ouvre https://console.firebase.google.com/ avec ton compte Google et crée un projet. Donne-lui un nom, par exemple `mcuclassement`.
2. Firebase te fait accepter ses conditions. Lis-les : c’est toi qui t’engages. La case à cocher dit notamment que tu utilises le service dans un cadre professionnel.
3. Deux options sont proposées : l’aide par IA (« Gemini in Firebase ») et **Google Analytics**. Elles sont facultatives. Ne les active pas : les CGU du site disent qu’il n’y a pas de mesure d’audience.
4. Clique sur **Create project**.

### 2. Activer les connexions

1. Dans le menu de gauche : **Security**, puis **Authentication**. Ouvre l’onglet **Sign-in method**.
2. Active **Email/password**, puis **Save**.
3. Dans les réglages d’Authentication (`https://console.firebase.google.com/project/_/authentication/settings`), trouve la liste des domaines autorisés (« Authorized domains »). Ajoute `mcuclassement.fr`. Vérifie que `localhost` y est aussi, pour tes essais sur ton ordinateur.
4. Onglet **Templates** : tu peux changer le nom de l’expéditeur des e-mails. Le site demande déjà des e-mails en français.
5. Les e-mails sont signés du nom public du projet (« Public-facing name »). D’après l’aide de Firebase, il se change sur la carte du projet, dans les réglages du projet, avec le crayon à côté du nom. Ce champ n’apparaît pas sur tous les projets : s’il manque, regarde simplement quel nom signe l’e-mail de l’étape 5.

### 3. Créer la base de données

1. Menu de gauche : **Databases & Storage**, puis **Firestore**. Clique sur **Create database**.
2. Choisis un emplacement en Europe : `eur3` (Europe) ou `europe-west9` (Paris). **Ce choix est définitif.**
3. Choisis **Production mode** : tout est fermé tant que les règles ne sont pas publiées. Puis **Create**.
4. Ouvre l’onglet **Rules**. Remplace tout le contenu par celui du fichier `firestore.rules` de ce dossier, puis clique sur **Publish**. Un changement de règles met jusqu’à une minute à s’appliquer.

Ces règles disent : une personne connectée lit les avis des inscrits, et n’écrit que les siens. Sans elles, les comptes ne peuvent rien enregistrer.

### 4. Relier le site au projet

1. Sur la page d’accueil du projet, clique sur l’icône **Web**, donne un surnom à l’application, puis **Register app**.
2. Firebase affiche un objet `firebaseConfig`. Tu le retrouves plus tard dans les réglages du projet, onglet **General**, carte **Your apps**, option **Config**.
3. Dans `index.html`, cherche `const FIREBASE` et recopie les quatre valeurs `apiKey`, `authDomain`, `projectId` et `appId`, entre les apostrophes. Laisse de côté le reste du bloc (`storageBucket`, `messagingSenderId`, `measurementId` et les lignes `import`) : le site n’en a pas besoin.

Si le bloc contient `measurementId`, Google Analytics est relié au projet. Le site ne le charge pas, donc rien n’est mesuré. Tu peux aussi le délier : réglages du projet, onglet **Integrations**, carte **Google Analytics**.

Ces valeurs ne sont pas des secrets : la documentation de Firebase dit qu’on peut les mettre dans le code, parce qu’elles désignent seulement le projet. Ce sont les règles de l’étape 3 qui protègent les données. Tu recevras peut-être un e-mail de Google Cloud ou une alerte de GitHub disant qu’une clé est publique. Vérifie alors, dans la console Google Cloud (**APIs & Services**, **Credentials**), que c’est bien la clé « Browser key (auto created by Firebase) » et qu’elle n’ouvre que des services Firebase.

### 5. Essayer avant d’envoyer

1. Lance le site sur ton ordinateur (`python3 -m http.server`) et ouvre http://localhost:8000.
2. Page Compte : crée un compte avec une vraie adresse. Tu dois recevoir un e-mail de confirmation. Ce que tu as déjà noté dans ce navigateur passe d’office dans le nouveau compte.
3. Note un film. Dans la console Firebase, Firestore doit montrer un document dans `reviews`.
4. Déconnecte-toi, reconnecte-toi, puis essaie « Mot de passe oublié ».
5. Si tout marche, envoie la mise à jour avec GitHub Desktop.

Si l’enregistrement échoue, le site le dit et garde les notes sur l’appareil. La cause la plus fréquente : les règles de l’étape 3 ne sont pas publiées, ou le domaine n’est pas dans la liste de l’étape 2.

### Limites de l’offre gratuite

Chiffres relevés sur le site de Firebase en novembre 2026. Ils peuvent changer.

- Base de données : 50 000 lectures et 20 000 écritures par jour, 1 Gio de données.
- E-mails : 1 000 confirmations d’adresse et 150 « mot de passe oublié » par jour.
- Création de comptes : 100 par heure depuis une même adresse IP.

Pour rester dans ces limites, le site ne lit pas tous les inscrits : il lit les 50 profils les plus récemment actifs (`FEED_MAX` dans `index.html`). La moyenne et les derniers avis sont calculés sur ces profils. Si une limite est dépassée, Firebase coupe le service concerné jusqu’à sa remise à zéro. Le site le dit et continue de marcher avec les notes gardées sur l’appareil.

### Modérer

Tu es responsable des commentaires que les inscrits publient.

- **Retirer un commentaire** : console Firebase, Firestore, collection `reviews`. Chaque document est une personne ; son pseudo est dans le champ `nick`. Ouvre `films`, puis le film concerné, et vide le champ `c`. Tu peux aussi supprimer le document entier.
- **Fermer un compte** : dans Authentication, désactive ou supprime l’utilisateur. Supprime aussi ses deux documents, `reviews/…` et `tiers/…` : ils portent le même identifiant que lui.
- **Signalements** : ils arrivent à l’adresse de la page Contact.

### Connexion avec Google

Le bouton « Continuer avec Google » est prévu dans le code, mais éteint. La raison : Google montre une adresse e-mail « d’assistance » aux personnes qui se connectent ainsi. D’après l’aide de Google, ce doit être l’adresse du compte Google connecté à la console, ou un groupe Google qu’il gère. Avec ton compte personnel, ce serait donc ton adresse personnelle.

Pour l’allumer sans montrer ton adresse :

1. Crée un compte Google réservé au site. Son adresse peut aussi servir pour la page Contact.
2. Dans les réglages du projet Firebase, ajoute ce compte parmi les propriétaires du projet.
3. Connecte-toi à la console avec ce compte. Dans **Security**, **Authentication**, onglet **Sign-in method**, active **Google**, choisis cette adresse comme adresse d’assistance, puis **Save**.
4. Dans `index.html`, passe `google:false` à `google:true` dans `const SIGNIN`.

### Connexion avec Apple

Le bouton « Continuer avec Apple » est prévu dans le code, mais éteint. D’après la documentation de Firebase, cette connexion ne peut être configurée que par un membre de l’Apple Developer Program. Apple annonce 99 USD par an, et demande d’être majeur ou de passer par un parent.

Si tu prends cet abonnement : crée chez Apple un « Services ID » et une clé « Sign In with Apple », déclare l’adresse de retour `https://TON-PROJET.firebaseapp.com/__/auth/handler`, puis remplis le fournisseur **Apple** dans l’onglet **Sign-in method** (Services ID, Team ID, Key ID, clé privée). Dans `index.html`, passe ensuite `apple:false` à `apple:true` dans `const SIGNIN`.

### Tester les comptes sans projet Firebase

```bash
python3 tests/serveur-essai.py
```

Ouvre ensuite http://localhost:8002. Le site y tourne avec un faux service de comptes, rangé dans `tests/faux-firebase` : rien ne sort de l’ordinateur, les faux comptes vivent dans le navigateur. C’est pratique pour voir les écrans, mais ça ne remplace pas l’essai de l’étape 5. Il marche aussi quand `const FIREBASE` est rempli : il remplace la configuration à la volée, sans toucher au fichier ni au vrai projet.

## Mise en ligne avec GitHub Pages et IONOS

Valeurs vérifiées en novembre 2026 dans la documentation de GitHub (docs.github.com) et l’aide d’IONOS (ionos.fr/assistance). Remplace `PSEUDO` par ton nom d’utilisateur GitHub.

### 1. Sauvegarder le dossier sur GitHub, en privé

Rien n’est public à cette étape.

1. Télécharge GitHub Desktop sur https://desktop.github.com/ (« Download for macOS »). Dans `Téléchargements`, double-clique sur le fichier zip, puis sur l’application **GitHub Desktop**. Range-la dans `Applications`.
2. Connecte-toi : dans la barre de menus, **GitHub Desktop**, **Settings**, onglet **Accounts**, **Sign Into GitHub.com**, puis **Continue With Browser**. Connecte-toi dans le navigateur, puis reviens dans l’application.
3. Garde ton e-mail privé : sur github.com, ta photo de profil, **Settings**, **Emails**, coche **Keep my email addresses private**. GitHub te donne alors une adresse en `@users.noreply.github.com`.
4. Dans GitHub Desktop : **GitHub Desktop**, **Settings**, **Git**. « Name » : ton pseudo. « Email » : l’adresse en `@users.noreply.github.com`. Puis **Save**. Sinon ton adresse apparaîtrait dans l’historique du dépôt, lisible par tous le jour où il deviendra public.
5. **File**, **Add Local Repository…**, **Choose…**, sélectionne le dossier `mcu-site` du Bureau, puis **Add Repository**.
6. Les fichiers apparaissent dans la liste des changements. En bas à gauche, écris un résumé, par exemple « Version initiale », puis clique sur **Commit to main**.
7. Clique sur **Publish repository**. Laisse **Keep this code private** coché, puis **Publish Repository**. Le dépôt existe sur GitHub, mais toi seul le vois.

Après une modification, par exemple une image ajoutée : écris un résumé, **Commit to main**, puis **Push origin**.

### 2. Rendre le site public, quand tu l’as décidé

1. Avec un compte gratuit, GitHub Pages demande un dépôt public : tout le dépôt devient lisible, historique compris. Sur github.com, dans le dépôt : **Settings**, section « Danger Zone », **Change visibility**. Choisis public, confirme le nom du dépôt, clique sur **I have read and understand these effects**, puis **Make this repository public**.
2. Vérifie le domaine, comme GitHub le conseille contre le vol de sous-domaine. Ta photo de profil, **Settings**, puis **Pages** (les réglages de ton compte, pas ceux du dépôt). **Add a domain**, tape `mcuclassement.fr`, puis **Add domain**. GitHub affiche un enregistrement TXT. Chez IONOS (voir l’étape 3 pour ouvrir les DNS) : **Ajouter un enregistrement**, **TXT**, « Nom d’hôte » `_github-pages-challenge-PSEUDO`, « Pointe vers » la valeur donnée par GitHub, **Enregistrer**. Sur GitHub, dans le menu à côté du domaine : **Continue verifying**, puis **Verify**. Cela peut prendre jusqu’à 24 heures. Garde cet enregistrement TXT ensuite.
3. Active GitHub Pages : dans le dépôt, **Settings**, puis **Pages**. Sous « Build and deployment », « Source » : **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
4. Sous « Custom domain », vérifie que `mcuclassement.fr` apparaît : il vient du fichier `CNAME`. Sinon, tape-le puis **Save**. GitHub demande que le domaine soit ajouté ici **avant** de changer les DNS.

### 3. Les DNS chez IONOS

1. Ouvre https://my.ionos.fr/domains (« Domaines et SSL »). Sur la ligne de `mcuclassement.fr`, sous « Actions », clique sur l’icône (roue dentée ou trois points), puis **DNS**.
2. Supprime les enregistrements **A** et **AAAA** dont le nom d’hôte est `@` : par défaut, ils pointent vers l’offre IONOS. Icône corbeille, puis confirme.
3. Ajoute quatre enregistrements **A**, nom d’hôte `@`, « Pointe vers » :
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Ajoute quatre enregistrements **AAAA**, nom d’hôte `@` :
   - `2606:50c0:8000::153`
   - `2606:50c0:8001::153`
   - `2606:50c0:8002::153`
   - `2606:50c0:8003::153`
5. Pour `www` : supprime les éventuels A ou AAAA sur `www`, puis ajoute un **CNAME**, nom d’hôte `www`, « Pointe vers » `PSEUDO.github.io` (sans le nom du dépôt). GitHub redirigera `www.mcuclassement.fr` vers `mcuclassement.fr`.
6. Ne touche pas aux enregistrements **MX** : ils servent à l’e-mail. N’ajoute pas d’enregistrement générique `*`.

IONOS annonce moins d’une heure pour que les changements se propagent, parfois jusqu’à 72 heures.

### 4. HTTPS

Quand le site répond sur `mcuclassement.fr`, retourne dans **Settings**, **Pages** du dépôt et coche **Enforce HTTPS**. GitHub peut mettre jusqu’à 24 heures à proposer cette case. Si le certificat bloque, clique sur **Remove** à côté du domaine, retape-le, puis **Save**.

### 5. Vérifier

```bash
dig mcuclassement.fr +noall +answer -t A
```

```bash
dig mcuclassement.fr +noall +answer -t AAAA
```

```bash
dig www.mcuclassement.fr +nostats +nocomments +nocmd
```

Les deux premières commandes doivent montrer les adresses de GitHub ci-dessus, la troisième un CNAME vers `PSEUDO.github.io`. Ouvre aussi `https://mcuclassement.fr/images/liste.json` : tu dois voir une liste entre crochets, pas du texte avec des accolades.

## Reprendre le projet avec Claude Code

Claude Code lit `CLAUDE.md` en arrivant dans le dossier : c’est la note de passation.

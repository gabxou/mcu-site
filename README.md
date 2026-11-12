# mcu-site

Site de fans Marvel : chronologie, notes, tier list, personnages. Adresse prévue : https://mcuclassement.fr

Tout le site tient dans `index.html`. Il n’y a ni compte ni base de données : les notes de chaque visiteur restent dans son navigateur. La page Compte permet de les télécharger et de les restaurer.

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

Dans `index.html`, cherche `const CONTACT` et remplis le nom et l’e-mail. Tant qu’ils sont vides, la page Contact l’indique. Remplis-les avant de rendre le site public.

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

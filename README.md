# Firefox Tab Groups

Regroupe automatiquement les onglets Firefox par domaine principal et affiche leur favicon dans les groupes natifs.

## Installation

### 1. Extension

Installe le fichier `.xpi` depuis `about:addons` :

**Roue dentée → Installer un module depuis un fichier**

### 2. fx-autoconfig

Télécharge [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig).

Copie :

```text
fx-autoconfig/program/*
→ dossier contenant firefox.exe
```

Puis :

```text
fx-autoconfig/profile/*
→ dossier du profil Firefox
```

Le profil est accessible via :

```text
about:profiles
```

### 3. Fichiers favicon

Copie dans le profil :

```text
chrome/userChrome.css
chrome/JS/domain-tab-groups.uc.js
```

Structure :

```text
Profil Firefox/
└── chrome/
    ├── userChrome.css
    ├── JS/
    │   └── domain-tab-groups.uc.js
    ├── resources/
    └── utils/
```

### 4. Activer CSS

Dans `about:config` :

```text
toolkit.legacyUserProfileCustomizations.stylesheets = true
```

### 5. Redémarrer

Dans `about:support` :

**Effacer le cache de démarrage**

Puis redémarre Firefox.

C'est terminé.

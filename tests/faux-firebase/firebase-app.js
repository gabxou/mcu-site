/* Faux SDK Firebase pour les essais locaux : aucun appel réseau, tout reste dans le navigateur. */
export function initializeApp(options){ return {name:'[DEFAULT]', options}; }

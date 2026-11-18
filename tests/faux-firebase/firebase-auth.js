/* Faux SDK Firebase Auth pour les essais locaux : aucun appel réseau, tout reste dans localStorage.
   Il reprend les signatures de l’API modulaire (v13) utilisées par le site.
   Réglages d’essai dans localStorage['__fake.opts'] (JSON) :
     delay   : latence simulée en ms (150 par défaut)
     boot    : délai avant le premier état de connexion (250 par défaut)
     offline : true = pas de réseau
     popup   : 'closed', 'blocked', 'off', ou l’adresse e-mail du compte choisi dans la fausse fenêtre
     recent  : durée en ms au-delà de laquelle deleteUser exige une reconnexion */
const LS = localStorage;
const K = {users:'__fake.users', session:'__fake.session', log:'__fake.log', opts:'__fake.opts'};
const read = (k, d) => { try{ const v = JSON.parse(LS.getItem(k)); return v == null ? d : v; }catch(e){ return d; } };
const write = (k, v) => LS.setItem(k, JSON.stringify(v));
export const __opts = () => read(K.opts, {});
const wait = ms => new Promise(r => setTimeout(r, ms));
const lag = () => wait(__opts().delay == null ? 150 : __opts().delay);
const fail = code => Object.assign(new Error('Firebase: Error (' + code + ').'), {code, name:'FirebaseError'});
const log = (type, data) => { const l = read(K.log, []); l.push(Object.assign({type, at:Date.now()}, data)); write(K.log, l.slice(-60)); };
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const newUid = () => Array.from(crypto.getRandomValues(new Uint8Array(28)), b => ABC[b % 62]).join('');
const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class User {
  constructor(rec){ this._set(rec); }
  _set(rec){
    this.uid = rec.uid;
    this.email = rec.email;
    this.displayName = rec.displayName || null;
    this.photoURL = null;
    this.emailVerified = !!rec.verified;
    this.providerData = rec.providers.map(p => ({providerId:p, uid:p === 'password' ? rec.email : 'ext-' + rec.uid, email:rec.email, displayName:rec.displayName || null, photoURL:null}));
  }
  async reload(){
    await lag();
    const rec = read(K.users, {})[this.uid];
    if (!rec) throw fail('auth/user-token-expired');
    this._set(rec);
  }
}

let inst = null;
const emit = () => { for (const cb of Array.from(inst._ls)) setTimeout(() => cb(inst.currentUser), 0); };
function open(uid){
  const rec = uid ? read(K.users, {})[uid] : null;
  if (rec) LS.setItem(K.session, uid); else LS.removeItem(K.session);
  inst.currentUser = rec ? new User(rec) : null;
  inst._login = Date.now();
  emit();
  return inst.currentUser;
}
export const __uid = () => (inst && inst.currentUser ? inst.currentUser.uid : null);

export function getAuth(app){
  if (inst) return inst;
  inst = {app, currentUser:null, languageCode:null, _ls:new Set(), _ready:false, _login:0};
  setTimeout(() => {
    const uid = LS.getItem(K.session), rec = uid ? read(K.users, {})[uid] : null;
    inst.currentUser = rec ? new User(rec) : null;
    inst._ready = true;
    emit();
  }, __opts().boot == null ? 250 : __opts().boot);
  /* Connexion ou déconnexion dans un autre onglet. */
  addEventListener('storage', e => {
    if (e.key !== K.session || !inst._ready) return;
    const uid = e.newValue || null, cur = inst.currentUser ? inst.currentUser.uid : null;
    if (uid === cur) return;
    const rec = uid ? read(K.users, {})[uid] : null;
    inst.currentUser = rec ? new User(rec) : null;
    emit();
  });
  return inst;
}
export function onAuthStateChanged(auth, cb){
  auth._ls.add(cb);
  if (auth._ready) setTimeout(() => cb(auth.currentUser), 0);
  return () => auth._ls.delete(cb);
}
const cred = (user, providerId, isNew) => ({user, providerId, operationType:'signIn', _isNew:!!isNew});

export async function createUserWithEmailAndPassword(auth, email, password){
  await lag();
  if (__opts().offline) throw fail('auth/network-request-failed');
  if (!MAIL.test(email)) throw fail('auth/invalid-email');
  if (String(password).length < 6) throw fail('auth/weak-password');
  const users = read(K.users, {}), key = email.toLowerCase();
  if (Object.values(users).some(u => u.email === key)) throw fail('auth/email-already-in-use');
  const uid = newUid();
  users[uid] = {uid, email:key, pass:String(password), providers:['password'], verified:false, created:Date.now()};
  write(K.users, users);
  return cred(open(uid), 'password', true);
}
export async function signInWithEmailAndPassword(auth, email, password){
  await lag();
  if (__opts().offline) throw fail('auth/network-request-failed');
  if (!MAIL.test(email)) throw fail('auth/invalid-email');
  const rec = Object.values(read(K.users, {})).find(u => u.email === email.toLowerCase());
  if (!rec || !rec.providers.includes('password') || rec.pass !== String(password)) throw fail('auth/invalid-credential');
  if (rec.disabled) throw fail('auth/user-disabled');
  return cred(open(rec.uid), 'password', false);
}
export async function signOut(auth){ await lag(); open(null); }
export async function sendPasswordResetEmail(auth, email){
  await lag();
  if (__opts().offline) throw fail('auth/network-request-failed');
  if (!MAIL.test(email)) throw fail('auth/invalid-email');
  log('reset', {email, lang:auth.languageCode});
}
export async function sendEmailVerification(user){
  await lag();
  log('verify', {email:user.email, lang:inst.languageCode});
}
export async function deleteUser(user){
  await lag();
  const max = __opts().recent;
  if (max != null && Date.now() - inst._login > max) throw fail('auth/requires-recent-login');
  const users = read(K.users, {});
  delete users[user.uid];
  write(K.users, users);
  log('deleted', {uid:user.uid});
  open(null);
}
export class EmailAuthProvider {
  static credential(email, password){ return {providerId:'password', _email:email, _password:password}; }
}
EmailAuthProvider.PROVIDER_ID = 'password';
export class GoogleAuthProvider {
  constructor(){ this.providerId = 'google.com'; this._params = {}; this._scopes = []; }
  addScope(s){ this._scopes.push(s); return this; }
  setCustomParameters(p){ this._params = p; return this; }
}
GoogleAuthProvider.PROVIDER_ID = 'google.com';
export class OAuthProvider {
  constructor(id){ this.providerId = id; this._params = {}; this._scopes = []; }
  addScope(s){ this._scopes.push(s); return this; }
  setCustomParameters(p){ this._params = p; return this; }
  static credentialFromResult(res){ return res ? {providerId:res.providerId, accessToken:'fake-access-token'} : null; }
}
export async function reauthenticateWithCredential(user, c){
  await lag();
  const rec = read(K.users, {})[user.uid];
  if (!rec || rec.pass !== c._password) throw fail('auth/invalid-credential');
  inst._login = Date.now();
  return cred(user, 'password', false);
}
/* La fausse fenêtre Google ou Apple. Comme la vraie, elle est demandée tout de suite, sans attente. */
function popup(){
  const mode = __opts().popup || 'google.user@example.test';
  log('popup-open', {mode});
  if (mode === 'blocked') return Promise.reject(fail('auth/popup-blocked'));
  return lag().then(() => {
    if (mode === 'closed') throw fail('auth/popup-closed-by-user');
    if (mode === 'off') throw fail('auth/operation-not-allowed');
    return mode;
  });
}
export function signInWithPopup(auth, provider){
  return popup().then(email => {
    const users = read(K.users, {});
    let rec = Object.values(users).find(u => u.email === email), isNew = false;
    if (!rec){
      const uid = newUid();
      rec = users[uid] = {uid, email, providers:[provider.providerId], verified:true, displayName:'Prénom Nom', created:Date.now()};
      isNew = true;
    } else if (!rec.providers.includes(provider.providerId)) rec.providers.push(provider.providerId);
    write(K.users, users);
    log('popup', {provider:provider.providerId, params:provider._params, scopes:provider._scopes});
    return cred(open(rec.uid), provider.providerId, isNew);
  });
}
export function reauthenticateWithPopup(user, provider){
  return popup().then(() => {
    inst._login = Date.now();
    log('repopup', {provider:provider.providerId});
    return cred(user, provider.providerId, false);
  });
}
export function getAdditionalUserInfo(c){ return c ? {isNewUser:!!c._isNew, providerId:c.providerId, profile:null} : null; }
export async function revokeAccessToken(auth, token){ await lag(); log('revoke', {token}); }

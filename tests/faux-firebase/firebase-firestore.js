/* Faux SDK Cloud Firestore pour les essais locaux : la « base » est une entrée de localStorage.
   Il reprend l’API modulaire utilisée par le site, la compensation de latence (le listener est
   prévenu avant l’accusé du serveur), les métadonnées fromCache / hasPendingWrites, la fusion de
   setDoc(..., {merge:true}) et des règles équivalentes à firestore.rules.
   Réglages d’essai dans localStorage['__fake.opts'] : delay, offline, denyWrite, denyRead, quota. */
import { __uid, __opts } from './firebase-auth.js';

const LS = localStorage, KEY = '__fake.db';
const readDb = () => { try{ return JSON.parse(LS.getItem(KEY)) || {}; }catch(e){ return {}; } };
const writeDb = db => LS.setItem(KEY, JSON.stringify(db));
const wait = ms => new Promise(r => setTimeout(r, ms));
const lag = () => wait(__opts().delay == null ? 150 : __opts().delay);
const fail = code => Object.assign(new Error('[code=' + code + ']: fausse erreur Firestore'), {code, name:'FirebaseError'});
const clone = v => JSON.parse(JSON.stringify(v));
const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v);
const log = (type, data) => { let l = []; try{ l = JSON.parse(LS.getItem('__fake.log')) || []; }catch(e){} l.push(Object.assign({type, at:Date.now()}, data)); LS.setItem('__fake.log', JSON.stringify(l.slice(-60))); };

/* Fusion comme setDoc(..., {merge:true}) : les tables non vides sont fusionnées champ par champ,
   une table vide remplace celle du serveur (c’est ce que dit la documentation). */
function merge(a, b){
  const out = isMap(a) ? clone(a) : {};
  for (const k of Object.keys(b)){
    const v = b[k];
    out[k] = isMap(v) && Object.keys(v).length ? merge(out[k], v) : clone(v);
  }
  return out;
}

const pending = new Map();   /* chemin -> valeur en attente d’envoi (null : suppression) */
const subs = new Set();
const online = () => !__opts().offline;
function view(){
  const db = readDb();
  for (const [p, v] of pending){ if (v === null) delete db[p]; else db[p] = v; }
  return db;
}
function docSnap(path, data, cache){
  return {
    id: path.split('/').pop(),
    exists: () => data != null,
    data: () => (data == null ? undefined : clone(data)),
    metadata: {fromCache: cache, hasPendingWrites: pending.has(path)}
  };
}
function querySnap(q, db, cache){
  let rows = Object.keys(db).filter(p => p.startsWith(q.coll + '/') && p.split('/').length === 2).map(p => ({p, d:db[p]}));
  if (q.order){
    const f = q.order.f, sign = q.order.dir === 'desc' ? -1 : 1;
    rows = rows.filter(r => r.d[f] !== undefined).sort((x, y) => (x.d[f] - y.d[f]) * sign);
  }
  if (q.limit != null) rows = rows.slice(0, q.limit);
  const docs = rows.map(r => docSnap(r.p, r.d, cache));
  return {docs, size:docs.length, empty:!docs.length, forEach: f => docs.forEach(f), metadata:{fromCache:cache, hasPendingWrites:rows.some(r => pending.has(r.p))}};
}

/* Règles équivalentes à firestore.rules. */
function allowRead(sub){
  if (__opts().denyRead) return 'permission-denied';
  if (!__uid()) return 'permission-denied';
  if (sub.q && !(sub.q.limit != null && sub.q.limit <= 60)) return 'permission-denied';
  return null;
}
function allowWrite(path, data){
  const o = __opts();
  if (o.quota) return 'resource-exhausted';
  if (o.denyWrite) return 'permission-denied';
  const [coll, id] = path.split('/');
  if (!__uid() || __uid() !== id || !['reviews', 'tiers'].includes(coll)) return 'permission-denied';
  if (data === null) return null;
  const ok = coll === 'reviews' ? ['v', 't', 'nick', 'films'] : ['v', 't', 'nick', 'rows'];
  if (!Object.keys(data).every(k => ok.includes(k)) || data.v !== 1 || typeof data.t !== 'number') return 'permission-denied';
  if ('nick' in data && (typeof data.nick !== 'string' || data.nick.length > 24)) return 'permission-denied';
  if (coll === 'reviews' && 'films' in data && (!isMap(data.films) || Object.keys(data.films).length > 200)) return 'permission-denied';
  if (coll === 'tiers' && (!isMap(data.rows) || !Object.keys(data.rows).every(k => 'SABCD'.includes(k)))) return 'permission-denied';
  return null;
}

function fire(sub){
  if (sub.dead) return;
  const cache = !sub.server || !online();
  const db = view();
  const snap = sub.q ? querySnap(sub.q, db, cache) : docSnap(sub.path, db[sub.path], cache);
  const data = JSON.stringify(sub.q ? snap.docs.map(d => [d.id, d.data()]) : [snap.exists(), snap.data()]);
  /* Comme le vrai SDK : sans includeMetadataChanges, un changement des seules métadonnées ne prévient pas. */
  const sig = sub.meta ? data + '|' + snap.metadata.fromCache + '|' + snap.metadata.hasPendingWrites : data;
  if (sub.last === sig) return;
  sub.last = sig;
  setTimeout(() => { if (!sub.dead) sub.next(snap); }, 0);
}
const fireAll = () => { for (const s of Array.from(subs)) fire(s); };
addEventListener('storage', e => { if (e.key === KEY) fireAll(); });
let wasOnline = online();
setInterval(() => { const now = online(); if (now !== wasOnline){ wasOnline = now; fireAll(); } }, 150);

export function getFirestore(app){ return {type:'firestore', app}; }
export function doc(db, ...segs){ const path = segs.join('/'); return {type:'document', path, id:path.split('/').pop()}; }
export function collection(db, name){ return {type:'collection', path:name}; }
export function orderBy(f, dir){ return {k:'orderBy', f, dir:dir || 'asc'}; }
export function limit(n){ return {k:'limit', n}; }
export function query(coll, ...cs){ return {type:'query', path:coll.path, cs}; }
function norm(t){
  const q = {coll:t.path, order:null, limit:null};
  for (const c of (t.cs || [])){ if (c.k === 'orderBy') q.order = c; if (c.k === 'limit') q.limit = c.n; }
  return q;
}

export function onSnapshot(target, a, b, c){
  let opt = {}, next = a, error = b;
  if (typeof a !== 'function'){ opt = a || {}; next = b; error = c; }
  const sub = {q: target.type === 'document' ? null : norm(target), path:target.path, next, error, meta:!!opt.includeMetadataChanges, dead:false, server:false, last:null};
  subs.add(sub);
  (async () => {
    await lag();
    /* Hors ligne : au bout d’un moment, un premier état sorti du cache (vide). */
    for (let i = 0; !online() && !sub.dead; i++){
      if (i === 4) fire(sub);
      await wait(200);
    }
    if (sub.dead) return;
    const no = allowRead(sub);
    if (no){
      sub.dead = true; subs.delete(sub);
      log('listen-refused', {path:sub.path, code:no});
      if (error) error(fail(no));
      return;
    }
    sub.server = true;
    fire(sub);
  })();
  return () => { sub.dead = true; subs.delete(sub); };
}

const chain = new Map();
function send(path){
  const run = async () => {
    await lag();
    while (!online()) await wait(200);
    if (!pending.has(path)) return;
    const val = pending.get(path);
    const no = allowWrite(path, val);
    pending.delete(path);
    if (no){ log('write-refused', {path, code:no}); fireAll(); throw fail(no); }
    const db = readDb();
    if (val === null) delete db[path]; else db[path] = val;
    writeDb(db);
    log('write', {path, kind: val === null ? 'delete' : 'set', keys: val ? Object.keys(val) : []});
    fireAll();
  };
  const p = (chain.get(path) || Promise.resolve()).catch(() => {}).then(run);
  chain.set(path, p);
  return p;
}
export function setDoc(ref, data, o){
  const cur = view()[ref.path];
  pending.set(ref.path, o && o.merge ? merge(cur, data) : clone(data));
  fireAll();
  return send(ref.path);
}
export function deleteDoc(ref){
  pending.set(ref.path, null);
  fireAll();
  return send(ref.path);
}
export async function getDoc(ref){
  await lag();
  if (!__uid()) throw fail('permission-denied');
  return docSnap(ref.path, view()[ref.path], !online());
}

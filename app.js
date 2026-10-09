import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XREstimatedLight } from 'three/addons/webxr/XREstimatedLight.js';
import { CATALOG, COLORS, buildFurniture, measure } from './furniture.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const rad = (d) => (d * Math.PI) / 180;

const state = { item: CATALOG[0].id, color: COLORS[0], yaw: 0, mode: 'add', inAR: false };

/* ---------- renderer / scene ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local');
$('#viewer').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const VIEW_BG = new THREE.Color('#e6ebf3');
scene.background = VIEW_BG;

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 50);
camera.position.set(2.6, 2.0, 3.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.enableDamping = true;

// lighting (+ shadow stage that follows the last placed item in AR)
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93a6, 1.1));
const stage = new THREE.Group();
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(2, 4, 1.5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.1, far: 10 });
sun.shadow.bias = -0.0005;
stage.add(sun, sun.target);
const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.28 }));
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.receiveShadow = true;
stage.add(shadowPlane);
scene.add(stage);

// viewer-only helpers
const grid = new THREE.GridHelper(10, 10, 0x9aa8c2, 0xc3cddd);
grid.position.y = 0.001;
scene.add(grid);
const roomLine = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x1e9bdc }));
scene.add(roomLine);

// AR light estimation (uses the device's ambient light probe where supported)
const xrLight = new XREstimatedLight(renderer);
xrLight.addEventListener('estimationstart', () => { scene.add(xrLight); if (xrLight.environment) scene.environment = xrLight.environment; });
xrLight.addEventListener('estimationend', () => { scene.remove(xrLight); scene.environment = null; });

// reticle
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.12, 0.15, 40).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.9 })
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

/* ---------- furniture state ---------- */
let preview = null, ghost = null;
const placed = [];

function rebuild() {
  if (preview) scene.remove(preview);
  if (ghost) scene.remove(ghost);
  preview = buildFurniture(state.item, state.color);
  ghost = buildFurniture(state.item, state.color);
  ghost.traverse((o) => {
    if (o.isMesh) {
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.opacity = 0.55;
      o.castShadow = false;
    }
  });
  ghost.visible = false;
  scene.add(preview, ghost);
  applyYaw();
  updateVisibility();
}
function applyYaw() {
  preview.rotation.y = ghost.rotation.y = rad(state.yaw);
  updateInfo();
}
function updateVisibility() {
  preview.visible = !state.inAR;
  grid.visible = !state.inAR;
  roomLine.visible = !state.inAR;
}
function drawRoom() {
  const w = +$('#roomW').value || 4, d = +$('#roomD').value || 3.5;
  roomLine.geometry.setFromPoints([
    new THREE.Vector3(-w / 2, 0.01, -d / 2), new THREE.Vector3(w / 2, 0.01, -d / 2),
    new THREE.Vector3(w / 2, 0.01, d / 2), new THREE.Vector3(-w / 2, 0.01, d / 2),
  ]);
  updateInfo();
}
function updateInfo() {
  if (!preview) return;
  const s = measure(preview);
  const name = CATALOG.find((c) => c.id === state.item).name;
  $('#info').innerHTML = `<b>${name}</b> · ${Math.round(s.x * 100)} W × ${Math.round(s.z * 100)} D × ${Math.round(s.y * 100)} H cm (real size)`;
  const box = new THREE.Box3().setFromObject(preview).getSize(new THREE.Vector3());
  const W = +$('#roomW').value, D = +$('#roomD').value;
  const fit = $('#fit');
  const ok = box.x <= W && box.z <= D;
  fit.textContent = ok ? '✓ fits' : '✗ too big';
  fit.className = ok ? 'ok' : 'bad';
}

/* ---------- UI ---------- */
function buildUI() {
  $$('.catalog').forEach((el) => {
    el.innerHTML = '';
    CATALOG.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'chip' + (c.id === state.item ? ' on' : '');
      b.textContent = c.name;
      b.onclick = () => { state.item = c.id; buildUI(); rebuild(); };
      el.appendChild(b);
    });
  });
  $$('.swatches').forEach((el) => {
    el.innerHTML = '';
    COLORS.forEach((col) => {
      const b = document.createElement('button');
      b.className = 'sw' + (col === state.color ? ' on' : '');
      b.style.background = col;
      b.setAttribute('aria-label', 'Colour ' + col);
      b.onclick = () => { state.color = col; buildUI(); rebuild(); };
      el.appendChild(b);
    });
  });
}
$('#yaw').oninput = (e) => { state.yaw = +e.target.value; applyYaw(); };
$('#roomW').oninput = $('#roomD').oninput = drawRoom;
const nudge = (d) => { state.yaw = (state.yaw + d + 360) % 360; $('#yaw').value = state.yaw; applyYaw(); };
$('#rotL').onclick = () => nudge(-15);
$('#rotR').onclick = () => nudge(15);
$('#mode').onclick = () => {
  state.mode = state.mode === 'add' ? 'move' : 'add';
  $('#mode').textContent = 'Mode: ' + (state.mode === 'add' ? 'Add' : 'Move last');
};
$('#undo').onclick = () => { const o = placed.pop(); if (o) scene.remove(o); };
$('#clear').onclick = () => { while (placed.length) scene.remove(placed.pop()); };
$('#exit').onclick = () => renderer.xr.getSession()?.end();
// taps on the DOM overlay must not "select" in the AR scene
$$('#ar-overlay .ctrl').forEach((el) => el.addEventListener('beforexrselect', (e) => e.preventDefault()));

/* ---------- AR session ---------- */
let hitTestSource = null, placeable = false, seenFloor = false;
const status = (t) => ($('#ar-status').textContent = t);

async function startAR() {
  try {
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation'],
      domOverlay: { root: $('#ar-overlay') },
    });
    session.addEventListener('end', onEnd);
    await renderer.xr.setSession(session);
    const viewerSpace = await session.requestReferenceSpace('viewer');
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    state.inAR = true; seenFloor = false;
    document.body.classList.add('ar');
    scene.background = null;
    status('Move your phone slowly to scan the floor…');
    updateVisibility();
  } catch (err) {
    $('#hint').textContent = 'Could not start AR: ' + err.message;
  }
}
function onEnd() {
  hitTestSource?.cancel?.();
  hitTestSource = null;
  state.inAR = false;
  document.body.classList.remove('ar');
  scene.background = VIEW_BG;
  reticle.visible = false;
  ghost.visible = false;
  while (placed.length) scene.remove(placed.pop());
  stage.position.set(0, 0, 0);
  updateVisibility();
  onResize();
}
function onSelect() {
  if (!reticle.visible || !placeable) return;
  const pos = new THREE.Vector3().setFromMatrixPosition(reticle.matrix);
  if (state.mode === 'move' && placed.length) {
    const last = placed[placed.length - 1];
    last.position.copy(pos);
    last.rotation.y = rad(state.yaw);
  } else {
    const m = buildFurniture(state.item, state.color);
    m.position.copy(pos);
    m.rotation.y = rad(state.yaw);
    scene.add(m);
    placed.push(m);
  }
  stage.position.copy(pos); // keep shadows under the newest item
}
const controller = renderer.xr.getController(0);
controller.addEventListener('select', onSelect);
scene.add(controller);

const _up = new THREE.Vector3(), _pos = new THREE.Vector3();
function render(_, frame) {
  if (frame && hitTestSource) {
    const hits = frame.getHitTestResults(hitTestSource);
    if (hits.length) {
      const pose = hits[0].getPose(renderer.xr.getReferenceSpace());
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
      _up.set(0, 1, 0).transformDirection(reticle.matrix);
      placeable = _up.y > 0.85; // only near-horizontal, upward-facing surfaces (floors, tabletops)
      reticle.material.color.set(placeable ? 0x22c55e : 0xef4444);
      if (!seenFloor && placeable) seenFloor = true;
      status(placeable
        ? `Tap to ${state.mode === 'add' ? 'place' : 'move'} ${CATALOG.find((c) => c.id === state.item).name.toLowerCase()} (${placed.length} placed)`
        : 'That surface is not flat — aim at the floor');
    } else {
      reticle.visible = false;
      if (!seenFloor) status('Move your phone slowly to scan the floor…');
    }
  }
  if (state.inAR) {
    ghost.visible = reticle.visible && placeable;
    if (ghost.visible) ghost.position.setFromMatrixPosition(reticle.matrix);
  } else {
    controls.update();
  }
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);

function onResize() {
  if (state.inAR) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', onResize);

/* ---------- capability check ---------- */
(async function init() {
  buildUI(); rebuild(); drawRoom();
  const pill = $('#support'), btn = $('#start-ar'), hint = $('#hint');
  let ok = false, why = '';
  if (!isSecureContext) why = 'AR needs HTTPS (or localhost).';
  else if (!navigator.xr) why = 'This browser has no WebXR. On Android use Chrome with Google Play Services for AR; iPhone/iPad Safari does not support WebXR AR.';
  else {
    try { ok = await navigator.xr.isSessionSupported('immersive-ar'); } catch { ok = false; }
    if (!ok) why = 'This device/browser does not support WebXR AR (needs an ARCore-capable Android phone with Chrome).';
  }
  pill.textContent = ok ? 'AR ready' : '3D preview only';
  pill.classList.add(ok ? 'ok' : 'no');
  btn.disabled = !ok;
  hint.textContent = ok
    ? 'Point at the floor, wait for the green ring, then tap to place. Furniture is rendered at real-world size.'
    : why + ' You can still check sizes against your room dimensions here.';
  btn.onclick = startAR;
})();

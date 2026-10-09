// Procedural, true-to-scale furniture (units = metres, origin = centre of the base on the floor).
import * as THREE from 'three';

const M = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

function box(g, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
function cyl(g, rt, rb, h, x, y, z, mat, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}
function make(color, fn) {
  const g = new THREE.Group();
  const T = M(color);
  g.userData.tint = [T]; // materials that follow the colour picker
  fn(g, T);
  return g;
}

const builders = {
  sofa: (c) => make(c, (g, T) => {
    const dark = M('#2b2b2b', 0.5, 0.3);
    for (const sx of [-0.9, 0.9]) for (const sz of [-0.35, 0.35]) cyl(g, 0.03, 0.025, 0.12, sx, 0, sz, dark);
    box(g, 2.0, 0.26, 0.9, 0, 0.12, 0, T);
    for (const sx of [-0.9, 0.9]) box(g, 0.2, 0.3, 0.9, sx, 0.38, 0, T);
    box(g, 1.6, 0.47, 0.22, 0, 0.38, -0.34, T);
    for (const sx of [-0.4, 0.4]) box(g, 0.78, 0.14, 0.66, sx, 0.38, 0.1, T);
  }),
  armchair: (c) => make(c, (g, T) => {
    const dark = M('#2b2b2b', 0.5, 0.3);
    for (const sx of [-0.35, 0.35]) for (const sz of [-0.3, 0.3]) cyl(g, 0.03, 0.025, 0.12, sx, 0, sz, dark);
    box(g, 0.85, 0.26, 0.85, 0, 0.12, 0, T);
    for (const sx of [-0.35, 0.35]) box(g, 0.15, 0.3, 0.85, sx, 0.38, 0, T);
    box(g, 0.55, 0.47, 0.2, 0, 0.38, -0.32, T);
    box(g, 0.55, 0.14, 0.6, 0, 0.38, 0.08, T);
  }),
  coffee: (c) => make(c, (g, T) => {
    box(g, 1.0, 0.04, 0.55, 0, 0.38, 0, T);
    box(g, 0.9, 0.02, 0.45, 0, 0.12, 0, T);
    for (const sx of [-0.45, 0.45]) for (const sz of [-0.22, 0.22]) box(g, 0.05, 0.38, 0.05, sx, 0, sz, T);
  }),
  dining: (c) => make(c, (g, T) => {
    box(g, 1.6, 0.04, 0.9, 0, 0.71, 0, T);
    for (const sx of [-0.74, 0.74]) for (const sz of [-0.39, 0.39]) box(g, 0.07, 0.71, 0.07, sx, 0, sz, T);
  }),
  bed: (c) => make(c, (g, T) => {
    const wood = M('#5b4636', 0.7);
    const white = M('#f1eee8', 0.9);
    box(g, 1.6, 0.3, 2.1, 0, 0.1, 0, wood);
    for (const sx of [-0.75, 0.75]) for (const sz of [-1.0, 1.0]) box(g, 0.08, 0.1, 0.08, sx, 0, sz, wood);
    box(g, 1.52, 0.22, 2.0, 0, 0.4, 0.03, white);
    box(g, 1.54, 0.05, 1.35, 0, 0.62, 0.35, T);
    for (const sx of [-0.37, 0.37]) box(g, 0.6, 0.12, 0.35, sx, 0.62, -0.7, white);
    box(g, 1.6, 0.8, 0.1, 0, 0.1, -1.0, wood);
  }),
  bookshelf: (c) => make(c, (g, T) => {
    for (const sx of [-0.385, 0.385]) box(g, 0.03, 1.8, 0.3, sx, 0, 0, T);
    box(g, 0.8, 1.8, 0.01, 0, 0, -0.145, T);
    const ys = [0, 0.36, 0.72, 1.08, 1.44, 1.77];
    ys.forEach((y) => box(g, 0.74, 0.03, 0.3, 0, y, 0, T));
    const cols = ['#b5473a', '#2f5d8a', '#d9a441', '#3d7a5a', '#6b4a8a'];
    [1, 3].forEach((i) => {
      let x = -0.33;
      for (let k = 0; k < 7; k++) {
        const w = 0.03 + (k % 3) * 0.015, h = 0.22 + (k % 4) * 0.03;
        box(g, w, h, 0.2, x + w / 2, ys[i] + 0.03, 0, M(cols[(k + i) % cols.length]));
        x += w + 0.01;
      }
    });
  }),
  lamp: (c) => make(c, (g, T) => {
    const dark = M('#222', 0.4, 0.6);
    cyl(g, 0.15, 0.15, 0.03, 0, 0, 0, dark);
    cyl(g, 0.015, 0.015, 1.5, 0, 0.03, 0, dark, 12);
    cyl(g, 0.14, 0.22, 0.3, 0, 1.45, 0, T, 32);
  }),
};

export const CATALOG = [
  { id: 'sofa', name: 'Sofa' },
  { id: 'armchair', name: 'Armchair' },
  { id: 'coffee', name: 'Coffee table' },
  { id: 'dining', name: 'Dining table' },
  { id: 'bed', name: 'Double bed' },
  { id: 'bookshelf', name: 'Bookshelf' },
  { id: 'lamp', name: 'Floor lamp' },
];

export const COLORS = ['#3f6f8f', '#7a8b6f', '#b5651d', '#6b6b6b', '#c9b79c', '#8e3b46', '#2d2d2d'];

export function buildFurniture(id, color) {
  const g = builders[id](color);
  g.userData.id = id;
  return g;
}

/** Real-world size in metres (x = width, y = height, z = depth) at yaw 0. */
export function measure(g) {
  const keep = g.rotation.y;
  g.rotation.y = 0;
  g.updateMatrixWorld(true);
  const s = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
  g.rotation.y = keep;
  g.updateMatrixWorld(true);
  return s;
}

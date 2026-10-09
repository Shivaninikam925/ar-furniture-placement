# AR Furniture Placement (WebXR)

A deployable, install-free AR app. Pick a piece of furniture, aim your phone at the floor, tap to place it at true 1:1 scale.

## What it implements (maps to the seminar slides)
| Slide topic | Implementation |
|---|---|
| Room scanning / surface anchoring | WebXR `hit-test`; reticle only turns green on flat, upward-facing surfaces |
| Catalog selection | 7 procedural 3D models with real-world dimensions (cm shown in UI) |
| Interactive adjust | Rotate ±15° / slider, re-colour, "Move last" mode, Undo, Clear |
| Motion tracking | Handled by the device's WebXR runtime (ARCore) |
| Light estimation | `XREstimatedLight` + soft shadow catcher under the newest item |
| True 1:1 scale | All geometry is authored in metres |
| No-download WebAR | Runs in the browser, no app install |
| Fallback | 3D orbit preview + "does it fit my room W×D?" check on unsupported devices |

## Run locally
```bash
cd ar-furniture
npx serve .            # or: python3 -m http.server 8000
```
WebXR requires **HTTPS** (localhost counts as secure). To test on an Android phone:
1. Plug in via USB, enable USB debugging, open `chrome://inspect/#devices` on desktop Chrome.
2. Port-forward `8000 → localhost:8000`, then open `http://localhost:8000` on the phone.

## Deploy (all give HTTPS automatically; no build step)
- **Netlify**: drag the `ar-furniture` folder onto https://app.netlify.com/drop
- **GitHub Pages**: push the folder to a repo → Settings → Pages → deploy from `main` / root
- **Vercel**: `npx vercel --prod` inside the folder

## Device support
- Android + Chrome (ARCore-capable phone, Google Play Services for AR): full AR
- iPhone/iPad Safari: no WebXR AR → 3D preview mode (use the free "WebXR Viewer" app, or add USDZ/Quick Look for native iOS AR)
- Desktop: 3D preview mode

## Add your own furniture
Edit `furniture.js`: add a builder to `builders` and an entry to `CATALOG`. To use real `.glb` models, load them with `GLTFLoader` (copy it from three's `examples/jsm/loaders`) and scale to metres.

## Files
`index.html` · `style.css` · `app.js` (AR session, UI) · `furniture.js` (models) · `vendor/` (three.js r160, MIT, bundled so nothing loads from a CDN)

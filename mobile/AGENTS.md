# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

## ⚠️ SecureStore Keys — MUST match across files

The auth token is stored/read with different keys depending on the file. **Keep them in sync**:

| Action | Key | File |
|---|---|---|
| **Save token** after login | `jwt_token` | `src/features/auth/store.ts:18` |
| **Read token** for API requests | `jwt_token` ← must match | `src/api/client.ts:22` |
| **Read token** for session check | `jwt_token` ← must match | `src/features/auth/store.ts:29` |
| **User data** storage | `user_data` | `src/features/auth/store.ts:19` |

**Historical bug:** `api/client.ts` used `'user_token'` instead of `'jwt_token'`, causing every API request to be sent without an Authorization header. If you see `[SyncService] Error: Error de conexión con el servidor` and the network is up, check this mismatch first.

---

## ⚠️ Babel Plugin Order (WatermelonDB + React Native)

`babel.config.js` plugin order is **critical** and must remain as follows:

```js
plugins: [
  ['@babel/plugin-proposal-decorators', { legacy: true }],            // 1. WatermelonDB @field/@children/@relation
  ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],// 2. Strip TS `declare` before class-features
  ['@babel/plugin-transform-class-properties', { loose: true }],       // 3. Loose needed post-decorators for WatermelonDB
  ['@babel/plugin-transform-private-methods', { loose: true }],        // 4. React Native uses #privateMethod
  'react-native-reanimated/plugin'                                     // 5. MUST be last (Reanimated requirement)
]
```

**Why `loose: true` breaks React Native Event.js:** With `loose: true`, class properties become `this.NONE = 0` instead of `Object.defineProperty`. React Native's `Event.js` defines `NONE, CAPTURING_PHASE, AT_TARGET, BUBBLING_PHASE` as non-writable on the prototype via `Object.defineProperty` AFTER the class. The constructor's `this.NONE = 0` traverses the prototype chain, hits the non-writable property, and throws `TypeError: Cannot assign to read-only property 'NONE'`.

**Fix:** `patches/react-native+0.86.0.patch` adds `writable: true` to all 8 `Object.defineProperty` calls in `node_modules/react-native/src/private/webapis/dom/events/Event.js`. The `postinstall` script runs `patch-package` to apply it automatically.

---

## ⚠️ Backend Auth Middleware — truthy string bypass

`backend/src/middleware/auth.ts:9` returns a **truthy string** when no Authorization header is present:

```ts
return { authUser: "NO_HEADER: " + JSON.stringify(headers) }  // ← BUG: truthy, bypasses onBeforeHandle
```

This should be `return { authUser: null }` so the `onBeforeHandle` 401 check actually fires. As it stands, handlers run with `authUser.id === undefined`, and Prisma silently ignores `undefined` in `where` clauses (matching the first record in the DB).

---

## ⚠️ react-native-nitro-sound — API surface

The package name is `react-native-nitro-sound` but the exported symbol is `Sound`, **not** `NitroSound`:

```ts
// ✅ Correcto
import Sound from 'react-native-nitro-sound';

// ❌ Incorrecto — NitroSound no existe como export
import { NitroSound } from 'react-native-nitro-sound';
```

**Method names differ from common audio libraries** — the API uses `Recorder`/`Player` suffix, not `Recording`/`Play`:

| Lo que esperarías | API real |
|---|---|
| `startRecording(opts)` | `startRecorder(uri?, audioSets?, meteringEnabled?)` |
| `stopRecording()` | `stopRecorder()` |
| `startPlayer()` | `startPlayer(uri?, httpHeaders?)` |
| `stopPlayer()` | `stopPlayer()` |

The return type of recorder methods is `Promise<string>`, not `void`.

### AudioSet type (recording options)

```ts
interface AudioSet extends CommonAudioSet, IOSAudioSet, AndroidAudioSet {}

interface CommonAudioSet {
  quality: 'low' | 'medium' | 'high';
  channels?: number;      // 1 = mono, 2 = stereo
  sampleRate?: number;    // 22050, 44100, etc.
  bitRate?: number;
  duration?: number;      // max recording duration in seconds
}

interface AndroidAudioSet {
  audioSource?: AudioSourceAndroidType;  // DEFAULT=0, MIC=1, etc.
  outputFormat?: OutputFormatAndroidType;
  audioEncoder?: AudioEncoderAndroidType;
}

interface IOSAudioSet {
  audioQuality?: AVEncoderAudioQualityIOSType;  // min=0, low=32, medium=64, high=96, max=127
  mode?: AVModeIOSOption;
  encoding?: AVEncodingOption;
  linearPCMBitDepth?: AVLinearPCMBitDepthKeyIOSType;
}
```

**Historical bug:** `AudioRecorderService.ts` imported `{ NitroSound }` (undefined) and called `startRecording`/`stopRecording` (wrong method names), causing `Cannot read property 'startRecording' of undefined`.

---

## ⚠️ Progress UI — muestra valor/máx

`CircularProgress.tsx` muestra `{value}/{max}` en el centro (ej. "0/20"). Si ves solo un número sin el target, es porque el componente está renderizando solo `{value}`. El fix está en el centro del SVG:

```tsx
<Text className="text-foreground text-lg font-bold">
  {value}/{max}
</Text>
```

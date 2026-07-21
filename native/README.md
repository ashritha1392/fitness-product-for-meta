# Native WDAT integration checklist

`src/glasses/WDATBridge.ts` defines the interface the whole app is written
against. Right now `MockWDATBridge` (also in that file) simulates it so the
app runs without hardware. To go from mock to real glasses:

1. **Get Meta partner/developer preview access** to the Wearables Device
   Access Toolkit (WDAT) — as of mid-2026 this is still partner-gated, with
   broader general availability expected later in the year. Apply via
   https://developers.meta.com/wearables/.
2. **Android**: follow Meta's "Integrate Wearables Device Access Toolkit
   into your Android app" guide to register the app, request camera-frame
   streaming + audio permissions, and receive the paired-device callbacks.
   Implement a `native/android/WDATBridgeAndroid.ts` (or a Kotlin native
   module bridged via `NativeModules`) that satisfies the `WDATBridge`
   interface.
3. **iOS**: same shape, following the iOS integration guide. Implement
   `native/ios/WDATBridgeIOS.ts` similarly.
4. **Swap the mock**: in `src/state/sessionStore.ts`, replace
   `new MockWDATBridge(...)` with a platform-selected real bridge
   (`Platform.OS === "android" ? new WDATBridgeAndroid() : new WDATBridgeIOS()`).
5. **Camera frame decoding**: `src/vision/GlassesLimbTracker.ts` has a
   `decode()` TODO — once real `CameraFrame.data` bytes are flowing, plug in
   an on-device hand/wrist keypoint model there.
6. **Display HUD**: `WDATBridge.updateDisplay()` is a no-op on Ray-Ban Meta
   Gen 1/2 (audio-only) and only does something on Ray-Ban Display hardware
   — the real bridge should check `hasDisplay()` before attempting to push
   content, same as the mock does.

Nothing in `src/` needs to change to support this — that's the point of the
adapter interface.

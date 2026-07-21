# Vantage

A hands-free AI form coach for Meta Ray-Ban Display glasses + your phone.

Vantage fuses your phone's camera (full-body view) with your glasses' POV
camera and open-ear audio to correct your squat, push-up, and lunge form in
real time — spoken in your ear, and shown on the Ray-Ban Display HUD — without
ever making you stop and look at a screen.

See [`docs/DIFFERENTIATION.md`](docs/DIFFERENTIATION.md) for exactly how this
differs from Garmin/Strava-on-glasses (endurance metrics + POV capture, no
body tracking) and Apple Fitness+ (video-follow-along, no camera-based form
check at all). See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the
full data-flow diagram.

## Status

This is an early scaffold: the core coaching logic (rep counting, sensor
fusion, cue throttling) is real, implemented, and unit-tested. The glasses
integration is built against Meta's actual Wearables Device Access Toolkit
(WDAT) interface, but runs against a mock (`MockWDATBridge`) since WDAT is
still partner-gated as of mid-2026. See `native/README.md` for what's needed
to go live on real hardware.

## Getting started

```bash
npm install
npm test          # runs the Jest suite for RepCounter / SensorFusion
npm run typecheck
```

To run the app itself, install Expo Go or set up a dev client
(`npx expo start`) — note the glasses integration will use the mock bridge
until you complete the native WDAT setup in `native/README.md`.

## Project layout

```
src/
  glasses/     WDATBridge interface + mock (Meta Wearables Device Access Toolkit adapter)
  vision/      PhoneBodyTracker, GlassesLimbTracker, SensorFusion
  coaching/    RepCounter (phase state machine), CoachingEngine (throttled voice cues)
  workouts/    ExerciseLibrary, WorkoutSession (orchestration), shared types
  state/       Zustand session store
  screens/     PairGlasses, SetupPhoneStand, Workout, Summary
native/        Integration checklist for swapping the mock for real WDAT
docs/          Architecture + differentiation write-ups
```

## Tests

```bash
npm test
```

Covers `RepCounter` (rep phase transitions, fault detection, hysteresis) and
`SensorFusion` (confidence-weighted fusion, staleness handling, graceful
degradation to a single sensor).

# Architecture

```
Phone camera (wide, propped up)          Glasses POV camera (WDAT)
        |                                          |
  PhoneBodyTracker                         GlassesLimbTracker
   (full-body joints)                    (hands/equipment, near-view)
        |                                          |
        +-------------------> SensorFusion <-------+
                          (confidence-weighted
                           angle fusion, per joint)
                                   |
                             RepCounter
                       (phase state machine + hysteresis,
                          fault thresholds per exercise)
                                   |
                            CoachingEngine
                     (throttled voice cues, priority: fault
                        > rep-feedback > encouragement)
                                   |
                              WDATBridge
                 speak() -> glasses open-ear speakers
              updateDisplay() -> Ray-Ban Display right-lens HUD
```

## Why two cameras

The glasses' camera is first-person: it sees what the wearer is looking at,
not the wearer's own torso or legs. That rules out full-body form-check from
glasses alone. The phone, propped a few feet away, sees the whole body but
sits far enough away that fine hand/equipment detail is coarser, and it can
lose a limb to camera framing or a passerby.

`SensorFusion` (`src/vision/SensorFusion.ts`) treats these as two noisy
estimators of the same joint angle rather than picking one: each frame from
each source carries a per-joint confidence, frames older than
`maxStalenessMs` are dropped, and remaining candidates are confidence-weighted
averaged, then exponentially smoothed. If only one source has fresh data,
that one is used alone — the system degrades gracefully instead of stalling
when a phone or glasses signal briefly drops out.

## Why coaching is throttled, not continuous

A model that speaks or updates the HUD on every frame is unusable — it talks
over itself and buries the one cue that matters. `CoachingEngine` enforces a
minimum gap between spoken cues (default 1.5s), prioritizes safety faults
over "good rep" encouragement, and never repeats the same line back-to-back.

## Data flow ownership

- `WorkoutSession` (`src/workouts/WorkoutSession.ts`) is the single
  orchestrator per exercise "set": it owns one `SensorFusion`, one
  `RepCounter`, and one `CoachingEngine` instance, and is the only thing that
  calls `glasses.updateDisplay()`.
- `src/state/sessionStore.ts` (Zustand) is the only place a `WorkoutSession`
  is constructed, so screens stay dumb — they read state and call
  `startExercise` / `endExercise`.

## What's genuinely implemented vs. stubbed

**Fully implemented, unit-tested, and platform-agnostic** (works today in
plain Node/Jest, no hardware needed): `math.ts`, `RepCounter`, `SensorFusion`,
`CoachingEngine`, `ExerciseLibrary`, `WorkoutSession`.

**Stubbed behind a typed interface**, pending Meta partner SDK access:
`WDATBridge`'s real (non-mock) implementation, and the camera-frame decode
step in `GlassesLimbTracker`. See `native/README.md` for the exact swap-in
steps — nothing in `src/vision` or `src/coaching` needs to change.

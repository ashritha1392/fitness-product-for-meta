# Why Vantage isn't Apple Fitness+, Strava, or Garmin-on-glasses

Meta's glasses ecosystem already has fitness features. It's worth being
precise about what they do, because it clarifies what's actually left to
build.

## What already exists on Meta glasses

**Garmin integration** (Ray-Ban Meta Gen 1/2, Oakley Meta HSTN): the glasses
can read your paired Garmin watch's data aloud — pace, distance, heart rate,
elevation — and "Autocapture" records a short video clip when you hit a
distance, speed, or heart-rate milestone. It's a voice interface and camera
trigger bolted onto watch telemetry.

**Strava integration**: overlays your run/ride stats (pace, splits, map) onto
photos and videos you captured with the glasses, for sharing. It's a
content/graphics layer on top of GPS activity data.

Both are built for **outdoor endurance sports** — running, riding — where the
watch already knows your heart rate and GPS splits. Neither one **looks at
you**. There is no camera-based analysis of your body in either integration;
the camera is used for POV photo/video capture, not form assessment.

## What Apple Fitness+ does

Video-follow-along classes plus Apple Watch biometrics (heart rate, calories,
rings). No camera-based movement analysis at all — it doesn't know if your
squat depth or elbow angle is correct, only that your heart rate is elevated
and you pressed "done."

## The actual gap

Nothing in this landscape answers: **"is my form correct on this rep, right
now, without me stopping to look at a screen?"** That's a strength/bodyweight
training problem (squats, push-ups, lunges), not an endurance-sport metrics
problem, and it requires actually seeing the body move — which is exactly
what Garmin/Strava-on-glasses and Apple Fitness+ both skip.

## What Vantage does differently

1. **Dual-camera fusion, not a single sensor.** The phone (propped up, wide
   view) tracks full-body joint angles; the glasses' POV camera contributes
   hand/equipment context for exercises where the wearer's own limbs are in
   view (push-ups). See `src/vision/SensorFusion.ts` — it fuses both,
   weighted by per-joint confidence, rather than trusting either alone.
2. **Real-time voice + AR HUD coaching, not a metrics readout.** The
   coaching engine (`src/coaching/CoachingEngine.ts`) speaks form corrections
   through the glasses' open-ear speakers *during* the rep, and — on Ray-Ban
   Display hardware — pushes rep count and a form-flag color to the
   right-lens HUD, so the wearer never has to look down at a phone or watch
   mid-set.
3. **Rep-phase state machine with hysteresis** (`src/coaching/RepCounter.ts`)
   for genuine rep counting and phase-aware fault detection (e.g. "knee
   caving in" flagged specifically at the bottom of a squat), not just
   "motion detected."

This is a strength/bodyweight-training companion, positioned next to — not
instead of — Garmin/Strava's endurance-sport strengths on the same glasses.

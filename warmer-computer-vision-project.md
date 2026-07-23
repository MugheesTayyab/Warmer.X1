# Project Warmer
### An AI that finds the exact thing you lost — in real time, in real clutter, live on camera

*Working name: **Warmer**. Backup options if it doesn't clear trademark search: **Bloodhound**, **Haystack**.*

---

## At a glance

| | |
|---|---|
| **CV sub-domain** | Open-vocabulary segmentation + video object tracking, fused with multimodal (vision-language) reasoning |
| **Core model** | Meta's SAM 3 (Segment Anything with Concepts), released Nov 2025 — plus a general vision-language model for disambiguation |
| **Interaction** | Say or type what you lost → sweep your phone or webcam over the mess → it glows the instant it's in frame |
| **Build time** | 2–4 weeks, solo builder, using existing open models and APIs |
| **One-line pitch** | Describe what you lost, sweep your phone over the chaos, and watch the exact item glow — even in a drawer of forty identical ones. |

---

## The problem

Everyone loses small things in visual clutter, constantly: keys under mail, a charger in a cable tangle, the right size socket on a cluttered pegboard, a kid's inhaler in a couch-cushion avalanche, a passport in a "important documents" drawer that hasn't been organized since 2019. It's a universal five-minutes-of-quiet-panic experience, and it happens to parents rushing out the door, tradespeople in a cluttered van, and anyone with ADHD or executive-function challenges for whom "a place for everything" never quite sticks. For blind and low-vision people, it isn't a minor annoyance — searching by touch through a pile they can't see is a genuine daily accessibility barrier.

There's a real "before → after" here: a scene where the object is *technically* visible but *effectively* invisible to a rushed or overwhelmed human eye, made instantly visible again. That's the same invisible-to-visible transformation that makes X-ray-style demos compelling, except it's grounded in something almost everyone has felt this week.

## The unique twist

This idea went through a real filter, and it's worth being upfront about that. Two earlier front-runners — an AI "condition scanner" for secondhand marketplaces and a contactless heart-rate-from-webcam demo — were dropped after research showed both are already busy in 2026. Damage/condition assessment now has dedicated, sometimes well-funded players in nearly every vertical: auto (Tractable, UVeye, Monk AI — the last acquired by ACV Auctions in 2022), equipment rental (Texada, Record360, CloudRent), short-term rental/property (Paraspot AI, PropCheckAI), and even thrift resale (a cluster of near-identical "scan it, price it" apps like ThriftAI and Price Snap). Contactless vitals-from-camera is likewise already productized (Circadify, FaceHeart offer SDKs for exactly this). None of that is a re-skin of face swap or virtual try-on, but none of it is white space either — and the brief asked for honesty over enthusiasm, so both got cut.

"Find the thing I lost" is different. The closest real precedent is Microsoft's **Find My Things** (part of Seeing AI, built for blind and low-vision users) — genuinely good prior art, but it works by *teaching* the app your specific item ahead of time from photos, not by understanding a spoken description on the fly. **DropFinder AI** solves a neighboring problem — GPS breadcrumbs and search-grid guidance for things dropped outdoors (rings, tools) — but it doesn't understand natural language or do live visual matching indoors. And the wave of generic "identify this object" camera apps (Lens-style tools) answer *"what is this?"* for a single, already-framed subject — the opposite problem from *"find this specific, half-hidden thing among a hundred others, live, as I sweep my phone around."*

What makes this buildable *now*, and not two years ago, is Meta's **SAM 3** ("Segment Anything with Concepts"), released November 19, 2025. It's the first model in the SAM family that accepts a short natural-language phrase (or an example image, positive or negative) and returns every matching instance in a scene at once, with stable tracked identities across video — including handling occlusion and reappearance, which is exactly what "buried under a pile, then briefly visible, then buried again" looks like. Nobody has yet wrapped that specific capability — zero-shot, language-described, live-tracked, occlusion-tolerant object finding — into a consumer product. That's the actual white space: not "nobody has ever pointed a camera at clutter," but "nobody has done it this way, with this model, without requiring you to pre-teach it your stuff first."

## How it works (technical)

```
Voice/text query  ("find my keys, not my roommate's")
        │
        ▼
Small LLM parses the query → a SAM 3 concept prompt
        (primary noun phrase + optional negative image exemplar)
        │
        ▼
Phone/webcam video → on-device motion-gated frame sampler
        (only ships a new frame when the view has meaningfully changed)
        │
        ▼
Cloud GPU: SAM 3 (or the newer, real-time-tuned SAM 3.1) runs
Promptable Concept Segmentation → masks + stable tracked IDs
for every candidate matching the concept, across the sweep
        │
        ▼
Vision-language disambiguation pass (only when >1 candidate exists)
        → ranks candidates against the fuller description
        │
        ▼
Live overlay on the camera feed: a glow on the true match,
intensifying as the phone gets physically closer (the "hot/cold" cue)
```

Walking through the harder engineering pieces:

- **Query → concept prompt.** SAM 3 takes short noun phrases natively ("black wallet," "phone charger"), so simple queries map almost directly. Longer or compositional utterances ("my keys, not my roommate's") get parsed by a lightweight LLM step into a primary concept plus a negative exemplar — this is, notably, close to the exact pattern Meta itself describes for using SAM 3 as a tool inside a multimodal reasoning system, so it's not a speculative integration.
- **Disambiguation.** SAM 3 alone will happily return three sets of keys if three are in frame. A second, slower call to a general vision-language model (Claude- or GPT-4V-class) resolves ties using the richer description — color, material, last-known context — and, when it genuinely can't tell, surfaces the top two candidates rather than confidently guessing wrong. A wrong-but-confident guess is worse for trust than an honest "could be either of these."
- **Latency is the real enemy, and the fix is architectural, not cosmetic.** SAM 3 is fast in isolation (Meta reports roughly 30ms per frame with 100+ detected objects on an H200 GPU), but it's an 848-million-parameter model that needs server-class GPU inference, so a phone-to-cloud-and-back round trip adds real network latency that a single "run it faster" fix can't erase. The answer is to only ship frames when the view has meaningfully changed (skip near-duplicate frames from a slow sweep), and to interpolate the on-screen highlight between cloud responses so the overlay tracks smoothly rather than stuttering. This is the single hardest, most "real engineering" piece of the build, and it's exactly the kind of problem a solo builder can solve elegantly without needing to train anything from scratch.

## The wow moment

A 15-second, three-beat sequence — funny, then impressive, then genuinely touching — built to be watched to the end, not just glanced at:

1. **(0–2s)** Overhead shot of real clutter — an actual messy junk drawer or garage pegboard, not a staged one.
2. **(2–4s)** A hand raises a phone, taps the app, says "find my keys."
3. **(4–5s)** A deliberate beat of nothing — the phone sweeps slowly, no highlight yet. This tension is doing real work; more on why below.
4. **(5–8s)** A soft glow snaps onto a sliver of keys barely visible under a stack of mail, with a satisfying chime, brightening as the phone moves closer.
5. **(8–12s)** Hard cut to a tougher example: a pegboard of a dozen near-identical sockets. "The 10 millimeter, not the 12." Only the correct one glows — the neighbors stay dark. This is the "wait, how did it know *that*" beat.
6. **(12–15s)** A softer final cut: a hand sweeping a couch-cushion pile, "find my daughter's inhaler," instant glow. End card: app name, tagline — *"Never tear the room apart again."*

## UI/UX design recommendations

- **Voice-first input, text as fallback.** You're already holding and moving the phone; typing a description mid-search is friction the product shouldn't add.
- **The highlight lives on the camera feed itself, not on a separate results screen.** The magic has to happen *in the world*, in the same frame the person is looking at — a results gallery would kill the live, augmented-reality feel that's the entire point.
- **Don't rush the reveal — the "cold search" beat is a feature.** An instant, zero-delay highlight can actually read as fake or too easy; a believable second or two of visible searching before the glow appears is what sells the "it's really looking" illusion. Here that pause is doing double duty: it's also hiding the genuine cloud round-trip latency, so the honest technical constraint and the ideal dramatic pacing point the same direction.
- **One-tap export of a short loop clip** (chaotic scene → object glowing) sized for vertical video, with a small default "Made with Warmer" mark — this exact chaos-to-relief arc is a natively satisfying loop format for organic resharing, distinct from a static screenshot.
- **Mobile is the only sensible home for the core interaction** — you're physically moving a camera through your own space — but a thin companion web view is useful for a household to pre-register commonly-hunted items ("dad's glasses," "the good scissors") so anyone can ask.
- **Build the audio-first accessibility mode from day one, not as a bolt-on.** Spoken hot/cold guidance for blind and low-vision users isn't just the right thing to do given the direct Microsoft precedent — it produces a second, independently powerful demo clip (someone finding their keys entirely by ear) that a text-and-box demo alone can't touch.

## Why this will resonate on LinkedIn

- **Relatable pain point beats abstract capability, by the widest margin of anything considered.** A CV engineer's feed audience includes plenty of non-CV people; "watch AI find your keys" needs zero technical context to land, unlike most segmentation demos.
- **Real-time reveal on a genuine, unedited screen recording reads as more credible than a polished product video** — in a moment when audiences are increasingly skeptical of AI demos that turn out to be staged, "this is literally my phone screen" is itself a trust signal.
- **The negation beat is comment-bait in the honest sense.** "Not the 12mm" is specific and surprising enough that a technical audience will want to ask how it works rather than scroll past — that's the difference between a demo that gets liked and one that gets discussed.
- **The plain-language-in, fast-payoff-out formula is a proven pattern, not a guess.** Google's Nano Banana became the top app on iOS across multiple countries in 2025 on almost exactly this promise — describe what you want in plain words, watch it happen in a couple of seconds — just applied there to image editing rather than physical search. Same underlying appeal, different domain.
- **A three-beat structure (funny → impressive → touching) is built for watch-through, not just a scroll-stopping first frame.** LinkedIn's current algorithm is widely reported to weight dwell time and completion over raw like/share counts, which rewards exactly this kind of "has to see how it ends" pacing over a single-beat "look how fast this is" clip.

## MVP build plan (2–4 weeks)

**Week 1 — Prove the riskiest part first.** Stand up SAM 3 (open-source, via the official repo or its Ultralytics integration) on a rented GPU instance. Build a bare-bones mobile-web camera capture flow streaming frames to it. Get "type a single word, see every matching instance highlighted live" working end to end before anything else — this de-risks the one piece that hasn't been done this way before.

**Week 2 — Natural language and disambiguation.** Add on-device speech-to-text and the LLM step that turns a full spoken sentence into a SAM 3 concept prompt, including negative-exemplar extraction for "not the X" phrasing. Build the vision-language disambiguation pass for multi-candidate scenes. Add the motion-gated frame sampler and client-side interpolation to start taming perceived latency.

**Week 3 — Build the actual magic.** The live overlay with the pulsing hot/cold proximity animation, sound, and haptics. The deliberately-paced "searching" state. The found-it confirmation state. One-tap shareable clip export with a watermark.

**Week 4 — Calibrate against real mess, add accessibility, film it.** Test against genuinely messy real scenes — a junk drawer, a garage pegboard, a couch, a bag of cables — to tune confidence thresholds and learn where it actually fails (near-identical objects in bulk, bad lighting, motion blur). Build the audio-first accessibility toggle. Film the demo in a real space rather than an overly staged one, since authenticity is part of what makes this format land.

**Cut for v1:** the shared-household "pre-register common items" companion feature; any persistent/ambient "last seen near the workbench" memory mode; true 3D spatial localization (2D on-screen highlighting plus simple proximity feedback is enough — don't build SLAM for this).

## Risks/why this might not work

- **Thin moat against the model owner itself.** This is built directly on Meta's own foundation model, and "hey Meta, find my keys" is an obvious extension of Meta's existing smart-glasses assistant. Google or Apple could ship a similar feature into their own camera/assistant layer without much friction either. The realistic goal here is being first to a genuinely delightful, focused execution — good for a portfolio, a launch moment, or an acquisition conversation — not assuming a durable independent moat.
- **Real clutter is meaner than benchmark conditions.** A drawer of thirty near-identical black cables, bad kitchen lighting, and fast motion blur will produce real misses and false highlights that a curated demo video won't show. The honest claim is "dramatically narrows the search," not "always finds it instantly."
- **Cost and latency don't disappear, they just get hidden well.** SAM 3-class inference needs server-class GPUs; a continuous live-video product has real per-user inference cost and network latency to manage — this isn't a one-shot photo tool, and that changes the unit economics conversation.
- **The consumer business model is genuinely uncertain.** This is a "delight when you need it" utility, not a daily habit — most people won't pay a standalone subscription for something used a few times a month. The more durable path is probably B2B or platform integration (warehouse/inventory search, insurance "prove you still own this," an accessibility partnership, or a feature license) rather than a standalone consumer app business — worth saying plainly rather than overselling the wow demo into a business case it doesn't automatically support.
- **Privacy needs a hard line at "user-initiated only."** The moment this becomes an always-on ambient camera watching a shared space, it's capturing other people's belongings and movements without their say-so. The MVP should stay strictly "you tap it, you sweep, it stops" — any persistent-memory feature is a separate, later conversation with its own consent design, not a default.

---

*Sources checked while grounding this recommendation: Meta AI's SAM 3 research page and blog, the arXiv SAM 3 paper, Ultralytics' SAM 3 documentation, Microsoft Research's "Find My Things" writeup, DropFinder AI and Circadify product pages, and market roundups on AI vehicle/equipment/property damage-detection tools and AI thrift-resale scanner apps, current as of July 2026.*

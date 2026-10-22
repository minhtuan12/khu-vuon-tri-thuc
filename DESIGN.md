---
version: alpha
colors:
  sky: "#cdf3ff"
  leaf: "#c9f3af"
  sunny: "#ffe884"
  coral: "#ffb3cf"
  ink: "#193b65"
  primary: "#0faf8b"
typography:
  display:
    fontFamily: "Baloo 2, Nunito, ui-rounded, sans-serif"
  body:
    fontFamily: "Nunito, ui-rounded, system-ui, sans-serif"
rounded:
  card: "33px"
  control: "999px"
spacing:
  cardGap: "18px"
components:
  adventureCard:
    background: "#fff1a7"
  navigation:
    background: "#ffffff"
---

## Overview

Khu Vườn Tri Thức is a luminous illustrated preschool world, inspired by the reference's cyan sky, soft rendered chibi children, lush grass, rounded cards and buoyant color. It is still an English learning product: the child can start an adventure immediately. The single memorable image is a classroom garden that comes alive as words are encountered.

The school name appears beside the supplied official logo (`public/school-logo.jpg`) in a white pill. Reuse the exact asset; never redraw the logo or bake interface copy into raster art.

## Colors

`src/styles.css` is the runtime token owner; the frontmatter records the durable semantic palette. Home card families add lemon (`#fff1a7`), pink (`#ffd4e7`) and lavender (`#e4d9ff`) with orange/pink/violet buttons. Navy ink is used on pale surfaces. The primary action is saturated turquoise. Avoid beige or near-black editorial treatments.

## Typography

Baloo 2 gives titles an inflated storybook rhythm; Nunito carries Vietnamese directions and English words. Keep all real text in HTML and never rasterize it into illustrations. Size controls for early readers and adults alike.

## Layout

Desktop: white school pill at left, playful wordmark centered, controls right. Panoramic school hero, a central welcome bubble, three large illustrated adventure cards, smaller adult/parent paths, then a floating bottom dock. On narrow screens the title moves below the top controls, adventure cards become a horizontal snap row, and the dock retains four 44px-plus targets. Lesson controls remain separate from decorative art.

## Elevation & Depth

Images are softly rendered 3D chibi scenes. Cards use white rims and diffuse blue shadows; CTAs are glossy and have inset lower edges. The sky/grass world is rich enough to carry the page, so forms in the teacher area stay calmer.

## Shapes

Characters, scenery and cards use generous rounded silhouettes. Pills are used for wayfinding and CTAs; small controls remain clearly tappable. The hero and art cards maintain stable aspect ratios so loading does not move buttons.

## Components

`TopBar` owns branding and sound/settings; `BottomDock` owns child-facing navigation; `AdventureCard` owns picture/title/action composition. Generated illustrations live in `public/illustrations/`. `GardenScene` and `WordArt` remain interactive SVGs inside lessons, where predictable hit areas and state transitions matter. Controls must have text, keyboard focus, and reduced-motion behavior.

## Do's and Don'ts

- Use original chibi illustrations inspired by the reference's visual medium and palette.
- Keep the supplied official school logo and existing school-name text together.
- Preserve existing lessons, voice, persistence and AI behavior during visual changes.
- Do not replace game choices with non-interactive images or claim word mastery from a tap.

## Learning experiences

The adult preparation area uses the same sky/leaf palette with quieter panels. Story and review choices use yellow/lavender illustrated cards, while the child player retains Mầm and the six-stage garden. Preview opens in the canonical dialog without changing real progress or opening a new tab. New scene art is decorative only; controls, text and interactive objects stay in HTML/SVG. Source: the implementation plan approved on 2026-10-22.

## Learning roadmap

`/roadmap` adds a stepping-stone path through three gardens. The signature is a dotted trail joining four large illustrated vocabulary stones, staggered across desktop and alternating vertically on mobile. No locked lessons, leaderboard or streak pressure. Completed experiences bloom as flowers; this is participation, not a proficiency score. Reuse the existing garden artwork.

Runtime mapping remains Model B: `src/styles.css` palette/font variables → `src/roadmap.css` layout/state styles → roadmap and RoadmapLesson. No independent palette. Shared Dialog, Select, BigButton and WordArt own their interactions. BottomDock now has five destinations with a dedicated Lộ trình entry.

User-requested evolution (2026-10-22): all spoken output is English, preferring identifiable installed female voices. Vietnamese remains for navigation/adult explanations and existing approved story captions. Roadmap activities use short English directions and an adult-consented browser microphone turn: generous word matching gives encouraging “Wonderful!” or “Try again!” feedback, but is never presented as a pronunciation score.

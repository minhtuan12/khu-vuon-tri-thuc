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

The school name appears as text in a white pill. The flower/school icon is decorative and is not represented as the school's official logo. Never recreate the reference's unrelated categories or bake copy into raster art.

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
- Keep actual school identity as text until an official logo asset is supplied.
- Preserve existing lessons, voice, persistence and AI behavior during visual changes.
- Do not replace game choices with non-interactive images or claim word mastery from a tap.

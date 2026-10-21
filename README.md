🕯️ The Hollow Night

An 11-minute narrated horror short film, rendered entirely in code with HTML5 Canvas, the Web Audio API and browser speech synthesis. No video files, no audio files, no dependencies.

## Story
Elena Voss receives a letter from her dead grandmother with rules she must not break: don't answer the knocking, don't say the girl's name, and don't run. As she crosses Ashwood Cemetery and enters the old house, the ghost of Mara, a girl locked in a closet in 1962, starts getting closer.

## Features
- 9 chapters with a connected storyline, narration and subtitles
- Procedural animation: storms, lightning with branching bolts, rain, fog, graveyards, a haunted house, a mirror scene and a night-vision found-footage scene
- All sound is generated live: thunder, wind, heartbeat, creaks, whispers, music box and a jump scare
- Film-style grain, vignette, flicker, glitch effects and letterbox bars

## Run it
1. Clone or download the repo.
2. Open the folder in VS Code and use the **Live Server** extension on `index.html`, or just open `index.html` in a browser.
3. Use **Chrome or Edge** for the best narration voice, then click **BEGIN**. Headphones and a dark room are recommended.

## Controls
| Key | Action |
|---|---|
| Space | Pause / resume |
| R | Restart |
| 1–9 | Jump to chapter |
| F | Fullscreen |
| M | Mute |

## Customize
- Story lines: the `NL` array in `js/main.js`
- Chapter lengths: the `D` array at the top of `js/main.js`

## Tech
Vanilla JavaScript, HTML5 Canvas, Web Audio API, Web Speech API.

## Content warning
Contains flashing lights, loud sounds and jump scares.

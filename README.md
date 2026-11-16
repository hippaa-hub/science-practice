# Science practice app

A small web app for one Grade 7 student: about ten minutes of science a day. It uses review boxes (spaced repetition) and short written answers. Built with React, TypeScript and Vite. Progress is stored on the device only.

- `npm run dev`: run it locally
- `npm test`: engine, content and end-to-end tests
- `npm run build`: builds the static site into `dist/`

Content lives in `src/content/`, one file per topic. To add a topic, copy a topic file and add it to `src/content/index.ts`. `currentTopic` in that file is what the class is studying now.

Open the app with `?reset` at the end of the address to wipe the progress saved on this device.

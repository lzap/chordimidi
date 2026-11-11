# Project instructions

- Edit `src/`, not generated `dist/`; prefer browser-native code and explain any new dependency.
- Before committing, run `node --test`, `node scripts/build.mjs`, and `git diff --check`.
- Make one focused commit per requested change with a brief message, then push `main`.
- Each push runs `.github/workflows/pages.yml`. Wait for build and deploy success, then check `https://lukas.zapletalovi.com/chordimidi/`.

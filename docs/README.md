# Equation Rigid Bodies Web Build

This folder is the static web build for browser hosting.

Files kept here:

- `index.html`
- `styles.css`
- `script.js`
- `.nojekyll`

## Upload targets

This folder can be uploaded directly to:

- GitHub Pages
- Netlify
- Vercel static hosting
- any plain static web server

## GitHub Pages

1. Push the repo to GitHub
2. Open repository `Settings`
3. Open `Pages`
4. Set source to `Deploy from a branch`
5. Pick your branch and choose `/docs`
6. Save

Then GitHub Pages will publish the game from this folder.

## Netlify

1. Create a new site from this repo
2. Set publish directory to `equation-rigid-bodies/docs`
3. No build command is needed

## Update workflow

When the main game files change, copy these three files into `docs` again:

- `index.html`
- `styles.css`
- `script.js`

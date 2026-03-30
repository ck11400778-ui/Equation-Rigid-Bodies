# Equation Rigid Bodies

This game is already written in plain `HTML/CSS/JS`, so it can run as:

- a browser game
- an Electron desktop app

## Open as a web game

The easiest way on Windows is to double-click:

- `Open Equation Rigid Bodies Web.vbs`

If you want the visible launcher window instead, double-click:

- `Open Equation Rigid Bodies Web.cmd`

Both launch `index.html` in your default browser.

## Static web hosting

For web deployment, use the `docs` folder:

- [docs/index.html](c:/Users/biduo/創作遊戲/codex/equation-rigid-bodies/docs/index.html)
- [docs/styles.css](c:/Users/biduo/創作遊戲/codex/equation-rigid-bodies/docs/styles.css)
- [docs/script.js](c:/Users/biduo/創作遊戲/codex/equation-rigid-bodies/docs/script.js)

That folder is ready for:

- GitHub Pages
- Netlify
- other static hosting

There is no build step required for the web version right now.

## Publish to GitHub Pages

If you want a real shareable URL, use GitHub Pages with the `docs` folder.

1. Create a new GitHub repository.
2. Upload the whole `equation-rigid-bodies` folder to that repository.
3. Open the repository on GitHub.
4. Go to `Settings` -> `Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select your main branch and set the folder to `/docs`.
7. Click `Save`.

After a short wait, GitHub will give you a URL like:

```text
https://your-name.github.io/your-repo-name/
```

If you update the game later, upload your changed files and make sure these three files are copied into `docs` too:

- `index.html`
- `styles.css`
- `script.js`

## Run as a desktop app

1. Install Node.js
2. Move into the game folder:

```powershell
cd equation-rigid-bodies
```

3. Install dependencies:

```powershell
npm install
```

4. Start the desktop game:

```powershell
npm start
```

## Build an executable

Create an unpacked desktop build:

```powershell
npm run package
```

Create an installer:

```powershell
npm run dist
```

## Main files

- `index.html`: browser game UI
- `styles.css`: styling
- `script.js`: game logic
- `main.js`: Electron desktop wrapper

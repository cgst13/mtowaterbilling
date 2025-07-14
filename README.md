# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deploying to GitHub Pages

1. Make sure your `vite.config.js` has the correct base:
   ```js
   export default defineConfig({
     // ...
     base: '/mtowaterbilling/',
   });
   ```
2. Your `package.json` should have:
   ```json
   "homepage": "https://yourusername.github.io/mtowaterbilling/",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Install gh-pages if you haven't:
   ```sh
   npm install --save-dev gh-pages
   ```
4. Deploy:
   ```sh
   npm run deploy
   ```
   This will publish your site to the `gh-pages` branch and make it available at `https://yourusername.github.io/mtowaterbilling/`.

## Cloning and Running on Another Device

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/mtowaterbilling.git
   cd mtowaterbilling
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
   Or build and preview production:
   ```sh
   npm run build
   npm run preview
   ```
4. To deploy, run:
   ```sh
   npm run deploy
   ```

**Note:**
- Do not commit `node_modules` or `dist`.
- Make sure `.gitignore` includes these folders.
- Update the `homepage` and `base` in config if you change your repo name or GitHub username.

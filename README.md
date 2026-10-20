# ParasVeer Gems

A static jewelry catalog built for GitHub Pages. No package installation or build is required.

## Preview locally

Open a terminal in this project folder, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit http://127.0.0.1:8000. Opening index.html directly does not load catalog.json reliably; use the server.

## Publish on GitHub Pages

1. Create a GitHub repository and upload the contents of this folder to its root, including index.html, styles.css, app.js, config.js, catalog.json, favicon.svg, and .nojekyll. The jewelry folder is not needed when using R2.
2. In the repository, open Settings → Pages.
3. Under Build and deployment choose Deploy from a branch, select main and / (root), then Save.
4. Wait for the Pages deployment to finish. The website is served at https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/.

All paths are relative so the catalog also works under a repository subpath. The site is configured to request collection images from Cloudflare R2 at https://pub-81a2c2bcdba04819929ca77f8fa2c64b.r2.dev. Anyone who can access the public image URLs can view the images. The deployable ZIP excludes local jewelry images.

## Cloudflare R2 image storage

`config.js` is configured with your public R2 URL, and catalog.json uses your uploaded category filenames such as jewelry/bangles/BAN_001.jpg. Photos were matched to the renamed upload files by exact contents.

The active catalog uses your renamed R2 files. The older parasveer-r2-images.zip contains the original filenames and is retained only as a backup; it does not match the active catalog keys.

1. Sign in to https://dash.cloudflare.com/ and open Storage & databases → R2 → Overview. Activate R2 if required.
2. Create a Standard bucket named parasveer-gems-images.
3. Upload the extracted jewelry folder contents, preserving paths like jewelry/rings/RIN_001.jpg. Do not upload the ZIP itself as an image. If your uploader does not preserve folders, create each prefix in the dashboard or use an S3-compatible bulk uploader.
4. Bucket Settings → Public Development URL → Enable. Copy the resulting https://pub-….r2.dev URL.
5. Edit config.js and set imageBaseUrl to that URL with no trailing slash. Do not use the S3 API endpoint here.
6. Open an actual object URL to verify the image loads. Then preview the site and verify images across categories before removing bundled jewelry files from GitHub.

Example config.js:

```js
window.PARASVEER_CONFIG = {
  imageBaseUrl: "https://pub-YOUR-ID.r2.dev",
};
```

The r2.dev address is rate-limited and intended for development. For a production R2 image host, connect a custom domain to the bucket. The current catalog uses your R2 host. There is no local jewelry image folder in the website project.

R2 API keys are unnecessary for dashboard uploads. For automated uploads use an Object Read & Write token restricted to this bucket. Keep API secrets out of the repository and browser code. Only the public image base URL belongs in config.js. Ordinary image display with img tags does not require an upload CORS policy.

Official references:
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/r2/buckets/public-buckets/
- https://developers.cloudflare.com/r2/api/tokens/
- https://docs.github.com/en/pages/quickstart

## Content and behavior

- catalog.json contains 158 supplied collection photographs, grouped by the current category folders. Photo views can include repeats or alternate views of a design. They are not verified inventory records.
- Descriptive display titles are editorial labels, not certified gemstone, material, or product specifications.
- Search matches display names, categories, and references. Filters and sorting work together; Discover more reveals 24 views at a time.
- Hearts save references in this browser's local storage. There are no accounts or cross-device syncing.
- Saved pieces show contact links for Naitik Doshi: +91 98214 78941 and nrdjewel@gmail.com. There are no copy or download inquiry controls. Phone and email links open the visitor’s chosen calling or email app; the website does not send messages itself. The contact details and specialty text come from the supplied business card; its image and street address are not displayed.
- Prices, availability, and specifications are intentionally left for inquiry. No checkout or payment service is connected.
- Original category Lock is displayed as Clasps.

To add a photo, put it under jewelry/category-slug/, upload the same key to R2 if used, and add a catalog.json entry with a unique id, name, category, image key, and numeric reference. Reusing IDs causes saved selections to refer to the wrong piece.

## Typography and motion

Small text has been enlarged throughout the desktop and mobile layouts. Hero content enters with a brief stagger; collection items and contact information reveal once as they enter view. Image hover and dialog transitions are subtle. All entrance, reveal, and hover animation respects the browser’s prefers-reduced-motion setting.

import esbuild from 'esbuild';
import {mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
// Start clean so pictures replaced since the last build are not published.
rmSync('dist',{recursive:true,force:true});rmSync('inline',{recursive:true,force:true});
const assets=['.jpg','.jpeg','.png','.webp','.gif','.mp3','.m4a','.mp4','.woff2','.ics'];
const html=(js,css,inline)=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bhavitha &amp; Nagender - Wedding Events (#NaGuddu)</title>${inline?`<style>${css}</style>`:`<link rel="stylesheet" href="./${css}">`}</head><body><div id="root"></div>${inline?`<script>${js.replace(/<\/script/gi,'<\\/script')}</script>`:`<script src="./${js}"></script>`}</body></html>`;
// Hashed file names: every change gets a new URL, so phones never keep showing an old version.
const web=await esbuild.build({entryPoints:['src/main.tsx'],bundle:true,format:'iife',platform:'browser',outdir:'dist',entryNames:'[name]-[hash]',assetNames:'assets/[name]-[hash]',metafile:true,loader:Object.fromEntries(assets.map(x=>[x,'file'])),minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const out=Object.keys(web.metafile.outputs).map(f=>f.replace(/^dist\//,''));
writeFileSync('dist/index.html',html(out.find(f=>/^main-.*\.js$/.test(f)),out.find(f=>/^main-.*\.css$/.test(f)),false));
await esbuild.build({entryPoints:['src/main.tsx'],bundle:true,format:'iife',platform:'browser',outdir:'inline',loader:Object.fromEntries(assets.map(x=>[x,'dataurl'])),minify:true,define:{'process.env.NODE_ENV':'"production"'}});
writeFileSync('Wedding-Invitation.html',html(readFileSync('inline/main.js','utf8'),readFileSync('inline/main.css','utf8'),true));

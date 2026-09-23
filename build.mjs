import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const assets={};
for(const [file,type] of Object.entries({'index.html':'text/html; charset=utf-8','style.css':'text/css; charset=utf-8','interest.js':'text/javascript; charset=utf-8','assets/rack-reference.png':'image/png','assets/restaurant-concept.jpg':'image/jpeg'})) assets['/'+file]={type,body:readFileSync('dist/'+file).toString('base64')};
mkdirSync('dist/server',{recursive:true});
writeFileSync('dist/server/index.js','const ASSET_MAP='+JSON.stringify(assets)+';\n'+readFileSync('server/worker.js','utf8'));

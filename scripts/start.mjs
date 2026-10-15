import {cp,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),standalone=new URL('.next/standalone/',root);
await mkdir(new URL('public/',standalone),{recursive:true});
await cp(new URL('public/',root),new URL('public/',standalone),{recursive:true});
await cp(new URL('.next/static/',root),new URL('.next/static/',standalone),{recursive:true});
await import(new URL('server.js',standalone).href);

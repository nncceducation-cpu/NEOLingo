import fs from 'node:fs/promises';import path from 'node:path';
const root=process.cwd(),dest=path.join(root,'public/kurmanji-runtime');await fs.mkdir(dest,{recursive:true});
const base=path.join(root,'node_modules/piper-tts-web/dist');
for(const [from,to] of [['worker/OnnxWebWorker.js','onnx-worker.js'],['worker/PhonemizeWebWorker.js','phonemize-worker.js'],['piper/piper_phonemize.wasm','piper_phonemize.wasm'],['piper/piper_phonemize.data','piper_phonemize.data'],['onnx/ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.wasm'],['onnx/ort-wasm-simd-threaded.jsep.wasm','ort-wasm-simd-threaded.jsep.wasm']])await fs.copyFile(path.join(base,from),path.join(dest,to));
await fs.copyFile(path.join(root,'node_modules/piper-tts-web/LICENSE'),path.join(dest,'LICENSE-piper-tts-web.txt'));


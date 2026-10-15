import {parentPort} from 'node:worker_threads';
globalThis.postMessage=data=>parentPort.postMessage(data);
await import('../js/regex-worker.js');
parentPort.on('message',data=>globalThis.onmessage({data}));

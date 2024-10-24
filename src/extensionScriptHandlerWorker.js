import * as _ from './globalConstants.js'

const parent = OS.Worker.parent;
const abortWork = () => parent.onmessage = null; /* terminate the worker */

const startWork = async (data) => {
  await catchAsyncError(async ()=>{
  const {scriptPath, functionName, args} = data;
  const exports = await import(scriptPath);
  const cb = exports?.[functionName];
  const result = await cb(...args);
  parent.postMessage({type: 'abort', data: result})
  abortWork();
  },"startWork")
}

parent.onmessage = async (e) => {
  await catchAsyncError(async ()=>{
  const ev = e.data;
  switch(ev.type){
    case 'start': await startWork(ev.data); break;
    case 'abort': abortWork();
  }
  })
}

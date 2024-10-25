import * as _ from "./globalConstants.js";
import utils from "./utils.js";

const parent = OS.Worker.parent;

const startWork = async (data) => {
  await catchAsyncError(async () => {
    const { scriptPath, functionName, args } = data;
    const exports = await import(scriptPath);
    const cb = exports?.[functionName];
    if (!cb) {
      utils.notify(
        `Error in ${scriptPath}`,
        `No function named ${functionName} found in ${scriptPath}.`,
        'critical'
      )
      parent.postMessage({type: "error"})
      return;
    }
    try{
    const result = await cb(...args);
    parent.postMessage({ type: "success", data: result });
    }catch(error){
      utils.notify(
        `Error in ${scriptPath}`,
        error, 
        'critical'
      )
      parent.postMessage({type: "error"})
    }
  }, "startWork");
};

parent.onmessage = async (e) => {
  try{
  await catchAsyncError(async () => {
    const ev = e.data;
    switch (ev.type) {
      case "start":
        await startWork(ev.data);
        break;
      case "abort": parent.onmessage = null;
    }
  }, "Worker :: onmessage");
  }catch(error){
    parent.postMessage({type: 'error', data: error})
  }
};

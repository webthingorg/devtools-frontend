debugger;

const properties = [
  'CHROME_BIN',
  'CHROME_FEATURES',
  'JOBS',
  'TARGET',
  'TEST_PATTERNS',
  'COVERAGE',
];

const child_process = require('child_process');

const {spawn, spawnSync} = child_process;
function wrapSpawnSync(command, firstArg) {
  if (command === process.execPath && Array.isArray(firstArg)) {
    firstArg.unshift('-r', __filename);
  }
  return spawnSync.call(this, ...arguments);
}
function wrapSpawn(command, firstArg) {
  if (command === process.execPath && Array.isArray(firstArg)) {
    firstArg.unshift('-r', __filename);
  }
  return spawn.call(this, ...arguments);
}

if (spawn.toString() !== wrapSpawn.toString()) {
  child_process.spawn = wrapSpawn;
}
if (spawnSync.toString() !== wrapSpawnSync.toString()) {
  child_process.spawnSync = wrapSpawnSync;
}
const target = process.env;

const handler = {
  get(obj, prop, receiver) {
    if (!this.bypass && properties.includes(prop)) {
      this.bypass = true;
      console.trace(`>>> PROCESS.ENV[${prop}]`);
      this.bypass = false;
    }
    return target[prop];
  }
};

process.env = new Proxy(target, handler);

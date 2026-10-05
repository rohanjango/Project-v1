// Meet 2 — Step 26 routing smoke test.
// This test verifies URL routing without making network requests.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const context = {
  window: {},
  console,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'frontend', 'app-config.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'frontend', 'api-client.js'), 'utf8'), context);

const cfg = context.window.Meet2API.getConfig();
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(cfg.services.form5 === 'http://127.0.0.1:5000', 'Unexpected Form 5 service URL');
assert(cfg.services.main === 'https://meet--2-2emg.onrender.com', 'Unexpected main service URL');
assert(context.window.Meet2API.buildServiceUrl('form5', cfg.endpoints.generateForm5) === 'http://127.0.0.1:5000/api/generate-form5', 'Form 5 route mapping failed');
assert(context.window.Meet2API.buildServiceUrl('main', cfg.endpoints.submitProfile) === 'https://meet--2-2emg.onrender.com/api/submit', 'Submit route mapping failed');
assert(context.window.Meet2API.buildServiceUrl('main', cfg.endpoints.generateRoadmap) === 'https://meet--2-2emg.onrender.com/api/generate-roadmap', 'Roadmap route mapping failed');
assert(context.window.Meet2API.buildServiceUrl('main', cfg.endpoints.currentMission) === 'https://meet--2-2emg.onrender.com/api/mission/current', 'Mission route mapping failed');
assert(context.window.Meet2API.buildServiceUrl('main', cfg.endpoints.completeMission) === 'https://meet--2-2emg.onrender.com/api/mission/complete', 'Mission completion route mapping failed');
assert(context.window.Meet2API.buildServiceUrl('main', cfg.endpoints.progress) === 'https://meet--2-2emg.onrender.com/api/progress', 'Progress route mapping failed');
assert(context.window.Meet2API.buildServiceUrl('main', cfg.endpoints.copilot) === 'https://meet--2-2emg.onrender.com/api/copilot', 'Co-pilot route mapping failed');

console.log('TWO-BACKEND CONFIG TEST: PASS');

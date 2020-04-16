import {globalSetup, globalTeardown, resetPages} from './hooks.js';

before(async function() {
  this.timeout(30000);
  await globalSetup();
});

after(async () => {
  await globalTeardown();
});

beforeEach(async () => {
  await resetPages();
});
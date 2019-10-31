if (!self.Root || !self.Root.Runtime)
  {self.importScripts('Runtime.js');}
Runtime.startWorker('web_audio_worker');

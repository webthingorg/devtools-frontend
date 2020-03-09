const express = require('express')
const app = express()

express.static.mime.define({'application/webbundle': ['wbn']});
const handlers = [
  express.static("bundle"),
  express.static("front_end"),
];
app.use(...handlers);

const listener = app.listen(process.env.PORT || 8080, () => {
  console.log('The server is listening on port ' + listener.address().port);
});

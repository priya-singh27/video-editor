const cpeak = require("cpeak");
const { authenticate, serverIndex } = require("./middleware/index.js");
const apiRouter = require("./router.js");
const express = require('express');

const PORT = 8060;

// const server = new cpeak();
const server = new express();

// ------ Middlewares ------ //

// For serving static files
// server.beforeEach(cpeak.serveStatic("./public"));
server.use(express.static("public"));

// For parsing JSON body
// server.beforeEach(cpeak.parseJSON);
server.use(cpeak.parseJSON);

// For authentication
// server.beforeEach(authenticate);
server.use(authenticate);

// For different routes that need the index.html file
// server.beforeEach(serverIndex);
server.use(serverIndex);

// ------ API Routes ------ //
apiRouter(server);

// Handle all the errors that could happen in the routes
server.use((error, req, res, next) => {
  if (error && error.status) {
    res.status(error.status).json({ error: error.message });
  } else {
    console.error(error);
    res.status(500).json({
      error: "Sorry, something unexpected happened from our side.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});

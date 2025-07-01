const DB = require("../DB");

exports.authenticate = (req, res, next) => {
  const routesToAuthenticate = [
    "GET /api/user",
    "PUT /api/user",
    "DELETE /api/logout",
    "POST /api/upload-video",
    "GET /api/videos",
  ];

  if (routesToAuthenticate.indexOf(req.method + " " + req.url) !== -1) {
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split("=");
        acc[name] = value;
        return acc;
      }, {});

      const token = cookies.token;

      if (token) {
        DB.update();
        const session = DB.sessions.find((session) => session.token === token);
        if (session) {
          req.userId = session.userId;
          return next();
        }
      }
    }

    return res.status(401).json({ error: "Unauthorized" });
  } else {
    next();
  }
};

exports.serverIndex = (req, res, next) => {
  const routes = ["/", "/login", "/profile"];

  if (routes.indexOf(req.url) !== -1 && req.method === "GET") {
    return res.status(200).sendFile("./public/index.html", "text/html");
  } else {
    next();
  }
};

const User = require("./controllers/user");
const Video = require("./controllers/video");

module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  // server.route("post", "/api/login", User.logUserIn);
  server.post('/api/login', User.logUserIn);

  // Log a user out
  // server.route("delete", "/api/logout", User.logUserOut);
  server.delete('/api/logout',User.logUserOut);

  // Send user info
  // server.route("get", "/api/user", User.sendUserInfo);
  server.get('/api/user',User.sendUserInfo);

  // Update a user info
  // server.route("put", "/api/user", User.updateUser);
  server.put('/api/user', User.updateUser);

  // ------------------------------------------------ //
  // ************ VIDEO ROUTES ************* //
  // ------------------------------------------------ //
  server.get ("/api/videos", Video.getVideos);

  server.post("/api/upload-video", Video.uploadVideo);

  server.patch("/api/video/extract-audio", Video.extractAudio);//can only extract audio once

  server.get("/get-video-asset", Video.getVideoAsset);

  server.put("/api/video/resize", Video.resizeVideo);//Resize a video file (creates new video file)
};

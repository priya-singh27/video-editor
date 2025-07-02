const DB = require("../src/DB");
const FF = require("./FF");
const utils = require("./utils");

class JobQueue {
  constructor() {
    this.jobs = [];
    this.currentJob = null;
  }

  enqueue(job) {
    this.jobs.push(job);
    this.executeNext();
  }

  dequeue() {
    return this.jobs.shift(); //remove first element from the array
  }

  executeNext() {
    //dequeue an item
    if (this.currentJob) return;
    this.currentJob = this.dequeue();

    if(!this.currentJob) return;

    this.execute(this.currentJob);
  }

  async execute(job) {
    const {videoId, width, height} =job;
    // FFmpeg
    if (job.type === "resize") {
      DB.update();
      const video = DB.videos.find((video) => video.videoId === videoId);

      const orginalVideoPath = `./storage/${video.videoId}/original.${video.extension}`;
      const targetVideoPath = `./storage/${video.videoId}/${width}x${height}.${video.extension}`;

      try{

        await FF.resize(
            orginalVideoPath,
            targetVideoPath,
            width,
            height,
        );

        DB.update();
        const video = DB.videos.find((video) => video.videoId === videoId);

        video.resizes[`${width}x${height}`].processing=false;

        DB.save();

        console.log("Done resizing! Number of jobs remaining: ", this.jobs.length);
      }catch(err){
        utils.deleteFile(targetVideoPath);
      }
    }
    this.currentJob= null;
    this.executeNext();
  }
}

module.exports = JobQueue;

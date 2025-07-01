const {spawn} = require("node:child_process");
const { error } = require("node:console");
const { json } = require("node:stream/consumers");

const makeThumbnail = (fullPath, thumbnailPath)=>{
    //ffmpeg -i ffmpeg.webm -ss 5 -vframes 1 thumbnail.jpg
    
    return new Promise((resolve, reject) => {
        const thumbnail = spawn("ffmpeg", ["-i", fullPath, "-ss","5", "-vframes", "1", thumbnailPath]);//in the given video file go 5 seconds and save an image

        thumbnail.on("error", (error)=>{
            reject(error);
        });

        thumbnail.on('close', (code)=>{
            if(code === 0){
                console.log("Thumbnail created successfully!");
                resolve();
            }else{
                reject(`FFmpeg process exited with code: ${code}`);
            }
        });

    });
}

const getDimensions = (fullPath) => {
    // ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 ffmpeg.webm
    return new Promise((resolve, reject)=>{

        const dimensions = spawn("ffprobe", [
          "-v",
          "error",
          "-select_streams",
          "v:0",
          "-show_entries",
          "stream=width,height",
          "-of",
          "csv=p=0",
          fullPath,
        ]);

        let width,height;
        dimensions.stdout.on('data', (data)=>{
            const [widthStr, heightStr] = data.toString("utf-8").split(",");
            width = Number(widthStr.trim());
            height = Number(heightStr.trim());
        });

        dimensions.on('error', (error)=>{
            reject(error);
        });

        dimensions.on('close', (code)=>{
            if(code != 0){
                reject(`ffprobe exited with code ${code}`);
            }else{
                resolve({
                  width,
                  height
                });
            }
        });

    });
}

module.exports = {
  makeThumbnail,
  getDimensions,
};
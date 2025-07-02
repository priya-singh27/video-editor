const {spawn} = require("node:child_process");
const { error } = require("node:console");
const { json } = require("node:stream/consumers");

const makeThumbnail = (fullPath, thumbnailPath)=>{
    //ffmpeg -i ffmpeg.webm -ss 5 -vframes 1 thumbnail.jpg
    
    return new Promise((resolve, reject) => {
        const thumbnail = spawn("ffmpeg", ["-i", fullPath, "-ss","5", "-vframes", "1", thumbnailPath]);//in the given video file go 5 seconds and save an image

        thumbnail.on("error", (error)=>{
            console.log("FFmpeg spawn error:", error);
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

        let output = ""; 
        dimensions.stdout.on("data", (data) => {
          output += data.toString("utf-8");
        });

        dimensions.on('close', (code)=>{
            if(code === 0){
                const trimmedOutput = output.trim();
                const [widthStr, heightStr] = trimmedOutput.split(",");
                resolve({
                  width: Number(widthStr),
                  height:Number(heightStr)
                });
            }else{
                reject(`ffprobe exited with code ${code}`);
            }
        });

        dimensions.on('error', (error)=>{
            reject(error);
        });
    });
}

module.exports = {
  makeThumbnail,
  getDimensions,
};
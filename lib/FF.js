const {spawn} = require("node:child_process");
const { json } = require("node:stream/consumers");

const makeThumbnail = (fullPath, thumbnailPath)=>{
    console.log("Creating thumbnail...")
    //ffmpeg -i ffmpeg.webm -ss 5 -vframes 1 thumbnail.jpg
    const thumbnail = spawn("ffmpeg", ["-i", fullPath, "-ss","5", "-vframes", "1", thumbnailPath]);

    console.log("Created thumbnail successfully!");

    return new Promise((resolve, reject) => {
        thumbnail.on('close', (code)=>{
            if(code === 0){
                console.log("Thumbnail created successfully!");
                resolve(thumbnailPath);
            }else{
                reject(new Error(`FFmpeg process exited with code ${code}`));
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
            width = widthStr.trim();
            height = heightStr.trim();
            resolve({
                width: Number(width),
                height: Number(height)
            });
        });

        dimensions.stderr.on("data", (err) => {
          reject(err.toString());
        });

        dimensions.on("error", (err) => {
          reject(err);
        });

        dimensions.on('close', (code)=>{
            if(code != 0){
                reject(new Error(`ffprobe exited with code ${code}`));
            }
        });

    })
}

module.exports = {
  makeThumbnail,
  getDimensions,
};
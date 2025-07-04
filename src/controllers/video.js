const path = require("node:path");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const {pipeline} = require("node:stream/promises");
const utils = require('../../lib/utils');
const DB = require('../DB');
const FF = require('../../lib/FF');
const JobQueue = require('../../lib/JobQueue');
const cluster = require("node:cluster");

let jobs ;

if(cluster.isPrimary){
    jobs = new JobQueue();
}

const getVideos = (req, res, handleErr) => {
    DB.update();
    const videos = DB.videos.filter(video => video.userId === req.userId);

    res.status(200).json(videos);
}

const uploadVideo = async(req, res, handleErr)=>{
    const specifiedFileName = req.headers.filename;
    const extension = path.extname(specifiedFileName).substring(1).toLowerCase();//".png".substring(1).toLowerCase()
    const filename = path.parse(specifiedFileName).name;//{root:"", dir:"", base:"", name: "", ext:""}
    
    const videoId = crypto.randomBytes(4).toString("hex");

    const FORMATS_SUPPORTED = ["mov", "mp4", "webm"];

    if(!FORMATS_SUPPORTED.includes(extension)){
        return handleErr({
            status:400,
            message: "Valid formats: mp4, mov or webm"
        })
    }
    try{
        await fs.mkdir(`./storage/${videoId}`);
        const originalFilePath = `./storage/${videoId}/original.${extension}`;
        const file = await fs.open(originalFilePath, "w");
        const fileStream = file.createWriteStream();
        const thumbnailPath = `./storage/${videoId}/thumbnail.jpg`;

        // req.pipe(fileStream);
        await pipeline(req, fileStream);

        //Make a thumbnail for the videvideo.extensiono file
        await FF.makeThumbnail(originalFilePath, thumbnailPath);

        //Get the dimensions
        const dimensions = await FF.getDimensions(originalFilePath);
        
        DB.update();
        DB.videos.unshift({
            id: DB.videos.length,
            videoId,
            filename,
            extension,
            dimensions,
            userId: req.userId,
            extractedAudio:false,
            resizes: {}
        });
        DB.save();
        res.status(201).json({
            status: "success",
            message: "The file was uploaded successfully"
        });
    }catch(e){
        utils.deleteFolder(`./storage/${videoId}`);
        if (e.code !== "ECONNRESET") return handleErr(e);
    }
}

const getVideoAsset = async(req, res, handleErr)=>{
    const videoId = req.params.get("videoId");
    const type= req.params.get("type");//thumbnail, original, audio, resize

    DB.update();
    const video = DB.videos.find(video => video.videoId === videoId);

    if(!video){
        return handleErr({
            status: 404,
            message: "Video not found"
        });
    }

    let file;
    let mimeType;
    let filename;
    switch (type) {
      case "thumbnail":
        file = await fs.open(`./storage/${videoId}/thumbnail.jpg`, "r");
        mimeType = "image/jpeg";
        break;

      case "audio":
        file = await fs.open(`./storage/${videoId}/audio.aac`, "r");
        mimeType = "audio/aac";
        filename = `${video.filename}-audio.aac`;
        break;

      case "resize":
        const dimensions = req.params.get("dimensions");
        file= await fs.open(`./storage/${videoId}/${dimensions}.${video.extension}`);
        video.extension === "mp4"
          ? (mimeType = "video/mp4")
          : (mimeType = "video/webm");
        filename = `${video.filename}-${dimensions}.${video.extension}`
        break;

      case "original":
        file = await fs.open(
          `./storage/${videoId}/original.${video.extension}`,
          "r"
        );
        video.extension === "mp4"
          ? (mimeType = "video/mp4")
          : (mimeType = "video/webm");
        filename = `${video.filename}.${video.extension}`;
        break;
    }

    //grab file size
    const stat = await file.stat();

    const fileStream = file.createReadStream();

    if(type !== "thumbnail"){
        //Set a header to prompt for download
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    }

    //Set the content-type header based on the file type
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", stat.size);

    res.status(200);

    await pipeline(fileStream, res);

    file.close();

}

const extractAudio = async (req,res, handleErr)=>{
    const videoId= req.params.get("videoId");

    DB.update();
    const video = DB.videos.find(video => video.videoId === videoId);

    if(video.extractedAudio){
        return handleErr({
            status: 400,
            message:"Audio has already been extracted for this video"
        });
    }

    const originalVideoPath = `./storage/${videoId}/original.${video.extension}`;
    const targetAudioPath = `./storage/${videoId}/audio.aac`;
    try{
        await FF.extractAudio(originalVideoPath, targetAudioPath);

        video.extractedAudio = true;

        DB.save();

        res.status(200).json({
            status:"success",
            message:"The audio was extracted successfully"
        });

    }catch(err){
        utils.deleteFile(targetAudioPath);
        return handleErr(err)
    }

    
}

const resizeVideo = async (req, res, handleErr) => {
    const videoId = req.body.videoId;
    const width = Number(req.body.width);
    const height = Number(req.body.height);

    DB.update();

    const video = DB.videos.find(video => video.videoId === videoId);

    video.resizes[`${width}x${height}`] = {processing : true};// "1920x1080" : {processing:true}

    if(cluster.isPrimary){//if this is primary process
        jobs.enqueue({
          type: "resize",
          videoId,
          width,
          height,
        });
    }else{//if this is child process
        process.send({
          messageType: "new-resize",
          data: {
            videoId,
            width,
            height,
          },
        });
    }


    DB.save();

    res.status(201).json({
        status:"success",
        message:"The video is now being processed!"
    });

}

const controller= {
    getVideos,
    uploadVideo,
    getVideoAsset,
    extractAudio,
    resizeVideo
}

module.exports = controller;
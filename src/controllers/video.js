const path = require("node:path");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const {pipeline} = require("node:stream/promises");
const utils = require('../../lib/utils');
const DB = require('../DB');

const getVideos = (req, res, handleErr) => {
    const name = req.params.get("name");

    if(name){
        res.json({message:`Your name is ${name}`})
    }else{
        return handleErr({status: 400, message: "Please specify a name"})
    }
}

const uploadVideo = async(req, res, handleErr)=>{
    const specifiedFileName = req.headers.filename;
    const extension = path.extname(specifiedFileName).substring(1).toLowerCase();//".png".substring(1).toLowerCase()
    const filename = path.parse(specifiedFileName).name;//{root:"", dir:"", base:"", name: "", ext:""}
    
    const videoId = crypto.randomBytes(4).toString("hex");

    try{
        await fs.mkdir(`./storage/${videoId}`);
        const originalFilePath = `./storage/${videoId}/original.${extension}`;
        const file = await fs.open(originalFilePath, "w");
        const fileStream = file.createWriteStream();

        // req.pipe(fileStream);
        await pipeline(req, fileStream);

        DB.update();
        DB.videos.unshift({
            id: DB.videos.length,
            videoId,
            filename,
            extension,
            userId: req.userId,
            extractedAudion:false,
            resizes: {}
        });
        DB.save();
        res.status(200).json({
            status: "success",
            message: "The file was uploaded successfully"
        })
    }catch(e){
        utils.deleteFolder(`./storage/${videoId}`);
        if (e.code !== "ECONNRESET") return handleErr(e);
    }

    console.log(specifiedFileName, filename, extension);
}

const controller= {
    getVideos,
    uploadVideo
}

module.exports = controller;
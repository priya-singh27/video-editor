const fs= require('node:fs/promises');
const utils = {}

//Delete a file
utils.deleteFile = async (path)=>{
    try{
        await fs.unlink(path);
    }catch(e){
        console.log(e);
    }
}

//Delete a folder if exists
utils.deleteFolder = async (path) =>{
    try{
        await fs.rm(path, {recursive:true});
    }catch(e){
        console.log(e)
    }
}

module.exports = utils;
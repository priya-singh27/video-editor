const cluster = require('node:cluster');
const JobQueue = require('../lib/JobQueue.js');

if(cluster.isPrimary){
    const jobs = new JobQueue();

    const coresCount = require('node:os').availableParallelism();
    for(let i=0; i<coresCount; i++){
        cluster.fork();
    }

    cluster.on("message",(worker, message)=>{
        if(message.messageType === "new-resize"){
            const {videoId, height, width} =  message.data;
            jobs.enqueue({
                type: "resize",
                videoId,
                width,
                height
            });
        }
    });

    cluster.on("exit", (worker, code, signal)=>{
        console.log(`worker ${worker.process.pid} died (${signal} | ${code}). Restarting...`);
        cluster.fork();
    })
}else{
    require('./index.js');
}
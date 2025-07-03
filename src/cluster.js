const cluster = require('node:cluster');

if(cluster.isPrimary){
    const coresCount = require('node:os').availableParallelism();
    for(let i=0; i<coresCount; i++){

        cluster.fork();
    }
}else{
    require('./index.js');
}
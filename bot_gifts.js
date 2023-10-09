const DataBase = require('./database');
const Bot = require('./bot');

run = async function(){
    await DataBase.DB_init();
    Bot.botConnect();

};

run();
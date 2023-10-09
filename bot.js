const path = require('path'); 
const util = require('util'); 
const fs = require('fs');
const DataBase = require('./database');
const {EMBEDED} = require("./json/embeded.json");
const {CONTESTSTATUS, CONTESTTYPE} = require("./json/contestStatus.json")
const { BOT } = require('./config.json');
const { EmbedBuilder , Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
] });

exports.botConnect = function (){
    //// --------------------------------- Обработчик слэш команд ----------------------------------
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
    }
//// --------------------------------- Обработчик слэш команд ----------------------------------

    client.on('messageCreate', async msg => {
        if (msg.content == "+"){
            let resText = "";
            if (msg.guildId == BOT.GUILDS){
                let [idContest, typeContest] = await DataBase.getStartedContestIdByDyscordChannelID(msg.channelId);
                // console.log(idContest+" "+typeContest);
                if (idContest){
                    // console.log(`ОК`);
                    switch (typeContest) {
                        case 1: // 1 раз написал и участвуешь
                            resText = await DataBase.addMemberContestType1(idContest, msg.author.id);
                        break;
                        case 2: // + для увеличения шанса
                            resText = await DataBase.addMemberContestType2(idContest, msg.author.id);
                        break;
                        default:

                        break;
                    };
                    // console.log(resText);
                    let channel = await client.channels.fetch(msg.channelId);
                    channel.send ({content: resText});
                    await msg.delete();
                }
            };
        };
    });
    
    client.login(BOT.TOKEN);
};

exports.slashBotContestPublish = async function(type, head, body, status, discordChannelID){
    if(status!="STARTED"){console.log("Розыгрыш не запущен.");return;}
    let guild = await client.guilds.fetch(BOT.GUILDS); 
    let channel = await client.channels.fetch(discordChannelID);
    let everyone = await guild.roles.fetch("@everyone");
    let typePlus = "";
    switch (type) {
        case 1:
            typePlus = `Чтобы принять участие необходимо написать "+" в этом чате.`;
        break;
        case 2:
            typePlus = `Чтобы принять участие и повысить свои шансы пишите "+" в этом чате.`;            
        break;
        default:
            break;
    }
    let resText = `@everyone \n**Объявлен новый розыгрыш!**\n${typePlus}`;

    const exampleEmbed = new EmbedBuilder()
    .setColor(EMBEDED.Color)
    .setAuthor({ 
        name: EMBEDED.Author.name, 
        iconURL: EMBEDED.Author.iconURL, 
        url: EMBEDED.Author.url 
    })		
    .setTitle(head)
    .setDescription(body)
    ;
    await channel.send ({content: resText, embeds: [exampleEmbed] });
    // console.log("Розыгрыш опубликован");
};

exports.slashBotContestFinish = async function(type, head, body, status, discordChannelID){
    if(status!="FINISHED"){console.log("Розыгрыш не перешел на стадию подведения итогов.");return;}
    let guild = await client.guilds.fetch(BOT.GUILDS); 
    let channel = await client.channels.fetch(discordChannelID);
    let typePlus = "";
    switch (type) {
        case 1:
            typePlus = `Чтобы принять участие необходимо написать "+" в этом чате.`;
        break;
        case 2:
            typePlus = `Чтобы принять участие и повысить свои шансы пишите "+" в этом чате.`;            
        break;
        default:
            break;
    }
    let resText = `@everyone \nМы прекратили принимать новые заявки на участие в розыгрыше:\n**${head}**!**\n\nОжидайте информации о месте и времени подведения итогов!`;

    await channel.send ({content: resText });
    // console.log("Розыгрыш опубликован");
};


exports.slashBotContestResult = async function( discordChannelID, text ){
    let channel = await client.channels.fetch(discordChannelID);
    await channel.send ({content: text });
    // console.log("Розыгрыш опубликован");
};
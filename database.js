const path = require('path'); 
const util = require('util'); 
const Bot = require('./bot');
const {CONTESTSTATUS, CONTESTTYPE} = require("./json/contestStatus.json");
const { Sequelize, DataTypes, Op } = require('sequelize');
const sequelize = new Sequelize({   //  инициализация БД
    dialect: 'sqlite',
    storage: 'DB/database.sqlite',
    logging: false   //  Раскоментить чтобы убрать логи запросов в БД
});

const Contest = sequelize.define(   //  Объект - Конкурсы
    "Contest",
    {
        contest_id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        head:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        body:{
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status:{
            type: DataTypes.ENUM('CREATED','STARTED','FINISHED','ENDED'),
            allowNull: false,
            defaultValue: 'CREATED',
        },
        DiscordChannelID:{
            type: DataTypes.STRING,
            allowNull: false,
        }
    },{
        // Отключаем `createdAt`
        createdAt: false,
        // Отключаем `updatedAt`
        updatedAt: false,
    }
);

const Member = sequelize.define(    //  Объект - Участники
    "Member",
    {
        contest_id:{
            type: DataTypes.INTEGER,
            primaryKey: true,
            references:{
                model: Contest,
                key: 'contest_id',
            }
        },
        number:{
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        DiscordUserID: {
            type: DataTypes.STRING
        }
    },{
        // Отключаем `createdAt`
        createdAt: false,
        // Отключаем `updatedAt`
        updatedAt: false,
    }
);

function sleep(sec = 1) {   // Пауза в выполнении (в секундах)
    let ms = sec * 1000;
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
};

exports.splitMessage = async function(str, size){    //  Разрежет строку (str) при превышении ко-ва символов (size)
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)
    for (let i = 0, c = 0; i < numChunks; ++i, c += size) {
        chunks[i] = str.substr(c, size);
    }
    return chunks;
}

exports.DB_init = async function(){  //  Инициализация подключения к БД
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Соединение с БД было успешно установлено');
    } catch (e) {
        console.log('Невозможно выполнить подключение к БД: ', e);
    }
}

exports.DB_Create = async function(i = 1){
    try {
        let text = i.toString();
        await sleep(i);
        // await sequelize.authenticate();
        await Contest.create({type_id: 2, head: "Заголовок " + text , body: "Telo " + text, DiscordChannelID: text });
        console.log(`Залит с паузой в ${i} секунд.`);
    } catch (e) {
        console.log('Невозможно выполнить подключение к БД: ', e);
    }
};

exports.getStartedContestIdByDyscordChannelID = async function(discordChannelID){ //    +   Вернет [false, false] если для данного канала нет розыгрышей или [id, type] если есть
    try {
        let {count, rows} = await Contest.findAndCountAll({
            where:{
                [Op.and]: [{ DiscordChannelID: discordChannelID, }, { status: 'STARTED' }],                
            },
        });
        if (count != 0){
            return [rows[0].contest_id, rows[0].type_id];
        }else{
            return [false, false];
        }
    } catch (error) {
        console.log("getStartedContestIdByDyscordChannelID:");
        console.error(error);
    }
};

exports.addMemberContestType1 = async function(contestId, discordUserID){   //  +   обработчик + команды для первого типа розыгрыша
    try {
        let resText = "";
        let countMember = await Member.count({ where:{ [Op.and]: [{ contest_id: contestId, }, { DiscordUserID: discordUserID }], }, }); 
        if ( countMember !=0 ){
            let rowMember = await Member.findOne({ where:{ [Op.and]: [{ contest_id: contestId, }, { DiscordUserID: discordUserID }], }, });
            resText = `<@${discordUserID}>! \nВы уже уже участвуете в данном розыгрыше под номером **${rowMember.number}**.`;
        }else{
            let whl = true;
            let i = 0;
            do {
                i++;
                let lastNumber = await Member.max(
                    'number',
                    {
                        where:{
                            contest_id: contestId,                
                        },
                    }
                ) ;
                if (!lastNumber){lastNumber=0;}
                try {
                    let test = await Member.create({
                        contest_id: contestId,
                        number: lastNumber +1 ,
                        DiscordUserID: discordUserID,
                    });
                    resText = `<@${discordUserID}> зарезервирован номер **${lastNumber+1}**.`;
                    whl = false;
                } catch (errorTST) {
                    // console.error(errorTST);
                };
                
                if(i>=5){
                    resText = `Не удалось зарегистрировать в розыгрыше пользователя <@${discordUserID}>`;
                    whl=false;
                }else{
                    if(!whl){
                        await sleep(1);
                    };
                };
                
            } while (whl);
        };
        return resText;
    } catch (error) {
        console.log("addMemberContestType1:");
        console.error(error);
    }
};

exports.addMemberContestType2 = async function(contestId, discordUserID){ //    +   обработчик + команды для второго типа розыгрыша
    try {
        let resText = "";
        let whl = true;
        let i = 0;
        do {
            i++;
            let lastNumber = await Member.max(
                'number',
                {
                    where:{
                        contest_id: contestId,                
                    },
                }
            ) ;
            if (!lastNumber){lastNumber=0;}
            try {
                let countMember = await Member.count({ where:{ [Op.and]: [{ contest_id: contestId, }, { DiscordUserID: discordUserID }, { number: lastNumber }], }, });
                if ( countMember != 0 ){ return `<@${discordUserID}> ты был последним! Новую цифру тебе не добавлю.`; }
                let test = await Member.create({
                    contest_id: contestId,
                    number: lastNumber +1 ,
                    DiscordUserID: discordUserID,
                });
                resText = `<@${discordUserID}> зарезервирован номер **${lastNumber+1}**.`;
                whl = false;
            } catch (errorTST) {
                // console.error(errorTST);
            };
            
            if(i>=5){
                resText = `Не удалось зарегистрировать в розыгрыше пользователя <@${discordUserID}>`;
                whl=false;
            }else{
                if(!whl){
                    await sleep(1);
                };
            };
        } while (whl);
        return resText;
    } catch (error) {
        console.log("addMemberContestType2:");
        console.error(error);
    }
};


exports.slashContestList = async function(type){    //  +   ALL|CREATED|STARTED|FINISHED|ENDED
    try {
        let resText = "";
        let countContest;
        let rowsContest;
        switch (type) {
            case "CREATED":
                resText = "Список розыгрышей в статусе **'Создан'**:";
                countContest = await Contest.count({ where:{ status: type, }, order: [['contest_id','DESC']] }); 
                rowsContest = await Contest.findAll({ where:{ status: type, }, order: [['contest_id','DESC']] });
            break;
            case "STARTED":
                resText = "Список розыгрышей в статусе **'Проводится'**:";
                countContest = await Contest.count({ where:{ status: type, }, order: [['contest_id','DESC']] }); 
                rowsContest = await Contest.findAll({ where:{ status: type, }, order: [['contest_id','DESC']] });
            break;
            case "FINISHED":
                resText = "Список розыгрышей в статусе **'Подведение итогов'**:";
                countContest = await Contest.count({ where:{ status: type, }, order: [['contest_id','DESC']] }); 
                rowsContest = await Contest.findAll({ where:{ status: type, }, order: [['contest_id','DESC']] });
            break;
            case "ENDED":
                resText = "Список розыгрышей в статусе **'Завершен'**:";
                countContest = await Contest.count({ where:{ status: type, }, order: [['contest_id','DESC']] }); 
                rowsContest = await Contest.findAll({ where:{ status: type, }, order: [['contest_id','DESC']] });
            break;
            default:
                resText = "Список **всех** розыгрышей:";
                countContest = await Contest.count({  order: [['contest_id','DESC']] }); 
                rowsContest = await Contest.findAll({ order: [['contest_id','DESC']] });
            break;
        };
        resText = resText + "\n";
        if (countContest == 0){
            resText = resText + "Розыгрышей с выбранным статусом не найдено.";
        }else{
            for (let row of rowsContest){
                resText = resText + "\n";
                resText = resText + `(${CONTESTSTATUS[row.status]})\t**ID: ${row.contest_id}** \t|\tНазвание: ${row.head} \t|\tТип: ${CONTESTTYPE[row.type_id]} \t<#${row.DiscordChannelID}>`;
            };
        };
        return resText;
    } catch (error) {
        console.log("slashContestList:");
        console.error(error);
    };
};


exports.slashContestCreate = async function(type_id, head, body, discordChannelID ){    //  +   Создание розыгрыша
    try {
        let resText = "";
        let countContest = await Contest.count({ where:{ status: {[Op.ne]: "ENDED" } }, }); 
        let rowsContest = await Contest.findAll({ where:{ status: {[Op.ne]: "ENDED" } },  });
        if(countContest !=0 ){
            resText = "Не удалось зарегистрировать новый розыгрыш по причине: \n**Есть не закрытый розыгрыш**:\n";
            for(let row of rowsContest){
                resText = resText + `**ID:** ${row.contest_id} \t|\t статус: ${CONTESTSTATUS[row.status]}\n`;
            };
            resText = resText + `**Все розыгрыши должны быть полностью завершены прежде чем создавать новый**`;
        }else{
            let createContest = await Contest.create({
                type_id: type_id,
                head: head,
                body: body,
                DiscordChannelID: discordChannelID,
            });
            resText = `
Зарегистрирован новый розыгрыш с ID: \t**${createContest.contest_id}**
- Чтобы увидеть как он будет выглядить - выполните команду (/предпросмотр\\_розыгрыша id:[Сюда вставить текущий идентификатор ${createContest.contest_id}])
- Чтобы опубликовать (приступить к розыгрышу) - выполните команду (/публикация\\_розыгрыша id:[Сюда вставить текущий идентификатор ${createContest.contest_id}])
- Чтобы завершить розыгрыш и перейти к подведению итогов - выполните команду (/подведение\\_итогов\\_розыгрыша id:[Сюда вставить текущий идентификатор ${createContest.contest_id}])
- Если непонравилось оформление или закончили с розыгрышем выполните команду (/закрыть\\_розыгрыш id:[Сюда вставить текущий идентификатор ${createContest.contest_id}])
`;
        }
        return resText;
    } catch (error) {
        console.log("slashContestCreate:");
        console.error(error);
    };
};

exports.slashContestPreview = async function( id ){    //   +   Предпросмотр розыгрыша
    try {
        let countContest = await Contest.count({ where:{ contest_id: id, }, }); 
        if(countContest == 0){
            return [false, false, false, false, false];
        }else{
            let rowContest = await Contest.findOne({ where:{ contest_id: id, }, });
            return[
                rowContest.type_id,
                rowContest.head,
                rowContest.body,
                rowContest.status,
                rowContest.DiscordChannelID
            ];
        };
    } catch (error) {
        console.log("slashContestPreview:");
        console.error(error);
    };
};

exports.slashContestPublish = async function( id ){    //   +   Публикация
    try {
        let countContest = await Contest.count({ where:{ contest_id: id, status: 'CREATED' }, });
        if(countContest == 0){
            return [false, false, false, false, false];
        }else{
            let updateContest = await Contest.update( { status: 'STARTED', }, { where: { contest_id: id, }, } );
            let rowsContest = await Contest.findOne({ where: id, });

            await Bot.slashBotContestPublish(
                rowsContest.type_id,
                rowsContest.head,
                rowsContest.body,
                rowsContest.status,
                rowsContest.DiscordChannelID
                );
            return[
                rowsContest.type_id,
                rowsContest.head,
                rowsContest.body,
                rowsContest.status,
                rowsContest.DiscordChannelID
            ];
        };
    } catch (error) {
        console.log("slashContestPublish:");
        console.error(error);
    };
};


exports.slashContestFinish = async function( id ){    //    +   Перевод на стадию подведения итогов
    try {
        let countContest = await Contest.count({ where:{ contest_id: id, status: 'STARTED' }, });
        if(countContest == 0){
            return [false, false, false, false, false];
        }else{
            let updateContest = await Contest.update( { status: 'FINISHED', }, { where: { contest_id: id, }, } );
            let rowsContest = await Contest.findOne({ where: id, });

            await Bot.slashBotContestFinish(
                rowsContest.type_id,
                rowsContest.head,
                rowsContest.body,
                rowsContest.status,
                rowsContest.DiscordChannelID
                );
            return[
                rowsContest.type_id,
                rowsContest.head,
                rowsContest.body,
                rowsContest.status,
                rowsContest.DiscordChannelID
            ];
        };
    } catch (error) {
        console.log("slashContestFinish:");
        console.error(error);
    };
};


exports.slashContestEnd = async function( id ){    //   +   Закрытие конкурса
    try {
        let countContest = await Contest.count({ where:{ contest_id: id, }, });
        if(countContest == 0){
            return [false, false, false, false, false];
        }else{
            let updateContest = await Contest.update( { status: 'ENDED', }, { where: { contest_id: id, }, } );
            let rowsContest = await Contest.findOne({ where: id, });
            return[
                rowsContest.type_id,
                rowsContest.head,
                rowsContest.body,
                rowsContest.status,
                rowsContest.DiscordChannelID
            ];
        }
    } catch (error) {
        console.log("slashContestEnd:");
        console.error(error);
    };
};

exports.slashContestResult = async function( number ){    //    +   Вывод победителя с конкретным номером
    try {
        let countContest = await Contest.count({ where:{ status: 'FINISHED' }, });
        if(countContest == 0){
            return "Нет розыгрышей в статусе **Подведение итогов**";
        }else{
            let rowsContest = await Contest.findOne({ where: {status: 'FINISHED',}, });
            let countMember = await Member.count({ where: {contest_id: rowsContest.contest_id, number: number }, });
            if (countMember != 0){
                let rowsMember = await Member.findOne({ where: {contest_id: rowsContest.contest_id, number: number }, });
                let text = `Выбран участник <@${rowsMember.DiscordUserID}> с номером **${number}**`;
                await Bot.slashBotContestResult( rowsContest.DiscordChannelID,text);
                return text;
            }else{
                return `Участник с номером **${number}** не зарегистрирован.`;
            }

        }
    } catch (error) {
        console.log("slashContestResult:");
        console.error(error);
    };
};


exports.slashContestResultRandom = async function(){    //  +   Вывод рандомного победителя
    try {
        let countContest = await Contest.count({ where: {status: 'FINISHED',}, });
        if(countContest == 0){
            return "Нет розыгрышей в статусе **Подведение итогов**";
        }else{
            let rowsContest = await Contest.findOne({  where:{ status: 'FINISHED' }, });
            let rowsMember = await Member.findOne({ where: { contest_id: rowsContest.contest_id }, order: sequelize.random(), });
            let text = `Выбран случайный участник <@${rowsMember.DiscordUserID}> с номером **${rowsMember.number}**`;
            await Bot.slashBotContestResult( rowsContest.DiscordChannelID,text);
            return text;
        };
    } catch (error) {
        console.log("slashContestResultRandom:");
        console.error(error);
    };
};
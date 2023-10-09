const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const DataBase = require('../database');
const {CONTESTSTATUS, CONTESTTYPE} = require("../json/contestStatus.json");
const {EMBEDED} = require("../json/embeded.json");



module.exports = {
	data: new SlashCommandBuilder()
		.setName('подведение_итогов_розыгрыша')
		.setDescription('Административная команда для перехода к стадии подведения итогов.')
		.addIntegerOption(option => 
			option.setName('id')
			.setDescription('Идентификатор розыгрыша')
			.setRequired(true)
		)
		,
	async execute(interaction) {
		const id = interaction.options.getInteger('id');
		let [type, head, body, status, discordChannelID] = await DataBase.slashContestFinish(id);
		if (type!=false){
			let resText = `
Розыгрыш ID ${id} переведен на стадию "подведение итогов" <#${discordChannelID}>
- /вывести\\_участника\\_с\\_номером number:[Цифры] - Выведет участника с указанным номером
- /вывести\\_случайного\\_участника - Выведет случайного участника розыгрыша
`;
			
			return await interaction.reply({content: resText });
		}else{
			return await interaction.reply({content: `Что-то не так с вашим ID: ${id}` });
		}

	},
};
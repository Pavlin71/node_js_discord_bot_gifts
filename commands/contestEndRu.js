const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const DataBase = require('../database');
const {CONTESTSTATUS, CONTESTTYPE} = require("../json/contestStatus.json");
const {EMBEDED} = require("../json/embeded.json");



module.exports = {
	data: new SlashCommandBuilder()
		.setName('закрыть_розыгрыш')
		.setDescription('Административная команда для окончательного закрытия розыгрыша.')
		.addIntegerOption(option => 
			option.setName('id')
			.setDescription('Идентификатор розыгрыша')
			.setRequired(true)
		)
		,
	async execute(interaction) {
		const id = interaction.options.getInteger('id');
		let [type, head, body, status, discordChannelID] = await DataBase.slashContestEnd(id);
		if (type!=false){
			let resText = `
Розыгрыш ID **${id}** окончательно закрыт. Можно создавать новый!
`;
			
			return await interaction.reply({content: resText });
		}else{
			return await interaction.reply({content: `Что-то не так с вашим ID: ${id}` });
		}

	},
};
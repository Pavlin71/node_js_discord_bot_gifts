const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const DataBase = require('../database');
const {CONTESTSTATUS, CONTESTTYPE} = require("../json/contestStatus.json");
const {EMBEDED} = require("../json/embeded.json");



module.exports = {
	data: new SlashCommandBuilder()
		.setName('публикация_розыгрыша')
		.setDescription('Административная команда для публикации розыгрыша.')
		.addIntegerOption(option => 
			option.setName('id')
			.setDescription('Идентификатор розыгрыша')
			.setRequired(true)
		)
		,
	async execute(interaction) {
		const id = interaction.options.getInteger('id');
		let [type, head, body, status, discordChannelID] = await DataBase.slashContestPublish(id);
		// console.log(interaction);
		// interaction.guildId
		if (type!=false){
			let resText = `Розыгрыш ID ${id} отправлен на публикацию в канал <#${discordChannelID}>`;
			
			return await interaction.reply({content: resText });
		}else{
			return await interaction.reply({content: `Что-то не так с вашим ID: ${id}` });
		}
	},
};
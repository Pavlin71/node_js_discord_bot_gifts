const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const DataBase = require('../database');
const {CONTESTSTATUS, CONTESTTYPE} = require("../json/contestStatus.json");
const {EMBEDED} = require("../json/embeded.json");



module.exports = {
	data: new SlashCommandBuilder()
		.setName('вывести_участника_с_номером')
		.setDescription('Вывести участника с номером')
		.addIntegerOption(option => 
			option.setName('number')
			.setDescription('Порядковый номер участника')
			.setRequired(true)
		)
		,
	async execute(interaction) {
		let num = interaction.options.getInteger('number');
		let resText = await DataBase.slashContestResult(num);
		return await interaction.reply({content: resText, ephemeral: true });
	},
};
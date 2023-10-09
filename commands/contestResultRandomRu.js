const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const DataBase = require('../database');
const {CONTESTSTATUS, CONTESTTYPE} = require("../json/contestStatus.json");
const {EMBEDED} = require("../json/embeded.json");



module.exports = {
	data: new SlashCommandBuilder()
		.setName('вывести_случайного_участника')
		.setDescription('Вывести случайного участника')
		,
	async execute(interaction) {
		let resText = await DataBase.slashContestResultRandom();
		return await interaction.reply({content: resText, ephemeral: true });
	},
};
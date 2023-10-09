const { SlashCommandBuilder } = require('discord.js');
const {CONTESTTYPE} = require("../json/contestStatus.json")
const DataBase = require('../database');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('создать_розыгрыш')
		.setDescription('Административная команда для создания нового розыгрыша.')
		.addStringOption(option => 
			option.setName('type')
			.setDescription('Тип розыгрыша')
			.setRequired(true)
			.addChoices(	// ALL|CREATED|STARTED|FINISHED|ENDED
				{ name:CONTESTTYPE["1"], value: "1" },
				{ name:CONTESTTYPE["2"], value: "2" }
			)
		)
		.addChannelOption(option =>
			option.setName('channel')
			.setRequired(true)
			.setDescription('Канал в котором будет проходить розыгрыш призов!')
		)
		.addStringOption(option =>
			option.setName('head')
			.setRequired(true)
			.setDescription('Заголовок')
		)
		.addStringOption(option =>
			option.setName('body')
			.setRequired(true)
			.setDescription('Тест')
		)
		,
	async execute(interaction) {
		let resText = "Пытаемся зарегистрировать новый розыгрыш. Ожидайте...\n";
        await interaction.reply({ content: resText });//content: res, embeds: [exampleEmbed], , ephemeral: true



		let type = interaction.options.getString('type');
		let channel = interaction.options.getChannel('channel');
		let head = interaction.options.getString('head');
		let body = interaction.options.getString('body');

		resText = await DataBase.slashContestCreate(type,head,body,channel.id);
		var messageChunks = await DataBase.splitMessage(resText, 2000);
		//await interaction.deleteReply();
		for (chunk of messageChunks) {
			await interaction.followUp(chunk);
		}
		return ;
	},
};
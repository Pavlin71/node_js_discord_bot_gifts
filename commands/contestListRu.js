const { SlashCommandBuilder } = require('discord.js');
const DataBase = require('../database');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('список_розыгрышей')
		.setDescription('Административная команда для вывода списка розыгрышеий из БД!\nВсех или по категориям.')
		.addStringOption(option => 
			option.setName('status')
			.setDescription('Статус розыгрыша')
			.setRequired(true)
			.addChoices(	// ALL|CREATED|STARTED|FINISHED|ENDED
				{ name:"ВСЕ", value: "ALL" },
				{ name:"Создан", value: "CREATED" },
				{ name:"Проводится", value: "STARTED" },
				{ name:"Подведение итогов", value: "FINISHED" },
				{ name:"Завершен", value: "ENDED" }
			)
		)
		,
	async execute(interaction) {
		let resText = "Идет сбор данных. Ожидайте...\n";
        await interaction.reply({ content: resText });//content: res, embeds: [exampleEmbed], , ephemeral: true



		let type = interaction.options.getString('status');
		resText = await DataBase.slashContestList(type);
		let messageChunks = await DataBase.splitMessage(resText, 2000);
		for (chunk of messageChunks) {
			await interaction.followUp(chunk);
		}
		return ;
	},
};
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const DataBase = require('../database');
const {CONTESTSTATUS, CONTESTTYPE} = require("../json/contestStatus.json");
const {EMBEDED} = require("../json/embeded.json");



module.exports = {
	data: new SlashCommandBuilder()
		.setName('предпросмотр_розыгрыша')
		.setDescription('Административная команда для предварительного просмотра розыгрыша.')
		.addIntegerOption(option => 
			option.setName('id')
			.setDescription('Идентификатор розыгрыша')
			.setRequired(true)
		)
		,
	async execute(interaction) {
		const id = interaction.options.getInteger('id');
		let [type, head, body, status, discordChannelID] = await DataBase.slashContestPreview(id);
		if (type != false){
			let resText = `ВСЕМ ВСЕМ ВСЕМ. Объявлен новый розыгрыш. Подробности далее...`;
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
			await interaction.reply({content: resText, embeds: [exampleEmbed] });//content: res, 
			return await interaction.followUp(`
	Чуть-чуть подробностей для администраторов:
	Тип розыгрыша: ${CONTESTTYPE[type]}
	Текущий статус: ${CONTESTSTATUS[status]}
	Участие в канале <#${discordChannelID}>
			`);
		}else{
			return await interaction.reply({content: `Что-то не так с вашим ID: ${id}` });//content: res, 
		};

	},
};
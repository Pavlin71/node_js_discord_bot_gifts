const { REST, Routes } = require('discord.js');
//const { clientId, guildId, token } = require('./config.json');
const { BOTUTF } = require('./config.json');
clientId = BOTUTF.CLIENTID;
guildId = BOTUTF.GUILDS;
token = BOTUTF.TOKEN;
const rest = new REST({ version: '10' }).setToken(token);

// ...

// for guild-based commands
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);
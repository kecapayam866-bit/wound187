// bot.js
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

// Command collection
client.commands = new Collection();

// ----------------------
// TICKET PANEL BUTTON
// ----------------------
client.on('ready', async () => {
    console.log(`${client.user.tag} is online!`);

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.log("Guild not found");

    const channel = guild.channels.cache.find(c => c.name === 'ticket-panel');
    if (!channel) return console.log("Channel 'ticket-panel' not found");

    const panelEmbed = new EmbedBuilder()
        .setTitle('wound187 Support Panel')
        .setDescription('Select a category below.')
        .setColor('Blue');

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('new_ticket')
                .setLabel('Create Ticket')
                .setStyle(ButtonStyle.Primary)
        );

    // Send panel if it doesn't exist
    const messages = await channel.messages.fetch({ limit: 10 });
    const exists = messages.find(m => m.embeds[0]?.title === 'wound187 Support Panel');
    if (!exists) await channel.send({ embeds: [panelEmbed], components: [row] });
});

// ----------------------
// TICKET CREATION
// ----------------------
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'new_ticket') {
        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
        if (existing) return interaction.reply({ content: 'You already have an open ticket!', ephemeral: true });

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.id}`,
            type: 0, // GUILD_TEXT
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                }
            ]
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        const embed = new EmbedBuilder()
            .setTitle('Ticket Created')
            .setDescription(`Hello ${interaction.user}, our staff will be with you shortly.`)
            .setColor('Green');

        await ticketChannel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
        interaction.reply({ content: `Your ticket has been created: ${ticketChannel}`, ephemeral: true });
    }

    // Close ticket
    if (interaction.customId === 'close_ticket') {
        await interaction.channel.delete().catch(() => {});
    }
});

// ----------------------
// VOUCH COMMAND
// ----------------------
const vouchCommand = new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Leave a vouch for someone')
    .addUserOption(option => option.setName('user').setDescription('User to vouch').setRequired(true))
    .addStringOption(option => option.setName('comment').setDescription('Your comment').setRequired(true))
    .addIntegerOption(option => option.setName('rating').setDescription('Rating 1-5').setRequired(true));

client.commands.set(vouchCommand.name, vouchCommand);

client.on('ready', async () => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;
    await guild.commands.create(vouchCommand);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'vouch') {
        const user = interaction.options.getUser('user');
        const comment = interaction.options.getString('comment');
        const rating = interaction.options.getInteger('rating');

        if (rating < 1 || rating > 5) return interaction.reply({ content: 'Rating must be between 1 and 5.', ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle('New Vouch')
            .addFields(
                { name: 'User', value: `${user}`, inline: true },
                { name: 'Rating', value: `${'⭐'.repeat(rating)}`, inline: true },
                { name: 'Comment', value: comment }
            )
            .setColor('Gold')
            .setFooter({ text: `Vouch by ${interaction.user.tag}` });

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);

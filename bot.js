const Discord = require('discord.js-selfbot-v13');
const fetch = require('node-fetch');
const fs = require('fs');

const client = new Discord.Client({
    readyStatus: false,
    checkUpdate: false,
    partials: ['CHANNEL', 'MESSAGE']
});

function loadBlacklist() {
    try {
        const data = fs.readFileSync('bl.json');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveBlacklist(blacklist) {
    fs.writeFileSync('bl.json', JSON.stringify(blacklist, null, 2));
}

client.on('ready', () => {
    console.log(`${client.user.username} is online`);
    console.log('Made by @ghostyjija')
    console.lohg('Commands: \n- imagen <prompt> \n- blacklist <user> \n- unblacklist <user>');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('blacklist ') || message.content.startsWith('unblacklist ')) {

        if (message.author.id !== '978271662464176179') { // add your operational user id
            return message.reply('⛔ You do not have permission to use this command.');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Please mention a user to blacklist/unblacklist.');
        }

        const blacklist = loadBlacklist();

        if (message.content.startsWith('blacklist ')) {
            if (blacklist.includes(targetUser.id)) {
                return message.reply('⚠️ User is already blacklisted.');
            }
            blacklist.push(targetUser.id);
            saveBlacklist(blacklist);
            message.reply(`✅ Successfully blacklisted ${targetUser.tag}`);
        } else {
            if (!blacklist.includes(targetUser.id)) {
                return message.reply('⚠️ User is not blacklisted.');
            }
            const newBlacklist = blacklist.filter(id => id !== targetUser.id);
            saveBlacklist(newBlacklist);
            message.reply(`✅ Successfully unblacklisted ${targetUser.tag}`);
        }
        return;
    }
    const blacklist = loadBlacklist();
    if (blacklist.includes(message.author.id)) {
        return;
    }

    if (!message.content.startsWith('imagen ')) return;
    
    const prompt = message.content.slice(7).trim();
    if (!prompt) {
        return message.reply('❌ Please provide a prompt!');
    }

    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
        
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('API request failed');
        
        const imageBuffer = await response.buffer();
        
        await message.reply({
            files: [{
                attachment: imageBuffer,
                name: `generated_image_ghosty${Date.now()}.jpg`
            }]
        });
        console.log(`Image sent in ${message.channel.name} (${message.guild?.name || 'DM'}) by ${message.author.tag}`);
    } catch (error) {
        console.error(error);
        message.reply('❌ Failed to generate image with that prompt');
    }
});

client.login(""); // add ur account token
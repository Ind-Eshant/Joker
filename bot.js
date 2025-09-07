const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

function loadBlacklist() {
    try {
        const data = fs.readFileSync("bl.json");
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

function saveBlacklist(blacklist) {
    fs.writeFileSync("bl.json", JSON.stringify(blacklist, null, 2));
}

client.once("ready", () => {
    console.log(`${client.user.tag} is online ✅`);
    console.log("Made by @autm");
    console.log("Commands: \n- gen <prompt> \n- blacklist <user> \n- unblacklist <user>");
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // Blacklist / Unblacklist commands
    if (message.content.startsWith("blacklist ") || message.content.startsWith("unblacklist ")) {
        if (message.author.id !== "978271662464176179") { // your operational ID
            return message.reply("⛔ You do not have permission to use this command.");
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply("❌ Please mention a user to blacklist/unblacklist.");
        }

        const blacklist = loadBlacklist();

        if (message.content.startsWith("blacklist ")) {
            if (blacklist.includes(targetUser.id)) {
                return message.reply("⚠️ User is already blacklisted.");
            }
            blacklist.push(targetUser.id);
            saveBlacklist(blacklist);
            message.reply(`✅ Successfully blacklisted ${targetUser.tag}`);
        } else {
            if (!blacklist.includes(targetUser.id)) {
                return message.reply("⚠️ User is not blacklisted.");
            }
            const newBlacklist = blacklist.filter(id => id !== targetUser.id);
            saveBlacklist(newBlacklist);
            message.reply(`✅ Successfully unblacklisted ${targetUser.tag}`);
        }
        return;
    }

    // Load blacklist
    const blacklist = loadBlacklist();
    if (blacklist.includes(message.author.id)) {
        return;
    }

    // Image generation command
    if (!message.content.startsWith("gen ")) return;
    const prompt = message.content.slice(4).trim(); // fixed slice for "gen "
    if (!prompt) {
        return message.reply("❌ Please provide a prompt!");
    }

    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("API request failed");

        const imageBuffer = await response.buffer();

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`Prompt: ${prompt}`)  
            .setColor(0x2f3136)
            .setImage("attachment://generated_image.jpg")
            .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL()
            });

        await message.reply({
            embeds: [embed],
            files: [{
                attachment: imageBuffer,
                name: "generated_image.jpg"
            }]
        });

        console.log(`Image sent in ${message.channel.name} (${message.guild?.name || "DM"}) by ${message.author.tag}`);
    } catch (error) {
        console.error(error);
        message.reply("❌ Failed to generate image with that prompt");
    }
});

client.login(""); // Replace with your bot token

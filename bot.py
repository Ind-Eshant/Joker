import discord
from discord.ext import commands
import requests
from io import BytesIO
import json
import os

# -------------------
# 🔑 Keys
DISCORD_TOKEN = "YOUR DISCORD BOT TOKEN"
HF_API_KEY = "YOUR HUGING FACE API KEY"

HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

# -------------------
# Animated emoji IDs from your server
EMOJIS = {
    "loading": "<a:loading:1380110520723443793>",   # generating
    "tick": "<a:tick:1419731904810451195>",         # ✅
    "cross": "<a:cross:1419731433492316200>",       # ❌
    "warn": "<a:warn:1419732195542696078>",         # ⚠️
    "no_entry": "<a:no_entry:1380116376361893909>"  # ⛔
}

# -------------------
# Setup Discord Bot with prefix
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# -------------------
# Blacklist management
BLACKLIST_FILE = "blacklist.json"

def load_blacklist():
    if not os.path.exists(BLACKLIST_FILE):
        return set()
    with open(BLACKLIST_FILE, "r") as f:
        return set(json.load(f))

def save_blacklist(blacklist):
    with open(BLACKLIST_FILE, "w") as f:
        json.dump(list(blacklist), f, indent=2)

blacklist = load_blacklist()

# -------------------
@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")

# -------------------
# Blacklist commands
@bot.command(name="blacklist")
async def add_blacklist(ctx, member: discord.Member):
    if ctx.author.id != 807193356026904587:  # Replace with your operational ID
        return await ctx.send(f"{EMOJIS['no_entry']} You do not have permission to use this command.")
    if member.id in blacklist:
        return await ctx.send(f"{EMOJIS['warn']} User is already blacklisted.")
    blacklist.add(member.id)
    save_blacklist(blacklist)
    await ctx.send(f"{EMOJIS['tick']} Successfully blacklisted {member}")

@bot.command(name="unblacklist")
async def remove_blacklist(ctx, member: discord.Member):
    if ctx.author.id != 807193356026904587:  # Replace with your operational ID
        return await ctx.send(f"{EMOJIS['no_entry']} You do not have permission to use this command.")
    if member.id not in blacklist:
        return await ctx.send(f"{EMOJIS['warn']} User is not blacklisted.")
    blacklist.remove(member.id)
    save_blacklist(blacklist)
    await ctx.send(f"{EMOJIS['tick']} Successfully unblacklisted {member}")

# -------------------
# Image generation command
@bot.command(name="gen")
async def gen(ctx, *, prompt: str):
    if ctx.author.id in blacklist:
        return  # ignore blacklisted users

    if not prompt:
        return await ctx.send(f"{EMOJIS['cross']} Please provide a prompt!")

    # Animated emoji while generating
    msg = await ctx.send(f"{EMOJIS['loading']} Generating your image, please wait...")

    try:
        # Call Hugging Face API
        payload = {"inputs": prompt}
        response = requests.post(HF_URL, headers=HEADERS, json=payload)

        if response.status_code != 200:
            await msg.delete()
            return await ctx.send(f"{EMOJIS['cross']} API Error: {response.text}")

        image_bytes = BytesIO(response.content)

        # Embed with the image
        embed = discord.Embed(
            title=f"Prompt: {prompt}",
            color=0x2f3136
        )
        embed.set_image(url="attachment://generated_image.png")
        embed.set_footer(text=f"Requested by {ctx.author}", icon_url=ctx.author.display_avatar.url)

        await ctx.send(embed=embed, file=discord.File(fp=image_bytes, filename="generated_image.png"))

        await msg.delete()  # remove the animated loading message
        print(f"Image sent by {ctx.author}")

    except Exception as e:
        print(e)
        await msg.delete()
        await ctx.send(f"{EMOJIS['cross']} Failed to generate image with that prompt")

# -------------------
bot.run(DISCORD_TOKEN)

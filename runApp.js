const fs = require("fs");
const login = require("ws3-fca");
const express = require("express");
const axios = require("axios");
const app = express();

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

// Load appstate from appstate.json
let appState = null;
try {
    appState = JSON.parse(fs.readFileSync("appstate.json", "utf8"));
} catch (error) {
    console.error("Failed to load appstate.json", error);
}

const port = config.port || 3000;

// Load commands from cmds folder
const commandFiles = fs.readdirSync('./cmds').filter(file => file.endsWith('.js'));
const commands = {};
commandFiles.forEach(file => {
    const command = require(`./cmds/${file}`);
    commands[command.name] = command;
});

login({ appState }, (err, api) => {
    if (err) return console.error(err);
    
    api.setOptions({
        forceLogin: true,
        listenEvents: true,
        logLevel: "silent",
        selfListen: false
    });

    function handleMessage(event) {
        const prefix = config.prefix;
        const message = event.body;
        const attachments = event.attachments || [];
        const senderId = event.senderID;

        if (message.startsWith(prefix)) {
            const args = message.slice(prefix.length).split(/ +/);
            const commandName = args.shift().toLowerCase();
            if (commands[commandName]) {
                return commands[commandName].execute(api, event, args);
            }
        }

        if (attachments.length > 0 && attachments[0].type === 'photo') {
            const imageUrl = attachments[0].url;
            axios.post('https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini', {
                link: imageUrl,
                prompt: "Analyse du texte de l'image pour détection de mots-clés",
                customId: senderId
            }).then(ocrResponse => {
                const ocrText = ocrResponse.data.message || "";
                const hasExerciseKeywords = /(\d+\)|[a-zA-Z]\)|Exercice)/.test(ocrText);
                const prompt = hasExerciseKeywords
                    ? "Faire cet exercice et donner la correction complète de cet exercice"
                    : "Décrire cette photo";
                
                return axios.post('https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini', {
                    link: imageUrl,
                    prompt,
                    customId: senderId
                });
            }).then(response => {
                api.sendMessage(response.data.message, event.threadID);
            }).catch(err => console.error("OCR/Response error:", err));
        } else {
            axios.post('https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini', {
                prompt: message,
                customId: senderId
            }).then(response => {
                api.sendMessage(response.data.message, event.threadID);
            }).catch(err => console.error("API error:", err));
        }
    }

    api.listenMqtt((err, event) => {
        if (err) return console.error("Listening error:", err);
        if (event.type === "message") handleMessage(event);
    });
});

app.get("/", (req, res) => {
    res.send("Bot is running");
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

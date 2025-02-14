const login = require("ws3-fca");
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

let appState = null;
try {
    appState = JSON.parse(process.env.APPSTATE);
    console.log("AppState chargé avec succès.");
} catch (error) {
    console.error("Erreur de chargement d'AppState :", error);
    process.exit(1);
}

const port = config.port || 3000;

// Charger les commandes du dossier cmds
const commands = {};
fs.readdirSync('./cmds').filter(file => file.endsWith('.js')).forEach(file => {
    const command = require(`./cmds/${file}`);
    commands[command.name] = command;
});

// Charger les commandes du dossier respimage/
const respimageCommands = {};
fs.readdirSync('./respimage').filter(file => file.endsWith('.js')).forEach(file => {
    const command = require(`./respimage/${file}`);
    respimageCommands[command.name] = command;
});

// Stocker les commandes actives par utilisateur
let activeCommands = {};

login({ appState }, (err, api) => {
    if (err) return console.error("Erreur de connexion :", err);

    api.setOptions({
        forceLogin: true,
        listenEvents: true,
        logLevel: "silent",
        selfListen: false
    });

    function handleMessage(event) {
        const prefix = config.prefix;
        const message = event.body?.trim();
        const senderId = event.senderID;
        const attachments = event.attachments || [];

        // Vérifier si une commande respimage est active pour cet utilisateur
        if (activeCommands[senderId]) {
            const activeCommand = activeCommands[senderId];

            if (message.toLowerCase() === "stop") {
                delete activeCommands[senderId];
                api.sendMessage(`La commande ${activeCommand} a été désactivée avec succès.`, event.threadID);
                return;
            } else if (respimageCommands[activeCommand]) {
                // Exécuter la commande active pour les messages et les images
                return respimageCommands[activeCommand].execute(api, event, message, attachments);
            }
        }

        // Vérifier si l'utilisateur tape une commande respimage (gen, image, phi)
        if (respimageCommands[message]) {
            activeCommands[senderId] = message;
            api.sendMessage(`La commande ${message} a été activée avec succès.`, event.threadID);
            return;
        }

        // Si le message contient des pièces jointes (images)
        if (attachments.length > 0 && attachments[0].type === "photo") {
            api.sendMessage("⏳💫 Analyse de votre image en cours...", event.threadID);
            const imageUrl = attachments[0].url;

            axios.post('https://gemini-sary-prompt-espa-vercel-api.vercel.app/api/gemini', {
                link: imageUrl,
                prompt: "Décrire cette photo",
                customId: senderId
            }).then(response => {
                api.sendMessage(response.data.message, event.threadID);
            }).catch(err => console.error("Erreur API Gemini :", err));

            return;
        }

        if (message.startsWith(prefix)) {
            const args = message.slice(prefix.length).split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (commands[commandName]) {
                if (commandName === "help") {
                    // La commande help n'a pas besoin d'une commande stop
                    return commands[commandName].execute(api, event, args);
                }

                // Définir une commande active pour l'utilisateur
                activeCommands[senderId] = commandName;

                // Exécuter la commande sélectionnée
                return commands[commandName].execute(api, event, args);
            } else {
                // Si ce n'est pas une commande, envoyer le message à l'API Gemini
                api.sendMessage("⏳ Veuillez patienter pendant que Bruno traite votre demande...", event.threadID);

                axios.post('https://gemini-sary-prompt-espa-vercel.app/api/gemini', {
                    prompt: message,
                    customId: senderId
                }).then(response => {
                    api.sendMessage(response.data.message, event.threadID);
                }).catch(err => console.error("Erreur API Gemini :", err));
            }
        }
    }

    api.listenMqtt((err, event) => {
        if (err) return console.error("Erreur de connexion MQTT :", err);
        if (event.type === "message") handleMessage(event);
    });
});

app.get("/", (req, res) => {
    res.send("Bot is running");
});

app.listen(port, () => {
    console.log(`Serveur en cours sur http://localhost:${port}`);
});

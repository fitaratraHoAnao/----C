const axios = require('axios');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

module.exports = {
    name: 'llama',
    description: 'Pose une question à l'IA Llama',
    async execute(api, event, args) {
        const question = args.join(' ');

        if (!question) {
            api.sendMessage(`Veuillez entrer une question.
Usage: ${config.prefix}llama <votre question>`, event.threadID, event.messageID);
            return;
        }

        api.sendMessage("📲💫 Patientez, la réponse arrive… 💫📲", event.threadID, event.messageID);

        try {
            const response = await axios.get(`https://xnil.xnil.unaux.com/xnil/blackbox?message=${encodeURIComponent(question)}`);
            if (response.data.status) {
                api.sendMessage(`✅🙏 Llama AI 🙏✅\n\n` + response.data.response, event.threadID, event.messageID);
            } else {
                api.sendMessage("Une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer plus tard.", event.threadID, event.messageID);
            }
        } catch (error) {
            api.sendMessage("Une erreur s'est produite lors du traitement de votre demande. Veuillez réessayer plus tard.", event.threadID, event.messageID);
        }
    }
};

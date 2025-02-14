const axios = require('axios');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

module.exports = {
    name: 'gen',
    description: 'Décrire l\'image envoyée',
    async execute(api, event, args) {
        // Vérifiez si l'utilisateur a envoyé une image en pièce jointe
        const attachments = event.message.attachments;
        if (attachments && attachments.length > 0) {
            api.sendMessage("Génération en cours...", event.threadID, event.messageID);

            try {
                // L'URL de l'image envoyée par l'utilisateur
                const imageUrl = attachments[0].url;
                
                // L'API URL que vous avez fournie
                const apiUrl = `http://sgp1.hmvhostings.com:25721/geminiv?prompt=D%C3%A9crit%20cette%20photo&image_url=${encodeURIComponent(imageUrl)}`;

                // Appel à l'API pour décrire l'image
                const response = await axios.get(apiUrl);

                // Vérifier si la réponse contient une description
                if (response.data && response.data.answer) {
                    const description = response.data.answer;
                    const fullMessage = `✅ Voici la description de la photo :\n\n${description}`;

                    const maxLength = 2000; // Limite de caractères de Facebook Messenger

                    // Découper le message en morceaux de 2000 caractères
                    for (let i = 0; i < fullMessage.length; i += maxLength) {
                        const chunk = fullMessage.substring(i, i + maxLength);
                        await new Promise(resolve => {
                            api.sendMessage(chunk, event.threadID, () => resolve());
                        });
                    }
                } else {
                    api.sendMessage("Une erreur s'est produite lors du traitement de votre image. Veuillez réessayer plus tard.", event.threadID, event.messageID);
                }
            } catch (error) {
                api.sendMessage("Une erreur s'est produite lors du traitement de votre image. Veuillez réessayer plus tard.", event.threadID, event.messageID);
            }
        } else {
            api.sendMessage("Veuillez envoyer une image pour la décrire.", event.threadID, event.messageID);
        }
    }
};

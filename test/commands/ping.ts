import { Command } from "djs-bot-base";

export default new Command({
  name: "ping",
  cooldown: 10,
  maintenance: false,
  async run(message) {
    const client = message?.client;
    message.reply({ content: `**${client.ws.ping}** ms` });
  },
});

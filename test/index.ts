import { CommandHandler, EventHandler } from "djs-bot-base";
import { Client, Partials } from "discord.js";
import "dotenv/config";

const commands = new CommandHandler({ prefix: "!" });
const events = new EventHandler();

const client = new Client({
  intents: ["MessageContent", "GuildMessages", "Guilds", "DirectMessages"],
  partials: [Partials.User, Partials.Channel, Partials.Message],
});
const token = process.env.TOKEN;

(async () => {
  await commands.setCommands();
  await commands.setSlashCommands();
  await events.setEvents(client);
  commands.setDefaultHandler(client).setDefaultSlashHandler(client);
  await client.login(token);
  await commands.registerSlashCommands(client);
})();

import {
  APIEmbedField,
  ChannelType,
  EmbedAuthorOptions,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";

@Discord()
export class Example {
  channelName: string = "logs";

  @On()
  messageDelete([message]: ArgsOf<"messageDelete">, client: Client): void {
    const cachedChannels = client.channels.cache as unknown as TextChannel[];
    const logChannel = cachedChannels.find((c) => c.name === this.channelName);
    const currentGuild = client.guilds.cache.get(message.guild?.id || "");

    const deletedEmbed = (
      author: EmbedAuthorOptions,
      message: APIEmbedField,
      channel: APIEmbedField
    ) =>
      new EmbedBuilder()
        .setColor("DarkPurple")
        .setAuthor(author)
        .addFields(message)
        .addFields(channel)
        .setTimestamp();

    if (logChannel !== undefined)
      logChannel.send({
        embeds: [
          deletedEmbed(
            { name: `Author: ${message.author?.username}` },
            { name: "Message Content", value: message.content || "" },
            {
              name: "From Channel",
              value: `${(message.channel as TextChannel).name}`,
            }
          ),
        ],
      });
    else {
      currentGuild?.channels
        .create({
          name: this.channelName,
          type: ChannelType.GuildText,
        })
        .then((fulfilled) => {
          console.log(fulfilled);
          fulfilled.send({
            embeds: [
              deletedEmbed(
                { name: `Author: ${message.author?.username}` },
                { name: "Message Content", value: message.content || "" },
                {
                  name: "From Channel",
                  value: `${(message.channel as TextChannel).name}`,
                }
              ),
            ],
          });
        })
        .catch((err) => console.error(err));
    }
  }
}

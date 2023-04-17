import {
  ActionRowBuilder,
  ChannelType,
  CommandInteraction,
  Guild,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { Discord, SelectMenuComponent, Slash } from "discordx";

type ChannelOption = {
  channelName: string;
  channelId: string;
};

@Discord()
export class RegisterChannels {
  channels: ChannelOption[] = [];

  getAllChannels(guild: Guild | null): ChannelOption[] | undefined {
    if (guild === null) return;
    const guildChannels = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText
    );
    guildChannels.forEach((channel) => {
      this.channels.push({
        channelName: channel.name,
        channelId: channel.id,
      });
    });

    return this.channels;
  }

  @SelectMenuComponent({ id: "register-general" })
  async handle(interaction: StringSelectMenuInteraction): Promise<unknown> {
    await interaction.deferReply();

    // extract selected value by member
    const interactionVal = interaction.values?.[0];

    // if value not found
    if (!interactionVal) {
      return interaction.followUp("invalid role id, select again");
    }

    await interaction.followUp(
      `you have registered the following channel as your general channel: ${
        this.channels.find((r) => r.channelId === interactionVal)
          ?.channelName ?? "unknown"
      }`
    );

    return;
  }

  @Slash({ description: "register general channel", name: "register_general" })
  async registerChannels(interaction: CommandInteraction): Promise<unknown> {
    await interaction.deferReply();

    this.getAllChannels(interaction?.guild);

    const menu = new StringSelectMenuBuilder()
      .addOptions(
        this.channels.map((channel) => ({
          label: channel.channelName,
          value: channel.channelId,
        }))
      )
      .setCustomId("register-general");

    const buttonRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        menu
      );

    interaction.editReply({
      components: [buttonRow],
      content: "Register General",
    });
    return;
  }
}

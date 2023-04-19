import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  Role,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  Discord,
  ModalComponent,
  Slash,
  SlashChoice,
  SlashOption,
} from "discordx";
import { db } from "../main.js";
import { FindCursor, WithId } from "mongodb";

export interface Ticket {
  reason: string;
  description: string;
  open: boolean;
}

const ticketsCollection = db.collection<Ticket>("tickets");

const TICKET_DESCRIPTION = "ticketDescription";
const TICKET_REASON = "ticketReason";

@Discord()
class CreateTicket {
  @Slash({ name: "create-ticket", description: "A Ticket creation tool" })
  modal(interaction: CommandInteraction): void {
    const modal = new ModalBuilder()
      .setTitle("Ticket Form")
      .setCustomId("ticketModal");

    const reasonInput = new TextInputBuilder()
      .setCustomId(TICKET_REASON)
      .setLabel("In a few words, describe your issue:")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId(TICKET_DESCRIPTION)
      .setLabel("Description:")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      reasonInput
    );
    const descriptionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

    modal.addComponents(reasonRow, descriptionRow);

    interaction.showModal(modal);
  }

  @ModalComponent()
  async ticketModal(interaction: ModalSubmitInteraction): Promise<void> {
    const [reason, description] = [TICKET_REASON, TICKET_DESCRIPTION].map(
      (id) => interaction.fields.getTextInputValue(id)
    );
    const roles = {
      everyone: interaction.guild?.roles.everyone || ({} as Role),
      admin:
        interaction.guild?.roles.cache.find((role) => role.name === "admin") ||
        ({} as Role),
    };

    await ticketsCollection.insertOne({
      reason,
      description,
      open: true,
    });

    const ticketChannel = await interaction.guild?.channels.create({
      name: `Ticket ${Math.floor(Math.random() * 500) + 1}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: roles.everyone.id,
          deny: ["ViewChannel"],
        },
        {
          id: roles.admin.id,
          allow: ["ViewChannel"],
        },
      ],
    });

    await ticketChannel?.send(
      `${interaction.user.username} created a ticket with reason: ${reason}. Here's some additional information: ${description}`
    );

    await interaction.message?.author.send(
      `You just created a ticket, to see the conversation click this link: ${ticketChannel?.url}`
    );

    await interaction.reply(
      "Ticket created! This message will self-destruct in 5 seconds..."
    );

    setTimeout(async () => {
      interaction.deleteReply();
    }, 5000);

    return;
  }
}

@Discord()
class ListTickets {
  @Slash({ name: "list_tickets", description: "list the tickets open" })
  async listTickets(
    @SlashOption({
      description:
        "Determines whether or not to return open or closed tickets.",
      name: "open",
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    open: boolean,
    interaction: CommandInteraction
  ): Promise<void> {
    let openTickets = [] as WithId<Ticket>[];

    try {
      openTickets = await ticketsCollection.find({ open }).toArray();
    } catch (err) {
      console.log(err);
    }

    if (openTickets.length >= 0) {
      interaction.reply("No tickets found.");
      return;
    }

    openTickets.map(({ _id, reason, description }) => {
      interaction.reply(
        `${_id.toString()} was created with Reason: ${reason} and Description: ${description}`
      );
    });

    return;
  }
}

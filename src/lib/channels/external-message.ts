import { prisma } from "@/lib/prisma";
import { chat, createNewConversation } from "@/lib/ai/engine";
import { resolveCustomer } from "@/lib/customer-resolver";

type ExternalChannel = "facebook" | "instagram";

export async function handleExternalChannelMessage(input: {
  channel: ExternalChannel;
  customerContact: string;
  customerName?: string;
  text: string;
}): Promise<{
  conversationId: string;
  response: string;
}> {
  const customerContact = input.customerContact.trim();
  const text = input.text.trim();
  const customerName = input.customerName?.trim() || "Unknown";

  if (!customerContact) {
    throw new Error("Customer contact is required");
  }
  if (!text) {
    throw new Error("Message text is required");
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      channel: input.channel,
      customerContact,
      status: { in: ["active", "escalated"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  const customerId = await resolveCustomer(input.channel, customerContact, customerName);

  if (!conversation) {
    conversation = await prisma.conversation.findFirst({
      where: {
        channel: input.channel,
        status: { in: ["active", "escalated"] },
        OR: [{ customerId }, { customerContact }],
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  if (!conversation) {
    conversation = await createNewConversation(
      input.channel,
      customerName,
      customerContact,
      customerId
    );
  }

  const response = await chat(conversation.id, text);

  return {
    conversationId: conversation.id,
    response,
  };
}


import type OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { owlyTools, executeToolCall } from "./tools";
import { emitNewMessage } from "@/lib/realtime";
import { evaluateRules, executeAutomationRules } from "@/lib/automation";
import {
  analyzeSentiment,
  detectIntent,
  estimateConfidence,
  requiresHumanApproval,
} from "./guardrails";
import { logger } from "@/lib/logger";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_PROVIDER,
  normalizeAIModel,
  normalizeAIProvider,
} from "./catalog";
import { createGeminiClient } from "./provider";
import { searchKnowledgeBase } from "./semantic-search";
import type { AIMessage, AIConfig, ConversationContext, KnowledgeItem } from "./types";

const DEFAULT_BUSINESS_SETTINGS = {
  businessName: "LED1000 / Linh Kiện LED1000",
  businessDesc:
    "Chuyên đèn LED, nguồn điện, linh kiện LED, phụ kiện chiếu sáng, đèn trang trí và thiết bị điện liên quan.",
  welcomeMessage:
    "Xin chào! LED1000 có thể hỗ trợ bạn tìm đèn LED, nguồn điện, linh kiện hoặc phụ kiện phù hợp. Bạn cần dùng cho mục đích nào và có thông số điện áp/công suất chưa?",
  tone: "friendly",
  language: "auto",
};

function buildSystemPrompt(context: ConversationContext): string {
  const toneGuide: Record<string, string> = {
    friendly:
      "Giữ giọng điệu thân thiện, rõ ràng, dễ hiểu và lịch sự như một nhân viên CSKH đang tư vấn sản phẩm.",
    formal: "Giữ giọng điệu chuyên nghiệp, lịch sự, rõ ràng và chỉn chu.",
    technical:
      "Giải thích rõ ràng, chính xác, có thể hỏi thêm thông số kỹ thuật nhưng vẫn diễn đạt dễ hiểu.",
  };
  const businessName = context.businessName?.trim() || "doanh nghiệp này";
  const businessDesc = context.businessDesc?.trim()
    ? context.businessDesc.trim()
    : "Doanh nghiệp cung cấp sản phẩm/dịch vụ cho khách hàng.";
  const welcomeMessage = context.welcomeMessage?.trim();

  const knowledgeSection =
    context.knowledgeBase.length > 0
      ? context.knowledgeBase
          .sort((a, b) => b.priority - a.priority)
          .map((k) => `[${k.category}] ${k.title}:\n${k.content}`)
          .join("\n\n---\n\n")
      : "Chưa có nội dung cụ thể trong kho kiến thức. Chỉ được trả lời dựa trên thông tin doanh nghiệp đang có, không tự bịa thêm.";

  return `Bạn là trợ lý CSKH/tư vấn sản phẩm của ${businessName}.

Mô tả doanh nghiệp: ${businessDesc}
${welcomeMessage ? `Tin nhắn chào mừng đã cấu hình: ${welcomeMessage}` : ""}

## MỤC TIÊU & NHIỆM VỤ CHÍNH:
- Trả lời dựa trên Knowledge Base và ngữ cảnh hội thoại.
- Nếu Knowledge Base có thông tin liên quan, hãy dùng thông tin đó để trả lời khách; có thể tổng hợp nhiều mục nếu chúng cùng nói về câu hỏi mới nhất.
- Nếu Knowledge Base không có thông tin, hãy nói rõ là hiện chưa có dữ liệu chính xác thay vì tự bịa.
- Không tự nhận sai ngành nghề hoặc vai trò chuyên môn ngoài cấu hình doanh nghiệp/Knowledge Base hiện tại.

## QUY TẮC TRẢ LỜI (BẮT BUỘC):
1. Có thể bắt đầu bằng "Dạ" khi phù hợp, nhưng ưu tiên trả lời tự nhiên, ngắn gọn và đúng câu hỏi mới nhất của khách.
2. CHỈ tập trung trả lời câu hỏi MỚI NHẤT của khách, không tự ý trả lời bù câu hỏi cũ nếu khách không nhắc tới.
3. Khi khách hỏi tư vấn sản phẩm nhưng thiếu thông số, hãy hỏi thêm các thông tin phù hợp như: dùng trong nhà/ngoài trời, điện áp 5V/12V/24V/48V/220V, công suất hoặc tải dự kiến, chiều dài LED dây, màu ánh sáng, RGB/đổi màu, mức chống nước IP, mục đích dùng, số lượng hoặc quy cách cần mua.
4. Với câu hỏi kỹ thuật điện, thi công, tải nguồn hoặc lắp đặt có rủi ro, hãy khuyến nghị khách để nhân viên kỹ thuật/thợ đủ chuyên môn xác nhận trước khi thi công.
5. Cần tổng hợp thông tin từ nhiều nguồn trong Knowledge Base nếu cần thiết để có câu trả lời đầy đủ.

## GIÁ, TỒN KHO, BẢO HÀNH, KHUYẾN MÃI:
- Chỉ trả lời theo thông tin có trong Knowledge Base.
- Nếu Knowledge Base có giá cụ thể gắn với đúng sản phẩm hoặc đúng quy cách khách hỏi, có thể trả lời giá đó.
- Nếu không tìm thấy giá, hoặc giá không rõ thuộc sản phẩm nào, hoặc có nhiều sản phẩm gần giống nhau, hãy hỏi thêm mã sản phẩm, link sản phẩm, hình ảnh, số lượng, điện áp, công suất, kích thước hoặc quy cách.
- Nếu sau khi hỏi vẫn không đủ dữ liệu để báo giá chính xác, đề nghị khách liên hệ hotline/nhân viên để xác nhận.
- Không tự bịa giá, tồn kho, bảo hành, khuyến mãi.

## XỬ LÝ KHI THỰC SỰ KHÔNG CÓ THÔNG TIN (FALLBACK):
- CHỈ KHI BẠN ĐÃ TÌM KỸ và CHẮC CHẮN 100% không có bất kỳ dữ liệu nào liên quan đến CÂU HỎI MỚI NHẤT, bạn mới được phép trả lời:
  "Dạ hiện tại em chưa có thông tin chính xác, mình cho em xin thêm thông tin để em hỗ trợ kỹ hơn nha."

## VĂN PHONG VÀ THÁI ĐỘ
- ${toneGuide[context.tone] || toneGuide.friendly}
- Lịch sự, chuyên nghiệp, tự nhiên. Luôn xưng "em" và gọi khách là "chị" hoặc "bạn".
- ${context.language !== "auto" ? `Luôn trả lời bằng ngôn ngữ: ${context.language}` : "Trả lời theo đúng ngôn ngữ khách hàng đang dùng."}

## LỊCH SỬ & CONTEXT HỘI THOẠI
- Kênh liên hệ: ${context.channel}
${context.customerName !== "Unknown" ? `- Tên khách hàng: ${context.customerName}` : ""}
- Lịch sử tương tác của khách:
${context.customerHistory.length > 0 ? context.customerHistory.map(h => `  * ${h}`).join("\n") : "  => Đây là lần đầu khách hàng liên hệ."}

---
## KHO KIẾN THỨC / KNOWLEDGE BASE
${knowledgeSection}`;
}

async function getKnowledgeBase(query?: string): Promise<KnowledgeItem[]> {
  if (query) {
    const results = await searchKnowledgeBase(query, 10);
    return results.map(r => ({
      category: r.category,
      title: r.title,
      content: r.content,
      priority: r.score * 100,
    }));
  }

  const entries = await prisma.knowledgeEntry.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { priority: "desc" },
    take: 10,
  });

  return entries.map(
    (e: { category: { name: string }; title: string; content: string; priority: number }) => ({
      category: e.category.name,
      title: e.title,
      content: e.content,
      priority: e.priority,
    })
  );
}

async function getAIConfig(): Promise<AIConfig & ConversationContext> {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: "default",
        aiProvider: GEMINI_PROVIDER,
        aiModel: DEFAULT_GEMINI_MODEL,
        ...DEFAULT_BUSINESS_SETTINGS,
      },
    });
  }

  return {
    provider: normalizeAIProvider(settings.aiProvider),
    model: normalizeAIModel(settings.aiModel || DEFAULT_GEMINI_MODEL),
    apiKey: settings.aiApiKey,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    businessName: settings.businessName,
    businessDesc: settings.businessDesc,
    welcomeMessage: settings.welcomeMessage,
    tone: settings.tone,
    language: settings.language,
    knowledgeBase: [],
    customerName: "",
    customerHistory: [],
    channel: "",
  };
}

async function getCustomerProfileContext(customerId?: string | null): Promise<string[]> {
  if (!customerId) return [];

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      email: true,
      phone: true,
      whatsapp: true,
      tags: true,
      profileNotes: true,
      preferences: true,
      purchaseContext: true,
      technicalNeeds: true,
      quoteStatus: true,
      previousAdvisor: true,
    },
  });

  if (!customer) return [];

  const profile: string[] = [];

  if (customer.phone) {
    profile.push(`- Số điện thoại: ${customer.phone}`);
  }
  if (customer.email) {
    profile.push(`- Email: ${customer.email}`);
  }
  if (customer.whatsapp) {
    profile.push(`- WhatsApp: ${customer.whatsapp}`);
  }
  if (customer.tags) {
    profile.push(`- Nhãn khách hàng: ${customer.tags}`);
  }
  if (customer.preferences) {
    profile.push(`- Nhu cầu/sở thích đã lưu: ${customer.preferences}`);
  }
  if (customer.purchaseContext) {
    profile.push(`- Bối cảnh mua hàng/lắp đặt: ${customer.purchaseContext}`);
  }
  if (customer.technicalNeeds) {
    profile.push(`- Thông số kỹ thuật khách quan tâm: ${customer.technicalNeeds}`);
  }
  if (customer.quoteStatus && customer.quoteStatus !== "unknown") {
    profile.push(`- Trạng thái báo giá chính thức: ${customer.quoteStatus}`);
  }
  if (customer.previousAdvisor) {
    profile.push(`- Nhân sự đã tư vấn trước đó: ${customer.previousAdvisor}`);
  }
  if (customer.profileNotes) {
    profile.push(`- Ghi chú hồ sơ: ${customer.profileNotes}`);
  }

  return profile;
}

export async function chat(conversationId: string, userMessage: string): Promise<string> {
  const config = await getAIConfig();

  if (!config.apiKey) {
    return "AI chưa được cấu hình. Vui lòng thêm API key tại Cài đặt > Cấu hình AI.";
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!conversation) {
    return "Không tìm thấy hội thoại.";
  }

  const knowledgeBase = await getKnowledgeBase(userMessage);
  const customerProfile = await getCustomerProfileContext(conversation.customerId);

  const context: ConversationContext = {
    ...config,
    knowledgeBase,
    customerName: conversation.customerName,
    channel: conversation.channel,
    customerHistory: customerProfile,
  };

  // Build message history
  const messages: AIMessage[] = [{ role: "system", content: buildSystemPrompt(context) }];

  for (const msg of conversation.messages) {
    if (msg.role === "customer") {
      messages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      messages.push({ role: "assistant", content: msg.content });
    }
  }

  messages.push({ role: "user", content: userMessage });

  // Guardrails: check if human approval needed
  const approval = requiresHumanApproval(userMessage);
  if (approval.required) {
    const sentiment = analyzeSentiment(userMessage);
    const intent = detectIntent(userMessage);

    // Store metadata for dashboard visibility
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        metadata: {
          escalationReason: approval.reason,
          sentiment: sentiment.sentiment,
          intent: intent.intent,
        },
      },
    });
  }

  // Save user message
  await prisma.message.create({
    data: {
      conversationId,
      role: "customer",
      content: userMessage,
    },
  });

  const matchedAutomationRules = await evaluateRules(
    {
      content: userMessage,
      channel: conversation.channel,
      customerName: conversation.customerName,
    },
    {
      id: conversationId,
      channel: conversation.channel,
      customerName: conversation.customerName,
    }
  );

  const automationResult = await executeAutomationRules(
    conversationId,
    matchedAutomationRules,
    userMessage
  );

  if (automationResult.autoReplyMessages.length > 0) {
    const automatedReply = automationResult.autoReplyMessages.join("\n\n");
    const savedAutomatedReply = await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: automatedReply,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    emitNewMessage(conversationId, {
      id: savedAutomatedReply.id,
      role: "assistant",
      content: automatedReply,
    });

    return automatedReply;
  }

  // Call AI
  const response = await callAI(config, messages, conversationId);

  // Save assistant message
  const savedMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: response,
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Confidence scoring
  const confidence = estimateConfidence(response, knowledgeBase.length, false);
  if (confidence.shouldEscalate) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "escalated" },
    });
  }

  emitNewMessage(conversationId, { id: savedMessage.id, role: "assistant", content: response });

  return response;
}

async function callAI(
  config: AIConfig,
  messages: AIMessage[],
  conversationId: string,
  depth = 0
): Promise<string> {
  if (depth > 5) {
    return "Xin lỗi, tôi đang gặp khó khăn khi xử lý yêu cầu này. Tôi sẽ chuyển bạn tới nhân viên hỗ trợ.";
  }

  const client = createGeminiClient(config.apiKey);
  const requestPayload = {
    model: config.model,
    messages: messages as OpenAI.ChatCompletionMessageParam[],
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  };

  const delay = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const shouldRetry = (error: unknown) => {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    return (
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("timeout") ||
      message.includes("overloaded") ||
      message.includes("503") ||
      message.includes("500")
    );
  };

  let response: OpenAI.Chat.Completions.ChatCompletion | null = null;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await client.chat.completions.create({
        ...requestPayload,
        tools: owlyTools as OpenAI.ChatCompletionTool[],
      });
      break;
    } catch (error) {
      lastError = error;
      logger.error("Gemini chat completion with tools failed:", error, {
        conversationId,
        attempt: attempt + 1,
      });

      if (!shouldRetry(error) || attempt === 1) {
        break;
      }

      await delay(1200);
    }
  }

  if (!response) {
    try {
      response = await client.chat.completions.create(requestPayload);
      logger.warn("Gemini fallback without tools succeeded", { conversationId });
    } catch (fallbackError) {
      logger.error("Gemini fallback without tools failed:", fallbackError, {
        conversationId,
        previousError:
          lastError instanceof Error ? lastError.message : String(lastError ?? ""),
      });
      return "Hiện tôi chưa thể xử lý yêu cầu này. Vui lòng thử lại sau ít phút, hoặc tôi có thể chuyển bạn tới nhân viên hỗ trợ.";
    }
  }

  const choice = response.choices[0];

  if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
    // Process tool calls
    const toolCalls = choice.message.tool_calls as Array<{
      id: string;
      type: string;
      function: { name: string; arguments: string };
    }>;

    messages.push({
      role: "assistant",
      content: choice.message.content || "",
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    });

    for (const toolCall of toolCalls) {
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        logger.error("Failed to parse tool arguments:", error, {
          conversationId,
          toolName: toolCall.function.name,
          rawArguments: toolCall.function.arguments,
        });
        continue;
      }

      const result = await executeToolCall(toolCall.function.name, args, conversationId);

      messages.push({
        role: "tool",
        content: result,
        tool_call_id: toolCall.id,
      });
    }

    // Continue the conversation with tool results
    return callAI(config, messages, conversationId, depth + 1);
  }

  return choice.message.content || "Xin lỗi, tôi chưa thể tạo phản hồi lúc này.";
}

export async function createNewConversation(
  channel: string,
  customerName: string,
  customerContact: string,
  customerId?: string
) {
  return prisma.conversation.create({
    data: {
      channel,
      customerName,
      customerContact,
      ...(customerId && { customerId }),
    },
  });
}

import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

// ─── Type definitions (kept compatible with existing call sites) ──────────────

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: { name: string };
};
export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClient(): Anthropic {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey: ENV.anthropicApiKey });
}

function contentToString(content: MessageContent | MessageContent[]): string {
  if (typeof content === "string") return content;
  const parts = Array.isArray(content) ? content : [content];
  return parts
    .map((p) => {
      if (typeof p === "string") return p;
      if (p.type === "text") return p.text;
      return "";
    })
    .join("\n");
}

function toAnthropicTools(tools: Tool[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description ?? "",
    input_schema: (t.function.parameters ?? {
      type: "object",
      properties: {},
    }) as Anthropic.Tool["input_schema"],
  }));
}

function toAnthropicMessages(messages: Message[]): {
  system: string | undefined;
  messages: Anthropic.MessageParam[];
} {
  const systemParts: string[] = [];
  const anthropicMessages: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(contentToString(msg.content));
      continue;
    }
    if (msg.role === "user" || msg.role === "assistant") {
      anthropicMessages.push({
        role: msg.role,
        content: contentToString(msg.content),
      });
      continue;
    }
    // Tool result messages — map to user role
    if (msg.role === "tool" || msg.role === "function") {
      anthropicMessages.push({
        role: "user",
        content: contentToString(msg.content),
      });
    }
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: anthropicMessages,
  };
}

// ─── Main invoke function ─────────────────────────────────────────────────────

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const client = getClient();
  const { messages, tools, toolChoice, tool_choice, maxTokens, max_tokens } = params;
  const { system, messages: anthropicMessages } = toAnthropicMessages(messages);
  const maxTok = maxTokens ?? max_tokens ?? 8192;

  const requestParams: Anthropic.MessageCreateParamsNonStreaming = {
    model: "claude-sonnet-4-6",
    max_tokens: maxTok,
    messages: anthropicMessages,
    ...(system ? { system } : {}),
  };

  if (tools && tools.length > 0) {
    requestParams.tools = toAnthropicTools(tools);
  }

  const tc = toolChoice ?? tool_choice;
  if (tc && tools && tools.length > 0) {
    if (tc === "none" || tc === "auto") {
      requestParams.tool_choice = { type: "auto" };
    } else if (tc === "required") {
      requestParams.tool_choice = { type: "any" };
    } else if ("name" in tc) {
      requestParams.tool_choice = { type: "tool", name: (tc as ToolChoiceByName).name };
    } else if ("type" in tc && tc.type === "function") {
      requestParams.tool_choice = { type: "tool", name: (tc as ToolChoiceExplicit).function.name };
    }
  }

  const response = await client.messages.create(requestParams);

  let textContent = "";
  const toolCalls: ToolCall[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      textContent += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      });
    }
  }

  const finishReasonMap: Record<string, string> = {
    end_turn: "stop",
    max_tokens: "length",
    tool_use: "tool_calls",
    stop_sequence: "stop",
  };

  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: textContent,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason:
          finishReasonMap[response.stop_reason ?? ""] ??
          response.stop_reason ??
          null,
      },
    ],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

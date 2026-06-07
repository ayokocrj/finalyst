import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { DEFAULT_CONVERSATION_TITLE } from "@/features/conversations/constants";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

const requestSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  htmlContent: z.string(),
});

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = origin.startsWith("chrome-extension://") ? origin : "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Internal key not configured" },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const { url, title, htmlContent } = requestSchema.parse(body);

    // Clean up title to make a neat project name (max 40 chars)
    const cleanedTitle = title
      .replace(/[^\w\s-]/gi, "")
      .trim()
      .substring(0, 40) || "Imported Deal";

    const projectName = `Deal: ${cleanedTitle}`;

    // 1. Create project and conversation
    const { projectId, conversationId } = await convex.mutation(
      api.system.createProjectWithConversation,
      {
        internalKey,
        projectName,
        conversationTitle: DEFAULT_CONVERSATION_TITLE,
        ownerId: userId,
      }
    );

    // 2. Create a file with the scraped web content
    const fileContent = `# Scraped Source: ${title}\nURL: ${url}\n\n${htmlContent}`;
    await convex.mutation(api.system.createFile, {
      internalKey,
      projectId,
      name: "source_site.md",
      content: fileContent,
    });

    // 3. Formulate the analysis prompt
    const prompt = `I have imported the company website from ${url}. The scraped content has been saved in 'source_site.md'. Please read 'source_site.md' and provide a detailed target analysis covering:
1. Business Model & Value Proposition
2. Target Market & Industry Sector
3. Potential Risks or Red Flags for a Search Fund acquisition
4. Recommended next steps for due diligence`;

    // 4. Create user message
    await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId,
      projectId,
      role: "user",
      content: prompt,
    });

    // 5. Create assistant message placeholder with processing status
    const assistantMessageId = await convex.mutation(
      api.system.createMessage,
      {
        internalKey,
        conversationId,
        projectId,
        role: "assistant",
        content: "",
        status: "processing",
      }
    );

    // 6. Trigger Inngest to process the message and run the agent
    await inngest.send({
      name: "message/sent",
      data: {
        messageId: assistantMessageId,
        conversationId,
        projectId,
        message: prompt,
      },
    });

    return NextResponse.json(
      { success: true, projectId, conversationId },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Extension import error:", error);
    return NextResponse.json(
      { error: "Invalid request payload or internal error" },
      { status: 400, headers: corsHeaders }
    );
  }
}

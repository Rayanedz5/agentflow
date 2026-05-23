import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it in Settings > Secrets.");
  }
  aiClient = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  return aiClient;
}

// Multi-agent execution pipeline
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ success: false, error: "Prompt message is required." });
  }

  try {
    const ai = getGeminiClient();
    const modelName = "gemini-3.5-flash";

    // 1. Product Manager Agent
    const pmSystem = 
      "You are an expert Product Manager. Your role is to analyze the user request and define a laser-focused, highly concise set of requirement specifications or general solution explanation.\n\n" +
      "CRITICAL DIRECTIVES:\n" +
      "1. Be extremely direct and concise. Avoid unsolicited feature proposals, unrelated conversational padding, high-level marketing, or boilerplate text in your responses.\n" +
      "2. Respond with ONLY the material that is strictly relevant and requested by the user.\n" +
      "3. If the user input is a general software question, query, explanation, or conversational chat rather than a requirement to write an application/code, provide a concise, direct answer directly under the block tag heading '[GENERAL_QUERY]' and terminate your explanation quickly (within 2 brief paragraphs maximum).";

    const pmResponse = await ai.models.generateContent({
      model: modelName,
      contents: message,
      config: {
        systemInstruction: pmSystem,
        temperature: 0.7,
      }
    });
    const pmSpec = pmResponse.text || "Failed to generate technical specification.";

    // 2. Developer Agent (Coder) - Round 1
    const coderSystem =
      "You are an expert Software Engineer who writes clean, impeccable, self-contained implementations.\n\n" +
      "CRITICAL DIRECTIVES:\n" +
      "1. Output ONLY the code files requested with clean, direct implementation. Avoid long intro/outro explanations, introductory greetings, and redundant summaries.\n" +
      "2. Keep the output focused solely on the functional code. Do not add mock features or extra widgets that are unrelated to what the user explicitly requested.\n" +
      "3. If the PM has flagged the query as a '[GENERAL_QUERY]', write: 'Direct response provided. Code implementation is not required for general inquiries.'";

    const coderPayload = `Original User Request: ${message}\n\nTechnical Specification:\n${pmSpec}`;
    const coderResponse = await ai.models.generateContent({
      model: modelName,
      contents: coderPayload,
      config: {
        systemInstruction: coderSystem,
        temperature: 0.2,
      }
    });
    const coderDraft = coderResponse.text || "Failed to generate first draft code.";

    // 3. Code Reviewer Agent (The Critic)
    const criticSystem =
      "You are an expert Senior Security and Code Quality Critic.\n\n" +
      "CRITICAL DIRECTIVES:\n" +
      "1. Keep reviews brief and focused. Avoid lengthy summaries or lists of minor stylistic details.\n" +
      "2. If the code is aligned and has no severe vulnerabilities, output 'APPROVED' followed by a maximum 1-2 sentences of praise. Do not generate a massive redundant checklist.\n" +
      "3. If a bug demands fixing, start with 'REJECTED' and list only the precise lines requiring corrections.\n" +
      "4. If this is a general query response (with no actual code to inspect), output 'APPROVED: general input inquiry validated.'";

    const criticPayload = `Technical Specification:\n${pmSpec}\n\nDeveloper's Code Draft:\n${coderDraft}`;
    const criticResponse = await ai.models.generateContent({
      model: modelName,
      contents: criticPayload,
      config: {
        systemInstruction: criticSystem,
        temperature: 0.3,
      }
    });
    const criticReview = criticResponse.text || "Failed to conduct code review.";

    // 4. Developer Agent (Coder) - Round 2 Rewrite
    const isApproved = criticReview.toUpperCase().includes("APPROVED") && !criticReview.toUpperCase().includes("REJECTED");
    let coderFinal = coderDraft;
    let traceRound2Output = "No rewrite requested. Code reviewer approved initial draft.";

    if (!isApproved) {
      const coderRound2System =
        "You are an expert Software Engineer.\n\n" +
        "CRITICAL DIRECTIVES:\n" +
        "1. Rewrite the code ONLY to address and resolve the critical issues or security defects highlighted by the critic.\n" +
        "2. Keep the code concise, clean, and directly aligned. Do not output lengthy summaries, introductions, or redundant explanations of fixes applied.";

      const coderRound2Payload = `Technical Specification:\n${pmSpec}\n\nFirst Code Draft:\n${coderDraft}\n\nCode Reviewer Critique:\n${criticReview}`;
      const coderRound2Response = await ai.models.generateContent({
        model: modelName,
        contents: coderRound2Payload,
        config: {
          systemInstruction: coderRound2System,
          temperature: 0.1,
        }
      });
      coderFinal = coderRound2Response.text || coderDraft;
      traceRound2Output = coderFinal;
    }

    // 5. Documentation & QA Agent
    const docsQASystem =
      "You are a Senior Technical Writer and SDET.\n\n" +
      "CRITICAL DIRECTIVES:\n" +
      "1. Keep final documentation extremely concise. Avoid high-level essays, standard boilerplate manuals, or repeated explanations. Provide a maximum of 2-3 lines of quickstart guide.\n" +
      "2. Provide only standard, highly focused unit test structures or code-verification asserts. If no code was generated, provide a brief supporting wrap-up sentence.";

    const docsQAPayload = `Finalized App Code:\n${coderFinal}`;
    const docsQAResponse = await ai.models.generateContent({
      model: modelName,
      contents: docsQAPayload,
      config: {
        systemInstruction: docsQASystem,
        temperature: 0.4,
      }
    });
    const docsQAContent = docsQAResponse.text || "Failed to generate documentation and unit tests.";

    // Assemble unified final display output: Coder Final Draft + Docs & QA
    let unifiedFinalOutput = "";
    if (pmSpec.includes("[GENERAL_QUERY]")) {
      unifiedFinalOutput = pmSpec.replace("[GENERAL_QUERY]", "").trim();
    } else if (coderFinal.includes("Code implementation is not required for general inquiries")) {
      unifiedFinalOutput = pmSpec.replace("[GENERAL_QUERY]", "").trim();
    } else {
      unifiedFinalOutput = `### Final Collaborative Output

Here is the fully refined implementation generated by our multi-agent software development pipeline.

${coderFinal}

---

### Quickstart Guide & Unit Tests
${docsQAContent}
`;
    }

    const trace = [
      {
        agent: "Product Manager Agent",
        role: "Requirement Analyst",
        status: "completed",
        output: pmSpec
      },
      {
        agent: "Developer Agent (Coder) - Draft",
        role: "Software Engineer",
        status: "completed",
        output: coderDraft
      },
      {
        agent: "Code Reviewer Agent (The Critic)",
        role: "Critic & Security Assurance",
        status: "completed",
        output: criticReview
      },
      {
        agent: "Developer Agent (Coder) - Revision",
        role: "Software Refinement Lead",
        status: "completed",
        output: traceRound2Output
      },
      {
        agent: "Documentation & QA Agent",
        role: "Technical Writer & SDET",
        status: "completed",
        output: docsQAContent
      }
    ];

    return res.json({
      success: true,
      trace,
      finalResponse: unifiedFinalOutput,
      summary: "Product Manager Agent ✔ Coder ✔ The Critic ✔ Documentation & QA Agent ✔"
    });

  } catch (error: any) {
    console.error("Multi-Agent pipeline failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An internal error occurred during multi-agent collaboration."
    });
  }
});

// Configure Vite middleware / Serve client assets
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

serveApp().catch((err) => {
  console.error("Vite/Express initialization failed:", err);
});

import { z } from "zod";
import ky from "ky";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";
import { generateExcelModelBuffer, ExcelModelData } from "@/lib/excel-generator";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface GenerateExcelModelToolOptions {
  internalKey: string;
  projectId: Id<"projects">;
}

const paramsSchema = z.object({
  companyName: z.string().describe("The name of the target company"),
  dealSize: z.number().describe("The enterprise value / purchase price of the deal"),
  netDebt: z.number().optional().describe("The net debt of the target company at closing"),
  leverageMultiple: z.number().optional().describe("Target leverage multiple of EBITDA (e.g. 3.0)"),
  financials: z.array(
    z.object({
      year: z.string().describe("The year (e.g., '2023', '2024')"),
      revenue: z.number().describe("The total revenues for the year"),
      cogs: z.number().describe("Cost of goods sold"),
      opex: z.number().describe("Operating expenses"),
      netIncome: z.number().describe("Net income"),
    })
  ).min(1, "Include at least one year of financials"),
});

export const createGenerateExcelModelTool = ({
  internalKey,
  projectId,
}: GenerateExcelModelToolOptions) => {
  return createTool({
    name: "generateExcelModel",
    description: "Generate a beautifully styled financial Excel model (.xlsx) containing valuation metrics, LBO dashboard, and a 3-year historical P&L with proper Excel formulas, and save it in the project files tree.",
    parameters: paramsSchema,
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const excelData: ExcelModelData = parsed.data;

      try {
        return await toolStep?.run("generate-excel-model", async () => {
          // 1. Generate Excel Buffer
          const buffer = await generateExcelModelBuffer(excelData);

          // 2. Request Convex upload URL
          const uploadUrl = await convex.mutation(api.system.generateUploadUrl, {
            internalKey,
          });

          // 3. Upload the binary buffer to Convex Storage
          const uploadResponse = await ky.post(uploadUrl, {
            body: buffer as any,
            headers: {
              "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          });

          const { storageId } = await uploadResponse.json<{ storageId: string }>();

          if (!storageId) {
            throw new Error("Convex storage upload failed - no storageId returned");
          }

          // 4. Create binary file inside the project explorer
          const fileName = `${excelData.companyName.replace(/\s+/g, "_")}_Financial_Model.xlsx`;

          await convex.mutation(api.system.createBinaryFile, {
            internalKey,
            projectId,
            name: fileName,
            storageId: storageId as Id<"_storage">,
          });

          return `Success: Generated and saved financial Excel model as '${fileName}' in the project explorer. The user can now download and view it.`;
        });
      } catch (error) {
        console.error("Error generating Excel tool:", error);
        return `Error generating Excel model: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};

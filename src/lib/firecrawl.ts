import Firecrawl from "@mendable/firecrawl-js";

const apiKey = process.env.FIRECRAWL_API_KEY || "no-key-configured";

export const firecrawl = new Firecrawl({
  apiKey,
});

import { OpenRouter } from "@openrouter/sdk";

async function test() {
  const sdk = new OpenRouter({ apiKey: "test" });
  console.log(sdk.chat.send);
}
test();

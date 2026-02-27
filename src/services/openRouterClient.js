import { appEnv } from '../config/env';

const callOpenRouter = (model, payload) =>
  fetch(appEnv.openRouterProxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, ...payload }),
  });

export const requestAssistantMessage = async ({ messages, tools, systemPrompt, onStatus }) => {
  const payload = {
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    tools,
    tool_choice: 'auto',
  };

  let response = await callOpenRouter(appEnv.model, payload);

  if (!response.ok) {
    const body = await response.text();
    const shouldFallback =
      response.status === 404 &&
      appEnv.model !== appEnv.fallbackModel &&
      body.includes('No endpoints found');

    if (shouldFallback) {
      onStatus?.('Primary model unavailable, trying fallback...');
      response = await callOpenRouter(appEnv.fallbackModel, payload);
    }

    if (!response.ok) {
      const retryBody = shouldFallback ? await response.text() : body;
      throw new Error(`LLM request failed (${response.status}): ${retryBody.slice(0, 200)}`);
    }
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;

  if (!message) {
    throw new Error('LLM returned no message.');
  }

  return message;
};

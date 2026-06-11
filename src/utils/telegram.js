import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
let detectedGroupId = null;

async function callTelegram(method, data) {
  if (!BOT_TOKEN) return null;
  try {
    const r = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data, { timeout: 10000 });
    return r.data;
  } catch (err) {
    console.error(`Telegram API error (${method}):`, err.response?.data?.description || err.message);
    return null;
  }
}

export function setDetectedGroupId(gid) {
  detectedGroupId = gid;
  console.log(`✅ Group ID detected: ${gid}`);
}

export function getDetectedGroupId() {
  return detectedGroupId;
}

export async function createForumTopic(chatId, name, iconColor = 0x6FB3D2) {
  const result = await callTelegram('createForumTopic', {
    chat_id: chatId, name, icon_color: iconColor
  });
  if (result && result.ok) {
    console.log(`Topic created: "${name}" in chat ${chatId}`);
    return result.result.message_thread_id;
  }
  console.error('Failed to create topic:', result?.description || 'unknown error');
  return null;
}

export async function sendMessageToTopic(chatId, text, threadId, options = {}) {
  return callTelegram('sendMessage', {
    chat_id: chatId, text, message_thread_id: threadId, parse_mode: 'Markdown', ...options
  });
}

export async function getForumTopics(chatId) {
  const result = await callTelegram('getForumTopicIconStickers', { chat_id: chatId });
  return result;
}

export async function getChatMemberCount(chatId) {
  const result = await callTelegram('getChatMemberCount', { chat_id: chatId });
  return result?.result || 0;
}

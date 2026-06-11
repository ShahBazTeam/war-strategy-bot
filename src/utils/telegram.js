import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

async function callTelegram(method, data) {
  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN not set for Telegram API');
    return null;
  }
  try {
    const r = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data, {
      timeout: 10000
    });
    return r.data;
  } catch (err) {
    console.error(`Telegram API error (${method}):`, err.response?.data || err.message);
    return null;
  }
}

export async function createForumTopic(name, iconColor = 0x6FB3D2) {
  if (!GROUP_ID) {
    console.warn('GROUP_ID not set, cannot create forum topic. Topic will not be created.');
    return null;
  }
  
  const result = await callTelegram('createForumTopic', {
    chat_id: GROUP_ID,
    name: name,
    icon_color: iconColor
  });
  
  if (result && result.ok) {
    console.log(`Forum topic created: "${name}" with ID ${result.result.message_thread_id}`);
    return result.result.message_thread_id;
  }
  
  console.error(`Failed to create forum topic "${name}":`, result?.description || 'Unknown error');
  return null;
}

export async function sendMessageToTopic(chatId, text, threadId, options = {}) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text: text,
    message_thread_id: threadId,
    parse_mode: 'Markdown',
    ...options
  });
}

export async function sendPhotoToTopic(chatId, photo, threadId, caption, options = {}) {
  return callTelegram('sendPhoto', {
    chat_id: chatId,
    photo: photo,
    message_thread_id: threadId,
    caption: caption,
    parse_mode: 'Markdown',
    ...options
  });
}

export { GROUP_ID };

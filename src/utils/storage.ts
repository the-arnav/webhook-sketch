export interface SavedCanvas {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  pinned?: boolean;
  data: {
    nodes: unknown[];
    edges: unknown[];
    subject?: string;
  };
}

export interface SavedChat {
  id: string;
  canvasId?: string;
  prompt: string;
  response: unknown;
  createdAt: number;
  pinned?: boolean;
  tags?: string[];
}

const CANVASES_KEY = 'savedCanvases';
const CHATS_KEY = 'savedChats';

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCanvases(): SavedCanvas[] {
  return readArray<SavedCanvas>(CANVASES_KEY)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

// Convenience alias for UI usage
export function listCanvases(): SavedCanvas[] {
  return getCanvases();
}

export function saveCanvas(canvas: SavedCanvas) {
  const items = getCanvases();
  const idx = items.findIndex(c => c.id === canvas.id);
  if (idx >= 0) {
    items[idx] = { ...canvas, updatedAt: Date.now() };
  } else {
    items.unshift({ ...canvas, createdAt: Date.now(), updatedAt: Date.now() });
  }
  writeArray(CANVASES_KEY, items);
}

export function deleteCanvas(id: string) {
  const items = getCanvases().filter(c => c.id !== id);
  writeArray(CANVASES_KEY, items);
}

export function renameCanvas(id: string, title: string) {
  const items = getCanvases();
  const idx = items.findIndex(c => c.id === id);
  if (idx >= 0) {
    items[idx].title = title;
    items[idx].updatedAt = Date.now();
    writeArray(CANVASES_KEY, items);
  }
}

export function togglePinCanvas(id: string) {
  const items = getCanvases();
  const idx = items.findIndex(c => c.id === id);
  if (idx >= 0) {
    items[idx].pinned = !items[idx].pinned;
    items[idx].updatedAt = Date.now();
    writeArray(CANVASES_KEY, items);
  }
}

export function setCanvasTags(id: string, tags: string[]) {
  const items = getCanvases();
  const idx = items.findIndex(c => c.id === id);
  if (idx >= 0) {
    items[idx].tags = tags;
    items[idx].updatedAt = Date.now();
    writeArray(CANVASES_KEY, items);
  }
}

export function getChats(): SavedChat[] {
  return readArray<SavedChat>(CHATS_KEY)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function saveChat(chat: SavedChat) {
  const items = getChats();
  items.unshift({ ...chat, createdAt: chat.createdAt ?? Date.now() });
  writeArray(CHATS_KEY, items);
}

export function togglePinChat(id: string) {
  const items = getChats();
  const idx = items.findIndex(c => c.id === id);
  if (idx >= 0) {
    items[idx].pinned = !items[idx].pinned;
    writeArray(CHATS_KEY, items);
  }
}

export function searchAll(query: string) {
  const q = query.trim().toLowerCase();
  const canvases = getCanvases().filter(c =>
    c.title.toLowerCase().includes(q) ||
    (c.tags || []).some(t => t.toLowerCase().includes(q))
  );
  const chats = getChats().filter(ch =>
    ch.prompt.toLowerCase().includes(q) ||
    JSON.stringify(ch.response).toLowerCase().includes(q) ||
    (ch.tags || []).some(t => t.toLowerCase().includes(q))
  );
  return { canvases, chats };
}

export function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}



import { create } from 'zustand';

type FavoritesState = {
  ids: Set<string>;
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
};

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem('favorites');
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveToStorage(ids: Set<string>) {
  try {
    localStorage.setItem('favorites', JSON.stringify([...ids]));
  } catch {}
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: loadFromStorage(),
  toggle: (id) => {
    const next = new Set(get().ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveToStorage(next);
    set({ ids: next });
  },
  isFavorite: (id) => get().ids.has(id),
}));

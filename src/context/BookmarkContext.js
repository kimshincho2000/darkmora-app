import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookmarkContext = createContext({
  bookmarks: [],
  toggleBookmark: () => {},
  isBookmarked: () => false,
});

const STORAGE_KEY = 'animedia_watchlist';

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setBookmarks(JSON.parse(data));
      }
    } catch (e) {
      console.error('Error loading bookmarks', e);
    }
  };

  const isBookmarked = (animeId) => {
    const idNum = parseInt(animeId, 10);
    return bookmarks.some((item) => parseInt(item.id, 10) === idNum);
  };

  const toggleBookmark = async (anime) => {
    if (!anime) return;
    const aId = parseInt(anime.id, 10);
    let updated;
    if (isBookmarked(aId)) {
      updated = bookmarks.filter((x) => parseInt(x.id, 10) !== aId);
    } else {
      updated = [
        {
          id: aId,
          slug: anime.slug || String(aId),
          title: anime.title || anime.nom || '',
          poster: anime.poster || anime.image_url || '',
          year: anime.year || anime.yili || '',
          genres: anime.genres || anime.janri || '',
        },
        ...bookmarks,
      ];
    }
    setBookmarks(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => useContext(BookmarkContext);

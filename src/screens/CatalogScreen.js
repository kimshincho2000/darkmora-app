import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Search, Filter, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import AnimeCard from '../components/AnimeCard';

const SORT_OPTIONS = [
  { id: 'popular', label: 'Mashhur' },
  { id: 'latest', label: 'Yangi' },
  { id: 'rating', label: 'Top Reyting' },
];

export default function CatalogScreen({ navigation, route }) {
  const initialSort = route?.params?.sort || 'popular';
  const initialGenre = route?.params?.genre || '';

  const [items, setItems] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Genres
  useEffect(() => {
    api.getGenres().then((g) => setGenres(g || [])).catch(() => {});
  }, []);

  // Fetch Catalog items
  const fetchItems = useCallback(
    async (pageNum = 1, isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await api.getCatalog({
          page: pageNum,
          genre: selectedGenre,
          sort: selectedSort,
          q: searchQuery,
        });

        if (isLoadMore) {
          setItems((prev) => [...prev, ...(res.items || [])]);
        } else {
          setItems(res.items || []);
        }
        setTotalPages(res.total_pages || 1);
        setPage(pageNum);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedGenre, selectedSort, searchQuery]
  );

  useEffect(() => {
    fetchItems(1, false);
  }, [selectedGenre, selectedSort]);

  const handleSearchSubmit = () => {
    fetchItems(1, false);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && page < totalPages) {
      fetchItems(page + 1, true);
    }
  };

  const openAnime = (anime) => {
    navigation.navigate('AnimeDetail', { slug: anime.slug || String(anime.id) });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header & Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anime Katalogi</Text>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            placeholder="Anime nomi bo'yicha izlash..."
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchItems(1, false); }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort pills */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.sortPill, selectedSort === opt.id && styles.sortPillActive]}
            onPress={() => setSelectedSort(opt.id)}
          >
            <Text style={[styles.sortPillText, selectedSort === opt.id && styles.sortPillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Genres Horizontal Scroll */}
      <View style={styles.genresRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <TouchableOpacity
            style={[styles.genrePill, !selectedGenre && styles.genrePillActive]}
            onPress={() => setSelectedGenre('')}
          >
            <Text style={[styles.genrePillText, !selectedGenre && styles.genrePillTextActive]}>Barchasi</Text>
          </TouchableOpacity>

          {genres.map((g, idx) => {
            const genreName = typeof g === 'string' ? g : g.name || g.nom;
            const isSelected = selectedGenre === genreName;
            return (
              <TouchableOpacity
                key={`genre-${idx}`}
                style={[styles.genrePill, isSelected && styles.genrePillActive]}
                onPress={() => setSelectedGenre(isSelected ? '' : genreName)}
              >
                <Text style={[styles.genrePillText, isSelected && styles.genrePillTextActive]}>
                  {genreName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Anime List Grid */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item, idx) => `cat-${item.id || idx}`}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <AnimeCard anime={item} onPress={openAnime} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.moreLoader}>
                <ActivityIndicator size="small" color={colors.primaryGlow} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Hech qanday anime topilmadi</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 44,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sortPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryGlow,
  },
  sortPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  sortPillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  genresRow: {
    marginVertical: 6,
  },
  genrePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genrePillActive: {
    backgroundColor: 'rgba(29, 104, 246, 0.25)',
    borderColor: colors.primaryGlow,
  },
  genrePillText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '500',
  },
  genrePillTextActive: {
    color: colors.primaryGlow,
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 14,
  },
});

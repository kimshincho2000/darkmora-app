import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Search, X, ChevronLeft } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import AnimeCard from '../components/AnimeCard';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res || []);
        setSearched(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const openAnime = (anime) => {
    navigation.navigate('AnimeDetail', { slug: anime.slug || String(anime.id) });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            placeholder="Anime nomi bo'yicha qidirish..."
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item, idx) => `search-${item.id || idx}`}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <AnimeCard anime={item} onPress={openAnime} />}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Hech narsa topilmadi</Text>
                <Text style={styles.emptySub}>Boshqa so'z bilan qidirib ko'ring</Text>
              </View>
            ) : null
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
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyBox: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 4,
  },
});

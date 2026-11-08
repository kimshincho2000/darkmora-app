import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Bookmark, Film } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useBookmarks } from '../context/BookmarkContext';
import AnimeCard from '../components/AnimeCard';

export default function MyListScreen({ navigation }) {
  const { bookmarks } = useBookmarks();

  const openAnime = (anime) => {
    navigation.navigate('AnimeDetail', { slug: anime.slug || String(anime.id) });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Bookmark size={20} color={colors.primaryGlow} fill={colors.primaryGlow} />
          <Text style={styles.headerTitle}>Mening ro'yxatim</Text>
        </View>
        <Text style={styles.countBadge}>{bookmarks.length} ta anime</Text>
      </View>

      <FlatList
        data={bookmarks}
        numColumns={2}
        keyExtractor={(item, idx) => `fav-${item.id || idx}`}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <AnimeCard anime={item} onPress={openAnime} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Film size={36} color={colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>Ro'yxatingiz bo'sh</Text>
            <Text style={styles.emptyDesc}>
              O'zingizga yoqqan animelarni saqlab qo'ying va keyinroq tomosha qiling.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Catalog')}
            >
              <Text style={styles.exploreBtnText}>Katalogni ko'rish</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  countBadge: {
    color: colors.primaryGlow,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(29, 104, 246, 0.3)',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    paddingTop: 90,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyDesc: {
    color: colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  exploreBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

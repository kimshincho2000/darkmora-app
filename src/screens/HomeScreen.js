import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Flame, Sparkles, Trophy, ChevronRight, Search } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api, toAbsoluteUrl } from '../api/client';
import AnimeCard from '../components/AnimeCard';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [data, setData] = useState({
    featured: [],
    trending: [],
    latest: [],
    topRated: [],
    top10: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroScrollRef = useRef(null);

  const loadData = async () => {
    try {
      const res = await api.getHome();
      setData({
        featured: res.featured || [],
        trending: res.trending || res.featured || [],
        latest: res.latest_episodes || res.latest || [],
        topRated: res.top_rated || res.top || [],
        top10: res.top || res.top_rated || [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openAnime = (anime) => {
    navigation.navigate('AnimeDetail', { slug: anime.slug || String(anime.id) });
  };

  const openPlayer = (anime, epNum = 1) => {
    navigation.navigate('Player', { anime, episodeNumber: epNum });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  const featured = data.featured.length > 0 ? data.featured : data.trending.slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <View>
            <Text style={styles.brandTitle}>
              DARK<Text style={{ color: colors.primaryGlow }}>MORA</Text>
            </Text>
            <Text style={styles.brandSubtitle}>O'zbek dublyaj olami</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <Search size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ================= HERO CAROUSEL ================= */}
        {featured.length > 0 && (
          <View style={styles.heroWrapper}>
            <FlatList
              ref={heroScrollRef}
              data={featured}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => `hero-${item.id || idx}`}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveHeroIndex(index);
              }}
              renderItem={({ item }) => {
                const posterUrl = toAbsoluteUrl(item.banner || item.poster || item.image_url);
                return (
                  <View style={styles.heroSlide}>
                    <Image source={{ uri: posterUrl }} style={styles.heroImage} contentFit="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(7, 8, 10, 0.65)', colors.bg]}
                      style={styles.heroGradient}
                    />
                    <View style={styles.heroContent}>
                      <View style={styles.heroBadgeRow}>
                        <View style={styles.featuredBadge}>
                          <Sparkles size={12} color="#fff" />
                          <Text style={styles.featuredBadgeText}>TAVSIYA ETILADI</Text>
                        </View>
                        {item.year || item.yili ? (
                          <Text style={styles.heroYear}>{item.year || item.yili}</Text>
                        ) : null}
                      </View>

                      <Text style={styles.heroTitle} numberOfLines={2}>
                        {item.title || item.nom}
                      </Text>

                      {item.genres || item.janri ? (
                        <Text style={styles.heroGenres} numberOfLines={1}>
                          {item.genres || item.janri}
                        </Text>
                      ) : null}

                      <View style={styles.heroButtons}>
                        <TouchableOpacity
                          style={styles.heroPlayBtn}
                          activeOpacity={0.85}
                          onPress={() => openPlayer(item, 1)}
                        >
                          <Play size={16} color="#fff" fill="#fff" />
                          <Text style={styles.heroPlayText}>Tomosha qilish</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.heroDetailBtn}
                          activeOpacity={0.85}
                          onPress={() => openAnime(item)}
                        >
                          <Text style={styles.heroDetailText}>Tafsilotlar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
              {featured.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.dot,
                    activeHeroIndex === i && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ================= SO'NGGI QISMLAR (LATEST) ================= */}
        {data.latest.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Flame size={18} color={colors.primaryGlow} />
                <Text style={styles.sectionTitle}>Yangi qismlar</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('Catalog', { sort: 'latest' })}
              >
                <Text style={styles.seeAllText}>Barchasi</Text>
                <ChevronRight size={14} color={colors.primaryGlow} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={data.latest}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              keyExtractor={(item, idx) => `latest-${item.id || idx}`}
              renderItem={({ item }) => (
                <AnimeCard anime={item} onPress={openAnime} style={{ width: 140, marginBottom: 0 }} />
              )}
            />
          </View>
        )}

        {/* ================= TOP 10 ANIMELAR ================= */}
        {data.top10.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Trophy size={18} color={colors.rating} />
                <Text style={styles.sectionTitle}>Top 10 eng saralar</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
              {data.top10.slice(0, 10).map((anime, index) => {
                const posterUrl = toAbsoluteUrl(anime.poster || anime.image_url);
                return (
                  <TouchableOpacity
                    key={`top10-${anime.id || index}`}
                    style={styles.top10Card}
                    activeOpacity={0.85}
                    onPress={() => openAnime(anime)}
                  >
                    <Text style={styles.top10Rank}>{index + 1}</Text>
                    <Image source={{ uri: posterUrl }} style={styles.top10Poster} contentFit="cover" />
                    <View style={styles.top10Info}>
                      <Text style={styles.top10Title} numberOfLines={2}>
                        {anime.title || anime.nom}
                      </Text>
                      <Text style={styles.top10Genres} numberOfLines={1}>
                        {anime.genres || anime.janri || 'Anime'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ================= TRENDDAGI ANIMELAR ================= */}
        {data.trending.length > 0 && (
          <View style={[styles.section, { paddingBottom: 32 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={18} color={colors.primaryGlow} />
                <Text style={styles.sectionTitle}>Trenddagi animelar</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('Catalog', { sort: 'popular' })}
              >
                <Text style={styles.seeAllText}>Barchasi</Text>
                <ChevronRight size={14} color={colors.primaryGlow} />
              </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
              {data.trending.slice(0, 8).map((anime, idx) => (
                <AnimeCard key={`trend-${anime.id || idx}`} anime={anime} onPress={openAnime} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 8, 10, 0.92)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroWrapper: {
    width,
    height: width * 1.15,
    position: 'relative',
  },
  heroSlide: {
    width,
    height: width * 1.15,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '80%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  heroYear: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroGenres: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPlayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  heroPlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  heroDetailBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroDetailText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primaryGlow,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: colors.primaryGlow,
    fontSize: 12,
    fontWeight: '600',
  },
  top10Card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 8,
    width: 250,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  top10Rank: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primaryGlow,
    width: 44,
    textAlign: 'center',
  },
  top10Poster: {
    width: 55,
    height: 75,
    borderRadius: 10,
  },
  top10Info: {
    flex: 1,
    marginLeft: 10,
  },
  top10Title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  top10Genres: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});

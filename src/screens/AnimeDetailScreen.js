import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Bookmark,
  Share2,
  Star,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api, toAbsoluteUrl } from '../api/client';
import { useBookmarks } from '../context/BookmarkContext';
import AnimeCard from '../components/AnimeCard';

const { width } = Dimensions.get('window');

export default function AnimeDetailScreen({ navigation, route }) {
  const { slug } = route.params || {};
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeRangeIndex, setActiveRangeIndex] = useState(0);

  const { isBookmarked, toggleBookmark } = useBookmarks();

  const sortedEpisodes = React.useMemo(() => {
    return [...episodes].sort((a, b) => {
      const numA = parseInt(a.qism || a.episode_number || 0, 10);
      const numB = parseInt(b.qism || b.episode_number || 0, 10);
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [episodes, sortOrder]);

  const CHUNK_SIZE = 50;
  const episodeRanges = React.useMemo(() => {
    if (sortedEpisodes.length <= CHUNK_SIZE) return [];
    const ranges = [];
    for (let i = 0; i < sortedEpisodes.length; i += CHUNK_SIZE) {
      const chunk = sortedEpisodes.slice(i, i + CHUNK_SIZE);
      const firstEp = parseInt(chunk[0]?.qism || chunk[0]?.episode_number || i + 1, 10);
      const lastEp = parseInt(chunk[chunk.length - 1]?.qism || chunk[chunk.length - 1]?.episode_number || i + chunk.length, 10);
      ranges.push({
        label: `${firstEp} - ${lastEp}`,
        startIndex: i,
        endIndex: i + CHUNK_SIZE,
      });
    }
    return ranges;
  }, [sortedEpisodes]);

  const displayedEpisodes = React.useMemo(() => {
    if (episodeRanges.length === 0) return sortedEpisodes;
    const currentRange = episodeRanges[activeRangeIndex] || episodeRanges[0];
    return sortedEpisodes.slice(currentRange.startIndex, currentRange.endIndex);
  }, [sortedEpisodes, episodeRanges, activeRangeIndex]);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getAnimeDetail(slug);
        if (res && res.ok && res.data) {
          setAnime(res.data.anime);
          setEpisodes(res.data.episodes || []);
          setSimilar(res.data.similar || []);
        } else {
          setError(res?.error || 'Anime topilmadi');
        }
      } catch (e) {
        setError('Internet bilan bog\'lanishda xatolik');
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loaderText}>Anime yuklanmoqda...</Text>
      </View>
    );
  }

  if (error || !anime) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Anime topilmadi'}</Text>
        <TouchableOpacity style={styles.backBtnAlt} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Orqaga qaytish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const posterUrl = toAbsoluteUrl(anime.poster || anime.image_url);
  const bannerUrl = toAbsoluteUrl(anime.banner || anime.poster || anime.image_url);
  const bookmarked = isBookmarked(anime.id);
  const rating = anime.rating || anime.mal_score || (anime.reyting ? parseFloat(anime.reyting).toFixed(1) : null);

  const openPlayer = (epNum = 1) => {
    navigation.navigate('Player', { anime, episodes: sortedEpisodes, episodeNumber: epNum });
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Floating Back and Action buttons */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={[styles.iconCircle, bookmarked && styles.iconCircleActive]}
            onPress={() => toggleBookmark(anime)}
          >
            <Bookmark
              size={18}
              color={bookmarked ? '#fff' : colors.text}
              fill={bookmarked ? '#fff' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner with blur and dark gradient */}
        <View style={styles.bannerWrapper}>
          <Image source={{ uri: bannerUrl }} style={styles.bannerImage} contentFit="cover" />
          <LinearGradient
            colors={['rgba(7, 8, 10, 0.3)', 'rgba(7, 8, 10, 0.8)', colors.bg]}
            style={styles.bannerGradient}
          />
        </View>

        {/* Anime Main Info Card */}
        <View style={styles.infoWrapper}>
          <View style={styles.posterRow}>
            <Image source={{ uri: posterUrl }} style={styles.mainPoster} contentFit="cover" />
            <View style={styles.mainMeta}>
              <Text style={styles.animeTitle}>{anime.title || anime.nom}</Text>
              {anime.original_name ? (
                <Text style={styles.originalName}>{anime.original_name}</Text>
              ) : null}

              {/* Rating & Year chips */}
              <View style={styles.chipsRow}>
                {rating ? (
                  <View style={styles.ratingChip}>
                    <Star size={13} color={colors.rating} fill={colors.rating} />
                    <Text style={styles.ratingText}>{rating}</Text>
                  </View>
                ) : null}

                {anime.year || anime.yili ? (
                  <View style={styles.chip}>
                    <Calendar size={12} color={colors.textMuted} />
                    <Text style={styles.chipText}>{anime.year || anime.yili}</Text>
                  </View>
                ) : null}

                {anime.episodes_count || episodes.length ? (
                  <View style={styles.chip}>
                    <Layers size={12} color={colors.textMuted} />
                    <Text style={styles.chipText}>{anime.episodes_count || episodes.length} qism</Text>
                  </View>
                ) : null}
              </View>

              {anime.genres || anime.janri ? (
                <Text style={styles.genresText}>{anime.genres || anime.janri}</Text>
              ) : null}
            </View>
          </View>

          {/* Action Button: Play Episode 1 */}
          <TouchableOpacity
            style={styles.playMainBtn}
            activeOpacity={0.88}
            onPress={() => openPlayer(1)}
          >
            <Play size={18} color="#fff" fill="#fff" />
            <Text style={styles.playMainText}>1-qismni tomosha qilish</Text>
          </TouchableOpacity>

          {/* Description */}
          {anime.description || anime.haqida ? (
            <View style={styles.descSection}>
              <Text style={styles.sectionHeader}>Anime haqida</Text>
              <Text
                style={styles.descText}
                numberOfLines={expandedDesc ? undefined : 4}
              >
                {anime.description || anime.haqida}
              </Text>
              {(anime.description || anime.haqida).length > 180 && (
                <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)}>
                  <Text style={styles.readMoreText}>
                    {expandedDesc ? 'Kamroq ko\'rsatish' : 'To\'liq o\'qish'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Dublyaj / Studio Info */}
          {anime.dublyaj || anime.ovoz ? (
            <View style={styles.dublyajBox}>
              <Text style={styles.dublyajLabel}>Ovoz beruvchilar:</Text>
              <Text style={styles.dublyajVal}>{anime.dublyaj || anime.ovoz}</Text>
            </View>
          ) : null}

          {/* ================= EPISODES LIST ================= */}
          <View style={styles.episodesSection}>
            <View style={styles.episodesHeader}>
              <Text style={styles.sectionHeader}>Qismlar ({episodes.length})</Text>

              {episodes.length > 0 && (
                <View style={styles.epControlButtons}>
                  {/* Sort Order Toggle */}
                  <TouchableOpacity
                    style={styles.epSortBtn}
                    onPress={() => {
                      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      setActiveRangeIndex(0);
                    }}
                    activeOpacity={0.7}
                  >
                    <ArrowUpDown size={13} color={colors.primaryGlow} />
                    <Text style={styles.epSortText}>
                      {sortOrder === 'asc' ? `1 ➔ ${episodes.length}` : `${episodes.length} ➔ 1`}
                    </Text>
                  </TouchableOpacity>

                  {/* View Mode Toggle (Grid / List) */}
                  <TouchableOpacity
                    style={styles.epViewToggleBtn}
                    onPress={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                    activeOpacity={0.7}
                  >
                    {viewMode === 'grid' ? (
                      <LayoutList size={16} color={colors.text} />
                    ) : (
                      <LayoutGrid size={16} color={colors.text} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Range Tabs (if > 50 episodes) */}
            {episodeRanges.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rangeScroll}
              >
                {episodeRanges.map((range, idx) => {
                  const isActive = idx === activeRangeIndex;
                  return (
                    <TouchableOpacity
                      key={`range-${idx}`}
                      style={[styles.rangeTab, isActive && styles.rangeTabActive]}
                      onPress={() => setActiveRangeIndex(idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.rangeTabText, isActive && styles.rangeTabTextActive]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {episodes.length === 0 ? (
              <Text style={styles.noEpText}>Hozircha qismlar yuklanmagan</Text>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW: 5-column keypad for fast access */
              <View style={styles.epGridWrap}>
                {displayedEpisodes.map((ep, idx) => {
                  const epNum = parseInt(ep.qism || ep.episode_number || idx + 1, 10);
                  return (
                    <TouchableOpacity
                      key={`ep-g-${ep.id || idx}`}
                      style={styles.epGridBox}
                      activeOpacity={0.75}
                      onPress={() => openPlayer(epNum)}
                    >
                      <Text style={styles.epGridBoxNum}>{epNum}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* LIST VIEW: Full details card */
              <View style={styles.epListWrap}>
                {displayedEpisodes.map((ep, idx) => {
                  const epNum = parseInt(ep.qism || ep.episode_number || idx + 1, 10);
                  return (
                    <TouchableOpacity
                      key={`ep-l-${ep.id || idx}`}
                      style={styles.epCard}
                      activeOpacity={0.8}
                      onPress={() => openPlayer(epNum)}
                    >
                      <View style={styles.epPlayIcon}>
                        <Play size={12} color={colors.primaryGlow} fill={colors.primaryGlow} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.epTitle}>{epNum}-qism</Text>
                        {ep.title && ep.title !== `${epNum}-qism` ? (
                          <Text style={styles.epSubtitle} numberOfLines={1}>{ep.title}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ================= SIMILAR ANIME ================= */}
          {similar.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionHeader}>O'xshash animelar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 10 }}>
                {similar.map((s, idx) => (
                  <AnimeCard
                    key={`sim-${s.id || idx}`}
                    anime={s}
                    style={{ width: 130 }}
                    onPress={() => navigation.push('AnimeDetail', { slug: s.slug || String(s.id) })}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
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
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtnAlt: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 44,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 8, 10, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryGlow,
  },
  bannerWrapper: {
    width,
    height: 260,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  infoWrapper: {
    paddingHorizontal: 16,
    marginTop: -80,
    paddingBottom: 40,
  },
  posterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  mainPoster: {
    width: 125,
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.bgCard,
  },
  mainMeta: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  animeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
  },
  originalName: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: colors.rating,
    fontSize: 11,
    fontWeight: '800',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  genresText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  playMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  playMainText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  descSection: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  descText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 21,
  },
  readMoreText: {
    color: colors.primaryGlow,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  dublyajBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  dublyajLabel: {
    color: colors.textDim,
    fontSize: 12,
  },
  dublyajVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  episodesSection: {
    marginTop: 26,
  },
  episodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  epControlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  epSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  epSortText: {
    color: colors.primaryGlow,
    fontSize: 11,
    fontWeight: '700',
  },
  epViewToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  rangeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  rangeTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryGlow,
  },
  rangeTabText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  rangeTabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  epGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  epGridBox: {
    width: (width - 32 - 32) / 5, // 5 ustun
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  epGridBoxNum: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  epListWrap: {
    gap: 8,
    marginTop: 4,
  },
  noEpText: {
    color: colors.textDim,
    fontSize: 13,
    fontStyle: 'italic',
  },
  epCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  epPlayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(29, 104, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  epTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  epSubtitle: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  similarSection: {
    marginTop: 28,
  },
});

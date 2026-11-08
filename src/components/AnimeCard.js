import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Star } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { toAbsoluteUrl } from '../api/client';
import { useBookmarks } from '../context/BookmarkContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function AnimeCard({ anime, onPress, style }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  if (!anime) return null;

  const animeId = anime.id;
  const title = anime.title || anime.nom || 'Anime';
  const posterUrl = toAbsoluteUrl(anime.poster || anime.image_url || '');
  const rating = anime.rating || anime.mal_score || (anime.reyting ? parseFloat(anime.reyting).toFixed(1) : null);
  const year = anime.year || anime.yili || '';
  const episodesCount = anime.episodes_count || anime.qismlar_soni || '';
  const bookmarked = isBookmarked(animeId);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.container, style]}
      onPress={() => onPress && onPress(anime)}
    >
      <View style={styles.posterWrapper}>
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(7, 8, 10, 0.95)']}
          style={styles.gradient}
        />

        {/* Top badges: Rating & Bookmark */}
        <View style={styles.topBadges}>
          {rating ? (
            <View style={styles.ratingBadge}>
              <Star size={12} color={colors.rating} fill={colors.rating} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : <View />}

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
            onPress={(e) => {
              e.stopPropagation?.();
              toggleBookmark(anime);
            }}
          >
            <Bookmark
              size={14}
              color={bookmarked ? '#fff' : colors.textMuted}
              fill={bookmarked ? '#fff' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom meta over poster */}
        <View style={styles.bottomMeta}>
          {episodesCount ? (
            <View style={styles.epBadge}>
              <Text style={styles.epBadgeText}>{episodesCount} qism</Text>
            </View>
          ) : null}
          {year ? <Text style={styles.yearText}>{year}</Text> : null}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {anime.genres || anime.janri ? (
        <Text style={styles.genres} numberOfLines={1}>
          {anime.genres || anime.janri}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  posterWrapper: {
    width: '100%',
    height: CARD_WIDTH * 1.45,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  topBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 8, 10, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  bookmarkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 8, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  bookmarkBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryGlow,
  },
  bottomMeta: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  epBadge: {
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  epBadgeText: {
    color: colors.primaryGlow,
    fontSize: 10,
    fontWeight: '600',
  },
  yearText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 18,
  },
  genres: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
});

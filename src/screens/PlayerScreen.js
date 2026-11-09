import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  ChevronLeft,
  SkipForward,
  SkipBack,
  Sliders,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { toAbsoluteUrl } from '../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const formatTime = (millis) => {
  if (!millis || isNaN(millis)) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function PlayerScreen({ navigation, route }) {
  const { anime, episodes = [], episodeNumber = 1 } = route.params || {};

  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [currentEpNum, setCurrentEpNum] = useState(episodeNumber);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [activeRangeIndex, setActiveRangeIndex] = useState(0);

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

  useEffect(() => {
    if (episodeRanges.length > 0) {
      const foundIdx = episodeRanges.findIndex((r) => {
        const chunk = sortedEpisodes.slice(r.startIndex, r.endIndex);
        return chunk.some((e) => parseInt(e.qism || e.episode_number, 10) === currentEpNum);
      });
      if (foundIdx !== -1) setActiveRangeIndex(foundIdx);
    }
  }, [currentEpNum, episodeRanges, sortedEpisodes]);

  const displayedEpisodes = React.useMemo(() => {
    if (episodeRanges.length === 0) return sortedEpisodes;
    const currentRange = episodeRanges[activeRangeIndex] || episodeRanges[0];
    return sortedEpisodes.slice(currentRange.startIndex, currentRange.endIndex);
  }, [sortedEpisodes, episodeRanges, activeRangeIndex]);

  // Find active episode
  const currentEpIndex = episodes.findIndex(
    (e) => parseInt(e.qism || e.episode_number, 10) === currentEpNum
  );
  const currentEp = currentEpIndex > -1 ? episodes[currentEpIndex] : episodes[0] || {};
  const prevEp = currentEpIndex > 0 ? episodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex > -1 && currentEpIndex < episodes.length - 1 ? episodes[currentEpIndex + 1] : null;

  // Stream video URL
  const rawVideoUrl = currentEp?.video_url || '';
  const videoUrl = toAbsoluteUrl(rawVideoUrl);

  // Handle Fullscreen & Orientation
  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      setIsFullscreen(true);
    }
  };

  // Reset orientation on back
  useEffect(() => {
    const backAction = () => {
      if (isFullscreen) {
        toggleFullscreen();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => {
      backHandler.remove();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [isFullscreen]);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    resetControlsTimeout();
  };

  const handleSeek = async (secondsOffset) => {
    if (!videoRef.current || !durationMillis) return;
    const newPos = Math.max(0, Math.min(positionMillis + secondsOffset * 1000, durationMillis));
    await videoRef.current.setPositionAsync(newPos);
    resetControlsTimeout();
  };

  const changeEpisode = (num) => {
    setCurrentEpNum(num);
    setPositionMillis(0);
    setIsBuffering(true);
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar hidden={isFullscreen} />

      {/* ================= NATIVE VIDEO PLAYER ================= */}
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.playerBox, isFullscreen && styles.fullscreenPlayerBox]}
        onPress={resetControlsTimeout}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.nativeVideo}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          onPlaybackStatusUpdate={(status) => {
            if (!status.isLoaded) {
              if (status.error) console.error('Video error:', status.error);
              return;
            }
            setIsBuffering(status.isBuffering);
            setIsPlaying(status.isPlaying);
            setPositionMillis(status.positionMillis || 0);
            setDurationMillis(status.durationMillis || 0);
          }}
        />

        {/* Buffering indicator */}
        {isBuffering && (
          <View style={styles.centerOverlay}>
            <ActivityIndicator size="large" color={colors.primaryGlow} />
          </View>
        )}

        {/* ================= TRANSPARENT CONTROLS OVERLAY ================= */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top Bar: Back & Title */}
            <View style={styles.topControlBar}>
              <TouchableOpacity
                style={styles.controlIconBtn}
                onPress={() => {
                  if (isFullscreen) toggleFullscreen();
                  else navigation.goBack();
                }}
              >
                <ChevronLeft size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.overlayAnimeTitle} numberOfLines={1}>
                  {anime?.title || anime?.nom}
                </Text>
                <Text style={styles.overlayEpTitle}>
                  {currentEpNum}-qism
                </Text>
              </View>
            </View>

            {/* Middle: Prev, Rewind 10s, Play/Pause, Forward 10s, Next */}
            <View style={styles.middleControlBar}>
              {prevEp && (
                <TouchableOpacity
                  style={styles.controlIconBtn}
                  onPress={() => changeEpisode(parseInt(prevEp.qism || prevEp.episode_number, 10))}
                >
                  <SkipBack size={22} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.controlIconBtn} onPress={() => handleSeek(-10)}>
                <RotateCcw size={24} color="#fff" />
                <Text style={styles.seekBadgeText}>10</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseBtn}
                activeOpacity={0.8}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={28} color="#fff" fill="#fff" />
                ) : (
                  <Play size={28} color="#fff" fill="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlIconBtn} onPress={() => handleSeek(10)}>
                <RotateCw size={24} color="#fff" />
                <Text style={styles.seekBadgeText}>10</Text>
              </TouchableOpacity>

              {nextEp && (
                <TouchableOpacity
                  style={styles.controlIconBtn}
                  onPress={() => changeEpisode(parseInt(nextEp.qism || nextEp.episode_number, 10))}
                >
                  <SkipForward size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Bar: Timeline, Times, Fullscreen */}
            <View style={styles.bottomControlBar}>
              <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>

              <TouchableOpacity style={styles.controlIconBtn} onPress={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize size={18} color="#fff" />
                ) : (
                  <Maximize size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* ================= NON-FULLSCREEN CONTENT: EPISODES ================= */}
      {!isFullscreen && (
        <ScrollView style={styles.scrollInfo} showsVerticalScrollIndicator={false}>
          {/* Episode Info Banner */}
          <View style={styles.nowPlayingBox}>
            <View>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                {anime?.title || anime?.nom}
              </Text>
              <Text style={styles.nowPlayingEp}>
                Hozir ijro etilmoqda: <Text style={{ color: colors.primaryGlow }}>{currentEpNum}-qism</Text>
              </Text>
            </View>
          </View>

          {/* Episodes List Section */}
          <View style={styles.episodesListSection}>
            <View style={styles.epHeaderRow}>
              <Text style={styles.episodesListHeading}>Qismlar ({episodes.length})</Text>

              {episodes.length > 0 && (
                <View style={styles.epControls}>
                  <TouchableOpacity
                    style={styles.epSortBtn}
                    onPress={() => {
                      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                      setActiveRangeIndex(0);
                    }}
                    activeOpacity={0.7}
                  >
                    <ArrowUpDown size={12} color={colors.primaryGlow} />
                    <Text style={styles.epSortText}>
                      {sortOrder === 'asc' ? `1 ➔ ${episodes.length}` : `${episodes.length} ➔ 1`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.epViewToggle}
                    onPress={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                    activeOpacity={0.7}
                  >
                    {viewMode === 'grid' ? (
                      <LayoutList size={15} color={colors.text} />
                    ) : (
                      <LayoutGrid size={15} color={colors.text} />
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
                      key={`p-range-${idx}`}
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

            {/* View Modes */}
            {viewMode === 'grid' ? (
              <View style={styles.epGridWrap}>
                {displayedEpisodes.map((ep, idx) => {
                  const epNum = parseInt(ep.qism || ep.episode_number || idx + 1, 10);
                  const isActive = epNum === currentEpNum;
                  return (
                    <TouchableOpacity
                      key={`p-ep-g-${ep.id || idx}`}
                      style={[styles.epGridBox, isActive && styles.epGridBoxActive]}
                      activeOpacity={0.75}
                      onPress={() => changeEpisode(epNum)}
                    >
                      {isActive ? (
                        <Play size={12} color="#fff" fill="#fff" />
                      ) : (
                        <Text style={[styles.epGridNum, isActive && styles.epGridNumActive]}>
                          {epNum}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.epList}>
                {displayedEpisodes.map((ep, idx) => {
                  const epNum = parseInt(ep.qism || ep.episode_number || idx + 1, 10);
                  const isActive = epNum === currentEpNum;
                  return (
                    <TouchableOpacity
                      key={`p-ep-l-${ep.id || idx}`}
                      style={[styles.epItem, isActive && styles.epItemActive]}
                      onPress={() => changeEpisode(epNum)}
                    >
                      <View style={[styles.epBadge, isActive && styles.epBadgeActive]}>
                        {isActive ? (
                          <Play size={12} color="#fff" fill="#fff" />
                        ) : (
                          <Text style={styles.epBadgeText}>{epNum}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.epItemTitle, isActive && styles.epItemTitleActive]}>
                          {epNum}-qism {ep.title && ep.title !== `${epNum}-qism` ? `- ${ep.title}` : ''}
                        </Text>
                        <Text style={styles.epItemMeta}>DarkMora Dublyaj</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fullscreenContainer: {
    backgroundColor: '#000',
  },
  playerBox: {
    width: '100%',
    height: 240,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPlayerBox: {
    width: '100%',
    height: '100%',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    padding: 12,
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayAnimeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  overlayEpTitle: {
    color: colors.primaryGlow,
    fontSize: 12,
    fontWeight: '600',
  },
  middleControlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
  },
  controlIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  seekBadgeText: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
  playPauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryGlow,
  },
  scrollInfo: {
    flex: 1,
    padding: 16,
  },
  nowPlayingBox: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 20,
  },
  nowPlayingTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  nowPlayingEp: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  episodesListSection: {
    paddingBottom: 40,
  },
  epHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  episodesListHeading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  epControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  epSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  epSortText: {
    color: colors.primaryGlow,
    fontSize: 11,
    fontWeight: '700',
  },
  epViewToggle: {
    width: 30,
    height: 30,
    borderRadius: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
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
    fontSize: 11,
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
  },
  epGridBox: {
    width: (SCREEN_WIDTH - 32 - 32) / 5,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  epGridBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryGlow,
  },
  epGridNum: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  epGridNumActive: {
    color: '#fff',
    fontWeight: '800',
  },
  epList: {
    gap: 8,
  },
  epItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  epItemActive: {
    borderColor: colors.primaryGlow,
    backgroundColor: 'rgba(29, 104, 246, 0.1)',
  },
  epBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  epBadgeActive: {
    backgroundColor: colors.primary,
  },
  epBadgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  epItemTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  epItemTitleActive: {
    color: colors.primaryGlow,
  },
  epItemMeta: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
});

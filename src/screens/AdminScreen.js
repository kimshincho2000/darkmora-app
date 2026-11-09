import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  ChevronLeft,
  BarChart2,
  Film,
  Layers,
  Inbox,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  RefreshCw,
  LogOut,
  Users,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  ArrowUpRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api, toAbsoluteUrl } from '../api/client';

export default function AdminScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | animes | episodes | requests | settings

  // Dashboard state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Animes state
  const [animes, setAnimes] = useState([]);
  const [animesLoading, setAnimesLoading] = useState(false);
  const [animeSearch, setAnimeSearch] = useState('');
  const [animePage, setAnimePage] = useState(1);
  const [animeTotal, setAnimeTotal] = useState(0);

  // Anime Modal (Add/Edit)
  const [animeModalVisible, setAnimeModalVisible] = useState(false);
  const [savingAnime, setSavingAnime] = useState(false);
  const [animeForm, setAnimeForm] = useState({
    id: 0,
    nom: '',
    slug: '',
    image_url: '',
    rams: '',
    yili: new Date().getFullYear().toString(),
    janri: 'Anime, Sarguzasht',
    hashteg: '',
    davlat: 'Yaponiya',
    tili: "O'zbek tilida",
    status: 0,
    turi: 'TV serial',
    aniType: 'free',
  });

  // Episodes state
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [animePickerVisible, setAnimePickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerAnimes, setPickerAnimes] = useState([]);

  // Episode Modal (Add/Edit)
  const [episodeModalVisible, setEpisodeModalVisible] = useState(false);
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [episodeForm, setEpisodeForm] = useState({
    data_id: 0,
    anime_id: 0,
    qism: '1',
    sarlavha: '',
    video_url: '',
    storage_msg_id: '',
    fasl: '1',
    is_premium: false,
    op_start: '',
    op_end: '',
    ed_start: '',
    ed_end: '',
  });

  // Requests state
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestStatus, setRequestStatus] = useState('pending');
  const [requestNote, setRequestNote] = useState('');
  const [savingRequest, setSavingRequest] = useState(false);

  // Settings state
  const [siteConfig, setSiteConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // ================= LOADERS =================

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.adminStats();
      if (res?.ok && res?.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.warn('loadStats error:', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadAnimes = useCallback(async (page = 1, search = '') => {
    try {
      setAnimesLoading(true);
      const res = await api.adminGetAnimes(page, search);
      if (res?.ok && res?.data) {
        setAnimes(res.data.items || []);
        setAnimeTotal(res.data.total || 0);
        setAnimePage(res.data.page || 1);
      }
    } catch (e) {
      console.warn('loadAnimes error:', e);
    } finally {
      setAnimesLoading(false);
    }
  }, []);

  const loadEpisodesForAnime = useCallback(async (animeId) => {
    if (!animeId) return;
    try {
      setEpisodesLoading(true);
      const res = await api.adminGetAnimeDetail(animeId);
      if (res?.ok && res?.data) {
        setSelectedAnime(res.data.anime);
        setEpisodes(res.data.episodes || []);
      }
    } catch (e) {
      console.warn('loadEpisodes error:', e);
    } finally {
      setEpisodesLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async (filter = 'all') => {
    try {
      setRequestsLoading(true);
      const res = await api.adminGetRequests(filter);
      if (res?.ok && res?.data) {
        setRequests(res.data.requests || []);
      }
    } catch (e) {
      console.warn('loadRequests error:', e);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const res = await api.getConfig();
      if (res?.ok && res?.config) {
        setSiteConfig(res.config);
      }
    } catch (e) {
      console.warn('loadConfig error:', e);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadStats();
    if (activeTab === 'animes') loadAnimes(1, animeSearch);
    if (activeTab === 'episodes' && selectedAnime) loadEpisodesForAnime(selectedAnime.id);
    if (activeTab === 'requests') loadRequests(requestFilter);
    if (activeTab === 'settings') loadConfig();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'dashboard') await loadStats();
    else if (activeTab === 'animes') await loadAnimes(animePage, animeSearch);
    else if (activeTab === 'episodes' && selectedAnime) await loadEpisodesForAnime(selectedAnime.id);
    else if (activeTab === 'requests') await loadRequests(requestFilter);
    else if (activeTab === 'settings') await loadConfig();
    setRefreshing(false);
  };

  // ================= ACTIONS: ANIMES =================

  const handleOpenAddAnime = () => {
    setAnimeForm({
      id: 0,
      nom: '',
      slug: '',
      image_url: '',
      rams: '',
      yili: new Date().getFullYear().toString(),
      janri: 'Anime, Sarguzasht',
      hashteg: '',
      davlat: 'Yaponiya',
      tili: "O'zbek tilida",
      status: 0,
      turi: 'TV serial',
      aniType: 'free',
    });
    setAnimeModalVisible(true);
  };

  const handleOpenEditAnime = (item) => {
    setAnimeForm({
      id: item.id,
      nom: item.title || item.nom || '',
      slug: item.slug || '',
      image_url: item.raw_image || item.image_url || '',
      rams: item.rams || '',
      yili: String(item.year || item.yili || new Date().getFullYear()),
      janri: item.genres || item.janri || '',
      hashteg: item.hashteg || item.description || '',
      davlat: item.country || item.davlat || 'Yaponiya',
      tili: item.lang || item.tili || "O'zbek tilida",
      status: Number(item.status || 0),
      turi: item.turi || 'TV serial',
      aniType: item.aniType || 'free',
    });
    setAnimeModalVisible(true);
  };

  const handleSaveAnime = async () => {
    if (!animeForm.nom.trim()) {
      Alert.alert('Xatolik', 'Anime nomini kiritish shart!');
      return;
    }
    setSavingAnime(true);
    try {
      const res = await api.adminSaveAnime(animeForm);
      if (res?.ok) {
        Alert.alert('Muvaffaqiyatli', animeForm.id ? 'Anime yangilandi' : 'Anime qo\'shildi');
        setAnimeModalVisible(false);
        loadAnimes(animePage, animeSearch);
      } else {
        Alert.alert('Xato', res?.error || 'Saqlashda xatolik yuz berdi');
      }
    } catch (e) {
      Alert.alert('Xato', e.message || 'Server bilan bog\'lanishda xato');
    } finally {
      setSavingAnime(false);
    }
  };

  const handleDeleteAnime = (item) => {
    Alert.alert(
      'O\'chirishni tasdiqlang',
      `"${item.title || item.nom}" animesi va uning barcha qismlari o'chiriladi. Rozimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.adminDeleteAnime(item.id);
              if (res?.ok) {
                Alert.alert('O\'chirildi', 'Anime muvaffaqiyatli o\'chirildi');
                loadAnimes(animePage, animeSearch);
              } else {
                Alert.alert('Xato', res?.error || 'O\'chirishda xatolik');
              }
            } catch (e) {
              Alert.alert('Xato', e.message);
            }
          },
        },
      ]
    );
  };

  // ================= ACTIONS: EPISODES =================

  const handleOpenAddEpisode = () => {
    if (!selectedAnime) return;
    const nextQism = episodes.length > 0 ? (Math.max(...episodes.map(e => parseInt(e.qism) || 0)) + 1).toString() : '1';
    setEpisodeForm({
      data_id: 0,
      anime_id: selectedAnime.id,
      qism: nextQism,
      sarlavha: `${nextQism}-qism`,
      video_url: '',
      storage_msg_id: '',
      fasl: '1',
      is_premium: false,
      op_start: '',
      op_end: '',
      ed_start: '',
      ed_end: '',
    });
    setEpisodeModalVisible(true);
  };

  const handleOpenEditEpisode = (ep) => {
    setEpisodeForm({
      data_id: ep.data_id,
      anime_id: selectedAnime.id,
      qism: String(ep.qism || 1),
      sarlavha: ep.sarlavha || `${ep.qism}-qism`,
      video_url: ep.video_url || '',
      storage_msg_id: ep.storage_msg_id ? String(ep.storage_msg_id) : '',
      fasl: String(ep.fasl || 1),
      is_premium: Boolean(ep.is_premium),
      op_start: ep.op_start !== null && ep.op_start !== undefined ? String(ep.op_start) : '',
      op_end: ep.op_end !== null && ep.op_end !== undefined ? String(ep.op_end) : '',
      ed_start: ep.ed_start !== null && ep.ed_start !== undefined ? String(ep.ed_start) : '',
      ed_end: ep.ed_end !== null && ep.ed_end !== undefined ? String(ep.ed_end) : '',
    });
    setEpisodeModalVisible(true);
  };

  const handleSaveEpisode = async () => {
    if (!selectedAnime) return;
    setSavingEpisode(true);
    try {
      const payload = {
        data_id: episodeForm.data_id,
        anime_id: selectedAnime.id,
        qism: parseInt(episodeForm.qism) || 1,
        sarlavha: episodeForm.sarlavha.trim() || `${episodeForm.qism}-qism`,
        video_url: episodeForm.video_url.trim(),
        storage_msg_id: parseInt(episodeForm.storage_msg_id) || 0,
        fasl: parseInt(episodeForm.fasl) || 1,
        is_premium: episodeForm.is_premium ? 1 : 0,
        op_start: episodeForm.op_start ? parseFloat(episodeForm.op_start) : null,
        op_end: episodeForm.op_end ? parseFloat(episodeForm.op_end) : null,
        ed_start: episodeForm.ed_start ? parseFloat(episodeForm.ed_start) : null,
        ed_end: episodeForm.ed_end ? parseFloat(episodeForm.ed_end) : null,
      };

      const res = await api.adminSaveEpisode(payload);
      if (res?.ok) {
        Alert.alert('Muvaffaqiyatli', 'Qism muvaffaqiyatli saqlandi');
        setEpisodeModalVisible(false);
        loadEpisodesForAnime(selectedAnime.id);
      } else {
        Alert.alert('Xato', res?.error || 'Saqlashda xato');
      }
    } catch (e) {
      Alert.alert('Xato', e.message);
    } finally {
      setSavingEpisode(false);
    }
  };

  const handleDeleteEpisode = (ep) => {
    Alert.alert(
      'Qismni o\'chirish',
      `${ep.qism}-qismni o'chirmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.adminDeleteEpisode(ep.data_id);
              if (res?.ok) {
                Alert.alert('O\'chirildi', 'Qism o\'chirildi');
                loadEpisodesForAnime(selectedAnime.id);
              } else {
                Alert.alert('Xato', res?.error || 'O\'chirishda xato');
              }
            } catch (e) {
              Alert.alert('Xato', e.message);
            }
          },
        },
      ]
    );
  };

  // ================= ACTIONS: REQUESTS =================

  const handleOpenRequest = (req) => {
    setSelectedRequest(req);
    setRequestStatus(req.status || 'pending');
    setRequestNote(req.admin_note || '');
    setRequestModalVisible(true);
  };

  const handleSaveRequest = async () => {
    if (!selectedRequest) return;
    setSavingRequest(true);
    try {
      const res = await api.adminUpdateRequest(selectedRequest.id, requestStatus, requestNote);
      if (res?.ok) {
        Alert.alert('Muvaffaqiyatli', 'So\'rov yangilandi');
        setRequestModalVisible(false);
        loadRequests(requestFilter);
      } else {
        Alert.alert('Xato', res?.error || 'Yangilashda xato');
      }
    } catch (e) {
      Alert.alert('Xato', e.message);
    } finally {
      setSavingRequest(false);
    }
  };

  // ================= ACTIONS: SETTINGS =================

  const handleClearCache = async () => {
    Alert.alert('Keshni tozalash', 'Server keshini tozalashni xohlaysizmi?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'Tozalash',
        onPress: async () => {
          try {
            const res = await api.adminClearCache();
            if (res?.ok) {
              Alert.alert('Muvaffaqiyatli', res.message || 'Kesh tozalandi');
            } else {
              Alert.alert('Xato', res?.error || 'Keshni tozalashda xatolik');
            }
          } catch (e) {
            Alert.alert('Xato', e.message);
          }
        },
      },
    ]);
  };

  const handleSaveConfig = async () => {
    if (!siteConfig) return;
    setSavingConfig(true);
    try {
      const res = await api.saveConfig(siteConfig);
      if (res?.ok) {
        Alert.alert('Muvaffaqiyatli', 'Sozlamalar saqlandi');
      } else {
        Alert.alert('Xato', res?.error || 'Saqlashda xato');
      }
    } catch (e) {
      Alert.alert('Xato', e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // ================= RENDER TABS =================

  const renderDashboardTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryGlow} />}
    >
      {statsLoading && !stats ? (
        <ActivityIndicator size="large" color={colors.primaryGlow} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Film size={22} color="#38bdf8" />
              </View>
              <Text style={styles.kpiValue}>{stats?.total_anime ?? '-'}</Text>
              <Text style={styles.kpiLabel}>Animelar</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Layers size={22} color="#a855f7" />
              </View>
              <Text style={styles.kpiValue}>{stats?.total_episodes ?? '-'}</Text>
              <Text style={styles.kpiLabel}>Qismlar</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Users size={22} color="#22c55e" />
              </View>
              <Text style={styles.kpiValue}>{stats?.total_users ?? '-'}</Text>
              <Text style={styles.kpiLabel}>A'zolar</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Eye size={22} color="#eab308" />
              </View>
              <Text style={styles.kpiValue}>{Number(stats?.total_views || 0).toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Ko'rishlar</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Inbox size={22} color="#ef4444" />
              </View>
              <Text style={styles.kpiValue}>{stats?.requests_pending ?? 0}</Text>
              <Text style={styles.kpiLabel}>Kutilayotgan so'rovlar</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                <Clock size={22} color="#0ea5e9" />
              </View>
              <Text style={styles.kpiValue}>{stats?.online_users ?? 1}</Text>
              <Text style={styles.kpiLabel}>Onlayn</Text>
            </View>
          </View>

          {/* Server Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Database size={18} color={colors.primaryGlow} />
              <Text style={styles.infoCardTitle}>Server va Xotira</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Konteyner RAM Limiti:</Text>
              <Text style={styles.infoVal}>4096 MB (4 GB)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Band Xotira:</Text>
              <Text style={styles.infoVal}>
                {stats?.memory?.used_mb ? `${stats.memory.used_mb} MB (${stats.memory.used_pct}%)` : 'Normal'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Tizim versiyasi:</Text>
              <Text style={styles.infoVal}>{stats?.version || '2.2-py-shield'}</Text>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionsWrap}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(29, 104, 246, 0.2)', borderColor: colors.primaryGlow }]}
              onPress={handleClearCache}
            >
              <RefreshCw size={18} color={colors.primaryGlow} />
              <Text style={[styles.actionBtnText, { color: colors.primaryGlow }]}>Server Keshini Tozalash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}
              onPress={loadStats}
            >
              <RefreshCw size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Statistikani Yangilash</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderAnimesTab = () => (
    <View style={styles.tabContent}>
      {/* Search & Add bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color={colors.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Anime qidirish..."
            placeholderTextColor={colors.textDim}
            value={animeSearch}
            onChangeText={(text) => {
              setAnimeSearch(text);
              loadAnimes(1, text);
            }}
          />
          {animeSearch.length > 0 && (
            <TouchableOpacity onPress={() => { setAnimeSearch(''); loadAnimes(1, ''); }}>
              <X size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddAnime}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={animes}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryGlow} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={() => (
          animesLoading ? (
            <ActivityIndicator size="large" color={colors.primaryGlow} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>Anime topilmadi</Text>
          )
        )}
        renderItem={({ item }) => (
          <View style={styles.animeItemCard}>
            <Image
              source={{ uri: toAbsoluteUrl(item.poster || item.raw_image) }}
              style={styles.animeItemPoster}
            />
            <View style={styles.animeItemInfo}>
              <Text style={styles.animeItemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.animeItemMeta}>
                {item.year} • {item.genres || 'Anime'}
              </Text>
              <View style={styles.animeItemBadges}>
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>{item.ep_count || 0} qism</Text>
                </View>
                <View style={[styles.badgeWrap, { backgroundColor: item.status === 1 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)' }]}>
                  <Text style={[styles.badgeText, { color: item.status === 1 ? '#4ade80' : '#facc15' }]}>
                    {item.status === 1 ? 'Tugallangan' : 'Davom etmoqda'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.animeItemActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  setSelectedAnime({ id: item.id, nom: item.title });
                  setActiveTab('episodes');
                  loadEpisodesForAnime(item.id);
                }}
              >
                <Layers size={18} color={colors.primaryGlow} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleOpenEditAnime(item)}
              >
                <Edit2 size={18} color="#38bdf8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleDeleteAnime(item)}
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );

  const renderEpisodesTab = () => (
    <View style={styles.tabContent}>
      {/* Anime Selection Card */}
      <TouchableOpacity
        style={styles.animeSelectCard}
        onPress={() => {
          setPickerSearch('');
          setPickerAnimes(animes.length > 0 ? animes : []);
          setAnimePickerVisible(true);
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.animeSelectLabel}>Tanlangan Anime:</Text>
          <Text style={styles.animeSelectTitle} numberOfLines={1}>
            {selectedAnime ? selectedAnime.nom || selectedAnime.title : 'Anime tanlang...'}
          </Text>
        </View>
        <ArrowUpRight size={20} color={colors.primaryGlow} />
      </TouchableOpacity>

      {selectedAnime && (
        <View style={styles.episodeHeaderRow}>
          <Text style={styles.episodeListTitle}>
            Qismlar ({episodes.length})
          </Text>
          <TouchableOpacity style={styles.addEpBtn} onPress={handleOpenAddEpisode}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addEpBtnText}>Qism qo'shish</Text>
          </TouchableOpacity>
        </View>
      )}

      {episodesLoading ? (
        <ActivityIndicator size="large" color={colors.primaryGlow} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => String(item.data_id || item.qism)}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>
              {selectedAnime ? 'Hozircha hech qanday qism qo\'shilmagan' : 'Avval animeni tanlang'}
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.epCard}>
              <View style={styles.epNumWrap}>
                <Text style={styles.epNumText}>{item.qism}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.epTitle}>{item.sarlavha || `${item.qism}-qism`}</Text>
                <Text style={styles.epSub} numberOfLines={1}>
                  {item.storage_msg_id ? `Msg ID: ${item.storage_msg_id}` : (item.video_url || 'Video yo\'q')}
                </Text>
                {(item.op_start !== null && item.op_start !== undefined) && (
                  <Text style={styles.epMeta}>
                    OP: {item.op_start}s - {item.op_end}s
                  </Text>
                )}
              </View>
              <View style={styles.epActionRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenEditEpisode(item)}>
                  <Edit2 size={16} color="#38bdf8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteEpisode(item)}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderRequestsTab = () => (
    <View style={styles.tabContent}>
      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {['all', 'pending', 'approved', 'rejected'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, requestFilter === st && styles.filterChipActive]}
            onPress={() => {
              setRequestFilter(st);
              loadRequests(st);
            }}
          >
            <Text style={[styles.filterChipText, requestFilter === st && styles.filterChipTextActive]}>
              {st === 'all' ? 'Barchasi' : st === 'pending' ? 'Kutilmoqda' : st === 'approved' ? 'Qabul' : 'Rad'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryGlow} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={() => (
          requestsLoading ? (
            <ActivityIndicator size="large" color={colors.primaryGlow} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.emptyText}>So'rovlar topilmadi</Text>
          )
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.requestCard} onPress={() => handleOpenRequest(item)}>
            <View style={styles.requestCardHeader}>
              <Text style={styles.requestTitle} numberOfLines={1}>{item.title || 'So\'rov'}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 'approved'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : item.status === 'rejected'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(234, 179, 8, 0.2)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        item.status === 'approved'
                          ? '#4ade80'
                          : item.status === 'rejected'
                          ? '#ef4444'
                          : '#facc15',
                    },
                  ]}
                >
                  {item.status === 'approved' ? 'Qabul qilindi' : item.status === 'rejected' ? 'Rad etildi' : 'Kutilmoqda'}
                </Text>
              </View>
            </View>

            {item.details ? <Text style={styles.requestDetails}>{item.details}</Text> : null}
            <View style={styles.requestFooter}>
              <Text style={styles.requestContact}>{item.contact || 'Aloqa yo\'q'}</Text>
              <Text style={styles.requestDate}>{item.created_at}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderSettingsTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryGlow} />}
    >
      {configLoading && !siteConfig ? (
        <ActivityIndicator size="large" color={colors.primaryGlow} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Sayt va Server</Text>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Texnik tanaffus (Maintenance)</Text>
                <Text style={styles.settingSub}>Saytni vaqtincha yopish rejimi</Text>
              </View>
              <Switch
                value={Boolean(siteConfig?.maintenance)}
                onValueChange={(val) => setSiteConfig(prev => ({ ...prev, maintenance: val }))}
                trackColor={{ false: '#334155', true: colors.primaryGlow }}
              />
            </View>

            <TouchableOpacity style={styles.settingBtn} onPress={handleClearCache}>
              <RefreshCw size={18} color="#38bdf8" />
              <Text style={[styles.settingBtnText, { color: '#38bdf8' }]}>Keshni tozalash</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Ilova Yangilanishi va Auditoriya</Text>
            <Text style={styles.sectionSubtitle}>
              Yangilanish xabarini kimlarga yuborishni tanlang:
            </Text>

            {/* Target Selector */}
            <View style={styles.targetOptionGroup}>
              {[
                { key: 'all', title: '🌐 Hammaga', desc: 'Barcha foydalanuvchilar yangilanish oladi' },
                { key: 'admins_only', title: '👑 Faqat Adminlarga', desc: 'Faqat admin hisoblariga yangilanish ko\'rsatiladi (Beta)' },
                { key: 'specific_user', title: '👤 Faqat bitta foydalanuvchiga', desc: 'Faqat ko\'rsatilgan user yangilanish oladi' },
              ].map(opt => {
                const isSelected = (siteConfig?.update_target || 'all') === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.targetOptionCard, isSelected && styles.targetOptionCardActive]}
                    onPress={() => setSiteConfig(prev => ({ ...prev, update_target: opt.key }))}
                    activeOpacity={0.7}
                  >
                    <View style={styles.targetOptionRadio}>
                      {isSelected && <View style={styles.targetOptionRadioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.targetOptionTitle, isSelected && styles.targetOptionTitleActive]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.targetOptionDesc}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Specific User Input */}
            {(siteConfig?.update_target === 'specific_user') && (
              <View style={[styles.inputGroup, { marginTop: 8 }]}>
                <Text style={styles.inputLabel}>
                  Foydalanuvchi Username yoki ID raqami *
                </Text>
                <TextInput
                  style={[styles.textInput, { borderColor: '#38bdf8' }]}
                  value={siteConfig?.update_target_user || ''}
                  onChangeText={(text) => setSiteConfig(prev => ({ ...prev, update_target_user: text }))}
                  placeholder="Masalan: fors yoki 123 yoki email"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>Eng so'nggi versiya (latest_version)</Text>
              <TextInput
                style={styles.textInput}
                value={siteConfig?.latest_version || ''}
                onChangeText={(text) => setSiteConfig(prev => ({ ...prev, latest_version: text }))}
                placeholder="1.0.6"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Yangilanish APK havolasi (update_url)</Text>
              <TextInput
                style={styles.textInput}
                value={siteConfig?.update_url || ''}
                onChangeText={(text) => setSiteConfig(prev => ({ ...prev, update_url: text }))}
                placeholder="https://darkmora.uz/uploads/DarkMora.apk?v=1.0.6"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Majburiy yangilanish (force_update)</Text>
                <Text style={styles.settingSub}>Foydalanuvchi yangilamasdan ilovadan foydalana olmaydi</Text>
              </View>
              <Switch
                value={Boolean(siteConfig?.force_update)}
                onValueChange={(val) => setSiteConfig(prev => ({ ...prev, force_update: val }))}
                trackColor={{ false: '#334155', true: '#ef4444' }}
              />
            </View>

            <TouchableOpacity
              style={styles.saveConfigBtn}
              onPress={handleSaveConfig}
              disabled={savingConfig}
            >
              {savingConfig ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveConfigBtnText}>Sozlamalarni Saqlash</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0e14" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>👑 {user?.username || 'fors'} (Administrator)</Text>
        </View>
        <TouchableOpacity
          style={styles.headerLogoutBtn}
          onPress={() => {
            Alert.alert('Chiqish', 'Admin paneldan chiqmoqchimisiz?', [
              { text: 'Bekor qilish', style: 'cancel' },
              {
                text: 'Chiqish',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  navigation.navigate('Main');
                },
              },
            ]);
          }}
        >
          <LogOut size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <BarChart2 size={16} color={activeTab === 'dashboard' ? colors.primaryGlow : colors.textDim} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>Statistika</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'animes' && styles.tabItemActive]}
          onPress={() => setActiveTab('animes')}
        >
          <Film size={16} color={activeTab === 'animes' ? colors.primaryGlow : colors.textDim} />
          <Text style={[styles.tabText, activeTab === 'animes' && styles.tabTextActive]}>Animelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'episodes' && styles.tabItemActive]}
          onPress={() => setActiveTab('episodes')}
        >
          <Layers size={16} color={activeTab === 'episodes' ? colors.primaryGlow : colors.textDim} />
          <Text style={[styles.tabText, activeTab === 'episodes' && styles.tabTextActive]}>Qismlar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Inbox size={16} color={activeTab === 'requests' ? colors.primaryGlow : colors.textDim} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>So'rovlar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Settings size={16} color={activeTab === 'settings' ? colors.primaryGlow : colors.textDim} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>Sozlama</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'animes' && renderAnimesTab()}
        {activeTab === 'episodes' && renderEpisodesTab()}
        {activeTab === 'requests' && renderRequestsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </View>

      {/* ================= MODAL: ANIME ADD / EDIT ================= */}
      <Modal visible={animeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {animeForm.id ? 'Animeni Tahrirlash' : 'Yangi Anime Qo\'shish'}
              </Text>
              <TouchableOpacity onPress={() => setAnimeModalVisible(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Anime Nomi *</Text>
                <TextInput
                  style={styles.textInput}
                  value={animeForm.nom}
                  onChangeText={(v) => setAnimeForm(prev => ({ ...prev, nom: v }))}
                  placeholder="Masalan: Solo Leveling"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rasm URL (Poster)</Text>
                <TextInput
                  style={styles.textInput}
                  value={animeForm.image_url}
                  onChangeText={(v) => setAnimeForm(prev => ({ ...prev, image_url: v }))}
                  placeholder="https://... yoki uploads/..."
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Yili</Text>
                  <TextInput
                    style={styles.textInput}
                    value={animeForm.yili}
                    onChangeText={(v) => setAnimeForm(prev => ({ ...prev, yili: v }))}
                    placeholder="2024"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Turi</Text>
                  <TextInput
                    style={styles.textInput}
                    value={animeForm.turi}
                    onChangeText={(v) => setAnimeForm(prev => ({ ...prev, turi: v }))}
                    placeholder="TV serial"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Janrlari</Text>
                <TextInput
                  style={styles.textInput}
                  value={animeForm.janri}
                  onChangeText={(v) => setAnimeForm(prev => ({ ...prev, janri: v }))}
                  placeholder="Ekshn, Sarguzasht, Fantastika"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Tili</Text>
                  <TextInput
                    style={styles.textInput}
                    value={animeForm.tili}
                    onChangeText={(v) => setAnimeForm(prev => ({ ...prev, tili: v }))}
                    placeholder="O'zbek tilida"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Holati</Text>
                  <View style={styles.statusPickRow}>
                    <TouchableOpacity
                      style={[styles.statusPickBtn, animeForm.status === 0 && styles.statusPickBtnActive]}
                      onPress={() => setAnimeForm(p => ({ ...p, status: 0 }))}
                    >
                      <Text style={[styles.statusPickText, animeForm.status === 0 && styles.statusPickTextActive]}>Davom</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusPickBtn, animeForm.status === 1 && styles.statusPickBtnActive]}
                      onPress={() => setAnimeForm(p => ({ ...p, status: 1 }))}
                    >
                      <Text style={[styles.statusPickText, animeForm.status === 1 && styles.statusPickTextActive]}>Tugagan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tavsif (Description)</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  value={animeForm.hashteg}
                  onChangeText={(v) => setAnimeForm(prev => ({ ...prev, hashteg: v }))}
                  placeholder="Anime haqida qisqacha ma'lumot..."
                  placeholderTextColor={colors.textDim}
                  multiline
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveAnime}
              disabled={savingAnime}
            >
              {savingAnime ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Saqlash</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: EPISODE ADD / EDIT ================= */}
      <Modal visible={episodeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {episodeForm.data_id ? 'Qismni Tahrirlash' : 'Yangi Qism Qo\'shish'}
              </Text>
              <TouchableOpacity onPress={() => setEpisodeModalVisible(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Qism raqami *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={episodeForm.qism}
                    onChangeText={(v) => setEpisodeForm(prev => ({ ...prev, qism: v }))}
                    placeholder="1"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Fasl (Season)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={episodeForm.fasl}
                    onChangeText={(v) => setEpisodeForm(prev => ({ ...prev, fasl: v }))}
                    placeholder="1"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sarlavha</Text>
                <TextInput
                  style={styles.textInput}
                  value={episodeForm.sarlavha}
                  onChangeText={(v) => setEpisodeForm(prev => ({ ...prev, sarlavha: v }))}
                  placeholder="1-qism: Boshlanish"
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Video URL (HLS / MP4 stream)</Text>
                <TextInput
                  style={styles.textInput}
                  value={episodeForm.video_url}
                  onChangeText={(v) => setEpisodeForm(prev => ({ ...prev, video_url: v }))}
                  placeholder="https://... yoki /stream?id=..."
                  placeholderTextColor={colors.textDim}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telegram Storage Msg ID (ixtiyoriy)</Text>
                <TextInput
                  style={styles.textInput}
                  value={episodeForm.storage_msg_id}
                  onChangeText={(v) => setEpisodeForm(prev => ({ ...prev, storage_msg_id: v }))}
                  placeholder="12345"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                />
              </View>

              {/* Opening Skip Times */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>OP boshlanishi (sek)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={episodeForm.op_start}
                    onChangeText={(v) => setEpisodeForm(prev => ({ ...prev, op_start: v }))}
                    placeholder="Masalan: 90"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>OP tugashi (sek)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={episodeForm.op_end}
                    onChangeText={(v) => setEpisodeForm(prev => ({ ...prev, op_end: v }))}
                    placeholder="Masalan: 180"
                    placeholderTextColor={colors.textDim}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveEpisode}
              disabled={savingEpisode}
            >
              {savingEpisode ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Saqlash</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: ANIME PICKER FOR EPISODES ================= */}
      <Modal visible={animePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Anime Tanlang</Text>
              <TouchableOpacity onPress={() => setAnimePickerVisible(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputWrap}>
              <Search size={18} color={colors.textDim} />
              <TextInput
                style={styles.searchInput}
                placeholder="Qidirish..."
                placeholderTextColor={colors.textDim}
                value={pickerSearch}
                onChangeText={async (text) => {
                  setPickerSearch(text);
                  const res = await api.adminGetAnimes(1, text);
                  if (res?.ok && res?.data?.items) {
                    setPickerAnimes(res.data.items);
                  }
                }}
              />
            </View>

            <FlatList
              data={pickerAnimes}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 350, marginTop: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedAnime({ id: item.id, nom: item.title });
                    setAnimePickerVisible(false);
                    loadEpisodesForAnime(item.id);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.title}</Text>
                  <Text style={styles.pickerItemSub}>{item.ep_count || 0} qism</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: REQUEST STATUS UPDATE ================= */}
      <Modal visible={requestModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>So'rov Holati</Text>
              <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.requestModalSub}>{selectedRequest?.title}</Text>

            <View style={styles.statusChoiceRow}>
              {[
                { key: 'pending', label: 'Kutilmoqda', color: '#facc15' },
                { key: 'approved', label: 'Qabul qilindi', color: '#4ade80' },
                { key: 'rejected', label: 'Rad etildi', color: '#ef4444' },
              ].map(st => (
                <TouchableOpacity
                  key={st.key}
                  style={[
                    styles.statusChoiceBtn,
                    requestStatus === st.key && { borderColor: st.color, backgroundColor: 'rgba(255,255,255,0.06)' },
                  ]}
                  onPress={() => setRequestStatus(st.key)}
                >
                  <Text style={[styles.statusChoiceText, requestStatus === st.key && { color: st.color, fontWeight: '700' }]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin izohi (ixtiyoriy)</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                value={requestNote}
                onChangeText={setRequestNote}
                placeholder="Foydalanuvchi yoki admin uchun eslatma..."
                placeholderTextColor={colors.textDim}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveRequest}
              disabled={savingRequest}
            >
              {savingRequest ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Holatni Yangilash</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0e14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0b0e14',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: colors.primaryGlow,
    marginTop: 2,
    fontWeight: '600',
  },
  headerLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabItemActive: {
    borderBottomColor: colors.primaryGlow,
    backgroundColor: 'rgba(29, 104, 246, 0.08)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDim,
  },
  tabTextActive: {
    color: colors.primaryGlow,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  kpiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },

  // Server Info Card
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  infoKey: {
    fontSize: 12,
    color: colors.textDim,
  },
  infoVal: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  // Quick Action Buttons
  quickActionsWrap: {
    gap: 10,
    marginBottom: 40,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Search & Add Bar
  searchBarRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Anime Item Card
  animeItemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  animeItemPoster: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  animeItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  animeItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  animeItemMeta: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  animeItemBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badgeWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  animeItemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Anime Selector in Episodes Tab
  animeSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 104, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(29, 104, 246, 0.3)',
    padding: 14,
    marginBottom: 16,
  },
  animeSelectLabel: {
    fontSize: 11,
    color: colors.primaryGlow,
    fontWeight: '600',
  },
  animeSelectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  episodeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  episodeListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  addEpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addEpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Episode Card
  epCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    marginBottom: 8,
  },
  epNumWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  epNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  epTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  epSub: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  epMeta: {
    fontSize: 10,
    color: colors.primaryGlow,
    marginTop: 2,
  },
  epActionRow: {
    flexDirection: 'row',
    gap: 6,
  },

  // Requests Tab
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primaryGlow,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.textDim,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 10,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestDetails: {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 8,
    lineHeight: 18,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  requestContact: {
    fontSize: 11,
    color: colors.primaryGlow,
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 10,
    color: colors.textDim,
  },

  // Settings Tab
  settingsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  settingSub: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  settingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  settingBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 12,
  },
  targetOptionGroup: {
    gap: 8,
    marginBottom: 12,
  },
  targetOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  targetOptionCardActive: {
    borderColor: colors.primaryGlow,
    backgroundColor: 'rgba(29, 104, 246, 0.12)',
  },
  targetOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryGlow,
  },
  targetOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  targetOptionTitleActive: {
    color: colors.primaryGlow,
  },
  targetOptionDesc: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  saveConfigBtn: {
    backgroundColor: colors.primaryGlow,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveConfigBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Modals common
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#121824',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  statusPickRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusPickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  statusPickBtnActive: {
    backgroundColor: 'rgba(29, 104, 246, 0.2)',
    borderColor: colors.primaryGlow,
  },
  statusPickText: {
    fontSize: 11,
    color: colors.textDim,
    fontWeight: '600',
  },
  statusPickTextActive: {
    color: colors.primaryGlow,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    backgroundColor: colors.primaryGlow,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Picker
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  pickerItemSub: {
    fontSize: 12,
    color: colors.primaryGlow,
  },

  // Request modal
  requestModalSub: {
    fontSize: 13,
    color: colors.textDim,
    marginBottom: 14,
  },
  statusChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  statusChoiceText: {
    fontSize: 11,
    color: colors.textDim,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
  },
});

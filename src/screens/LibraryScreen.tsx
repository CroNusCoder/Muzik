import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
} from 'react-native';
import { getStats, getHistory, type Stats, type HistoryEntry } from '../services/stats';
import { usePlayerStore } from '../store/playerStore';
import { Text, Label, StatNumber, Title } from '../components/common/Text';
import { Divider } from '../components/common/Box';
import { Colors, Spacing, FontSizes } from '../theme';

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const StatBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={styles.statBlock}>
    <StatNumber>{value}</StatNumber>
    <Label style={{ marginTop: 4 }}>{label}</Label>
  </View>
);

export const LibraryScreen: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { playSong } = usePlayerStore();

  const load = useCallback(async () => {
    const [s, h] = await Promise.all([getStats(), getHistory()]);
    setStats(s);
    setHistory(h);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.textMuted}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text family="serif" size="3xl" weight="bold">Library.</Text>
      </View>

      <Divider />

      {/* ── Stats Section ──────────────────────── */}
      <View style={styles.sectionHeader}>
        <Label>YOUR STATS</Label>
      </View>

      <Divider />

      {stats && (
        <View style={styles.statsGrid}>
          <StatBlock
            value={String(stats.totalSongs)}
            label="SONGS PLAYED"
          />
          <View style={styles.statDivider} />
          <StatBlock
            value={
              stats.totalHours >= 1
                ? `${stats.totalHours}h ${stats.totalMinutes % 60}m`
                : `${stats.totalMinutes}m`
            }
            label="TIME LISTENED"
          />
        </View>
      )}

      <Divider />

      {stats?.firstPlayedAt && (
        <View style={styles.firstPlayed}>
          <Label>LISTENING SINCE</Label>
          <Text family="mono" size="sm" color={Colors.textSecondary} style={{ marginTop: 4 }}>
            {new Date(stats.firstPlayedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}

      <Divider />

      {/* ── History Section ────────────────────── */}
      <View style={{ height: Spacing['2xl'] }} />

      <View style={styles.sectionHeader}>
        <Label>RECENTLY PLAYED</Label>
      </View>

      <Divider />

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text family="serif" size="lg" color={Colors.textMuted}>Nothing yet.</Text>
          <Label style={{ marginTop: Spacing.sm }}>START LISTENING TO BUILD HISTORY</Label>
        </View>
      ) : (
        history.map((entry, i) => (
          <React.Fragment key={`${entry.videoId}-${entry.playedAt}`}>
            <View style={styles.historyRow}>
              <View style={styles.historyInfo}>
                <Text family="serif" size="base" numberOfLines={1}>
                  {entry.title}
                </Text>
                <Text family="mono" size="xs" color={Colors.textMuted} numberOfLines={1}>
                  {entry.artist}
                </Text>
              </View>
              <Label>{formatDate(entry.playedAt)}</Label>
            </View>
            <Divider />
          </React.Fragment>
        ))
      )}

      <View style={{ height: Spacing['4xl'] }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.base,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingVertical: Spacing['2xl'],
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: 'stretch',
  },
  firstPlayed: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.base,
  },
  historyInfo: {
    flex: 1,
    gap: 3,
  },
  empty: {
    paddingTop: Spacing['3xl'],
    alignItems: 'center',
  },
});

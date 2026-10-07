import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
    Modal, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Fonts } from './Commoncomponent/Constants';

const TAB_COLORS = {
    today: '#16A34A',
    tomorrow: '#F59E0B',
    upcoming: '#7C3AED',
    overdue: '#DC2626',
};

const TAB_ICONS = {
    today: 'calendar-today',
    tomorrow: 'calendar-arrow-right',
    upcoming: 'calendar-clock-outline',
    overdue: 'calendar-alert',
};

const NEXT7_COLOR = '#0EA5E9';
const PENDING_COLOR = '#0D9488';

const TABS = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue', label: 'Overdue' },
];

const EMPTY_COUNTS = {
    today: 0, tomorrow: 0, upcoming: 0, upcoming_7_days: 0, overdue: 0,
    pending_payments: 0,
};
const EMPTY_PAYLOAD = { today: [], tomorrow: [], upcoming: [], overdue: [] };

/* ══════════════ Shimmer skeleton ══════════════ */
const ShimmerBlock = ({ style }) => {
    const opacity = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.35, duration: 550, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return <Animated.View style={[styles.shimmerBlock, style, { opacity }]} />;
};

const ShimmerRow = () => (
    <View style={styles.card}>
        <View style={styles.cardTop}>
            <ShimmerBlock style={{ width: 34, height: 34, borderRadius: 10 }} />
            <View style={{ flex: 1, marginLeft: 10 }}>
                <ShimmerBlock style={{ width: '55%', height: 11, borderRadius: 4, marginBottom: 7 }} />
                <ShimmerBlock style={{ width: '35%', height: 9, borderRadius: 4 }} />
            </View>
            <ShimmerBlock style={{ width: 44, height: 18, borderRadius: 9 }} />
        </View>
        <View style={styles.chipsRow}>
            <ShimmerBlock style={{ width: 90, height: 22, borderRadius: 11, marginRight: 8 }} />
            <ShimmerBlock style={{ width: 90, height: 22, borderRadius: 11 }} />
        </View>
    </View>
);

/* ══════════════ Stat card (EditingSummary jaisa) ══════════════ */
const Stat = ({ icon, color, value, label, active, onPress, style }) => (
    <TouchableOpacity
        activeOpacity={0.8}
        disabled={!onPress}
        onPress={onPress}
        style={[
            {
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 11,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1.2,
                borderColor: active ? color : 'transparent',
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
            },
            style,
        ]}
    >
        <View
            style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Icon name={icon} size={17} color="#fff" />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: Fonts.Bold, fontSize: 18, color: '#111827' }}>{value}</Text>
            <Text numberOfLines={1} style={{ fontFamily: Fonts.Regular, fontSize: 9.5, color: '#6B7280', marginTop: 1 }}>
                {label}
            </Text>
        </View>
    </TouchableOpacity>
);

/* 5 counts — card ke BAHAR dikhenge */
const ShootStats = ({ counts, activeTab, onChange }) => (
    <View style={{ marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Stat
                icon={TAB_ICONS.today}
                color={TAB_COLORS.today}
                value={counts.today ?? 0}
                label="Today"
                active={activeTab === 'today'}
                onPress={() => onChange('today')}
                style={{ marginRight: 8 }}
            />
            <Stat
                icon={TAB_ICONS.tomorrow}
                color={TAB_COLORS.tomorrow}
                value={counts.tomorrow ?? 0}
                label="Tomorrow"
                active={activeTab === 'tomorrow'}
                onPress={() => onChange('tomorrow')}
            />
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Stat
                icon={TAB_ICONS.upcoming}
                color={TAB_COLORS.upcoming}
                value={counts.upcoming ?? 0}
                label="Upcoming"
                active={activeTab === 'upcoming'}
                onPress={() => onChange('upcoming')}
                style={{ marginRight: 8 }}
            />
            <Stat
                icon="calendar-week"
                color={NEXT7_COLOR}
                value={counts.upcoming_7_days ?? 0}
                label="Next 7 Days"
            />
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Stat
                icon={TAB_ICONS.overdue}
                color={TAB_COLORS.overdue}
                value={counts.overdue ?? 0}
                label="Overdue"
                active={activeTab === 'overdue'}
                onPress={() => onChange('overdue')}
                style={{ marginRight: 8 }}
            />
            {/* spacer — Overdue half-width rahe */}
            <Stat
                icon="cash-multiple"
                color={PENDING_COLOR}
                value={`₹${Number(counts.pending_payments ?? 0).toLocaleString('en-IN')}`}
                label={`Pending Payments`}
            />
        </View>
    </View>
);

/* ══════════════ Tabs ══════════════ */
const ShootScheduleTabs = ({ activeTab, onChange, counts }) => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={{ flexGrow: 0 }}
    >
        {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const color = TAB_COLORS[tab.key];
            return (
                <TouchableOpacity
                    key={tab.key}
                    onPress={() => onChange(tab.key)}
                    activeOpacity={0.75}
                    style={[
                        styles.tabItem,
                        isActive && { backgroundColor: `${color}14`, borderColor: color },
                    ]}
                >
                    <Text
                        numberOfLines={1}
                        style={[styles.tabLabel, isActive && { color, fontFamily: 'Inter-Bold' }]}
                    >
                        {tab.label}
                    </Text>
                    <View style={[styles.tabBadge, isActive && { backgroundColor: color }]}>
                        <Text style={[styles.tabBadgeText, isActive && { color: '#fff' }]}>
                            {counts[tab.key] ?? 0}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        })}
    </ScrollView>
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = dateStr => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/* ══════════════ Row ══════════════ */
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
};

const Chip = ({ icon, label, value, color }) => (
    <View style={[styles.chip, { backgroundColor: `${color}12` }]}>
        <Icon name={icon} size={11} color={color} />
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.chipText}>
            <Text style={styles.chipLabel}>{label}: </Text>
            <Text style={[styles.chipValue, { color }]}>{value}</Text>
        </Text>
    </View>
);
const getCoordinationStatus = item =>
    item.coordination_status || item.current_stage || '-';

/* ══════════════ Branch picker modal ══════════════ */
const BranchModal = ({ visible, onClose, list, selected, onSelect, loading }) => {
    const [q, setQ] = useState('');

    useEffect(() => { if (!visible) setQ(''); }, [visible]);

    const filtered = list.filter(b =>
        (b.label || '').toLowerCase().includes(q.toLowerCase())
    );

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
            >
                <View
                    style={{ backgroundColor: '#fff', borderRadius: 14, width: '85%', overflow: 'hidden' }}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingVertical: 12, paddingLeft: 16, paddingRight: 8,
                        borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                    }}>
                        <Text style={{ fontSize: 15, fontFamily: 'Inter-Bold', color: '#1e293b', flex: 1 }}>
                            Select Branch
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <View style={{
                        flexDirection: 'row', alignItems: 'center', margin: 10,
                        paddingHorizontal: 12, height: 40, backgroundColor: '#f1f5f9',
                        borderRadius: 8, gap: 8,
                    }}>
                        <Icon name="magnify" size={18} color="#94a3b8" />
                        <TextInput
                            value={q}
                            onChangeText={setQ}
                            placeholder="Search branch..."
                            placeholderTextColor="#94a3b8"
                            style={{ flex: 1, fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b', padding: 0 }}
                        />
                    </View>

                    <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
                        {loading ? (
                            <Text style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontFamily: Fonts.Regular }}>
                                Loading...
                            </Text>
                        ) : filtered.length === 0 ? (
                            <Text style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontFamily: Fonts.Regular }}>
                                No branch found
                            </Text>
                        ) : (
                            filtered.map(item => {
                                const sel = String(item.value) === String(selected);
                                return (
                                    <TouchableOpacity
                                        key={String(item.value) || 'all'}
                                        onPress={() => { onSelect(item.value); onClose(); }}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                            paddingVertical: 13, paddingHorizontal: 20,
                                            borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
                                            backgroundColor: sel ? '#f0fdf4' : '#fff',
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 14,
                                            fontFamily: sel ? 'Inter-Bold' : Fonts.Regular,
                                            color: sel ? '#16A34A' : '#1e293b',
                                        }}>
                                            {item.label}
                                        </Text>
                                        {sel && <Icon name="check" size={18} color="#16A34A" />}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const ShootRow = ({ item, accent }) => (
    <View style={styles.card}>
        <View style={styles.cardTop}>
            <View style={[styles.avatar, { backgroundColor: `${accent}18` }]}>
                <Text style={[styles.avatarText, { color: accent }]}>{getInitials(item.client_name)}</Text>
            </View>

            <View style={styles.cardInfo}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.clientName}>
                    {item.client_name || '-'}
                </Text>
                <View style={styles.phoneRow}>
                    <Icon name="phone-outline" size={11} color="#94a3b8" />
                    <Text numberOfLines={1} style={styles.phoneText}>{item.mobile_no || '-'}</Text>
                </View>
            </View>

            <View style={[styles.orderBadge, { backgroundColor: `${accent}12` }]}>
                <Text style={[styles.orderBadgeText, { color: accent }]} numberOfLines={1}>
                    #{item.order_no || '-'}
                </Text>
            </View>
        </View>

        <View style={styles.chipsRow}>
            <Chip icon="calendar-month-outline" label="Booking Date" value={formatDate(item.booking_date || item.shoot_date || item.event_date || item.date)} color={accent} />
            <Chip icon="tag-outline" label="Event" value={item.purpose || '-'} color={accent} />
            <Chip icon="account-tie-outline" label="Sales Person" value={item.sales_person_name || '-'} color="#F59E0B" />
            <Chip icon="account-outline" label="Coordinator" value={item.coordinator_name || 'Not Assigned'} color="#0EA5E9" />
            <Chip icon="camera-outline" label="Photographer" value={item.photographer_name || 'Not Assigned'} color="#8B5CF6" />
            <Chip
                icon="progress-check"
                label="Coordination Status"
                value={getCoordinationStatus(item)}
                color={getCoordinationStatus(item) === 'Done' ? '#16A34A' : '#F59E0B'}
            />
        </View>
    </View>
);

/* ══════════════ Main ══════════════ */
const ShootSchedule = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const [counts, setCounts] = useState(EMPTY_COUNTS);
    const [payload, setPayload] = useState(EMPTY_PAYLOAD);

    const [branchList, setBranchList] = useState([{ label: 'All Branch', value: '' }]);
    const [branchId, setBranchId] = useState('');
    const [branchModal, setBranchModal] = useState(false);
    const [branchLoading, setBranchLoading] = useState(false);

    const fetchSchedule = useCallback(async (bId = '') => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.dashboard_api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: userId,
                    tab: 'shoots',
                    branch_id: bId,
                }),
            });

            const result = await res.json();

            if (result.status) {
                const c = { ...EMPTY_COUNTS, ...(result.counts || {}) };
                setCounts(c);
                setPayload({ ...EMPTY_PAYLOAD, ...(result.payload || {}) });

                // sabse pehle jis tab mein data ho wahi khulega
                if (c.today) setActiveTab('today');
                else if (c.tomorrow) setActiveTab('tomorrow');
                else if (c.upcoming) setActiveTab('upcoming');
                else if (c.overdue) setActiveTab('overdue');
                else setActiveTab('today');
            }
        } catch (e) {
            console.log('Shoot Schedule API error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule(branchId);
    }, [fetchSchedule, branchId]);




    useEffect(() => {
        const fetchBranches = async () => {
            setBranchLoading(true);
            try {
                const res = await fetch(API.list_branch, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const json = await res.json();
                if (json?.status && Array.isArray(json.payload)) {
                    const list = json.payload.map(b => ({
                        label: b.branch_name?.trim(),
                        value: String(b.branch_id),
                    }));
                    setBranchList([{ label: 'All Branch', value: '' }, ...list]);
                }
            } catch (e) {
                console.log('Branch list error:', e);
            } finally {
                setBranchLoading(false);
            }
        };
        fetchBranches();
    }, []);

    const handleTabChange = (key) => {
        if (key === activeTab) return;
        setActiveTab(key);
        setSwitching(true);
        setTimeout(() => setSwitching(false), 380);
    };

    const list = payload[activeTab] || [];
    const accent = TAB_COLORS[activeTab];
    const titleMap = {
        today: "Today's Shoots",
        tomorrow: "Tomorrow's Shoots",
        upcoming: 'Upcoming Shoots',
        overdue: 'Overdue Shoots',
    };
    const showShimmer = loading || switching;

    return (
        <View>
            {/* COUNTS — card ke bahar */}
            <ShootStats counts={counts} activeTab={activeTab} onChange={handleTabChange} />

            {/* CARD */}
            <View style={styles.wrapper}>
                <View style={styles.headerLabelRow}>
                    <View style={[styles.dash, { backgroundColor: accent }]} />
                    <Text style={[styles.headerLabel, { color: accent }]}>SHOOT SCHEDULE</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={[styles.title, { marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                        {titleMap[activeTab]}
                    </Text>

                    <TouchableOpacity
                        onPress={() => setBranchModal(true)}
                        activeOpacity={0.8}
                        style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: accent, borderRadius: 8,
                            paddingHorizontal: 10, height: 30, maxWidth: 140, gap: 4,
                        }}
                    >
                        <Icon name="map-marker-outline" size={13} color="#fff" />
                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter-Bold', flexShrink: 1 }}>
                            {branchList.find(b => b.value === branchId)?.label || 'All Branch'}
                        </Text>
                        <Icon name="chevron-down" size={13} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ShootScheduleTabs activeTab={activeTab} onChange={handleTabChange} counts={counts} />

                {showShimmer ? (
                    <View>
                        <ShimmerRow />
                        <ShimmerRow />
                        <ShimmerRow />
                    </View>
                ) : list.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Icon name="calendar-blank-outline" size={26} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No shoots to show</Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        style={{ maxHeight: 420 }}
                    >
                        {list.map((item, index) => (
                            <ShootRow
                                key={item.client_id ? `${item.client_id}-${index}` : index}
                                item={item}
                                accent={accent}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
            <BranchModal
                visible={branchModal}
                onClose={() => setBranchModal(false)}
                list={branchList}
                selected={branchId}
                onSelect={setBranchId}
                loading={branchLoading}
            />
        </View>
    );
};

export default ShootSchedule;

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    headerLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    dash: { width: 14, height: 3, borderRadius: 2, marginRight: 6 },
    headerLabel: { fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 0.5 },
    title: { fontSize: 17, fontFamily: 'Inter-Bold', color: '#0F172A', marginBottom: 10 },

    tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EEF0F2',
        backgroundColor: '#FAFAFB',
    },
    tabLabel: { fontSize: 11, color: '#64748B', fontFamily: Fonts.Regular, marginRight: 6 },
    tabBadge: {
        minWidth: 18, height: 18, borderRadius: 9,
        backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: { fontSize: 9.5, color: '#64748B', fontFamily: 'Inter-Bold' },

    card: {
        backgroundColor: '#FBFBFC',
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F1F4',
    },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    avatarText: { fontSize: 12, fontFamily: 'Inter-Bold' },
    cardInfo: { flex: 1, flexShrink: 1, minWidth: 0, marginLeft: 10, marginRight: 8 },
    clientName: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#172033', textTransform: 'capitalize' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    phoneText: { fontSize: 10, color: '#94a3b8', fontFamily: Fonts.Regular, marginLeft: 4, flexShrink: 1 },
    orderBadge: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexShrink: 0,
    },
    orderBadgeText: { fontSize: 10.5, fontFamily: 'Inter-Bold' },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 9, gap: 8 },

    chip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, maxWidth: '100%', flexShrink: 1,
    },
    chipText: { fontSize: 10, marginLeft: 4, flexShrink: 1 },
    chipLabel: { fontFamily: Fonts.Regular, color: '#64748B' },
    chipValue: { fontFamily: 'Inter-Medium', textTransform: 'capitalize' },

    shimmerBlock: { backgroundColor: '#E2E8F0' },

    emptyBox: { paddingVertical: 30, alignItems: 'center' },
    emptyText: { fontSize: 12, color: '#94a3b8', fontFamily: Fonts.Regular, marginTop: 8 },
});
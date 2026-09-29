import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, Image, SafeAreaView, StatusBar,
    Modal, TextInput, FlatList, Linking, Alert, Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import LeadDetailshimmer from '../Shimmer/Lead/LeadDetailshimmer';

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
const STATUS_OPTIONS_LIST = [
    { label: 'Pending / Pre Enquiry', value: 'Pending' },
    { label: 'Unresponsive', value: 'Unresponsive' },
    { label: 'Follow-up', value: 'Follow-up' },
    { label: 'Quotation Sent / Meeting Lined Up', value: 'Quotation Sent' },
    { label: 'Converted to Client', value: 'Converted to Client' },
    { label: 'End', value: 'End' },
];

const LEAD_TYPE_OPTIONS = [
    { label: 'Cold', value: 'Cold' },
    { label: 'Warm', value: 'Warm' },
    { label: 'Hot', value: 'Hot' },
];

const STATUS_COLORS = {
    'Pending/Pre Enquiry': { bg: '#fef9c3', text: '#854d0e' },
    'Follow-up': { bg: '#dbeafe', text: '#1d4ed8' },
    'Unresponsive': { bg: '#fee2e2', text: '#b91c1c' },
    'Quotation Sent/Meeting Lined Up': { bg: '#dcfce7', text: '#15803d' },
    'Convert to Client': { bg: '#d1fae5', text: '#065f46' },
    'End': { bg: '#f1f5f9', text: '#475569' },
};

const TABS = ['Timeline', 'About', 'Contacts'];

/* ── Helpers ── */
const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '0000-00-00') return '--';
    const d = new Date(dateStr);
    if (isNaN(d)) return '--';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d)) return '--';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

const toApiDate = d => {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDisplay = d => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};
/* ── Helper: Clean Phone Number ── */
const cleanPhoneNumber = (phone) => {
    if (!phone) return '';

    // Remove unwanted prefixes like "p:", "P:", "phone:"
    let cleaned = phone.replace(/^(p:|P:|phone:)/i, '');

    // Remove all non-numeric characters except "+"
    cleaned = cleaned.replace(/[^0-9+]/g, '');

    return cleaned.trim();
};

/* ─────────────────────────────────────────────
   GENERIC PICKER MODAL
───────────────────────────────────────────── */
const PickerModal = React.memo(({ visible, onClose, title, data, selected, onSelect, keyField, labelField, searchEnabled = true }) => {
    const [q, setQ] = useState('');
    const filtered = useMemo(
        () => searchEnabled ? data.filter(d => (d[labelField] || '').toLowerCase().includes(q.toLowerCase())) : data,
        [data, q, searchEnabled, labelField]
    );
    useEffect(() => { if (!visible) setQ(''); }, [visible]);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
                <View style={s.modalCard} onStartShouldSetResponder={() => true}>
                    <Text style={s.modalTitle}>{title}</Text>
                    {searchEnabled && (
                        <View style={s.searchRow}>
                            <Icon name="magnify" size={18} color="#94a3b8" />
                            <TextInput value={q} onChangeText={setQ} placeholder="Search..."
                                placeholderTextColor="#94a3b8" style={s.searchInput} />
                        </View>
                    )}
                    <FlatList
                        data={filtered}
                        keyExtractor={item => String(item[keyField])}
                        style={{ maxHeight: 320 }}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                            const sel = selected === item[keyField];
                            return (
                                <TouchableOpacity
                                    onPress={() => { onSelect(item); onClose(); }}
                                    style={[s.mItem, sel && s.mItemSel]}
                                >
                                    <Text style={[s.mItemTxt, sel && s.mItemTxtSel]}>{item[labelField]}</Text>
                                    {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <Text style={{ fontSize: 13, color: '#94a3b8', fontFamily: Fonts.Regular }}>No results</Text>
                            </View>
                        }
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );
});

/* ─────────────────────────────────────────────
   INFO ROW
───────────────────────────────────────────── */
const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoItem}>
        <View style={styles.infoRow}>
            <Icon name={icon} size={15} color="#7367f0" style={styles.infoIcon} />
            <Text style={styles.infoLabel} numberOfLines={1}>{label}</Text>
        </View>
        <Text style={styles.infoValue} numberOfLines={2}>{value || '--'}</Text>
    </View>
);

/* ─────────────────────────────────────────────
   TIMELINE ITEM  — fixed: only one date (bottom badge)
───────────────────────────────────────────── */
const TimelineItem = ({ entry, isLast }) => {
    const sc = STATUS_COLORS[entry.status] || { bg: '#ede9fe', text: '#7367f0' };

    /* Combined date+time string for bottom badge */
    const dateStr = formatDate(entry.time || entry.date);
    const timeStr = (() => {
        const raw = entry.time || entry.created_at;
        if (!raw) return '';
        const d = new Date(raw);
        if (isNaN(d)) return '';
        let h = d.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return ` · ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
    })();

    return (
        <View style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: '#7367f0' }]} />
                {!isLast && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineCard}>
                {/* Top row: status badge only */}
                <View style={styles.timelineCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusBadgeTxt, { color: sc.text }]}>
                            {entry.status || 'Follow-up'}
                        </Text>
                    </View>
                    {/* Created-at small label (right side) — ONLY time, not full date */}
                    {!!entry.created_at && (
                        <Text style={styles.timelineCreatedAt}>
                            {formatDateTime(entry.created_at)}
                        </Text>
                    )}
                </View>

                {/* Notes */}
                {!!entry.notes && (
                    <Text style={styles.timelineNote}>{entry.notes}</Text>
                )}

                {/* Single date badge at bottom */}
                {(dateStr && dateStr !== '--') && (
                    <View style={styles.timelineDateBadge}>
                        <Icon name="calendar-outline" size={12} color="#73717d" />
                        <Text style={styles.timelineDateBadgeTxt}>
                            {dateStr}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

/* ─────────────────────────────────────────────
   TAB BAR
───────────────────────────────────────────── */
const TabBar = ({ activeTab, onTabPress }) => {
    const indicatorAnim = useRef(new Animated.Value(0)).current;
    const [containerWidth, setContainerWidth] = useState(0);
    const tabWidth = containerWidth / TABS.length;

    useEffect(() => {
        if (tabWidth === 0) return;
        Animated.spring(indicatorAnim, {
            toValue: activeTab * tabWidth,
            useNativeDriver: true,
            tension: 68,
            friction: 12,
        }).start();
    }, [activeTab, tabWidth]);

    return (
        <View
            style={styles.tabContainer}
            onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
        >
            {TABS.map((tab, idx) => (
                <TouchableOpacity
                    key={tab}
                    style={styles.tabItem}
                    onPress={() => onTabPress(idx)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                        {tab}
                    </Text>
                </TouchableOpacity>
            ))}
            {/* Sliding indicator — uses pixel value, not percentage */}
            {tabWidth > 0 && (
                <Animated.View
                    style={[
                        styles.tabIndicator,
                        {
                            width: tabWidth,
                            transform: [{ translateX: indicatorAnim }],
                        },
                    ]}
                />
            )}
        </View>
    );
};

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
const LeadDetail = ({ route, navigation }) => {
    const { enquiry_id } = route.params || {};

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    /* Tab content fade animation */
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const switchTab = (idx) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        setActiveTab(idx);
    };

    /* Status modal state */
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selStatus, setSelStatus] = useState(null);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [time, setTime] = useState(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selType, setSelType] = useState(null);
    const [typePickerVisible, setTypePickerVisible] = useState(false);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => { fetchDetail(); }, [enquiry_id]);

    const handleCall = (phone) => {
        const cleanedPhone = cleanPhoneNumber(phone);
        if (!cleanedPhone) return;
        Linking.openURL(`tel:${cleanedPhone}`);
    };

    const handleWhatsApp = async (phone) => {
        let formattedPhone = cleanPhoneNumber(phone);
        if (!formattedPhone) {
            Alert.alert('Error', 'Phone number not available');
            return;
        }

        // Remove '+' for WhatsApp URL
        formattedPhone = formattedPhone.replace('+', '');

        if (formattedPhone.length === 10) {
            formattedPhone = `91${formattedPhone}`;
        }

        const message = 'Hello, I am contacting you regarding your inquiry.';
        const encoded = encodeURIComponent(message);

        const waUrl = `whatsapp://send?phone=${formattedPhone}&text=${encoded}`;
        const fallback = `https://wa.me/${formattedPhone}?text=${encoded}`;

        try {
            const supported = await Linking.canOpenURL(waUrl);
            await Linking.openURL(supported ? waUrl : fallback);
        } catch {
            Alert.alert('Error', 'Unable to open WhatsApp');
        }
    };
    const handleEmail = (email) => {
        if (!email) return;
        Linking.openURL(`mailto:${email}`);
    };

    const fetchDetail = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(API.detail_lead, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enquiry_id: String(enquiry_id) }),
            });
            const json = await res.json();
            if (json.code == 200) setData(json.payload || json.data || json);
            else setError(json.message || 'Failed to load lead details');
        } catch {
            setError('Network error. Please try again.');
        } finally { setLoading(false); }
    };

    const displayTime = d => {
        if (!d) return '';
        let h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    };

    const resetForm = () => {
        setSelStatus(null); setNotes(''); setDate(new Date());
        setTime(null); setSelType(null); setErrors({});
    };

    const handleSave = async () => {
        const e = {};
        if (!selStatus) e.status = 'Please select lead status';
        if (!date) e.date = 'Please select date';
        if (!selType) e.type = 'Please select lead type';
        setErrors(e);
        if (Object.keys(e).length) return;

        setSaving(true);
        try {
            const timeStr = time
                ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:00`
                : '';
            const body = {
                enquiry_id: String(enquiry_id),
                lead_type: selType?.value || '',
                status: selStatus?.value || '',
                notes: notes.trim(),
                date: toApiDate(date),
                time: timeStr,
                added_by: '103',
            };
            const res = await fetch(API.add_status, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.code == 200) {
                Toast.show({ type: 'success', text1: 'Status Added', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
                setStatusModalVisible(false);
                resetForm();
                fetchDetail();
            } else {
                Toast.show({ type: 'error', text1: json.message || 'Failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setSaving(false); }
    };

    if (loading) return <LeadDetailshimmer />;

    if (error) return (
        <SafeAreaView style={styles.centered}>
            <StatusBar barStyle="light-content" backgroundColor="#7367f0" />
            <Icon name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorTxt}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
                <Text style={styles.retryBtnTxt}>Retry</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

    const lead = data || {};
    const timeline = lead.statuses || [];
    const latestStatus = lead.statuses?.[0]?.status || lead.status || '--';
    const statusSt = STATUS_COLORS[latestStatus] || { bg: '#ede9fe', text: '#7367f0' };
    const avatar = lead.profile_image ? { uri: lead.profile_image } : null;
    const initials = (lead.name || lead.full_name || 'L').charAt(0).toUpperCase();

    /* ── TAB CONTENT ── */
    const renderTabContent = () => {
        /* TIMELINE TAB */
        if (activeTab === 0) {
            return (
                <View style={styles.card}>
                    {timeline.length === 0 ? (
                        <View style={styles.emptyTimeline}>
                            <Icon name="history" size={36} color="#c4b5fd" />
                            <Text style={styles.emptyTimelineTxt}>No activity yet</Text>
                        </View>
                    ) : (
                        timeline.map((entry, idx) => (
                            <TimelineItem key={idx} entry={entry} isLast={idx === timeline.length - 1} />
                        ))
                    )}
                </View>
            );
        }

        /* ABOUT TAB */
        if (activeTab === 1) {
            return (
                <View style={styles.card}>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoPair}>
                            <InfoRow icon="account-outline" label="Full Name" value={lead.name || lead.full_name} />
                            <InfoRow icon="home-outline" label="Address" value={lead.address} />
                        </View>
                        <View style={styles.rowDivider} />
                        <View style={styles.infoPair}>
                            <InfoRow icon="map-outline" label="State" value={lead.state_name} />
                            <InfoRow icon="city-variant-outline" label="City" value={lead.city_name || lead.city} />
                        </View>
                        <View style={styles.rowDivider} />
                        <View style={styles.infoPair}>
                            <InfoRow icon="account-arrow-right" label="Source" value={lead.source} />
                            <InfoRow icon="tag-outline" label="Purpose" value={lead.purpose} />
                        </View>
                        <View style={styles.rowDivider} />
                        <View style={styles.infoPair}>
                            <InfoRow icon="map-marker-distance" label="Destination" value={lead.destination} />
                            <InfoRow icon="calendar-star" label="Event Date 1" value={formatDate(lead.event_date)} />
                        </View>
                        <View style={styles.rowDivider} />
                        <View style={styles.infoPair}>
                            <InfoRow icon="calendar-star" label="Event Date 2" value={formatDate(lead.event_date2)} />
                            <InfoRow icon="fire" label="Lead Type" value={lead.lead_type} />
                        </View>
                        <View style={styles.rowDivider} />
                        <View style={styles.infoPair}>
                            <InfoRow icon="comment-text-outline" label="Remark" value={lead.remark} />
                            <View style={{ width: '48%' }} />
                        </View>
                    </View>
                </View>
            );
        }

        /* CONTACTS TAB */
        if (activeTab === 2) {
            return (
                <View style={styles.card}>
                    {/* Phone */}
                    <View style={styles.contactRow}>
                        <View style={styles.contactIconWrap}>
                            <Icon name="phone" size={16} color="#7367f0" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactLbl}>Contact</Text>
                            <Text style={styles.contactVal}>{cleanPhoneNumber(lead.mobile) || '--'}</Text>
                        </View>
                        {lead.mobile && (
                            <View style={styles.contactActions}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
                                    onPress={() => handleWhatsApp(lead.mobile)}
                                >
                                    <Icon name="whatsapp" size={18} color="#25D366" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]}
                                    onPress={() => handleCall(lead.mobile)}
                                >
                                    <Icon name="phone" size={18} color="#2196F3" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.rowDivider} />

                    {/* Email */}
                    <View style={[styles.contactRow, { marginTop: 8 }]}>
                        <View style={styles.contactIconWrap}>
                            <Icon name="email-outline" size={16} color="#7367f0" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.contactLbl}>Email</Text>
                            <Text style={styles.contactVal}>{lead.email || '---'}</Text>
                        </View>
                        {lead.email && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FFF4E5' }]}
                                onPress={() => handleEmail(lead.email)}
                            >
                                <Icon name="email" size={18} color="#FF9800" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            );
        }

        return null;
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#7367f0" />

            {/* ── HEADER BAR ── */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="arrow-left" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerBarTitle}>Lead Detail</Text>
                <View style={{ width: 22 }} />
            </View>

            {/* ── HERO BANNER ── */}
            <View style={styles.heroBanner}>
                <View style={styles.avatarWrapper}>
                    {avatar
                        ? <Image source={avatar} style={styles.avatarImg} />
                        : <View style={styles.avatarFallback}>
                            <Text style={styles.avatarInitial}>{initials}</Text>
                        </View>
                    }
                </View>
                <View style={styles.heroInfo}>
                    <Text style={styles.heroName} numberOfLines={1}>
                        {lead.name || lead.full_name || '--'}
                    </Text>
                    <View style={styles.heroMetaRow}>
                        <Icon name="phone-outline" size={12} color="#ffffffcc" />
                        <Text style={styles.heroMetaTxt}> {cleanPhoneNumber(lead.mobile) || '--'}</Text>
                        <Text style={styles.separator}>•</Text>
                        <Icon name="map-marker-outline" size={12} color="#ffffffcc" />
                        <Text style={styles.heroMetaTxt}> {lead.city_name || lead.city || '--'}</Text>
                        <Text style={styles.separator}>•</Text>
                        <Icon name="calendar-plus" size={12} color="#ffffffcc" />
                        <Text style={styles.heroMetaTxt}> {formatDate(lead.created_at)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setStatusModalVisible(true)}
                        activeOpacity={0.8}
                        style={[styles.heroBadge, { backgroundColor: statusSt.bg }]}
                    >
                        <Icon name="circle-slice-8" size={10} color={statusSt.text} />
                        <Text style={[styles.heroBadgeTxt, { color: statusSt.text }]} numberOfLines={1}>
                            {latestStatus}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── TAB BAR ── */}
            <TabBar activeTab={activeTab} onTabPress={switchTab} />

            {/* ── TAB CONTENT ── */}
            <ScrollView
                contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim }}>
                    {renderTabContent()}
                </Animated.View>
            </ScrollView>

            {/* ── ADD STATUS BOTTOM SHEET ── */}
            <Modal transparent visible={statusModalVisible} animationType="slide">
                <View style={s.filterOverlay}>
                    <View style={[s.filterSheet, { maxHeight: '92%' }]}>
                        <View style={s.filterHeader}>
                            <Text style={s.filterHeaderTitle}>Add Lead Status</Text>
                            <TouchableOpacity onPress={() => { setStatusModalVisible(false); resetForm(); }}>
                                <Icon name="close" size={22} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                            {/* LEAD STATUS */}
                            <View style={{ marginTop: 4 }}>
                                <Text style={s.filterLabel}>Lead Status <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity
                                    style={[sm.dropdown, errors.status && { borderColor: 'red' }]}
                                    onPress={() => setStatusPickerVisible(true)}
                                >
                                    <Text style={[sm.dropdownTxt, !selStatus && { color: '#999' }]}>
                                        {selStatus?.label || 'Select Status'}
                                    </Text>
                                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {!!errors.status && <Text style={sm.errTxt}>{errors.status}</Text>}
                            </View>

                            {/* NOTES */}
                            <View style={{ marginTop: 14 }}>
                                <Text style={s.filterLabel}>Notes</Text>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Enter notes..."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                    style={sm.notesInput}
                                />
                            </View>

                            {/* DATE */}
                            <View style={{ marginTop: 14 }}>
                                <Text style={s.filterLabel}>Date <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity
                                    style={[sm.dropdown, errors.date && { borderColor: 'red' }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={sm.dropdownTxt}>{fmtDisplay(date)}</Text>
                                    <Icon name="calendar-outline" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {!!errors.date && <Text style={sm.errTxt}>{errors.date}</Text>}
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date || new Date()} mode="date" display="default"
                                        onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
                                    />
                                )}
                            </View>

                            {/* TIME */}
                            <View style={{ marginTop: 14 }}>
                                <Text style={s.filterLabel}>Time</Text>
                                <TouchableOpacity style={sm.dropdown} onPress={() => setShowTimePicker(true)}>
                                    <Text style={[sm.dropdownTxt, !time && { color: '#999' }]}>
                                        {time ? displayTime(time) : 'Select Time'}
                                    </Text>
                                    <Icon name="clock-outline" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={time || new Date()} mode="time" display="default"
                                        onChange={(e, d) => { setShowTimePicker(false); if (d) setTime(d); }}
                                    />
                                )}
                            </View>

                            {/* LEAD TYPE */}
                            <View style={{ marginTop: 14 }}>
                                <Text style={s.filterLabel}>Lead Type <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity
                                    style={[sm.dropdown, errors.type && { borderColor: 'red' }]}
                                    onPress={() => setTypePickerVisible(true)}
                                >
                                    <Text style={[sm.dropdownTxt, !selType && { color: '#999' }]}>
                                        {selType?.label || 'Select Lead Type'}
                                    </Text>
                                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {!!errors.type && <Text style={sm.errTxt}>{errors.type}</Text>}
                            </View>

                            {/* SAVE */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={saving}
                                style={[sm.saveBtn, { marginTop: 20 }]}
                            >
                                {saving
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={sm.saveBtnTxt}>Save Status</Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── PICKERS ── */}
            <PickerModal
                visible={statusPickerVisible}
                onClose={() => setStatusPickerVisible(false)}
                title="Select Status"
                data={STATUS_OPTIONS_LIST}
                selected={selStatus?.value}
                onSelect={item => { setSelStatus(item); setErrors(p => ({ ...p, status: '' })); }}
                keyField="value" labelField="label" searchEnabled={false}
            />
            <PickerModal
                visible={typePickerVisible}
                onClose={() => setTypePickerVisible(false)}
                title="Select Lead Type"
                data={LEAD_TYPE_OPTIONS}
                selected={selType?.value}
                onSelect={item => { setSelType(item); setErrors(p => ({ ...p, type: '' })); }}
                keyField="value" labelField="label" searchEnabled={false}
            />
        </SafeAreaView>
    );
};

export default LeadDetail;

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const PURPLE = '#7367f0';

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8f7fa' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f7fa', gap: 12 },
    errorTxt: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
    retryBtn: { marginTop: 12, backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    retryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },

    /* Header */
    headerBar: {
        backgroundColor: PURPLE,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    headerBarTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

    /* Hero */
    heroBanner: {
        backgroundColor: PURPLE,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20,
        flexDirection: 'row', alignItems: 'flex-start',
    },
    avatarWrapper: {
        width: 60, height: 60, borderRadius: 30,
        borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.65)',
        overflow: 'hidden', backgroundColor: '#9f8ff5',
        marginRight: 12, marginTop: 2,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 24, fontWeight: '800' },
    heroInfo: { flex: 1 },
    heroName: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 5 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 },
    heroMetaTxt: { color: '#ffffffcc', fontSize: 11.5, marginRight: 3 },
    separator: { color: '#ffffffcc', fontSize: 11, marginHorizontal: 5 },
    heroBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, alignSelf: 'flex-start', marginTop: 7,
    },
    heroBadgeTxt: { fontSize: 11, fontWeight: '700', flexShrink: 1 },

    /* Tab bar */
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        position: 'relative',
    },
    tabItem: {
        flex: 1,
        paddingVertical: 13,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        fontFamily: Fonts.Regular,
    },
    tabTextActive: {
        color: PURPLE,
        fontFamily: Fonts.Bold,
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        backgroundColor: PURPLE,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },

    /* Card */
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        shadowColor: '#7367f0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },

    /* About grid */
    infoGrid: { width: '100%' },
    infoPair: { flexDirection: 'row', justifyContent: 'space-between' },
    rowDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
    infoItem: { width: '48%', paddingVertical: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    infoIcon: { marginRight: 5 },
    infoLabel: { fontSize: 11.5, color: '#64748b', fontWeight: '600' },
    infoValue: { fontSize: 12.5, paddingLeft: 20, color: '#1e293b', fontWeight: '500' },

    /* Contacts */
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    contactIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
    contactLbl: { fontSize: 11, color: '#94a3b8' },
    contactVal: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
    contactActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    /* Timeline */
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
    statusBadgeTxt: { fontSize: 11, fontWeight: '700' },

    timelineRow: { flexDirection: 'row', marginBottom: 4 },
    timelineLeft: { width: 22, alignItems: 'center' },
    timelineDot: { width: 11, height: 11, borderRadius: 6, marginTop: 4 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#e2d9f8', marginTop: 2 },
    timelineCard: { flex: 1, paddingLeft: 10, paddingBottom: 18 },

    timelineCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    /* Small created_at label on right — just shows who added/when */
    timelineCreatedAt: {
        fontSize: 10,
        color: '#94a3b8',
        fontFamily: Fonts.Regular,
        flexShrink: 1,
        marginLeft: 6,
        textAlign: 'right',
    },
    timelineNote: { fontSize: 13, color: '#475569', marginTop: 3 },

    /* Single date+time badge at bottom */
    timelineDateBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 7, backgroundColor: '#f3f2f3',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 12, alignSelf: 'flex-start',
    },
    timelineDateBadgeTxt: { fontSize: 11, color: '#73717d', fontFamily: Fonts.Regular },

    emptyTimeline: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyTimelineTxt: { color: '#94a3b8', fontSize: 13 },
});

/* Shared with modals */
const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { backgroundColor: '#fff', borderRadius: 14, width: '85%', overflow: 'hidden' },
    modalTitle: { fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b', textAlign: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
    searchRow: { flexDirection: 'row', alignItems: 'center', margin: 10, paddingHorizontal: 12, height: 40, backgroundColor: '#f1f5f9', borderRadius: 8, gap: 8 },
    searchInput: { flex: 1, fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b' },
    mItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' },
    mItemSel: { backgroundColor: '#f0fdf4' },
    mItemTxt: { flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    mItemTxtSel: { fontFamily: Fonts.Bold, color: Colors.buttonbgcolor },
    filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    filterSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
    filterHeaderTitle: { fontSize: 16, fontFamily: Fonts.Bold, color: '#1e293b' },
    filterLabel: { fontSize: 12, fontFamily: Fonts.Bold, color: '#475569', marginBottom: 5 },
});

const sm = StyleSheet.create({
    dropdown: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
        height: 44, paddingHorizontal: 12, backgroundColor: '#fff',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    dropdownTxt: { flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    notesInput: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
        padding: 12, backgroundColor: '#fff',
        fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b',
        textAlignVertical: 'top', minHeight: 80,
    },
    errTxt: { color: 'red', fontSize: 11, fontFamily: Fonts.Regular, marginTop: 3 },
    saveBtn: { backgroundColor: Colors.buttonbgcolor, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveBtnTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.Bold },
});
import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    TouchableOpacity, Image, SafeAreaView, StatusBar,
    Modal, TextInput, FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import LeadDetailshimmer from '../Shimmer/Lead/LeadDetailshimmer';

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
// ✅ Array — PickerModal ke liye
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

// ✅ Object — color mapping ke liye
const STATUS_COLORS = {
    'Pending/Pre Enquiry': { bg: '#fef9c3', text: '#854d0e' },
    'Follow-up': { bg: '#dbeafe', text: '#1d4ed8' },
    'Unresponsive': { bg: '#fee2e2', text: '#b91c1c' },
    'Quotation Sent/Meeting Lined Up': { bg: '#dcfce7', text: '#15803d' },
    'Convert to Client': { bg: '#d1fae5', text: '#065f46' },
    'End': { bg: '#f1f5f9', text: '#475569' },
};

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
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()} ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

const toApiDate = d => {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDisplay = d => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
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
    <View style={styles.infoRow}>
        <Icon name={icon} size={16} color="#7367f0" style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value || '--'}</Text>
    </View>
);

/* ─────────────────────────────────────────────
   TIMELINE ITEM
───────────────────────────────────────────── */
const TimelineItem = ({ entry, isLast }) => {
    const sc = STATUS_COLORS[entry.status] || { bg: '#ede9fe', text: '#7367f0' };
    return (
        <View style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: '#7367f0' }]} />
                {!isLast && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineCard}>
                <View style={styles.timelineCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusBadgeTxt, { color: sc.text }]}>{entry.status || 'Follow-up'}</Text>
                    </View>
                    <Text style={styles.timelineDateRight}>{formatDateTime(entry.created_at || entry.date)}</Text>
                </View>
                {!!entry.notes && <Text style={styles.timelineNote}>{entry.notes}</Text>}
                {!!entry.date && (
                    <View style={styles.timelineDateBadge}>
                        <Icon name="calendar-outline" size={12} color="#7367f0" />
                        <Text style={styles.timelineDateBadgeTxt}>{formatDate(entry.date)}</Text>
                    </View>
                )}
            </View>
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
    const [errors, setErrors] = useState({});   // ✅ validation errors

    useEffect(() => { fetchDetail(); }, [enquiry_id]);

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
        } catch (_) {
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

    // ✅ Validation — same as ManageLeads
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
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setSaving(false); }
    };

    /* ── Loading ── */
    if (loading) return <LeadDetailshimmer />;

    /* ── Error ── */
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

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* ── HERO BANNER ── */}
                <View style={styles.heroBanner}>
                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                        {avatar
                            ? <Image source={avatar} style={styles.avatarImg} />
                            : <View style={styles.avatarFallback}>
                                <Text style={styles.avatarInitial}>{initials}</Text>
                            </View>
                        }
                    </View>

                    {/* ✅ heroInfo is flex:1 — badge is INSIDE it, never overlaps */}
                    <View style={styles.heroInfo}>
                        <Text style={styles.heroName} numberOfLines={1}>
                            {lead.name || lead.full_name || '--'}
                        </Text>
                        <View style={styles.heroMetaRow}>
                            <Icon name="phone-outline" size={13} color="#ffffffcc" />
                            <Text style={styles.heroMetaTxt}>{lead.mobile || '--'}</Text>
                        </View>
                        <View style={styles.heroMetaRow}>
                            <Icon name="map-marker-outline" size={13} color="#ffffffcc" />
                            <Text style={styles.heroMetaTxt}>{lead.city_name || lead.city || '--'}</Text>
                        </View>
                        <View style={styles.heroMetaRow}>
                            <Icon name="calendar-plus" size={13} color="#ffffffcc" />
                            <Text style={styles.heroMetaTxt}>Added {formatDate(lead.created_at)}</Text>
                        </View>

                        {/* ✅ Status badge — inside flow, no absolute, won't overflow */}
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

                {/* ── ABOUT CARD ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="account-details-outline" size={18} color="#7367f0" />
                        <Text style={styles.cardTitle}>About</Text>
                    </View>
                    <InfoRow icon="account-outline" label="Full Name" value={lead.name || lead.full_name} />
                    <InfoRow icon="home-outline" label="Address" value={lead.address} />
                    <InfoRow icon="map-outline" label="State" value={[lead.state_name || '---'].filter(Boolean).join(', ')} />
                    <InfoRow icon="city-variant-outline" label="City" value={[lead.city_name || lead.city].filter(Boolean).join(', ')} />
                    <InfoRow icon="account-arrow-right" label="Source" value={lead.source} />
                    <InfoRow icon="tag-outline" label="Purpose" value={lead.purpose} />
                    <InfoRow icon="map-marker-distance" label="Destination" value={lead.destination} />
                    <InfoRow icon="calendar-star" label="Event Date 1" value={formatDate(lead.event_date)} />
                    <InfoRow icon="calendar-star-outline" label="Event Date 2" value={formatDate(lead.event_date2)} />
                    <InfoRow icon="fire" label="Lead Type" value={lead.lead_type} />
                    <InfoRow icon="comment-text-outline" label="Remark" value={lead.remark} />
                </View>

                {/* ── CONTACTS CARD ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="contacts-outline" size={18} color="#7367f0" />
                        <Text style={styles.cardTitle}>Contacts</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <View style={styles.contactIconWrap}>
                            <Icon name="phone" size={16} color="#7367f0" />
                        </View>
                        <View>
                            <Text style={styles.contactLbl}>Contact</Text>
                            <Text style={styles.contactVal}>{lead.mobile || '--'}</Text>
                        </View>
                    </View>
                    {!!lead.email && (
                        <View style={[styles.contactRow, { marginTop: 12 }]}>
                            <View style={styles.contactIconWrap}>
                                <Icon name="email-outline" size={16} color="#7367f0" />
                            </View>
                            <View>
                                <Text style={styles.contactLbl}>Email</Text>
                                <Text style={styles.contactVal}>{lead.email}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── ACTIVITY TIMELINE CARD ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="chart-timeline-variant" size={18} color="#7367f0" />
                        <Text style={styles.cardTitle}>Activity Timeline</Text>
                    </View>
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
                                {/* ✅ red border when error */}
                                <TouchableOpacity
                                    style={[sm.dropdown, errors.status && { borderColor: 'red' }]}
                                    onPress={() => setStatusPickerVisible(true)}
                                >
                                    <Text style={[sm.dropdownTxt, !selStatus && { color: '#999' }]}>
                                        {selStatus?.label || 'Select Status'}
                                    </Text>
                                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {/* ✅ error message */}
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
                                {/* ✅ red border when error */}
                                <TouchableOpacity
                                    style={[sm.dropdown, errors.type && { borderColor: 'red' }]}
                                    onPress={() => setTypePickerVisible(true)}
                                >
                                    <Text style={[sm.dropdownTxt, !selType && { color: '#999' }]}>
                                        {selType?.label || 'Select Lead Type'}
                                    </Text>
                                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {/* ✅ error message */}
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
                onSelect={item => {
                    setSelStatus(item);
                    setErrors(p => ({ ...p, status: '' })); // ✅ clear error on select
                }}
                keyField="value" labelField="label" searchEnabled={false}
            />
            <PickerModal
                visible={typePickerVisible}
                onClose={() => setTypePickerVisible(false)}
                title="Select Lead Type"
                data={LEAD_TYPE_OPTIONS}
                selected={selType?.value}
                onSelect={item => {
                    setSelType(item);
                    setErrors(p => ({ ...p, type: '' })); // ✅ clear error on select
                }}
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
    loadingTxt: { color: '#64748b', fontSize: 14, marginTop: 8 },
    errorTxt: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
    retryBtn: { marginTop: 12, backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    retryBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },

    headerBar: {
        backgroundColor: PURPLE,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    headerBarTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

    /* ✅ Hero — pure row, no absolute positioning */
    heroBanner: {
        backgroundColor: PURPLE,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20,
        flexDirection: 'row', alignItems: 'flex-start',
    },
    avatarWrapper: {
        width: 64, height: 64, borderRadius: 32,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
        overflow: 'hidden', backgroundColor: '#9f8ff5',
        marginRight: 14, marginTop: 2,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 26, fontWeight: '800' },

    heroInfo: { flex: 1 },   // ✅ takes remaining space, badge stays inside
    heroName: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
    heroMetaTxt: { color: '#ffffffcc', fontSize: 12 },

    /* ✅ Badge is in normal flow — not absolute, won't go over name */
    heroBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, alignSelf: 'flex-start', marginTop: 8,
    },
    heroBadgeTxt: { fontSize: 11, fontWeight: '700', flexShrink: 1 },

    card: {
        backgroundColor: '#fff', borderRadius: 14,
        marginHorizontal: 14, marginTop: 16, padding: 16,
        shadowColor: '#7367f0', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    infoIcon: { marginRight: 8, marginTop: 1 },
    infoLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', width: 96 },
    infoValue: { fontSize: 13, color: '#1e293b', flex: 1 },

    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    contactIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
    contactLbl: { fontSize: 11, color: '#94a3b8' },
    contactVal: { fontSize: 14, color: '#1e293b', fontWeight: '600' },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
    statusBadgeTxt: { fontSize: 11, fontWeight: '700' },

    timelineRow: { flexDirection: 'row', marginBottom: 4 },
    timelineLeft: { width: 24, alignItems: 'center' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#e2d9f8', marginTop: 2 },
    timelineCard: { flex: 1, paddingLeft: 12, paddingBottom: 18 },
    timelineCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    timelineDateRight: { fontSize: 11, color: '#94a3b8' },
    timelineNote: { fontSize: 13, color: '#475569', marginTop: 4 },
    timelineDateBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 6, backgroundColor: '#ede9fe',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 12, alignSelf: 'flex-start',
    },
    timelineDateBadgeTxt: { fontSize: 11, color: PURPLE, fontWeight: '600' },
    emptyTimeline: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyTimelineTxt: { color: '#94a3b8', fontSize: 13 },
});

/* Shared with modal */
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
    errTxt: { color: 'red', fontSize: 11, fontFamily: Fonts.Regular, marginTop: 3 },   // ✅
    saveBtn: { backgroundColor: Colors.buttonbgcolor, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveBtnTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.Bold },
});
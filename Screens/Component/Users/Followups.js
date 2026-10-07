import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Platform, Modal,
    TextInput, FlatList, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import { useNavigation } from '@react-navigation/native';
import Followupshimmer from '../Shimmer/Followupshimmer';

// ── Status Colors ────────────────────────────────────────────
const STATUS_COLORS = {
    'Pending': { bg: '#fef9c3', text: '#854d0e' },
    'Pending/Pre Enquiry': { bg: '#fef9c3', text: '#854d0e' },
    'Follow-up': { bg: '#dbeafe', text: '#1d4ed8' },
    'Unresponsive': { bg: '#fee2e2', text: '#b91c1c' },
    'Quotation Sent': { bg: '#dcfce7', text: '#15803d' },
    'Quotation Sent/Meeting Lined Up': { bg: '#dcfce7', text: '#15803d' },
    'Converted to Client': { bg: '#d1fae5', text: '#065f46' },
    'Convert to Client': { bg: '#d1fae5', text: '#065f46' },
    'End': { bg: '#f1f5f9', text: '#475569' },
};

const STATUS_OPTIONS = [
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

const TABS = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'pastdue', label: 'Past Due' },
];

// ── Helpers ──────────────────────────────────────────────────
const formatDisplayDate = (date) => {
    if (!date) return 'Select Date';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
};

const toApiDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
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

const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '0000-00-00') return '--';
    const d = new Date(dateStr);
    if (isNaN(d)) return '--';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const fmtDisplay = (d) => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

// ── Lead Type Badge ──────────────────────────────────────────
const LeadTypeBadge = ({ type }) => {
    const colors = {
        Hot: { bg: '#fee2e2', text: '#b91c1c' },
        Warm: { bg: '#fef3c7', text: '#92400e' },
        Cold: { bg: '#dbeafe', text: '#1e40af' },
    };
    const c = colors[type] || { bg: '#f1f5f9', text: '#475569' };
    if (!type) return null;
    return (
        <View style={{ backgroundColor: c.bg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginTop: 2, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 9, fontFamily: Fonts?.Bold || 'Inter-Bold', color: c.text }}>{type}</Text>
        </View>
    );
};

// ── Status History Modal ─────────────────────────────────────
const StatusHistoryModal = ({ visible, onClose, item }) => {
    const [statusList, setStatusList] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [selStatus, setSelStatus] = useState(null);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [time, setTime] = useState(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selType, setSelType] = useState(null);
    const [typePickerVisible, setTypePickerVisible] = useState(false);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible && item) {
            fetchStatusList();
            setSelStatus(null); setNotes(''); setDate(new Date());
            setTime(null); setSelType(null); setErrors({});
        }
    }, [visible, item]);

    const fetchStatusList = async () => {
        setLoadingList(true);
        try {
            const res = await fetch(API.list_status, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enquiry_id: String(item?.enquiry_id) })
            });
            const json = await res.json();
            setStatusList(json.code == 200 ? (json.payload || []) : []);
        } catch (_) { setStatusList([]); }
        finally { setLoadingList(false); }
    };

    const displayTime = (d) => {
        if (!d) return '';
        let h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
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
                enquiry_id: String(item?.enquiry_id),
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
                body: JSON.stringify(body)
            });
            const json = await res.json();
            if (json.code == 200) {
                Toast.show({ type: 'success', text1: 'Status Added', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
                fetchStatusList();
                setSelStatus(null); setNotes(''); setDate(new Date()); setTime(null); setSelType(null);
            } else {
                Toast.show({ type: 'error', text1: json.message || 'Failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setSaving(false); }
    };

    const statusColor = (st) => STATUS_COLORS[st] || { bg: '#f1f5f9', text: '#475569' };

    return (
        <Modal transparent visible={visible} animationType="slide">
            <View style={sm.overlay}>
                <View style={sm.sheet}>
                    {/* Header */}
                    <View style={sm.header}>
                        <View>
                            <Text style={sm.headerTitle}>Lead Status</Text>
                            {item?.name ? <Text style={sm.headerSub}>{item.name}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={onClose} style={sm.closeBtn}>
                            <Icon name="close" size={20} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                        {/* Add Status Form */}
                        <View style={sm.formCard}>
                            <Text style={sm.formTitle}>Add New Status</Text>

                            {/* Lead Status */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={sm.label}>Lead Status <Text style={{ color: 'red' }}>*</Text></Text>
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

                            {/* Notes */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={sm.label}>Notes</Text>
                                <TextInput
                                    value={notes} onChangeText={setNotes}
                                    placeholder="Enter notes..." placeholderTextColor="#999"
                                    multiline numberOfLines={3} style={sm.notesInput}
                                />
                            </View>

                            {/* Date */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={sm.label}>Date <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity
                                    style={[sm.dropdown, errors.date && { borderColor: 'red' }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={sm.dropdownTxt}>{fmtDisplay(date)}</Text>
                                    <Icon name="calendar-outline" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {!!errors.date && <Text style={sm.errTxt}>{errors.date}</Text>}
                                {showDatePicker && (
                                    <DateTimePicker value={date || new Date()} mode="date" display="default"
                                        onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
                                )}
                            </View>

                            {/* Time */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={sm.label}>Time</Text>
                                <TouchableOpacity style={sm.dropdown} onPress={() => setShowTimePicker(true)}>
                                    <Text style={[sm.dropdownTxt, !time && { color: '#999' }]}>
                                        {time ? displayTime(time) : 'Select Time'}
                                    </Text>
                                    <Icon name="clock-outline" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker value={time || new Date()} mode="time" display="default"
                                        onChange={(e, d) => { setShowTimePicker(false); if (d) setTime(d); }} />
                                )}
                            </View>

                            {/* Lead Type */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={sm.label}>Lead Type <Text style={{ color: 'red' }}>*</Text></Text>
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

                            <TouchableOpacity onPress={handleSave} disabled={saving} style={sm.saveBtn}>
                                {saving
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={sm.saveBtnTxt}>Save Status</Text>
                                }
                            </TouchableOpacity>
                        </View>

                        {/* History List */}
                        <Text style={sm.historyTitle}>Status History</Text>
                        {loadingList ? (
                            <ActivityIndicator color={Colors.buttonbgcolor} style={{ marginTop: 20 }} />
                        ) : statusList.length === 0 ? (
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <Icon name="history" size={32} color="#cbd5e1" />
                                <Text style={{ color: '#94a3b8', fontFamily: Fonts?.Regular || 'Inter-Regular', marginTop: 8, fontSize: 13 }}>
                                    No history found
                                </Text>
                            </View>
                        ) : statusList.map((entry, idx) => {
                            const sc = statusColor(entry.status);
                            return (
                                <View key={idx} style={sm.historyItem}>
                                    <View style={sm.historyDot} />
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={[sm.badge, { backgroundColor: sc.bg }]}>
                                                <Text style={[sm.badgeTxt, { color: sc.text }]}>{entry.status}</Text>
                                            </View>
                                            <Text style={sm.historyDate}>{formatDateTime(entry.created_at || entry.date)}</Text>
                                        </View>
                                        {!!entry.notes && <Text style={sm.historyNote}>{entry.notes}</Text>}

                                        <View style={sm.historyDateBadge}>
                                            <Icon name="calendar-outline" size={12} color="#73717d" />
                                            <Text style={sm.historyDateBadgeTxt}>{formatDate(entry.time)}</Text>
                                        </View>

                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* Status Picker Modal */}
            <InnerPickerModal
                visible={statusPickerVisible}
                onClose={() => setStatusPickerVisible(false)}
                title="Select Status"
                data={STATUS_OPTIONS}
                selected={selStatus?.value}
                onSelect={(item) => { setSelStatus(item); setErrors(p => ({ ...p, status: '' })); }}
                keyField="value"
                labelField="label"
            />

            {/* Type Picker Modal */}
            <InnerPickerModal
                visible={typePickerVisible}
                onClose={() => setTypePickerVisible(false)}
                title="Select Lead Type"
                data={LEAD_TYPE_OPTIONS}
                selected={selType?.value}
                onSelect={(item) => { setSelType(item); setErrors(p => ({ ...p, type: '' })); }}
                keyField="value"
                labelField="label"
            />
        </Modal>
    );
};

// ── Inner Picker Modal (used inside StatusHistoryModal) ───────
const InnerPickerModal = React.memo(({ visible, onClose, title, data, selected, onSelect, keyField, labelField }) => (
    <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
            <View style={styles.pickerCard} onStartShouldSetResponder={() => true}>
                <Text style={styles.pickerTitle}>{title}</Text>
                <TouchableOpacity style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    padding: 6,
                }} onPress={onClose}>
                    <Icon name="close" size={20} color="#64748b" />
                </TouchableOpacity>
                <FlatList
                    data={data}
                    keyExtractor={item => String(item[keyField])}
                    style={{ maxHeight: 320 }}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                        const sel = selected === item[keyField];
                        return (
                            <TouchableOpacity
                                onPress={() => { onSelect(item); onClose(); }}
                                style={[styles.pickerItem, sel && styles.pickerItemSel]}
                            >
                                <Text style={[styles.pickerItemTxt, sel && styles.pickerItemTxtSel]}>
                                    {item[labelField]}
                                </Text>
                                {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </TouchableOpacity>
    </Modal>
));

// ── Main Component ───────────────────────────────────────────
const Followups = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [selectedDate, setSelectedDate] = useState(null); // Date object or null
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState('');  // staff id string
    const [users, setUsers] = useState([]);
    const [staffModal, setStaffModal] = useState(false);
    const [staffSearch, setStaffSearch] = useState('');
    const [userType, setUserType] = useState('');
    const inputRef = useRef(null);
    const navigation = useNavigation();

    // API data
    const [leads, setLeads] = useState([]);
    const [tabCounts, setTabCounts] = useState({ today: 0, tomorrow: 0, pastdue: 0 });
    const [loading, setLoading] = useState(false);

    // Eye modal
    const [eyeItem, setEyeItem] = useState(null);
    const [eyeVisible, setEyeVisible] = useState(false);

    // isDateMode: jab date select ho to custom tab, tabs chhupao
    const isDateMode = !!selectedDate;

    // Fetch staff list
    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(API.list_user);
            const result = await response.json();
            setUsers(result.code == 200 ? result.payload : []);
        } catch (e) { setUsers([]); }
    };

    useEffect(() => {
        fetchUserType();
    }, []);

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId })
            });

            const result = await res.json();

            if (result.code == 200 && result.payload.length > 0) {
                setUserType(result.payload[0].user_type);
            } else {
                setUserType('');
            }
        } catch (error) {
            console.log('UserType Error:', error);
            setUserType('');
        }
    };

    // Fetch leads whenever tab / date / staff changes
    useEffect(() => {
        fetchLeads();
    }, [activeTab, selectedDate, selectedStaff]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const adminId = await AsyncStorage.getItem('id') || '';

            // tab value
            let tabValue = activeTab; // today | tomorrow | pastdue
            if (isDateMode) tabValue = 'custom';

            const body = {
                admin: adminId,
                tab: tabValue,
                admin_id: selectedStaff ? String(selectedStaff) : '',
                selected_date: isDateMode ? toApiDate(selectedDate) : '',
            };

            const res = await fetch(API.followup_api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();

            if (json.code == 200) {
                setLeads(json.payload || []);
                // Update count for current tab (non-date mode)
                if (!isDateMode) {
                    setTabCounts(prev => ({ ...prev, [activeTab]: json.count || 0 }));
                }
            } else {
                setLeads([]);
            }
        } catch (e) {
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    // Prefetch all tab counts on mount and when staff changes (no date mode)
    useEffect(() => {
        if (!isDateMode) prefetchAllTabCounts();
    }, [selectedStaff]);

    const prefetchAllTabCounts = async () => {
        try {
            const adminId = await AsyncStorage.getItem('id') || '';
            const tabs = ['today', 'tomorrow', 'pastdue'];
            const results = await Promise.all(
                tabs.map(tab =>
                    fetch(API.followup_api, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            admin: adminId, tab, admin_id: selectedStaff ? String(selectedStaff) : '', selected_date: '',
                        }),
                    }).then(r => r.json()).catch(() => ({ code: 0, count: 0 }))
                )
            );
            setTabCounts({
                today: results[0].count || 0,
                tomorrow: results[1].count || 0,
                pastdue: results[2].count || 0,
            });
        } catch (_) { }
    };

    const onDateChange = (event, date) => {
        setShowDatePicker(false);

        // Agar user ne Cancel kiya ho to kuch bhi select na ho
        if (event?.type === 'dismissed') {
            return;
        }

        if (date) {
            setSelectedDate(date);
        }
    };

    const clearDate = () => {
        setSelectedDate(null);
        setActiveTab('today');
    };

    const clearStaff = () => {
        setSelectedStaff('');
    };

    const filteredUsers = useMemo(() =>
        users.filter(user => (user.user_name || '').toLowerCase().includes(staffSearch.toLowerCase())),
        [users, staffSearch]
    );

    const selectedStaffName = useMemo(() =>
        users.find(u => String(u.id || u._id) === String(selectedStaff))?.user_name || null,
        [users, selectedStaff]
    );

    // Avatar initials & colors
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name[0]?.toUpperCase() || '?';
    };
    const avatarColors = [
        { bg: '#fce7f3', text: '#9d174d' }, { bg: '#fef3c7', text: '#92400e' },
        { bg: '#d1fae5', text: '#065f46' }, { bg: '#ede9fe', text: '#4c1d95' },
        { bg: '#dbeafe', text: '#1e3a8a' }, { bg: '#fee2e2', text: '#7f1d1d' },
    ];
    const getAvatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];

    const isAdmin = userType?.toLowerCase() === 'admin';

    return (
        <View style={styles.card}>
            {/* ── Card Header ── */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Follow-ups</Text>

                {/* Filters Row */}
                <View style={styles.filtersRow}>
                    {/* Date Picker Button */}
                    <TouchableOpacity
                        style={[
                            styles.filterBtn,
                            userType !== 'Admin' && { flex: 1 } // Non-admin ke liye full width
                        ]}
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.8}
                    >
                        <Icon name="calendar-outline" size={15} color="#64748B" />
                        <Text style={[styles.filterBtnText, selectedDate && { color: '#0F172A' }]}>
                            {formatDisplayDate(selectedDate)}
                        </Text>
                        {selectedDate && (
                            <TouchableOpacity
                                onPress={clearDate}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.clearIcon}
                            >
                                <Icon name="close-circle" size={15} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>

                    {/* Staff Dropdown */}
                    {isAdmin && (
                        <TouchableOpacity
                            style={styles.pickerWrapper}
                            onPress={() => setStaffModal(true)}
                            activeOpacity={0.8}
                        >
                            <Icon name="account-outline" size={15} color="#64748B" style={{ marginLeft: 8 }} />
                            <Text style={[styles.staffText, selectedStaffName && { color: '#0F172A' }]}>
                                {selectedStaffName || 'Select Staff'}
                            </Text>
                            {selectedStaff ? (
                                <TouchableOpacity
                                    onPress={clearStaff}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={styles.clearIcon}
                                >
                                    <Icon name="close-circle" size={15} color="#94A3B8" />
                                </TouchableOpacity>
                            ) : (
                                <Icon name="chevron-down" size={18} color="#64748B" style={{ marginRight: 8 }} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Tabs (only when NOT in date mode) ── */}
            {!isDateMode && (
                <View style={styles.tabsRow}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                                {tab.label}
                            </Text>
                            <View style={[styles.tabBadge, activeTab === tab.key ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                                <Text style={[styles.tabBadgeText, activeTab === tab.key ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive]}>
                                    {tabCounts[tab.key] || 0}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* ── Lead List ── */}


            <FlatList
                data={leads}
                keyExtractor={(item) => String(item.enquiry_id)}
                style={styles.listScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps='handled'
                initialNumToRender={10}        // pehle sirf 10 render karo
                maxToRenderPerBatch={10}       // har batch mein 10
                windowSize={5}                 // sirf 5x screen height ka data memory mein
                removeClippedSubviews={true}   // off-screen views hatao
                ListEmptyComponent={() => (
                    <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                        <Icon name="calendar-check-outline" size={28} color="#cbd5e1" />
                        <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8, fontFamily: Fonts?.Regular || 'Inter-Regular' }}>
                            No follow-ups found
                        </Text>
                    </View>
                )}
                ListHeaderComponent={loading ? <Followupshimmer /> : null}
                renderItem={({ item, index }) => {
                    const initials = getInitials(item.name);
                    const ac = getAvatarColor(item.enquiry_id);
                    const sc = STATUS_COLORS[item.status] || { bg: '#EFF6FF', text: '#1D4ED8' };
                    const timeParts = item.formatted_time?.split(' ') || [];
                    const datePart = timeParts.slice(0, 3).join(' ');
                    const timePart = timeParts.slice(3).join(' ');

                    return (
                        <View
                            style={[
                                styles.leadItem,
                                index === leads.length - 1 && { borderBottomWidth: 0 }
                            ]}
                        >
                            {/* Avatar */}
                            <View style={[styles.avatar, { backgroundColor: ac.bg }]}>
                                <Text style={[styles.avatarText, { color: ac.text }]}>{initials}</Text>
                            </View>

                            {/* Info */}
                            <View style={styles.leadInfo}>
                                <View style={styles.nameRow}

                                    ellipse>
                                    <Text style={styles.leadName} numberOfLines={1}
                                        ellipsizeMode="tail">{item.name}</Text>
                                    {item.mobile ? (
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('LeadDetail', { enquiry_id: item.enquiry_id })}
                                        >
                                            <Text style={styles.leadPhone}>{" "}{item.mobile}</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                                {item.notes ? (
                                    <Text style={styles.leadNote} numberOfLines={1}>{item.notes}</Text>
                                ) : null}
                                <View style={styles.staffRow}>
                                    <Icon name="account-outline" size={11} color="#94A3B8" />
                                    <Text style={styles.leadStaff}>{item.sales_person_name}</Text>
                                </View>
                            </View>

                            {/* Eye Icon */}
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => { setEyeItem(item); setEyeVisible(true); }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Icon name="eye-outline" size={20} color="#64748B" />
                            </TouchableOpacity>

                            {/* Meta */}
                            {/* Meta */}
                            <View style={styles.leadMeta}>
                                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                                    <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
                                </View>
                                {item.lead_type ? (
                                    <View style={{ alignSelf: 'flex-end', marginBottom: 4 }}>
                                        <LeadTypeBadge type={item.lead_type} />
                                    </View>
                                ) : null}
                                <Text style={styles.leadDate}>{datePart}</Text>
                                {timePart ? <Text style={styles.leadTime}>{timePart}</Text> : null}
                            </View>
                        </View>
                    );
                }}
            />

            {/* ── Date Picker ── */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={onDateChange}
                />
            )}

            {/* ── Staff Modal ── */}
            <Modal transparent visible={staffModal} animationType="fade">
                <TouchableOpacity
                    style={styles.overlay}
                    onPress={() => setStaffModal(false)}
                >
                    <View style={styles.staffModalCard} onStartShouldSetResponder={() => true}>
                        <Text style={styles.pickerTitle}>Select Staff</Text>

                        {/* Search */}
                        <View style={styles.searchRow}>
                            <Icon name="magnify" size={18} color="#64748B" />
                            <TextInput
                                ref={inputRef}
                                placeholder="Search staff..."
                                value={staffSearch}
                                placeholderTextColor="#94a3b8"
                                onChangeText={setStaffSearch}
                                style={styles.searchInput}
                            />
                            {staffSearch.length > 0 && (
                                <TouchableOpacity onPress={() => { setStaffSearch(''); inputRef.current?.focus(); }}>
                                    <Icon name="close-circle" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={filteredUsers}
                            keyExtractor={(item, index) => (item.id || item._id || index).toString()}
                            keyboardShouldPersistTaps="handled"
                            style={{ maxHeight: 320 }}
                            renderItem={({ item }) => {
                                const value = String(item.id || item._id);
                                const name = item.user_name || 'Staff';
                                const isSelected = String(selectedStaff) === value;
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedStaff(value);
                                            setStaffModal(false);
                                            setStaffSearch('');
                                        }}
                                        style={[styles.pickerItem, isSelected && styles.pickerItemSel]}
                                    >
                                        <Text style={[styles.pickerItemTxt, isSelected && styles.pickerItemTxtSel]}>
                                            {name}
                                        </Text>
                                        {isSelected && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={() => (
                                <Text style={{ textAlign: 'center', padding: 20, color: '#94A3B8', fontFamily: Fonts?.Regular || 'Inter-Regular' }}>
                                    No staff found
                                </Text>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Eye (Status History) Modal ── */}
            <StatusHistoryModal
                visible={eyeVisible}
                onClose={() => setEyeVisible(false)}
                item={eyeItem}
            />
        </View>
    );
};

export default Followups;

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        overflow: 'hidden',
    },

    // Header
    cardHeader: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E2E8F0',
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: 'Inter-Bold',
        color: '#0F172A',
        marginBottom: 10,
    },

    // Filters
    filtersRow: {
        flexDirection: 'row',
        gap: 10,
    },
    filterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        borderWidth: 0.5,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    filterBtnText: {
        flex: 1,
        fontSize: 13,
        color: '#94A3B8',
        fontFamily: 'Inter-Regular',
    },
    pickerWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 0.5,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingVertical: 8,
        overflow: 'hidden',
    },
    staffText: {
        flex: 1,
        fontSize: 13,
        color: '#94A3B8',
        marginLeft: 6,
        fontFamily: 'Inter-Regular',
    },
    clearIcon: {
        marginRight: 8,
        padding: 2,
    },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: 4,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 11,
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        position: 'relative',
    },
    tabBtnActive: { borderBottomColor: '#7367f0' },
    tabLabel: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
    },
    tabLabelActive: {
        fontFamily: 'Inter-Bold',
        color: '#7367f0',
    },
    tabBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeActive: { backgroundColor: '#ff4c51' },
    tabBadgeInactive: { backgroundColor: '#ff4c51' },
    tabBadgeText: { fontSize: 9, fontFamily: 'Inter-Bold' },
    tabBadgeTextActive: { color: '#FFFFFF' },
    tabBadgeTextInactive: { color: '#FFFFFF' },

    // Lead List
    listScroll: { maxHeight: 280 },
    leadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F5F9',
    },

    // Avatar
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    avatarText: {
        fontSize: 13,
        fontFamily: 'Inter-Bold',
    },

    // Lead Info

    leadInfo: {
        flex: 1,
        minWidth: 0,
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center', // Perfect vertical alignment
        flexWrap: 'nowrap',
    },

    leadName: {
        fontSize: 13,
        fontFamily: 'Inter-Bold',
        color: 'black',
        flexShrink: 1,
    },

    leadPhone: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: '#7367f0',
        marginLeft: 4,
    },

    leadNote: {
        fontSize: 11,
        color: '#64748B',
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },

    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },

    leadStaff: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: 'Inter-Regular',
        marginLeft: 4,
    },

    // Eye Button
    eyeBtn: {
        padding: 4,
        flexShrink: 0,
    },

    // Lead Meta
    leadMeta: { alignItems: 'flex-end', flexShrink: 0 },
    statusBadge: {
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'Inter-Bold',
    },
    leadDate: {
        fontSize: 11,
        fontFamily: 'Inter-Bold',
        color: '#DC2626',
    },
    leadTime: {
        fontSize: 10,
        fontFamily: 'Inter-Regular',
        color: '#DC2626',
        marginTop: 1,
    },

    // Overlay
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Staff Modal Card
    staffModalCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        width: '80%',
        maxHeight: 420,
        paddingBottom: 10,
    },

    // Generic Picker Card (for inner pickers)
    pickerCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        width: '80%',
        maxHeight: 420,
        paddingBottom: 10,
    },
    pickerTitle: {
        fontSize: 15,
        fontFamily: 'Inter-Bold',
        color: '#1e293b',
        textAlign: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#fff',
    },
    pickerItemSel: { backgroundColor: '#f0fdf4' },
    pickerItemTxt: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#1e293b',
    },
    pickerItemTxtSel: {
        fontFamily: 'Inter-Bold',
        color: Colors.buttonbgcolor,
    },

    // Search Row
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        marginLeft: 6,
        fontSize: 13,
        color: 'black',
        fontFamily: 'Inter-Regular',
    },
});

// ─────────────────────────────────────────────────────────────
// STATUS HISTORY MODAL STYLES
// ─────────────────────────────────────────────────────────────
const sm = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '95%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#0f172a',
    },
    headerSub: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: '#64748b',
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    formCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
    },
    formTitle: {
        fontSize: 14,
        fontFamily: 'Inter-Bold',
        color: '#1e293b',
    },
    label: {
        fontSize: 12,
        fontFamily: 'Inter-Bold',
        color: '#64748b',
        marginBottom: 4,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
    },
    dropdownTxt: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: '#1e293b',
        flex: 1,
    },
    notesInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: '#1e293b',
        textAlignVertical: 'top',
        minHeight: 80,
    },
    errTxt: {
        fontSize: 11,
        color: 'red',
        fontFamily: 'Inter-Regular',
        marginTop: 3,
    },
    saveBtn: {
        backgroundColor: Colors.buttonbgcolor,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    saveBtnTxt: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Inter-Bold',
    },
    historyTitle: {
        fontSize: 14,
        fontFamily: 'Inter-Bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    historyItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    historyDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.buttonbgcolor,
        marginTop: 5,
        flexShrink: 0,
    },
    badge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeTxt: {
        fontSize: 11,
        fontFamily: 'Inter-Bold',
    },
    historyDate: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        color: '#94a3b8',
    },
    historyNote: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: '#475569',
        marginTop: 5,
    },
    historyDateBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 6, backgroundColor: '#f3f2f3',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 12, alignSelf: 'flex-start',
    },
    historyDateBadgeTxt: {
        fontSize: 10,
        fontFamily: 'Inter-Regular',
        color: '#64748b',
    },
});
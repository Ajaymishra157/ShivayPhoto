import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Modal, FlatList, StyleSheet, ScrollView,
    SafeAreaView, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { DatePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import { useFocusEffect } from '@react-navigation/native';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ─────────────────────────────────────────────
   STATIC DATA  (module-level — never re-created)
───────────────────────────────────────────── */
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

const TABLE_COLS = [
    { key: 'idx', label: '#', width: 40 },
    { key: 'time', label: 'Date', width: 110 },
    { key: 'name', label: 'Name', width: 130 },
    { key: 'mobile', label: 'Mobile', width: 130 },
    { key: 'source', label: 'Source', width: 120 },
    { key: 'purpose', label: 'Purpose', width: 110 },
    { key: 'status', label: 'Status', width: 130 },
    { key: 'city_name', label: 'City', width: 110 },
    { key: 'event_date', label: 'Event 1', width: 110 },
    { key: 'event_date2', label: 'Event 2', width: 110 },
    { key: 'lead_type', label: 'Lead Type', width: 90 },
    { key: 'remark', label: 'Remark', width: 140 },
    { key: 'created_at', label: 'Entry Date', width: 110 },
    { key: 'action', label: 'Action', width: 80 },
];

const STATUS_COLORS = {
    'Pending': { bg: '#fef9c3', text: '#854d0e' },
    'Pending/Pre Enquiry': { bg: '#fef9c3', text: '#854d0e' },
    'Follow-up': { bg: '#dbeafe', text: '#1d4ed8' },
    'Unresponsive': { bg: '#fee2e2', text: '#b91c1c' },
    'Quotation Sent/Meeting Lined Up': { bg: '#dcfce7', text: '#15803d' },
    'Convert to Client': { bg: '#d1fae5', text: '#065f46' },
    'End': { bg: '#f1f5f9', text: '#475569' },
};

/* ── Pure helpers ── */
const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '0000-00-00') return '--';
    const d = new Date(dateStr);
    if (isNaN(d)) return '--';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    if (isNaN(d)) return '--';
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
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
                    <TouchableOpacity style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 10,
                        padding: 6,
                    }} onPress={onClose}>
                        <Icon name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
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
                                <TouchableOpacity onPress={() => { onSelect(item); onClose(); }}
                                    style={[s.mItem, sel && s.mItemSel]}>
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
   DATE RANGE FIELD
───────────────────────────────────────────── */
const DateRangeField = React.memo(({ label, startDate, endDate, onChange }) => {
    const [open, setOpen] = useState(false);
    const display = startDate ? `${fmtDisplay(startDate)}  →  ${fmtDisplay(endDate) || '...'}` : 'Select range';
    return (
        <View style={{ marginTop: 12 }}>
            <Text style={s.filterLabel}>{label}</Text>
            <TouchableOpacity style={s.dateBtn} onPress={() => setOpen(true)}>
                <Text style={[s.dateBtnTxt, !startDate && { color: '#999' }]}>{display}</Text>
                <Icon name="calendar-range" size={18} color="#94a3b8" />
            </TouchableOpacity>
            <DatePickerModal
                locale="en" mode="range" visible={open}
                onDismiss={() => setOpen(false)}
                startDate={startDate} endDate={endDate}
                onConfirm={({ startDate: sd, endDate: ed }) => { setOpen(false); onChange(sd, ed); }}
            />
        </View>
    );
});

/* ─────────────────────────────────────────────
   STATUS HISTORY MODAL (eye icon)
───────────────────────────────────────────── */
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enquiry_id: String(item?.enquiry_id) })
            });
            const json = await res.json();
            setStatusList(json.code == 200 ? (json.payload || []) : []);
        } catch (_) { setStatusList([]); }
        finally { setLoadingList(false); }
    };

    const displayTime = d => {
        if (!d) return '';
        let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
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

    const statusColor = st => STATUS_COLORS[st] || { bg: '#f1f5f9', text: '#475569' };

    return (
        <Modal transparent visible={visible} animationType="slide">
            <View style={s.filterOverlay}>
                <View style={[s.filterSheet, { maxHeight: '95%' }]}>
                    <View style={s.filterHeader}>
                        <Text style={s.filterHeaderTitle}>Lead Status</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={22} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

                        {/* ADD STATUS FORM */}
                        <View style={sm.formCard}>
                            <Text style={sm.formTitle}>Add New Status</Text>

                            <View style={{ marginTop: 12 }}>
                                <Text style={s.filterLabel}>Lead Status <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity style={[sm.dropdown, errors.status && { borderColor: 'red' }]} onPress={() => setStatusPickerVisible(true)}>
                                    <Text style={[sm.dropdownTxt, !selStatus && { color: '#999' }]}>{selStatus?.label || 'Select Status'}</Text>
                                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {!!errors.status && <Text style={sm.errTxt}>{errors.status}</Text>}
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Text style={s.filterLabel}>Notes</Text>
                                <TextInput value={notes} onChangeText={setNotes} placeholder="Enter notes..."
                                    placeholderTextColor="#999" multiline numberOfLines={3} style={sm.notesInput} />
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Text style={s.filterLabel}>Date <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity style={[sm.dropdown, errors.date && { borderColor: 'red' }]} onPress={() => setShowDatePicker(true)}>
                                    <Text style={sm.dropdownTxt}>{fmtDisplay(date)}</Text>
                                    <Icon name="calendar-outline" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {!!errors.date && <Text style={sm.errTxt}>{errors.date}</Text>}
                                {showDatePicker && (
                                    <DateTimePicker value={date || new Date()} mode="date" display="default"
                                        onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
                                )}
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Text style={s.filterLabel}>Time</Text>
                                <TouchableOpacity style={sm.dropdown} onPress={() => setShowTimePicker(true)}>
                                    <Text style={[sm.dropdownTxt, !time && { color: '#999' }]}>{time ? displayTime(time) : 'Select Time'}</Text>
                                    <Icon name="clock-outline" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker value={time || new Date()} mode="time" display="default"
                                        onChange={(e, d) => { setShowTimePicker(false); if (d) setTime(d); }} />
                                )}
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Text style={s.filterLabel}>Lead Type <Text style={{ color: 'red' }}>*</Text></Text>
                                <TouchableOpacity style={[sm.dropdown, errors.type && { borderColor: 'red' }]} onPress={() => setTypePickerVisible(true)}>
                                    <Text style={[sm.dropdownTxt, !selType && { color: '#999' }]}>{selType?.label || 'Select Lead Type'}</Text>
                                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                                {!!errors.type && <Text style={sm.errTxt}>{errors.type}</Text>}
                            </View>

                            <TouchableOpacity onPress={handleSave} disabled={saving} style={sm.saveBtn}>
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={sm.saveBtnTxt}>Save Status</Text>}
                            </TouchableOpacity>
                        </View>

                        {/* HISTORY LIST */}
                        <Text style={sm.historyTitle}>Status History</Text>
                        {loadingList ? (
                            <ActivityIndicator color={Colors.buttonbgcolor} style={{ marginTop: 20 }} />
                        ) : statusList.length === 0 ? (
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <Icon name="history" size={32} color="#cbd5e1" />
                                <Text style={{ color: '#94a3b8', fontFamily: Fonts.Regular, marginTop: 8, fontSize: 13 }}>No history found</Text>
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
                                        {/* {!!entry.date && ( */}
                                        <View style={sm.historyDateBadge}>
                                            <Text style={sm.historyDateBadgeTxt}>{formatDate(entry.time)}</Text>
                                        </View>
                                        {/* )} */}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            <PickerModal visible={statusPickerVisible} onClose={() => setStatusPickerVisible(false)}
                title="Select Status" data={STATUS_OPTIONS} selected={selStatus?.value}
                onSelect={item => { setSelStatus(item); setErrors(p => ({ ...p, status: '' })); }}
                keyField="value" labelField="label" searchEnabled={false} />

            <PickerModal visible={typePickerVisible} onClose={() => setTypePickerVisible(false)}
                title="Select Lead Type" data={LEAD_TYPE_OPTIONS} selected={selType?.value}
                onSelect={item => { setSelType(item); setErrors(p => ({ ...p, type: '' })); }}
                keyField="value" labelField="label" searchEnabled={false} />
        </Modal>
    );
};

/* ─────────────────────────────────────────────
   TABLE ROW — memoised: only re-renders when its own data changes
───────────────────────────────────────────── */
const TableRow = React.memo(({ item, index, isDeleting, onEye, onDot, navigation }) => {
    const statusStyle = STATUS_COLORS[item.status] || { bg: '#f1f5f9', text: '#475569' };

    const cellVal = (key) => {
        switch (key) {
            case 'idx': return String(index + 1);
            case 'time': return formatDate(item.created_at);
            case 'created_at': return formatDateTime(item.created_at);
            case 'event_date': return formatDate(item.event_date);
            case 'event_date2': return formatDate(item.event_date2);
            default: return item[key] || '---';
        }
    };

    // ── Navigate to detail screen with enquiry_id ──
    const handleMobilePress = () => {
        navigation.navigate('LeadDetail', { enquiry_id: item.enquiry_id });
    };

    return (
        <View style={[s.tableRow, index % 2 === 0 ? s.rowEven : s.rowOdd, isDeleting && { opacity: 0.4 }]}>
            {TABLE_COLS.map(col => {

                // ── ACTION column ──
                if (col.key === 'action') {
                    return (
                        <View key="action" style={[s.cell, { width: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
                            <TouchableOpacity onPress={onEye} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Icon name="eye-outline" size={18} color="#3b82f6" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onDot} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Icon name="dots-vertical" size={18} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    );
                }

                // ── STATUS column ──
                if (col.key === 'status') {
                    return (
                        <View key={col.key} style={[s.cell, { width: col.width }]}>
                            <View style={[s.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                <Text style={[s.statusText, { color: statusStyle.text }]} numberOfLines={2}>
                                    {cellVal(col.key)}
                                </Text>
                            </View>
                        </View>
                    );
                }

                // ── MOBILE column — purple + clickable ──
                if (col.key === 'mobile') {
                    return (
                        <View key={col.key} style={[s.cell, { width: col.width }]}>
                            <TouchableOpacity onPress={handleMobilePress} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
                                <Text
                                    style={[s.cellText, { color: '#7367f0', fontWeight: '600', textDecorationLine: 'underline' }]}
                                    numberOfLines={1}
                                >
                                    {cellVal(col.key)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                }

                // ── All other columns ──
                return (
                    <View key={col.key} style={[s.cell, { width: col.width }]}>
                        <Text style={s.cellText} numberOfLines={2}>{cellVal(col.key)}</Text>
                    </View>
                );
            })}
        </View>
    );
}, (prev, next) =>
    prev.item === next.item &&
    prev.index === next.index &&
    prev.isDeleting === next.isDeleting
);

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
const PendingLeadList = ({ navigation }) => {

    /* Staff */
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [staffSearch, setStaffSearch] = useState('');
    const [staffModal, setStaffModal] = useState(false);

    /* Filter modal */
    const [filterModal, setFilterModal] = useState(false);
    const [fDateStart, setFDateStart] = useState(null);
    const [fDateEnd, setFDateEnd] = useState(null);
    const [fName, setFName] = useState('');
    const [fMobile, setFMobile] = useState('');
    const [fSource, setFSource] = useState(null);
    const [fPurpose, setFPurpose] = useState(null);
    const [fStatus, setFStatus] = useState(null);
    const [fCity, setFCity] = useState(null);
    const [fEvent1Start, setFEvent1Start] = useState(null);
    const [fEvent1End, setFEvent1End] = useState(null);
    const [fEvent2Start, setFEvent2Start] = useState(null);
    const [fEvent2End, setFEvent2End] = useState(null);
    const [appliedFilters, setAppliedFilters] = useState({});

    /* Filter dropdown data */
    const [sources, setSources] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [cities, setCities] = useState([]);
    const [sourceModal, setSourceModal] = useState(false);
    const [purposeModal, setPurposeModal] = useState(false);
    const [cityModal, setCityModal] = useState(false);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    /* Leads */
    const [leads, setLeads] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    /* Row actions */
    const [dotMenuVisible, setDotMenuVisible] = useState(false);
    const [dotMenuPos, setDotMenuPos] = useState({ top: 100, right: 16 });
    const [selectedLead, setSelectedLead] = useState(null);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteLead, setDeleteLead] = useState(null);


    const [hasDataEverLoaded, setHasDataEverLoaded] = useState(false);
    const hasLeads = leads.length > 0 || hasDataEverLoaded;

    const [userType, setUserType] = useState(null);
    console.log('User Type:', userType);
    const userTypeRef = useRef(userType);
    useEffect(() => { userTypeRef.current = userType; }, [userType]);

    /* Keep selectedUser in a ref so async callbacks always see latest value */
    const selectedUserRef = useRef(selectedUser);
    const appliedFiltersRef = useRef(appliedFilters);
    useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
    useEffect(() => { appliedFiltersRef.current = appliedFilters; }, [appliedFilters]);

    const isFirstMount = useRef(true);

    /* ── MOUNT ── */
    useEffect(() => {
        fetchUsers(); fetchSources(); fetchPurposes(); fetchCities();
    }, []);


    const handleMenuPress = (event) => {
        event.target.measureInWindow((x, y, width, height) => {
            setMenuPosition({
                top: y + height + 3,   // 👇 icon ke niche
                right: 12              // 👈 screen se gap
            });
            setMenuVisible(true);
        });
    };

    /* ── PAGE / FILTER CHANGE ── */
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            // fetchLeads(1, {}, true);
            return;
        }
        fetchLeads(page, appliedFilters, page === 1);
    }, [page, appliedFilters]);


    const fetchUserTypeAndLeads = useCallback(async () => {
        try {
            const userId = await AsyncStorage.getItem('id');
            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId })
            });
            const result = await res.json();

            let type = '';
            if (result.code == 200 && result.payload.length > 0) {
                type = result.payload[0].user_type;
                setUserType(type);
                userTypeRef.current = type; // ref turant update
            }

            // ✅ Leads tabhi fetch karo jab userType confirm ho gaya
            setPage(1);
            fetchLeads(1, appliedFiltersRef.current, true);

        } catch (e) {
            setUserType(''); // ✅ empty string = loaded but unknown
            fetchLeads(1, appliedFiltersRef.current, true);
        }
    }, [fetchLeads]);

    useFocusEffect(
        useCallback(() => {
            fetchUserTypeAndLeads();
        }, [])
    );

    /* ── API ── */
    const fetchUsers = async () => { try { const r = await (await fetch(API.list_user)).json(); if (r.code == 200) { setUsers(r.payload); setFilteredUsers(r.payload); } } catch (_) { } };
    const fetchSources = async () => { try { const r = await (await fetch(API.list_source)).json(); if (r.code == 200) setSources(r.payload || []); } catch (_) { } };
    const fetchPurposes = async () => { try { const r = await (await fetch(API.list_purpose)).json(); if (r.code == 200) setPurposes(r.payload || []); } catch (_) { } };
    const fetchCities = async () => { try { const r = await (await fetch(API.city_list)).json(); if (r.code == 200) setCities(r.payload || []); } catch (_) { } };

    /* ── BUILD REQUEST BODY ── */
    const buildBody = useCallback(async (pg, filters, userId) => {
        const loginId = await AsyncStorage.getItem('id');
        const type = userTypeRef.current?.trim();
        console.log('Building body with userId:', userId, 'loginId:', loginId, 'type:', type);
        const fmt = (start, end) => {
            if (!start) return undefined;
            const s = toApiDate(start), e = toApiDate(end || start);
            return s === e ? s : `${s} to ${e}`;
        };
        // const body = { page: pg, id: userId || '', status: 'pending' };
        const body = {
            page: pg,
            id: type === 'Sales-Person' ? loginId : (userId || ''),
            status: 'pending'
        };
        const dr = fmt(filters.dateStart, filters.dateEnd);
        if (dr) body.date = dr;
        if (filters.name) body.name = filters.name;
        if (filters.mobile) body.mobile = filters.mobile;
        if (filters.source) body.source = filters.source;
        if (filters.purpose) body.purpose = filters.purpose;

        if (filters.city) body.city = filters.city;
        const e1 = fmt(filters.event1Start, filters.event1End);
        if (e1) body.function_date = e1;
        const e2 = fmt(filters.event2Start, filters.event2End);
        if (e2) body.function_datetwo = e2;
        return body;
    }, []);

    /* ── FETCH LEADS (paginated) ── */
    const fetchLeads = useCallback(async (pg, filters, reset = false) => {
        if (reset) setLoading(true); else setLoadingMore(true);
        try {
            const body = await buildBody(pg, filters, selectedUserRef.current?.id);
            const res = await fetch(API.list_lead, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const json = await res.json();
            if (json.code == 200) {
                const payload = json.payload || [];
                if (payload.length > 0) {
                    setHasDataEverLoaded(true); // 🔥 important
                }
                if (reset) setLeads(payload); else setLeads(prev => [...prev, ...payload]);
                setHasMore(payload.length >= 50);
            } else {
                if (reset) setLeads([]);
                setHasMore(false);
            }
        } catch (_) {
            if (reset) setLeads([]);
            setHasMore(false);
        } finally {
            setLoading(false); setLoadingMore(false); setInitialLoad(false);
        }
    }, [buildBody]);

    /* ── FETCH ALL PAGES FOR PDF ── */
    const fetchAllLeadsForPdf = useCallback(async () => {
        let all = [], pg = 1, more = true;
        while (more) {
            try {
                const body = await buildBody(pg, appliedFiltersRef.current, selectedUserRef.current?.id);
                const res = await fetch(API.list_lead, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                const json = await res.json();
                if (json.code == 200 && json.payload?.length > 0) {
                    all = [...all, ...json.payload];
                    more = json.payload.length >= 50;   // keep going if full page returned
                    pg++;
                } else { more = false; }
            } catch (_) { more = false; }
        }
        return all;
    }, [buildBody]);

    /* ── STAFF ── */
    const handleStaffSearch = useCallback(t => {
        setStaffSearch(t);
        setFilteredUsers(users.filter(u => (u.user_name || u.name || '').toLowerCase().includes(t.toLowerCase())));
    }, [users]);

    const handleStaffSelect = useCallback(item => {
        setSelectedUser(item);
        selectedUserRef.current = item;
        setStaffModal(false); setStaffSearch(''); setPage(1);
        fetchLeads(1, appliedFiltersRef.current, true);
    }, [fetchLeads]);

    /* ── FILTERS ── */
    const applyFilters = useCallback(() => {
        setFilterModal(false); setPage(1);
        setAppliedFilters({
            dateStart: fDateStart, dateEnd: fDateEnd,
            name: fName, mobile: fMobile,
            source: fSource?.source_name || '',
            purpose: fPurpose?.purpose_name || '',
            status: fStatus?.value || '',
            city: fCity?.city_id ? String(fCity.city_id) : '',
            event1Start: fEvent1Start, event1End: fEvent1End,
            event2Start: fEvent2Start, event2End: fEvent2End,
        });
    }, [fDateStart, fDateEnd, fName, fMobile, fSource, fPurpose, fStatus, fCity, fEvent1Start, fEvent1End, fEvent2Start, fEvent2End]);

    const clearFilters = useCallback(() => {
        setFDateStart(null); setFDateEnd(null); setFName(''); setFMobile('');
        setFSource(null); setFPurpose(null); setFStatus(null); setFCity(null);
        setFEvent1Start(null); setFEvent1End(null); setFEvent2Start(null); setFEvent2End(null);
        setFilterModal(false); setPage(1); setAppliedFilters({});
    }, []);

    const handleEndReached = useCallback(() => {
        if (!loadingMore && hasMore && !loading) setPage(prev => prev + 1);
    }, [loadingMore, hasMore, loading]);

    const activeFilterCount = useMemo(() => {
        const f = appliedFilters;
        return [f.dateStart, f.name, f.mobile, f.source, f.purpose, f.status, f.city, f.event1Start, f.event2Start].filter(Boolean).length;
    }, [appliedFilters]);

    /* ── DELETE ── */
    const handleDelete = useCallback(lead => { setDeleteLead(lead); setDeleteModal(true); }, []);

    const confirmDelete = useCallback(async () => {
        if (!deleteLead) return;
        setDeletingId(deleteLead.enquiry_id);
        try {
            const res = await fetch(API.delete_lead, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enquiry_id: String(deleteLead.enquiry_id) })
            });
            const json = await res.json();
            if (json.code == 200) {
                Toast.show({ type: 'success', text1: 'Lead Deleted', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
                setLeads(prev => prev.filter(l => l.enquiry_id !== deleteLead.enquiry_id));
            } else {
                Toast.show({ type: 'error', text1: json.message || 'Delete failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setDeletingId(null); setDeleteModal(false); setDeleteLead(null); }
    }, [deleteLead]);

    /* ── PDF EXPORT (fetches ALL pages then generates PDF) ── */
    const generateLeadsPdf = useCallback(async () => {
        setMenuVisible(false);
        setExportingPdf(true);
        Toast.show({ type: 'info', text1: 'Fetching pending leads…', position: 'bottom', bottomOffset: 60, visibilityTime: 3000 });

        try {
            const data = await fetchAllLeadsForPdf();
            if (!data.length) {
                Toast.show({ type: 'error', text1: 'No data to export', position: 'bottom', bottomOffset: 60 });
                return;
            }

            const now = new Date();
            const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;

            const rowsHtml = data.map((item, idx) => `
                <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8fafc'}">
                  <td style="text-align:center">${idx + 1}</td>
                  <td>${formatDate(item.created_at)}</td>
                  <td>${item.name || '---'}</td>
                  <td>${item.mobile || '---'}</td>
                  <td>${item.source || '---'}</td>
                  <td>${item.purpose || '---'}</td>
                  <td>${item.status || '---'}</td>
                  <td>${item.city_name || '---'}</td>
                  <td>${formatDate(item.event_date)}</td>
                  <td>${formatDate(item.event_date2)}</td>
                  <td>${item.lead_type || '---'}</td>
                  <td>${item.remark || '---'}</td>
                  <td>${formatDateTime(item.created_at)}</td>
                </tr>`).join('');

            const htmlContent = `
<html><head><style>
  body{font-family:Helvetica,Arial,sans-serif;font-size:8px;padding:12px;color:#000}
  h2{text-align:center;font-size:13px;margin-bottom:3px}
  .sub{text-align:center;font-size:9px;color:#666;margin-bottom:14px}
  table{width:100%;border-collapse:collapse}
  th{background:#1e3a5f;color:#fff;padding:5px 3px;font-size:8px;text-align:left;border:1px solid #1e3a5f}
  td{padding:4px 3px;border:1px solid #e2e8f0;font-size:7px;vertical-align:top;word-break:break-word}
  .foot{margin-top:10px;text-align:right;font-size:8px;color:#888}
</style></head><body>
  <h2>Pending Leads Report</h2>
  <div class="sub">Generated on ${fmtDisplay(now)} &nbsp;|&nbsp; Total: ${data.length} leads</div>
  <table>
    <tr>
      <th>#</th><th>Date</th><th>Name</th><th>Mobile</th><th>Source</th>
      <th>Purpose</th><th>Status</th><th>City</th><th>Event 1</th>
      <th>Event 2</th><th>Lead Type</th><th>Remark</th><th>Entry Date</th>
    </tr>
    ${rowsHtml}
  </table>
  <div class="foot">Total Records: ${data.length}</div>
</body></html>`;

            const file = await RNHTMLtoPDF.convert({
                html: htmlContent,
                fileName: `AllLeads_${dateStr}`,
                directory: 'Documents', // ✅ correct
            });

            navigation.navigate('PdfViewerScreen', {
                pdfUrl: file.filePath,
                billNo: `Leads_${dateStr}`,
            });
        } catch (e) {
            console.log('PDF error FULL:', JSON.stringify(e, null, 2));
            Toast.show({ type: 'error', text1: 'PDF generation failed', position: 'bottom', bottomOffset: 60 });
        } finally { setExportingPdf(false); }
    }, [fetchAllLeadsForPdf, navigation]);


    const generateLeadsExcel = useCallback(async () => {
        setMenuVisible(false);
        setExportingExcel(true);
        Toast.show({ type: 'info', text1: 'Fetching all leads…', position: 'bottom', bottomOffset: 60, visibilityTime: 3000 });

        try {
            const data = await fetchAllLeadsForPdf();
            if (!data.length) {
                Toast.show({ type: 'error', text1: 'No data to export', position: 'bottom', bottomOffset: 60 });
                return;
            }

            // Excel ke liye data prepare karo
            const excelData = data.map((item, idx) => ({
                '#': idx + 1,
                'Date': formatDate(item.created_at),
                'Name': item.name || '---',
                'Mobile': item.mobile || '---',
                'Source': item.source || '---',
                'Purpose': item.purpose || '---',
                'Status': item.status || '---',
                'City': item.city_name || '---',
                'Event 1': formatDate(item.event_date),
                'Event 2': formatDate(item.event_date2),
                'Lead Type': item.lead_type || '---',
                'Remark': item.remark || '---',
                'Entry Date': formatDateTime(item.created_at),
            }));

            // Workbook banao
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'All Leads');

            // Column width set karo
            ws['!cols'] = [
                { wch: 5 },   // #
                { wch: 12 },  // Date
                { wch: 20 },  // Name
                { wch: 14 },  // Mobile
                { wch: 15 },  // Source
                { wch: 15 },  // Purpose
                { wch: 20 },  // Status
                { wch: 12 },  // City
                { wch: 12 },  // Event 1
                { wch: 12 },  // Event 2
                { wch: 10 },  // Lead Type
                { wch: 25 },  // Remark
                { wch: 18 },  // Entry Date
            ];

            // Base64 string mein convert karo
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            // File save karo
            const now = new Date();
            const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
            const fileName = `All_leads_${dateStr}.xlsx`;
            const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            await RNFS.writeFile(filePath, wbout, 'base64');

            Toast.show({
                type: 'success',
                text1: '✅ Excel Downloaded!',
                text2: `Saved: ${fileName}`,
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 3000,
            });

        } catch (e) {
            console.log('Excel error:', e);
            Toast.show({ type: 'error', text1: 'Excel generation failed', position: 'bottom', bottomOffset: 60 });
        } finally {
            setExportingExcel(false);
        }
    }, [fetchAllLeadsForPdf]);

    /* ── ROW CALLBACKS (stable refs so TableRow memo works) ── */
    const handleEye = useCallback(item => {
        setSelectedLead(item); setStatusModalVisible(true);
    }, []);

    const handleDotPress = useCallback((item, evt) => {
        evt.target.measureInWindow((x, y, w, h) => {
            setDotMenuPos({ top: y + h, right: 16 });
            setSelectedLead(item);
            setDotMenuVisible(true);
        });
    }, []);

    /* ── renderItem — useCallback so reference stays stable between renders ── */
    const renderRow = useCallback(({ item, index }) => (
        <TableRow
            item={item}
            index={index}
            isDeleting={deletingId === item.enquiry_id}
            navigation={navigation}
            onEye={() => handleEye(item)}
            onDot={evt => handleDotPress(item, evt)}
        />
    ), [deletingId, handleEye, handleDotPress]);

    const keyExtractor = useCallback(item => String(item.enquiry_id), []);

    const ListEmpty = useMemo(() => (
        !loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <Icon name="clipboard-text-off-outline" size={40} color="#cbd5e1" />
                <Text style={{ color: '#94a3b8', fontFamily: Fonts.Regular, marginTop: 8 }}>No leads found</Text>
            </View>
        ) : null
    ), [loading]);

    const ListFooter = useMemo(() => (
        loadingMore ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
                <ActivityIndicator color={Colors.buttonbgcolor} size="small" />
            </View>
        ) : null
    ), [loadingMore]);

    /* ─────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────── */
    const type = userType?.trim();
    return (
        <PaperProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
                <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

                {/* HEADER */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Pending Leads</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* <TouchableOpacity onPress={() => setFilterModal(true)} style={s.filterIconWrap}>
                            <Icon name="tune-variant" size={22} color="#fff" />
                            {activeFilterCount > 0 && (
                                <View style={s.filterBadge}>
                                    <Text style={s.filterBadgeTxt}>{activeFilterCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity> */}
                        <TouchableOpacity onPress={handleMenuPress} disabled={!hasLeads}
                            style={!hasLeads && { opacity: 0.4 }}>
                            <Icon name="dots-vertical" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* STAFF SELECTOR */}
                {userType !== null && type !== 'Sales-Person' && (
                    <TouchableOpacity style={s.staffBtn} onPress={() => setStaffModal(true)}>
                        <Icon name="account-outline" size={18} color={Colors.buttonbgcolor} />
                        <Text style={s.staffBtnTxt} numberOfLines={1}>
                            {selectedUser ? (selectedUser.user_name || selectedUser.name) : 'All Staff'}
                        </Text>
                        <Icon name="chevron-down" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                )}

                {/* TABLE */}
                {initialLoad ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={Colors.buttonbgcolor} size="large" />
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        <View>
                            <View style={s.tableHeader}>
                                {TABLE_COLS.map(col => (
                                    <View key={col.key} style={[s.headerCell, { width: col.width }]}>
                                        <Text style={s.headerCellText}>{col.label}</Text>
                                    </View>
                                ))}
                            </View>
                            <FlatList
                                data={leads}
                                keyExtractor={keyExtractor}
                                renderItem={renderRow}
                                onEndReached={handleEndReached}
                                onEndReachedThreshold={0.3}
                                nestedScrollEnabled
                                removeClippedSubviews
                                windowSize={10}
                                maxToRenderPerBatch={20}
                                updateCellsBatchingPeriod={50}
                                initialNumToRender={20}
                                ListEmptyComponent={ListEmpty}
                                ListFooterComponent={ListFooter}
                            />
                        </View>
                    </ScrollView>
                )}

                {/* ── STAFF MODAL ── */}
                <Modal transparent visible={staffModal} animationType="fade">
                    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setStaffModal(false)}>
                        <View style={s.modalCard} onStartShouldSetResponder={() => true}>
                            <Text style={s.modalTitle}>Select Staff</Text>
                            <TouchableOpacity style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                zIndex: 10,
                                padding: 6,
                            }} onPress={() => setStaffModal(false)}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                            <View style={s.searchRow}>
                                <Icon name="magnify" size={18} color="#94a3b8" />
                                <TextInput value={staffSearch} onChangeText={handleStaffSearch}
                                    placeholder="Search staff..." placeholderTextColor="#94a3b8" style={s.searchInput} />
                            </View>
                            <FlatList
                                data={filteredUsers}
                                keyExtractor={item => String(item.id)}
                                style={{ maxHeight: 340 }}
                                keyboardShouldPersistTaps="handled"
                                ListHeaderComponent={
                                    <TouchableOpacity
                                        onPress={() => { setSelectedUser(null); selectedUserRef.current = null; setStaffModal(false); setPage(1); fetchLeads(1, appliedFiltersRef.current, true); }}
                                        style={[s.mItem, !selectedUser && s.mItemSel]}>
                                        <Text style={[s.mItemTxt, !selectedUser && s.mItemTxtSel]}>All Staff</Text>
                                        {!selectedUser && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                }
                                renderItem={({ item }) => {
                                    const sel = selectedUser?.id === item.id;
                                    return (
                                        <TouchableOpacity onPress={() => handleStaffSelect(item)} style={[s.mItem, sel && s.mItemSel]}>
                                            <Text style={[s.mItemTxt, sel && s.mItemTxtSel]}>{item.user_name || item.name}</Text>
                                            {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    <View style={{ alignItems: 'center', padding: 20 }}>
                                        <Text style={{ fontSize: 13, color: '#94a3b8', fontFamily: Fonts.Regular }}>No staff found</Text>
                                    </View>
                                }
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* ── FILTER MODAL ── */}
                <Modal transparent visible={filterModal} animationType="slide">
                    <View style={s.filterOverlay}>
                        <View style={s.filterSheet}>
                            <View style={s.filterHeader}>
                                <Text style={s.filterHeaderTitle}>Filters</Text>
                                <TouchableOpacity onPress={() => setFilterModal(false)}>
                                    <Icon name="close" size={22} color="#1e293b" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
                                <DateRangeField label="Date Range" startDate={fDateStart} endDate={fDateEnd} onChange={(sd, ed) => { setFDateStart(sd); setFDateEnd(ed); }} />
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.filterLabel}>Name</Text>
                                    <TextInput value={fName} onChangeText={setFName} placeholder="Search by name" placeholderTextColor="#999" style={s.filterInput} />
                                </View>
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.filterLabel}>Mobile</Text>
                                    <TextInput value={fMobile} onChangeText={setFMobile} maxLength={10} placeholder="Search by mobile" placeholderTextColor="#999" keyboardType="phone-pad" style={s.filterInput} />
                                </View>
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.filterLabel}>Source</Text>
                                    <TouchableOpacity style={s.filterDropdown} onPress={() => setSourceModal(true)}>
                                        <Text style={[s.filterDropdownTxt, !fSource && { color: '#999' }]}>{fSource?.source_name || 'Select Source'}</Text>
                                        <Icon name="chevron-down" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.filterLabel}>Purpose</Text>
                                    <TouchableOpacity style={s.filterDropdown} onPress={() => setPurposeModal(true)}>
                                        <Text style={[s.filterDropdownTxt, !fPurpose && { color: '#999' }]}>{fPurpose?.purpose_name || 'Select Purpose'}</Text>
                                        <Icon name="chevron-down" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.filterLabel}>Status</Text>
                                    <TouchableOpacity style={s.filterDropdown} onPress={() => setStatusPickerVisible(true)}>
                                        <Text style={[s.filterDropdownTxt, !fStatus && { color: '#999' }]}>{fStatus?.label || 'Select Status'}</Text>
                                        <Icon name="chevron-down" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.filterLabel}>City</Text>
                                    <TouchableOpacity style={s.filterDropdown} onPress={() => setCityModal(true)}>
                                        <Text style={[s.filterDropdownTxt, !fCity && { color: '#999' }]}>{fCity?.city_name || 'Select Branch'}</Text>
                                        <Icon name="chevron-down" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                                <DateRangeField label="Event 1 Date Range" startDate={fEvent1Start} endDate={fEvent1End} onChange={(sd, ed) => { setFEvent1Start(sd); setFEvent1End(ed); }} />
                                <DateRangeField label="Event 2 Date Range" startDate={fEvent2Start} endDate={fEvent2End} onChange={(sd, ed) => { setFEvent2Start(sd); setFEvent2End(ed); }} />
                            </ScrollView>
                            <View style={s.filterActions}>
                                <TouchableOpacity style={s.clearBtn} onPress={clearFilters}>
                                    <Text style={s.clearBtnTxt}>Clear</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.applyBtn} onPress={applyFilters}>
                                    <Text style={s.applyBtnTxt}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ── TOP MENU (PDF Export) ── */}
                <Modal transparent visible={menuVisible} animationType="fade">
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setMenuVisible(false)}
                    >
                        <View
                            style={{
                                position: 'absolute',
                                top: menuPosition.top,
                                right: menuPosition.right,
                                backgroundColor: '#fff',
                                borderRadius: 10,
                                elevation: 6,
                                shadowColor: '#000',
                                shadowOpacity: 0.2,
                                shadowRadius: 5,
                                width: 150,
                                paddingVertical: 6
                            }}
                        >
                            {/* ✅ YE NAYA BUTTON ADD KARO */}
                            <TouchableOpacity
                                onPress={generateLeadsExcel}
                                style={[menuS.item, { borderBottomWidth: 0 }]}
                                disabled={exportingExcel}
                            >
                                {exportingExcel
                                    ? <ActivityIndicator size="small" color="#16a34a" />
                                    : <Icon name="file-excel-box" size={18} color="#16a34a" />
                                }
                                <Text style={[menuS.text, { color: '#16a34a' }]}>
                                    {exportingExcel ? 'Generating…' : 'Export Excel'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={generateLeadsPdf}
                                style={menuS.item}
                                disabled={exportingPdf}
                            >
                                {exportingPdf
                                    ? <ActivityIndicator size="small" color="#dc2626" />
                                    : <Icon name="file-pdf-box" size={18} color="#dc2626" />
                                }
                                <Text style={menuS.text}>
                                    {exportingPdf ? 'Generating…' : 'Export PDF'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* ── ROW DOT MENU (Edit / Delete) ── */}
                <Modal transparent visible={dotMenuVisible} animationType="fade">
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDotMenuVisible(false)}>
                        <View style={{ position: 'absolute', top: dotMenuPos.top, right: dotMenuPos.right, backgroundColor: '#fff', borderRadius: 8, elevation: 5, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, width: 130, paddingVertical: 4 }}>
                            <TouchableOpacity onPress={() => { setDotMenuVisible(false); navigation.navigate('AddLeads', { lead: selectedLead, isEdit: true }); }} style={menuS.item}>
                                <Icon name="pencil-outline" size={17} color="#2563eb" />
                                <Text style={menuS.text}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setDotMenuVisible(false); handleDelete(selectedLead); }} style={[menuS.item, { borderBottomWidth: 0 }]}>
                                <Icon name="trash-can-outline" size={17} color="#dc2626" />
                                <Text style={[menuS.text, { color: '#dc2626' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* ── STATUS HISTORY MODAL ── */}
                <StatusHistoryModal visible={statusModalVisible} onClose={() => setStatusModalVisible(false)} item={selectedLead} />

                {/* ── FILTER PICKERS ── */}
                <PickerModal visible={sourceModal} onClose={() => setSourceModal(false)} title="Select Source" data={sources} selected={fSource?.source_id} onSelect={setFSource} keyField="source_id" labelField="source_name" />
                <PickerModal visible={purposeModal} onClose={() => setPurposeModal(false)} title="Select Purpose" data={purposes} selected={fPurpose?.purpose_id} onSelect={setFPurpose} keyField="purpose_id" labelField="purpose_name" />
                <PickerModal visible={statusPickerVisible} onClose={() => setStatusPickerVisible(false)} title="Select Status" data={STATUS_OPTIONS} selected={fStatus?.value} onSelect={setFStatus} keyField="value" labelField="label" searchEnabled={false} />
                <PickerModal visible={cityModal} onClose={() => setCityModal(false)} title="Select Branch" data={cities} selected={fCity?.city_id} onSelect={setFCity} keyField="city_id" labelField="city_name" />

                {/* ── DELETE CONFIRM MODAL ── */}
                <Modal visible={deleteModal} transparent animationType="fade">
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                        activeOpacity={1} onPress={() => setDeleteModal(false)}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 22, width: '85%', alignItems: 'center' }} onStartShouldSetResponder={() => true}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                                <Icon name="trash-can-outline" size={28} color="#ef4444" />
                            </View>
                            <Text style={{ fontSize: 16, fontFamily: Fonts.Bold, color: '#1e293b', marginBottom: 6 }}>Delete Lead</Text>
                            <Text style={{ fontSize: 13, fontFamily: Fonts.Regular, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
                                Are you sure you want to delete{' '}
                                <Text style={{ fontFamily: Fonts.Bold, color: '#0f172a' }}>"{deleteLead?.name || 'this lead'}"</Text>?
                            </Text>
                            <View style={{ flexDirection: 'row', width: '100%' }}>
                                <TouchableOpacity onPress={() => setDeleteModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, marginRight: 5, alignItems: 'center' }}>
                                    <Text style={{ fontFamily: Fonts.Bold, color: '#475569' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={confirmDelete} style={{ flex: 1, backgroundColor: '#ef4444', padding: 12, borderRadius: 10, marginLeft: 5, alignItems: 'center' }}>
                                    {deletingId === deleteLead?.enquiry_id
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={{ color: '#fff', fontFamily: Fonts.Bold }}>Delete</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>

            </SafeAreaView>
        </PaperProvider>
    );
};

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const s = StyleSheet.create({
    header: { height: 50, backgroundColor: Colors.buttonbgcolor, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    headerTitle: { color: '#fff', fontSize: 16, fontFamily: Fonts.Bold },
    filterIconWrap: { position: 'relative', padding: 2 },
    filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#f59e0b', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
    filterBadgeTxt: { color: '#fff', fontSize: 10, fontFamily: Fonts.Bold },
    staffBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 8, borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    staffBtnTxt: { flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    tableHeader: { flexDirection: 'row', backgroundColor: Colors.buttonbgcolor, paddingVertical: 10 },
    headerCell: { justifyContent: 'center', paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.2)' },
    headerCellText: { color: '#fff', fontSize: 12, fontFamily: Fonts.Bold },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
    rowEven: { backgroundColor: '#fff' },
    rowOdd: { backgroundColor: '#f8fafc' },
    cell: { justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 10, borderRightWidth: 0.5, borderRightColor: '#f1f5f9' },
    cellText: { fontSize: 12, fontFamily: Fonts.Regular, color: '#334155' },
    statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
    statusText: { fontSize: 11, fontFamily: Fonts.Bold },
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
    filterInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, height: 44, paddingHorizontal: 12, backgroundColor: '#f8fafc', fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    filterDropdown: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, height: 44, paddingHorizontal: 12, backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    filterDropdownTxt: { flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    dateBtn: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, height: 44, paddingHorizontal: 12, backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateBtnTxt: { flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    filterActions: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
    clearBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.buttonbgcolor },
    clearBtnTxt: { fontSize: 14, fontFamily: Fonts.Bold, color: Colors.buttonbgcolor },
    applyBtn: { flex: 2, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.buttonbgcolor },
    applyBtnTxt: { fontSize: 14, fontFamily: Fonts.Bold, color: '#fff' },
});

const menuS = StyleSheet.create({
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    text: { fontSize: 13, color: '#1e293b', fontFamily: Fonts.Regular },
});

const sm = StyleSheet.create({
    formCard: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
    formTitle: { fontSize: 14, fontFamily: Fonts.Bold, color: '#1e293b', marginBottom: 4 },
    dropdown: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, height: 44, paddingHorizontal: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dropdownTxt: { flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    notesInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, backgroundColor: '#fff', fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b', textAlignVertical: 'top', minHeight: 80 },
    errTxt: { color: 'red', fontSize: 11, fontFamily: Fonts.Regular, marginTop: 3 },
    saveBtn: { backgroundColor: Colors.buttonbgcolor, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
    saveBtnTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.Bold },
    historyTitle: { fontSize: 14, fontFamily: Fonts.Bold, color: '#1e293b', marginBottom: 10 },
    historyItem: { flexDirection: 'row', gap: 12, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.buttonbgcolor, marginTop: 4 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    badgeTxt: { fontSize: 11, fontFamily: Fonts.Bold },
    historyDate: { fontSize: 11, fontFamily: Fonts.Regular, color: '#94a3b8' },
    historyNote: { fontSize: 12, fontFamily: Fonts.Regular, color: '#475569', marginTop: 4 },
    historyDateBadge: { marginTop: 6, backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    historyDateBadgeTxt: { fontSize: 11, fontFamily: Fonts.Regular, color: '#64748b' },
});

export default PendingLeadList;

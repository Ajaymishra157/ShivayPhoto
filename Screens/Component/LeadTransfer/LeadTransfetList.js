import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Modal, FlatList, StyleSheet, ScrollView,
    SafeAreaView, StatusBar
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { DatePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider } from 'react-native-paper';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import { useFocusEffect } from '@react-navigation/native';

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
const STATUS_OPTIONS = [
    { label: 'Pending / Pre Enquiry', value: 'Pending' },
    { label: 'Unresponsive', value: 'Unresponsive' },
    { label: 'Follow-up', value: 'Follow-up' },
    { label: 'Quotation Sent / Meeting Lined Up', value: 'Quotation Sent' },
    { label: 'Converted to Client', value: 'Converted to Client' },
    { label: 'End', value: 'End' },
];

const TABLE_COLS = [
    { key: 'check', label: '', width: 46 },
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

/* ── Helpers ── */
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
   TABLE ROW
───────────────────────────────────────────── */
const TableRow = React.memo(({ item, index, isChecked, onToggle }) => {
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

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggle}
            style={[s.tableRow, index % 2 === 0 ? s.rowEven : s.rowOdd, isChecked && s.rowChecked]}
        >
            {TABLE_COLS.map(col => {
                if (col.key === 'check') {
                    return (
                        <View key="check" style={[s.cell, { width: col.width, alignItems: 'center', justifyContent: 'center' }]}>
                            <CheckBox
                                value={isChecked}
                                onValueChange={onToggle}
                                tintColors={{ true: Colors.buttonbgcolor, false: '#94a3b8' }}
                                style={{ transform: [{ scale: 0.9 }] }}
                            />
                        </View>
                    );
                }
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
                return (
                    <View key={col.key} style={[s.cell, { width: col.width }]}>
                        <Text style={s.cellText} numberOfLines={2}>{cellVal(col.key)}</Text>
                    </View>
                );
            })}
        </TouchableOpacity>
    );
}, (prev, next) =>
    prev.item === next.item &&
    prev.index === next.index &&
    prev.isChecked === next.isChecked
);

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
const LeadTransferList = ({ navigation }) => {

    /* From staff */
    const [fromStaffs, setFromStaffs] = useState([]);
    const [selectedFrom, setSelectedFrom] = useState(null);
    const [fromModal, setFromModal] = useState(false);

    /* To staff */
    const [toStaffs, setToStaffs] = useState([]);
    const [selectedTo, setSelectedTo] = useState(null);
    const [toModal, setToModal] = useState(false);

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

    /* Leads */
    const [leads, setLeads] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    /* Selection */
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectAllPages, setSelectAllPages] = useState(false);
    const [transferring, setTransferring] = useState(false);

    /* Transfer confirm modal */
    const [transferModal, setTransferModal] = useState(false);

    const [fromSearch, setFromSearch] = useState('');
    const [toSearch, setToSearch] = useState('');


    const selectedFromRef = useRef(selectedFrom);
    const appliedFiltersRef = useRef(appliedFilters);
    useEffect(() => { selectedFromRef.current = selectedFrom; }, [selectedFrom]);
    useEffect(() => { appliedFiltersRef.current = appliedFilters; }, [appliedFilters]);

    const isFirstMount = useRef(true);

    /* ── MOUNT ── */
    useEffect(() => {
        fetchFromStaffs();
        fetchToStaffs();
        fetchSources();
        fetchPurposes();
        fetchCities();
    }, []);

    useFocusEffect(
        useCallback(() => {
            setPage(1);
            fetchLeads(1, appliedFiltersRef.current, true);
        }, [])
    );

    const filteredFromStaffs = useMemo(() => {
        if (!fromSearch.trim()) return fromStaffs;

        return fromStaffs.filter(item =>
            (item.user_name || '')
                .toLowerCase()
                .includes(fromSearch.toLowerCase())
        );
    }, [fromStaffs, fromSearch]);

    const filteredToStaffs = useMemo(() => {
        let list = toStaffs;

        // Remove selected "From"
        if (selectedFrom) {
            list = list.filter(item => item.id !== selectedFrom.id);
        }

        // Search filter
        if (toSearch.trim()) {
            list = list.filter(item =>
                (item.user_name || item.name || '')
                    .toLowerCase()
                    .includes(toSearch.toLowerCase())
            );
        }

        return list;
    }, [toStaffs, selectedFrom, toSearch]);



    /* ── PAGE / FILTER CHANGE ── */
    useEffect(() => {
        if (isFirstMount.current) { isFirstMount.current = false; return; }
        fetchLeads(page, appliedFilters, page === 1);
    }, [page, appliedFilters]);

    /* ── APIs ── */
    const fetchFromStaffs = async () => {
        try {
            const r = await (await fetch(API.list_staff)).json();
            if (r.code == 200) setFromStaffs(r.payload || []);
        } catch (_) { }
    };

    const fetchToStaffs = async () => {
        try {
            const r = await (await fetch(API.list_user)).json();
            if (r.code == 200) setToStaffs(r.payload || []);
        } catch (_) { }
    };

    const fetchSources = async () => { try { const r = await (await fetch(API.list_source)).json(); if (r.code == 200) setSources(r.payload || []); } catch (_) { } };
    const fetchPurposes = async () => { try { const r = await (await fetch(API.list_purpose)).json(); if (r.code == 200) setPurposes(r.payload || []); } catch (_) { } };
    const fetchCities = async () => { try { const r = await (await fetch(API.city_list)).json(); if (r.code == 200) setCities(r.payload || []); } catch (_) { } };

    /* ── BUILD REQUEST BODY ── */
    const buildBody = useCallback((pg, filters, fromId) => {
        const fmt = (start, end) => {
            if (!start) return undefined;
            const s = toApiDate(start), e = toApiDate(end || start);
            return s === e ? s : `${s} to ${e}`;
        };
        const body = { page: pg, id: fromId || '' };
        const dr = fmt(filters.dateStart, filters.dateEnd);
        if (dr) body.date = dr;
        if (filters.name) body.name = filters.name;
        if (filters.mobile) body.mobile = filters.mobile;
        if (filters.source) body.source = filters.source;
        if (filters.purpose) body.purpose = filters.purpose;
        if (filters.status) body.status = filters.status;
        if (filters.city) body.city = filters.city;
        const e1 = fmt(filters.event1Start, filters.event1End);
        if (e1) body.function_date = e1;
        const e2 = fmt(filters.event2Start, filters.event2End);
        if (e2) body.function_datetwo = e2;
        return body;
    }, []);

    /* ── FETCH LEADS ── */
    const fetchLeads = useCallback(async (pg, filters, reset = false) => {
        if (reset) setLoading(true); else setLoadingMore(true);
        try {
            const body = buildBody(pg, filters, selectedFromRef.current?.id);
            const res = await fetch(API.list_lead_transfer, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.code == 200) {
                const payload = json.payload || [];
                if (reset) { setLeads(payload); setSelectedIds(new Set()); }
                else setLeads(prev => [...prev, ...payload]);
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

    /* ── FROM STAFF SELECT ── */
    const handleFromSelect = useCallback((item) => {
        setSelectedFrom(item);
        selectedFromRef.current = item;
        setFromModal(false);
        setPage(1);
        setSelectedIds(new Set());
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

    /* ── CHECKBOX LOGIC ── */
    const toggleCheck = useCallback((id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const allChecked = leads.length > 0 && leads.every(l => selectedIds.has(l.enquiry_id));

    const toggleAll = useCallback(() => {
        const allIds = leads.map(l => l.enquiry_id);
        const allSelected = allIds.every(id => selectedIds.has(id));
        if (allSelected) {
            setSelectedIds(new Set());
            setSelectAllPages(false); // ← ADD
        } else {
            setSelectedIds(new Set(allIds));
            setSelectAllPages(false); // ← ADD (banner fresh dikhega)
        }
    }, [leads, selectedIds]);

    /* ── TRANSFER ── */
    const handleTransferPress = () => {
        if (!selectedTo) {
            Toast.show({ type: 'error', text1: 'Please select "To" staff', position: 'bottom', bottomOffset: 60 });
            return;
        }
        if (!selectAllPages && selectedIds.size === 0) { // ← selectAllPages check add karo
            Toast.show({ type: 'error', text1: 'Please select at least one lead', position: 'bottom', bottomOffset: 60 });
            return;
        }
        setTransferModal(true);
    };

    const confirmTransfer = useCallback(async () => {
        setTransferModal(false);
        setTransferring(true);
        try {
            let allIds = Array.from(selectedIds); // already selected IDs

            // Agar selectAllPages true hai to saare pages fetch karo
            if (selectAllPages) {
                Toast.show({ type: 'info', text1: 'All leads are being fetched...', position: 'bottom', bottomOffset: 60, visibilityTime: 60000 });

                let pg = 1;
                let fetchMore = true;
                const collectedIds = [];

                while (fetchMore) {
                    const body = buildBody(pg, appliedFiltersRef.current, selectedFromRef.current?.id);
                    const res = await fetch(API.list_lead_transfer, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                    const json = await res.json();
                    if (json.code == 200 && json.payload?.length > 0) {
                        json.payload.forEach(item => collectedIds.push(item.enquiry_id));
                        fetchMore = json.payload.length >= 50;
                        pg++;
                    } else {
                        fetchMore = false;
                    }
                }
                allIds = collectedIds;
            }

            // Ab ek saath transfer karo
            const body = {
                enquiry_id: allIds,
                added_by: String(selectedTo.id),
            };
            console.log('Transfer body - total IDs:', allIds.length);

            const res = await fetch(API.update_lead_transfer, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.code == 200) {
                Toast.show({ type: 'success', text1: `${allIds.length} leads transferred successfully`, position: 'bottom', bottomOffset: 60, visibilityTime: 2500 });
                setSelectedIds(new Set());
                setSelectAllPages(false);
                setSelectedTo(null);
                fetchLeads(1, appliedFiltersRef.current, true);
            } else {
                Toast.show({ type: 'error', text1: json.message || 'Transfer failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setTransferring(false); }
    }, [selectedIds, selectedTo, selectAllPages, buildBody, fetchLeads]);

    const handleEndReached = useCallback(() => {
        if (!loadingMore && hasMore && !loading) setPage(prev => prev + 1);
    }, [loadingMore, hasMore, loading]);

    const activeFilterCount = useMemo(() => {
        const f = appliedFilters;
        return [f.dateStart, f.name, f.mobile, f.source, f.purpose, f.status, f.city, f.event1Start, f.event2Start].filter(Boolean).length;
    }, [appliedFilters]);

    /* ── renderItem ── */
    const renderRow = useCallback(({ item, index }) => {
        // agar selectAllPages true hai to sab checked dikhao
        const isChecked = selectAllPages ? true : selectedIds.has(item.enquiry_id);
        return (
            <TableRow
                item={item}
                index={index}
                isChecked={isChecked}
                onToggle={() => toggleCheck(item.enquiry_id)}
            />
        );
    }, [selectedIds, toggleCheck, selectAllPages]); // ← selectAllPages add karo dependency mein

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
    return (
        <PaperProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
                <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

                {/* ── HEADER ── */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Lead Transfer</Text>
                    <TouchableOpacity onPress={() => setFilterModal(true)} style={s.filterIconWrap}>
                        <Icon name="tune-variant" size={22} color="#fff" />
                        {activeFilterCount > 0 && (
                            <View style={s.filterBadge}>
                                <Text style={s.filterBadgeTxt}>{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── TRANSFER CARD ── */}
                <View style={s.transferCard}>
                    <View style={s.dropdownGroup}>
                        <Text style={s.dropdownLabel}>From</Text>
                        <TouchableOpacity style={s.transferDropdown} onPress={() => setFromModal(true)}>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.transferDropdownTxt, !selectedFrom && { color: '#999' }]} numberOfLines={1}>
                                    {selectedFrom ? selectedFrom.user_name : 'Select Staff'}
                                </Text>
                                {selectedFrom?.user_type ? (
                                    <Text style={s.dropdownSubTxt}>{selectedFrom.user_type}</Text>
                                ) : null}
                            </View>
                            <Icon name="chevron-down" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <View style={s.arrowWrap}>
                        <Icon name="arrow-right" size={20} color={Colors.buttonbgcolor} />
                    </View>

                    <View style={s.dropdownGroup}>
                        <Text style={s.dropdownLabel}>To</Text>
                        <TouchableOpacity style={s.transferDropdown} onPress={() => setToModal(true)}>
                            <Text style={[s.transferDropdownTxt, !selectedTo && { color: '#999' }]} numberOfLines={1}>
                                {selectedTo ? (selectedTo.user_name || selectedTo.name) : 'Select Staff'}
                            </Text>
                            <Icon name="chevron-down" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[s.transferBtn, (transferring || (!selectAllPages && selectedIds.size === 0)) && { opacity: 0.6 }]}
                        onPress={handleTransferPress}
                        disabled={transferring}
                    >
                        {transferring
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={s.transferBtnTxt}>Transfer</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* ── SELECTED CHIP ── */}
                {/* ── SELECTED CHIP ── */}
                {(selectAllPages || selectedIds.size > 0) && (
                    <View style={s.selectedChip}>
                        <Icon name="check-circle-outline" size={16} color={Colors.buttonbgcolor} />
                        <Text style={s.selectedChipTxt}>
                            {selectAllPages ? 'All leads selected' : `${selectedIds.size} lead(s) selected`}
                        </Text>
                        <TouchableOpacity onPress={() => { setSelectedIds(new Set()); setSelectAllPages(false); }}>
                            <Icon name="close-circle" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── SELECT ALL PAGES BANNER ── */}
                {!selectAllPages && allChecked && hasMore && (
                    <TouchableOpacity
                        style={s.selectAllBanner}
                        onPress={() => setSelectAllPages(true)}
                        activeOpacity={0.8}
                    >
                        <Icon name="information-outline" size={15} color="#1d4ed8" />
                        <Text style={s.selectAllBannerTxt}>
                            Sirf <Text style={{ fontFamily: Fonts.Bold }}>{leads.length}</Text> leads selected.{' '}
                            <Text style={s.selectAllBannerLink}>Select All Leads?</Text>
                        </Text>
                    </TouchableOpacity>
                )}

                {selectAllPages && (
                    <View style={[s.selectAllBanner, { backgroundColor: '#dcfce7' }]}>
                        <Icon name="check-circle" size={15} color="#15803d" />
                        <Text style={[s.selectAllBannerTxt, { color: '#15803d' }]}>
                            All leads are selected.{' '}
                            <Text
                                style={[s.selectAllBannerLink, { color: '#dc2626' }]}
                                onPress={() => { setSelectAllPages(false); setSelectedIds(new Set()); }}
                            >
                                Cancel
                            </Text>
                        </Text>
                    </View>
                )}

                {/* ── TABLE ── */}
                {initialLoad ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={Colors.buttonbgcolor} size="large" />
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        <View>
                            {/* Table Header */}
                            <View style={s.tableHeader}>
                                {TABLE_COLS.map(col => {
                                    if (col.key === 'check') {
                                        return (
                                            <View key="check" style={[s.headerCell, { width: col.width, alignItems: 'center', justifyContent: 'center' }]}>
                                                <CheckBox
                                                    value={allChecked}
                                                    onValueChange={toggleAll}
                                                    tintColors={{ true: '#fff', false: 'rgba(255,255,255,0.7)' }}
                                                    style={{ transform: [{ scale: 0.9 }] }}
                                                />
                                            </View>
                                        );
                                    }
                                    return (
                                        <View key={col.key} style={[s.headerCell, { width: col.width }]}>
                                            <Text style={s.headerCellText}>{col.label}</Text>
                                        </View>
                                    );
                                })}
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

                {/* ── FROM STAFF MODAL ── */}
                <Modal transparent visible={fromModal} animationType="fade">
                    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => { setFromModal(false); setFromSearch(''); }}>
                        <View style={s.modalCard} onStartShouldSetResponder={() => true}>
                            <Text style={s.modalTitle}>Select From Staff</Text>
                            <View style={s.searchRow}>
                                <Icon name="magnify" size={18} color="#94a3b8" />
                                <TextInput
                                    value={fromSearch}
                                    onChangeText={setFromSearch}
                                    placeholder="Search staff..."
                                    placeholderTextColor="#94a3b8"
                                    style={s.searchInput}
                                />
                            </View>
                            <FlatList
                                data={filteredFromStaffs}
                                keyExtractor={item => String(item.id)}
                                style={{ maxHeight: 360 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const sel = selectedFrom?.id === item.id;
                                    return (
                                        <TouchableOpacity onPress={() => {
                                            handleFromSelect(item);
                                            setFromSearch('');
                                        }} style={[s.mItem, sel && s.mItemSel]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[s.mItemTxt, sel && s.mItemTxtSel]}>{item.user_name}</Text>
                                                {!!item.user_type && <Text style={s.mItemSub}>{item.user_type}</Text>}
                                            </View>
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

                {/* ── TO STAFF MODAL ── */}
                <Modal transparent visible={toModal} animationType="fade">
                    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => { setToModal(false); setToSearch(''); }}>
                        <View style={s.modalCard} onStartShouldSetResponder={() => true}>
                            <Text style={s.modalTitle}>Select To Staff</Text>

                            <View style={s.searchRow}>
                                <Icon name="magnify" size={18} color="#94a3b8" />
                                <TextInput
                                    value={toSearch}
                                    onChangeText={setToSearch}
                                    placeholder="Search staff..."
                                    placeholderTextColor="#94a3b8"
                                    style={s.searchInput}
                                />
                            </View>
                            <FlatList
                                data={filteredToStaffs}
                                keyExtractor={item => String(item.id)}
                                style={{ maxHeight: 360 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const sel = selectedTo?.id === item.id;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => { setSelectedTo(item); setToModal(false); setToSearch(''); }}
                                            style={[s.mItem, sel && s.mItemSel]}
                                        >
                                            <Text style={[s.mItemTxt, sel && s.mItemTxtSel]}>
                                                {item.user_name || item.name}
                                            </Text>
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
                                        <Text style={[s.filterDropdownTxt, !fCity && { color: '#999' }]}>{fCity?.city_name || 'Select City'}</Text>
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

                {/* ── FILTER PICKERS ── */}
                <PickerModal visible={sourceModal} onClose={() => setSourceModal(false)} title="Select Source" data={sources} selected={fSource?.source_id} onSelect={setFSource} keyField="source_id" labelField="source_name" />
                <PickerModal visible={purposeModal} onClose={() => setPurposeModal(false)} title="Select Purpose" data={purposes} selected={fPurpose?.purpose_id} onSelect={setFPurpose} keyField="purpose_id" labelField="purpose_name" />
                <PickerModal visible={statusPickerVisible} onClose={() => setStatusPickerVisible(false)} title="Select Status" data={STATUS_OPTIONS} selected={fStatus?.value} onSelect={setFStatus} keyField="value" labelField="label" searchEnabled={false} />
                <PickerModal visible={cityModal} onClose={() => setCityModal(false)} title="Select City" data={cities} selected={fCity?.city_id} onSelect={setFCity} keyField="city_id" labelField="city_name" />

                {/* ── TRANSFER CONFIRM MODAL ── */}
                <Modal visible={transferModal} transparent animationType="fade">
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                        activeOpacity={1}
                        onPress={() => setTransferModal(false)}
                    >
                        <View style={s.confirmBox} onStartShouldSetResponder={() => true}>
                            <View style={s.confirmIconWrap}>
                                <Icon name="account-switch-outline" size={30} color={Colors.buttonbgcolor} />
                            </View>
                            <Text style={s.confirmTitle}>Confirm Transfer</Text>
                            <Text style={s.confirmMsg}>
                                Transfer{' '}
                                <Text style={s.confirmBold}>
                                    {selectAllPages ? 'All leads' : `${selectedIds.size} lead(s)`}
                                </Text>{' '}to{'\n'}
                                <Text style={s.confirmBold}>{selectedTo?.user_name || selectedTo?.name || ''}</Text>?
                            </Text>
                            <View style={{ flexDirection: 'row', width: '100%', marginTop: 16 }}>
                                <TouchableOpacity onPress={() => setTransferModal(false)} style={s.confirmCancelBtn}>
                                    <Text style={s.confirmCancelTxt}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={confirmTransfer} style={s.confirmOkBtn}>
                                    <Text style={s.confirmOkTxt}>Transfer</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>

            </SafeAreaView>
        </PaperProvider>
    );
};

export default LeadTransferList;

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const s = StyleSheet.create({
    header: { height: 50, backgroundColor: Colors.buttonbgcolor, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    headerTitle: { color: '#fff', fontSize: 16, fontFamily: Fonts.Bold },
    filterIconWrap: { position: 'relative', padding: 2 },
    filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#f59e0b', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
    filterBadgeTxt: { color: '#fff', fontSize: 10, fontFamily: Fonts.Bold },
    transferCard: {
        flexDirection: 'row', alignItems: 'flex-end',
        backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 10,
        borderRadius: 14, padding: 12, gap: 8,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    dropdownGroup: { flex: 1 },
    dropdownLabel: { fontSize: 11, fontFamily: Fonts.Bold, color: '#64748b', marginBottom: 4 },
    transferDropdown: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
        height: 44, paddingHorizontal: 10, backgroundColor: '#f8fafc',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    transferDropdownTxt: { fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b', flexShrink: 1 },
    dropdownSubTxt: { fontSize: 10, color: '#94a3b8', fontFamily: Fonts.Regular },
    arrowWrap: { paddingBottom: 10, paddingHorizontal: 2 },
    transferBtn: {
        backgroundColor: Colors.buttonbgcolor,
        paddingHorizontal: 16, height: 44, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    transferBtnTxt: { color: '#fff', fontSize: 13, fontFamily: Fonts.Bold },
    selectedChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginHorizontal: 12, marginBottom: 6,
        backgroundColor: '#ede9fe', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
    },
    selectedChipTxt: { fontSize: 13, color: Colors.buttonbgcolor, fontFamily: Fonts.Bold, flex: 1 },
    tableHeader: { flexDirection: 'row', backgroundColor: Colors.buttonbgcolor, paddingVertical: 10 },
    headerCell: { justifyContent: 'center', paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.2)' },
    headerCellText: { color: '#fff', fontSize: 12, fontFamily: Fonts.Bold },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
    rowEven: { backgroundColor: '#fff' },
    rowOdd: { backgroundColor: '#f8fafc' },
    rowChecked: { backgroundColor: '#ede9fe' },
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
    mItemSub: { fontSize: 11, color: '#94a3b8', fontFamily: Fonts.Regular, marginTop: 1 },
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
    confirmBox: { backgroundColor: '#fff', borderRadius: 16, padding: 22, width: '85%', alignItems: 'center' },
    confirmIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    confirmTitle: { fontSize: 16, fontFamily: Fonts.Bold, color: '#1e293b', marginBottom: 6 },
    confirmMsg: { fontSize: 13, fontFamily: Fonts.Regular, color: '#64748b', textAlign: 'center' },
    confirmBold: { fontFamily: Fonts.Bold, color: '#1e293b' },
    confirmCancelBtn: { flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, marginRight: 5, alignItems: 'center' },
    confirmCancelTxt: { fontFamily: Fonts.Bold, color: '#475569' },
    confirmOkBtn: { flex: 1, backgroundColor: Colors.buttonbgcolor, padding: 12, borderRadius: 10, marginLeft: 5, alignItems: 'center' },
    confirmOkTxt: { color: '#fff', fontFamily: Fonts.Bold },
    selectAllBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginHorizontal: 12, marginBottom: 6,
        backgroundColor: '#dbeafe', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 9,
    },
    selectAllBannerTxt: { fontSize: 12, fontFamily: Fonts.Regular, color: '#1d4ed8', flex: 1 },
    selectAllBannerLink: { fontFamily: Fonts.Bold, color: Colors.buttonbgcolor, textDecorationLine: 'underline' },
});
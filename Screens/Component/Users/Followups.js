import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { API, Colors, Fonts } from './Commoncomponent/Constants';

// ── Static demo data ─────────────────────────────────────────
const TODAY_LEADS = [
    {
        id: '1', initials: 'NL', avatarBg: '#fce7f3', avatarText: '#9d174d',
        name: 'Namrata Patel', phone: 'p:9874459687',
        note: 'call not rec', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '08 Apr 2026', time: '12:08 PM',
    },
    {
        id: '2', initials: '9', avatarBg: '#fef3c7', avatarText: '#92400e',
        name: '9_months_last_moment', phone: '',
        note: 'MSG SENT', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '08 Apr 2026', time: '11:33 AM',
    },
    {
        id: '3', initials: 'S', avatarBg: '#d1fae5', avatarText: '#065f46',
        name: 'Sana', phone: 'p:+916283812057',
        note: 'call not rec', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '08 Apr 2026', time: '03:24 AM',
    },
];

const TOMORROW_LEADS = [
    {
        id: '4', initials: 'AK', avatarBg: '#ede9fe', avatarText: '#4c1d95',
        name: 'Anil Kumar', phone: 'p:9876543210',
        note: 'interested', staff: 'Rahul Sharma',
        status: 'Follow-up', date: '09 Apr 2026', time: '10:00 AM',
    },
    {
        id: '5', initials: 'PM', avatarBg: '#dbeafe', avatarText: '#1e3a8a',
        name: 'Priya Mehta', phone: 'p:9988776655',
        note: 'call back requested', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '09 Apr 2026', time: '11:30 AM',
    },
    {
        id: '6', initials: 'RJ', avatarBg: '#fce7f3', avatarText: '#9d174d',
        name: 'Raju Joshi', phone: 'p:9123456789',
        note: 'needs quotation', staff: 'Rahul Sharma',
        status: 'Follow-up', date: '09 Apr 2026', time: '02:00 PM',
    },
    {
        id: '7', initials: 'VP', avatarBg: '#d1fae5', avatarText: '#065f46',
        name: 'Vijay Patil', phone: 'p:9000011111',
        note: 'site visit done', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '09 Apr 2026', time: '04:00 PM',
    },
];

const PASTDUE_LEADS = [
    {
        id: '8', initials: 'GM', avatarBg: '#fee2e2', avatarText: '#7f1d1d',
        name: 'Gaurie M', phone: 'MAT 7M MUM',
        note: 'no response', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '05 Apr 2026', time: '',
    },
    {
        id: '9', initials: 'SP', avatarBg: '#fef3c7', avatarText: '#92400e',
        name: 'Sunita Patil', phone: 'p:9822211111',
        note: 'call not picked', staff: 'Rahul Sharma',
        status: 'Follow-up', date: '04 Apr 2026', time: '',
    },
    {
        id: '10', initials: 'KM', avatarBg: '#ede9fe', avatarText: '#4c1d95',
        name: 'Kiran More', phone: 'p:9900112233',
        note: 'waiting for docs', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '03 Apr 2026', time: '',
    },
    {
        id: '11', initials: 'TK', avatarBg: '#dbeafe', avatarText: '#1e3a8a',
        name: 'Tushar Kulkarni', phone: '',
        note: 'site visit pending', staff: 'Rahul Sharma',
        status: 'Follow-up', date: '02 Apr 2026', time: '',
    },
    {
        id: '12', initials: 'NB', avatarBg: '#fce7f3', avatarText: '#9d174d',
        name: 'Neha Bane', phone: 'p:9812345678',
        note: 'interested in 2BHK', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '01 Apr 2026', time: '',
    },
    {
        id: '13', initials: 'AS', avatarBg: '#d1fae5', avatarText: '#065f46',
        name: 'Arvind Shah', phone: 'p:9011223344',
        note: 'sent brochure', staff: 'Rahul Sharma',
        status: 'Follow-up', date: '31 Mar 2026', time: '',
    },
    {
        id: '14', initials: 'MR', avatarBg: '#fee2e2', avatarText: '#7f1d1d',
        name: 'Meena Rao', phone: 'p:9765432100',
        note: 'price negotiation', staff: 'Mayuri Suryavanshi',
        status: 'Follow-up', date: '30 Mar 2026', time: '',
    },
];

const TABS = [
    { key: 'today', label: 'Today', data: TODAY_LEADS },
    { key: 'tomorrow', label: 'Tomorrow', data: TOMORROW_LEADS },
    { key: 'pastdue', label: 'Past Due', data: PASTDUE_LEADS },
];

// ── Component ────────────────────────────────────────────────
const Followups = () => {
    const [activeTab, setActiveTab] = useState('today');
    const [selectedDate, setSelectedDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [users, setUsers] = useState([]);

    // Fetch staff list from API
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(API.list_user);
            const result = await response.json();
            if (result.code == 200) {
                setUsers(result.payload);
            } else {
                setUsers([]);
            }
        } catch (e) {
            setUsers([]);
        }
    };

    const onDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) setSelectedDate(date);
    };

    const formatDate = (date) => {
        if (!date) return 'Select Date';
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const activeData = TABS.find(t => t.key === activeTab)?.data || [];

    return (
        <View style={styles.card}>
            {/* ── Card Header ── */}
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Follow-ups</Text>

                {/* Filters Row */}
                <View style={styles.filtersRow}>
                    {/* Date Picker Button */}
                    <TouchableOpacity
                        style={styles.filterBtn}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Icon name="calendar-outline" size={15} color="#64748B" />
                        <Text style={styles.filterBtnText}>{formatDate(selectedDate)}</Text>
                    </TouchableOpacity>

                    {/* Staff Dropdown */}
                    <View style={styles.pickerWrapper}>
                        <Icon name="account-outline" size={15} color="#64748B" style={{ marginLeft: 8 }} />
                        <Picker
                            selectedValue={selectedStaff}
                            onValueChange={(val) => setSelectedStaff(val)}
                            style={styles.picker}
                            dropdownIconColor="#64748B"
                            mode="dropdown"
                        >
                            <Picker.Item label="Select Staff" value="" color="#94A3B8" />
                            {users.map((user, index) => (
                                <Picker.Item
                                    key={index}
                                    label={user.name || user.username || 'Staff'}
                                    value={user.id || user._id}
                                    color="#0F172A"
                                />
                            ))}
                        </Picker>
                    </View>
                </View>
            </View>

            {/* ── Tabs ── */}
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
                        <View style={[
                            styles.tabBadge,
                            activeTab === tab.key ? styles.tabBadgeActive : styles.tabBadgeInactive
                        ]}>
                            <Text style={[
                                styles.tabBadgeText,
                                activeTab === tab.key ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive
                            ]}>
                                {tab.data.length}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Lead List (scrollable, max 3 visible) ── */}
            <ScrollView
                style={styles.listScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
            >
                {activeData.map((item, index) => (
                    <View
                        key={item.id}
                        style={[
                            styles.leadItem,
                            index === activeData.length - 1 && { borderBottomWidth: 0 }
                        ]}
                    >
                        {/* Avatar */}
                        <View style={[styles.avatar, { backgroundColor: item.avatarBg }]}>
                            <Text style={[styles.avatarText, { color: item.avatarText }]}>
                                {item.initials}
                            </Text>
                        </View>

                        {/* Info */}
                        <View style={styles.leadInfo}>
                            <Text style={styles.leadName} numberOfLines={1}>
                                {item.name}
                                {item.phone ? (
                                    <Text style={styles.leadPhone}>  {item.phone}</Text>
                                ) : null}
                            </Text>
                            <Text style={styles.leadNote}>{item.note}</Text>
                            <Text style={styles.leadStaff}>
                                <Icon name="account-outline" size={11} color="#94A3B8" /> {item.staff}
                            </Text>
                        </View>

                        {/* Meta */}
                        <View style={styles.leadMeta}>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{item.status}</Text>
                            </View>
                            <Text style={styles.leadDate}>{item.date}</Text>
                            {item.time ? <Text style={styles.leadTime}>{item.time}</Text> : null}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* ── Date Picker Modal ── */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={onDateChange}
                />
            )}
        </View>
    );
};

export default Followups;

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
        fontSize: 13,
        color: '#475569',
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
        overflow: 'hidden',
    },
    picker: {
        flex: 1,
        height: 40,
        color: '#475569',
        fontSize: 13,
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
    },
    tabBtnActive: {
        borderBottomColor: '#0284C7',
    },
    tabLabel: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
    },
    tabLabelActive: {
        fontFamily: 'Inter-Bold',
        color: '#0284C7',
    },
    tabBadge: {
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeActive: { backgroundColor: '#0284C7' },
    tabBadgeInactive: { backgroundColor: '#F1F5F9' },
    tabBadgeText: { fontSize: 11, fontFamily: 'Inter-Bold' },
    tabBadgeTextActive: { color: '#FFFFFF' },
    tabBadgeTextInactive: { color: '#64748B' },

    // Lead List
    listScroll: {
        maxHeight: 280,   // ~3.5 items visible, then scroll
    },
    leadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    leadInfo: { flex: 1, minWidth: 0 },
    leadName: {
        fontSize: 13,
        fontFamily: 'Inter-Bold',
        color: '#0284C7',
    },
    leadPhone: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: '#0284C7',
    },
    leadNote: {
        fontSize: 11,
        color: '#64748B',
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },
    leadStaff: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },

    // Lead Meta
    leadMeta: {
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    statusBadge: {
        backgroundColor: '#EFF6FF',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'Inter-Bold',
        color: '#1D4ED8',
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
});

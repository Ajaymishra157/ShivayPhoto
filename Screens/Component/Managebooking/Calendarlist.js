import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    Modal, ActivityIndicator, Platform,
    StatusBar,
    SafeAreaView,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DATE_TYPE_OPTIONS = [
    { label: 'Booking Date', value: 'booking date' },
    { label: 'Entry Date', value: 'entry date' },
];

// sirf date dikhane ke liye (time nahi), month name aaye to waisa hi dikhega
const formatDate = (s) => {
    if (!s) return '--';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};


const toApiDate = (d) => {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const buildGrid = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });
    return cells;
};


const Calendarlist = ({ navigation }) => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [cityFilter, setCityFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [tentativeClients, setTentativeClients] = useState([]);
    const [confirmedMap, setConfirmedMap] = useState({});
    const [detailModal, setDetailModal] = useState(false);
    const [detailTitle, setDetailTitle] = useState('');
    const [detailClients, setDetailClients] = useState([]);
    const [isTentativeModal, setIsTentativeModal] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [userType, setUserType] = useState('');
    const [userId, setUserId] = useState(null);
    const [summary, setSummary] = useState({
        tentative_count: 0,
        confirmed_count: 0,
        total_clients: 0,
        total_booking_amount: 0,
        total_paid_amount: 0,
        total_due_amount: 0,
    });

    const [salesPersonList, setSalesPersonList] = useState([{ label: 'All', value: '' }]);
    const [selectedSalesPerson, setSelectedSalesPerson] = useState('');
    const [salesModal, setSalesModal] = useState(false);
    const [salesLoading, setSalesLoading] = useState(false);
    const [cityModal, setCityModal] = useState(false);

    const [dateType, setDateType] = useState('booking date');   // default booking date
    const [dateTypeModal, setDateTypeModal] = useState(false);

    const [salesSearch, setSalesSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const effectiveAdminId = selectedSalesPerson || userId;

    const [cityList, setCityList] = useState([{ label: 'All Branch', value: '' }]);
    const [cityLoading, setCityLoading] = useState(false);

    const matchesCity = (clientCity, filterCity) => {
        if (!filterCity) return true;
        return (clientCity || '').trim().toLowerCase() === filterCity.trim().toLowerCase();
    };

    useEffect(() => { fetchUserType(); }, []);


    const formatDateTime = (dateString) => {
        if (!dateString) return '--';
        const dateObj = new Date(dateString);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    };


    const fetchUserType = async () => {
        try {
            const uid = await AsyncStorage.getItem('id');
            setUserId(uid);

            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: uid }),
            });

            const result = await res.json();

            if (result.code == 200 && result.payload?.length > 0) {
                const type = result.payload[0].user_type?.trim() || '';
                setUserType(type);

                console.log('USER TYPE:', type);
            }
        } catch (error) {
            console.log('fetchUserType error:', error);
        }
    };

    const getUrgencyColor = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);

        const diffDays = Math.round(
            (target - today) / (1000 * 60 * 60 * 24)
        );

        // Past booking / normal
        if (diffDays < 0) return '#16a34a';

        // Within 3 days
        if (diffDays <= 3) return '#ef4444';

        // Within 5 days
        if (diffDays <= 5) return '#f59e0b';

        // Normal confirmed booking
        return '#16a34a';
    };

    useEffect(() => {
        const fetchBranches = async () => {
            setCityLoading(true);
            try {
                const res = await fetch(API.list_branch, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                const json = await res.json();
                if (json?.status && Array.isArray(json.payload)) {
                    const list = json.payload.map(b => ({
                        label: b.branch_name?.trim(),
                        value: b.branch_name?.trim(),
                    }));
                    setCityList([{ label: 'All Branch', value: '' }, ...list]);
                }
            } catch (e) {
                console.log('fetchBranches error:', e);
            } finally {
                setCityLoading(false);
            }
        };

        fetchBranches();
    }, []);

    const fetchCalendar = useCallback(async (m, y, city, uid, dType) => {
        setLoading(true);
        try {
            const requestBody = {
                month: MONTHS[m],
                city: city || '',
                admin_id: uid || '',
                date: dType || 'booking date',      // 👈 NEW
            };

            // ---- DEBUG LOG: request payload ----
            console.log('====== list_calendar API CALL ======');
            console.log('URL:', API.list_calendar);
            console.log('Request Body:', JSON.stringify(requestBody, null, 2));
            console.log('=====================================');

            const res = await fetch(API.list_calendar, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const json = await res.json();

            // ---- DEBUG LOG: raw API response ----
            // console.log('====== list_calendar API RESPONSE ======');
            // console.log('HTTP status code:', res.status);
            // console.log('Response JSON:', JSON.stringify(json, null, 2));
            // console.log('==========================================');

            if (json.code === 200) {
                const payload = json.payload;
                setTentativeClients(payload.tentative_records?.clients || []);
                const map = {};
                (payload.confirmed_bookings || []).forEach(b => {
                    map[b.booking_date] = { total_clients: b.total_clients, clients: b.clients };
                });
                setConfirmedMap(map);
                setSummary(json.summary || {});
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Failed to load calendar', position: 'bottom', bottomOffset: 60 });
        } finally { setLoading(false); }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchCalendar(month, year, cityFilter, selectedSalesPerson || userId, dateType);
            }
        }, [userId, month, year, cityFilter, selectedSalesPerson, dateType])   // 👈 dateType add
    );

    useEffect(() => {
        if (userType !== 'Admin') return;

        const fetchSalesPersons = async () => {
            setSalesLoading(true);
            try {
                const res = await fetch(API.list_user_typewise, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'Sales-Person' }),
                });
                const json = await res.json();
                if (json.code == 200) {
                    const list = (json.payload || []).map(u => ({
                        label: u.user_name?.trim(),
                        value: String(u.id),
                    }));
                    setSalesPersonList([{ label: 'All', value: '' }, ...list]);
                }
            } catch (e) {
                console.log('fetchSalesPersons error:', e);
            } finally {
                setSalesLoading(false);
            }
        };

        fetchSalesPersons();
    }, [userType]);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const openConfirmed = (dateStr, clients) => {
        const filtered = cityFilter ? clients.filter(c => matchesCity(c.client_city, cityFilter)) : clients;
        if (!filtered.length) return;
        const [y, m, d] = dateStr.split('-');
        setDetailTitle(`Booking Details : ${d}/${m}/${y}`);
        setDetailClients(filtered);
        setIsTentativeModal(false);
        setDetailModal(true);
    };

    const openTentative = () => {
        const filtered = cityFilter ? tentativeClients.filter(c => matchesCity(c.client_city, cityFilter)) : tentativeClients;
        setDetailTitle(`Booking Details : ${MONTHS[month]} ${year}`);
        setDetailClients(filtered);
        setIsTentativeModal(true);
        setDetailModal(true);
    };

    const handleUpdateDate = async (clientId, date) => {
        setUpdateLoading(true);
        try {
            const res = await fetch(API.update_date, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: String(clientId), booking_date: toApiDate(date), admin_id: userId || '' }),
            });
            const result = await res.json();
            if (result.code == 200) {
                Toast.show({ type: 'success', text1: 'Date updated successfully', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
                // setDetailModal(false);
                // ✅ Tentative list se remove karein

                // ✅ Modal se us client ko hata do
                setDetailClients(prev => prev.filter(c => c.client_id !== clientId));
                // ✅ Main list se bhi hata do (count update hoga)
                setTentativeClients(prev => prev.filter(c => c.client_id !== clientId));
                fetchCalendar(month, year, cityFilter, effectiveAdminId, dateType);
            } else {
                Toast.show({ type: 'error', text1: result.message || 'Update failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setUpdateLoading(false); }
    };

    const tentativeCount = cityFilter
        ? tentativeClients.filter(c => matchesCity(c.client_city, cityFilter)).length
        : tentativeClients.length;

    const grid = buildGrid(year, month);



    const getCount = (day) => {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = confirmedMap[key];
        if (!entry) return 0;
        if (!cityFilter) return entry.total_clients;
        return entry.clients.filter(c => matchesCity(c.client_city, cityFilter)).length;
    };

    const getClients = (day) => {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return confirmedMap[key]?.clients || [];
    };

    const isToday = (day) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const COL_WIDTHS = [100, 110, 110, 90, 110, 170, 110, 170, 100, 160];
    const COL_HEADERS = ['ORDER NO', 'NAME', 'ADDRESS', 'CITY', 'MOBILE NO.', 'EMAIL', 'PURPOSE', 'REMARK', 'ADDED BY', 'ENTRY DATE'];

    /* ══ Client Card ══ */
    const ClientCard = ({ client, idx, total, isTentativeModal, handleUpdateDate, updateLoading, formatDateTime }) => {

        const [expandedKey, setExpandedKey] = useState(null);

        const fields = [
            { key: 'Order No.', val: client.order_no },
            { key: 'Email', val: client.client_email || '—' },
            { key: 'Address', val: client.client_address || '—' },
            { key: 'Purpose', val: client.client_purpose },
            { key: 'Package', val: client.client_remark || '—' },
            { key: 'Added By', val: client.added_by_name },
            dateType === 'booking date'
                ? { key: 'Entry Date', val: formatDateTime(client.entry_date) }
                : { key: 'Booking Date', val: formatDate(client.booking_date || client.shoot_month) },
            { key: 'City', val: client.client_city },
        ];

        const rows = fields.reduce((acc, field, i) => {
            if (i % 2 === 0) acc.push([field]);
            else acc[acc.length - 1].push(field);
            return acc;
        }, []);

        return (
            <View style={{ marginBottom: total > 1 ? 14 : 0 }}>


                {/* ── Client Header Bar ── */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: Colors.light_buttonbgcolor,
                    borderTopLeftRadius: 10, borderTopRightRadius: 10,
                    paddingHorizontal: 12, paddingVertical: 8,
                    gap: 8,
                }}>
                    <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 10, fontFamily: Fonts.Bold, color: '#fff' }}>{idx + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontFamily: Fonts.Bold, color: '#fff', flex: 1, textTransform: 'capitalize' }}>
                        {client.client_name}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: Fonts.Regular, color: 'rgba(255,255,255,0.85)' }}>
                        {client.client_mobile}
                    </Text>

                    {/* 🆕 EDIT ICON */}
                    <TouchableOpacity
                        onPress={() => {
                            setDetailModal(false);
                            navigation.navigate('AddBooking', { clientdata: client });
                        }}
                        style={{
                            width: 24, height: 24, borderRadius: 6,
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            justifyContent: 'center', alignItems: 'center',
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <Icon name="pencil" size={13} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* ── 2-col Grid ── */}
                <View style={{
                    borderWidth: 0.5, borderTopWidth: 0,
                    borderColor: '#e2e8f0',
                    borderBottomLeftRadius: isTentativeModal ? 0 : 10,
                    borderBottomRightRadius: isTentativeModal ? 0 : 10,
                    overflow: 'hidden',
                }}>
                    {rows.map((row, rowIdx) => (
                        <View key={rowIdx} style={{
                            flexDirection: 'row',
                            borderBottomWidth: 0.5,
                            borderBottomColor: '#e2e8f0',
                            backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f8fafc',
                        }}>
                            {row.map(({ key, val }, colIdx) => (
                                <ExpandableCell
                                    key={colIdx}
                                    fieldKey={key}
                                    val={val}
                                    colIdx={colIdx}
                                    isExpanded={expandedKey === `${rowIdx}-${colIdx}`}
                                    onExpand={() => setExpandedKey(
                                        expandedKey === `${rowIdx}-${colIdx}` ? null : `${rowIdx}-${colIdx}`
                                    )}
                                />
                            ))}
                            {/* Agar row mein sirf 1 field hai (odd total) */}
                            {row.length === 1 && <View style={{ flex: 1 }} />}
                        </View>
                    ))}
                </View>

                {/* ── Tentative Action — same card ka hissa ── */}
                {isTentativeModal && (
                    <View style={{
                        borderWidth: 0.5, borderTopWidth: 0,
                        borderColor: '#c7d2fe',
                        borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
                        backgroundColor: '#f0f4ff',
                        padding: 10,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Icon name="calendar-clock" size={13} color="#6366f1" />
                            <Text style={{ fontSize: 11, fontFamily: Fonts.Bold, color: '#6366f1' }}>
                                TENTATIVE ACTION — {client.client_name}
                            </Text>
                        </View>
                        <TentativeAction
                            client={client}
                            onUpdate={handleUpdateDate}
                            updateLoading={updateLoading}
                        />
                    </View>
                )}

                {/* Separator */}
                {/* {total > 1 && idx < total - 1 && (
                    <View style={{ height: 1, backgroundColor: '#e2e8f0', marginTop: 2 }} />
                )} */}

            </View>
        );
    };

    /* ══ Expandable Cell ══ */
    const ExpandableCell = ({ fieldKey, val, colIdx, isExpanded, onExpand }) => {
        const isLong = val && val.length > 30;

        return (
            <View style={{
                flex: 1,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRightWidth: colIdx === 0 ? 0.5 : 0,
                borderRightColor: '#e2e8f0',
            }}>
                <Text style={{ fontSize: 10, fontFamily: Fonts.Bold, color: '#94a3b8', marginBottom: 2 }}>
                    {fieldKey.toUpperCase()}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text
                        style={{ fontSize: 12, fontFamily: Fonts.Regular, color: val === '—' ? '#cbd5e1' : '#334155', flex: 1, textTransform: 'capitalize' }}
                        numberOfLines={isExpanded ? undefined : 2}
                    >
                        {val}
                    </Text>
                    {isLong && (
                        <TouchableOpacity onPress={onExpand} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                            <Text style={{ fontSize: 10, color: Colors.buttonbgcolor, fontFamily: Fonts.Bold }}>
                                {isExpanded ? 'less' : '...'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    /* ══ Tentative Action Cell ══ */
    const TentativeAction = ({ client, onUpdate, updateLoading }) => {
        const [date, setDate] = useState(null);
        const [showPicker, setShowPicker] = useState(false);

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

                {/* Date picker — wider */}
                <TouchableOpacity
                    style={{
                        flex: 1,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        borderWidth: 1, borderColor: '#a5b4fc', borderRadius: 8,
                        paddingHorizontal: 12, paddingVertical: 9,
                        backgroundColor: '#fff',
                    }}
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.8}
                >
                    <Text style={{ fontSize: 12, fontFamily: Fonts.Regular, color: date ? '#334155' : '#94a3b8' }}>
                        {date
                            ? `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
                            : 'Select date'}
                    </Text>
                    <Icon name="calendar" size={15} color="#6366f1" />
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={date || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selected) => {
                            setShowPicker(false);
                            if (event.type === 'set' && selected) setDate(selected);
                        }}
                    />
                )}

                {/* Update button — wider */}
                <TouchableOpacity
                    style={{
                        backgroundColor: Colors.buttonbgcolor, borderRadius: 8,
                        paddingHorizontal: 18, paddingVertical: 9,
                        opacity: (!date || updateLoading) ? 0.5 : 1,
                        minWidth: 80, alignItems: 'center',
                    }}
                    disabled={!date || updateLoading}
                    onPress={() => onUpdate(client.client_id, date)}
                    activeOpacity={0.8}
                >
                    {updateLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={{ color: '#fff', fontSize: 12, fontFamily: Fonts.Bold }}>Update</Text>
                    }
                </TouchableOpacity>
            </View>
        );
    };
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />


            {/* ── HEADER ── */}
            <View style={{
                height: 50, backgroundColor: Colors.buttonbgcolor,
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', paddingHorizontal: 12,
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 16, fontFamily: Fonts.Bold }}>Calendar List</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                {loading ? (
                    <View style={{ marginTop: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                    </View>
                ) : (
                    <>
                        {/* ── STATS ROW ── */}
                        {/* ── STATS ROW ── */}
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                justifyContent: 'space-between',
                            }}
                        >
                            {[
                                {
                                    icon: 'calendar-multiple',
                                    iconColor: '#7c3aed',
                                    value: summary.total_clients ?? 0,
                                    label: 'Total',
                                    adminOnly: false,
                                },
                                {
                                    icon: 'check-circle-outline',
                                    iconColor: '#16a34a',
                                    value: summary.confirmed_count ?? 0,
                                    label: 'Confirmed',
                                    adminOnly: false,
                                },
                                {
                                    icon: 'clock-outline',
                                    iconColor: '#f59e0b',
                                    value: tentativeCount,
                                    label: 'Tentative',
                                    onPress: openTentative,
                                    adminOnly: false,
                                },

                                // ✅ NEW
                                {
                                    icon: 'calendar-arrow-right',
                                    iconColor: '#f97316',
                                    value: summary.next_3_days_count ?? 0,
                                    label: 'Next 3 Days',
                                    adminOnly: false,
                                },

                                // ✅ NEW
                                {
                                    icon: 'calendar-range',
                                    iconColor: '#0891b2',
                                    value: summary.next_6_days_count ?? 0,
                                    label: 'Next 6 Days',
                                    adminOnly: false,
                                },

                                {
                                    icon: 'currency-inr',
                                    iconColor: '#0d9488',
                                    value: `₹${(summary.total_booking_amount ?? 0).toLocaleString('en-IN')}`,
                                    label: 'Booking',
                                    adminOnly: true,
                                },
                                {
                                    icon: 'cash-multiple',
                                    iconColor: '#2563eb',
                                    value: `₹${(summary.total_paid_amount ?? 0).toLocaleString('en-IN')}`,
                                    label: 'Received',
                                    adminOnly: true,
                                },
                                {
                                    icon: 'alert-circle-outline',
                                    iconColor: '#dc2626',
                                    value: `₹${(summary.total_due_amount ?? 0).toLocaleString('en-IN')}`,
                                    label: 'Due',
                                    adminOnly: true,
                                },
                            ]
                                .filter(item =>
                                    !item.adminOnly ||
                                    userType === 'Admin' ||
                                    userType === 'Sales-Person'
                                )
                                .map((item, index) => {
                                    const Wrapper = item.onPress ? TouchableOpacity : View;

                                    return (
                                        <Wrapper
                                            key={index}
                                            activeOpacity={item.onPress ? 0.8 : 1}
                                            onPress={item.onPress}
                                            style={{
                                                width: '48%',
                                                backgroundColor: '#fff',
                                                borderRadius: 14,
                                                paddingVertical: 10,
                                                paddingHorizontal: 10,
                                                marginBottom: 8,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 5,
                                                elevation: 2,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 9,
                                                    backgroundColor: item.iconColor,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Icon
                                                    name={item.icon}
                                                    size={15}
                                                    color="#fff"
                                                />
                                            </View>

                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text
                                                    numberOfLines={1}
                                                    style={{
                                                        fontFamily: Fonts.Bold,
                                                        fontSize: 15,
                                                        color: '#111827',
                                                    }}
                                                >
                                                    {item.value}
                                                </Text>

                                                <Text
                                                    numberOfLines={1}
                                                    style={{
                                                        fontFamily: Fonts.Regular,
                                                        fontSize: 10,
                                                        color: '#6B7280',
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {item.label}
                                                </Text>
                                            </View>
                                        </Wrapper>
                                    );
                                })}
                        </View>
                        {/* ── BOOKING STATUS LEGEND ── */}
                        <View
                            style={{
                                marginHorizontal: 12,

                                paddingHorizontal: 12,
                                paddingVertical: 9,
                                backgroundColor: '#fff',
                                borderRadius: 9,
                                borderWidth: 0.6,
                                borderColor: '#e8ecf0',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            {/* GREEN */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#16a34a',
                                        marginRight: 5,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 10.5,
                                        fontFamily: Fonts.Regular,
                                        color: '#64748b',
                                    }}
                                >
                                    Booking Done
                                </Text>
                            </View>

                            {/* ORANGE */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#f59e0b',
                                        marginRight: 5,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 10.5,
                                        fontFamily: Fonts.Regular,
                                        color: '#64748b',
                                    }}
                                >
                                    Upcoming (5 din baaki)
                                </Text>
                            </View>

                            {/* RED */}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#ef4444',
                                        marginRight: 5,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 10.5,
                                        fontFamily: Fonts.Regular,
                                        color: '#64748b',
                                    }}
                                >
                                    Urgent (3 din baaki)
                                </Text>
                            </View>
                        </View>

                        {/* ── ROW 1: MONTH NAV + DATE TYPE ── */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 10,
                            paddingTop: 10,
                            marginTop: 10,
                        }}>
                            {/* LEFT: Month Nav */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <TouchableOpacity
                                    onPress={prevMonth}
                                    style={{
                                        width: 28, height: 28, borderRadius: 6,
                                        backgroundColor: Colors.buttonbgcolor,
                                        justifyContent: 'center', alignItems: 'center'
                                    }}
                                >
                                    <Icon name="chevron-left" size={18} color="#fff" />
                                </TouchableOpacity>

                                <Text style={{ fontSize: 13, fontFamily: Fonts.Bold, color: '#1e293b' }}>
                                    {MONTHS[month]} {year}
                                </Text>

                                <TouchableOpacity
                                    onPress={nextMonth}
                                    style={{
                                        width: 28, height: 28, borderRadius: 6,
                                        backgroundColor: Colors.buttonbgcolor,
                                        justifyContent: 'center', alignItems: 'center'
                                    }}
                                >
                                    <Icon name="chevron-right" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* RIGHT: Date Type */}
                            <TouchableOpacity
                                onPress={() => setDateTypeModal(true)}
                                style={{
                                    backgroundColor: Colors.buttonbgcolor,
                                    borderRadius: 7,
                                    paddingHorizontal: 10,
                                    height: 28,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Icon name="calendar-month-outline" size={13} color="#fff" />
                                <Text style={{ color: '#fff', fontSize: 11, fontFamily: Fonts.Bold }}>
                                    {DATE_TYPE_OPTIONS.find(o => o.value === dateType)?.label}
                                </Text>
                                <Icon name="chevron-down" size={13} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* ── ROW 2: BRANCH + SALES PERSON ── */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingTop: 8,
                            paddingBottom: 10,
                            gap: 8,
                        }}>
                            <TouchableOpacity
                                onPress={() => setCityModal(true)}
                                style={{
                                    flex: 1,
                                    backgroundColor: Colors.buttonbgcolor,
                                    borderRadius: 7,
                                    paddingHorizontal: 10,
                                    height: 30,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Icon name="map-marker-outline" size={13} color="#fff" />
                                <Text style={{ flex: 1, color: '#fff', fontSize: 11, fontFamily: Fonts.Bold }} numberOfLines={1}>
                                    {cityList.find(c => c.value === cityFilter)?.label || 'All Branches'}
                                </Text>
                                <Icon name="chevron-down" size={13} color="#fff" />
                            </TouchableOpacity>

                            {userType === 'Admin' && (
                                <TouchableOpacity
                                    onPress={() => setSalesModal(true)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: Colors.buttonbgcolor,
                                        borderRadius: 7,
                                        paddingHorizontal: 10,
                                        height: 30,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <Icon name="account-tie" size={13} color="#fff" />
                                    <Text style={{ flex: 1, color: '#fff', fontSize: 11, fontFamily: Fonts.Bold }} numberOfLines={1}>
                                        {salesPersonList.find(s => s.value === selectedSalesPerson)?.label || 'All'}
                                    </Text>
                                    <Icon name="chevron-down" size={13} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ── CALENDAR GRID ── */}
                        <View style={{ marginHorizontal: 8, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>

                            {/* Day headers */}
                            <View style={{ flexDirection: 'row', backgroundColor: Colors.buttonbgcolor }}>
                                {DAYS.map(d => (
                                    <View key={d} style={{ flex: 1, paddingVertical: 10, alignItems: 'center' }}>
                                        <Text style={{ color: '#fff', fontSize: 12, fontFamily: Fonts.Bold }}>{d}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Grid rows */}
                            {Array.from({ length: 6 }).map((_, rowIdx) => (
                                <View key={rowIdx} style={{ flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#e8ecf0' }}>
                                    {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => {
                                        const count = cell.current ? getCount(cell.day) : 0;
                                        const today_ = cell.current && isToday(cell.day);
                                        const hasBooking = count > 0;
                                        const dateKey = cell.current
                                            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                                            : null;   // 👈 define here, before backgroundColor uses it

                                        return (
                                            <TouchableOpacity
                                                key={colIdx}
                                                style={{
                                                    flex: 1, minHeight: 64,
                                                    borderRightWidth: 0.5, borderRightColor: '#e8ecf0',
                                                    padding: 5, alignItems: 'flex-end',
                                                    backgroundColor: hasBooking
                                                        ? getUrgencyColor(dateKey) === '#ef4444'
                                                            ? '#fef2f2'   // 🔴 very light red
                                                            : getUrgencyColor(dateKey) === '#f59e0b'
                                                                ? '#fffbeb'   // 🟠 very light orange
                                                                : '#f0fdf4'   // 🟢 very light green
                                                        : today_
                                                            ? '#f0fdf4'
                                                            : '#fff',
                                                }}
                                                activeOpacity={hasBooking ? 0.7 : 1}
                                                onPress={() => {
                                                    if (cell.current && hasBooking) {
                                                        openConfirmed(dateKey, getClients(cell.day));   // 👈 same dateKey reuse
                                                    }
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 13,
                                                    fontFamily: today_ ? Fonts.Bold : Fonts.Regular,
                                                    color: !cell.current ? '#c0c8d4' : today_ ? Colors.buttonbgcolor : '#334155',
                                                }}>
                                                    {cell.day}
                                                </Text>

                                                {cell.current && count > 0 && (
                                                    <View style={{
                                                        marginTop: 4, width: 24, height: 24, borderRadius: 12,
                                                        backgroundColor: getUrgencyColor(dateKey) || '#86efac',   // 👈 sirf badge colored
                                                        justifyContent: 'center', alignItems: 'center', alignSelf: 'center',
                                                    }}>
                                                        <Text style={{ color: '#fff', fontSize: 12, fontFamily: Fonts.Bold }}>
                                                            {count}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* ══ DETAIL MODAL ══ */}
            {/* <Modal visible={detailModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '97%', maxHeight: '80%', overflow: 'hidden' }}>

                    
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 16, paddingVertical: 14,
                            borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                        }}>
                            <Text style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}>{detailTitle}</Text>
                            <TouchableOpacity onPress={() => setDetailModal(false)}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                    
                        <ScrollView horizontal showsHorizontalScrollIndicator>
                            <View style={{ paddingHorizontal: 3 }}>

                          
                                <View style={{ flexDirection: 'row', backgroundColor: Colors.buttonbgcolor }}>
                                    {COL_HEADERS.map((col, i) => (
                                        <Text key={i} style={{
                                            width: COL_WIDTHS[i],
                                            paddingHorizontal: 10, paddingVertical: 11,
                                            fontSize: 11, fontFamily: Fonts.Bold, color: '#fff',
                                            borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.2)',
                                        }}>
                                            {col}
                                        </Text>
                                    ))}
                                    {isTentativeModal && (
                                        <Text style={{
                                            width: 200, paddingHorizontal: 10, paddingVertical: 11,
                                            fontSize: 11, fontFamily: Fonts.Bold, color: '#fff',
                                        }}>
                                            ACTION
                                        </Text>
                                    )}
                                </View>

                       
                                {detailClients.map((client, idx) => {
                                    const rowVals = [
                                        client.order_no,
                                        client.client_name,
                                        client.client_address || '—',
                                        client.client_city,
                                        client.client_mobile,
                                        client.client_email || '—',
                                        client.client_purpose,
                                        client.client_remark || '—',
                                        client.added_by_name,
                                        formatDateTime(client.entry_date),
                                    ];
                                    return (
                                        <View key={client.client_id} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#fff' }}>
                                            {rowVals.map((val, i) => (
                                                <Text key={i} style={{
                                                    width: COL_WIDTHS[i],
                                                    paddingHorizontal: 10, paddingVertical: 10,
                                                    fontSize: 12, fontFamily: Fonts.Regular, color: '#334155',
                                                    borderRightWidth: 0.5, borderRightColor: '#e8ecf0',
                                                    borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
                                                }}>
                                                    {val}
                                                </Text>
                                            ))}

                                            {isTentativeModal && (
                                                <TentativeAction
                                                    client={client}
                                                    onUpdate={handleUpdateDate}
                                                    updateLoading={updateLoading}
                                                />
                                            )}
                                        </View>
                                    );
                                })}

                            </View>
                        </ScrollView>

                    </View>
                </View>
            </Modal> */}
            {/* ══ DETAIL MODAL ══ */}

            {/* <Modal visible={detailModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>

           
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setDetailModal(false)}
                        activeOpacity={1}
                    />

               
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '97%', height: '80%' }}>

               
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 16, paddingVertical: 14,
                            borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                            borderTopLeftRadius: 16, borderTopRightRadius: 16,
                        }}>
                            <Text style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}>{detailTitle}</Text>
                            <TouchableOpacity onPress={() => setDetailModal(false)}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

               
                        <ScrollView
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                        >
                            {detailClients.map((client, idx) => (
                                <View key={client.client_id} style={{ marginBottom: detailClients.length > 1 ? 20 : 0 }}>

                                    {detailClients.length > 1 && (
                                        <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: '#94a3b8', marginBottom: 6 }}>
                                            #{idx + 1}
                                        </Text>
                                    )}

                                    {[
                                        {
                                            label: 'Order Info', fields: [
                                                { key: 'Order No.', val: client.order_no },
                                                { key: 'Entry Date', val: formatDateTime(client.entry_date) },
                                                { key: 'Added By', val: client.added_by_name },
                                            ]
                                        },
                                        {
                                            label: 'Client Info', fields: [
                                                { key: 'Name', val: client.client_name },
                                                { key: 'Mobile', val: client.client_mobile },
                                                { key: 'Email', val: client.client_email || '—' },
                                                { key: 'City', val: client.client_city },
                                                { key: 'Address', val: client.client_address || '—' },
                                            ]
                                        },
                                        {
                                            label: 'Purpose & Remarks', fields: [
                                                { key: 'Purpose', val: client.client_purpose },
                                                { key: 'Remark', val: client.client_remark || '—' },
                                            ]
                                        },
                                    ].map((section) => (
                                        <View key={section.label}>
                                            <Text style={{ fontSize: 11, fontFamily: Fonts.Bold, color: '#94a3b8', letterSpacing: 0.6, marginTop: 14, marginBottom: 4 }}>
                                                {section.label.toUpperCase()}
                                            </Text>
                                            {section.fields.map(({ key, val }) => (
                                                <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9', gap: 12 }}>
                                                    <Text style={{ fontSize: 13, fontFamily: Fonts.Regular, color: '#64748b', width: 110 }}>{key}</Text>
                                                    <Text style={{ fontSize: 13, fontFamily: Fonts.Regular, color: val === '—' ? '#cbd5e1' : '#334155', flex: 1, textAlign: 'right' }}>{val}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    ))}

                                    {isTentativeModal && (
                                        <View style={{ marginTop: 14, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: '#e2e8f0' }}>
                                            <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: '#64748b', marginBottom: 10 }}>Tentative Action</Text>
                                            <TentativeAction
                                                client={client}
                                                onUpdate={handleUpdateDate}
                                                updateLoading={updateLoading}
                                            />
                                        </View>
                                    )}

                                    {detailClients.length > 1 && idx < detailClients.length - 1 && (
                                        <View style={{ height: 1, backgroundColor: '#e2e8f0', marginTop: 16 }} />
                                    )}

                                </View>
                            ))}
                        </ScrollView>

                    </View>
                </View>
            </Modal> */}

            <Modal visible={detailModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>

                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setDetailModal(false)}
                        activeOpacity={1}
                    />

                    <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '97%', height: '80%' }}>

                        {/* Modal Header */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 16, paddingVertical: 12,
                            borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                            borderTopLeftRadius: 16, borderTopRightRadius: 16,
                        }}>
                            <Text style={{ fontSize: 14, fontFamily: Fonts.Bold, color: '#1e293b' }}>{detailTitle}</Text>
                            <TouchableOpacity onPress={() => setDetailModal(false)}>
                                <Icon name="close" size={18} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
                        >
                            {detailClients.length === 0 ? (
                                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 50 }}>
                                    <Icon name="clipboard-check-outline" size={48} color="#cbd5e1" />
                                    <Text style={{ marginTop: 12, fontSize: 14, fontFamily: Fonts.Bold, color: '#94a3b8' }}>
                                        No Bookings Found
                                    </Text>
                                    <Text style={{ marginTop: 4, fontSize: 12, fontFamily: Fonts.Regular, color: '#cbd5e1' }}>
                                        All records have been updated
                                    </Text>
                                </View>
                            ) : (
                                detailClients.map((client, idx) => (
                                    <ClientCard
                                        key={client.client_id}
                                        client={client}
                                        idx={idx}
                                        total={detailClients.length}
                                        isTentativeModal={isTentativeModal}
                                        handleUpdateDate={handleUpdateDate}
                                        updateLoading={updateLoading}
                                        formatDateTime={formatDateTime}
                                    />
                                ))
                            )}
                        </ScrollView>

                    </View>
                </View>
            </Modal>

            <Modal visible={salesModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setSalesModal(false)}
                        activeOpacity={1}
                    />
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, width: '90%', maxHeight: '70%' }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 16, paddingVertical: 14,
                            borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                        }}>
                            <Text style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}>Select Sales Person</Text>
                            <TouchableOpacity onPress={() => { setSalesModal(false); setSalesSearch(''); }}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginHorizontal: 16, marginTop: 12, marginBottom: 6,
                            borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
                            paddingHorizontal: 10, height: 38,
                        }}>
                            <Icon name="magnify" size={16} color="#94a3b8" />
                            <TextInput
                                value={salesSearch}
                                onChangeText={setSalesSearch}
                                placeholder="Search sales person..."
                                placeholderTextColor="#94a3b8"
                                style={{
                                    flex: 1, marginLeft: 8,
                                    fontSize: 13, fontFamily: Fonts.Regular,
                                    color: '#1e293b', padding: 0,
                                }}
                            />
                            {salesSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setSalesSearch('')}>
                                    <Icon name="close-circle" size={16} color="#cbd5e1" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {salesLoading ? (
                            <ActivityIndicator size="small" color={Colors.buttonbgcolor} style={{ marginVertical: 20 }} />
                        ) : (
                            <ScrollView>
                                {salesPersonList
                                    .filter(item => item.label?.toLowerCase().includes(salesSearch.toLowerCase()))
                                    .map(item => {
                                        const sel = item.value === selectedSalesPerson;
                                        return (
                                            <TouchableOpacity
                                                key={item.value || 'all'}
                                                onPress={() => {
                                                    setSelectedSalesPerson(item.value);
                                                    setSalesModal(false);
                                                    setSalesSearch('');
                                                }}
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                    paddingHorizontal: 16, paddingVertical: 13,
                                                    borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
                                                    backgroundColor: sel ? '#f0fdf4' : '#fff',
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 14,
                                                    fontFamily: sel ? Fonts.Bold : Fonts.Regular,
                                                    color: sel ? Colors.buttonbgcolor : '#1e293b',
                                                }}>
                                                    {item.label}
                                                </Text>
                                                {sel && <Icon name="check" size={16} color={Colors.buttonbgcolor} />}
                                            </TouchableOpacity>
                                        );
                                    })}

                                {salesPersonList.filter(item => item.label?.toLowerCase().includes(salesSearch.toLowerCase())).length === 0 && (
                                    <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, fontFamily: Fonts.Regular, paddingVertical: 20 }}>
                                        No sales person found
                                    </Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={cityModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setCityModal(false)}
                        activeOpacity={1}
                    />
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, width: '85%', maxHeight: '60%' }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 16, paddingVertical: 14,
                            borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                        }}>
                            <Text style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}>Select Branch</Text>
                            <TouchableOpacity onPress={() => { setCityModal(false); setCitySearch(''); }}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            marginHorizontal: 16, marginTop: 12, marginBottom: 6,
                            borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
                            paddingHorizontal: 10, height: 38,
                        }}>
                            <Icon name="magnify" size={16} color="#94a3b8" />
                            <TextInput
                                value={citySearch}
                                onChangeText={setCitySearch}
                                placeholder="Search Branch..."
                                placeholderTextColor="#94a3b8"
                                style={{
                                    flex: 1, marginLeft: 8,
                                    fontSize: 13, fontFamily: Fonts.Regular,
                                    color: '#1e293b', padding: 0,
                                }}
                            />
                            {citySearch.length > 0 && (
                                <TouchableOpacity onPress={() => setCitySearch('')}>
                                    <Icon name="close-circle" size={16} color="#cbd5e1" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView>
                            {cityList
                                .filter(item => item.label?.toLowerCase().includes(citySearch.toLowerCase()))
                                .map(item => {
                                    const sel = item.value === cityFilter;
                                    return (
                                        <TouchableOpacity
                                            key={item.value || 'all-cities'}
                                            onPress={() => {
                                                setCityFilter(item.value);
                                                setCityModal(false);
                                                setCitySearch('');
                                            }}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                paddingHorizontal: 16, paddingVertical: 13,
                                                borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
                                                backgroundColor: sel ? '#f0fdf4' : '#fff',
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 14,
                                                fontFamily: sel ? Fonts.Bold : Fonts.Regular,
                                                color: sel ? Colors.buttonbgcolor : '#1e293b',
                                            }}>
                                                {item.label}
                                            </Text>
                                            {sel && <Icon name="check" size={16} color={Colors.buttonbgcolor} />}
                                        </TouchableOpacity>
                                    );
                                })}

                            {cityList.filter(item => item.label?.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                                <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, fontFamily: Fonts.Regular, paddingVertical: 20 }}>
                                    No city found
                                </Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={dateTypeModal} transparent animationType="fade" onRequestClose={() => setDateTypeModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        onPress={() => setDateTypeModal(false)}
                        activeOpacity={1}
                    />
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, width: '80%' }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 16, paddingVertical: 14,
                            borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                        }}>
                            <Text style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}>Select Date Type</Text>
                            <TouchableOpacity onPress={() => setDateTypeModal(false)}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {DATE_TYPE_OPTIONS.map(item => {
                            const sel = item.value === dateType;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    onPress={() => { setDateType(item.value); setDateTypeModal(false); }}
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                        paddingHorizontal: 16, paddingVertical: 13,
                                        borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
                                        backgroundColor: sel ? '#f0fdf4' : '#fff',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontFamily: sel ? Fonts.Bold : Fonts.Regular,
                                        color: sel ? Colors.buttonbgcolor : '#1e293b',
                                    }}>
                                        {item.label}
                                    </Text>
                                    {sel && <Icon name="check" size={16} color={Colors.buttonbgcolor} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

/* ══ Tentative Action Cell ══ */
const TentativeAction = ({ client, onUpdate, updateLoading }) => {
    const [date, setDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);

    return (
        <View style={{
            width: 200, paddingHorizontal: 10, paddingVertical: 10,
            flexDirection: 'row', alignItems: 'center', gap: 8,
            borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
        }}>
            {/* Date picker trigger */}
            <TouchableOpacity
                style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6,
                    paddingHorizontal: 7, paddingVertical: 5, backgroundColor: '#f8fafc',
                }}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.8}
            >
                <Text style={{ fontSize: 11, fontFamily: Fonts.Regular, color: '#64748b' }}>
                    {date
                        ? `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
                        : 'dd-mm-yyyy'}
                </Text>
                <Icon name="calendar" size={14} color="#94a3b8" />
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={date || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selected) => {
                        setShowPicker(false);
                        if (event.type === 'set' && selected) {
                            setDate(selected);
                        }
                        // if (selected) setDate(selected);
                    }}
                />
            )}

            {/* Update button */}
            <TouchableOpacity
                style={{
                    backgroundColor: Colors.buttonbgcolor, borderRadius: 6,
                    paddingHorizontal: 10, paddingVertical: 6,
                    opacity: (!date || updateLoading) ? 0.5 : 1,
                }}
                disabled={!date || updateLoading}
                onPress={() => onUpdate(client.client_id, date)}
                activeOpacity={0.8}
            >
                {updateLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={{ color: '#fff', fontSize: 12, fontFamily: Fonts.Bold }}>Update</Text>
                }
            </TouchableOpacity>
        </View>
    );
};

export default Calendarlist;
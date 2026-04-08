import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    Modal, ActivityIndicator, Platform,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const CITIES = [
    { label: 'All Cities', value: '' },
    { label: 'Surat', value: 'Surat' },
    { label: 'Mumbai', value: 'Mumbai' },
];

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

    const fetchCalendar = useCallback(async (m, y, city) => {
        setLoading(true);
        try {
            const res = await fetch(API.list_calendar, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: MONTHS[m], city: city || '' }),
            });
            const json = await res.json();
            if (json.code === 200) {
                const payload = json.payload;
                setTentativeClients(payload.tentative_records?.clients || []);
                const map = {};
                (payload.confirmed_bookings || []).forEach(b => {
                    map[b.booking_date] = { total_clients: b.total_clients, clients: b.clients };
                });
                setConfirmedMap(map);
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Failed to load calendar', position: 'bottom', bottomOffset: 60 });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCalendar(month, year, cityFilter); }, [month, year, cityFilter]);

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const openConfirmed = (dateStr, clients) => {
        const filtered = cityFilter ? clients.filter(c => c.client_city === cityFilter) : clients;
        if (!filtered.length) return;
        const [y, m, d] = dateStr.split('-');
        setDetailTitle(`Booking Details : ${d}/${m}/${y}`);
        setDetailClients(filtered);
        setIsTentativeModal(false);
        setDetailModal(true);
    };

    const openTentative = () => {
        const filtered = cityFilter ? tentativeClients.filter(c => c.client_city === cityFilter) : tentativeClients;
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
                body: JSON.stringify({ client_id: String(clientId), booking_date: toApiDate(date) }),
            });
            const result = await res.json();
            if (result.code == 200) {
                Toast.show({ type: 'success', text1: 'Date updated successfully', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
                setDetailModal(false);
                fetchCalendar(month, year, cityFilter);
            } else {
                Toast.show({ type: 'error', text1: result.message || 'Update failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setUpdateLoading(false); }
    };

    const tentativeCount = cityFilter
        ? tentativeClients.filter(c => c.client_city === cityFilter).length
        : tentativeClients.length;

    const grid = buildGrid(year, month);

    const getCount = (day) => {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = confirmedMap[key];
        if (!entry) return 0;
        if (!cityFilter) return entry.total_clients;
        return entry.clients.filter(c => c.client_city === cityFilter).length;
    };

    const getClients = (day) => {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return confirmedMap[key]?.clients || [];
    };

    const isToday = (day) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const COL_WIDTHS = [100, 110, 110, 90, 110, 170, 110, 170, 100, 160];
    const COL_HEADERS = ['ORDER NO', 'NAME', 'ADDRESS', 'CITY', 'MOBILE NO.', 'EMAIL', 'PURPOSE', 'REMARK', 'ADDED BY', 'ENTRY DATE'];

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
                        {/* ── TENTATIVE COUNT ── */}
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 }}
                            onPress={openTentative}
                            activeOpacity={0.85}
                        >
                            <Text style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}>
                                Tentative Records:
                            </Text>
                            <View style={{
                                width: 28, height: 28, borderRadius: 14,
                                backgroundColor: Colors.buttonbgcolor,
                                justifyContent: 'center', alignItems: 'center',
                            }}>
                                <Text style={{ color: '#fff', fontSize: 13, fontFamily: Fonts.Bold }}>
                                    {tentativeCount}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* ── MONTH NAV + CITY DROPDOWN ── */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between', // 🔥 left + right separate
                            paddingHorizontal: 12,
                            paddingBottom: 10,
                            marginTop: 10,
                        }}>

                            {/* LEFT SIDE (Month Controls) */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <TouchableOpacity
                                    onPress={prevMonth}
                                    style={{
                                        width: 34, height: 34, borderRadius: 8,
                                        backgroundColor: Colors.buttonbgcolor,
                                        justifyContent: 'center', alignItems: 'center'
                                    }}
                                >
                                    <Icon name="chevron-left" size={22} color="#fff" />
                                </TouchableOpacity>

                                <Text style={{
                                    fontSize: 16,
                                    fontFamily: Fonts.Bold,
                                    color: '#1e293b'
                                }}>
                                    {MONTHS[month]} {year}
                                </Text>

                                <TouchableOpacity
                                    onPress={nextMonth}
                                    style={{
                                        width: 34, height: 34, borderRadius: 8,
                                        backgroundColor: Colors.buttonbgcolor,
                                        justifyContent: 'center', alignItems: 'center'
                                    }}
                                >
                                    <Icon name="chevron-right" size={22} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* RIGHT SIDE (City Dropdown) */}
                            <Dropdown
                                data={CITIES}
                                labelField="label"
                                valueField="value"
                                value={cityFilter}
                                onChange={item => setCityFilter(item.value)}
                                style={{
                                    backgroundColor: Colors.buttonbgcolor,
                                    borderRadius: 8,
                                    paddingHorizontal: 10,
                                    height: 34,
                                    minWidth: 110
                                }}
                                placeholderStyle={{ color: '#fff', fontSize: 13, fontFamily: Fonts.Bold }}
                                selectedTextStyle={{ color: '#fff', fontSize: 13, fontFamily: Fonts.Bold }}
                                containerStyle={{
                                    borderRadius: 10,
                                    borderWidth: 0.5,
                                    borderColor: '#e2e8f0',
                                    elevation: 10,
                                    marginTop: 8,
                                }}
                                dropdownPosition="bottom"
                                renderRightIcon={() => <Icon name="chevron-down" size={16} color="#fff" />}
                                renderItem={item => {
                                    const sel = item.value === cityFilter;
                                    return (
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingHorizontal: 14,
                                            paddingVertical: 11,
                                            backgroundColor: sel ? '#f0fdf4' : '#fff',
                                        }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontFamily: sel ? Fonts.Bold : Fonts.Regular,
                                                color: sel ? Colors.buttonbgcolor : '#1e293b',
                                            }}>
                                                {item.label}
                                            </Text>
                                            {sel && <Icon name="check" size={16} color={Colors.buttonbgcolor} />}
                                        </View>
                                    );
                                }}
                            />
                        </View>

                        {/* ── CALENDAR GRID ── */}
                        <View style={{ marginHorizontal: 8, marginTop: 20, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>

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

                                        return (
                                            <TouchableOpacity
                                                key={colIdx}
                                                style={{
                                                    flex: 1, minHeight: 64,
                                                    borderRightWidth: 0.5, borderRightColor: '#e8ecf0',
                                                    padding: 5, alignItems: 'flex-end',
                                                    backgroundColor: today_ ? '#f0fdf4' : hasBooking ? '#eef2ff' : '#fff',
                                                }}
                                                activeOpacity={hasBooking ? 0.7 : 1}
                                                onPress={() => {
                                                    if (cell.current && hasBooking) {
                                                        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                                                        openConfirmed(key, getClients(cell.day));
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
                                                        backgroundColor: Colors.buttonbgcolor,
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
            <Modal visible={detailModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '97%', maxHeight: '80%', overflow: 'hidden' }}>

                        {/* Modal Header */}
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

                        {/* Horizontally scrollable table */}
                        <ScrollView horizontal showsHorizontalScrollIndicator>
                            <View style={{ paddingHorizontal: 3 }}>

                                {/* Table Head */}
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

                                {/* Table Rows */}
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
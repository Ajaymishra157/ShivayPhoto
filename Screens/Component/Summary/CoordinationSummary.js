import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = dateStr => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// dd-mm-yy
const formatDMY = date => {
    if (!date) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
};

// Date ko YYYY-MM-DD (local) me convert karta hai
const toYMD = value => {
    if (!value) return '';
    if (typeof value === 'string') {
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    }
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d)) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const bucketStyle = bucket => {
    switch (bucket) {
        case 'today':
            return { label: 'Today', color: '#DC2626', bg: '#FEE2E2' };
        case 'next_3_days':
            return { label: 'Next 3 Days', color: '#D97706', bg: '#FEF3C7' };
        case 'next_6_days':
            return { label: 'Next 6 Days', color: '#0284C7', bg: '#E0F2FE' };
        default:
            return { label: bucket || 'Upcoming', color: '#64748B', bg: '#F1F5F9' };
    }
};

const Stat = ({ icon, label, value, color, style }) => (
    <View
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
    </View>
);
const CoordinationSummary = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [counts, setCounts] = useState({ total: 0, today: 0, next_3_days: 0, next_6_days: 0 });
    const [list, setList] = useState([]);
    const [search, setSearch] = useState('');

    // Date filter (abhi sirf UI hai, filter aap apne hisaab se lagana)
    const [selectedDate, setSelectedDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const adminId = await AsyncStorage.getItem('id');

            const res = await fetch(API.coordination_next_days, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coordinator_id: adminId }),
            });

            const json = await res.json();

            if (json?.code == 200) {
                setCounts({
                    total: Number(json.count?.total) || 0,
                    today: Number(json.count?.today) || 0,
                    next_3_days: Number(json.count?.next_3_days) || 0,
                    next_6_days: Number(json.count?.next_6_days) || 0,
                });
                setList(json.payload || []);
            } else {
                setList([]);
                setError(json?.message || 'Could not load data.');
            }
        } catch (e) {
            console.log('Coordination summary error:', e);
            setList([]);
            setError('Unable to load data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onDateChange = (event, date) => {
        setShowPicker(false);
        if (event?.type === 'dismissed') return;
        if (date) setSelectedDate(date);
    };

    const filteredList = useMemo(() => {
        const q = search.trim().toLowerCase();
        const selectedYMD = selectedDate ? toYMD(selectedDate) : '';

        return list.filter(item => {
            // Booking date filter
            if (selectedYMD && toYMD(item.booking_date) !== selectedYMD) {
                return false;
            }

            // Search filter
            if (!q) return true;
            return `${item.order_no} ${item.client_name} ${item.mobile_no} ${item.coordinator_name} ${item.photographer_name} ${item.purpose} ${item.city}`
                .toLowerCase()
                .includes(q);
        });
    }, [list, search, selectedDate]);

    return (
        <View>
            <Text
                style={{
                    fontSize: 17,
                    fontFamily: 'Inter-Bold',
                    color: '#0F172A',
                    marginBottom: 9.4,
                    marginLeft: 2,
                }}
            >
                Coordination Summary
            </Text>

            {/* COUNTS */}
            {/* COUNTS */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Stat icon="format-list-bulleted" label="Total Bookings" value={counts.total} color="#6366F1" style={{ marginRight: 8 }} />
                <Stat icon="calendar-today" label="Today's Shoots" value={counts.today} color="#DC2626" />
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <Stat icon="calendar-arrow-right" label="Next 3 Days" value={counts.next_3_days} color="#D97706" style={{ marginRight: 8 }} />
                <Stat icon="calendar-week" label="Next 6 Days" value={counts.next_6_days} color="#0284C7" />
            </View>

            {/* SEARCH + DATE */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                    style={{
                        flex: 1,
                        height: 42,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        borderWidth: 0.6,
                        borderColor: '#E1DDF7',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 11,
                    }}
                >
                    <Icon name="magnify" size={18} color="#6366F1" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search booking, client..."
                        placeholderTextColor="#9997A8"
                        style={{
                            flex: 1,
                            marginLeft: 7,
                            padding: 0,
                            fontFamily: Fonts.Regular,
                            fontSize: 11.5,
                            color: '#2C2940',
                        }}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Icon name="close-circle" size={16} color="#AAA7B8" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowPicker(true)}
                    style={{
                        height: 42,
                        marginLeft: 8,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        borderWidth: 0.6,
                        borderColor: selectedDate ? '#6366F1' : '#E1DDF7',
                        backgroundColor: selectedDate ? '#F1EFFF' : '#fff',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <Icon name="calendar-month-outline" size={17} color="#6366F1" />
                    <Text
                        style={{
                            fontFamily: selectedDate ? Fonts.Bold : Fonts.Regular,
                            fontSize: 11,
                            color: selectedDate ? '#6366F1' : '#9997A8',
                            marginLeft: 6,
                        }}
                    >
                        {selectedDate ? formatDMY(selectedDate) : 'dd-mm-yy'}
                    </Text>
                    {selectedDate && (
                        <TouchableOpacity
                            onPress={() => setSelectedDate(null)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ marginLeft: 6 }}
                        >
                            <Icon name="close-circle" size={15} color="#AAA7B8" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </View>

            {showPicker && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            {loading ? (
                <View style={{ paddingVertical: 50, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : error !== '' ? (
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingVertical: 30,
                        alignItems: 'center',
                        borderWidth: 0.6,
                        borderColor: '#E6E2F1',
                    }}
                >
                    <Icon name="alert-circle-outline" size={32} color="#EF4444" />
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 12,
                            color: '#39364A',
                            marginTop: 8,
                            textAlign: 'center',
                            paddingHorizontal: 20,
                        }}
                    >
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={fetchData}
                        style={{
                            marginTop: 10,
                            backgroundColor: Colors.buttonbgcolor,
                            borderRadius: 8,
                            paddingHorizontal: 18,
                            paddingVertical: 8,
                        }}
                    >
                        <Text style={{ color: '#fff', fontFamily: Fonts.Bold, fontSize: 11 }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredList.length === 0 ? (
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingVertical: 40,
                        alignItems: 'center',
                        borderWidth: 0.6,
                        borderColor: '#E6E2F1',
                    }}
                >
                    <Icon name="calendar-blank-outline" size={38} color="#AAA7B8" />
                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#39364A', marginTop: 8 }}>
                        {search.trim() || selectedDate ? 'No results found' : 'No upcoming coordination'}
                    </Text>
                </View>
            ) : (
                filteredList.map((item, index) => {
                    const b = bucketStyle(item.bucket);
                    const photographer =
                        (item.photographer_name || '').trim() ||
                        (item.photographer_assigned ? 'Assigned' : 'Not Assigned');

                    return (
                        <View
                            key={`${item.client_id}-${index}`}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 13,
                                borderWidth: 0.6,
                                borderColor: '#E5E1F4',
                                padding: 12,
                                marginBottom: 10,
                                elevation: 1,
                                shadowColor: '#000',
                                shadowOpacity: 0.03,
                                shadowRadius: 3,
                                shadowOffset: { width: 0, height: 1 },
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 9,
                                        backgroundColor: '#EEECFF',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 9,
                                    }}
                                >
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 10, color: '#6366F1' }}>
                                        {index + 1}
                                    </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#29263B', textTransform: 'capitalize' }}
                                        numberOfLines={1}
                                    >
                                        #{item.order_no} · {item.client_name}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                        <Icon name="phone-outline" size={12} color="#77748A" />
                                        <Text style={{ fontFamily: Fonts.Regular, fontSize: 10, color: '#77748A', marginLeft: 4 }}>
                                            {item.mobile_no}
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    style={{
                                        backgroundColor: b.bg,
                                        borderRadius: 12,
                                        paddingHorizontal: 9,
                                        paddingVertical: 4,
                                    }}
                                >
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 9, color: b.color }}>
                                        {b.label}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ height: 0.6, backgroundColor: '#ECE9F3', marginVertical: 9 }} />

                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={labelStyle}>SHOOT DATE</Text>
                                    <Text style={valueStyle} numberOfLines={1}>
                                        {formatDate(item.booking_date)}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={labelStyle}>PURPOSE</Text>
                                    <Text style={valueStyle} numberOfLines={1}>
                                        {item.purpose || 'N/A'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={labelStyle}>DAYS LEFT</Text>
                                    <Text style={valueStyle}>{item.diff_days ?? '-'}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', marginTop: 9 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={labelStyle}>COORDINATOR</Text>
                                    <Text style={[valueStyle, { textTransform: 'capitalize' }]} numberOfLines={1}>
                                        {(item.coordinator_name || '').trim() || 'Unassigned'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={labelStyle}>PHOTOGRAPHER</Text>
                                    <Text
                                        style={[
                                            valueStyle,
                                            {
                                                textTransform: 'capitalize',
                                                color: item.photographer_assigned ? '#16A34A' : '#D97706',
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {photographer}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={labelStyle}>CITY</Text>
                                    <Text style={valueStyle} numberOfLines={1}>
                                        {item.city || 'N/A'}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 10,
                                    alignSelf: 'flex-start',
                                    backgroundColor: '#F1EFFF',
                                    borderRadius: 9,
                                    paddingHorizontal: 9,
                                    paddingVertical: 5,
                                }}
                            >
                                <Icon name="progress-check" size={13} color="#6366F1" />
                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 9.5, color: '#6366F1', marginLeft: 5 }}>
                                    {item.current_stage || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    );
                })
            )}
        </View>
    );
};

const labelStyle = {
    fontFamily: Fonts.Bold,
    fontSize: 8.5,
    color: '#9692A5',
    letterSpacing: 0.5,
    marginBottom: 2,
};

const valueStyle = {
    fontFamily: Fonts.Bold,
    fontSize: 10.5,
    color: '#555265',
};

export default CoordinationSummary;
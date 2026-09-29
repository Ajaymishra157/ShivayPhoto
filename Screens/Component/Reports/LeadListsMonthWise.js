import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    FlatList, StyleSheet, ScrollView, SafeAreaView, StatusBar, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';

/* ---------- STATIC DATA ---------- */
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
];

/* ---------- HELPERS ---------- */
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

/* ---------- TABLE ROW (Memoised) ---------- */
const TableRow = React.memo(({ item, index, navigation }) => {
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

    const handleMobilePress = () => {
        navigation.navigate('LeadDetail', { enquiry_id: item.enquiry_id });
    };

    return (
        <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
            {TABLE_COLS.map(col => {
                if (col.key === 'mobile') {
                    return (
                        <View key={col.key} style={[styles.cell, { width: col.width }]}>
                            <TouchableOpacity
                                onPress={handleMobilePress}
                                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                            >
                                <Text style={[styles.cellText, styles.mobileText]} numberOfLines={1}>
                                    {cellVal(col.key)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                }
                return (
                    <View key={col.key} style={[styles.cell, { width: col.width }]}>
                        <Text style={styles.cellText} numberOfLines={2}>
                            {cellVal(col.key)}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
});

/* ---------- MAIN SCREEN ---------- */
const LeadListsMonthWise = ({ navigation }) => {
    const route = useRoute();
    const selectedDate = route.params?.date || '';
    const selectedType = route.params?.type || '';

    const [leads, setLeads] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [userType, setUserType] = useState(null);

    const userTypeRef = useRef(userType);
    useEffect(() => { userTypeRef.current = userType; }, [userType]);

    /* fetch user type once on mount */
    useEffect(() => {
        fetchUserType();
    }, []);

    /* fetch leads whenever page OR userType becomes available */
    useEffect(() => {
        if (userType !== null) {
            fetchLeads(page, page === 1);
        }
    }, [page, userType]);

    /* ---- fetchUserType ---- */
    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');
            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId }),
            });
            const result = await res.json();
            if (result.code == 200 && result.payload.length > 0) {
                const type = result.payload[0].user_type;
                setUserType(type);
                userTypeRef.current = type;
            } else {
                setUserType('');
            }
        } catch {
            setUserType('');
        }
    };

    /* ---- build request body ---- */
    const buildBody = useCallback(async (pg) => {
        const loginId = await AsyncStorage.getItem('id');
        const type = userTypeRef.current?.trim();
        return {
            page: String(pg),
            report_date: selectedDate,
            // status: selectedType,
            // id: type === 'Sales-Person' ? loginId : '',
        };
    }, [selectedDate, selectedType]);

    /* ---- fetch leads ---- */
    const fetchLeads = useCallback(async (pg, reset = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        try {
            const body = await buildBody(pg);
            console.log("body kya hai ye hai bro", body)
            const res = await fetch(API.list_lead, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();

            if (json.code == 200) {
                const payload = json.payload || [];
                setLeads(prev => reset ? payload : [...prev, ...payload]);
                setHasMore(payload.length >= 50);
            } else {
                if (reset) setLeads([]);
                setHasMore(false);
            }
        } catch {
            Alert.alert('Error', 'Failed to fetch leads');
            if (reset) setLeads([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setInitialLoad(false);
        }
    }, [buildBody]);

    /* ---- pagination ---- */
    const handleEndReached = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            setPage(prev => prev + 1);
        }
    }, [loadingMore, hasMore, loading]);

    /* ---- render helpers ---- */
    const renderRow = useCallback(({ item, index }) => (
        <TableRow item={item} index={index} navigation={navigation} />
    ), [navigation]);

    const keyExtractor = useCallback(item => String(item.enquiry_id), []);

    const ListEmpty = useMemo(() => (
        !loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
                <Icon name="clipboard-text-off-outline" size={40} color="#cbd5e1" />
                <Text style={{ color: '#94a3b8', fontFamily: Fonts.Regular, marginTop: 8 }}>
                    No leads found
                </Text>
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

    /* ---- UI ---- */
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lead List</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Sub-header showing active filters */}

            {(selectedDate || selectedType) ? (
                <View style={styles.filterBar}>
                    {selectedDate ? (
                        <View style={styles.filterChip}>
                            <Icon name="calendar-range" size={13} color={Colors.buttonbgcolor} />
                            <Text style={styles.filterChipText}>
                                {formatDate(selectedDate)}
                            </Text>
                        </View>
                    ) : null}

                    {/* Total Records Badge - Date ke paas */}
                    <View style={styles.countBadge}>
                        <Icon name="account-group-outline" size={13} color="#fff" />
                        <Text style={styles.countBadgeText}>
                            {leads.length} {hasMore ? '+' : ''} Records
                        </Text>
                    </View>

                    {selectedType ? (
                        <View style={styles.filterChip}>
                            <Icon name="filter-outline" size={13} color={Colors.buttonbgcolor} />
                            <Text style={styles.filterChipText}>{selectedType}</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}

            {/* Content */}
            {initialLoad ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={Colors.buttonbgcolor} size="large" />
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <View>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            {TABLE_COLS.map(col => (
                                <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                                    <Text style={styles.headerCellText}>{col.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Table Rows */}
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
                            initialNumToRender={20}
                            ListEmptyComponent={ListEmpty}
                            ListFooterComponent={ListFooter}
                        />
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
    header: {
        height: 50,
        backgroundColor: Colors.buttonbgcolor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.Bold,
    },
    filterBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ede9fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.buttonbgcolor,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        // marginLeft: 'auto', ❌ Removed
    },
    countBadgeText: {
        fontSize: 12,
        fontFamily: Fonts.Bold,
        color: '#fff',
    },
    filterChipText: {
        fontSize: 12,
        fontFamily: Fonts.Regular,
        color: Colors.buttonbgcolor,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: Colors.buttonbgcolor,
        paddingVertical: 10,
    },
    headerCell: {
        justifyContent: 'center',
        paddingHorizontal: 8,
        borderRightWidth: 0.5,
        borderRightColor: 'rgba(255,255,255,0.2)',
    },
    headerCellText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: Fonts.Bold,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    rowEven: { backgroundColor: '#fff' },
    rowOdd: { backgroundColor: '#f8fafc' },
    cell: {
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderRightWidth: 0.5,
        borderRightColor: '#f1f5f9',
    },
    cellText: {
        fontSize: 12,
        fontFamily: Fonts.Regular,
        color: '#334155',
    },
    mobileText: {
        color: '#7367f0',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default LeadListsMonthWise;
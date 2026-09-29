import React, { useState } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../Commoncomponent/Constants';
import { useFocusEffect } from '@react-navigation/native';
import Penaltylistshimmer from '../Shimmer/Penalty/Penaltylistshimmer';

/* ── STATIC DATA (API baad me connect karna) ── */
const PENALTIES = [
    {
        id: '1',
        staff: 'Shahrukh Khan',
        amount: '500',
        reason: 'Late arrival at shoot location',
        penalty_date: '2026-08-18',
        entry_date: '2026-08-18',
        status: 'Pending',
    },
    {
        id: '2',
        staff: 'Riya',
        amount: '300',
        reason: 'Missed delivery deadline for ORD-004',
        penalty_date: '2026-08-15',
        entry_date: '2026-08-14',
        status: 'Paid',
    },
    {
        id: '3',
        staff: 'Gopika',
        amount: '200',
        reason: 'Incomplete client requirements form',
        penalty_date: '2026-08-20',
        entry_date: '2026-08-19',
        status: 'Pending',
    },
];

const STATUS_COLORS = {
    Paid: { bg: '#dcfce7', text: '#15803D' },
    Pending: { bg: '#fef9c3', text: '#A16207' },
    Waived: { bg: '#f1f5f9', text: '#64748b' },
};

const fmtDate = (dateString) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
};

const formatDateTime = (dateString) => {
    if (!dateString) return '--';

    const dateObj = new Date(dateString);

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};
const ListPenalty = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState(PENALTIES);
    const [loading, setLoading] = useState(false);
    const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);

    const fetchPenalties = async () => {
        setLoading(true);
        // TODO: API ready hone par yaha fetch(API.list_penalty) call karna
        setTimeout(() => {
            setFiltered(PENALTIES);
            setIsFirstLoadDone(true);
            setLoading(false);
        }, 600);
    };

    useFocusEffect(
        React.useCallback(() => {
            if (search === '') fetchPenalties();
        }, [search])
    );

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();
        setFiltered(
            PENALTIES.filter(p =>
                (p.staff || '').toLowerCase().includes(q) ||
                (p.reason || '').toLowerCase().includes(q)
            )
        );
    };

    const renderItem = ({ item, index }) => {
        const statusStyle = STATUS_COLORS[item.status] || { bg: '#f1f5f9', text: '#64748b' };
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PenaltyDetail', { penalty_id: item.id })}
                style={{
                    backgroundColor: '#fff',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    marginVertical: 5,
                    borderWidth: 1,
                    borderColor: '#eee',
                    position: 'relative',
                }}
            >
                {/* STATUS TOP RIGHT */}
                <View style={{
                    position: 'absolute', top: 0, right: 0,
                    backgroundColor: statusStyle.bg,
                    paddingHorizontal: 8, paddingVertical: 2,
                    borderBottomLeftRadius: 8, borderTopRightRadius: 10,
                }}>
                    <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: statusStyle.text }}>
                        {item.status}
                    </Text>
                </View>

                <Text style={{ fontSize: 10, color: '#94a3b8', fontFamily: Fonts.Regular, marginTop: 1 }}>
                    #{index + 1}
                </Text>

                {/* STAFF */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                    <View style={{
                        width: 24, height: 24, borderRadius: 12, backgroundColor: '#ede9fe',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <Icon name="account-outline" size={13} color={Colors.buttonbgcolor} />
                    </View>
                    <Text style={{ fontSize: 13, color: '#1e293b', fontFamily: Fonts.Bold }}>
                        {item.staff}
                    </Text>
                    <Text style={{ fontSize: 15, color: '#DC2626', fontFamily: Fonts.Bold, marginLeft: 'auto' }}>
                        ₹{item.amount}
                    </Text>
                </View>

                {/* REASON */}
                <Text style={{ fontSize: 11, color: '#7f8c8d', fontFamily: Fonts.Regular, marginTop: 4 }} numberOfLines={1}>
                    {item.reason}
                </Text>

                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 6 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Icon name="calendar" size={12} color="#94a3b8" />
                        <Text style={{ fontSize: 11, color: '#475569', fontFamily: Fonts.Regular }}>
                            Penalty: {fmtDate(item.penalty_date)}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Icon name="calendar-check" size={12} color="#94a3b8" />
                        <Text style={{ fontSize: 11, color: '#475569', fontFamily: Fonts.Regular }}>
                            Entry On: {formatDateTime(item.entry_date)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View style={{
                height: 52, flexDirection: 'row', alignItems: 'center',
                backgroundColor: Colors.buttonbgcolor, paddingHorizontal: 12,
            }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ width: 36, justifyContent: 'center', alignItems: 'flex-start' }}
                >
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{
                    flex: 1, textAlign: 'center', fontSize: 17,
                    fontFamily: Fonts.Bold, color: '#fff',
                }}>
                    Penalties
                </Text>
                <View style={{ width: 36 }} />
            </View>

            {/* SEARCH */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                borderRadius: 12, margin: 14, paddingHorizontal: 12, height: 44,
                borderWidth: 0.5, borderColor: '#e2e8f0', gap: 8,
            }}>
                <Icon name="magnify" size={18} color="#94a3b8" />
                <TextInput
                    placeholder="Search by staff, reason..."
                    value={search}
                    onChangeText={handleSearch}
                    style={{ flex: 1, fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b' }}
                    placeholderTextColor="#c0ccd8"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Icon name="close-circle" size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                )}
            </View>

            {/* COUNT */}
            <Text style={{
                fontSize: 12, fontFamily: Fonts.Regular, color: '#94a3b8',
                marginLeft: 16, marginBottom: 4,
            }}>
                {filtered.length} penalt{filtered.length !== 1 ? 'ies' : 'y'} found
            </Text>


            {loading ? (
                <Penaltylistshimmer />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 4, paddingHorizontal: 12 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 220 }}>
                            <Icon name="alert-circle-outline" size={48} color="#cbd5e1" />
                            <Text style={{ fontSize: 14, fontFamily: Fonts.Regular, color: '#94a3b8', marginTop: 12 }}>
                                No Penalties Found
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                onPress={() => navigation.navigate('AddPenalty')}
                style={{
                    position: 'absolute', bottom: 25, right: 20,
                    backgroundColor: Colors.buttonbgcolor,
                    width: 60, height: 60, borderRadius: 30,
                    justifyContent: 'center', alignItems: 'center',
                    elevation: 10, zIndex: 999,
                    shadowColor: '#000', shadowOpacity: 0.3,
                    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
                }}
            >
                <Icon name="plus" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ListPenalty;
import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import ListBookingShimmer from '../Shimmer/Booking/ListBookingShimmer';

const PAGE_SIZE = 20;

/* Stage ke hisaab se color — pipeline stages */
const STAGE_COLORS = {
    'Concept Finalized': '#0EA5E9',
    'Outfit Finalized': '#8B5CF6',
    'Props Ready': '#F59E0B',
    'Client Requirements': '#EC4899',
    'Shoot Assignment': '#6366F1',
    'Done': '#16A34A',
};

const STAGES = [
    'Concept Finalized',
    'Outfit Finalized',
    'Props Ready',
    'Client Requirements',
    'Shoot Assignment',
    'Done',
];
const getStageColor = stage => STAGE_COLORS[stage] || '#64748b';

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

const Bookinglist = ({ navigation }) => {
    const [bookings, setBookings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [stageCounts, setStageCounts] = useState({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isFirstBookingDone, setIsFirstBookingDone] = useState(false);
    const [selectedStage, setSelectedStage] = useState('All');

    /* ================= CLIENT-SIDE PAGINATION ================= */
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const visibleData = filtered.slice(0, page * PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [search, bookings]);

    const handleLoadMore = () => {
        if (loadingMore) return;
        if (visibleData.length >= filtered.length) return;

        setLoadingMore(true);
        setTimeout(() => {
            setPage(prev => prev + 1);
            setLoadingMore(false);
        }, 400);
    };

    const fetchBookings = async (stage = 'All') => {
        setLoading(true);

        try {
            const response = await fetch(API.list_booking, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stage: stage === 'All' ? '' : stage,
                }),
            });

            const result = await response.json();

            if (result.code == 200) {
                setBookings(result.payload || []);
                setFiltered(result.payload || []);
                setStageCounts(result.stage_counts || {});
            } else {
                setBookings([]);
                setFiltered([]);
                setStageCounts({});
            }
        } catch (e) {
            setBookings([]);
            setFiltered([]);
            setStageCounts({});
        }

        setIsFirstBookingDone(true);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings(selectedStage);
        setRefreshing(false);
    };
    useFocusEffect(
        useCallback(() => {
            if (search === '') {
                fetchBookings(selectedStage);
            }
        }, [search, selectedStage])
    );

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();

        setFiltered(
            bookings.filter(b =>
                (b.client_name || '').toLowerCase().includes(q) ||
                (b.client_mobile || '').toLowerCase().includes(q) ||
                (b.client_address || '').toLowerCase().includes(q) ||
                (b.order_no || '').toString().toLowerCase().includes(q)
            )
        );
    };

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('BookingDetail', {
                client_id: item.client_id
            })}
            style={{
                backgroundColor: '#fff',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 6,
                marginVertical: 7,
                borderWidth: 1,
                borderColor: '#ddd',
                position: 'relative'
            }}
        >


            {/* STATUS */}
            <View style={{
                position: 'absolute',
                top: 0,
                right: 0,

                backgroundColor:
                    item.booking_status?.toLowerCase() === 'done'
                        ? '#dcfce7'       // light green
                        : item.booking_status?.toLowerCase() === 'inprocess'
                            ? '#fef3c7'   // light orange
                            : '#f1f5f9',  // default

                paddingHorizontal: 10,
                paddingVertical: 3,
                borderBottomLeftRadius: 6,
                borderTopRightRadius: 6,
                zIndex: 2
            }}>
                <Text style={{
                    fontSize: 10,
                    fontFamily: 'Inter-Bold',

                    color:
                        item.booking_status?.toLowerCase() === 'done'
                            ? '#15803d'       // green
                            : item.booking_status?.toLowerCase() === 'inprocess'
                                ? '#b45309'   // orange
                                : '#64748b',  // default
                }}>
                    {item.booking_status || '--'}
                </Text>
            </View>

            {/* RIGHT ARROW */}
            <View style={{
                position: 'absolute',
                right: 5,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                padding: 6
            }}>
                <View style={{
                    borderRadius: 30,
                    borderWidth: 0.6,
                    borderColor: '#c1c2c4',
                    padding: 6,
                    backgroundColor: '#fff'
                }}>
                    <Icon name="chevron-right" size={20} color="#2c3e50" />
                </View>
            </View>

            {/* INDEX + ORDER NO */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{
                    fontSize: 11,
                    color: '#2c3e50',
                    marginBottom: 4,
                    fontFamily: 'Inter-Bold'
                }}>
                    #{index + 1}
                </Text>

                {/* {item.order_no ? (
                    <Text style={{
                        fontSize: 11,
                        color: '#94a3b8',
                        marginBottom: 4,
                        marginLeft: 8,
                        fontFamily: 'Inter-Regular'
                    }}>
                        Order #{item.order_no}
                    </Text>
                ) : null} */}
            </View>

            {/* NAME + STAGE BADGE */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginTop: 2,
                paddingRight: 60,
            }}>
                <Text style={{
                    fontSize: 13,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Name :
                </Text>
                <Text style={{
                    fontSize: 13,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular',
                    textTransform: 'capitalize'
                }}>
                    {" "}{item.client_name || '--'}
                </Text>

                {item.current_stage ? (
                    <View style={{
                        backgroundColor: `${getStageColor(item.current_stage)}1A`,
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        marginLeft: 8,
                    }}>
                        <Text style={{
                            fontSize: 9,
                            fontFamily: 'Inter-Bold',
                            color: getStageColor(item.current_stage),
                        }}>
                            {item.current_stage}
                        </Text>
                    </View>
                ) : null}
            </View>

            {/* MOBILE */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Mobile :
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.client_mobile || '--'}
                </Text>
            </Text>

            {/* ADDRESS */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Address :
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular',
                    textTransform: 'capitalize'
                }}>
                    {" "}{item.client_address || '--'}
                </Text>
            </Text>

            {/* ENTRY DATE */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Entry On :
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{formatDateTime(item.entry_date)}
                </Text>
            </Text>

        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View style={{
                height: 52,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.buttonbgcolor,
                paddingHorizontal: 12,
            }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ width: 36 }}
                >
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 17,
                    fontFamily: 'Inter-Bold',
                    color: '#fff',
                }}>
                    Bookings
                </Text>

                <View style={{ width: 36 }} />
            </View>

            {/* SEARCH */}
            {(
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    marginHorizontal: 14,
                    marginTop: 14,
                    paddingHorizontal: 12,
                    height: 44,
                    borderWidth: 0.5,
                    borderColor: '#e2e8f0',
                    gap: 8,
                }}>
                    <Icon name="magnify" size={18} color="#94a3b8" />
                    <TextInput
                        placeholder="Search by name, mobile, address..."
                        value={search}
                        onChangeText={handleSearch}
                        style={{
                            flex: 1,
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#1e293b',
                        }}
                        placeholderTextColor="#c0ccd8"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Icon name="close-circle" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* ================= STAGE COUNT CHIPS (non-clickable) ================= */}
            {/* ================= STAGE FILTER CHIPS ================= */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    alignItems: 'center',
                }}
                style={{
                    flexGrow: 0,
                    minHeight: 54,
                }}
            >
                {/* ALL */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        setSelectedStage('All');
                        setSearch('');
                        fetchBookings('All');
                    }}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                            selectedStage === 'All'
                                ? Colors.buttonbgcolor
                                : '#fff',
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        minHeight: 34,
                        borderWidth: 0.6,
                        borderColor:
                            selectedStage === 'All'
                                ? Colors.buttonbgcolor
                                : '#e2e8f0',
                        marginRight: 8,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            fontFamily: Fonts.Bold,
                            color:
                                selectedStage === 'All'
                                    ? '#fff'
                                    : '#334155',
                        }}
                    >
                        All ({stageCounts?.total ?? bookings.length})
                    </Text>
                </TouchableOpacity>

                {/* STAGES */}
                {STAGES.map((stage) => {
                    const count = stageCounts?.[stage] ?? 0;
                    const color = getStageColor(stage);
                    const isActive = selectedStage === stage;

                    return (
                        <TouchableOpacity
                            key={stage}
                            activeOpacity={0.8}
                            onPress={() => {
                                setSelectedStage(stage);
                                setSearch('');
                                fetchBookings(stage);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor:
                                    isActive ? color : '#fff',
                                borderRadius: 20,
                                paddingHorizontal: 12,
                                minHeight: 34,
                                borderWidth: 0.6,
                                borderColor:
                                    isActive ? color : '#e2e8f0',
                                marginRight: 8,
                            }}
                        >
                            <View
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor:
                                        isActive ? '#fff' : color,
                                    marginRight: 6,
                                }}
                            />

                            <Text
                                style={{
                                    fontSize: 11,
                                    fontFamily: Fonts.Bold,
                                    color:
                                        isActive ? '#fff' : '#334155',
                                }}
                            >
                                {stage} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
            {/* COUNT */}
            {(
                <Text style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginLeft: 16,
                    marginTop: 10,
                    marginBottom: 4,
                }}>
                    {filtered.length} booking{filtered.length !== 1 ? 's' : ''} found
                    {search.length > 0 ? ` with ${search}` : ''}
                </Text>
            )}

            {/* LIST */}
            {loading ? (
                <ListBookingShimmer />
            ) : (
                <FlatList
                    data={visibleData}
                    keyExtractor={(item, index) => item.client_id?.toString() || index.toString()}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 4, paddingHorizontal: 12 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.buttonbgcolor]} />
                    }
                    onEndReachedThreshold={0.4}
                    onEndReached={handleLoadMore}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 220 }}>
                            <Icon name="calendar-remove-outline" size={48} color="#cbd5e1" />
                            <Text style={{
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#94a3b8',
                                marginTop: 12,
                            }}>
                                No Bookings Found
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FLOATING + BUTTON */}
            <TouchableOpacity
                onPress={() => navigation.navigate('AddBooking')}
                style={{
                    position: 'absolute',
                    bottom: 25,
                    right: 20,
                    backgroundColor: Colors.buttonbgcolor,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 10,
                }}
            >
                <Icon name="plus" size={28} color="#fff" />
            </TouchableOpacity>

        </SafeAreaView>
    );
};

export default Bookinglist;
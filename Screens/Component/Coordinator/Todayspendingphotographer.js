import React, {
    useState,
    useMemo,
    useCallback,
    useEffect,
    memo,
} from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Linking,
    RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors, Fonts, API } from '../Commoncomponent/Constants';

/* =========================================================
   HELPERS
========================================================= */

const callNumber = mobile => {
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`);
};

/* =========================================================
   PENDING CARD
========================================================= */

const PendingCard = memo(({ item, navigation, onOpen, onAssign }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpen(item)}
            style={{
                backgroundColor: '#fff',
                marginBottom: 7,
                borderRadius: 10,
                padding: 9,
                borderLeftWidth: 3,
                borderLeftColor: '#EF4444',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 2,
                elevation: 1,
            }}
        >
            {/* TOP */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                        style={{
                            color: '#9aa0a6',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                            marginBottom: 1,
                        }}
                    >
                        Client Name
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={{
                            color: '#172033',
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            textTransform: 'capitalize',
                        }}
                    >
                        {item.client_name || '-'}
                    </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text
                        style={{
                            color: '#9aa0a6',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                        }}
                    >
                        Booking No.
                    </Text>

                    <Text
                        style={{
                            color: '#475569',
                            fontFamily: Fonts.Bold,
                            fontSize: 10,
                        }}
                    >
                        #{item.order_no || item.client_id || '-'}
                    </Text>

                    <TouchableOpacity
                        onPress={() => callNumber(item.client_mobile)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 2,
                        }}
                    >
                        <Icon name="phone-outline" size={9} color="#94a3b8" />
                        <Text
                            style={{
                                color: '#94a3b8',
                                fontFamily: Fonts.Regular,
                                fontSize: 9,
                                marginLeft: 3,
                            }}
                        >
                            {item.client_mobile || '-'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* DETAILS */}
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 7,
                    paddingTop: 6,
                    borderTopWidth: 0.5,
                    borderTopColor: '#edf0f2',
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: '#9aa0a6',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                        }}
                    >
                        Event Type
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 2,
                        }}
                    >
                        <Icon name="tag-outline" size={11} color="#64748b" />
                        <Text
                            numberOfLines={1}
                            style={{
                                color: '#475569',
                                fontFamily: Fonts.Medium,
                                fontSize: 10,
                                marginLeft: 4,
                                textTransform: 'capitalize',
                            }}
                        >
                            {item.purpose || '-'}
                        </Text>
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: '#9aa0a6',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                        }}
                    >
                        Coordinator
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 2,
                        }}
                    >
                        <Icon name="account-outline" size={11} color="#64748b" />
                        <Text
                            numberOfLines={1}
                            style={{
                                flex: 1,
                                color: '#475569',
                                fontFamily: Fonts.Regular,
                                fontSize: 10,
                                marginLeft: 4,
                                textTransform: 'capitalize',
                            }}
                        >
                            {item.coordinator_name || '-'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onAssign(item)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: Colors.buttonbgcolor + '15',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        height: 28,
                    }}
                >
                    <Text
                        style={{
                            color: Colors.buttonbgcolor,
                            fontFamily: Fonts.Bold,
                            fontSize: 10,
                        }}
                    >
                        Assign
                    </Text>

                    <Icon
                        name="account-plus-outline"
                        size={13}
                        color={Colors.buttonbgcolor}
                        style={{ marginLeft: 4 }}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});

/* =========================================================
   EMPTY BOX
========================================================= */

const EmptyBox = memo(() => (
    <View
        style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            paddingVertical: 40,
            alignItems: 'center',
            elevation: 1,
        }}
    >
        <View
            style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#f0fdf4',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
            }}
        >
            <Icon name="check-circle-outline" size={34} color="#16A34A" />
        </View>

        <Text
            style={{
                fontSize: 14,
                fontFamily: Fonts.Bold,
                color: '#1e293b',
            }}
        >
            All caught up!
        </Text>

        <Text
            style={{
                fontSize: 12,
                fontFamily: Fonts.Regular,
                color: '#94a3b8',
                marginTop: 4,
            }}
        >
            No pending photographer assignments today.
        </Text>
    </View>
));

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Todayspendingphotographer = () => {
    const navigation = useNavigation();

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [items, setItems] = useState([]);

    /* ── Map API item shape -> card ke expected shape ── */
    const mapItem = (it) => ({
        client_id: it.client_id,
        order_no: it.order_no,
        client_name: it.client_name,
        client_mobile: it.mobile_no,        // 👈 API me mobile_no aata hai
        purpose: it.purpose,
        coordinator_name: it.coordinator_name,
        // baaki raw fields bhi rakh do agar detail screen ko chahiye ho
        ...it,
    });

    const fetchTodaysPending = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const uid = await AsyncStorage.getItem('id');

            const payload = {
                search: '',
                stage: 'All',
                coordinator_id: Number(uid || 0),
                photographer_id: 0,
                status: '',
            };

            const res = await fetch(API.coordinator_wise_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (json?.status === true) {
                const rawItems = json?.today_shoots_unassigned?.items || [];
                setItems(rawItems.map(mapItem));
            } else {
                setItems([]);
            }
        } catch (error) {
            setItems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTodaysPending();
    }, [fetchTodaysPending]);

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;

        return items.filter(it => {
            return (
                String(it.client_name || '').toLowerCase().includes(q) ||
                String(it.order_no || '').toLowerCase().includes(q) ||
                String(it.client_mobile || '').includes(q) ||
                String(it.coordinator_name || '').toLowerCase().includes(q)
            );
        });
    }, [items, search]);

    const openDetail = useCallback(
        item => {
            navigation.navigate('NewCoordination', { bookingData: item });
        },
        [navigation]
    );

    const renderItem = useCallback(
        ({ item }) => (
            <PendingCard
                item={item}
                navigation={navigation}
                onOpen={openDetail}
                onAssign={openDetail}
            />
        ),
        [navigation, openDetail]
    );

    const keyExtractor = useCallback(
        (item, index) => String(item.client_id || item.order_no || index),
        []
    );

    const renderEmpty = useCallback(() => {
        if (loading) {
            return (
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 14,
                        paddingVertical: 45,
                        alignItems: 'center',
                    }}
                >
                    <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                    <Text
                        style={{
                            marginTop: 10,
                            fontFamily: Fonts.Regular,
                            fontSize: 12,
                            color: '#94a3b8',
                        }}
                    >
                        Loading...
                    </Text>
                </View>
            );
        }

        return <EmptyBox />;
    }, [loading]);

    const ListHeader = useMemo(
        () => (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    height: 44,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 0.5,
                    borderColor: '#e8e5f5',
                    marginBottom: 10,
                }}
            >
                <Icon name="magnify" size={20} color="#7367f0" />

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search booking, client, mobile, coordinator..."
                    placeholderTextColor="#999"
                    style={{
                        flex: 1,
                        marginLeft: 8,
                        paddingVertical: 0,
                        fontFamily: Fonts.Regular,
                        fontSize: 12,
                        color: '#172033',
                    }}
                    returnKeyType="search"
                    blurOnSubmit={false}
                />

                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Icon name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>
        ),
        [search]
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View
                style={{
                    height: 52,
                    backgroundColor: Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
                    style={{ width: 28, alignItems: 'flex-start', justifyContent: 'center' }}
                >
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text
                    style={{
                        color: '#fff',
                        fontSize: 16,
                        fontFamily: Fonts.Bold,
                        flex: 1,
                        textAlign: 'center',
                    }}
                >
                    Pending Photographer
                </Text>

                <View
                    style={{
                        minWidth: 26,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 6,
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontFamily: Fonts.Bold,
                            fontSize: 11,
                        }}
                    >
                        {filteredItems.length}
                    </Text>
                </View>
            </View>

            {/* LIST */}
            <FlatList
                data={filteredItems}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 10, paddingBottom: 25, flexGrow: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchTodaysPending(true)}
                        colors={[Colors.buttonbgcolor]}
                    />
                }
            />
        </View>
    );
};

export default Todayspendingphotographer;
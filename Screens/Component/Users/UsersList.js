import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import UserListShimmer from '../Shimmer/Users/UserListShimmer';

const PAGE_SIZE = 20;

/* Type ke hisaab se badge color — list na mile to default grey */
const ROLE_COLORS = {
    'Admin': '#0284C7',
    'Coordinator': '#8B5CF6',
    'Coordinator → Editor': '#8B5CF6',
    'Photographer': '#F59E0B',
    'Photo Editor': '#EC4899',
    'Video Editor': '#6366F1',
    'Sales-Person': '#16A34A',
    'Booking-Person': '#0EA5E9',
};
const getRoleColor = type => ROLE_COLORS[type] || '#64748b';

const getRoleDisplayName = (type) => {
    const ROLE_DISPLAY_NAMES = {
        'Coordinator → Editor': 'Coordinator Post Production',
    };

    return ROLE_DISPLAY_NAMES[type] || type;
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
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const UsersList = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [counts, setCounts] = useState({});
    const [masterCounts, setMasterCounts] = useState({});
    const [selectedType, setSelectedType] = useState(''); // '' = All

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);

    /* ================= CLIENT-SIDE PAGINATION ================= */
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const visibleData = filtered.slice(0, page * PAGE_SIZE);

    // search / type / fresh-data badalte hi pagination reset
    useEffect(() => {
        setPage(1);
    }, [search, selectedType, users]);

    const handleLoadMore = () => {
        if (loadingMore) return;
        if (visibleData.length >= filtered.length) return;

        setLoadingMore(true);
        // real API pagination nahi hai, isliye chota sa delay taaki loader dikhe
        setTimeout(() => {
            setPage(prev => prev + 1);
            setLoadingMore(false);
        }, 400);
    };

    /* ================= FETCH (type-wise filter API se) ================= */
    const fetchUsers = async (type = selectedType) => {
        setLoading(true);
        try {
            const response = await fetch(API.list_user, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_type: type }),
            });
            const result = await response.json();

            if (result.code == 200) {
                setUsers(result.payload || []);
                setFiltered(result.payload || []);
                setCounts(result.counts || {});

                // ⬅ NEW — master counts ko hamesha update karte raho jab bhi
                // API se non-empty counts aaye, taaki tabs kabhi disappear na ho
                if (result.counts && Object.keys(result.counts).length > 0) {
                    setMasterCounts(result.counts);
                }
            } else {
                setUsers([]);
                setFiltered([]);
                setCounts({});
                // ⬅ NEW — masterCounts ko yahan reset NAHI karna, warna tabs gayab ho jayenge
            }
        } catch (e) {
            setUsers([]);
            setFiltered([]);
        }
        setIsFirstLoadDone(true);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers(selectedType);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            if (search === '') {
                fetchUsers(selectedType);   // 🔥 sirf jab search empty ho
            }
        }, [search, selectedType])
    );

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();
        setFiltered(
            users.filter(u =>
                (u.user_name || '').toLowerCase().includes(q) ||
                (u.user_mobile || '').toLowerCase().includes(q) ||
                (u.user_email || '').toLowerCase().includes(q)
            )
        );
    };

    /* Type tab select — API se hi filter hoke aata hai */
    const selectType = (type) => {
        if (type === selectedType) return;
        setSelectedType(type);
        setSearch('');
        setFiltered([]);
        fetchUsers(type);
    };

    const totalCount = Object.values(masterCounts).reduce(
        (sum, c) => sum + (Number(c) || 0),
        0
    );

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('UsersDetail', {
                user_id: item.id,
                user_name: item.user_name,
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

            {/* STATUS TOP RIGHT */}
            <View style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor:
                    item.user_status === "active"
                        ? '#d4edda'
                        : '#f8d7da',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderBottomLeftRadius: 6,
                borderTopRightRadius: 6,
                zIndex: 2
            }}>
                <Text style={{
                    fontSize: 10,
                    fontFamily: 'Inter-Bold',
                    color: item.user_status === "active"
                        ? '#155724'
                        : '#721c24'
                }}>
                    {item.user_status
                        ? item.user_status.charAt(0).toUpperCase() + item.user_status.slice(1).toLowerCase()
                        : '--'}
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


            {/* INDEX */}
            <Text style={{
                fontSize: 11,
                color: '#2c3e50',
                marginBottom: 4,
                fontFamily: 'Inter-Bold'
            }}>
                #{index + 1}
            </Text>


            {/* NAME + TYPE BADGE */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginTop: 2,
                paddingRight: 60, // status/arrow ke neeche na aaye
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
                    {" "}{item.user_name || '--'}
                </Text>

                <View style={{
                    backgroundColor: `${getRoleColor(item.user_type)}1A`,
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginLeft: 8,
                }}>
                    <Text style={{
                        fontSize: 9,
                        fontFamily: 'Inter-Bold',
                        color: getRoleColor(item.user_type),
                        textTransform: 'capitalize'
                    }}>
                        {getRoleDisplayName(item.user_type) || '--'}
                    </Text>
                </View>
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
                    {" "}{item.user_mobile || '--'}
                </Text>
            </Text>


            {/* EMAIL */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Email :
                </Text>

                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular',
                    textTransform: 'capitalize'
                }}>
                    {" "}{item.user_email || '--'}
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
                    style={{ width: 36, justifyContent: 'center', alignItems: 'flex-start' }}
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
                    Users
                </Text>
                <View style={{ width: 36 }} />
            </View>

            {/* SEARCH */}
            {isFirstLoadDone && (
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
                        placeholder="Search by name, mobile, email..."
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

            {/* ================= TYPE-WISE COUNT CHIPS (search ke niche) ================= */}
            {Object.keys(masterCounts).length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
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
                        onPress={() => selectType('')}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',

                            backgroundColor:
                                selectedType === ''
                                    ? Colors.buttonbgcolor
                                    : '#fff',

                            borderRadius: 20,
                            paddingHorizontal: 12,

                            // paddingVertical: 7,   // remove
                            minHeight: 34,          // add

                            borderWidth: 0.6,
                            borderColor:
                                selectedType === ''
                                    ? Colors.buttonbgcolor
                                    : '#e2e8f0',

                            marginRight: 8,
                        }}
                    >
                        <Text style={{
                            fontSize: 11,
                            fontFamily: Fonts.Bold,
                            color: selectedType === '' ? '#fff' : '#334155',
                        }}>
                            All ({totalCount})
                        </Text>
                    </TouchableOpacity>

                    {Object.entries(masterCounts).map(([type, count], idx) => {
                        const active = selectedType === type;
                        const isLast = idx === Object.entries(masterCounts).length - 1;
                        return (
                            <TouchableOpacity
                                key={type}
                                activeOpacity={0.8}
                                onPress={() => selectType(type)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',

                                    backgroundColor:
                                        active ? Colors.buttonbgcolor : '#fff',

                                    borderRadius: 20,
                                    paddingHorizontal: 12,

                                    // paddingVertical: 7,   // remove
                                    minHeight: 34,          // add

                                    borderWidth: 0.6,
                                    borderColor:
                                        active
                                            ? Colors.buttonbgcolor
                                            : '#e2e8f0',

                                    marginRight: isLast ? 0 : 8,
                                }}
                            >
                                <Text style={{
                                    fontSize: 11,
                                    fontFamily: Fonts.Bold,
                                    color: active ? '#fff' : '#334155',
                                }}>
                                    {type === 'Coordinator → Editor'
                                        ? 'Coordinator Post Production'
                                        : type} ({count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* COUNT */}
            {isFirstLoadDone && (
                <Text style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginLeft: 16,
                    marginTop: 10,
                    marginBottom: 4,
                }}>
                    {filtered.length} user{filtered.length !== 1 ? 's' : ''} found
                    {search.length > 0 ? ` with ${search}` : ''}
                </Text>
            )}

            {/* LIST */}
            {loading ? (
                <UserListShimmer />
            ) : (
                <FlatList
                    data={visibleData}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 4, paddingHorizontal: 12 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
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
                            <Icon name="account-off-outline" size={48} color="#cbd5e1" />
                            <Text style={{
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#94a3b8',
                                marginTop: 12,
                            }}>
                                No Users Found
                            </Text>
                        </View>
                    }
                />
            )}
            <TouchableOpacity
                onPress={() => navigation.navigate('AddUser')}
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

                    elevation: 10,   // Android
                    zIndex: 999,     // iOS

                    shadowColor: '#000', // iOS shadow
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 }
                }}
            >
                <Icon name="plus" size={28} color="#fff" />
            </TouchableOpacity>


        </SafeAreaView>
    );
};

export default UsersList;
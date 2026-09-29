import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Linking,
    BackHandler,
    Modal,
    Dimensions,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import RNExitApp from 'react-native-exit-app';
import PhotographerNotificationModal from './PhotographerNotificationModal';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const STATUS_COLORS = {
    Done: '#16A34A',
    Pending: '#F59E0B',
    Assigned: '#0284C7',
    Rejected: '#EF4444',
};

const PAGE_SIZE = 20;

const PhotographerDashboard = ({ hideBack: hideBackProp }) => {
    const navigation = useNavigation();
    const route = useRoute();

    const hideBack = hideBackProp === true || route?.params?.hideBack === true;

    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [exitModal, setExitModal] = useState(false);

    // 👇 ADD
    const [notificationCount, setNotificationCount] = useState(0);// TODO: API aane par set karna
    const [notificationModal, setNotificationModal] = useState(false);
    const [notifAnchor, setNotifAnchor] = useState({ top: 60, right: 12 });
    const bellRef = React.useRef(null);

    const [activeTab, setActiveTab] = useState('today');   // 🆕
    const [todayCount, setTodayCount] = useState(0);         // 🆕
    const [tomorrowCount, setTomorrowCount] = useState(0);    // 🆕
    const [upcomingCount, setUpcomingCount] = useState(0);    // 🆕



    const [stats, setStats] = useState({
        totalBookings: 0,
        accepted: 0,
        rejected: 0,
        acceptedDone: 0,
    });
    console.log("status ye hai", stats);
    const [todayShoots, setTodayShoots] = useState([]);
    const [todayDate, setTodayDate] = useState('');

    const [userType, setUserType] =
        useState('');
    const [userName, setUserName] = useState('');
    const [userInfoLoading, setUserInfoLoading] = useState(true);

    /* ================= PAGINATION STATE ================= */

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loadingMore, setLoadingMore] = useState(false);

    /* ================= SEARCH FILTER (computed first, before pagination uses it) ================= */

    const filteredShoots = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return todayShoots;

        return todayShoots.filter(
            item =>
                item.client.toLowerCase().includes(q) ||
                item.event.toLowerCase().includes(q) ||
                item.id.toLowerCase().includes(q)
        );
    }, [todayShoots, searchQuery]);

    const formatDate = (date) => {
        if (!date) return '';

        const d = new Date(date);

        if (isNaN(d.getTime())) return date;

        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = d.getFullYear();

        return `${day} ${month} ${year}`;
    };

    const visibleShoots = useMemo(
        () => filteredShoots.slice(0, visibleCount),
        [filteredShoots, visibleCount]
    );

    // Jab search query badle, pagination ko reset karo taaki naye filtered result se
    // sahi first-page dikhe (warna purana visibleCount reh jaata)
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchQuery]);

    const loadMoreShoots = () => {
        if (loadingMore) return;
        if (visibleCount >= filteredShoots.length) return;

        setLoadingMore(true);

        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredShoots.length));
            setLoadingMore(false);
        }, 400); // chota loader dikhne ke liye halka delay
    };

    /* ================= API CALL ================= */
    const fetchDashboardData = async (isRefresh = false, tab = activeTab) => {   // 🔧 tab param add
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            setErrorMsg('');

            const photographerId = await AsyncStorage.getItem('id');

            if (!photographerId) {
                setErrorMsg('Photographer ID not found. Please login again.');
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const response = await fetch(API.list_photographer_couting, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photographer_id: photographerId,
                    status: tab,   // 🆕
                }),
            });

            const json = await response.json();

            if (json?.status && json?.payload) {
                const { stats: apiStats, today_shoots, tomorrow_shoots, upcoming_shoots } = json.payload;   // 🔧

                setStats({
                    totalBookings: apiStats?.total ?? 0,
                    assigned: apiStats?.assigned ?? 0,
                    accepted: apiStats?.accepted ?? 0,
                    rejected: apiStats?.rejected ?? 0,
                    acceptedDone: apiStats?.done ?? 0,
                });

                // 🆕 counts teeno tabs ke liye (badge dikhane ke liye)
                setTodayCount(json.payload.today_shoots_count ?? 0);
                setTomorrowCount(json.payload.tomorrow_shoots_count ?? 0);
                setUpcomingCount(json.payload.upcoming_shoots_count ?? 0);

                // 🔧 active tab ke hisaab se sahi array pick karo
                const sourceList =
                    tab === 'today' ? today_shoots :
                        tab === 'tomorrow' ? tomorrow_shoots :
                            upcoming_shoots;

                const mappedShoots = (sourceList || []).map(item => ({
                    id: String(item.order_no ?? ''),
                    clientId: String(item.client_id ?? ''),
                    client: item.client_name ?? '-',
                    phone: item.mobile_no ?? '',
                    event: item.event ?? '-',
                    coordinator: item.coordinator_name ?? '-',
                    status: item.assignment_status ?? 'Pending',
                    bookingDate: item.booking_date ?? '',   // 🆕 upcoming ke liye
                }));

                setTodayShoots(mappedShoots);
                setTodayDate(json.payload.today_date ?? '');
                setVisibleCount(PAGE_SIZE);
            } else {
                setErrorMsg(json?.message || 'Something went wrong.');
            }
        } catch (error) {
            console.log('list_photographer_couting error:', error);
            setErrorMsg('Unable to load dashboard. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(false, activeTab);
    }, [activeTab]);   // 🆕

    const fetchNotificationCount = async () => {
        try {
            const photographerId = await AsyncStorage.getItem('id');

            const response = await fetch(API.notification_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photographer_id: photographerId }),
            });

            const json = await response.json();

            if (json?.status && Array.isArray(json.payload)) {
                setNotificationCount(json.payload.length);
            } else {
                setNotificationCount(0);
            }
        } catch (error) {
            console.log('notification_list error:', error);
            setNotificationCount(0);
        }
    };


    const fetchUserType = useCallback(async () => {
        try {
            const userId = await AsyncStorage.getItem('id');
            const storedName = await AsyncStorage.getItem('user_name');

            setUserName(storedName || '');
            setUserInfoLoading(false);

            if (!userId) {
                throw new Error('User ID not found');
            }

            const response = await fetch(API.list_usertype, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userId,
                }),
            });

            const result = await response.json();

            console.log('USER TYPE RESPONSE:', result);

            if (
                result?.code == 200 &&
                result?.payload?.length > 0
            ) {
                const type = result.payload[0]?.user_type || '';
                const finalRole = type.trim();

                setUserType(finalRole);

                return {
                    uid: Number(userId),
                    role: finalRole,
                };
            }

            throw new Error('User type not found');

        } catch (error) {
            console.log('USER TYPE ERROR:', error);
            setUserType('');
            throw error;
        }
    }, []);


    useFocusEffect(
        useCallback(() => {
            fetchDashboardData(false, activeTab);   // 🔧
            fetchNotificationCount();
            fetchUserType();
        }, [activeTab])   // 🔧 dependency add
    );

    useFocusEffect(
        useCallback(() => {
            const backAction = () => {
                setExitModal(true);
                return true;
            };

            const backHandler = BackHandler.addEventListener(
                'hardwareBackPress',
                backAction
            );

            return () => backHandler.remove();
        }, [])
    );

    const confirmExit = () => RNExitApp.exitApp();

    const onRefresh = () => {
        fetchDashboardData(true, activeTab);   // 🔧
    };

    /* ================= STAT CARD ================= */

    const StatCard = ({ label, value, color }) => (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
                paddingHorizontal: 7,
            }}
        >
            <Text
                style={{
                    fontFamily: Fonts.Regular,
                    fontSize: 10,
                    color: '#555',
                    textAlign: 'center',
                }}
            >
                {label}
            </Text>

            <Text
                style={{
                    fontFamily: Fonts.Bold,
                    fontSize: 15,
                    color: color,
                    marginTop: 2,
                    textAlign: 'center',
                }}
            >
                {value}
            </Text>
        </View>
    );

    /* ================= SHOOT CARD ================= */

    const ShootCard = ({ item }) => {
        const statusColor = STATUS_COLORS[item.status] || '#64748b';

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                // onPress={() =>
                //     navigation.navigate('NewCoordination', {
                //         bookingData: item,
                //     })
                // }
                style={{
                    backgroundColor: '#fff',
                    marginBottom: 7,
                    borderRadius: 10,
                    padding: 9,
                    borderLeftWidth: 3,
                    borderLeftColor: statusColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 2,
                    elevation: 1,
                }}
            >
                {/* TOP ROW */}
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
                            {item.client}
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
                            #{item.id}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() =>
                                item.phone && Linking.openURL(`tel:${item.phone}`)
                            }
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 2,
                            }}
                        >
                            <Icon
                                name="phone-outline"
                                size={9}
                                color="#94a3b8"
                            />

                            <Text
                                style={{
                                    color: '#94a3b8',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    marginLeft: 3,
                                }}
                            >
                                {item.phone}
                            </Text>
                        </TouchableOpacity>

                        {item.bookingDate ? (
                            <Text
                                style={{
                                    color: '#94a3b8',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    marginTop: 2,
                                }}
                            >
                                {(() => {
                                    const parsed = new Date(item.bookingDate);
                                    const isValidDate = !isNaN(parsed.getTime()) && item.bookingDate !== '0000-00-00';
                                    return isValidDate ? formatDate(item.bookingDate) : item.bookingDate;
                                })()}
                            </Text>
                        ) : null}

                    </View>
                </View>

                {/* STATUS */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 5,
                    }}
                >
                    <Text
                        style={{
                            color: '#9aa0a6',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                        }}
                    >
                        Status:
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: `${statusColor}15`,
                            borderRadius: 12,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            marginLeft: 5,
                        }}
                    >
                        <View
                            style={{
                                width: 5,
                                height: 5,
                                borderRadius: 3,
                                backgroundColor: statusColor,
                                marginRight: 4,
                            }}
                        />

                        <Text
                            style={{
                                color: statusColor,
                                fontFamily: Fonts.Bold,
                                fontSize: 9,
                            }}
                        >
                            {item.status}
                        </Text>
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
                            <Icon
                                name="tag-outline"
                                size={11}
                                color="#64748b"
                            />

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
                                {item.event}
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
                            <Icon
                                name="account-outline"
                                size={11}
                                color="#64748b"
                            />

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
                                {item.coordinator}
                            </Text>
                        </View>
                    </View>

                    {/* <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                            navigation.navigate('NewCoordination', {
                                bookingData: item,
                            })
                        }
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingLeft: 8,
                        }}
                    >
                        <Text
                            style={{
                                color: Colors.buttonbgcolor,
                                fontFamily: Fonts.Bold,
                                fontSize: 10,
                            }}
                        >
                            Manage
                        </Text>

                        <Icon
                            name="chevron-right"
                            size={14}
                            color={Colors.buttonbgcolor}
                        />
                    </TouchableOpacity> */}
                </View>
            </TouchableOpacity>
        );
    };

    /* ================= EMPTY BOX ================= */

    const EmptyBox = () => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                paddingVertical: 36,
                alignItems: 'center',
                elevation: 1,
            }}
        >
            <View
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: searchQuery ? '#f8fafc' : '#f0fdf4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                }}
            >
                <Icon
                    name={
                        searchQuery
                            ? 'text-box-search-outline'
                            : 'camera-off-outline'
                    }
                    size={34}
                    color={searchQuery ? '#94a3b8' : '#16A34A'}
                />
            </View>

            <Text
                style={{
                    fontSize: 14,
                    fontFamily: Fonts.Bold,
                    color: '#1e293b',
                }}
            >
                {searchQuery ? 'No matching shoots' : `No ${activeTab} shoots`}
            </Text>

            <Text
                style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginTop: 4,
                }}
            >
                {searchQuery
                    ? 'Try a different client, event or booking no.'
                    : 'Your schedule is clear for today.'}
            </Text>
        </View>
    );

    /* ================= ERROR BOX ================= */

    const ErrorBox = () => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                paddingVertical: 36,
                alignItems: 'center',
                elevation: 1,
            }}
        >
            <Icon name="alert-circle-outline" size={34} color="#EF4444" />

            <Text
                style={{
                    fontSize: 13,
                    fontFamily: Fonts.Bold,
                    color: '#1e293b',
                    marginTop: 10,
                    textAlign: 'center',
                    paddingHorizontal: 20,
                }}
            >
                {errorMsg}
            </Text>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => fetchDashboardData()}
                style={{
                    marginTop: 14,
                    backgroundColor: Colors.buttonbgcolor,
                    borderRadius: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                }}
            >
                <Text
                    style={{
                        color: '#fff',
                        fontFamily: Fonts.Bold,
                        fontSize: 12,
                    }}
                >
                    Retry
                </Text>
            </TouchableOpacity>
        </View>
    );

    /* ================= LIST HEADER (search + stats + section title) ================= */

    const ListHeader = () => (
        <>
            {/* ================= SEARCH BAR ================= */}
            {/* <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 11,
                    height: 40,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                }}
            >
                <Icon name="magnify" size={18} color="#94a3b8" />

                <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by client, event or booking no."
                    placeholderTextColor="#94a3b8"
                    style={{
                        flex: 1,
                        marginLeft: 8,
                        fontFamily: Fonts.Regular,
                        fontSize: 11.5,
                        color: '#1e293b',
                        padding: 0,
                    }}
                />

                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icon
                            name="close-circle"
                            size={16}
                            color="#cbd5e1"
                        />
                    </TouchableOpacity>
                )}
            </View> */}

            {/* ================= COUNTING / STATS ================= */}
            {/* ================= COUNTING / STATS ================= */}
            <View style={{ marginBottom: 12 }}>
                {/* Row 1 */}
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    {/* TOTAL BOOKINGS */}
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#ffffff',
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            marginRight: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 2,
                        }}
                    >
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: '#A855F7',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="calendar-multiple" size={20} color="#fff" />
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                                {stats.totalBookings}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                Total Bookings
                            </Text>
                        </View>
                    </View>

                    {/* ASSIGNED */}
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#ffffff',
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 2,
                        }}
                    >
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: '#2563EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="account-check-outline" size={20} color="#fff" />
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                                {stats.assigned}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                Assigned
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Row 2 */}
                <View style={{ flexDirection: 'row' }}>
                    {/* ACCEPTED */}
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#ffffff',
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            marginRight: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 2,
                        }}
                    >
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: '#16A34A',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="check-circle-outline" size={20} color="#fff" />
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                                {stats.accepted}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                Accepted
                            </Text>
                        </View>
                    </View>

                    {/* REJECTED */}
                    {/* <View
            style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 12,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
            }}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#DC2626',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon name="close-circle-outline" size={20} color="#fff" />
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                    {stats.rejected}
                </Text>
                <Text
                    numberOfLines={1}
                    style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                >
                    Rejected
                </Text>
            </View>
        </View> */}

                    {/* ACCEPTED & DONE */}
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: '#ffffff',
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 2,
                        }}
                    >
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: '#F59E0B',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="check-decagram-outline" size={20} color="#fff" />
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                                {stats.acceptedDone}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                Done
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ================= TABS ================= */}
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row' }}>
                    {/* TODAY */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('today')}
                        style={{ minWidth: 105, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 9, backgroundColor: activeTab === 'today' ? Colors.buttonbgcolor : 'transparent' }}
                    >
                        <Icon name="calendar-today" size={14} color={activeTab === 'today' ? '#fff' : '#64748b'} />
                        <Text numberOfLines={1} style={{ fontSize: 10.5, fontFamily: Fonts.Bold, color: activeTab === 'today' ? '#fff' : '#64748b', marginLeft: 4 }}>Today</Text>
                        <View style={{ backgroundColor: activeTab === 'today' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', borderRadius: 20, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4, minWidth: 16, alignItems: 'center' }}>
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'today' ? '#fff' : '#64748b' }}>{todayCount}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* TOMORROW */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('tomorrow')}
                        style={{ minWidth: 115, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 9, backgroundColor: activeTab === 'tomorrow' ? Colors.buttonbgcolor : 'transparent' }}
                    >
                        <Icon name="calendar-arrow-right" size={14} color={activeTab === 'tomorrow' ? '#fff' : '#64748b'} />
                        <Text numberOfLines={1} style={{ fontSize: 10.5, fontFamily: Fonts.Bold, color: activeTab === 'tomorrow' ? '#fff' : '#64748b', marginLeft: 4 }}>Tomorrow</Text>
                        <View style={{ backgroundColor: activeTab === 'tomorrow' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', borderRadius: 20, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4, minWidth: 16, alignItems: 'center' }}>
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'tomorrow' ? '#fff' : '#64748b' }}>{tomorrowCount}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* UPCOMING */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('upcoming')}
                        style={{ minWidth: 115, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 9, backgroundColor: activeTab === 'upcoming' ? Colors.buttonbgcolor : 'transparent' }}
                    >
                        <Icon name="calendar-clock-outline" size={14} color={activeTab === 'upcoming' ? '#fff' : '#64748b'} />
                        <Text numberOfLines={1} style={{ fontSize: 10.5, fontFamily: Fonts.Bold, color: activeTab === 'upcoming' ? '#fff' : '#64748b', marginLeft: 4 }}>Upcoming</Text>
                        <View style={{ backgroundColor: activeTab === 'upcoming' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', borderRadius: 20, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4, minWidth: 16, alignItems: 'center' }}>
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'upcoming' ? '#fff' : '#64748b' }}>{upcomingCount}</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </>
    );

    /* ================= LIST FOOTER (pagination loader) ================= */

    const ListFooter = () => {
        if (!loadingMore) return null;

        return (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
            </View>
        );
    };

    /* ================= RENDER ================= */

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar
                backgroundColor={Colors.buttonbgcolor}
                barStyle="light-content"
            />
            {/* ================= HEADER ================= */}
            <View
                style={{
                    height: 50,
                    backgroundColor: Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                }}
            >
                {!hideBack ? (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 28,
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            name="arrow-left"
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Menus')}
                        style={{
                            width: 28,
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            name="menu"
                            size={26}
                            color="#fff"
                        />
                    </TouchableOpacity>
                )}

                <Text
                    style={{
                        color: '#fff',
                        fontSize: 16,
                        fontFamily: Fonts.Bold,
                        flex: 1,
                        textAlign: 'center',
                    }}
                    numberOfLines={1}
                >
                    Dashboard
                </Text>

                <TouchableOpacity
                    ref={bellRef}
                    activeOpacity={0.7}
                    onPress={() => {
                        bellRef.current?.measureInWindow((x, y, width, height) => {
                            const screenWidth = Dimensions.get('window').width;
                            setNotifAnchor({
                                top: y + height + 6,
                                right: Math.max(10, screenWidth - (x + width)),
                            });
                            setNotificationModal(true);
                        });
                    }}
                    style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Icon name="bell-outline" size={22} color="#fff" />
                    {notificationCount > 0 && (
                        <View
                            style={{
                                position: 'absolute', top: -2, right: -4,
                                minWidth: 16, height: 16, borderRadius: 8,
                                backgroundColor: '#EF4444',
                                alignItems: 'center', justifyContent: 'center',
                                paddingHorizontal: 4,
                            }}
                        >
                            <Text style={{ fontSize: 8, fontFamily: Fonts.Bold, color: '#fff', lineHeight: 12 }}>
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* USER INFO STRIP */}
            <View
                style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: '#fff',
                    borderBottomWidth: 1,
                    borderColor: '#E5E7EB',
                }}
            >
                {userInfoLoading ? (
                    <ShimmerPlaceholder
                        LinearGradient={LinearGradient}
                        style={{
                            width: '60%',
                            height: 14,
                            borderRadius: 4,
                        }}
                    />
                ) : (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                        }}
                    >
                        <Icon
                            name="hand-wave"
                            size={18}
                            color={Colors.buttonbgcolor}
                            style={{
                                marginRight: 7,
                                marginTop: 1,
                                transform: [{ scaleX: -1 }],
                            }}
                        />
                        <Text
                            style={{
                                flex: 1,
                                fontSize: 13,
                                fontFamily: Fonts.Regular,
                                color: '#64748B',
                            }}
                        >
                            Welcome,{' '}
                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    color: '#0F172A',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {userName || '-'}
                            </Text>

                            {userType ? (
                                <Text
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        color: '#64748B',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {' '}({userType})
                                </Text>
                            ) : null}
                        </Text>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : errorMsg ? (
                <View style={{ padding: 16 }}>
                    <ErrorBox />
                </View>
            ) : (
                <FlatList
                    data={visibleShoots}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <ShootCard item={item} />}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={EmptyBox}
                    ListFooterComponent={ListFooter}
                    onEndReached={loadMoreShoots}
                    onEndReachedThreshold={0.4}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 10,
                        flexGrow: 1,
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.buttonbgcolor]}
                            tintColor={Colors.buttonbgcolor}
                        />
                    }
                />
            )}

            <Modal
                transparent
                visible={exitModal}
                animationType="fade"
                onRequestClose={() => setExitModal(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setExitModal(false)}
                >
                    <View
                        style={{
                            width: '85%',
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 20,
                            elevation: 4,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 16,
                                color: '#0F172A',
                                textAlign: 'center',
                                marginBottom: 8,
                            }}
                        >
                            Confirm Exit
                        </Text>
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 14,
                                color: '#475569',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            Are you sure you want to exit the app?
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setExitModal(false)}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#F1F5F9',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Medium,
                                        fontSize: 13,
                                        color: '#334155',
                                    }}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmExit}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#EF4444',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Medium,
                                        fontSize: 13,
                                        color: '#FFFFFF',
                                    }}
                                >
                                    Exit
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
            <PhotographerNotificationModal
                visible={notificationModal}
                onClose={() => {
                    setNotificationModal(false);
                    fetchNotificationCount();   // 👈 add
                }}
                navigation={navigation}
                anchor={notifAnchor}
                onAccepted={() => {
                    // 🆕 bell ka badge turant 1 kam
                    setNotificationCount(prev => Math.max(0, prev - 1));
                    // 🆕 dashboard ke stats/list (today/tomorrow/upcoming) bhi refresh ho jaye
                    fetchDashboardData(false, activeTab);
                }}
            />
        </View>
    );
};

export default PhotographerDashboard;
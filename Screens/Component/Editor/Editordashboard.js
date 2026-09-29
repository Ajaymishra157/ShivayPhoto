import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    BackHandler,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import RNExitApp from 'react-native-exit-app';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const PAGE_SIZE = 20;

/* =========================================================
   MAIN
========================================================= */

const ListHeader = React.memo(({
    stats,
    search,
    setSearch,
    onClearSearch,
    filteredCount,
    loading,
    bookingsLength,
}) => (
    <View>
        {/* ================= STATS ================= */}
        <View style={{ marginHorizontal: 12, marginTop: 12 }}>
            {/* Row 1 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {/* TOTAL */}
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
                            backgroundColor: '#6366F1',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name="format-list-bulleted" size={20} color="#fff" />
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                            {stats.total}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                        >
                            Total Tasks
                        </Text>
                    </View>
                </View>

                {/* PENDING */}
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
                        <Icon name="timer-sand" size={20} color="#fff" />
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                            {stats.Pending}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                        >
                            Pending Tasks
                        </Text>
                    </View>
                </View>
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {/* IN PROGRESS */}
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
                            backgroundColor: '#0EA5E9',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name="progress-clock" size={20} color="#fff" />
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                            {stats['In Progress']}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                        >
                            In Progress Tasks
                        </Text>
                    </View>
                </View>

                {/* REVIEW */}
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
                            backgroundColor: '#EF233C',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name="eye-check-outline" size={20} color="#fff" />
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                            {stats.Review}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                        >
                            Review Tasks
                        </Text>
                    </View>
                </View>
            </View>

            {/* Row 3 */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* DONE */}
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
                            backgroundColor: '#16A34A',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name="check-circle-outline" size={20} color="#fff" />
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                            {stats.Done}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                        >
                            Done Tasks
                        </Text>
                    </View>
                </View>

                {/* empty spacer so DONE stays half-width like the rest */}
                <View style={{ flex: 1 }} />
            </View>
        </View>

        {/* ================= SECTION ================= */}
        <View style={{ marginTop: 10, paddingHorizontal: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontFamily: Fonts.Bold, fontSize: 14, color: '#29263b' }}>
                    Completed Bookings
                </Text>
                <View style={{ backgroundColor: '#eeecff', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 7.5, color: '#6366F1' }}>
                        {filteredCount} BOOKINGS
                    </Text>
                </View>
            </View>
        </View>

        {/* ================= SEARCH ================= */}
        <View
            style={{
                marginHorizontal: 12, marginTop: 11, height: 43,
                backgroundColor: '#fff', borderRadius: 13,
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
            }}
        >
            <Icon name="magnify" size={19} color="#6366F1" />
            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search booking, client, mobile..."
                placeholderTextColor="#9997a8"
                style={{ flex: 1, marginLeft: 9, padding: 0, fontFamily: Fonts.Regular, fontSize: 10, color: '#2c2940' }}
                returnKeyType="search"
                blurOnSubmit={false}
            />
            {search.length > 0 && (
                <TouchableOpacity onPress={onClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="close-circle" size={17} color="#aaa7b8" />
                </TouchableOpacity>
            )}
        </View>

        {/* ================= INITIAL LOADING ================= */}
        {loading && bookingsLength === 0 && (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                <Text style={{ fontFamily: Fonts.Regular, fontSize: 15, color: '#858293', marginTop: 8 }}>
                    Loading editor assignments...
                </Text>
            </View>
        )}

        <View style={{ marginTop: 13 }} />
    </View>
));

const PackageText = React.memo(({ text, onInfoPress }) => {
    const [isTruncated, setIsTruncated] = useState(false);
    const [measured, setMeasured] = useState(false);

    const textStyle = {
        fontFamily: Fonts.Bold,
        fontSize: 11.5,
        color: '#2b293c',
        textTransform: 'capitalize',
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            {/* Hidden measuring text: bina numberOfLines ke, taaki asli line count mile */}
            {!measured && (
                <Text
                    style={[textStyle, { position: 'absolute', opacity: 0, left: 0, right: 0 }]}
                    onTextLayout={e => {
                        setIsTruncated(e.nativeEvent.lines.length > 1);
                        setMeasured(true);   // sirf ek baar measure hoga
                    }}
                >
                    {text}
                </Text>
            )}

            <Text numberOfLines={1} ellipsizeMode="tail" style={[textStyle, { flex: 1 }]}>
                {text}
            </Text>

            {isTruncated && (
                <TouchableOpacity
                    onPress={() => onInfoPress(text)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={{ marginLeft: 5 }}
                >
                    <Icon name="information-outline" size={14} color="#D98200" />
                </TouchableOpacity>
            )}
        </View>
    );
});

const Editordashboard = ({ hideBack: hideBackProp }) => {
    const navigation = useNavigation();
    const route = useRoute();   // useRoute import karna na bhoolna

    const hideBack = hideBackProp === true || route?.params?.hideBack === true;

    /* =====================================================
       STATES
    ===================================================== */

    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [exitModal, setExitModal] = useState(false);

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ✅ CLIENT-SIDE PAGINATION STATE — API se poora data ek hi baar aata hai,
    //    page/limit API ko nahi bheja jaata, sirf yaha visibleCount se chunks dikhte hai
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loadingMore, setLoadingMore] = useState(false);

    // naya helper (component ke andar, formatDueDate ke paas rakh do)
    const getTodayFormatted = () => {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const [dueDate, setDueDate] = useState(getTodayFormatted());
    const [dueDateObj, setDueDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);


    const [userType, setUserType] =
        useState('');
    const [userName, setUserName] = useState('');
    const [userInfoLoading, setUserInfoLoading] = useState(true);

    const [packageModal, setPackageModal] = useState(false);
    const [packageModalText, setPackageModalText] = useState('');
    // const [isPackageTruncated, setIsPackageTruncated] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        Pending: 0,
        'In Progress': 0,
        Review: 0,
        Done: 0,
    });

    /* =====================================================
       FORM STATES (SINGLE ASSIGN SECTION)
    ===================================================== */

    const [photoEditor, setPhotoEditor] = useState('');
    const [videoEditor, setVideoEditor] = useState('');

    const [priority, setPriority] = useState('Medium');

    // ✅ ASSIGN SUBMIT LOADING STATE
    const [assigning, setAssigning] = useState(false);
    const [resultModal, setResultModal] = useState({ visible: false, type: 'success', title: '', message: '' });


    const [assignFormError, setAssignFormError] = useState('');
    const showResultModal = (type, title, message) => {
        setResultModal({ visible: true, type, title, message });
    };

    const [modalType, setModalType] = useState(null);
    const [modalSearchText, setModalSearchText] = useState('');

    const closeSelectionModal = () => {
        setModalType(null);
        setModalSearchText('');
    };


    /* =====================================================
       EDITORS
    ===================================================== */

    // ✅ Ye add karo (dusre states ke saath)
    const [photoEditors, setPhotoEditors] = useState([]);
    const [videoEditors, setVideoEditors] = useState([]);
    const [editorsLoading, setEditorsLoading] = useState(false);


    /* =====================================================
   EXPAND ANIMATION (per booking)
===================================================== */

    const MONTH_NAMES = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const formatDueDate = dateStr => {
        if (!dateStr) return '-';
        const parts = String(dateStr).split('-'); // "2026-09-04" -> ['2026','09','04']
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        return `${day} ${MONTH_NAMES[Number(month) - 1]} ${year}`;
    };

    const expandAnimRefs = useRef({}).current;

    const getExpandAnim = id => {
        if (!expandAnimRefs[id]) {
            expandAnimRefs[id] = new Animated.Value(0);
        }
        return expandAnimRefs[id];
    };

    const animateOpen = animValue => {
        Animated.timing(animValue, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    const animateClose = (animValue, onComplete) => {
        Animated.timing(animValue, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(onComplete);   // 👈 callback add karo
    };

    const [photoEditorId, setPhotoEditorId] = useState(0);
    const [videoEditorId, setVideoEditorId] = useState(0);

    // 🆕 NEW — jab editor already assign ho chuka ho, dropdown locked rahega
    // jab tak edit icon na dabaya jaye
    const [photoEditorUnlocked, setPhotoEditorUnlocked] = useState(false);
    const [videoEditorUnlocked, setVideoEditorUnlocked] = useState(false);
    const PRIORITIES = [
        'Low',
        'Medium',
        'High',
        'Urgent',
    ];

    /* =====================================================
       FETCH EDITOR ASSIGNMENTS
    ===================================================== */

    useFocusEffect(
        useCallback(() => {
            if (!hideBack) return;

            const backAction = () => {
                setExitModal(true);
                return true;
            };

            const backHandler = BackHandler.addEventListener(
                'hardwareBackPress',
                backAction
            );

            return () => backHandler.remove();
        }, [hideBack])
    );

    const confirmExit = () => RNExitApp.exitApp();



    useEffect(() => {
        const fetchEditors = async () => {
            setEditorsLoading(true);

            try {
                const [photoRes, videoRes] = await Promise.all([
                    fetch(API.list_user_typewise, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'Photo Editor' }),   // 👈 backend me jo type string save hai wahi daalna
                    }),
                    fetch(API.list_user_typewise, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'Video Editor' }),   // 👈 same yaha bhi
                    }),
                ]);

                const photoJson = await photoRes.json();
                const videoJson = await videoRes.json();

                if (photoJson?.code == 200) {
                    setPhotoEditors(
                        (photoJson.payload || []).map(u => ({
                            label: u.user_name,
                            value: Number(u.id),
                        }))
                    );
                } else {
                    setPhotoEditors([]);
                }

                if (videoJson?.code == 200) {
                    setVideoEditors(
                        (videoJson.payload || []).map(u => ({
                            label: u.user_name,
                            value: Number(u.id),
                        }))
                    );
                } else {
                    setVideoEditors([]);
                }
            } catch (error) {
                console.log('Editor list error:', error);
                setPhotoEditors([]);
                setVideoEditors([]);
            } finally {
                setEditorsLoading(false);
            }
        };

        fetchEditors();
    }, []);

    /* =====================================================
       FETCH BOOKINGS (poora data ek hi baar — koi page/limit
       API ko nahi bheja jaata; pagination client-side hoti hai)
    ===================================================== */

    const fetchUserType =
        useCallback(async () => {
            try {
                const userId =
                    await AsyncStorage.getItem(
                        'id'
                    );
                const storedName = await AsyncStorage.getItem('user_name');   // ye line add karo
                setUserName(storedName || '');
                setUserInfoLoading(false);

                if (!userId) {
                    throw new Error(
                        'User ID not found'
                    );
                }

                const response =
                    await fetch(
                        API.list_usertype,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',
                            },

                            body:
                                JSON.stringify({
                                    id: userId,
                                }),
                        }
                    );

                const result =
                    await response.json();

                console.log(
                    'USER TYPE RESPONSE:',
                    result
                );

                if (
                    result?.code == 200 &&
                    result?.payload?.length > 0
                ) {
                    const type =
                        result
                            .payload[0]
                            ?.user_type || '';

                    const finalRole =
                        type.trim();

                    setUserType(
                        finalRole
                    );

                    return {
                        uid:
                            Number(
                                userId
                            ),

                        role:
                            finalRole,
                    };
                }

                throw new Error(
                    'User type not found'
                );
            } catch (error) {
                console.log(
                    'USER TYPE ERROR:',
                    error
                );

                setUserType('');

                throw error;
            }
        }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUserType();
        }, [fetchUserType])
    );

    const fetchEditorAssignments = async (
        isRefresh = false,
        searchValue = search
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            // 🔧 actual logged-in coordinator ka ID lo
            const coordinatorId = await AsyncStorage.getItem('id');

            const response = await fetch(
                API.list_editor_assignment,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        editor_coordinator_id: coordinatorId || '',
                        search: searchValue || '',
                    }),
                }
            );

            const result = await response.json();

            console.log(
                'list_editor_assignment RESPONSE:',
                JSON.stringify(result, null, 2)
            );

            if (result?.status === true) {
                const payload = result?.payload || {};

                const newBookings = Array.isArray(payload.bookings)
                    ? payload.bookings
                    : [];

                setBookings(newBookings);
                setVisibleCount(PAGE_SIZE); // naya data — pehle page se dikhana

                setStats({
                    total: Number(
                        payload?.stats?.total || 0
                    ),
                    Pending: Number(
                        payload?.stats?.Pending || 0
                    ),
                    'In Progress': Number(
                        payload?.stats?.['In Progress'] || 0
                    ),
                    Review: Number(
                        payload?.stats?.Review || 0
                    ),
                    Done: Number(
                        payload?.stats?.Done || 0
                    ),
                });
            } else {
                setBookings([]);

                setStats({
                    total: 0,
                    Pending: 0,
                    'In Progress': 0,
                    Review: 0,
                    Done: 0,
                });
            }
        } catch (error) {
            console.log(
                'list_editor_assignment ERROR:',
                error
            );

            setBookings([]);

            setStats({
                total: 0,
                Pending: 0,
                'In Progress': 0,
                Review: 0,
                Done: 0,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /* =====================================================
       LOAD MORE (client-side — visibleCount badhta hai,
       koi naya API call nahi hota)
    ===================================================== */

    const loadMoreBookings = () => {
        if (loading || refreshing || loadingMore) return;
        if (visibleCount >= filteredBookings.length) return;

        setLoadingMore(true);

        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredBookings.length));
            setLoadingMore(false);
        }, 400); // chhota delay taaki loader dikhe
    };

    /* =====================================================
       INITIAL API CALL
    ===================================================== */

    useEffect(() => {
        fetchEditorAssignments(false, '');
    }, []);

    /* =====================================================
       SEARCH
    ===================================================== */

    const handleSearch = value => {
        setSearch(value);

        // Local search for instant UI filtering
        // API can also be called if required.
    };

    const filteredBookings = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) {
            return bookings;
        }

        return bookings.filter(item => {
            const clientName =
                String(item?.client_name || '').toLowerCase();

            const orderNo =
                String(item?.order_no || '').toLowerCase();

            const mobile =
                String(item?.mobile_no || '').toLowerCase();

            const photographer =
                String(
                    item?.photographer_name || ''
                ).toLowerCase();

            const coordinator =
                String(
                    item?.coordinator_name || ''
                ).toLowerCase();

            return (
                clientName.includes(q) ||
                orderNo.includes(q) ||
                mobile.includes(q) ||
                photographer.includes(q) ||
                coordinator.includes(q)
            );
        });
    }, [bookings, search]);

    /* =====================================================
       CLIENT-SIDE PAGINATED SLICE
       Search change hote hi visibleCount reset ho jayega
    ===================================================== */

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search]);

    const visibleBookings = useMemo(
        () => filteredBookings.slice(0, visibleCount),
        [filteredBookings, visibleCount]
    );

    /* =====================================================
       RESET FORM
    ===================================================== */
    const resetForm = () => {
        setPhotoEditor('');
        setVideoEditor('');
        setPhotoEditorId(0);
        setVideoEditorId(0);
        setPriority('Medium');
        setDueDate(getTodayFormatted());
        setDueDateObj(new Date());
        setAssignFormError('');   // 👈 add
        setPhotoEditorUnlocked(false);   // 🆕
        setVideoEditorUnlocked(false);   // 🆕
    };

    /* =====================================================
       TOGGLE BOOKING
    ===================================================== */

    const toggleBooking = id => {
        const isSame = expandedId === id;
        const anim = getExpandAnim(id);

        if (isSame) {
            // Close immediately
            setExpandedId(null);
            anim.setValue(0);
        } else {
            anim.setValue(0);
            setExpandedId(id);
            resetForm();
            animateOpen(anim);
        }
    };
    const onChangeDueDate = (event, selectedDate) => {
        setShowDatePicker(false); // Android auto-closes; for iOS you may want a Modal wrapper instead

        if (event.type === 'dismissed' || !selectedDate) return;

        setDueDateObj(selectedDate);

        const day = String(selectedDate.getDate()).padStart(2, '0');
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const year = selectedDate.getFullYear();

        setDueDate(`${day}-${month}-${year}`); // format however your backend expects
    };

    /* =====================================================
       ASSIGN EDITOR + CREATE TASK  (assign_editor_workflow API)
    ===================================================== */

    const assignEditorTask = async (item, bookingId, hasPhotoTask, hasVideoTask) => {
        if (assigning) return;

        // 🆕 YEH ADD KARO — raw state dekho submit ke waqt
        console.log('RAW STATE AT SUBMIT:', {
            photoEditor, photoEditorId, videoEditor, videoEditorId,
        });

        if (!photoEditor && !videoEditor && !hasPhotoTask && !hasVideoTask) {
            setAssignFormError('Please select at least one editor (Photo or Video) to continue.');
            return;
        }

        if (!priority) {
            setAssignFormError('Please select a priority.');
            return;
        }

        if (!dueDate) {
            setAssignFormError('Please select a due date.');
            return;
        }

        setAssignFormError(''); // sab sahi hai, error clear karo

        try {
            setAssigning(true);

            // backend expects YYYY-MM-DD
            const isoDueDate = `${dueDateObj.getFullYear()}-${String(
                dueDateObj.getMonth() + 1
            ).padStart(2, '0')}-${String(dueDateObj.getDate()).padStart(2, '0')}`;
            const adminId = await AsyncStorage.getItem('id');

            const body = {
                admin_id: adminId || '',
                client_id: String(item?.client_id || bookingId),
                priority,
                due_date: isoDueDate,
            };


            if (photoEditor) {
                body.photo_editor_id = String(photoEditorId);
            }

            if (videoEditor) {
                body.video_editor_id = String(videoEditorId);
            }

            console.log("FINAL BODY BEING SENT:", body);

            const response = await fetch(API.assign_editor_workflow, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const rawText = await response.text();
            console.log('RAW RESPONSE:', rawText);   // 👈 asli server response yahan dikhega

            let result;
            try {
                result = JSON.parse(rawText);
            } catch (e) {
                console.log('Invalid JSON from server:', rawText);
                showResultModal('error', 'Server Error', 'Server se galat response mila.');
                return;
            }

            if (result?.status === true || result?.code == 200) {
                showResultModal('success', 'Task Assigned', result?.message || 'Editor task created successfully.');

                resetForm();
                setExpandedId(null);

                // refresh list so counts/tasks update
                fetchEditorAssignments(false, search);
            } else {
                showResultModal('error', 'Assignment Failed', result?.message || 'Failed to assign editor task.');
            }
        } catch (error) {
            console.log('assign_editor_workflow ERROR:', error);

        } finally {
            setAssigning(false);
        }
    };

    /* =====================================================
       STAT CARD
    ===================================================== */

    const StatCard = ({
        title,
        value,
        icon,
        color,
        background,
    }) => {
        return (
            <View
                style={{
                    width: 145,
                    height: 78,
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    borderWidth: 0.7,
                    borderColor: '#e8e5f2',
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginRight: 9,
                }}
            >
                <View>
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 8,
                            color: '#8a8799',
                            letterSpacing: 0.4,
                        }}
                    >
                        {title}
                    </Text>

                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 22,
                            color: '#252238',
                            marginTop: 3,
                        }}
                    >
                        {value}
                    </Text>
                </View>

                <View
                    style={{
                        width: 37,
                        height: 37,
                        borderRadius: 12,
                        backgroundColor: background,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Icon
                        name={icon}
                        size={19}
                        color={color}
                    />
                </View>
            </View>
        );
    };

    /* =====================================================
       TASK MINI CHIP
    ===================================================== */

    const TaskChip = ({
        icon,
        label,
        value,
        color,
        bg,
    }) => {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: bg,
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                    marginRight: 4,
                    marginBottom: 4,
                }}
            >
                <Icon
                    name={icon}
                    size={11}
                    color={color}
                />

                <Text
                    style={{
                        fontFamily: Fonts.Bold,
                        fontSize: 8,
                        color: color,
                        marginLeft: 3,
                    }}
                >
                    {label}
                </Text>

                <Text
                    style={{
                        fontFamily: Fonts.Bold,
                        fontSize: 9,
                        color: color,
                        marginLeft: 2,
                    }}
                >
                    {value}
                </Text>
            </View>
        );
    };

    /* =====================================================
       SELECTOR
    ===================================================== */

    const Selector = ({
        value,
        placeholder,
        onPress,
        icon,
    }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                style={{
                    flex: 1,
                    height: 42,
                    borderWidth: 0.7,
                    borderColor: '#e1deeb',
                    borderRadius: 11,
                    paddingHorizontal: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#faf9fd',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                    }}
                >
                    {!!icon && (
                        <Icon
                            name={icon}
                            size={14}
                            color="#77738a"
                            style={{ marginRight: 6 }}
                        />
                    )}

                    <Text
                        numberOfLines={1}
                        style={{
                            flex: 1,
                            fontFamily: Fonts.Regular,
                            fontSize: 10,
                            color: value
                                ? '#353247'
                                : '#9996a6',
                        }}
                    >
                        {value || placeholder}
                    </Text>
                </View>

                <Icon
                    name="chevron-down"
                    size={17}
                    color="#68647b"
                />
            </TouchableOpacity>
        );
    };

    /* =====================================================
       ASSIGN EDITOR SECTION (SINGLE - PHOTO + VIDEO DROPDOWN)
    ===================================================== */

    const AssignEditorSection = ({ bookingId, item, hasPhotoTask, hasVideoTask, existingTasks }) => {
        const photoTask = (existingTasks || []).find(
            t => String(t?.task_type || '').toLowerCase() === 'photo'
        );
        const videoTask = (existingTasks || []).find(
            t => String(t?.task_type || '').toLowerCase() === 'video'
        );

        // 🆕 locked = already assigned AND edit icon nahi dabaya abhi tak
        const photoLocked = hasPhotoTask && !photoEditorUnlocked;
        const videoLocked = hasVideoTask && !videoEditorUnlocked;

        const bothAssigned = hasPhotoTask && hasVideoTask;
        const editingOnlyPhoto = bothAssigned && photoEditorUnlocked && !videoEditorUnlocked;
        const editingOnlyVideo = bothAssigned && videoEditorUnlocked && !photoEditorUnlocked;

        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderWidth: 0.8,
                    borderColor: '#e1deeb',
                    borderRadius: 15,
                    padding: 12,
                    marginBottom: 10,
                }}
            >
                {!editingOnlyVideo && (
                    <>
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                                color: '#504c60',
                                marginBottom: 6,
                            }}
                        >
                            Photo Editor
                        </Text>

                        {photoLocked ? (
                            <View
                                style={{
                                    height: 42,
                                    borderWidth: 0.7,
                                    borderColor: '#c8ecd7',
                                    borderRadius: 11,
                                    paddingHorizontal: 11,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#e5f8ef',
                                }}
                            >
                                <Icon name="check-decagram-outline" size={15} color="#0FA968" />

                                <Text
                                    numberOfLines={1}
                                    style={{
                                        flex: 1,
                                        marginLeft: 7,
                                        fontFamily: Fonts.Bold,
                                        fontSize: 10,
                                        color: '#0FA968',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {photoTask?.assigned_name
                                        ? `Assigned: ${photoTask.assigned_name}`
                                        : 'Already Assigned'}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        const matched = photoEditors.find(
                                            e => e.label?.toLowerCase() === (photoTask?.assigned_name || '').toLowerCase()
                                        );
                                        setPhotoEditor(photoTask?.assigned_name || '');
                                        setPhotoEditorId(matched?.value || Number(photoTask?.assigned_id || photoTask?.user_id || 0));
                                        setPhotoEditorUnlocked(true);
                                    }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: 8,
                                        backgroundColor: '#c8ecd7',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Icon name="pencil-outline" size={13} color="#0FA968" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Selector
                                value={photoEditor}
                                placeholder={editorsLoading ? 'Loading...' : 'Select Photo Editor'}
                                icon="image-outline"
                                onPress={() => setModalType('photoEditor')}
                            />
                        )}

                    </>
                )}

                {!editingOnlyPhoto && (
                    <>

                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                                color: '#504c60',
                                marginBottom: 6,
                                marginTop: 11,
                            }}
                        >
                            Video Editor
                        </Text>

                        {videoLocked ? (
                            <View
                                style={{
                                    height: 42,
                                    borderWidth: 0.7,
                                    borderColor: '#c8ecd7',
                                    borderRadius: 11,
                                    paddingHorizontal: 11,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#e5f8ef',
                                }}
                            >
                                <Icon name="check-decagram-outline" size={15} color="#0FA968" />

                                <Text
                                    numberOfLines={1}
                                    style={{
                                        flex: 1,
                                        marginLeft: 7,
                                        fontFamily: Fonts.Bold,
                                        fontSize: 10,
                                        color: '#0FA968',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {videoTask?.assigned_name
                                        ? `Assigned: ${videoTask.assigned_name}`
                                        : 'Already Assigned'}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => {
                                        const matched = videoEditors.find(
                                            e => e.label?.toLowerCase() === (videoTask?.assigned_name || '').toLowerCase()
                                        );
                                        setVideoEditor(videoTask?.assigned_name || '');
                                        setVideoEditorId(matched?.value || Number(videoTask?.assigned_id || videoTask?.user_id || 0));
                                        setVideoEditorUnlocked(true);
                                    }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: 8,
                                        backgroundColor: '#c8ecd7',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Icon name="pencil-outline" size={13} color="#0FA968" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Selector
                                value={videoEditor}
                                placeholder="Select Video Editor"
                                icon="video-outline"
                                onPress={() => setModalType('videoEditor')}
                            />
                        )}

                    </>
                )}

                <Text
                    style={{
                        fontFamily: Fonts.Bold,
                        fontSize: 8.5,
                        color: '#504c60',
                        marginBottom: 5,
                        marginTop: 11,
                    }}
                >
                    Priority & Due Date
                </Text>

                <View
                    style={{
                        flexDirection: 'row',
                        marginBottom: 1,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setModalType('priority')}
                        style={{
                            flex: 1,
                            height: 42,
                            borderWidth: 0.7,
                            borderColor: '#e1deeb',
                            borderRadius: 11,
                            paddingHorizontal: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#faf9fd',
                            marginRight: 6,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="flag-outline" size={14} color="#77738a" />
                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 10,
                                    color: '#555164',
                                    marginLeft: 5,
                                }}
                            >
                                {priority}
                            </Text>
                        </View>

                        <Icon name="chevron-down" size={16} color="#77738a" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowDatePicker(true)}
                        style={{
                            flex: 1,
                            height: 42,
                            borderWidth: 0.7,
                            borderColor: '#e1deeb',
                            borderRadius: 11,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 10,
                            backgroundColor: '#faf9fd',
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 10,
                                color: dueDate ? '#444153' : '#aaa7b5',
                            }}
                        >
                            {dueDate || 'Due date'}
                        </Text>

                        <Icon name="calendar-month-outline" size={16} color="#77738a" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dueDateObj}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={onChangeDueDate}
                        />
                    )}
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={assigning}
                    onPress={() => assignEditorTask(item, bookingId, hasPhotoTask, hasVideoTask)}
                    style={{
                        height: 44,
                        backgroundColor: Colors.buttonbgcolor,
                        borderRadius: 11,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 13,
                        flexDirection: 'row',
                        opacity: assigning ? 0.7 : 1,
                    }}
                >
                    {assigning ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Icon name="plus-circle-outline" size={17} color="#fff" />
                            <Text style={{ color: '#fff', fontFamily: Fonts.Bold, fontSize: 10, marginLeft: 6 }}>
                                Assign & Create Task
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {!!assignFormError && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#fff0f2',
                            borderRadius: 9,
                            borderWidth: 0.7,
                            borderColor: '#ffd4da',
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            marginTop: 9,
                        }}
                    >
                        <Icon name="alert-circle-outline" size={14} color="#EF4444" />
                        <Text
                            style={{
                                fontFamily: Fonts.Medium,
                                fontSize: 9,
                                color: '#EF4444',
                                marginLeft: 6,
                                flex: 1,
                            }}
                        >
                            {assignFormError}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    /* =====================================================
       BOOKING CARD
    ===================================================== */

    const BookingCard = ({ item, index }) => {
        const bookingId = String(
            item?.client_id || item?.order_no || index
        );

        const expanded = expandedId === bookingId;

        const taskCounts = item?.task_status_counts || {};

        const total = Number(taskCounts?.total || 0);
        const pending = Number(taskCounts?.Pending || 0);
        const progress = Number(taskCounts?.['In Progress'] || 0);
        const review = Number(taskCounts?.Review || 0);
        const done = Number(taskCounts?.Done || 0);

        /* ✅ NEW — check karo photo/video editor already assign hue ya nahi */
        const existingTasks = Array.isArray(item?.tasks) ? item.tasks : [];

        const hasPhotoTask = existingTasks.some(
            t => String(t?.task_type || '').toLowerCase() === 'photo'
        );

        const hasVideoTask = existingTasks.some(
            t => String(t?.task_type || '').toLowerCase() === 'video'
        );

        const bothEditorsAssigned = hasPhotoTask && hasVideoTask;

        return (
            <View
                style={{
                    marginHorizontal: 12,
                    marginBottom: 10,
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    borderWidth: 0.8,
                    borderColor: expanded ? '#cfc9f7' : '#e7e4ef',
                    overflow: 'hidden',
                }}
            >
                {/* CARD HEADER */}

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleBooking(bookingId)}
                    style={{
                        padding: 12,
                    }}
                >
                    {/* TOP */}

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 11,
                                backgroundColor: '#eeecff',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 9,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    fontSize: 12,
                                    color: '#6366F1',
                                }}
                            >
                                {index + 1}
                            </Text>
                        </View>

                        <View
                            style={{
                                flex: 1,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 14,
                                        color: '#28253a',
                                        textTransform: 'capitalize'
                                    }}
                                    numberOfLines={1}
                                >
                                    {item?.client_name || 'Unknown Client'}
                                </Text>

                                <View
                                    style={{
                                        backgroundColor: '#f1effb',
                                        borderRadius: 7,
                                        paddingHorizontal: 7,
                                        paddingVertical: 4,
                                        marginLeft: 7,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: Fonts.Bold,
                                            fontSize: 8,
                                            color: '#6863d9',
                                        }}
                                    >
                                        #{item?.order_no || '-'}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 5,
                                }}
                            >
                                <Icon
                                    name="phone-outline"
                                    size={12}
                                    color="#8a8798"
                                />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        fontSize: 9.5,
                                        color: '#858293',
                                        marginLeft: 5,
                                    }}
                                >
                                    {item?.mobile_no || 'No mobile'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 11,
                                backgroundColor: expanded
                                    ? Colors.buttonbgcolor
                                    : '#f4f2fa',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon
                                name={
                                    expanded
                                        ? 'chevron-up'
                                        : 'chevron-down'
                                }
                                size={19}
                                color={expanded ? '#fff' : '#77738a'}
                            />
                        </View>
                    </View>

                    {/* PHOTOGRAPHER + PACKAGE — 50/50 row */}

                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 12,
                        }}
                    >
                        {/* PHOTOGRAPHER — 50% */}

                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#f8f7ff',
                                borderRadius: 12,
                                borderWidth: 0.7,
                                borderColor: '#e5e1f5',
                                padding: 10,
                                marginRight: 6,
                            }}
                        >
                            <View
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    backgroundColor: '#eeecff',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon
                                    name="camera-outline"
                                    size={17}
                                    color="#6366F1"
                                />
                            </View>

                            <View
                                style={{
                                    marginLeft: 8,
                                    flex: 1,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 8,
                                        color: '#9692A5',
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    PHOTOGRAPHER
                                </Text>

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 11.5,
                                        color: '#2b293c',
                                        marginTop: 2,
                                        textTransform: 'capitalize',
                                    }}
                                    numberOfLines={2}
                                >
                                    {item?.photographer_name || 'Not assigned'}
                                </Text>
                            </View>
                        </View>

                        {/* PACKAGE — 50%, wraps down if long */}

                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                backgroundColor: '#fff9ef',
                                borderRadius: 12,
                                borderWidth: 0.7,
                                borderColor: '#f3e6c8',
                                padding: 10,
                                marginLeft: 6,
                            }}
                        >
                            <View
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    backgroundColor: '#fff4df',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon
                                    name="text-box-outline"
                                    size={17}
                                    color="#D98200"
                                />
                            </View>

                            <View
                                style={{
                                    marginLeft: 8,
                                    flex: 1,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 8,
                                        color: '#9692A5',
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    PACKAGE
                                </Text>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 2,
                                    }}
                                >
                                    <Text
                                        numberOfLines={1}
                                        onTextLayout={(e) => {
                                            // agar original text ek line se zyada lagta, matlab truncate ho raha hai
                                            // setIsPackageTruncated(e.nativeEvent.lines.length > 1);
                                        }}
                                        style={{
                                            flex: 1,
                                            fontFamily: Fonts.Bold,
                                            fontSize: 11.5,
                                            color: '#2b293c',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {item?.client_requirements || 'Not set'}
                                    </Text>

                                    <PackageText
                                        text={item?.client_requirements || 'Not set'}
                                        onInfoPress={txt => {
                                            setPackageModalText(txt);
                                            setPackageModal(true);
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* TASK STATUS LABEL */}

                    {/* <View
                        style={{
                            marginTop: 9,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9,
                                color: '#77738a',
                            }}
                        >
                            TASK STATUS
                        </Text>
                    </View> */}

                    {/* TASK CHIPS */}

                    {/* <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            marginTop: 6,
                        }}
                    >
                        <TaskChip
                            icon="clipboard-text-outline"
                            label="Total"
                            value={total}
                            color="#6366F1"
                            bg="#eeecff"
                        />

                        <TaskChip
                            icon="timer-sand"
                            label="Pending"
                            value={pending}
                            color="#D98200"
                            bg="#fff2dc"
                        />

                        <TaskChip
                            icon="sync"
                            label="Progress"
                            value={progress}
                            color="#6366F1"
                            bg="#eeecff"
                        />

                        <TaskChip
                            icon="backup-restore"
                            label="Review"
                            value={review}
                            color="#EF233C"
                            bg="#fff0f2"
                        />

                        <TaskChip
                            icon="check-circle-outline"
                            label="Done"
                            value={done}
                            color="#0FA968"
                            bg="#e5f8ef"
                        />
                    </View> */}
                </TouchableOpacity>

                {/* =================================================
                EXPANDED AREA
            ================================================= */}

                {expanded && (
                    <Animated.View
                        style={{
                            backgroundColor: '#f8f7fc',
                            borderTopWidth: 0.8,
                            borderTopColor: '#e5e1ef',
                            padding: 14,
                            opacity: getExpandAnim(bookingId),
                            transform: [
                                {
                                    translateY: getExpandAnim(
                                        bookingId
                                    ).interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-14, 0],
                                    }),
                                },
                            ],
                        }}
                    >



                        {/* EXISTING TASKS */}

                        {total > 0 && (
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 14,
                                    borderWidth: 0.7,
                                    borderColor: '#e5e1ef',
                                    padding: 12,
                                    marginBottom: 13,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 10,
                                            backgroundColor: '#eeecff',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon
                                            name="clipboard-text-outline"
                                            size={16}
                                            color="#6366F1"
                                        />
                                    </View>

                                    <View
                                        style={{
                                            marginLeft: 9,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 11.5,
                                                color: '#2b293c',
                                            }}
                                        >
                                            Existing Editor Tasks
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 8,
                                                color: '#9290a0',
                                                marginTop: 3,
                                            }}
                                        >
                                            Current tasks for this booking
                                        </Text>
                                    </View>
                                </View>

                                {total === 0 ? (
                                    <View
                                        style={{
                                            marginTop: 11,
                                            backgroundColor: '#faf9ff',
                                            borderRadius: 10,
                                            padding: 11,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Icon
                                            name="information-outline"
                                            size={16}
                                            color="#85819a"
                                        />

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 9,
                                                color: '#6f6b7e',
                                                marginLeft: 7,
                                            }}
                                        >
                                            No editor tasks created yet.
                                        </Text>
                                    </View>
                                ) : (
                                    <View
                                        style={{
                                            marginTop: 11,
                                        }}
                                    >
                                        {Array.isArray(item?.tasks) &&
                                            item.tasks.length > 0 ? (
                                            item.tasks.map(
                                                (task, taskIndex) => (
                                                    <View
                                                        key={
                                                            task?.id ||
                                                            taskIndex
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                '#f8f7ff',
                                                            borderRadius: 11,
                                                            padding: 11,
                                                            marginBottom: 8,
                                                            borderWidth: 0.5,
                                                            borderColor:
                                                                '#e4e1f1',
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection:
                                                                    'row',
                                                                alignItems:
                                                                    'center',
                                                            }}
                                                        >
                                                            <View
                                                                style={{
                                                                    width: 30,
                                                                    height: 30,
                                                                    borderRadius: 9,
                                                                    backgroundColor:
                                                                        '#eeecff',
                                                                    alignItems:
                                                                        'center',
                                                                    justifyContent:
                                                                        'center',
                                                                }}
                                                            >
                                                                <Icon
                                                                    name={
                                                                        String(
                                                                            task?.task_type ||
                                                                            ''
                                                                        ).toLowerCase() ===
                                                                            'video'
                                                                            ? 'video-outline'
                                                                            : 'image-outline'
                                                                    }
                                                                    size={15}
                                                                    color="#6366F1"
                                                                />
                                                            </View>

                                                            <View
                                                                style={{
                                                                    flex: 1,
                                                                    marginLeft: 9,
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontFamily:
                                                                            Fonts.Bold,
                                                                        fontSize: 12,
                                                                        color: '#39364a',
                                                                    }}
                                                                >
                                                                    {task?.task_type ||
                                                                        'Task'}
                                                                </Text>

                                                                <Text
                                                                    style={{
                                                                        fontFamily:
                                                                            Fonts.Regular,
                                                                        fontSize: 9.5,
                                                                        color: '#858293',
                                                                        marginTop: 3,
                                                                        textTransform: 'capitalize'
                                                                    }}
                                                                >
                                                                    Assigned to:{' '}
                                                                    {task?.assigned_name ||
                                                                        '-'}
                                                                </Text>
                                                            </View>


                                                            <View
                                                                style={{
                                                                    backgroundColor:
                                                                        task?.status ===
                                                                            'Done'
                                                                            ? '#e5f8ef'
                                                                            : task?.status ===
                                                                                'In Progress'
                                                                                ? '#eeecff'
                                                                                : '#fff2dc',
                                                                    borderRadius: 8,
                                                                    paddingHorizontal: 8,
                                                                    paddingVertical: 5,
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontFamily:
                                                                            Fonts.Bold,
                                                                        fontSize: 7.5,
                                                                        color:
                                                                            task?.status ===
                                                                                'Done'
                                                                                ? '#0FA968'
                                                                                : task?.status ===
                                                                                    'In Progress'
                                                                                    ? '#6366F1'
                                                                                    : '#D98200',
                                                                    }}
                                                                >
                                                                    {task?.status ||
                                                                        'Pending'}
                                                                </Text>
                                                            </View>

                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    const type = String(task?.task_type || '').toLowerCase();

                                                                    if (type === 'photo') {
                                                                        const matched = photoEditors.find(
                                                                            e => e.label?.toLowerCase() === (task?.assigned_name || '').toLowerCase()
                                                                        );
                                                                        setPhotoEditor(task?.assigned_name || '');
                                                                        setPhotoEditorId(matched?.value || Number(task?.assigned_id || task?.user_id || 0));
                                                                        setPhotoEditorUnlocked(true);
                                                                    } else if (type === 'video') {
                                                                        const matched = videoEditors.find(
                                                                            e => e.label?.toLowerCase() === (task?.assigned_name || '').toLowerCase()
                                                                        );
                                                                        setVideoEditor(task?.assigned_name || '');
                                                                        setVideoEditorId(matched?.value || Number(task?.assigned_id || task?.user_id || 0));
                                                                        setVideoEditorUnlocked(true);
                                                                    }
                                                                }}
                                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                                style={{
                                                                    width: 26,
                                                                    height: 26,
                                                                    borderRadius: 8,
                                                                    backgroundColor: '#eeecff',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginLeft: 6,
                                                                }}
                                                            >
                                                                <Icon name="pencil-outline" size={13} color="#6366F1" />
                                                            </TouchableOpacity>
                                                        </View>

                                                        {!!task?.due_date && (
                                                            <View
                                                                style={{
                                                                    flexDirection:
                                                                        'row',
                                                                    alignItems:
                                                                        'center',
                                                                    marginTop: 8,
                                                                }}
                                                            >
                                                                <Icon
                                                                    name="calendar-outline"
                                                                    size={12}
                                                                    color="#9996a5"
                                                                />

                                                                <Text
                                                                    style={{
                                                                        fontFamily:
                                                                            Fonts.Regular,
                                                                        fontSize: 10,
                                                                        color: '#858293',
                                                                        marginLeft: 5,
                                                                    }}
                                                                >
                                                                    Due:{' '}
                                                                    {
                                                                        formatDueDate(task.due_date)
                                                                    }
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )
                                            )
                                        ) : (
                                            <View
                                                style={{
                                                    backgroundColor: '#f4f2ff',
                                                    borderRadius: 10,
                                                    padding: 11,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: Fonts.Bold,
                                                        fontSize: 9.5,
                                                        color: '#6366F1',
                                                    }}
                                                >
                                                    {total} editor task(s)
                                                    already created
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {bothEditorsAssigned && !photoEditorUnlocked && !videoEditorUnlocked ? (
                            /* ✅ NEW — dono editors already assign ho chuke, form hide, info dikhao */
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#e5f8ef',
                                    borderRadius: 12,
                                    padding: 12,
                                    borderWidth: 0.7,
                                    borderColor: '#c8ecd7',
                                }}
                            >
                                <View
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        backgroundColor: '#c8ecd7',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Icon name="check-decagram-outline" size={17} color="#0FA968" />
                                </View>

                                <View style={{ marginLeft: 9, flex: 1 }}>
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 11.5, color: '#0FA968' }}>
                                        Both Editors Assigned
                                    </Text>
                                    <Text style={{ fontFamily: Fonts.Regular, fontSize: 8.5, color: '#3f8a63', marginTop: 3 }}>
                                        Photo and Video editor tasks are already created for this booking.
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                {/* ASSIGN HEADER */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 10,
                                            backgroundColor: '#eaf5ff',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon name="account-multiple-plus-outline" size={17} color="#2196F3" />
                                    </View>

                                    <View style={{ marginLeft: 9 }}>
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 11.5, color: '#2b293c' }}>
                                            Assign Photo / Video Editor
                                        </Text>
                                        <Text style={{ fontFamily: Fonts.Regular, fontSize: 8, color: '#9290a0', marginTop: 3 }}>
                                            Select an editor and create work
                                        </Text>
                                    </View>
                                </View>


                                {/* SINGLE ASSIGN EDITOR SECTION */}
                                <AssignEditorSection
                                    bookingId={bookingId}
                                    item={item}
                                    hasPhotoTask={hasPhotoTask}
                                    hasVideoTask={hasVideoTask}
                                    existingTasks={existingTasks}
                                />
                            </>
                        )}
                    </Animated.View>
                )}
            </View>
        );
    };



    /* =====================================================
       MODAL
    ===================================================== */

    const isEditorModal =
        modalType === 'photoEditor' ||
        modalType === 'videoEditor';
    const modalData = useMemo(() => (
        isEditorModal
            ? (modalType === 'photoEditor' ? photoEditors : videoEditors)
            : PRIORITIES
    ), [isEditorModal, modalType, photoEditors, videoEditors]);

    const filteredModalData = useMemo(() => {
        const q = modalSearchText.trim().toLowerCase();
        if (!q) return modalData;

        return modalData.filter(item => {
            const label = typeof item === 'string' ? item : item.label;
            return String(label).toLowerCase().includes(q);
        });
    }, [modalData, modalSearchText]);

    const modalTitle = isEditorModal
        ? modalType === 'photoEditor'
            ? 'Select Photo Editor'
            : 'Select Video Editor'
        : 'Select Priority';

    const selectModalValue = value => {
        console.log("modal value", value);
        if (modalType === 'photoEditor') {
            setPhotoEditor(value.label);
            setPhotoEditorId(value.value);
        } else if (modalType === 'videoEditor') {
            setVideoEditor(value.label);
            setVideoEditorId(value.value);
        } else if (modalType === 'priority') {
            setPriority(value);
        }

        setModalType(null);
        setModalSearchText('');
        setAssignFormError('');
    };

    /* =====================================================
       LIST HEADER (stats + section title + search + top loader)
    ===================================================== */



    /* =====================================================
       LIST FOOTER (bottom "load more" loader)
    ===================================================== */

    const renderListFooter = () => {
        if (!loadingMore) return null;

        return (
            <View
                style={{
                    paddingVertical: 18,
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />

                <Text
                    style={{
                        fontFamily: Fonts.Regular,
                        fontSize: 8.5,
                        color: '#9290a0',
                        marginTop: 6,
                    }}
                >
                    Loading more bookings...
                </Text>
            </View>
        );
    };

    /* =====================================================
       EMPTY STATE
    ===================================================== */

    const renderEmptyState = () => {
        if (loading && bookings.length === 0) return null;

        return (
            <View
                style={{
                    marginHorizontal: 12,
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    paddingVertical: 50,
                    alignItems: 'center',
                    borderWidth: 0.7,
                    borderColor: '#e5e2ed',
                }}
            >
                <View
                    style={{
                        width: 55,
                        height: 55,
                        borderRadius: 18,
                        backgroundColor:
                            '#f0eef8',
                        alignItems: 'center',
                        justifyContent:
                            'center',
                    }}
                >
                    <Icon
                        name="clipboard-search-outline"
                        size={28}
                        color="#aaa7b8"
                    />
                </View>

                <Text
                    style={{
                        fontFamily:
                            Fonts.Bold,
                        fontSize: 13,
                        color: '#39364a',
                        marginTop: 10,
                    }}
                >
                    No bookings found
                </Text>

                <Text
                    style={{
                        fontFamily:
                            Fonts.Regular,
                        fontSize: 9,
                        color: '#9290a0',
                        marginTop: 3,
                    }}
                >
                    Try another search
                </Text>
            </View>
        );
    };

    /* =====================================================
       RETURN
    ===================================================== */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f7f6fb',
            }}
        >
            <StatusBar
                backgroundColor={Colors.buttonbgcolor}
                barStyle="light-content"
            />

            {/* =================================================
                HEADER
            ================================================= */}

            <View
                style={{
                    backgroundColor:
                        Colors.buttonbgcolor,
                    paddingHorizontal: 15,
                    paddingTop: 13,
                    paddingBottom: 14,

                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        position: 'relative',
                    }}
                >
                    {/* BACK BUTTON / MENU BUTTON */}
                    <TouchableOpacity
                        onPress={() => {
                            if (hideBack) {
                                navigation.navigate('Menus'); // ✅ drawer/menu par le jao
                            } else {
                                navigation.goBack(); // ✅ normal back
                            }
                        }}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 11,
                            backgroundColor: 'rgba(255,255,255,0.13)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                        }}
                    >
                        <Icon
                            name={hideBack ? 'menu' : 'arrow-left'}   // ✅ CHANGE — icon bhi switch hoga
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    {/* CENTER TITLE */}
                    <View
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 17, color: '#fff', textAlign: 'center' }}>
                            Dashboard
                        </Text>

                    </View>
                </View>
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
                            alignItems: 'flex-start',   // 👈 'center' se 'flex-start' kar do, taaki 2nd line pe icon top-aligned dikhe
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
                                flex: 1,          // 👈 flexShrink ki jagah flex: 1 — text jitni jagah chahiye utni le, wrap ho jayega
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
                                <Text style={{
                                    fontSize: 12,
                                    color: '#64748B',
                                    fontWeight: '500',
                                    marginLeft: 4,
                                }}>
                                    {' '}
                                    ({userType === 'Coordinator → Editor'
                                        ? 'Coordinator Post Production'
                                        : userType})
                                </Text>
                            ) : null}
                        </Text>
                    </View>
                )}
            </View>



            {/* =================================================
                BODY — FlatList with client-side pagination (20 per page)
            ================================================= */}

            <FlatList
                data={visibleBookings}
                keyExtractor={(item, index) =>
                    String(item?.client_id || item?.order_no || index)
                }
                renderItem={({ item, index }) => (
                    <BookingCard item={item} index={index} />
                )}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchEditorAssignments(true, search)}
                    />
                }
                contentContainerStyle={{ paddingBottom: 30 }}
                ListHeaderComponent={
                    <ListHeader
                        stats={stats}
                        search={search}
                        setSearch={handleSearch}
                        onClearSearch={() => setSearch('')}
                        filteredCount={filteredBookings.length}
                        loading={loading}
                        bookingsLength={bookings.length}
                    />
                }
                ListFooterComponent={renderListFooter}
                ListEmptyComponent={renderEmptyState}
                onEndReached={loadMoreBookings}
                onEndReachedThreshold={0.4}
            />

            {/* =================================================
                BOTTOM SHEET MODAL
            ================================================= */}

            <Modal
                visible={modalType !== null}
                transparent
                animationType="fade"
                onRequestClose={closeSelectionModal}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(20,18,35,0.45)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 18,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={closeSelectionModal}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                        }}
                    />

                    <View
                        style={{
                            width: '100%',
                            maxWidth: 420,
                            backgroundColor: '#fff',
                            borderRadius: 22,
                            paddingHorizontal: 16,
                            paddingTop: 16,
                            paddingBottom: 18,
                            maxHeight: '75%',
                        }}
                    >
                        {/* HEADER */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                            }}
                        >
                            <View>
                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 15, color: '#272438' }}>
                                    {modalTitle}
                                </Text>
                                <Text style={{ fontFamily: Fonts.Regular, fontSize: 8.5, color: '#9290a0', marginTop: 2 }}>
                                    Choose an option to continue
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={closeSelectionModal}
                                style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    backgroundColor: '#f3f1f8',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Icon name="close" size={18} color="#77748a" />
                            </TouchableOpacity>
                        </View>

                        {/* 🔍 SEARCH BAR — NAYA */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#faf9fd',
                                borderRadius: 11,
                                borderWidth: 0.7,
                                borderColor: '#e1deeb',
                                paddingHorizontal: 11,
                                height: 42,
                                marginBottom: 12,
                            }}
                        >
                            <Icon name="magnify" size={17} color="#9997a8" />
                            <TextInput
                                value={modalSearchText}
                                onChangeText={setModalSearchText}
                                placeholder={`Search ${modalTitle.replace('Select ', '')}...`}
                                placeholderTextColor="#aaa7b5"
                                style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    padding: 0,
                                    fontFamily: Fonts.Regular,
                                    fontSize: 10.5,
                                    color: '#2c2940',
                                }}
                            />
                            {modalSearchText.length > 0 && (
                                <TouchableOpacity onPress={() => setModalSearchText('')}>
                                    <Icon name="close-circle" size={16} color="#c4c1d3" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* LIST — ab filteredModalData use hoga */}
                        <FlatList
                            data={filteredModalData}
                            keyExtractor={(item, index) =>
                                typeof item === 'string' ? `${item}-${index}` : String(item.value)
                            }
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                                    <Icon name="text-box-search-outline" size={26} color="#c4c1d3" />
                                    <Text style={{ fontFamily: Fonts.Regular, fontSize: 10, color: '#9290a0', marginTop: 8 }}>
                                        No matches found
                                    </Text>
                                </View>
                            }
                            renderItem={({ item, index }) => {
                                const label = typeof item === 'string' ? item : item.label;

                                const selected =
                                    (modalType === 'photoEditor' && photoEditor === label) ||
                                    (modalType === 'videoEditor' && videoEditor === label) ||
                                    (modalType === 'priority' && priority === label);

                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() => selectModalValue(item)}
                                        style={{
                                            height: 49,
                                            borderWidth: 0.7,
                                            borderColor: selected ? '#c9c5f5' : '#e5e2ed',
                                            borderRadius: 12,
                                            paddingHorizontal: 12,
                                            justifyContent: 'center',
                                            marginBottom: 7,
                                            backgroundColor: selected ? '#f1efff' : '#faf9fd',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 29, height: 29, borderRadius: 9,
                                                backgroundColor: selected ? '#e3e0ff' : '#f0eef6',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 8, color: selected ? '#6366F1' : '#8a8798' }}>
                                                {index + 1}
                                            </Text>
                                        </View>

                                        <Text
                                            style={{
                                                flex: 1,
                                                fontFamily: Fonts.Medium,
                                                fontSize: 10.5,
                                                color: selected ? '#4d49a9' : '#39364a',
                                                marginLeft: 9,
                                            }}
                                        >
                                            {label}
                                        </Text>

                                        {selected && <Icon name="check-circle" size={18} color="#6366F1" />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* =================================================
    EXIT CONFIRMATION MODAL
================================================= */}

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

            <Modal
                transparent
                visible={resultModal.visible}
                animationType="fade"
                onRequestClose={() => setResultModal(prev => ({ ...prev, visible: false }))}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setResultModal(prev => ({ ...prev, visible: false }))}
                >
                    <View
                        style={{ width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 4, alignItems: 'center' }}
                        onStartShouldSetResponder={() => true}
                    >
                        <View
                            style={{
                                width: 50, height: 50, borderRadius: 25,
                                backgroundColor: resultModal.type === 'success' ? '#e5f8ef' : '#fff0f2',
                                alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                            }}
                        >
                            <Icon
                                name={resultModal.type === 'success' ? 'check-circle-outline' : 'alert-circle-outline'}
                                size={26}
                                color={resultModal.type === 'success' ? '#0FA968' : '#EF4444'}
                            />
                        </View>

                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 15, color: '#0F172A', textAlign: 'center', marginBottom: 6 }}>
                            {resultModal.title}
                        </Text>

                        <Text style={{ fontFamily: Fonts.Regular, fontSize: 12.5, color: '#475569', textAlign: 'center', marginBottom: 18 }}>
                            {resultModal.message}
                        </Text>

                        <TouchableOpacity
                            onPress={() => setResultModal(prev => ({ ...prev, visible: false }))}
                            style={{
                                minWidth: 120,
                                backgroundColor: resultModal.type === 'success' ? '#0FA968' : Colors.buttonbgcolor,
                                paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontFamily: Fonts.Medium, fontSize: 13, color: '#fff' }}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>


            {/* PACKAGE DETAIL MODAL */}
            <Modal
                visible={packageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setPackageModal(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(20,18,35,0.45)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 24,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setPackageModal(false)}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    <View
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            backgroundColor: '#fff',
                            borderRadius: 18,
                            padding: 18,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    backgroundColor: '#fff4df',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon name="text-box-outline" size={17} color="#D98200" />
                            </View>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 14, color: '#2b293c', marginLeft: 9, flex: 1 }}>
                                Package Details
                            </Text>
                            <TouchableOpacity onPress={() => setPackageModal(false)}>
                                <Icon name="close" size={20} color="#77748a" />
                            </TouchableOpacity>
                        </View>

                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 13,
                                color: '#39364a',
                                lineHeight: 20,
                                textTransform: 'capitalize',
                            }}
                        >
                            {packageModalText}
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Editordashboard;
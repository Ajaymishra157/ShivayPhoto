import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    StatusBar, TouchableOpacity, Image, BackHandler, Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API, Colors, Fonts } from './Commoncomponent/Constants';
import RNExitApp from 'react-native-exit-app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Followups from './Users/Followups';
import NotificationModal from './NotificationModal';



const menuItems = [
    // {
    //     name: 'Source',
    //     icon: 'source-branch',
    //     color: '#0284C7',
    //     screen: 'SourceList'
    // },
    // {
    //     name: 'Purpose',
    //     icon: 'target',
    //     color: '#16A34A',
    //     screen: 'PurposeList'
    // },
    // {
    //     name: 'Lead Transfer',
    //     icon: 'swap-horizontal',
    //     color: '#F59E0B',
    //     screen: 'LeadTransferList'
    // },
    {
        name: 'Leads',
        icon: 'account-multiple-plus-outline',
        color: '#8B5CF6',
        screen: 'LeadsDashboard'
    },
    {
        name: 'Reports',
        icon: 'chart-box-outline',
        color: '#DC2626',
        screen: 'ReportsDashboard'
    },
    {
        name: 'Manage Booking',
        icon: 'calendar-check-outline',
        color: '#DC2626',
        screen: 'managebookingdashboard'
    },
];



const Dashboard = ({ navigation }) => {
    const [logoutModal, setLogoutModal] = useState(false);
    const [exitModal, setExitModal] = useState(false);
    const [userType, setUserType] = useState('');
    const [greeting, setGreeting] = useState('');
    const [notificationModal, setNotificationModal] = useState(false);
    const [statsData, setStatsData] = useState({});
    const [notificationCount, setNotificationCount] = useState(0);



    // Dashboard.js — statsItems mein navParams add karo
    const statsItems = [
        {
            label: 'Follow Up',
            value: statsData.today_total,
            navParams: { follow_status: 'todays_follow', type: '', status: [] }
        },
        {
            label: 'Hot',
            value: statsData.hot_total,
            navParams: { follow_status: 'todays_follow', type: 'hot', status: [] }
        },
        {
            label: 'Warm',
            value: statsData.warm_total,
            navParams: { follow_status: 'todays_follow', type: 'warm', status: [] }
        },
        {
            label: 'Cold',
            value: statsData.cold_total,
            navParams: { follow_status: 'todays_follow', type: 'cold', status: [] }
        },
        {
            label: 'Total Leads',
            value: statsData.total,
            navParams: { follow_status: '', type: '', status: [] }
        },
        {
            label: 'Pending\nPre/Enquiry',
            value: statsData.Pending,
            navParams: { follow_status: '', type: '', status: ['Pending'] }
        },
        {
            label: 'Unresponsive',
            value: statsData.Unresponsive,
            navParams: { follow_status: '', type: '', status: ['Unresponsive'] }
        },
        {
            label: 'Follow-up',
            value: statsData.Follow_up,
            navParams: { follow_status: '', type: '', status: ['Follow-up'] }
        },
        {
            label: 'Quotation\nSent',
            value: statsData.Quotation_Sent,
            navParams: { follow_status: '', type: '', status: ['Quotation Sent'] }
        },
        {
            label: 'Converted\nto Client',
            value: statsData.Converted_to_Client,
            navParams: { follow_status: '', type: '', status: ['Converted to Client'] }
        },
        {
            label: 'End',
            value: statsData.total_end,
            navParams: { follow_status: '', type: '', status: ['End'] }
        },
    ];

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Good Morning');
        else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
        else if (hour >= 17 && hour < 21) setGreeting('Good Evening');
        else setGreeting('Good Night');
    }, []);

    const openLogoutModal = () => setLogoutModal(true);
    const closeLogoutModal = () => setLogoutModal(false);
    const openExitModal = () => setExitModal(true);
    const closeExitModal = () => setExitModal(false);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('id');
        setLogoutModal(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    const confirmExit = () => RNExitApp.exitApp();

    useFocusEffect(
        useCallback(() => {
            const backAction = () => {
                openExitModal();
                return true;
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => backHandler.remove();
        }, [])
    );

    const fetchNotificationCount = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.followup_api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin: userId,
                    tab: 'today'
                })
            });

            const result = await res.json();
            console.log("Notification Count:", result);

            if (result.success) {
                setNotificationCount(result.count || 0);
            } else {
                setNotificationCount(0);
            }
        } catch (error) {
            console.log('Notification Count Error:', error);
            setNotificationCount(0);
        }
    };

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId })
            });
            const result = await res.json();
            if (result.code == 200 && result.payload.length > 0) {
                setUserType(result.payload[0].user_type);
            } else {
                setUserType('');
            }
        } catch (e) {
            setUserType('');
        }
    };

    const fetchStats = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.counting, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: userId })
            });

            const result = await res.json();

            if (result.status) {
                setStatsData(result.data);
            }
        } catch (e) {
            console.log('Stats API error:', e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUserType();
            fetchStats();
            fetchNotificationCount();
        }, [])
    );

    const getFilteredMenu = () => {
        if (userType === 'Sales-Person') {
            return menuItems.filter(item =>
                ['Lead Transfer', 'Leads', 'Reports', 'Manage Booking'].includes(item.name)
            );
        }
        if (userType === 'Booking-Person') {
            return menuItems.filter(item => item.name === 'Manage Booking');
        }
        return menuItems;
    };

    // StatCard — navigation prop add karo Dashboard se
    const StatCard = ({ item, isScrollRow, navigation }) => (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
                if (item.navParams && navigation) {
                    navigation.navigate('ManageLeads', {
                        dashboardFilter: item.navParams
                    });
                }
            }}
            style={{
                width: isScrollRow ? 82 : '23%',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 9,
                paddingHorizontal: 4,
                alignItems: 'center',
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
            }}>
            <View style={{ height: 25, justifyContent: 'center', alignItems: 'center' }}>
                <Text numberOfLines={2} style={{
                    fontSize: 10,
                    textAlign: 'center',
                    color: '#64748B',
                    fontFamily: 'Inter-Regular',
                }}>
                    {item.label}
                </Text>
            </View>
            <View style={{ height: 18, justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                <Text style={{
                    fontSize: 13,
                    fontFamily: 'Inter-Bold',
                    color: '#0F172A',
                }}>
                    {item.value ?? 0}
                </Text>
            </View>
        </TouchableOpacity>
    );


    // ── Arrow Button Style Helper ────────────────────────────────
    const arrowStyle = (side) => ({
        position: 'absolute',
        [side]: -8,
        top: 20,
        bottom: 0,
        zIndex: 10,
        width: 24,
        height: 24,
        marginVertical: 'auto',
        borderRadius: 12,
        backgroundColor: Colors.buttonbgcolor,
        borderWidth: 0.5,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    });

    // ── Scroll Row with Left/Right Arrows ────────────────────────
    const ScrollRowWithArrows = ({ items }) => {
        const scrollRef = useRef(null);
        const [showLeft, setShowLeft] = useState(false);
        const [showRight, setShowRight] = useState(true);
        const [scrollX, setScrollX] = useState(0);

        const handleScroll = (event) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const x = contentOffset.x;
            const maxX = contentSize.width - layoutMeasurement.width;
            setScrollX(x);
            setShowLeft(x > 4);
            setShowRight(x < maxX - 4);
        };

        const scrollBy = (dir) => {
            scrollRef.current?.scrollTo({
                x: scrollX + (dir === 'right' ? 280 : -280),
                animated: true,
            });
        };
        return (
            <View style={{ position: 'relative' }}>

                {/* Left Arrow */}
                {showLeft && (
                    <TouchableOpacity
                        onPress={() => scrollBy('left')}
                        style={arrowStyle('left')}
                        activeOpacity={0.75}
                    >
                        <Icon name="chevron-left" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {/* Right Arrow */}
                {showRight && (
                    <TouchableOpacity
                        onPress={() => scrollBy('right')}
                        style={arrowStyle('right')}
                        activeOpacity={0.75}
                    >
                        <Icon name="chevron-right" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ gap: 9.4, paddingBottom: 9.4, paddingHorizontal: 2 }}
                >
                    {items.map((item, index) => (
                        <StatCard key={index} item={item} isScrollRow navigation={navigation} />
                    ))}
                </ScrollView>
            </View>
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* ── Header ── */}
            <View style={styles.headerBar}>
                <TouchableOpacity
                    style={styles.menuBtn}
                    onPress={() => navigation.navigate('Menus')}
                >
                    <Icon name="menu" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ── Profile Banner ── */}
            <View style={styles.profileBanner}>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={require('../assets/shivayoriginal.png')}
                        style={styles.avatarImage}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.greetingText}>{greeting} 👋</Text>
                    <Text style={styles.userTypeText}>{userType || 'User'}</Text>
                    <Text style={styles.welcomeText}>Welcome to Shivay Dashboard</Text>
                </View>
                <TouchableOpacity
                    style={styles.bellBtn}
                    onPress={() => setNotificationModal(true)}
                >
                    <Icon name="bell-outline" size={20} color="#fff" />

                    {/* 🔥 Badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{notificationCount}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* ── Body ── */}
            <View style={styles.body}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                >
                    {/* Menu Icons */}
                    <View style={styles.menuGrid}>
                        {getFilteredMenu().map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.85}
                                onPress={() => {
                                    if (item.screen) navigation.navigate(item.screen);
                                    else if (item.action === 'logout') openLogoutModal();
                                }}
                                style={styles.menuCard}
                            >
                                {item.image ? (
                                    <Image
                                        source={item.image}
                                        tintColor={item.color}
                                        style={{ width: 32, height: 32, resizeMode: 'contain' }}
                                    />
                                ) : (
                                    <Icon name={item.icon} size={32} color={item.color} />
                                )}
                                <Text style={styles.menuLabel}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Leads Summary ── */}

                    <View style={{ marginBottom: 5.4 }}>
                        <Text style={{
                            fontSize: 17,
                            fontFamily: 'Inter-Bold',
                            color: '#0F172A',
                            marginBottom: 9.4,
                            marginLeft: 2,
                        }}>
                            Leads Summary Today
                        </Text>

                        {/* Row 1 — First 4 (fixed grid) */}
                        <View style={{
                            flexDirection: 'row',
                            gap: 9.4,
                            marginBottom: 8.4,
                        }}>
                            {statsItems.slice(0, 4).map((item, index) => (
                                <StatCard key={index} item={item} navigation={navigation} />
                            ))}
                        </View>

                        {/* Row 2 — Remaining 7 (scroll + arrows) */}
                        <ScrollRowWithArrows items={statsItems.slice(4)} />
                    </View>

                    {/* ── Follow Ups Card ── */}
                    <Followups />

                    <View style={{ height: 20 }} />
                </ScrollView>
            </View>

            {/* ── Logout Modal ── */}
            <Modal transparent visible={logoutModal} animationType="fade" onRequestClose={closeLogoutModal}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeLogoutModal}>
                    <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Confirm Logout</Text>
                        <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={closeLogoutModal} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogout} style={styles.dangerBtn}>
                                <Text style={styles.dangerBtnText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Exit Modal ── */}
            <Modal transparent visible={exitModal} animationType="fade" onRequestClose={closeExitModal}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeExitModal}>
                    <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Confirm Exit</Text>
                        <Text style={styles.modalMessage}>Are you sure you want to exit the app?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={closeExitModal} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmExit} style={styles.dangerBtn}>
                                <Text style={styles.dangerBtnText}>Exit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
            <NotificationModal
                visible={notificationModal}
                onClose={() => setNotificationModal(false)}
            />
        </SafeAreaView>
    );
};

export default Dashboard;

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    headerBar: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.buttonbgcolor,
        paddingHorizontal: 12,
    },
    menuBtn: { width: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: {
        flex: 1, textAlign: 'center',
        fontSize: 18, fontFamily: 'Inter-Bold', color: Colors.btntext,
    },

    // Profile Banner
    profileBanner: {
        backgroundColor: Colors.buttonbgcolor,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarWrapper: {
        width: 64, height: 64, borderRadius: 32,
        borderWidth: 2.5, borderColor: '#ffffff60',
        overflow: 'hidden', backgroundColor: '#fff',
    },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    greetingText: { fontSize: 13, color: '#ffffffb0', fontFamily: Fonts.Regular, marginBottom: 2 },
    userTypeText: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Inter-Bold' },
    welcomeText: { fontSize: 11, color: '#ffffff80', fontFamily: Fonts.Regular, marginTop: 2 },
    bellBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#ffffff20',
        justifyContent: 'center', alignItems: 'center',
    },

    // Body
    body: {
        flex: 1, backgroundColor: '#f5f3f3',
        borderTopLeftRadius: 18, borderTopRightRadius: 18, elevation: 4,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12,
    },
    scrollContent: { paddingHorizontal: 14, paddingTop: 9 },

    // Menu Grid
    menuGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    menuCard: {
        width: '30%', backgroundColor: '#FFFFFF',
        borderRadius: 14, paddingVertical: 18,
        alignItems: 'center', marginBottom: 12,
        elevation: 2, shadowColor: '#000',
        shadowOpacity: 0.06, shadowRadius: 6,
    },
    menuLabel: {
        marginTop: 8, fontSize: 12, textAlign: 'center',
        color: Colors.listtext, fontFamily: Fonts.Regular,
    },




    // Modals
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    modalBox: {
        width: '85%', backgroundColor: '#FFFFFF',
        borderRadius: 16, padding: 20, elevation: 4,
    },
    modalTitle: {
        fontFamily: 'Inter-Bold', fontSize: 16,
        color: '#0F172A', textAlign: 'center', marginBottom: 8,
    },
    modalMessage: {
        fontFamily: 'Inter-Regular', fontSize: 14,
        color: '#475569', textAlign: 'center', marginBottom: 20,
    },
    modalButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    cancelBtn: {
        minWidth: 100, backgroundColor: '#F1F5F9',
        paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    },
    cancelBtnText: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#334155' },
    dangerBtn: {
        minWidth: 100, backgroundColor: '#EF4444',
        paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    },
    dangerBtnText: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#FFFFFF' },


    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold'
    }
});
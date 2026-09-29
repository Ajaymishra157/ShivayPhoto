import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, API } from '../Commoncomponent/Constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH - 24);

const formatDate = date => {
    if (!date || date === '0000-00-00') return null;
    const d = new Date(String(date).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return null;

    const datePart = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    // agar string mein time part bhi diya gaya tha, to usko bhi dikhao
    const hasTime = String(date).includes(':');

    if (!hasTime) {
        return datePart;
    }

    const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return `${datePart} ${timePart}`;
};

/* Avatar ke liye initials nikalna — "Nikita webmasters" -> "NW" */
const getInitials = name => {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

/* =========================================================
   TODAY / TOMORROW SHOOT ROW — screenshot design
========================================================= */

const TodayShootRow = ({ item, label, onPress }) => {
    const initials = getInitials(item.client_name);

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPress(item)}
            style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'flex-start',
                elevation: 1,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
            }}
        >
            {/* Avatar */}
            <View
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: '#7c4a2d',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                }}
            >
                <Text style={{ color: '#fff', fontFamily: Fonts.Bold, fontSize: 12 }}>
                    {initials}
                </Text>
            </View>

            {/* Middle */}
            <View style={{ flex: 1 }}>
                <Text numberOfLines={1}>
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            color: '#172033',
                            textTransform: 'capitalize',
                        }}
                    >
                        {item.client_name || '-'}{'  '}
                    </Text>
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 12,
                            color: '#6366F1',
                        }}
                    >
                        {item.client_mobile || item.mobile_no || '-'}
                    </Text>
                </Text>

                <Text
                    numberOfLines={1}
                    style={{
                        fontFamily: Fonts.Regular,
                        fontSize: 12,
                        color: '#64748b',
                        marginTop: 2,
                        textTransform: 'capitalize',
                    }}
                >
                    {item.purpose?.trim() || '-'}
                </Text>
            </View>

            {/* Right */}
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: Fonts.Bold, fontSize: 12, color: '#172033' }}>
                    {label}
                </Text>
                <Text
                    style={{
                        fontFamily: Fonts.Bold,
                        fontSize: 11,
                        color: '#DC2626',
                        marginTop: 3,
                    }}
                >
                    {formatDate(item.entry_date) || formatDate(item.booking_date) || '-'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

/* =========================================================
   MAIN — anchored dropdown, bell icon se emerge hota hai
========================================================= */

const CoordinatorNotificationModal = ({
    visible,
    onClose,
    navigation,
    anchor = { top: 60, right: 12 },   // bell ka measured position
}) => {
    const [loading, setLoading] = useState(false);
    const [todayItems, setTodayItems] = useState([]);
    const [tomorrowItems, setTomorrowItems] = useState([]);
    const [activeTab, setActiveTab] = useState('today');   // 'today' | 'tomorrow'

    const anim = useRef(new Animated.Value(0)).current;

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const uid = await AsyncStorage.getItem('id');

            const res = await fetch(API.coordinator_wise_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    search: '',
                    stage: 'All',
                    coordinator_id: Number(uid || 0),
                    photographer_id: 0,
                    status: 'active',
                }),
            });
            const result = await res.json();

            if (result?.status === true) {
                setTodayItems(result?.today_shoots?.items || []);
                setTomorrowItems(result?.tomorrow_shoots?.items || []);
            } else {
                setTodayItems([]);
                setTomorrowItems([]);
            }
        } catch (error) {
            console.log('Coordinator wise list (notifications) error:', error);
            setTodayItems([]);
            setTomorrowItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            setActiveTab('today');
            fetchNotifications();

            anim.setValue(0);
            Animated.spring(anim, {
                toValue: 1,
                friction: 9,
                tension: 90,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, fetchNotifications]);

    const openBooking = item => {
        onClose();
        navigation.navigate('NewCoordination', { bookingData: item });
    };

    if (!visible) return null;

    const animatedStyle = {
        opacity: anim,
        transform: [
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                }),
            },
            {
                scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                }),
            },
        ],
    };

    const activeItems = activeTab === 'today' ? todayItems : tomorrowItems;
    const rowLabel = activeTab === 'today' ? "Today's Shoot" : "Tomorrow's Shoot";
    const emptyText = activeTab === 'today'
        ? 'No Shoots Scheduled For Today.'
        : 'No Shoots Scheduled For Tomorrow.';

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Outside tap se close — poori screen transparent overlay */}
            <Pressable style={{ flex: 1 }} onPress={onClose}>
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            top: anchor.top,
                            right: anchor.right,
                            width: PANEL_WIDTH,
                            maxHeight: 460,
                            backgroundColor: '#f5f6f8',
                            borderRadius: 14,
                            elevation: 8,
                            shadowColor: '#000',
                            shadowOpacity: 0.18,
                            shadowRadius: 10,
                            shadowOffset: { width: 0, height: 4 },
                            overflow: 'hidden',
                        },
                        animatedStyle,
                    ]}
                >
                    <Pressable onPress={e => e.stopPropagation()}>
                        {/* Header */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                backgroundColor: '#fff',
                                borderBottomWidth: 0.5,
                                borderBottomColor: '#eee',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="bell-outline" size={18} color={Colors.buttonbgcolor} />
                                <Text style={{ marginLeft: 7, fontFamily: Fonts.Bold, fontSize: 14, color: '#172033' }}>
                                    Notifications
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* TABS */}
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: '#fff',
                                paddingHorizontal: 12,
                                paddingTop: 10,
                                paddingBottom: 10,
                                gap: 8,
                                borderBottomWidth: 0.5,
                                borderBottomColor: '#eee',
                            }}
                        >
                            {/* TODAY TAB */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setActiveTab('today')}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    backgroundColor: activeTab === 'today' ? Colors.buttonbgcolor : '#f1f5f9',
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        fontSize: 11.5,
                                        fontFamily: Fonts.Bold,
                                        color: activeTab === 'today' ? '#fff' : '#334155',
                                    }}
                                >
                                    Today's Shoot
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: activeTab === 'today' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                        borderRadius: 20,
                                        paddingHorizontal: 6,
                                        paddingVertical: 1,
                                        marginLeft: 6,
                                        minWidth: 18,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 10, fontFamily: Fonts.Bold, color: activeTab === 'today' ? '#fff' : '#475569' }}>
                                        {todayItems.length}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* TOMORROW TAB */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setActiveTab('tomorrow')}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    backgroundColor: activeTab === 'tomorrow' ? Colors.buttonbgcolor : '#f1f5f9',
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        fontSize: 11.5,
                                        fontFamily: Fonts.Bold,
                                        color: activeTab === 'tomorrow' ? '#fff' : '#334155',
                                    }}
                                >
                                    Tomorrow's Shoot
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: activeTab === 'tomorrow' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                        borderRadius: 20,
                                        paddingHorizontal: 6,
                                        paddingVertical: 1,
                                        marginLeft: 6,
                                        minWidth: 18,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 10, fontFamily: Fonts.Bold, color: activeTab === 'tomorrow' ? '#fff' : '#475569' }}>
                                        {tomorrowItems.length}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        {loading ? (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                            </View>
                        ) : activeItems.length === 0 ? (
                            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                <Icon name="bell-check-outline" size={28} color="#94a3b8" />
                                <Text style={{ marginTop: 8, fontFamily: Fonts.Regular, fontSize: 12, color: '#94a3b8' }}>
                                    {emptyText}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={activeItems}
                                keyExtractor={(item, i) => String(item.client_id || i)}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 14 }}
                                renderItem={({ item }) => (
                                    <TodayShootRow item={item} label={rowLabel} onPress={openBooking} />
                                )}
                            />
                        )}
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

export default CoordinatorNotificationModal;
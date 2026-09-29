import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    TouchableOpacity,
    FlatList,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH - 24);

/*
=========================================================
YE API ADD KARNA HOGA (Constants.js mein):
=========================================================
assigned_not_accepted_list: `${BASE_URL}<path>/assigned_not_accepted_list.php`,

(actual filename/path apne backend ke hisaab se daal dena —
body me sirf { photographer_id } jaata hai, jaisa postman
example me diya tha)
=========================================================
*/
const formatDate = date => {
    if (!date || date === '0000-00-00') return null;

    const d = new Date(String(date).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return null;

    const datePart = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

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

/* Avatar ke liye initials — "Nikita Webmasters" -> "NW" */
const getInitials = name => {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};


const ConfirmActionModal = ({ visible, item, onClose, onConfirm, submitting }) => {
    if (!item) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 22 }}
                onPress={onClose}
            >
                <View
                    style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18 }}
                    onStartShouldSetResponder={() => true}
                >
                    <Icon name="check-circle-outline" size={40} color="#16A34A" style={{ alignSelf: 'center', marginBottom: 8 }} />
                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 15, color: '#202235', textAlign: 'center' }}>
                        Accept this booking?
                    </Text>
                    <Text style={{ fontFamily: Fonts.Regular, fontSize: 10.5, color: '#7b8090', textAlign: 'center', marginTop: 6, lineHeight: 15 }}>
                        {`Accept the assignment for "${item.client_name}"?`}
                    </Text>

                    <View style={{ flexDirection: 'row', marginTop: 18 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onClose}
                            disabled={submitting}
                            style={{ flex: 1, height: 43, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 8, opacity: submitting ? 0.6 : 1 }}
                        >
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 12, color: '#334155' }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onConfirm}
                            disabled={submitting}
                            style={{ flex: 1, height: 43, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginLeft: 8, opacity: submitting ? 0.7 : 1 }}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 12, color: '#fff' }}>Yes, Accept</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};
/* =========================================================
   TODAY SHOOT ROW
========================================================= */

const TodayShootRow = ({ item, onPress, onAccept, submittingId }) => {
    const initials = getInitials(item.client_name);
    const isAccepting = submittingId === item.client_id;
    const canAccept = item.assignment_status === 'Assigned' || item.assignment_status === 'Pending';


    return (

        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                padding: 12,
                marginBottom: 8,
                elevation: 1,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
            }}
        >
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onPress(item)}
                style={{ flexDirection: 'row', alignItems: 'flex-start' }}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            numberOfLines={1}
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 13,
                                color: '#172033',
                                textTransform: 'capitalize',
                                flexShrink: 1,       // naam chhota ho sakta hai, ellipsis lega
                                marginRight: 6,
                            }}
                        >
                            {item.client_name || '-'}
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 12,
                                color: '#6366F1',
                                flexShrink: 0,       // number kabhi shrink/cut nahi hoga
                            }}
                        >
                            {item.mobile_no || '-'}
                        </Text>
                    </View>

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
                        {item.event?.trim() || '-'}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Icon name="account-outline" size={12} color="#94a3b8" />
                        {!!item.coordinator_name && (
                            <Text
                                numberOfLines={1}
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 10,
                                    color: '#94a3b8',
                                    marginLeft: 3,
                                }}
                            >
                                {item.coordinator_name}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Right */}
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 12, color: '#172033' }}>
                        {item.assignment_status || 'Assigned'}
                    </Text>
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 11,
                            color: '#DC2626',
                            marginTop: 3,
                        }}
                    >
                        {formatDate(item.assigned_at) || '-'}
                    </Text>
                </View>
            </TouchableOpacity>
            {/* NAYA — ACCEPT BUTTON */}
            {canAccept && (
                <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
                    <TouchableOpacity
                        activeOpacity={0.75}
                        disabled={isAccepting}
                        onPress={() => onAccept(item)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 28,
                            paddingHorizontal: 10,
                            borderRadius: 8,
                            backgroundColor: '#E8F8EF',
                            borderWidth: 0.8,
                            borderColor: '#16A34A',
                            opacity: isAccepting ? 0.6 : 1,
                        }}
                    >
                        {isAccepting ? (
                            <ActivityIndicator size="small" color="#16A34A" />
                        ) : (
                            <>
                                <Icon name="check-circle-outline" size={12} color="#16A34A" />
                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 9, color: '#16A34A', marginLeft: 4 }}>
                                    Accept
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const SectionHeader = ({ title }) => (
    <View
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 8,
            marginBottom: 4,
            borderBottomWidth: 0.5,
            borderBottomColor: '#e2e8f0',
        }}
    >
        <Text style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#172033' }}>
            {title}
        </Text>
    </View>
);

/* =========================================================
   MAIN — anchored dropdown, bell icon se emerge hota hai
========================================================= */

const PhotographerNotificationModal = ({
    visible,
    onClose,
    navigation,
    anchor = { top: 60, right: 12 },   // bell ka measured position
    onAccepted,
}) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const anim = useRef(new Animated.Value(0)).current;
    const [submittingStatusId, setSubmittingStatusId] = useState(null);
    const [confirmItem, setConfirmItem] = useState(null);

    const fetchTodayShoots = async () => {
        try {
            setLoading(true);

            const photographerId = await AsyncStorage.getItem('id');

            const res = await fetch(API.notification_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photographer_id: photographerId }),
            });

            const result = await res.json();

            console.log('assigned_not_accepted_list RESPONSE:', JSON.stringify(result, null, 2));

            if (result?.status === true) {
                setItems(Array.isArray(result.payload) ? result.payload : []);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.log('assigned_not_accepted_list ERROR:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptPress = item => setConfirmItem(item);

    const closeConfirmModal = () => {
        if (submittingStatusId) return;
        setConfirmItem(null);
    };

    const updateAssignmentStatus = async item => {
        try {
            setSubmittingStatusId(item.client_id);

            const adminId = await AsyncStorage.getItem('id');

            const formData = new FormData();
            formData.append('client_id', item.client_id);
            formData.append('admin_id', adminId || '');
            formData.append('status', 'Accepted');

            const res = await fetch(API.photographer_status, {
                method: 'POST',
                body: formData,
            });

            const json = await res.json();

            if (json?.status) {
                // 🔧 pehle: status set kar rahe the, ab: list se turant hata do
                setItems(prev => prev.filter(i => i.client_id !== item.client_id));

                // 🆕 dashboard ko batao — badge count aur stats turant update ho
                onAccepted?.(item);
            } else {
                console.log('photographer_status FAILED:', json?.message);
            }
        } catch (error) {
            console.log('photographer_status error:', error);
        } finally {
            setSubmittingStatusId(null);
        }
    };

    const proceedConfirm = async () => {
        if (!confirmItem) return;
        await updateAssignmentStatus(confirmItem);
        setConfirmItem(null);
    };

    useEffect(() => {
        if (visible) {
            fetchTodayShoots();

            anim.setValue(0);
            Animated.spring(anim, {
                toValue: 1,
                friction: 9,
                tension: 90,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const openBooking = item => {
        // onClose();
        // navigation.navigate('NewCoordination', { bookingData: item });
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

    return (
        <>
            <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
                {/* Outside tap se close */}
                <Pressable style={{ flex: 1 }} onPress={onClose}>
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                top: anchor.top,
                                right: anchor.right,
                                width: PANEL_WIDTH,
                                maxHeight: 420,
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

                            {/* Content */}
                            {loading ? (
                                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                                    <Text style={{ marginTop: 8, fontFamily: Fonts.Regular, fontSize: 12, color: '#94a3b8' }}>
                                        Loading notifications...
                                    </Text>
                                </View>
                            ) : items.length === 0 ? (
                                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                    <Icon name="bell-check-outline" size={30} color="#94a3b8" />
                                    <Text style={{ marginTop: 8, fontFamily: Fonts.Regular, fontSize: 12, color: '#94a3b8' }}>
                                        No notifications right now.
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={items}
                                    keyExtractor={(item, i) => String(item.client_id || i)}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 14 }}
                                    ListHeaderComponent={
                                        <SectionHeader title="Photographer Assigned Shoots" />
                                    }
                                    renderItem={({ item }) => (
                                        <TodayShootRow
                                            item={item}
                                            onPress={openBooking}
                                            onAccept={handleAcceptPress}
                                            submittingId={submittingStatusId}
                                        />
                                    )}
                                />
                            )}
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>

            <ConfirmActionModal
                visible={!!confirmItem}
                item={confirmItem}
                onClose={closeConfirmModal}
                onConfirm={proceedConfirm}
                submitting={!!submittingStatusId}
            />
        </>
    );
};

export default PhotographerNotificationModal;
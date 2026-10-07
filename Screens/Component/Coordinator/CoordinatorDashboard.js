import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    useMemo,
    memo,
} from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StatusBar,
    TextInput,
    Modal,
    ActivityIndicator,
    Pressable,
    RefreshControl,
    BackHandler,
    Dimensions,
    Linking,
    ScrollView,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import { Colors, Fonts, API } from '../Commoncomponent/Constants';
import RNExitApp from 'react-native-exit-app';
import CoordinatorNotificationModal from './CoordinatorNotificationModal';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const PAGE_SIZE = 20;

/* =========================================================
   STAGES
========================================================= */

const STAGES = [
    {
        key: 'concept',
        label: 'Concept Finalized',
        icon: 'lightbulb-outline',
    },
    {
        key: 'outfit',
        label: 'Outfit Finalized',
        icon: 'tshirt-crew-outline',
    },
    {
        key: 'props',
        label: 'Props Ready',
        icon: 'briefcase-outline',
    },
    {
        key: 'requirements',
        label: 'Client Requirements',
        icon: 'clipboard-text-outline',
    },
    {
        key: 'shoot',
        label: 'Shoot Assignment',
        icon: 'camera-outline',
    },
    {
        key: 'done',
        label: 'Done',
        icon: 'flag-checkered',
    },
];

const STAGE_COLORS = {
    'Pending': '#F59E0B',
    'Concept Finalized': '#0EA5E9',
    'Outfit Finalized': '#8B5CF6',
    'Props Ready': '#F59E0B',
    'Client Requirements': '#EC4899',
    'Shoot Assignment': '#6366F1',
    'Done': '#16A34A',
};

/* =========================================================
   HELPERS
========================================================= */

const formatDate = date => {
    if (!date) return '-';

    const d = new Date(
        String(date).replace(' ', 'T')
    );

    if (Number.isNaN(d.getTime())) {
        return date;
    }

    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getStageColor = stage =>
    STAGE_COLORS[stage] || '#64748b';

const MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
];

// booking_date valid hai to Date return karo, warna null ("0000-00-00" bhi invalid)
const parseBookingDate = dateStr => {
    if (!dateStr || String(dateStr).startsWith('0000')) return null;
    const d = new Date(String(dateStr).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
};

// "September" -> us month ka last day (current year)
const parseShootMonth = monthStr => {
    const key = String(monthStr || '').trim().toLowerCase();
    if (key.length < 3) return null;
    const idx = MONTH_NAMES.findIndex(m => m.slice(0, 3) === key.slice(0, 3));
    if (idx < 0) return null;
    return new Date(new Date().getFullYear(), idx + 1, 0);
};

// booking_date na ho to shoot_month use hoga
const getEffectiveDate = item => {
    const d = parseBookingDate(item?.booking_date) || parseShootMonth(item?.shoot_month);
    if (!d) return null;
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

// card par dikhane wali date text
const getDisplayDate = item => {
    if (parseBookingDate(item?.booking_date)) return formatDate(item.booking_date);
    if (item?.shoot_month) return item.shoot_month;
    return '';
};

const getDiffDays = item => {
    const target = getEffectiveDate(item);
    if (!target) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

// sirf asli booking_date ka diff (shoot_month yahan use NAHI hoga)
const getBookingDiffDays = item => {
    const d = parseBookingDate(item?.booking_date);
    if (!d) return null;
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const getUrgencyBg = item => {
    const diff = getBookingDiffDays(item);
    if (diff === null || diff < 0) return null;
    if (diff <= 3) return '#fee2e2';   // 🔴 urgent (sirf asli booking_date)
    if (diff <= 6) return '#ffedd5';   // 🟠 upcoming (sirf asli booking_date)
    return null;
};

const getUrgencyRank = item => {
    const diff = getBookingDiffDays(item);

    // booking_date nahi hai
    if (diff === null) {
        return item?.shoot_month ? 3 : 4;   // month wale neeche, bina date wale sabse last
    }

    if (diff < 0) return 3;    // past date — red/orange ke neeche
    if (diff <= 3) return 0;   // 🔴 sabse upar
    if (diff <= 6) return 1;   // 🟠 uske baad
    return 2;                  // aage ki normal dates
};

const isDateOverdue = item => {
    const diff = getDiffDays(item);
    return diff !== null && diff < 0;
};

/* ===== helper: map API item -> card shape (Today tab ke liye) ===== */
const mapTodayItem = (it) => ({
    client_id: it.client_id,
    order_no: it.order_no,
    client_name: it.client_name,
    client_mobile: it.mobile_no,
    purpose: it.purpose,
    coordinator_name: it.coordinator_name,
    ...it,
});

const callNumber = mobile => {
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`);
};

const getShootStatusStyle = status => {
    switch ((status || '').toLowerCase()) {
        case 'completed':
        case 'done':                // 👈 NEW
            return { color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle' };
        case 'pending':
            return { color: '#F59E0B', bg: '#FEF3C7', icon: 'timer-sand-empty' };
        default:
            return { color: '#64748B', bg: '#F1F5F9', icon: 'help-circle-outline' };
    }
};


const TodayCard = memo(({ item, onOpen, onAssign }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpen(item)}
            style={{
                backgroundColor: '#fff', marginBottom: 7, borderRadius: 10, padding: 9,
                borderLeftWidth: 3, borderLeftColor: '#EF4444',
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: '#9aa0a6', fontFamily: Fonts.Regular, fontSize: 9, marginBottom: 1 }}>Client Name</Text>
                    <Text numberOfLines={1} style={{ color: '#172033', fontFamily: Fonts.Bold, fontSize: 13, textTransform: 'capitalize' }}>
                        {item.client_name || '-'}
                    </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#9aa0a6', fontFamily: Fonts.Regular, fontSize: 9 }}>Booking No.</Text>
                    <Text style={{ color: '#475569', fontFamily: Fonts.Bold, fontSize: 10 }}>
                        #{item.order_no || item.client_id || '-'}
                    </Text>
                    <TouchableOpacity onPress={() => callNumber(item.client_mobile)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Icon name="phone-outline" size={9} color="#94a3b8" />
                        <Text style={{ color: '#94a3b8', fontFamily: Fonts.Regular, fontSize: 9, marginLeft: 3 }}>
                            {item.client_mobile || '-'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 7, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#edf0f2' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#9aa0a6', fontFamily: Fonts.Regular, fontSize: 9 }}>Event Type</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Icon name="tag-outline" size={11} color="#64748b" />
                        <Text numberOfLines={1} style={{ color: '#475569', fontFamily: Fonts.Medium, fontSize: 10, marginLeft: 4, textTransform: 'capitalize' }}>
                            {item.purpose || '-'}
                        </Text>
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#9aa0a6', fontFamily: Fonts.Regular, fontSize: 9 }}>Coordinator</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Icon name="account-outline" size={11} color="#64748b" />
                        <Text numberOfLines={1} style={{ flex: 1, color: '#475569', fontFamily: Fonts.Regular, fontSize: 10, marginLeft: 4, textTransform: 'capitalize' }}>
                            {item.coordinator_name || '-'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onAssign(item)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.buttonbgcolor + '15', borderRadius: 8, paddingHorizontal: 10, height: 28 }}
                >
                    <Text style={{ color: Colors.buttonbgcolor, fontFamily: Fonts.Bold, fontSize: 10 }}>Assign</Text>
                    <Icon name="account-plus-outline" size={13} color={Colors.buttonbgcolor} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});
/* =========================================================
   PIPELINE CARD
========================================================= */

const PipelineCard = memo(({ item, navigation, showUrgency }) => {
    const stage =
        item.stage_name ||
        item.current_stage ||
        'Pending';

    const stageColor =
        getStageColor(stage);
    const urgencyBg = showUrgency ? getUrgencyBg(item) : null;
    const overdue = isDateOverdue(item);

    const openDetail = () => {
        navigation.navigate('NewCoordination', {
            bookingData: item,
        });
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={openDetail}
            style={{
                backgroundColor: urgencyBg || '#fff',
                marginBottom: 7,
                borderRadius: 10,
                padding: 9,
                borderLeftWidth: 3,
                borderLeftColor: stageColor,
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 1,
                },
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
                <View
                    style={{
                        flex: 1,
                        marginRight: 8,
                    }}
                >
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
                            textTransform: 'capitalize'
                        }}
                    >
                        {item.client_name || '-'}
                    </Text>
                </View>

                <View
                    style={{
                        alignItems: 'flex-end',
                    }}
                >
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
                        #
                        {item.order_no ||
                            item.client_id ||
                            '-'}
                    </Text>

                    {getDisplayDate(item) !== '' && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 2,
                            }}
                        >
                            <Icon name="calendar-outline" size={9} color="#94a3b8" />
                            <Text
                                style={{
                                    color: '#94a3b8',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    marginLeft: 4,
                                }}
                            >
                                {getDisplayDate(item)}
                            </Text>
                        </View>
                    )}
                    {overdue && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#FEE2E2',
                                borderRadius: 8,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                marginTop: 3,
                            }}
                        >
                            <Icon name="alert-circle-outline" size={10} color="#DC2626" />
                            <Text
                                style={{
                                    color: '#DC2626',
                                    fontFamily: Fonts.Bold,
                                    fontSize: 8.5,
                                    marginLeft: 3,
                                }}
                            >
                                Overdue
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* STAGE */}
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
                        backgroundColor:
                            `${stageColor}12`,
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
                            backgroundColor:
                                stageColor,
                            marginRight: 4,
                        }}
                    />

                    <Text
                        style={{
                            color: stageColor,
                            fontFamily: Fonts.Bold,
                            fontSize: 9,
                        }}
                    >
                        {stage}
                    </Text>
                </View>

                {typeof item.stage_percent === 'number' && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: 6,
                            flex: 1,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                height: 5,
                                borderRadius: 3,
                                backgroundColor: '#eef0f2',
                                overflow: 'hidden',
                            }}
                        >
                            <View
                                style={{
                                    width: `${Math.min(Math.max(item.stage_percent, 0), 100)}%`,
                                    height: '100%',
                                    borderRadius: 3,
                                    backgroundColor: stageColor,
                                }}
                            />
                        </View>

                        {/* 👇 percentage + stage_progress dono, right side */}
                        <View
                            style={{
                                marginLeft: 6,
                                alignItems: 'flex-end',
                            }}
                        >
                            <Text
                                style={{
                                    color: stageColor,
                                    fontFamily: Fonts.Bold,
                                    fontSize: 8.5,
                                }}
                            >
                                {item.stage_percent}%
                            </Text>

                            <Text
                                style={{
                                    color: '#9aa0a6',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 7.5,
                                    marginTop: 1,
                                }}
                                numberOfLines={1}
                            >
                                {item.stage_progress}
                            </Text>
                        </View>
                    </View>
                )}
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
                <View
                    style={{
                        flex: 1,
                    }}
                >
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
                                textTransform: 'capitalize'
                            }}
                        >
                            {item.purpose || '-'}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        flex: 1,
                    }}
                >
                    <Text
                        style={{
                            color: '#9aa0a6',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                        }}
                    >
                        Photographer
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 2,
                        }}
                    >
                        <Icon
                            name="camera-outline"
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
                                textTransform: 'capitalize'
                            }}
                        >
                            {item.photographer_name ||
                                'Not Assigned'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={openDetail}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: Colors.buttonbgcolor + '15',   // 👈 light background
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
                        Manage
                    </Text>

                    <Icon
                        name="arrow-right"
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
   COMPLETED CARD
========================================================= */

const CompletedCard = memo(({ item, navigation }) => {
    console.log("item", item);
    const openDetail = () => {
        navigation.navigate('NewCoordination', {
            bookingData: item,
        });
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={openDetail}
            style={{
                backgroundColor: '#fff',
                marginBottom: 7,
                borderRadius: 10,
                padding: 9,
                borderLeftWidth: 3,
                borderLeftColor: '#16A34A',
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 1,
                },
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
                <View
                    style={{
                        flex: 1,
                        marginRight: 8,
                    }}
                >
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
                            textTransform: 'capitalize'
                        }}
                    >
                        {item.client_name || '-'}
                    </Text>
                </View>

                <View
                    style={{
                        alignItems: 'flex-end',
                    }}
                >
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
                        #
                        {item.order_no ||
                            item.client_id ||
                            '-'}
                    </Text>

                    {getDisplayDate(item) !== '' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Icon name="calendar-outline" size={9} color="#94a3b8" />
                            <Text
                                style={{
                                    color: '#94a3b8',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    marginLeft: 3,
                                }}
                            >
                                {getDisplayDate(item)}
                            </Text>
                        </View>
                    )}
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
                        backgroundColor: '#e3f6ea',
                        borderRadius: 12,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        marginLeft: 5,
                    }}
                >
                    <Icon
                        name="check-circle"
                        size={10}
                        color="#16A34A"
                    />

                    <Text
                        style={{
                            color: '#16A34A',
                            fontFamily: Fonts.Bold,
                            fontSize: 9,
                            marginLeft: 3,
                        }}
                    >
                        Completed
                    </Text>
                </View>
                {(() => {
                    const s = getShootStatusStyle(item.shoot_status);
                    return (
                        <>
                            <Text
                                style={{
                                    color: '#9aa0a6',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    marginLeft: 10,
                                }}
                            >
                                Shoot:
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: s.bg,
                                    borderRadius: 12,
                                    paddingHorizontal: 7,
                                    paddingVertical: 2,
                                    marginLeft: 5,
                                }}
                            >
                                <Icon name={s.icon} size={10} color={s.color} />
                                <Text
                                    style={{
                                        color: s.color,
                                        fontFamily: Fonts.Bold,
                                        fontSize: 9,
                                        marginLeft: 3,
                                    }}
                                >
                                    {item.shoot_status || '--'}
                                </Text>
                            </View>
                        </>
                    );
                })()}
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
                <View
                    style={{
                        flex: 1,
                    }}
                >
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
                            }}
                        >
                            {item.purpose || '-'}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        flex: 1,
                    }}
                >
                    <Text
                        style={{
                            color: '#9aa0a6',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                        }}
                    >
                        Photographer
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 2,
                        }}
                    >
                        <Icon
                            name="camera-outline"
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
                                textTransform: 'capitalize'
                            }}
                        >
                            {item.photographer_name ||
                                'Not Assigned'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={openDetail}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: Colors.buttonbgcolor + '15',   // 👈 light background
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
                        Detail
                    </Text>

                    <Icon
                        name="chevron-right"
                        size={14}
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

const EmptyBox = memo(({ completed }) => (
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
                backgroundColor: completed
                    ? '#f8fafc'
                    : '#f0fdf4',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
            }}
        >
            <Icon
                name={
                    completed
                        ? 'inbox-outline'
                        : 'check-circle-outline'
                }
                size={34}
                color={
                    completed
                        ? '#94a3b8'
                        : '#16A34A'
                }
            />
        </View>

        <Text
            style={{
                fontSize: 14,
                fontFamily: Fonts.Bold,
                color: '#1e293b',
            }}
        >
            {completed
                ? 'No completed coordinations yet.'
                : 'No pending coordinations!'}
        </Text>

        {!completed && (
            <Text
                style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginTop: 4,
                }}
            >
                All bookings are completed.
            </Text>
        )}
    </View>
));

/* =========================================================
   FILTER MODAL
========================================================= */

const FilterModal = ({
    visible,
    title,
    data,
    selectedValue,
    onSelect,
    onClose,
    icon,
}) => {
    const [searchText, setSearchText] = useState('');

    // Modal band hone par search reset ho jaye
    useEffect(() => {
        if (!visible) setSearchText('');
    }, [visible]);

    const filteredData = useMemo(() => {
        if (!searchText.trim()) return data;
        return data.filter(item =>
            String(item.label || '')
                .toLowerCase()
                .includes(searchText.trim().toLowerCase())
        );
    }, [data, searchText]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                onPress={onClose}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    justifyContent: 'center',   // 👈 bottom se center
                    alignItems: 'center',
                    paddingHorizontal: 20,
                }}
            >
                <Pressable
                    onPress={e => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        backgroundColor: '#fff',
                        borderRadius: 16,          // 👈 sab corners rounded
                        maxHeight: '70%',
                        overflow: 'hidden',
                    }}
                >
                    {/* HEADER */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 18,
                            paddingTop: 16,
                            paddingBottom: 12,
                            borderBottomWidth: 0.5,
                            borderBottomColor: '#eee',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name={icon} size={20} color={Colors.buttonbgcolor} />
                            <Text
                                style={{
                                    marginLeft: 8,
                                    fontFamily: Fonts.Bold,
                                    fontSize: 15,
                                    color: '#172033',
                                }}
                            >
                                {title}
                            </Text>
                        </View>

                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={23} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* SEARCH BAR — NEW */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginHorizontal: 14,
                            marginTop: 10,
                            marginBottom: 6,
                            backgroundColor: '#f5f6f8',
                            borderRadius: 10,
                            height: 40,
                            paddingHorizontal: 10,
                            borderWidth: 0.5,
                            borderColor: '#e8e5f5',
                        }}
                    >
                        <Icon name="magnify" size={18} color="#7367f0" />
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder={`Search ${title.replace('Select ', '')}...`}
                            placeholderTextColor="#999"
                            style={{
                                flex: 1,
                                marginLeft: 6,
                                paddingVertical: 0,
                                fontFamily: Fonts.Regular,
                                fontSize: 12,
                                color: '#172033',
                            }}
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')}>
                                <Icon name="close-circle" size={16} color="#94a3b8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={filteredData}
                        keyExtractor={item => String(item.value)}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                <Text
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        fontSize: 12,
                                        color: '#94a3b8',
                                    }}
                                >
                                    No results found
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const selected = selectedValue === item.value;

                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => onSelect(item)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 18,
                                        paddingVertical: 13,
                                        borderBottomWidth: 0.5,
                                        borderBottomColor: '#f1f5f9',
                                        backgroundColor: selected ? '#f5f3ff' : '#fff',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: selected ? '#ede9fe' : '#f8fafc',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Icon
                                            name={item.icon || icon}
                                            size={17}
                                            color={selected ? Colors.buttonbgcolor : '#64748b'}
                                        />
                                    </View>

                                    <Text
                                        style={{
                                            flex: 1,
                                            marginLeft: 10,
                                            fontFamily: selected ? Fonts.Bold : Fonts.Regular,
                                            fontSize: 13,
                                            color: selected ? Colors.buttonbgcolor : '#334155',
                                        }}
                                    >
                                        {item.label}
                                    </Text>

                                    {selected && (
                                        <Icon name="check-circle" size={20} color={Colors.buttonbgcolor} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
};

/* =========================================================
   DASHBOARD HEADER
   IMPORTANT:
   Separate memo component so TextInput doesn't remount
   when search value changes.
========================================================= */

const DashboardHeader = memo(({
    stats,
    todayCount,         // 🔧
    tomorrowCount,       // 🔧
    upcomingCount,
    search,
    setSearch,
    selectedStage,
    selectedCoordinator,
    selectedPhotographer,
    isAdmin,
    activeTab,
    setStageModal,
    setCoordinatorModal,
    setPhotographerModal,
    setActiveTab,
}) => {
    return (
        <View>
            {/* =================================================
                STATS
            ================================================= */}
            {/* ================= COUNTING / STATS ================= */}
            <View style={{ marginBottom: 5 }}>
                {/* Row 1 */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    {/* TOTAL BOOKINGS */}
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
                                backgroundColor: '#0284C7',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="calendar-multiple" size={20} color="#fff" />
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                                {stats.total}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                Total Bookings
                            </Text>
                        </View>
                    </View>

                    {/* TODAY'S SHOOTS */}
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
                                backgroundColor: '#DC2626',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="calendar-today" size={20} color="#fff" />
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>
                                {stats.today}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                Today's Shoots
                            </Text>
                        </View>
                    </View>
                </View>


                {/* Row 3 — NEW */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    {/* NEXT 3 DAYS */}
                    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="calendar-range" size={20} color="#fff" />
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>{stats.next_3_days}</Text>
                            <Text numberOfLines={1} style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}>Next 3 Days</Text>
                        </View>
                    </View>

                    {/* NEXT 6 DAYS */}
                    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="calendar-range-outline" size={20} color="#fff" />
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 24, color: '#111827' }}>{stats.next_6_days}</Text>
                            <Text numberOfLines={1} style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}>Next 6 Days</Text>
                        </View>
                    </View>
                </View>


                {/* Row 2 */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* IN PIPELINE */}
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
                                {stats.pipeline}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                In Pipeline
                            </Text>
                        </View>
                    </View>

                    {/* COMPLETED */}
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
                                {stats.completed}
                            </Text>
                            <Text
                                numberOfLines={1}
                                style={{ fontFamily: Fonts.Regular, fontSize: 11, color: '#6B7280', marginTop: 2 }}
                            >
                                Completed
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* =================================================
                SEARCH
            ================================================= */}

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
                }}
            >
                <Icon
                    name="magnify"
                    size={20}
                    color="#7367f0"
                />

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search booking, client, mobile, coordinator..."
                    placeholderTextColor="#999"
                    style={{
                        flex: 1,
                        marginLeft: 8,
                        paddingVertical: 0,
                        fontFamily:
                            Fonts.Regular,
                        fontSize: 12,
                        color: '#172033',
                    }}
                    returnKeyType="search"
                    blurOnSubmit={false}
                />

                {search.length > 0 && (
                    <TouchableOpacity
                        onPress={() =>
                            setSearch('')
                        }
                    >
                        <Icon
                            name="close-circle"
                            size={18}
                            color="#94a3b8"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* =================================================
                FILTERS
            ================================================= */}

            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 5,
                    gap: 7,
                }}
            >
                {/* =================================================
                    STAGE
                    ONLY ACTIVE TAB
                ================================================= */}

                {(activeTab === 'active' || activeTab === 'today') && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                            setStageModal(true)
                        }
                        style={{
                            flex: 1,
                            height: 42,
                            backgroundColor:
                                '#fff',
                            borderRadius: 12,
                            borderWidth: 0.5,
                            borderColor:
                                '#e8e5f5',
                            flexDirection:
                                'row',
                            alignItems:
                                'center',
                            paddingHorizontal: 9,
                        }}
                    >
                        <Icon
                            name="filter-variant"
                            size={16}
                            color={
                                Colors.buttonbgcolor
                            }
                        />

                        <Text
                            numberOfLines={
                                1
                            }
                            style={{
                                flex: 1,
                                marginLeft: 5,
                                fontFamily:
                                    Fonts.Medium,
                                fontSize: 10,
                                color: '#334155',
                            }}
                        >
                            {selectedStage ===
                                'All'
                                ? 'All Stages'
                                : selectedStage}
                        </Text>

                        <Icon
                            name="chevron-down"
                            size={17}
                            color="#64748b"
                        />
                    </TouchableOpacity>
                )}

                {/* =================================================
                    COORDINATOR
                    ONLY ADMIN
                ================================================= */}

                {isAdmin && (
                    <TouchableOpacity
                        activeOpacity={
                            0.8
                        }
                        onPress={() =>
                            setCoordinatorModal(
                                true
                            )
                        }
                        style={{
                            flex: 1,
                            height: 42,
                            backgroundColor:
                                '#fff',
                            borderRadius: 12,
                            borderWidth:
                                0.5,
                            borderColor:
                                '#e8e5f5',
                            flexDirection:
                                'row',
                            alignItems:
                                'center',
                            paddingHorizontal: 9,
                        }}
                    >
                        <Icon
                            name="account-group-outline"
                            size={16}
                            color={
                                Colors.buttonbgcolor
                            }
                        />

                        <Text
                            numberOfLines={
                                1
                            }
                            style={{
                                flex: 1,
                                marginLeft: 5,
                                fontFamily:
                                    Fonts.Medium,
                                fontSize: 10,
                                color: '#334155',
                            }}
                        >
                            {
                                selectedCoordinator.label
                            }
                        </Text>

                        <Icon
                            name="chevron-down"
                            size={17}
                            color="#64748b"
                        />
                    </TouchableOpacity>
                )}

                {/* =================================================
                    PHOTOGRAPHER
                ================================================= */}

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                        setPhotographerModal(
                            true
                        )
                    }
                    style={{
                        flex: 1,
                        height: 42,
                        backgroundColor:
                            '#fff',
                        borderRadius: 12,
                        borderWidth: 0.5,
                        borderColor:
                            '#e8e5f5',
                        flexDirection:
                            'row',
                        alignItems:
                            'center',
                        paddingHorizontal: 9,
                    }}
                >
                    <Icon
                        name="camera-outline"
                        size={16}
                        color={
                            Colors.buttonbgcolor
                        }
                    />

                    <Text
                        numberOfLines={
                            1
                        }
                        style={{
                            flex: 1,
                            marginLeft: 5,
                            fontFamily:
                                Fonts.Medium,
                            fontSize: 10,
                            color: '#334155',
                        }}
                    >
                        {
                            selectedPhotographer.label
                        }
                    </Text>

                    <Icon
                        name="chevron-down"
                        size={17}
                        color="#64748b"
                    />
                </TouchableOpacity>
            </View>


            {/* =================================================
                TABS
            ================================================= */}

            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 4,
                    marginTop: 5,
                    marginBottom: 14,
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 1 },
                }}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexDirection: 'row' }}
                >
                    {/* ACTIVE TAB */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('active')}
                        style={{
                            minWidth: 105,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 9,
                            backgroundColor: activeTab === 'active' ? Colors.buttonbgcolor : 'transparent',
                        }}
                    >
                        <Icon name="progress-clock" size={14} color={activeTab === 'active' ? '#fff' : '#64748b'} />

                        <Text
                            numberOfLines={1}
                            style={{
                                fontSize: 10.5,
                                fontFamily: Fonts.Bold,
                                color: activeTab === 'active' ? '#fff' : '#64748b',
                                marginLeft: 4,
                            }}
                        >
                            Active Pipeline
                        </Text>

                        <View
                            style={{
                                backgroundColor: activeTab === 'active' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                borderRadius: 20,
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                marginLeft: 4,
                                minWidth: 16,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'active' ? '#fff' : '#64748b' }}>
                                {stats.pipeline}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('today')}
                        style={{
                            minWidth: 105,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 9,
                            backgroundColor: activeTab === 'today' ? Colors.buttonbgcolor : 'transparent',
                        }}
                    >
                        <Icon name="calendar-today" size={14} color={activeTab === 'today' ? '#fff' : '#64748b'} />

                        <Text
                            numberOfLines={1}
                            style={{
                                fontSize: 10.5,
                                fontFamily: Fonts.Bold,
                                color: activeTab === 'today' ? '#fff' : '#64748b',
                                marginLeft: 4,
                            }}
                        >
                            Today
                        </Text>

                        <View
                            style={{
                                backgroundColor: activeTab === 'today' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                borderRadius: 20,
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                marginLeft: 4,
                                minWidth: 16,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'today' ? '#fff' : '#64748b' }}>
                                {todayCount}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* TOMORROW TAB — NEW */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('tomorrow')}
                        style={{ minWidth: 105, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 9, backgroundColor: activeTab === 'tomorrow' ? Colors.buttonbgcolor : 'transparent' }}
                    >
                        <Icon name="calendar-arrow-right" size={14} color={activeTab === 'tomorrow' ? '#fff' : '#64748b'} />
                        <Text numberOfLines={1} style={{ fontSize: 10.5, fontFamily: Fonts.Bold, color: activeTab === 'tomorrow' ? '#fff' : '#64748b', marginLeft: 4 }}>Tomorrow</Text>
                        <View style={{ backgroundColor: activeTab === 'tomorrow' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', borderRadius: 20, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4, minWidth: 16, alignItems: 'center' }}>
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'tomorrow' ? '#fff' : '#64748b' }}>{tomorrowCount}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* UPCOMING TAB — NEW */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('upcoming')}
                        style={{ minWidth: 105, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 9, backgroundColor: activeTab === 'upcoming' ? Colors.buttonbgcolor : 'transparent' }}
                    >
                        <Icon name="calendar-clock-outline" size={14} color={activeTab === 'upcoming' ? '#fff' : '#64748b'} />
                        <Text numberOfLines={1} style={{ fontSize: 10.5, fontFamily: Fonts.Bold, color: activeTab === 'upcoming' ? '#fff' : '#64748b', marginLeft: 4 }}>Upcoming</Text>
                        <View style={{ backgroundColor: activeTab === 'upcoming' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', borderRadius: 20, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4, minWidth: 16, alignItems: 'center' }}>
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'upcoming' ? '#fff' : '#64748b' }}>{upcomingCount}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* COMPLETED TAB */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('completed')}
                        style={{
                            minWidth: 105,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 9,
                            backgroundColor: activeTab === 'completed' ? Colors.buttonbgcolor : 'transparent',
                        }}
                    >
                        <Icon name="check-circle" size={14} color={activeTab === 'completed' ? '#fff' : '#64748b'} />

                        <Text
                            numberOfLines={1}
                            style={{
                                fontSize: 10.5,
                                fontFamily: Fonts.Bold,
                                color: activeTab === 'completed' ? '#fff' : '#64748b',
                                marginLeft: 4,
                            }}
                        >
                            Completed
                        </Text>

                        <View
                            style={{
                                backgroundColor: activeTab === 'completed' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                borderRadius: 20,
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                marginLeft: 4,
                                minWidth: 16,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 9, fontFamily: Fonts.Bold, color: activeTab === 'completed' ? '#fff' : '#64748b' }}>
                                {stats.completed}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* TODAY TAB */}
                </ScrollView>
            </View>
        </View>
    );
});

/* =========================================================
   MAIN COMPONENT
========================================================= */

const CoordinatorDashboard = ({ hideBack: hideBackProp = false }) => {
    const navigation = useNavigation();
    const route = useRoute();   // useRoute import karna na bhoolna

    const hideBack = hideBackProp === true || route?.params?.hideBack === true;

    /* =====================================================
       STATES
    ===================================================== */

    const [activeTab, setActiveTab] =
        useState('active');

    const [items, setItems] =
        useState([]);

    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        next_3_days: 0,   // 🆕
        next_6_days: 0,   // 🆕
        pipeline: 0,
        completed: 0,
    });

    const [loading, setLoading] =
        useState(false);

    const [refreshing, setRefreshing] =
        useState(false);

    const [search, setSearch] =
        useState('');

    const searchTimer =
        useRef(null);



    const [userType, setUserType] =
        useState('');
    const [userName, setUserName] = useState('');
    const [userInfoLoading, setUserInfoLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const visibleData = items.slice(0, page * PAGE_SIZE);

    /* =====================================================
       FILTERS
    ===================================================== */

    const [selectedStage, setSelectedStage] =
        useState('All');

    const [selectedCoordinator, setSelectedCoordinator] =
        useState({
            label: 'All Coordinators',
            value: 0,
        });

    const [selectedPhotographer, setSelectedPhotographer] =
        useState({
            label: 'All Photographers',
            value: 0,
        });

    const [notificationCount, setNotificationCount] = useState(0);
    const [notificationModal, setNotificationModal] = useState(false);
    const [notifAnchor, setNotifAnchor] = useState({ top: 60, right: 12 });   // ⬅ NEW
    const bellRef = useRef(null);   // ⬅ NEW

    const [todayUnassignedCount, setTodayUnassignedCount] = useState(0);

    const [todayCount, setTodayCount] = useState(0);       // 🆕
    const [tomorrowCount, setTomorrowCount] = useState(0);  // 🆕
    const [upcomingCount, setUpcomingCount] = useState(0);  // 🆕


    /* =====================================================
       MODALS
    ===================================================== */

    const [stageModal, setStageModal] =
        useState(false);

    const [coordinatorModal, setCoordinatorModal] =
        useState(false);

    const [photographerModal, setPhotographerModal] =
        useState(false);

    /* =====================================================
       USERS
    ===================================================== */

    const [coordinators, setCoordinators] =
        useState([]);

    const [photographers, setPhotographers] =
        useState([]);

    const [userLoading, setUserLoading] =
        useState(false);

    /* =====================================================
       ADMIN
    ===================================================== */

    const [isAdmin, setIsAdmin] =
        useState(false);

    const [loggedInUserId, setLoggedInUserId] =   // ⬅ NEW
        useState(0);
    const [exitModal, setExitModal] = useState(false);


    /* =====================================================
HARDWARE BACK — CONFIRM EXIT (only jab ye home screen hai)
===================================================== */

    useFocusEffect(
        useCallback(() => {
            if (!hideBack) return;   // Admin ke liye normal back rahega

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

    /* =====================================================
       REQUEST CONTROL
    ===================================================== */

    const requestIdRef =
        useRef(0);

    /* =====================================================
       CHECK ADMIN
    ===================================================== */

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const userId = await AsyncStorage.getItem('id');

                setLoggedInUserId(Number(userId) || 0);   // ⬅ NEW — id ko state me save kar diya

                const res = await fetch(API.list_usertype, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: userId,
                    }),
                });

                const result = await res.json();

                if (result.code == 200 && result.payload.length > 0) {
                    const type = String(
                        result.payload[0].user_type || ''
                    ).trim();

                    setIsAdmin(type === 'Admin');
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                setIsAdmin(false);
            }
        };

        checkAdmin();
    }, []);



    /* =====================================================
       FETCH USERS
    ===================================================== */

    useEffect(() => {
        const fetchUsers = async () => {
            setUserLoading(true);

            try {
                const photographerRequest =
                    fetch(
                        API.list_user_typewise,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':
                                    'application/json',
                            },
                            body: JSON.stringify({
                                type: 'photographer',
                            }),
                        }
                    );

                const requests = [
                    photographerRequest,
                ];

                if (isAdmin) {
                    requests.push(
                        fetch(
                            API.list_user_typewise,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type':
                                        'application/json',
                                },
                                body: JSON.stringify({
                                    type: 'coordinator',
                                }),
                            }
                        )
                    );
                }

                const responses =
                    await Promise.all(
                        requests
                    );

                const photographerJson =
                    await responses[0].json();

                if (
                    photographerJson?.code == 200
                ) {
                    setPhotographers(
                        (
                            photographerJson.payload ||
                            []
                        ).map(u => ({
                            label:
                                u.user_name,
                            value: Number(
                                u.id
                            ),
                        }))
                    );
                }

                if (
                    isAdmin &&
                    responses[1]
                ) {
                    const coordinatorJson =
                        await responses[1].json();

                    if (
                        coordinatorJson?.code ==
                        200
                    ) {
                        setCoordinators(
                            (
                                coordinatorJson.payload ||
                                []
                            ).map(u => ({
                                label:
                                    u.user_name,
                                value: Number(
                                    u.id
                                ),
                            }))
                        );
                    }
                }
            } catch (error) {
                console.log(
                    'User list error:',
                    error
                );
            } finally {
                setUserLoading(false);
            }
        };

        fetchUsers();
    }, [isAdmin]);

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
            fetchUserType().catch(error => {
                console.log('Fetch user type error:', error);
            });
        }, [fetchUserType])
    );

    /* =====================================================
       RESET STAGE WHEN COMPLETED TAB
    ===================================================== */

    useEffect(() => {
        if (activeTab !== 'active') {
            setSelectedStage('All');
            setStageModal(false);
        }
    }, [activeTab]);

    /* =====================================================
       FETCH DASHBOARD
    ===================================================== */

    const fetchDashboard = useCallback(
        async (searchValue = search) => {
            const requestId = ++requestIdRef.current;
            setLoading(true);

            const payload = {
                search: searchValue?.trim() || '',
                stage: activeTab === 'completed' ? 'All' : (selectedStage && selectedStage !== '') ? selectedStage : 'All',
                coordinator_id: isAdmin ? Number(selectedCoordinator?.value || 0) : loggedInUserId,
                photographer_id: Number(selectedPhotographer?.value || 0),
                status: activeTab === 'completed' ? 'completed' : 'active',
            };

            console.log("payload", payload);

            try {
                const response = await fetch(API.coordinator_wise_list, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                });

                const json = await response.json();
                if (requestId !== requestIdRef.current) return;

                if (json?.status === true) {
                    const apiStats = json.stats || {};
                    setStats({
                        total: Number(apiStats.total) || 0,
                        today: Number(apiStats.today) || 0,
                        next_3_days: Number(apiStats.next_3_days) || 0,   // 🆕
                        next_6_days: Number(apiStats.next_6_days) || 0,   // 🆕
                        pipeline: Number(apiStats.pipeline) || 0,
                        completed: Number(apiStats.completed) || 0,
                    });

                    setTodayCount(Number(json?.today_shoots?.count) || 0);       // 🆕
                    setTomorrowCount(Number(json?.tomorrow_shoots?.count) || 0);  // 🆕
                    setUpcomingCount(Number(json?.upcoming_shoots?.count) || 0);  // 🆕
                    setTodayUnassignedCount(
                        Number(json?.today_shoots_unassigned?.count) || 0
                    );

                    let newItems = [];
                    if (activeTab === 'today') {
                        newItems = (json?.today_shoots?.items || []).map(mapTodayItem);       // 🔧 key badla: today_shoots_unassigned → today_shoots
                    } else if (activeTab === 'tomorrow') {
                        newItems = (json?.tomorrow_shoots?.items || []).map(mapTodayItem);    // 🆕
                    } else if (activeTab === 'upcoming') {
                        newItems = json?.upcoming_shoots?.items || [];   // 🆕
                    } else {
                        newItems = json?.payload?.items || [];
                        if (activeTab === 'active') {
                            newItems = [...newItems].sort(
                                (a, b) => getUrgencyRank(a) - getUrgencyRank(b)
                            ); // 👈 NAYA — Pipeline tab ke liye bhi
                        }
                    }

                    setItems(newItems);
                } else {
                    setItems([]);
                }
            } catch (error) {
                console.log('Coordinator dashboard error:', error);
                setItems([]);
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [search, selectedStage, selectedCoordinator, selectedPhotographer, activeTab, isAdmin, loggedInUserId]
    );


    /* =====================================================
   FETCH NOTIFICATION COUNT (bell badge)
===================================================== */

    useEffect(() => {
        const fetchNotificationCount = async () => {
            if (!loggedInUserId) return;
            try {
                const res = await fetch(API.today_shoot_list, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        coordinator_id: loggedInUserId,
                    }),
                });
                const json = await res.json();
                if (json?.status === true) {
                    setNotificationCount(Number(json?.payload?.count) || 0);
                    // ya agar sirf unassigned wale count karne hain to:
                    // setNotificationCount(Number(json?.stats?.unassigned) || 0);
                }
            } catch (error) {
                console.log('Notification count error:', error);
            }
        };

        fetchNotificationCount();
    }, [loggedInUserId]);

    /* =====================================================
       INITIAL + FILTER FETCH
    ===================================================== */

    useEffect(() => {
        setPage(1);
        fetchDashboard(search);
    }, [activeTab, selectedStage, selectedCoordinator, selectedPhotographer, isAdmin, loggedInUserId]);

    /* =====================================================
       SEARCH DEBOUNCE
    ===================================================== */

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchDashboard(search);
        }, 400);
        return () => searchTimer.current && clearTimeout(searchTimer.current);
    }, [search, fetchDashboard]);

    /* =====================================================
       REFRESH
    ===================================================== */

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        fetchDashboard(search);
    }, [fetchDashboard, search]);

    const handleLoadMore = useCallback(() => {
        if (loadingMore) return;
        if (visibleData.length >= items.length) return;

        setLoadingMore(true);
        setTimeout(() => {
            setPage(prev => prev + 1);
            setLoadingMore(false);
        }, 400);
    }, [loadingMore, visibleData.length, items.length]);

    /* =====================================================
       SELECT HANDLERS
    ===================================================== */

    const selectStage = item => {
        console.log(
            'Selected Stage:',
            item
        );

        setSelectedStage(
            item?.value || 'All'
        );

        setStageModal(false);
    };

    const selectCoordinator = item => {
        console.log(
            'Selected Coordinator:',
            item
        );

        setSelectedCoordinator({
            label:
                item?.label ||
                'All Coordinators',
            value: Number(
                item?.value || 0
            ),
        });

        setCoordinatorModal(false);
    };

    const selectPhotographer = item => {
        console.log(
            'Selected Photographer:',
            item
        );

        setSelectedPhotographer({
            label:
                item?.label ||
                'All Photographers',
            value: Number(
                item?.value || 0
            ),
        });

        setPhotographerModal(false);
    };

    /* =====================================================
       FILTER DATA
    ===================================================== */

    const stageData = useMemo(
        () => [
            {
                label: 'All Stages',
                value: 'All',
                icon: 'view-list-outline',
            },

            ...STAGES.map(stage => ({
                label: stage.label,
                value: stage.label,
                icon: stage.icon,
            })),
        ],
        []
    );

    const coordinatorData = useMemo(
        () => [
            {
                label: 'All Coordinators',
                value: 0,
                icon: 'account-group-outline',
            },

            ...coordinators,
        ],
        [coordinators]
    );

    const photographerData =
        useMemo(
            () => [
                {
                    label:
                        'All Photographers',
                    value: 0,
                    icon: 'camera-outline',
                },

                ...photographers,
            ],
            [photographers]
        );

    /* =====================================================
       RENDER ITEM
    ===================================================== */

    const renderItem = useCallback(
        ({ item }) => {
            if (activeTab === 'active') {
                return <PipelineCard item={item} navigation={navigation} showUrgency={true} />;
            }
            if (activeTab === 'today' || activeTab === 'tomorrow') {    // 🔧
                return (
                    <TodayCard
                        item={item}
                        onOpen={(it) => navigation.navigate('NewCoordination', { bookingData: it })}
                        onAssign={(it) => navigation.navigate('NewCoordination', { bookingData: it })}
                    />
                );
            }
            if (activeTab === 'upcoming') {
                return <PipelineCard item={item} navigation={navigation} showUrgency={false} />;   // 🔧
            }
            return <CompletedCard item={item} navigation={navigation} />;
        },
        [activeTab, navigation]
    );

    /* =====================================================
       KEY
    ===================================================== */

    const keyExtractor =
        useCallback(
            (item, index) =>
                String(
                    item.client_id ||
                    item.order_no ||
                    index
                ),
            []
        );

    /* =====================================================
       EMPTY
    ===================================================== */

    const renderEmpty =
        useCallback(() => {
            if (loading) {
                return (
                    <View
                        style={{
                            backgroundColor:
                                '#fff',
                            borderRadius: 14,
                            paddingVertical: 45,
                            alignItems:
                                'center',
                        }}
                    >
                        <ActivityIndicator
                            size="small"
                            color={
                                Colors.buttonbgcolor
                            }
                        />

                        <Text
                            style={{
                                marginTop: 10,
                                fontFamily:
                                    Fonts.Regular,
                                fontSize: 12,
                                color: '#94a3b8',
                            }}
                        >
                            Loading coordinations...
                        </Text>
                    </View>
                );
            }

            return (
                <EmptyBox
                    completed={
                        activeTab ===
                        'completed'
                    }
                />
            );
        }, [
            loading,
            activeTab,
        ]);

    /* =====================================================
       FOOTER
    ===================================================== */

    const renderFooter = useCallback(() => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
            </View>
        );
    }, [loadingMore]);

    /* =====================================================
       MAIN RENDER
    ===================================================== */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor:
                    '#f5f6f8',
            }}
        >
            <StatusBar
                backgroundColor={
                    Colors.buttonbgcolor
                }
                barStyle="light-content"
            />

            {/* =================================================
                HEADER
            ================================================= */}

            {/* ── HEADER ── */}
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
                {/* Left side – back or menu */}
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
                        <Icon name="arrow-left" size={24} color="#fff" />
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
                        <Icon name="menu" size={26} color="#fff" />
                    </TouchableOpacity>
                )}

                {/* Title – centered */}
                <Text
                    style={{
                        color: '#fff',
                        fontSize: 16,
                        fontFamily: Fonts.Bold,
                        flex: 1,
                        textAlign: 'center',
                    }}
                >
                    Dashboard
                </Text>


                {/* Right side – notification bell with badge */}
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
                    style={{
                        width: 28,
                        height: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon name="bell-outline" size={22} color="#fff" />

                    {/* Badge – only if count > 0 */}
                    {notificationCount > 0 && (
                        <View
                            style={{
                                position: 'absolute',
                                top: -2,
                                right: -4,
                                minWidth: 16,
                                height: 16,
                                borderRadius: 8,
                                backgroundColor: '#EF4444',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: 4,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 8,
                                    fontFamily: Fonts.Bold,
                                    color: '#fff',
                                    lineHeight: 12,
                                }}
                            >
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

            {/* =================================================
                LIST
            ================================================= */}

            <FlatList
                data={visibleData}
                keyExtractor={
                    keyExtractor
                }
                renderItem={
                    renderItem
                }

                /*
                 * IMPORTANT:
                 * Stable memo component.
                 * Search typing will NOT remount TextInput.
                 */
                ListHeaderComponent={
                    <DashboardHeader
                        stats={stats}
                        search={search}
                        setSearch={setSearch}
                        selectedStage={
                            selectedStage
                        }
                        selectedCoordinator={
                            selectedCoordinator
                        }
                        selectedPhotographer={
                            selectedPhotographer
                        }
                        isAdmin={isAdmin}
                        activeTab={
                            activeTab
                        }
                        setStageModal={
                            setStageModal
                        }
                        setCoordinatorModal={
                            setCoordinatorModal
                        }
                        setPhotographerModal={
                            setPhotographerModal
                        }
                        setActiveTab={
                            setActiveTab
                        }
                        todayCount={todayCount}         // 🔧 todayUnassignedCount ki jagah
                        tomorrowCount={tomorrowCount}   // 🆕
                        upcomingCount={upcomingCount}
                    />
                }

                ListEmptyComponent={
                    renderEmpty
                }

                ListFooterComponent={
                    renderFooter
                }
                onEndReached={handleLoadMore}   // ⬅ pehle "onLoadMore" tha
                onEndReachedThreshold={0.4}

                showsVerticalScrollIndicator={
                    false
                }

                keyboardShouldPersistTaps="handled"

                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            onRefresh
                        }
                        colors={[
                            Colors.buttonbgcolor,
                        ]}
                    />
                }

                contentContainerStyle={{
                    padding: 10,
                    paddingBottom: 25,
                    flexGrow: 1,
                }}

                initialNumToRender={10}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={
                    30
                }
                windowSize={7}
                removeClippedSubviews={
                    true
                }
            />

            {/* =================================================
                STAGE MODAL
                ONLY ACTIVE TAB
            ================================================= */}

            {(activeTab === 'active' || activeTab === 'today') && (
                <FilterModal
                    visible={
                        stageModal
                    }
                    title="Select Stage"
                    icon="filter-variant"
                    data={
                        stageData
                    }
                    selectedValue={
                        selectedStage
                    }
                    onSelect={
                        selectStage
                    }
                    onClose={() =>
                        setStageModal(
                            false
                        )
                    }
                />
            )}

            {/* =================================================
                COORDINATOR MODAL
            ================================================= */}

            {isAdmin && (
                <FilterModal
                    visible={
                        coordinatorModal
                    }
                    title="Select Coordinator"
                    icon="account-group-outline"
                    data={
                        coordinatorData
                    }
                    selectedValue={
                        selectedCoordinator.value
                    }
                    onSelect={
                        selectCoordinator
                    }
                    onClose={() =>
                        setCoordinatorModal(
                            false
                        )
                    }
                />
            )}

            {/* =================================================
                PHOTOGRAPHER MODAL
            ================================================= */}

            <FilterModal
                visible={
                    photographerModal
                }
                title="Select Photographer"
                icon="camera-outline"
                data={
                    photographerData
                }
                selectedValue={
                    selectedPhotographer.value
                }
                onSelect={
                    selectPhotographer
                }
                onClose={() =>
                    setPhotographerModal(
                        false
                    )
                }
            />

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
            <CoordinatorNotificationModal
                visible={notificationModal}
                onClose={() => setNotificationModal(false)}
                navigation={navigation}
                isAdmin={isAdmin}          // ← ab use nahi hota, chaho to hata do
                anchor={notifAnchor}
            />
        </View>
    );
};

export default CoordinatorDashboard;
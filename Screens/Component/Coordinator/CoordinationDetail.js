import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Fonts } from '../Commoncomponent/Constants';

/* ── STATIC DATA ── */
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

/* ── INFO ROW ── */
const InfoRow = ({ icon, label, value }) => (
    <View
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 0.5,
            borderBottomColor: '#f1f5f9',
        }}
    >
        <View
            style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                backgroundColor:
                    Colors.buttonbgcolor + '12',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 10,
            }}
        >
            <Icon
                name={icon}
                size={15}
                color={Colors.buttonbgcolor}
            />
        </View>

        <View style={{ flex: 1 }}>
            <Text
                style={{
                    fontSize: 10,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginBottom: 1,
                }}
            >
                {label}
            </Text>

            <Text
                style={{
                    fontSize: 12.5,
                    fontFamily: Fonts.Bold,
                    color: '#1e293b',
                }}
                numberOfLines={2}
            >
                {value || '--'}
            </Text>
        </View>
    </View>
);

/* ── MAIN SCREEN ── */
const CoordinationDetail = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const bookingData =
        route?.params?.bookingData || {};

    /* ── MODAL STATES ── */
    const [showBookingModal, setShowBookingModal] =
        useState(false);

    const [showTaskModal, setShowTaskModal] =
        useState(false);

    /* ── STATIC ORIGINAL BOOKING ── */
    const originalBooking = {
        bookingNo:
            bookingData.id || 'BK-2026-00125',

        client:
            bookingData.client || 'Rahul Mehta',

        eventType:
            bookingData.eventType ||
            'Wedding Photography',

        eventDate:
            bookingData.eventDate ||
            '28/08/2026',

        venue:
            bookingData.venue ||
            'The Grand Palace, Surat',

        package:
            'Premium Wedding Package',

        totalAmount:
            '₹85,000',

        advancePaid:
            '₹30,000',

        balance:
            '₹55,000',
    };

    /* ── STATIC TASKS ── */
    const tasks = [
        {
            id: 1,
            title: 'Concept Finalization',
            assignedTo: 'Creative Team',
            status: 'Completed',
        },
        {
            id: 2,
            title: 'Outfit Finalization',
            assignedTo: 'Styling Team',
            status: 'Completed',
        },
        {
            id: 3,
            title: 'Props Arrangement',
            assignedTo: 'Production Team',
            status: 'In Progress',
        },
        {
            id: 4,
            title: 'Client Requirements',
            assignedTo:
                bookingData.salesPerson || 'Arjun',
            status: 'Pending',
        },
        {
            id: 5,
            title: 'Photographer Assignment',
            assignedTo:
                bookingData.photographer ||
                'Not Assigned',
            status: 'Pending',
        },
        {
            id: 6,
            title: 'Shoot Preparation',
            assignedTo: 'Photography Team',
            status: 'Pending',
        },
    ];

    /* ── STAGE ── */
    const stageKey =
        bookingData.stageKey ||
        (Object.keys(bookingData).includes('stage')
            ? STAGES.find(
                s => s.label === bookingData.stage
            )?.key
            : 'done') ||
        'done';

    const currentStageIndex =
        STAGES.findIndex(
            s => s.key === stageKey
        );

    const currentStage =
        STAGES[currentStageIndex] ||
        STAGES[STAGES.length - 1];

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f4f6f8',
            }}
        >
            <StatusBar
                backgroundColor={Colors.buttonbgcolor}
                barStyle="light-content"
            />

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <View
                style={{
                    height: 54,
                    backgroundColor:
                        Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                }}
            >
                {/* BACK */}
                <TouchableOpacity
                    onPress={() =>
                        navigation.goBack()
                    }
                    style={{
                        width: 40,
                        alignItems: 'flex-start',
                    }}
                >
                    <Icon
                        name="arrow-left"
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>

                {/* TITLE */}
                <View
                    style={{
                        alignItems: 'center',
                        flex: 1,
                        paddingHorizontal: 5,
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 16,
                            fontFamily: Fonts.Bold,
                        }}
                        numberOfLines={1}
                    >
                        Coordination Detail
                    </Text>

                    <Text
                        style={{
                            color: '#e2e8f0',
                            fontSize: 10.5,
                            fontFamily:
                                Fonts.Regular,
                            marginTop: 1,
                        }}
                        numberOfLines={1}
                    >
                        {bookingData.client} — #
                        {bookingData.id}
                    </Text>
                </View>

                {/* EDIT */}
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate(
                            'NewCoordination',
                            { bookingData }
                        )
                    }
                    style={{
                        width: 40,
                        alignItems: 'flex-end',
                    }}
                >
                    <Icon
                        name="pencil-outline"
                        size={21}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {/* ================================================= */}
            {/* MAIN CONTENT */}
            {/* ================================================= */}

            <ScrollView
                contentContainerStyle={{
                    padding: 12,
                    paddingBottom: 25,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* ================================================= */}
                {/* PIPELINE PROGRESS */}
                {/* ================================================= */}

                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                        elevation: 1,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        shadowOffset: {
                            width: 0,
                            height: 1,
                        },
                    }}
                >
                    <Text
                        style={{
                            fontSize: 13.5,
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                            marginBottom: 4,
                        }}
                    >
                        Pipeline Progress
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingVertical: 3,
                            paddingRight: 5,
                        }}
                    >
                        {STAGES.map((s, index) => {
                            const done =
                                index <
                                currentStageIndex;

                            const active =
                                index ===
                                currentStageIndex;

                            const isLast =
                                index ===
                                STAGES.length - 1;

                            return (
                                <View
                                    key={s.key}
                                    style={{
                                        flexDirection:
                                            'row',
                                        alignItems:
                                            'flex-start',
                                    }}
                                >
                                    {/* STEP */}
                                    <View
                                        style={{
                                            width: 55,
                                            alignItems:
                                                'center',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor:
                                                    done
                                                        ? '#16A34A'
                                                        : active
                                                            ? Colors.buttonbgcolor
                                                            : '#e2e8f0',
                                                justifyContent:
                                                    'center',
                                                alignItems:
                                                    'center',
                                            }}
                                        >
                                            <Icon
                                                name={
                                                    done
                                                        ? 'check'
                                                        : s.icon
                                                }
                                                size={15}
                                                color={
                                                    done ||
                                                        active
                                                        ? '#fff'
                                                        : '#94a3b8'
                                                }
                                            />
                                        </View>

                                        <Text
                                            numberOfLines={
                                                2
                                            }
                                            style={{
                                                width: 55,
                                                minHeight: 24,
                                                fontSize: 8,
                                                lineHeight: 10,
                                                fontFamily:
                                                    done ||
                                                        active
                                                        ? Fonts.Bold
                                                        : Fonts.Regular,
                                                color:
                                                    done ||
                                                        active
                                                        ? '#1e293b'
                                                        : '#94a3b8',
                                                textAlign:
                                                    'center',
                                                marginTop: 4,
                                            }}
                                        >
                                            {s.label}
                                        </Text>
                                    </View>

                                    {/* LINE */}
                                    {!isLast && (
                                        <View
                                            style={{
                                                width: 11,
                                                height: 2,
                                                backgroundColor:
                                                    done
                                                        ? '#16A34A'
                                                        : '#e2e8f0',
                                                marginTop: 15,
                                            }}
                                        />
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* CURRENT STAGE */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            alignSelf:
                                'flex-start',
                            backgroundColor:
                                Colors.buttonbgcolor +
                                '12',
                            borderRadius: 18,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            marginTop: 2,
                        }}
                    >
                        <Icon
                            name={currentStage.icon}
                            size={13}
                            color={
                                Colors.buttonbgcolor
                            }
                        />

                        <Text
                            style={{
                                fontSize: 10.5,
                                fontFamily:
                                    Fonts.Bold,
                                color:
                                    Colors.buttonbgcolor,
                                marginLeft: 5,
                            }}
                        >
                            Current:{' '}
                            {currentStage.label}
                        </Text>
                    </View>
                </View>

                {/* ================================================= */}
                {/* BOOKING DETAILS */}
                {/* ================================================= */}

                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                        elevation: 1,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        shadowOffset: {
                            width: 0,
                            height: 1,
                        },
                    }}
                >
                    {/* CARD HEADER */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                        }}
                    >
                        <Icon
                            name="information-outline"
                            size={17}
                            color={
                                Colors.buttonbgcolor
                            }
                        />

                        <Text
                            style={{
                                fontSize: 13.5,
                                fontFamily:
                                    Fonts.Bold,
                                color: '#1e293b',
                                marginLeft: 6,
                            }}
                        >
                            Booking Details
                        </Text>
                    </View>

                    <InfoRow
                        icon="account-outline"
                        label="Client"
                        value={bookingData.client}
                    />

                    <InfoRow
                        icon="calendar-outline"
                        label="Event Date"
                        value={
                            bookingData.eventDate
                        }
                    />

                    <InfoRow
                        icon="tag-outline"
                        label="Event Type / Venue"
                        value={
                            bookingData.venue ||
                            bookingData.eventType
                        }
                    />

                    <InfoRow
                        icon="camera-outline"
                        label="Assigned Photographer"
                        value={
                            bookingData.photographer
                        }
                    />

                    <InfoRow
                        icon="briefcase-account-outline"
                        label="Sales Person"
                        value={
                            bookingData.salesPerson ||
                            'Arjun'
                        }
                    />

                    <InfoRow
                        icon="text-box-outline"
                        label="Notes / Requirements"
                        value={
                            bookingData.notes ||
                            '--'
                        }
                    />

                    {/* ================================================= */}
                    {/* VIEW ORIGINAL BOOKING */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 10,
                        }}
                        activeOpacity={0.7}
                        onPress={() =>
                            setShowBookingModal(true)
                        }
                    >
                        <Icon
                            name="eye-outline"
                            size={15}
                            color={
                                Colors.buttonbgcolor
                            }
                        />

                        <Text
                            style={{
                                fontSize: 11.5,
                                fontFamily:
                                    Fonts.Bold,
                                color:
                                    Colors.buttonbgcolor,
                                marginLeft: 5,
                            }}
                        >
                            View Original Booking
                        </Text>
                    </TouchableOpacity>

                    {/* ================================================= */}
                    {/* MANAGE TASKS */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 9,
                        }}
                        activeOpacity={0.7}
                        onPress={() =>
                            setShowTaskModal(true)
                        }
                    >
                        <Icon
                            name="format-list-checks"
                            size={15}
                            color={
                                Colors.buttonbgcolor
                            }
                        />

                        <Text
                            style={{
                                fontSize: 11.5,
                                fontFamily:
                                    Fonts.Bold,
                                color:
                                    Colors.buttonbgcolor,
                                marginLeft: 5,
                            }}
                        >
                            Manage Tasks
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ================================================= */}
                {/* UPDATE PIPELINE */}
                {/* ================================================= */}

                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        backgroundColor:
                            Colors.buttonbgcolor,
                        height: 46,
                        borderRadius: 10,
                        justifyContent:
                            'center',
                        alignItems: 'center',
                        marginTop: 2,
                        marginBottom: 5,
                    }}
                    onPress={() =>
                        navigation.navigate(
                            'NewCoordination',
                            { bookingData }
                        )
                    }
                    activeOpacity={0.85}
                >
                    <Icon
                        name="pencil-outline"
                        size={17}
                        color="#fff"
                    />

                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 13.5,
                            fontFamily: Fonts.Bold,
                            marginLeft: 7,
                        }}
                    >
                        Update Pipeline
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* ========================================================= */}
            {/* ORIGINAL BOOKING MODAL */}
            {/* ========================================================= */}

            <Modal
                visible={showBookingModal}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setShowBookingModal(false)
                }
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() =>
                        setShowBookingModal(false)
                    }
                    style={{
                        flex: 1,
                        backgroundColor:
                            'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                >
                    <View
                        onStartShouldSetResponder={() =>
                            true
                        }
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 14,
                            overflow: 'hidden',
                            maxHeight: '85%',
                        }}
                    >
                        {/* MODAL HEADER */}
                        <View
                            style={{
                                backgroundColor:
                                    Colors.buttonbgcolor,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent:
                                    'space-between',
                            }}
                        >
                            <View>
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 15,
                                        fontFamily:
                                            Fonts.Bold,
                                    }}
                                >
                                    Original Booking
                                </Text>

                                <Text
                                    style={{
                                        color:
                                            '#dbeafe',
                                        fontSize: 10,
                                        fontFamily:
                                            Fonts.Regular,
                                        marginTop: 2,
                                    }}
                                >
                                    #
                                    {
                                        originalBooking.bookingNo
                                    }
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() =>
                                    setShowBookingModal(
                                        false
                                    )
                                }
                            >
                                <Icon
                                    name="close"
                                    size={21}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* BOOKING DATA */}
                        <ScrollView
                            showsVerticalScrollIndicator={
                                false
                            }
                            contentContainerStyle={{
                                padding: 13,
                            }}
                        >
                            {[
                                [
                                    'account-outline',
                                    'Client',
                                    originalBooking.client,
                                ],
                                [
                                    'calendar-outline',
                                    'Event Date',
                                    originalBooking.eventDate,
                                ],
                                [
                                    'camera-outline',
                                    'Event Type',
                                    originalBooking.eventType,
                                ],
                                [
                                    'map-marker-outline',
                                    'Venue',
                                    originalBooking.venue,
                                ],
                                [
                                    'package-variant-closed',
                                    'Package',
                                    originalBooking.package,
                                ],
                                [
                                    'cash-multiple',
                                    'Total Amount',
                                    originalBooking.totalAmount,
                                ],
                                [
                                    'cash-check',
                                    'Advance Paid',
                                    originalBooking.advancePaid,
                                ],
                                [
                                    'cash-minus',
                                    'Balance',
                                    originalBooking.balance,
                                ],
                            ].map(
                                (
                                    [
                                        icon,
                                        label,
                                        value,
                                    ],
                                    index
                                ) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection:
                                                'row',
                                            alignItems:
                                                'center',
                                            paddingVertical:
                                                9,
                                            borderBottomWidth:
                                                0.5,
                                            borderBottomColor:
                                                '#f1f5f9',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 9,
                                                backgroundColor:
                                                    Colors.buttonbgcolor +
                                                    '12',
                                                justifyContent:
                                                    'center',
                                                alignItems:
                                                    'center',
                                                marginRight: 10,
                                            }}
                                        >
                                            <Icon
                                                name={
                                                    icon
                                                }
                                                size={
                                                    15
                                                }
                                                color={
                                                    Colors.buttonbgcolor
                                                }
                                            />
                                        </View>

                                        <View
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    color:
                                                        '#94a3b8',
                                                    fontFamily:
                                                        Fonts.Regular,
                                                }}
                                            >
                                                {label}
                                            </Text>

                                            <Text
                                                style={{
                                                    fontSize: 12.5,
                                                    color:
                                                        '#1e293b',
                                                    fontFamily:
                                                        Fonts.Bold,
                                                    marginTop: 1,
                                                }}
                                            >
                                                {
                                                    value
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                )
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ========================================================= */}
            {/* MANAGE TASKS MODAL */}
            {/* ========================================================= */}

            <Modal
                visible={showTaskModal}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setShowTaskModal(false)
                }
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() =>
                        setShowTaskModal(false)
                    }
                    style={{
                        flex: 1,
                        backgroundColor:
                            'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        padding: 16,
                    }}
                >
                    <View
                        onStartShouldSetResponder={() =>
                            true
                        }
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 14,
                            overflow: 'hidden',
                            maxHeight: '80%',
                        }}
                    >
                        {/* MODAL HEADER */}
                        <View
                            style={{
                                backgroundColor:
                                    Colors.buttonbgcolor,
                                paddingHorizontal: 15,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent:
                                    'space-between',
                            }}
                        >
                            <View>
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 15,
                                        fontFamily:
                                            Fonts.Bold,
                                    }}
                                >
                                    Manage Tasks
                                </Text>

                                <Text
                                    style={{
                                        color:
                                            '#dbeafe',
                                        fontSize: 10,
                                        fontFamily:
                                            Fonts.Regular,
                                        marginTop: 2,
                                    }}
                                >
                                    {tasks.length} Tasks
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() =>
                                    setShowTaskModal(
                                        false
                                    )
                                }
                            >
                                <Icon
                                    name="close"
                                    size={21}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* TASK LIST */}
                        <ScrollView
                            showsVerticalScrollIndicator={
                                false
                            }
                            contentContainerStyle={{
                                padding: 12,
                            }}
                        >
                            {tasks.map(task => {
                                const completed =
                                    task.status ===
                                    'Completed';

                                const progress =
                                    task.status ===
                                    'In Progress';

                                return (
                                    <View
                                        key={task.id}
                                        style={{
                                            flexDirection:
                                                'row',
                                            alignItems:
                                                'center',
                                            paddingVertical:
                                                10,
                                            borderBottomWidth:
                                                0.5,
                                            borderBottomColor:
                                                '#e2e8f0',
                                        }}
                                    >
                                        {/* STATUS ICON */}
                                        <View
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor:
                                                    completed
                                                        ? '#16A34A'
                                                        : progress
                                                            ? '#FEF3C7'
                                                            : '#f1f5f9',
                                                justifyContent:
                                                    'center',
                                                alignItems:
                                                    'center',
                                                marginRight: 10,
                                            }}
                                        >
                                            <Icon
                                                name={
                                                    completed
                                                        ? 'check'
                                                        : progress
                                                            ? 'clock-outline'
                                                            : 'circle-outline'
                                                }
                                                size={16}
                                                color={
                                                    completed
                                                        ? '#fff'
                                                        : progress
                                                            ? '#D97706'
                                                            : '#94a3b8'
                                                }
                                            />
                                        </View>

                                        {/* TASK DETAILS */}
                                        <View
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12.5,
                                                    fontFamily:
                                                        Fonts.Bold,
                                                    color:
                                                        '#1e293b',
                                                }}
                                            >
                                                {
                                                    task.title
                                                }
                                            </Text>

                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    fontFamily:
                                                        Fonts.Regular,
                                                    color:
                                                        '#94a3b8',
                                                    marginTop: 2,
                                                }}
                                            >
                                                Assigned:{' '}
                                                {
                                                    task.assignedTo
                                                }
                                            </Text>
                                        </View>

                                        {/* STATUS */}
                                        <View
                                            style={{
                                                paddingHorizontal:
                                                    7,
                                                paddingVertical:
                                                    4,
                                                borderRadius: 10,
                                                backgroundColor:
                                                    completed
                                                        ? '#DCFCE7'
                                                        : progress
                                                            ? '#FEF3C7'
                                                            : '#F1F5F9',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 9,
                                                    fontFamily:
                                                        Fonts.Bold,
                                                    color:
                                                        completed
                                                            ? '#15803D'
                                                            : progress
                                                                ? '#B45309'
                                                                : '#64748B',
                                                }}
                                            >
                                                {
                                                    task.status
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default CoordinationDetail;
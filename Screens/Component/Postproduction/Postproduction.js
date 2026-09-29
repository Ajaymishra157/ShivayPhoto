import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts } from '../Commoncomponent/Constants';

/* ─────────────────────────────────────────────
   STATIC DATA
   ───────────────────────────────────────────── */

const STATS = [
    {
        label: 'Total',
        value: 0,
        bg: '#E0F2FE',
        color: '#0369A1',
    },
    {
        label: 'Pending',
        value: 0,
        bg: '#FEF3C7',
        color: '#B45309',
    },
    {
        label: 'In Progress',
        value: 0,
        bg: '#DBEAFE',
        color: '#1D4ED8',
    },
    {
        label: 'Review',
        value: 0,
        bg: '#CFFAFE',
        color: '#0E7490',
    },
    {
        label: 'Done',
        value: 0,
        bg: '#DCFCE7',
        color: '#15803D',
    },
    {
        label: 'Overdue',
        value: 0,
        bg: '#FEE2E2',
        color: '#DC2626',
    },
];

const ACTIVE_JOBS = [
    {
        jobNo: 'JOB-001',
        booking: 'ORD-007',
        client: 'Vishal Patel',
        purpose: 'Pre-Wedding',
        photographer: 'Shahrukh Khan',
        editor: 'Riya',
        progress: '40%',
        priority: 'High',
        delivery: '25 Aug 2026',
        status: 'In Progress',
    },
    {
        jobNo: 'JOB-003',
        booking: 'ORD-008',
        client: 'Rahul & Priya',
        purpose: 'Wedding',
        photographer: 'Arjun Mehta',
        editor: 'Neha',
        progress: '65%',
        priority: 'High',
        delivery: '28 Aug 2026',
        status: 'In Progress',
    },
    {
        jobNo: 'JOB-004',
        booking: 'ORD-009',
        client: 'Neha Patel',
        purpose: 'Engagement',
        photographer: 'Gopika',
        editor: 'Riya',
        progress: '20%',
        priority: 'Medium',
        delivery: '30 Aug 2026',
        status: 'Pending',
    },
    {
        jobNo: 'JOB-005',
        booking: 'ORD-010',
        client: 'Aarav Shah',
        purpose: 'Birthday',
        photographer: 'Karan Joshi',
        editor: 'Mehul',
        progress: '85%',
        priority: 'Low',
        delivery: '27 Aug 2026',
        status: 'Review',
    },
    {
        jobNo: 'JOB-006',
        booking: 'ORD-011',
        client: 'Kavya Mehta',
        purpose: 'Maternity',
        photographer: 'Gopika',
        editor: 'Anjali',
        progress: '55%',
        priority: 'Medium',
        delivery: '31 Aug 2026',
        status: 'In Progress',
    },
];

const COMPLETED_JOBS = [
    {
        jobNo: 'JOB-002',
        booking: 'ORD-004',
        client: 'Sejal Shah',
        purpose: 'Wedding',
        photographer: 'Gopika',
        editor: 'Riya',
        completed: '18 Aug 2026',
        status: 'Delivered',
    },
    {
        jobNo: 'JOB-007',
        booking: 'ORD-003',
        client: 'Amit & Sneha',
        purpose: 'Pre-Wedding',
        photographer: 'Arjun Mehta',
        editor: 'Neha',
        completed: '16 Aug 2026',
        status: 'Delivered',
    },
    {
        jobNo: 'JOB-008',
        booking: 'ORD-005',
        client: 'Pooja Desai',
        purpose: 'Baby Shoot',
        photographer: 'Karan Joshi',
        editor: 'Mehul',
        completed: '14 Aug 2026',
        status: 'Delivered',
    },
    {
        jobNo: 'JOB-009',
        booking: 'ORD-006',
        client: 'Harsh Patel',
        purpose: 'Engagement',
        photographer: 'Shahrukh Khan',
        editor: 'Riya',
        completed: '12 Aug 2026',
        status: 'Delivered',
    },
    {
        jobNo: 'JOB-010',
        booking: 'ORD-002',
        client: 'Nidhi Shah',
        purpose: 'Birthday',
        photographer: 'Gopika',
        editor: 'Anjali',
        completed: '10 Aug 2026',
        status: 'Delivered',
    },
];

const PRIORITY_COLORS = {
    High: '#DC2626',
    Medium: '#F59E0B',
    Low: '#16A34A',
};

const STATUS_COLORS = {
    'In Progress': '#2563EB',
    Pending: '#EAB308',
    Review: '#06B6D4',
    Done: '#16A34A',
    Delivered: '#16A34A',
};

const Postproduction = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('active');

    /* ─────────────────────────────────────────────
       ACTIVE JOB CARD
       ───────────────────────────────────────────── */
    const ActiveJobCard = ({ item }) => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 11,
                padding: 10,
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: '#2563EB',
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
            {/* TOP ROW */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* ICON */}
                <View
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: '#DBEAFE',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 7,
                    }}
                >
                    <Icon
                        name="progress-clock"
                        size={14}
                        color="#2563EB"
                    />
                </View>

                {/* CLIENT + META */}
                <View
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            fontSize: 12.5,
                            fontFamily: Fonts.Bold,
                            color: '#172033',
                        }}
                    >
                        {item.client}
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
                            style={{
                                color: '#2563EB',
                                fontFamily: Fonts.Bold,
                                fontSize: 9,
                                maxWidth: '55%',
                            }}
                        >
                            {item.purpose}
                        </Text>

                        <View
                            style={{
                                width: 3,
                                height: 3,
                                borderRadius: 2,
                                backgroundColor: '#cbd5e1',
                                marginHorizontal: 5,
                            }}
                        />

                        <Icon
                            name="bookmark-outline"
                            size={10}
                            color="#94a3b8"
                        />

                        <Text
                            numberOfLines={1}
                            style={{
                                color: '#94a3b8',
                                fontFamily: Fonts.Regular,
                                fontSize: 9,
                                marginLeft: 2,
                            }}
                        >
                            #{item.booking}
                        </Text>
                    </View>
                </View>

                {/* JOB NO + PRIORITY */}
                <View
                    style={{
                        alignItems: 'flex-end',
                        marginLeft: 7,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: '#f1f5f9',
                            borderRadius: 5,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                        }}
                    >
                        <Text
                            style={{
                                color: '#475569',
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                            }}
                        >
                            {item.jobNo}
                        </Text>
                    </View>

                    <Text
                        style={{
                            color:
                                PRIORITY_COLORS[item.priority] ||
                                '#64748b',
                            fontFamily: Fonts.Bold,
                            fontSize: 8,
                            marginTop: 3,
                        }}
                    >
                        {item.priority} Priority
                    </Text>
                </View>
            </View>

            {/* DIVIDER */}
            <View
                style={{
                    height: 0.5,
                    backgroundColor: '#eef2f6',
                    marginTop: 7,
                    marginBottom: 6,
                }}
            />

            {/* DETAILS + STATUS */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* PHOTOGRAPHER */}
                <View
                    style={{
                        flex: 1,
                    }}
                >
                    <Text
                        style={{
                            color: '#a0aab8',
                            fontFamily: Fonts.Regular,
                            fontSize: 7.5,
                        }}
                    >
                        Photographer
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={{
                            color: '#334155',
                            fontFamily: Fonts.Bold,
                            fontSize: 9.5,
                            marginTop: 1,
                        }}
                    >
                        {item.photographer}
                    </Text>
                </View>

                {/* EDITOR */}
                <View
                    style={{
                        flex: 1,
                        marginLeft: 8,
                    }}
                >
                    <Text
                        style={{
                            color: '#a0aab8',
                            fontFamily: Fonts.Regular,
                            fontSize: 7.5,
                        }}
                    >
                        Editor
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={{
                            color: '#334155',
                            fontFamily: Fonts.Bold,
                            fontSize: 9.5,
                            marginTop: 1,
                        }}
                    >
                        {item.editor}
                    </Text>
                </View>

                {/* STATUS */}
                <View
                    style={{
                        alignItems: 'flex-start',
                        marginLeft: 7,
                    }}
                >
                    <Text
                        style={{
                            color: '#a0aab8',
                            fontFamily: Fonts.Regular,
                            fontSize: 7.5,
                            marginBottom: 2,
                        }}
                    >
                        Status
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor:
                                STATUS_COLORS[item.status] ||
                                '#2563EB',
                            borderRadius: 12,
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                        }}
                    >
                        <Icon
                            name="progress-clock"
                            size={9}
                            color="#fff"
                        />

                        <Text
                            style={{
                                color: '#fff',
                                fontFamily: Fonts.Bold,
                                fontSize: 8,
                                marginLeft: 2,
                            }}
                        >
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>

            {/* PROGRESS */}
            <View
                style={{
                    marginTop: 7,
                    paddingTop: 6,
                    borderTopWidth: 0.5,
                    borderTopColor: '#f1f5f9',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                    }}
                >
                    <Text
                        style={{
                            color: '#a0aab8',
                            fontFamily: Fonts.Regular,
                            fontSize: 7.5,
                        }}
                    >
                        Progress
                    </Text>

                    <Text
                        style={{
                            color: '#2563EB',
                            fontFamily: Fonts.Bold,
                            fontSize: 8.5,
                        }}
                    >
                        {item.progress}
                    </Text>
                </View>

                <View
                    style={{
                        height: 4,
                        borderRadius: 3,
                        backgroundColor: '#e2e8f0',
                        overflow: 'hidden',
                    }}
                >
                    <View
                        style={{
                            height: 4,
                            width: item.progress,
                            borderRadius: 3,
                            backgroundColor: '#2563EB',
                        }}
                    />
                </View>
            </View>

            {/* BOTTOM ACTION ROW */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 7,
                    paddingTop: 6,
                    borderTopWidth: 0.5,
                    borderTopColor: '#f1f5f9',
                }}
            >
                {/* DELIVERY */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                    }}
                >
                    <Icon
                        name="truck-delivery-outline"
                        size={11}
                        color="#94a3b8"
                    />

                    <Text
                        style={{
                            color: '#64748b',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                            marginLeft: 3,
                        }}
                    >
                        Delivery {item.delivery}
                    </Text>
                </View>

                {/* VIEW */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.navigate('PostProductionDetail', {
                            jobData: item,
                        })
                    }
                    style={{
                        height: 28,
                        paddingHorizontal: 11,
                        borderRadius: 7,
                        backgroundColor: '#f0f9ff',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon
                        name="information-outline"
                        size={12}
                        color="#2563EB"
                    />

                    <Text
                        style={{
                            fontSize: 9,
                            fontFamily: Fonts.Bold,
                            color: '#2563EB',
                            marginLeft: 4,
                        }}
                    >
                        View
                    </Text>

                    <Icon
                        name="chevron-right"
                        size={12}
                        color="#2563EB"
                        style={{
                            marginLeft: 1,
                        }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    /* ─────────────────────────────────────────────
       COMPLETED JOB CARD
       ───────────────────────────────────────────── */

    const CompletedJobCard = ({ item }) => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 11,
                padding: 10,
                marginBottom: 8,
                borderLeftWidth: 3,
                borderLeftColor: '#16A34A',
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
            {/* TOP ROW */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* CHECK ICON */}
                <View
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: '#DCFCE7',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 7,
                    }}
                >
                    <Icon
                        name="check-bold"
                        size={14}
                        color="#16A34A"
                    />
                </View>

                {/* CLIENT + META */}
                <View
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            fontSize: 12.5,
                            fontFamily: Fonts.Bold,
                            color: '#172033',
                        }}
                    >
                        {item.client}
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
                            style={{
                                color: '#16A34A',
                                fontFamily: Fonts.Bold,
                                fontSize: 9,
                                maxWidth: '55%',
                            }}
                        >
                            {item.purpose}
                        </Text>

                        <View
                            style={{
                                width: 3,
                                height: 3,
                                borderRadius: 2,
                                backgroundColor: '#cbd5e1',
                                marginHorizontal: 5,
                            }}
                        />

                        <Icon
                            name="bookmark-outline"
                            size={10}
                            color="#94a3b8"
                        />

                        <Text
                            numberOfLines={1}
                            style={{
                                color: '#94a3b8',
                                fontFamily: Fonts.Regular,
                                fontSize: 9,
                                marginLeft: 2,
                            }}
                        >
                            #{item.booking}
                        </Text>
                    </View>
                </View>

                {/* JOB NO */}
                <View
                    style={{
                        alignItems: 'flex-end',
                        marginLeft: 7,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: '#f1f5f9',
                            borderRadius: 5,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                        }}
                    >
                        <Text
                            style={{
                                color: '#475569',
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                            }}
                        >
                            {item.jobNo}
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 3,
                        }}
                    >
                        <Icon
                            name="check-circle-outline"
                            size={9}
                            color="#16A34A"
                        />

                        <Text
                            style={{
                                color: '#16A34A',
                                fontFamily: Fonts.Regular,
                                fontSize: 8.5,
                                marginLeft: 2,
                            }}
                        >
                            Completed
                        </Text>
                    </View>
                </View>
            </View>

            {/* DIVIDER */}
            <View
                style={{
                    height: 0.5,
                    backgroundColor: '#eef2f6',
                    marginTop: 7,
                    marginBottom: 6,
                }}
            />

            {/* DETAILS + STATUS */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* PHOTOGRAPHER */}
                <View
                    style={{
                        flex: 1,
                    }}
                >
                    <Text
                        style={{
                            color: '#a0aab8',
                            fontFamily: Fonts.Regular,
                            fontSize: 7.5,
                        }}
                    >
                        Photographer
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={{
                            color: '#334155',
                            fontFamily: Fonts.Bold,
                            fontSize: 9.5,
                            marginTop: 1,
                        }}
                    >
                        {item.photographer}
                    </Text>
                </View>

                {/* EDITOR */}
                <View
                    style={{
                        flex: 1,
                        marginLeft: 8,
                    }}
                >
                    <Text
                        style={{
                            color: '#a0aab8',
                            fontFamily: Fonts.Regular,
                            fontSize: 7.5,
                        }}
                    >
                        Editor
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={{
                            color: '#334155',
                            fontFamily: Fonts.Bold,
                            fontSize: 9.5,
                            marginTop: 1,
                        }}
                    >
                        {item.editor}
                    </Text>
                </View>

                {/* STATUS */}
                <View
                    style={{
                        alignItems: 'flex-start',
                        marginLeft: 7,
                    }}
                >
                    <Text
                        style={{
                            color: '#a0aab8',
                            fontFamily: Fonts.Regular,
                            fontSize: 7.5,
                            marginBottom: 2,
                        }}
                    >
                        Status
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor:
                                STATUS_COLORS[item.status] ||
                                '#16A34A',
                            borderRadius: 12,
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                        }}
                    >
                        <Icon
                            name="check"
                            size={9}
                            color="#fff"
                        />

                        <Text
                            style={{
                                color: '#fff',
                                fontFamily: Fonts.Bold,
                                fontSize: 8,
                                marginLeft: 2,
                            }}
                        >
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>

            {/* BOTTOM ACTION ROW */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 7,
                    paddingTop: 6,
                    borderTopWidth: 0.5,
                    borderTopColor: '#f1f5f9',
                }}
            >
                {/* COMPLETED DATE */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                    }}
                >
                    <Icon
                        name="calendar-check-outline"
                        size={11}
                        color="#94a3b8"
                    />

                    <Text
                        style={{
                            color: '#64748b',
                            fontFamily: Fonts.Regular,
                            fontSize: 9,
                            marginLeft: 3,
                        }}
                    >
                        Completed {item.completed}
                    </Text>
                </View>

                {/* VIEW ACTION */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.navigate('PostProductionDetail', {
                            jobData: item,
                        })
                    }
                    style={{
                        height: 28,
                        paddingHorizontal: 11,
                        borderRadius: 7,
                        backgroundColor: '#f0fdf4',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon
                        name="information-outline"
                        size={12}
                        color="#16A34A"
                    />

                    <Text
                        style={{
                            fontSize: 9,
                            fontFamily: Fonts.Bold,
                            color: '#16A34A',
                            marginLeft: 4,
                        }}
                    >
                        View
                    </Text>

                    <Icon
                        name="chevron-right"
                        size={12}
                        color="#16A34A"
                        style={{
                            marginLeft: 1,
                        }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    /* ─────────────────────────────────────────────
       EMPTY BOX
       ───────────────────────────────────────────── */

    const EmptyBox = ({ icon, title, sub }) => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                paddingVertical: 30,
                alignItems: 'center',
                elevation: 1,
            }}
        >
            <View
                style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: '#f1f5f9',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 9,
                }}
            >
                <Icon
                    name={icon}
                    size={28}
                    color="#94a3b8"
                />
            </View>

            <Text
                style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                }}
            >
                {title}
            </Text>

            {!!sub && (
                <Text
                    style={{
                        fontSize: 11,
                        fontFamily: Fonts.Regular,
                        color: '#cbd5e1',
                        marginTop: 2,
                    }}
                >
                    {sub}
                </Text>
            )}
        </View>
    );

    /* ─────────────────────────────────────────────
       SCREEN
       ───────────────────────────────────────────── */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f5f6f8',
            }}
        >
            <StatusBar
                backgroundColor={Colors.buttonbgcolor}
                barStyle="light-content"
            />

            {/* HEADER */}
            <View
                style={{
                    height: 50,
                    backgroundColor: Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    position: 'relative',
                }}
            >
                {/* BACK */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                    style={{
                        width: 34,
                        height: 34,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Icon
                        name="arrow-left"
                        size={22}
                        color="#fff"
                    />
                </TouchableOpacity>

                {/* CENTER TITLE */}
                <Text
                    numberOfLines={1}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        color: '#fff',
                        fontSize: 15,
                        fontFamily: Fonts.Bold,
                    }}
                >
                    Post-Production
                </Text>
                {/* PIPELINE VIEW - RIGHT CORNER */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        // Pipeline View
                    }}
                    style={{
                        position: 'absolute',
                        right: 10,
                        height: 30,
                        borderRadius: 7,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 8,
                    }}
                >
                    <Icon
                        name="chart-timeline-variant"
                        size={14}
                        color="#fff"
                    />

                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 8,
                            fontFamily: Fonts.Bold,
                            marginLeft: 4,
                        }}
                    >
                        Pipeline View
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: 12,
                    paddingBottom: 35,
                }}
            >


                {/* STATS */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                    }}
                >
                    {STATS.map(item => (
                        <View
                            key={item.label}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: item.bg,
                                borderRadius: 8,
                                paddingVertical: 7,
                                paddingHorizontal: 1.5,
                                marginHorizontal: 1.5,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: Fonts.Bold,
                                    color: item.color,
                                }}
                            >
                                {item.value}
                            </Text>

                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={{
                                    fontSize: 7,
                                    fontFamily: Fonts.Regular,
                                    color: item.color,
                                    marginTop: 2,
                                    textAlign: 'center',
                                }}
                            >
                                {item.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ================= TAB BAR ================= */}

                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 4,
                        marginTop: 12,
                        marginBottom: 12,
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
                    {/* ACTIVE JOBS TAB */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('active')}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            paddingVertical: 9,
                            borderRadius: 9,
                            backgroundColor:
                                activeTab === 'active'
                                    ? Colors.buttonbgcolor
                                    : 'transparent',
                        }}
                    >
                        <Icon
                            name="progress-clock"
                            size={16}
                            color={
                                activeTab === 'active'
                                    ? '#fff'
                                    : '#64748b'
                            }
                        />

                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: Fonts.Bold,
                                color:
                                    activeTab === 'active'
                                        ? '#fff'
                                        : '#64748b',
                            }}
                        >
                            Active Jobs
                        </Text>

                        <View
                            style={{
                                backgroundColor:
                                    activeTab === 'active'
                                        ? 'rgba(255,255,255,0.25)'
                                        : '#f1f5f9',
                                borderRadius: 20,
                                paddingHorizontal: 7,
                                paddingVertical: 1,
                                marginLeft: 2,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontFamily: Fonts.Bold,
                                    color:
                                        activeTab === 'active'
                                            ? '#fff'
                                            : '#64748b',
                                }}
                            >
                                {ACTIVE_JOBS.length}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* COMPLETED TAB */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveTab('completed')}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            paddingVertical: 9,
                            borderRadius: 9,
                            backgroundColor:
                                activeTab === 'completed'
                                    ? Colors.buttonbgcolor
                                    : 'transparent',
                        }}
                    >
                        <Icon
                            name="check-circle"
                            size={16}
                            color={
                                activeTab === 'completed'
                                    ? '#fff'
                                    : '#64748b'
                            }
                        />

                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: Fonts.Bold,
                                color:
                                    activeTab === 'completed'
                                        ? '#fff'
                                        : '#64748b',
                            }}
                        >
                            Completed
                        </Text>

                        <View
                            style={{
                                backgroundColor:
                                    activeTab === 'completed'
                                        ? 'rgba(255,255,255,0.25)'
                                        : '#f1f5f9',
                                borderRadius: 20,
                                paddingHorizontal: 7,
                                paddingVertical: 1,
                                marginLeft: 2,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontFamily: Fonts.Bold,
                                    color:
                                        activeTab === 'completed'
                                            ? '#fff'
                                            : '#64748b',
                                }}
                            >
                                {COMPLETED_JOBS.length}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ================= CONTENT ================= */}

                {activeTab === 'active' ? (
                    ACTIVE_JOBS.length === 0 ? (
                        <EmptyBox
                            icon="inbox-outline"
                            title="No active jobs assigned to you."
                            sub=""
                        />
                    ) : (
                        ACTIVE_JOBS.map(item => (
                            <ActiveJobCard
                                key={item.jobNo}
                                item={item}
                            />
                        ))
                    )
                ) : COMPLETED_JOBS.length === 0 ? (
                    <EmptyBox
                        icon="inbox-outline"
                        title="No completed jobs yet."
                        sub=""
                    />
                ) : (
                    COMPLETED_JOBS.map(item => (
                        <CompletedJobCard
                            key={item.jobNo}
                            item={item}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
};

export default Postproduction;
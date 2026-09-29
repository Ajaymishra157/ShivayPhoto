import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    memo,
} from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    FlatList,
    StatusBar,
    Modal,
    RefreshControl,
    BackHandler,
    ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';

import RNExitApp from 'react-native-exit-app';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    API,
    Colors,
    Fonts,
} from '../Commoncomponent/Constants';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

/* =========================================================
   STATUS CONFIG (display)
========================================================= */

const STATUSES = [
    {
        key: 'pending',
        label: 'Pending',
        icon: 'timer-sand-empty',
        color: '#F59E0B',
    },
    {
        key: 'in_progress',
        label: 'In Progress',
        icon: 'sync',
        color: '#0EA5E9',
    },
    {
        key: 'review',
        label: 'Review',
        icon: 'eye-outline',
        color: '#14B8A6',
    },
    {
        key: 'done',
        label: 'Done',
        icon: 'check-circle',
        color: '#16A34A',
    },
];

/* =========================================================
   BACKEND STATUS MAPPING
========================================================= */

const statusToBackend = {
    pending: 'Pending',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
};

const getStatusConfig = key =>
    STATUSES.find(item => item.key === key) ||
    STATUSES[0];

/* =========================================================
   COLORS
========================================================= */

const PRIORITY_COLORS = {
    Low: '#16A34A',
    Medium: '#F59E0B',
    High: '#DC2626',
};

const TYPE_COLORS = {
    Photo: '#7367f0',
    Video: '#EC4899',
};

const DUE_BUCKET_STYLE = {
    overdue: {
        color: '#DC2626',
        bg: '#FEE2E2',
        icon: 'alert-circle-outline',
    },

    today: {
        color: '#F59E0B',
        bg: '#FEF3C7',
        icon: 'calendar-today',
    },

    tomorrow: {
        color: '#0284C7',
        bg: '#DBEAFE',
        icon: 'calendar-arrow-right',
    },
};

/* =========================================================
   TABS
========================================================= */

const TABS = [
    {
        key: 'today',
        label: 'Due Today',
        icon: 'calendar-today',
    },
    {
        key: 'tomorrow',
        label: 'Due Tomorrow',
        icon: 'calendar-arrow-right',
    },
    {
        key: 'overdue',
        label: 'Overdue',
        icon: 'alert-circle-outline',
    },
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = status => {
    if (!status) {
        return 'pending';
    }

    const value = String(status)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');

    if (value === 'inprogress') {
        return 'in_progress';
    }

    if (
        [
            'pending',
            'in_progress',
            'review',
            'done',
        ].includes(value)
    ) {
        return value;
    }

    return 'pending';
};

const getInitials = name => {
    if (!name) {
        return '?';
    }

    const parts = String(name)
        .trim()
        .split(' ')
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        String(parts[0][0]) +
        String(parts[1][0])
    ).toUpperCase();
};

/* =========================================================
   API TASK FORMAT
========================================================= */

const normalizeTask = (
    item,
    dueBucket
) => {
    return {
        id: String(
            item.task_id ||
            item.order_no ||
            Math.random()
        ),

        task_id: item.task_id,

        client_id: item.client_id,

        booking_no:
            item.order_no || '',

        order_no:
            item.order_no || '',

        client_name:
            item.client_name || '',

        sub_label:
            item.purpose || '',

        mobile_no:
            item.mobile_no || '',

        task_type:
            item.task_type || 'Photo',

        priority:
            item.priority || 'Low',

        due_date:
            item.due_date_formatted ||
            item.due_date ||
            '',

        due_date_raw:
            item.due_date || '',

        due_bucket:
            dueBucket,

        is_overdue:
            item.is_overdue === true,

        status:
            normalizeStatus(
                item.status
            ),

        status_class:
            item.status_class || '',
    };
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = memo(
    ({
        label,
        value,
        icon,
        color,
    }) => (
        <View
            style={{
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 7,
                borderWidth: 0.6,
                borderColor: `${color}33`,
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
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        backgroundColor:
                            `${color}22`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 5,
                    }}
                >
                    <Icon
                        name={icon}
                        size={11}
                        color={color}
                    />
                </View>

                <Text
                    style={{
                        fontFamily:
                            Fonts.Bold,
                        fontSize: 14,
                        color: color,
                    }}
                >
                    {value}
                </Text>
            </View>

            <Text
                numberOfLines={1}
                style={{
                    fontFamily:
                        Fonts.Regular,
                    fontSize: 9.5,
                    color: '#4B5563',
                    marginTop: 4,
                }}
            >
                {label}
            </Text>
        </View>
    )
);

/* =========================================================
   SMALL LABEL (matches MyEditingTask card style)
========================================================= */

const Label = memo(({ title }) => (
    <Text
        style={{
            fontFamily: Fonts.Bold,
            fontSize: 7,
            color: '#9692A5',
            letterSpacing: 0.5,
            marginBottom: 2,
        }}
    >
        {title}
    </Text>
));

/* =========================================================
   TASK CARD (redesigned - same look as MyEditingTask cards)
========================================================= */
const TaskCard = memo(({ item, index, onStatusPress, isUpdating }) => {
    const statusCfg = getStatusConfig(item.status);

    const typeColor =
        TYPE_COLORS[item.task_type] || '#64748b';

    const priorityColor =
        PRIORITY_COLORS[item.priority] || '#64748b';

    const dueStyle =
        DUE_BUCKET_STYLE[item.due_bucket] ||
        DUE_BUCKET_STYLE.tomorrow;

    const dueLabel =
        item.due_bucket === 'overdue'
            ? 'Overdue'
            : item.due_bucket === 'today'
                ? 'Today'
                : 'Tomorrow';

    return (
        <View
            style={{
                marginBottom: 8,
                backgroundColor: '#fff',
                borderRadius: 12,
                borderWidth: 0.6,
                borderColor: '#E6E2F1',
                padding: 12,
                elevation: 1,
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
            }}
        >
            {/* =====================================================
                TOP ROW
                NUMBER + CLIENT + PRIORITY + BOOKING
            ====================================================== */}

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* NUMBER */}

                <View
                    style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: '#EEECFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 9,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 10,
                            color: '#6366F1',
                        }}
                    >
                        {index + 1}
                    </Text>
                </View>

                {/* CLIENT */}

                <View
                    style={{
                        flex: 1,
                        minWidth: 0,
                        paddingRight: 7,
                    }}
                >
                    <Label title="CLIENT" />

                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            color: '#29263B',
                            textTransform: 'capitalize',
                        }}
                    >
                        {item.client_name || '-'}
                    </Text>

                    {!!item.sub_label && (
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 9,
                                color: '#77748A',
                                marginTop: 1,
                                textTransform: 'capitalize',
                            }}
                        >
                            {item.sub_label}
                        </Text>
                    )}
                </View>

                {/* PRIORITY */}

                <View
                    style={{
                        alignItems: 'center',
                        marginRight: 8,
                    }}
                >
                    <Label title="PRIORITY" />

                    <View
                        style={{
                            backgroundColor: `${priorityColor}15`,
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9.5,
                                color: priorityColor,
                            }}
                        >
                            {item.priority || '-'}
                        </Text>
                    </View>
                </View>

                {/* BOOKING */}

                <View
                    style={{
                        alignItems: 'flex-end',
                    }}
                >
                    <Label title="BOOKING" />

                    <View
                        style={{
                            backgroundColor: '#F1EFFF',
                            borderRadius: 12,
                            paddingHorizontal: 9,
                            paddingVertical: 5,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9.5,
                                color: '#6366F1',
                            }}
                        >
                            #{item.booking_no || '-'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* =====================================================
                DIVIDER
            ====================================================== */}

            <View
                style={{
                    height: 0.6,
                    backgroundColor: '#ECE9F3',
                    marginVertical: 8,
                }}
            />

            {/* =====================================================
                SECOND ROW
                TYPE + DUE DATE + STATUS
            ====================================================== */}

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* TYPE */}

                <View
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <Label title="TYPE" />

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Icon
                            name={
                                item.task_type === 'Video'
                                    ? 'video-outline'
                                    : 'camera-outline'
                            }
                            size={13}
                            color={typeColor}
                        />

                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                                flexShrink: 1,
                                fontFamily: Fonts.Bold,
                                fontSize: 10,
                                color: '#555265',
                                marginLeft: 4,
                            }}
                        >
                            {item.task_type || '-'}
                        </Text>
                    </View>
                </View>

                {/* DUE DATE */}

                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        minWidth: 0,
                    }}
                >
                    <Label title={dueLabel.toUpperCase()} />

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            maxWidth: '100%',
                        }}
                    >
                        <Icon
                            name={dueStyle.icon}
                            size={13}
                            color={dueStyle.color}
                        />

                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                                flexShrink: 1,
                                fontFamily: Fonts.Bold,
                                fontSize: 9.5,
                                color: dueStyle.color,
                                marginLeft: 4,
                            }}
                        >
                            {item.due_date || '-'}
                        </Text>
                    </View>
                </View>

                {/* STATUS */}

                <View
                    style={{
                        flex: 1,
                        alignItems: 'flex-end',
                        minWidth: 0,
                    }}
                >
                    <Label title="STATUS" />

                    {isUpdating ? (
                        <ActivityIndicator
                            size="small"
                            color="#6366F1"
                        />
                    ) : (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() =>
                                onStatusPress(item)
                            }
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: `${statusCfg.color}15`,
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 5,
                                maxWidth: '100%',
                            }}
                        >
                            <Icon
                                name={statusCfg.icon}
                                size={12}
                                color={statusCfg.color}
                            />

                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={{
                                    flexShrink: 1,
                                    fontFamily: Fonts.Bold,
                                    fontSize: 9.5,
                                    color: statusCfg.color,
                                    marginLeft: 3,
                                }}
                            >
                                {statusCfg.label}
                            </Text>

                            <Icon
                                name="chevron-down"
                                size={13}
                                color={statusCfg.color}
                                style={{
                                    marginLeft: 2,
                                }}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
});

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyBox = memo(() => (
    <View
        style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            paddingVertical: 48,
            alignItems: 'center',
            marginTop: 4,
        }}
    >
        <View
            style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor:
                    '#f0fdf4',
                justifyContent:
                    'center',
                alignItems:
                    'center',
                marginBottom: 14,
            }}
        >
            <Icon
                name="check-circle-outline"
                size={36}
                color="#16A34A"
            />
        </View>

        <Text
            style={{
                fontSize: 14.5,
                fontFamily:
                    Fonts.Bold,
                color:
                    '#1e293b',
            }}
        >
            No tasks here
        </Text>

        <Text
            style={{
                fontSize: 12,
                fontFamily:
                    Fonts.Regular,
                color:
                    '#94a3b8',
                marginTop: 4,
            }}
        >
            You're all caught up for this filter.
        </Text>
    </View>
));

/* =========================================================
   STATUS MODAL (centered)
========================================================= */

const StatusModal = ({
    visible,
    currentStatus,
    onSelect,
    onClose,
}) => (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableWithoutFeedback onPress={onClose}>
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    justifyContent: 'center',
                    paddingHorizontal: 25,
                }}
            >
                <TouchableWithoutFeedback onPress={() => { }}>
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 16,
                            maxHeight: 420,
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
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <View
                                    style={{
                                        width: 4,
                                        height: 19,
                                        borderRadius: 3,
                                        backgroundColor:
                                            Colors.buttonbgcolor,
                                        marginRight: 8,
                                    }}
                                />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 15,
                                        color: '#272438',
                                    }}
                                >
                                    Change Status
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={onClose}
                                hitSlop={{
                                    top: 8,
                                    bottom: 8,
                                    left: 8,
                                    right: 8,
                                }}
                            >
                                <Icon
                                    name="close"
                                    size={21}
                                    color="#77748A"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* STATUS OPTIONS */}

                        {STATUSES.map(status => {
                            const selected =
                                currentStatus === status.key;

                            return (
                                <TouchableOpacity
                                    key={status.key}
                                    activeOpacity={0.75}
                                    onPress={() =>
                                        onSelect(status.key)
                                    }
                                    style={{
                                        height: 43,
                                        borderWidth: 0.6,
                                        borderColor: selected
                                            ? Colors.buttonbgcolor
                                            : '#E3E0EF',
                                        borderRadius: 9,
                                        paddingHorizontal: 13,
                                        justifyContent:
                                            'space-between',
                                        marginBottom: 7,
                                        backgroundColor: selected
                                            ? '#F1EFFF'
                                            : '#FAF9FF',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily:
                                                Fonts.Medium,
                                            fontSize: 12,
                                            color: selected
                                                ? Colors.buttonbgcolor
                                                : '#39364A',
                                        }}
                                    >
                                        {status.label}
                                    </Text>

                                    {selected && (
                                        <Icon
                                            name="check-circle"
                                            size={18}
                                            color={
                                                Colors.buttonbgcolor
                                            }
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
);

/* =========================================================
   DASHBOARD HEADER
========================================================= */

const DashboardHeader = memo(
    ({
        stats,
        activeTab,
        setActiveTab,
        tabCounts,
    }) => (
        <View>

            {/* STATS */}

            <View style={{ marginBottom: 12 }}>
                {/* Row 1 */}
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 8,
                        marginBottom: 8,
                    }}
                >
                    {[
                        { label: 'Total', value: stats.total, icon: 'clipboard-list-outline', color: '#0284C7' },
                        { label: 'Pending', value: stats.pending, icon: 'timer-sand', color: '#F59E0B' },
                    ].map((item) => (
                        <View
                            key={item.label}
                            style={{
                                flex: 1,
                                backgroundColor: '#fff',
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
                                    backgroundColor: item.color,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon
                                    name={item.icon}
                                    size={20}
                                    color="#fff"
                                />
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 24,
                                        color: '#111827',
                                    }}
                                >
                                    {item.value}
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        fontSize: 11,
                                        color: '#6B7280',
                                        marginTop: 2,
                                    }}
                                >
                                    {item.label}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Row 2 */}
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 8,
                        marginBottom: 8,
                    }}
                >
                    {[
                        { label: 'Progress', value: stats.in_progress, icon: 'sync', color: '#0EA5E9' },
                        { label: 'Review', value: stats.review, icon: 'eye-outline', color: '#14B8A6' },
                    ].map((item) => (
                        <View
                            key={item.label}
                            style={{
                                flex: 1,
                                backgroundColor: '#fff',
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
                                    backgroundColor: item.color,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon
                                    name={item.icon}
                                    size={20}
                                    color="#fff"
                                />
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 24,
                                        color: '#111827',
                                    }}
                                >
                                    {item.value}
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        fontSize: 11,
                                        color: '#6B7280',
                                        marginTop: 2,
                                    }}
                                >
                                    {item.label}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Row 3 */}
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 8,
                    }}
                >
                    {[
                        { label: 'Done', value: stats.done, icon: 'check-circle-outline', color: '#16A34A' },
                        { label: 'Overdue', value: stats.overdue, icon: 'alert-circle-outline', color: '#DC2626' },
                    ].map((item) => (
                        <View
                            key={item.label}
                            style={{
                                flex: 1,
                                backgroundColor: '#fff',
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
                                    backgroundColor: item.color,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon
                                    name={item.icon}
                                    size={20}
                                    color="#fff"
                                />
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 24,
                                        color: '#111827',
                                    }}
                                >
                                    {item.value}
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        fontSize: 11,
                                        color: '#6B7280',
                                        marginTop: 2,
                                    }}
                                >
                                    {item.label}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>



            {/* TABS */}
            <View
                style={{
                    flexDirection: 'row',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: 14,

                    elevation: 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 1 },
                }}
            >
                {TABS.map(tab => {
                    const active = activeTab === tab.key;

                    const count = tabCounts[tab.key] || 0;

                    const tabColor =
                        tab.key === 'today'
                            ? '#F59E0B'
                            : tab.key === 'tomorrow'
                                ? '#0284C7'
                                : '#DC2626';

                    return (
                        <TouchableOpacity
                            key={tab.key}
                            activeOpacity={0.8}
                            onPress={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',

                                paddingVertical: 10,
                                borderRadius: 9,

                                backgroundColor: active
                                    ? Colors.buttonbgcolor
                                    : 'transparent',
                            }}
                        >
                            {/* LABEL + COUNT */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        fontSize: 10.5,
                                        fontFamily: Fonts.Bold,
                                        color: active
                                            ? '#FFFFFF'
                                            : '#475569',
                                    }}
                                >
                                    {tab.label}
                                </Text>

                                {/* COUNT */}
                                <View
                                    style={{
                                        minWidth: 20,
                                        height: 20,
                                        borderRadius: 10,

                                        paddingHorizontal: 6,

                                        alignItems: 'center',
                                        justifyContent: 'center',

                                        marginLeft: 6,

                                        backgroundColor: active
                                            ? 'rgba(255,255,255,0.25)'
                                            : `${tabColor}15`,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            fontFamily: Fonts.Bold,
                                            color: active
                                                ? '#FFFFFF'
                                                : tabColor,
                                        }}
                                    >
                                        {count}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    )
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

const PhotoVideoDashboard = ({
    hideBack: hideBackProp = false,
}) => {
    const navigation =
        useNavigation();

    const route =
        useRoute();

    const hideBack =
        hideBackProp === true ||
        route?.params?.hideBack === true;

    /* =====================================================
       STATES
    ===================================================== */

    const [tasks, setTasks] =
        useState([]);

    const [apiStats, setApiStats] =
        useState({
            total: 0,
            pending: 0,
            in_progress: 0,
            review: 0,
            done: 0,
            overdue: 0,
        });

    const [userType, setUserType] =
        useState('');
    const [userName, setUserName] = useState('');
    const [userInfoLoading, setUserInfoLoading] = useState(true);

    const [activeTab, setActiveTab] =
        useState('today');

    const [refreshing, setRefreshing] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [statusModal, setStatusModal] =
        useState(false);

    const [selectedTask, setSelectedTask] =
        useState(null);

    const [exitModal, setExitModal] =
        useState(false);

    const [apiError, setApiError] =
        useState('');

    const [statusUpdating, setStatusUpdating] =
        useState(false);

    const [updatingTaskId, setUpdatingTaskId] =
        useState(null);

    /* =====================================================
       HARDWARE BACK
    ===================================================== */

    useFocusEffect(
        useCallback(() => {
            if (!hideBack) {
                return;
            }

            const backAction = () => {
                setExitModal(true);
                return true;
            };

            const backHandler =
                BackHandler.addEventListener(
                    'hardwareBackPress',
                    backAction
                );

            return () =>
                backHandler.remove();
        }, [hideBack])
    );

    /* =====================================================
       FETCH USER TYPE
       SAME API AS MENUS
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

    /* =====================================================
       FETCH EDITOR DASHBOARD
    ===================================================== */

    const fetchDashboard =
        useCallback(
            async (
                showLoader = true
            ) => {
                try {
                    if (showLoader) {
                        setLoading(true);
                    }

                    setApiError('');

                    /* -------------------------------------
                       GET USER ID + ROLE
                       SAME AS MENUS
                    ------------------------------------- */

                    const userData =
                        await fetchUserType();

                    console.log(
                        'EDITOR DASHBOARD BODY:',
                        userData
                    );

                    /* -------------------------------------
                       API CALL
                    ------------------------------------- */

                    const response =
                        await fetch(
                            API.editor_dashboard,
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json',
                                },

                                body:
                                    JSON.stringify(
                                        {
                                            uid:
                                                userData.uid,

                                            role:
                                                userData.role,
                                        }
                                    ),
                            }
                        );

                    const result =
                        await response.json();

                    console.log(
                        'EDITOR DASHBOARD RESPONSE:',
                        result
                    );

                    /* -------------------------------------
                       SUCCESS
                    ------------------------------------- */

                    if (
                        result?.status ===
                        true ||
                        result?.status ===
                        'true'
                    ) {
                        /* ===============================
                           STATS
                        =============================== */

                        setApiStats({
                            total:
                                Number(
                                    result
                                        ?.stats
                                        ?.total
                                ) || 0,

                            pending:
                                Number(
                                    result
                                        ?.stats
                                        ?.pending
                                ) || 0,

                            in_progress:
                                Number(
                                    result
                                        ?.stats
                                        ?.in_progress
                                ) || 0,

                            review:
                                Number(
                                    result
                                        ?.stats
                                        ?.review
                                ) || 0,

                            done:
                                Number(
                                    result
                                        ?.stats
                                        ?.done
                                ) || 0,

                            overdue:
                                Number(
                                    result
                                        ?.stats
                                        ?.overdue
                                ) || 0,
                        });

                        /* ===============================
                           TODAY
                        =============================== */

                        const todayTasks =
                            (
                                result
                                    ?.payload
                                    ?.today ||
                                []
                            ).map(
                                item =>
                                    normalizeTask(
                                        item,
                                        'today'
                                    )
                            );

                        /* ===============================
                           TOMORROW
                        =============================== */

                        const tomorrowTasks =
                            (
                                result
                                    ?.payload
                                    ?.tomorrow ||
                                []
                            ).map(
                                item =>
                                    normalizeTask(
                                        item,
                                        'tomorrow'
                                    )
                            );

                        /* ===============================
                           OVERDUE
                        =============================== */

                        const overdueTasks =
                            (
                                result
                                    ?.payload
                                    ?.overdue ||
                                []
                            ).map(
                                item =>
                                    normalizeTask(
                                        item,
                                        'overdue'
                                    )
                            );

                        /* ===============================
                           COMBINE
                        =============================== */

                        setTasks([
                            ...todayTasks,
                            ...tomorrowTasks,
                            ...overdueTasks,
                        ]);

                        /* API ROLE */
                        if (
                            result?.role
                        ) {
                            setUserType(
                                String(
                                    result.role
                                ).trim()
                            );
                        }
                    } else {
                        setTasks([]);

                        setApiError(
                            result?.message ||
                            'Unable to load dashboard.'
                        );
                    }
                } catch (error) {
                    console.log(
                        'EDITOR DASHBOARD ERROR:',
                        error
                    );

                    setTasks([]);

                    if (
                        error?.message ===
                        'User ID not found'
                    ) {
                        setApiError(
                            'User ID not found. Please login again.'
                        );
                    } else if (
                        error?.message ===
                        'User type not found'
                    ) {
                        setApiError(
                            'User type not found. Please login again.'
                        );
                    } else {
                        setApiError(
                            'Something went wrong. Please try again.'
                        );
                    }
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [fetchUserType]
        );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchDashboard(true);
    }, [fetchDashboard]);

    /* =====================================================
       REFRESH
    ===================================================== */

    const onRefresh =
        useCallback(() => {
            setRefreshing(true);

            fetchDashboard(false);
        }, [fetchDashboard]);

    /* =====================================================
       ONLY OPEN TASKS
    ===================================================== */

    const openTasks =
        useMemo(
            () =>
                tasks.filter(
                    item =>
                        item.status !==
                        'done'
                ),
            [tasks]
        );

    /* =====================================================
       TAB COUNTS
    ===================================================== */

    const tabCounts =
        useMemo(
            () => ({
                today:
                    openTasks.filter(
                        item =>
                            item.due_bucket ===
                            'today'
                    ).length,

                tomorrow:
                    openTasks.filter(
                        item =>
                            item.due_bucket ===
                            'tomorrow'
                    ).length,

                overdue:
                    openTasks.filter(
                        item =>
                            item.due_bucket ===
                            'overdue'
                    ).length,
            }),
            [openTasks]
        );

    /* =====================================================
       CURRENT TAB
    ===================================================== */

    const listData =
        useMemo(
            () =>
                openTasks.filter(
                    item =>
                        item.due_bucket ===
                        activeTab
                ),
            [
                openTasks,
                activeTab,
            ]
        );

    /* =====================================================
       STATUS MODAL
    ===================================================== */

    const openStatusModal =
        useCallback(task => {
            setSelectedTask(task);
            setStatusModal(true);
        }, []);

    /* =====================================================
       LOCAL STATUS UPDATE (optimistic + rollback)
    ===================================================== */

    const applyStatusLocally =
        useCallback(
            (task, statusKey) => {
                const oldStatus = task.status;

                // Update tasks list
                setTasks(prev =>
                    prev.map(item =>
                        item.id === task.id
                            ? { ...item, status: statusKey }
                            : item
                    )
                );

                // Update stats
                setApiStats(prev => {
                    const next = { ...prev };

                    // Decrement old status
                    if (oldStatus && next[oldStatus] !== undefined) {
                        next[oldStatus] = Math.max(0, next[oldStatus] - 1);
                    }

                    // Increment new status
                    if (next[statusKey] !== undefined) {
                        next[statusKey] += 1;
                    }

                    // Adjust overdue count if changing from/to done
                    if (task.due_bucket === 'overdue') {
                        if (oldStatus !== 'done' && statusKey === 'done') {
                            next.overdue = Math.max(0, next.overdue - 1);
                        } else if (oldStatus === 'done' && statusKey !== 'done') {
                            next.overdue += 1;
                        }
                    }

                    return next;
                });

                return oldStatus;
            },
            []
        );

    /* =====================================================
       SELECT STATUS – uses API.status_change
       (same API + request pattern as MyEditingTask.js)
    ===================================================== */

    const selectStatus =
        useCallback(
            async statusKey => {
                if (!selectedTask || statusUpdating) {
                    return;
                }

                const task = selectedTask;

                // Optimistic update
                const oldStatus = applyStatusLocally(task, statusKey);

                // Close modal
                setStatusModal(false);
                setSelectedTask(null);
                setStatusUpdating(true);
                setUpdatingTaskId(task.task_id);

                try {
                    // Fetch user data (uid, role) - same as MyEditingTask.js
                    const userData = await fetchUserType();

                    // Convert display key to backend status string
                    const backendStatus = statusToBackend[statusKey] || statusKey;

                    const payload = {
                        uid: userData.uid,
                        role: userData.role || '',
                        task_id: task.task_id,
                        status: backendStatus,
                    };

                    console.log('STATUS CHANGE REQUEST:', payload);

                    const response = await fetch(
                        API.status_change,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                            body: JSON.stringify(payload),
                        }
                    );

                    const result = await response.json();

                    console.log('STATUS CHANGE RESPONSE:', result);

                    const ok =
                        result?.status === true ||
                        result?.status === 'true' ||
                        result?.status === 1 ||
                        result?.code == 200;

                    if (!ok) {
                        throw new Error(
                            result?.message || 'Status update failed'
                        );
                    }
                } catch (error) {
                    console.log('STATUS CHANGE ERROR:', error);

                    // Rollback to old status
                    applyStatusLocally(
                        { ...task, status: statusKey },
                        oldStatus
                    );

                    setApiError(
                        'Could not update status. Please try again.'
                    );
                } finally {
                    setStatusUpdating(false);
                    setUpdatingTaskId(null);
                }
            },
            [selectedTask, statusUpdating, applyStatusLocally, fetchUserType]
        );

    /* =====================================================
       EXIT
    ===================================================== */

    const confirmExit =
        useCallback(() => {
            RNExitApp.exitApp();
        }, []);

    /* =====================================================
       RENDER ITEM
    ===================================================== */

    const renderItem =
        useCallback(
            ({ item, index }) => (
                <TaskCard
                    item={item}
                    index={index}
                    onStatusPress={
                        openStatusModal
                    }
                    isUpdating={
                        updatingTaskId === item.task_id
                    }
                />
            ),
            [openStatusModal, updatingTaskId]
        );

    const keyExtractor =
        useCallback(
            (item, index) =>
                String(
                    item.task_id ||
                    item.id ||
                    index
                ),
            []
        );

    /* =====================================================
       LOADING SCREEN
    ===================================================== */

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor:
                        '#F5F6F8',
                }}
            >
                <StatusBar
                    backgroundColor={
                        Colors.buttonbgcolor
                    }
                    barStyle="light-content"
                />

                {/* HEADER */}

                <View
                    style={{
                        height: 52,
                        backgroundColor:
                            Colors.buttonbgcolor,
                        flexDirection:
                            'row',
                        alignItems:
                            'center',
                        paddingHorizontal: 14,
                    }}
                >
                    {!hideBack ? (
                        <TouchableOpacity
                            activeOpacity={
                                0.7
                            }
                            onPress={() =>
                                navigation.goBack()
                            }
                            style={{
                                width: 30,
                            }}
                        >
                            <Icon
                                name="arrow-left"
                                size={23}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            activeOpacity={
                                0.7
                            }
                            onPress={() =>
                                navigation.navigate(
                                    'Menus'
                                )
                            }
                            style={{
                                width: 30,
                            }}
                        >
                            <Icon
                                name="menu"
                                size={25}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    )}

                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 16,
                            fontFamily:
                                Fonts.Bold,
                            flex: 1,
                            textAlign:
                                'center',
                        }}
                    >
                        Dashboard
                    </Text>

                    <View
                        style={{
                            width: 30,
                        }}
                    />
                </View>

                <View
                    style={{
                        flex: 1,
                        justifyContent:
                            'center',
                        alignItems:
                            'center',
                    }}
                >
                    <ActivityIndicator
                        size="large"
                        color={
                            Colors.buttonbgcolor
                        }
                    />

                    <Text
                        style={{
                            marginTop: 10,
                            fontFamily:
                                Fonts.Medium,
                            fontSize: 12,
                            color:
                                '#64748b',
                        }}
                    >
                        Loading tasks...
                    </Text>
                </View>
            </View>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor:
                    '#F5F6F8',
            }}
        >
            <StatusBar
                backgroundColor={
                    Colors.buttonbgcolor
                }
                barStyle="light-content"
            />

            {/* HEADER */}

            <View
                style={{
                    height: 52,
                    backgroundColor:
                        Colors.buttonbgcolor,
                    flexDirection:
                        'row',
                    alignItems:
                        'center',
                    justifyContent:
                        'space-between',
                    paddingHorizontal: 14,

                    shadowColor:
                        '#000',

                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },

                    shadowOpacity: 0.08,

                    shadowRadius: 4,

                    elevation: 3,
                }}
            >
                {!hideBack ? (
                    <TouchableOpacity
                        activeOpacity={
                            0.7
                        }
                        onPress={() =>
                            navigation.goBack()
                        }
                        style={{
                            width: 30,
                            alignItems:
                                'flex-start',
                            justifyContent:
                                'center',
                        }}
                    >
                        <Icon
                            name="arrow-left"
                            size={23}
                            color="#fff"
                        />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        activeOpacity={
                            0.7
                        }
                        onPress={() =>
                            navigation.navigate(
                                'Menus'
                            )
                        }
                        style={{
                            width: 30,
                            alignItems:
                                'flex-start',
                            justifyContent:
                                'center',
                        }}
                    >
                        <Icon
                            name="menu"
                            size={25}
                            color="#fff"
                        />
                    </TouchableOpacity>
                )}

                <Text
                    style={{
                        color: '#fff',
                        fontSize: 16,
                        fontFamily:
                            Fonts.Bold,
                        flex: 1,
                        textAlign:
                            'center',
                    }}
                >
                    Dashboard
                </Text>

                <View
                    style={{
                        width: 30,
                    }}
                />
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

            {/* ERROR */}

            {!!apiError && (
                <View
                    style={{
                        marginHorizontal: 12,
                        marginTop: 10,
                        backgroundColor:
                            '#FEE2E2',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        flexDirection:
                            'row',
                        alignItems:
                            'center',
                    }}
                >
                    <Icon
                        name="alert-circle-outline"
                        size={18}
                        color="#DC2626"
                    />

                    <Text
                        style={{
                            flex: 1,
                            marginLeft: 7,
                            fontFamily:
                                Fonts.Medium,
                            fontSize: 11.5,
                            color:
                                '#B91C1C',
                        }}
                    >
                        {apiError}
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            fetchDashboard(
                                true
                            )
                        }
                    >
                        <Text
                            style={{
                                fontFamily:
                                    Fonts.Bold,
                                fontSize: 11,
                                color:
                                    '#DC2626',
                            }}
                        >
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* LIST */}

            <FlatList
                data={listData}

                keyExtractor={
                    keyExtractor
                }

                renderItem={
                    renderItem
                }

                ListHeaderComponent={
                    <DashboardHeader
                        stats={
                            apiStats
                        }
                        activeTab={
                            activeTab
                        }
                        setActiveTab={
                            setActiveTab
                        }
                        tabCounts={
                            tabCounts
                        }
                    />
                }

                ListEmptyComponent={
                    <EmptyBox />
                }

                showsVerticalScrollIndicator={
                    false
                }

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
                    padding: 12,
                    paddingBottom: 25,
                    flexGrow: 1,
                }}

                initialNumToRender={
                    10
                }

                maxToRenderPerBatch={
                    10
                }

                windowSize={7}

                removeClippedSubviews={
                    true
                }
            />

            {/* STATUS MODAL (centered) */}

            <StatusModal
                visible={
                    statusModal
                }

                currentStatus={
                    selectedTask?.status
                }

                onSelect={
                    selectStatus
                }

                onClose={() => {
                    setStatusModal(
                        false
                    );

                    setSelectedTask(
                        null
                    );
                }}
            />

            {/* EXIT MODAL */}

            <Modal
                transparent
                visible={
                    exitModal
                }
                animationType="fade"
                onRequestClose={() =>
                    setExitModal(
                        false
                    )
                }
            >
                <TouchableWithoutFeedback
                    onPress={() =>
                        setExitModal(
                            false
                        )
                    }
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor:
                                'rgba(0,0,0,0.5)',
                            justifyContent:
                                'center',
                            alignItems:
                                'center',
                        }}
                    >
                        <TouchableWithoutFeedback
                            onPress={() => { }}
                        >
                            <View
                                style={{
                                    width: '85%',
                                    backgroundColor:
                                        '#fff',
                                    borderRadius:
                                        16,
                                    padding: 20,
                                    elevation:
                                        4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Bold,
                                        fontSize: 16,
                                        color:
                                            '#0F172A',
                                        textAlign:
                                            'center',
                                        marginBottom:
                                            8,
                                    }}
                                >
                                    Confirm Exit
                                </Text>

                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Regular,
                                        fontSize: 14,
                                        color:
                                            '#475569',
                                        textAlign:
                                            'center',
                                        marginBottom:
                                            20,
                                    }}
                                >
                                    Are you sure you
                                    want to exit the
                                    app?
                                </Text>

                                <View
                                    style={{
                                        flexDirection:
                                            'row',
                                        justifyContent:
                                            'center',
                                        gap: 10,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() =>
                                            setExitModal(
                                                false
                                            )
                                        }
                                        style={{
                                            minWidth: 100,
                                            backgroundColor:
                                                '#F1F5F9',
                                            paddingVertical:
                                                8,
                                            borderRadius:
                                                8,
                                            alignItems:
                                                'center',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily:
                                                    Fonts.Medium,
                                                fontSize: 13,
                                                color:
                                                    '#334155',
                                            }}
                                        >
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={
                                            confirmExit
                                        }
                                        style={{
                                            minWidth: 100,
                                            backgroundColor:
                                                '#EF4444',
                                            paddingVertical:
                                                8,
                                            borderRadius:
                                                8,
                                            alignItems:
                                                'center',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily:
                                                    Fonts.Medium,
                                                fontSize: 13,
                                                color:
                                                    '#FFFFFF',
                                            }}
                                        >
                                            Exit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default PhotoVideoDashboard;
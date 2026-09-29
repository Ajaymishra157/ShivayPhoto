import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StatusBar,
    Modal,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    API,
    Colors,
    Fonts,
} from '../Commoncomponent/Constants';

/* =========================================================
   STATUS DISPLAY MAPPING
========================================================= */


const PAGE_SIZE = 20;

// Task text ka character limit — isse zyada hone par card mein
// icon dikhega, full text sirf detail modal mein
const TASK_TRUNCATE_LIMIT = 16;

const statusDisplayMap = {
    'Pending': 'Pending',
    'In Progress': 'In Progress',
    'Review': 'Review',
    'Done': 'Done',
};

const statusBackendMap = {
    'Pending': 'Pending',
    'In Progress': 'In Progress',
    'Review': 'Review',
    'Done': 'Done',
};

/* =========================================================
   FILTER DATA
========================================================= */

const STATUS_OPTIONS = [
    'All Status',
    'Pending',
    'In Progress',
    'Review',
    'Done',
];

const PRIORITY_OPTIONS = [
    'All Priority',
    'High',
    'Medium',
    'Low'


];

/* =========================================================
   API TASK NORMALIZER
========================================================= */

const normalizeEditingTask = (item, index = 0) => {
    const taskId =
        item?.task_id ??
        item?.id ??
        item?.taskId ??
        index;

    return {
        id: String(taskId),
        task_id: taskId,

        booking: item?.order_no
            ? `#${item.order_no}`
            : item?.booking_no
                ? `#${item.booking_no}`
                : '#',

        client:
            item?.client_name ??
            item?.client ??
            '',

        shoot:
            item?.purpose ??
            item?.shoot ??
            '',

        task:
            item?.task_title ??
            item?.task_name ??
            item?.title ??
            '',

        description:
            item?.description ??
            item?.remark ??
            item?.purpose ??
            'No additional details available.',

        stage:
            item?.stage ??
            '-',

        project:
            item?.project ??
            '-',

        type:
            item?.task_type ??
            item?.type ??
            'Photo',

        priority:
            item?.priority ??
            'Medium',

        due:
            item?.due_date_formatted ??
            item?.due_date ??
            'No due date',

        is_overdue:
            item?.is_overdue === true ||
            item?.is_overdue === 1 ||
            item?.is_overdue === '1',

        status:
            item?.status ??
            'Pending',
    };
};

/* =========================================================
   SMALL LABEL (moved outside so TaskCard can use it too)
========================================================= */

const Label = ({ title }) => (
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
);

/* =========================================================
   STATUS / PRIORITY STYLE HELPERS (moved outside so TaskCard
   can use them without depending on component scope)
========================================================= */

const getStatusStyle = status => {
    switch (status) {
        case 'Done':
            return {
                color: '#0F9F68',
                background: '#E4F8EF',
                icon: 'check-circle-outline',
            };

        case 'In Progress':
            return {
                color: '#6366F1',
                background: '#EEECFF',
                icon: 'sync',
            };

        case 'Review':
            return {
                color: '#191b1b',
                background: '#d4ecf0',
                icon: 'backup-restore',
            };

        default:
            return {
                color: '#D98200',
                background: '#FFF2DC',
                icon: 'timer-sand',
            };
    }
};

const getPriorityStyle = priority => {
    switch (priority) {
        case 'Low':
            return {
                color: '#777487',
                background: '#F0EFF5',
            };

        case 'High':
            return {
                color: '#E04A22',
                background: '#FFF0EA',
            };

        case 'Urgent':
            return {
                color: '#D7263D',
                background: '#FFF0F2',
            };

        default:
            return {
                color: '#6366F1',
                background: '#EEECFF',
            };
    }
};

/* =========================================================
   LIST HEADER (top-level component — summary + search/filter + error)
   Kept outside MyEditingTask so its component identity is stable
   across renders; otherwise FlatList remounts it on every keystroke
   and the search TextInput loses focus after one character.
========================================================= */

const ListHeader = ({
    apiError,
    onRetry,
    tasks,
    search,
    setSearch,
    statusFilter,
    priorityFilter,
    setModalType,
}) => (
    <View>
        {/* API ERROR */}

        {!!apiError && (
            <View
                style={{
                    marginHorizontal: 10,
                    marginTop: 9,
                    backgroundColor: '#FEE2E2',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
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
                        fontFamily: Fonts.Medium,
                        fontSize: 11.5,
                        color: '#B91C1C',
                    }}
                >
                    {apiError}
                </Text>

                <TouchableOpacity onPress={onRetry}>
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 11,
                            color: '#DC2626',
                        }}
                    >
                        Retry
                    </Text>
                </TouchableOpacity>
            </View>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        {/* <View
            style={{
                flexDirection: 'row',
                marginHorizontal: 10,
                marginTop: 9,
                marginBottom: 5,
            }}
        >
            

            <View
                style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 9,
                    paddingVertical: 6,
                    paddingHorizontal: 5,
                    marginRight: 5,
                    borderWidth: 0.6,
                    borderColor: '#DCDCFB',
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
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            backgroundColor: '#E0E0FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 4,
                        }}
                    >
                        <Icon
                            name="format-list-bulleted"
                            size={10}
                            color="#6366F1"
                        />
                    </View>

                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            color: '#6366F1',
                        }}
                    >
                        {tasks.length}
                    </Text>
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontFamily: Fonts.Regular,
                        fontSize: 10,
                        color: '#4B5563',
                        marginTop: 3,
                    }}
                >
                    Total
                </Text>
            </View>

  

            <View
                style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 9,
                    paddingVertical: 6,
                    paddingHorizontal: 5,
                    marginRight: 5,
                    borderWidth: 0.6,
                    borderColor: '#FBE7C6',
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
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            backgroundColor: '#FBE7C6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 4,
                        }}
                    >
                        <Icon
                            name="clock-outline"
                            size={10}
                            color="#D98200"
                        />
                    </View>

                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            color: '#D98200',
                        }}
                    >
                        {tasks.filter(x => x.status === 'Pending').length}
                    </Text>
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontFamily: Fonts.Regular,
                        fontSize: 10,
                        color: '#4B5563',
                        marginTop: 3,
                    }}
                >
                    Pending
                </Text>
            </View>

          

            <View
                style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 9,
                    paddingVertical: 6,
                    paddingHorizontal: 5,
                    marginRight: 5,
                    borderWidth: 0.6,
                    borderColor: '#DCDCFB',
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
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            backgroundColor: '#E0E0FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 4,
                        }}
                    >
                        <Icon
                            name="progress-clock"
                            size={10}
                            color="#6366F1"
                        />
                    </View>

                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            color: '#6366F1',
                        }}
                    >
                        {tasks.filter(x => x.status === 'In Progress').length}
                    </Text>
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontFamily: Fonts.Regular,
                        fontSize: 10,
                        color: '#4B5563',
                        marginTop: 3,
                    }}
                >
                    In Progress
                </Text>
            </View>

            

            <View
                style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 9,
                    paddingVertical: 6,
                    paddingHorizontal: 5,
                    marginRight: 5,
                    borderWidth: 0.6,
                    borderColor: '#FADADA',
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
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            backgroundColor: '#FAD4D4',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 4,
                        }}
                    >
                        <Icon
                            name="refresh"
                            size={10}
                            color="#EF233C"
                        />
                    </View>

                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            color: '#EF233C',
                        }}
                    >
                        {tasks.filter(x => x.status === 'Review').length}
                    </Text>
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontFamily: Fonts.Regular,
                        fontSize: 10,
                        color: '#4B5563',
                        marginTop: 3,
                    }}
                >
                    Review
                </Text>
            </View>

          

            <View
                style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 9,
                    paddingVertical: 6,
                    paddingHorizontal: 5,
                    borderWidth: 0.6,
                    borderColor: '#CDEFDA',
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
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            backgroundColor: '#CDEFDA',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 4,
                        }}
                    >
                        <Icon
                            name="check-circle-outline"
                            size={10}
                            color="#16A34A"
                        />
                    </View>

                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 13,
                            color: '#16A34A',
                        }}
                    >
                        {tasks.filter(x => x.status === 'Done').length}
                    </Text>
                </View>

                <Text
                    numberOfLines={1}
                    style={{
                        fontFamily: Fonts.Regular,
                        fontSize: 10,
                        color: '#4B5563',
                        marginTop: 3,
                    }}
                >
                    Done
                </Text>
            </View>
        </View> */}

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <View
            style={{
                paddingHorizontal: 10,
                marginTop: 5,
                marginBottom: 5,
            }}
        >
            {/* SEARCH — full width, apni line mein */}

            <View
                style={{
                    height: 44,
                    backgroundColor: '#fff',
                    borderRadius: 20,
                    borderWidth: 0.6,
                    borderColor: '#E1DDF7',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 11,
                    marginBottom: 5,
                }}
            >
                <Icon
                    name="magnify"
                    size={19}
                    color="#6366F1"
                />

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search booking, client, task, editor…"
                    placeholderTextColor="#9997A8"
                    style={{
                        flex: 1,
                        marginLeft: 6,
                        padding: 0,
                        fontFamily: Fonts.Regular,
                        fontSize: 11.5,
                        color: '#2C2940',
                    }}
                />

                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Icon
                            name="close-circle"
                            size={17}
                            color="#AAA7B8"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* STATUS + PRIORITY — 50/50 niche */}

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* STATUS */}

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setModalType('status')}
                    style={{
                        flex: 1,
                        height: 44,
                        backgroundColor: '#fff',
                        borderWidth: 0.6,
                        borderColor: '#E1DDF7',
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginRight: 6,
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 10.5,
                            color: '#444153',
                            flex: 1,
                        }}
                    >
                        {statusFilter === 'All Status' ? 'Status' : statusFilter}
                    </Text>

                    <Icon
                        name="chevron-down"
                        size={17}
                        color="#4B485B"
                    />
                </TouchableOpacity>

                {/* PRIORITY */}

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setModalType('priority')}
                    style={{
                        flex: 1,
                        height: 44,
                        backgroundColor: '#fff',
                        borderWidth: 0.6,
                        borderColor: '#E1DDF7',
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 10.5,
                            color: '#444153',
                            flex: 1,
                        }}
                    >
                        {priorityFilter === 'All Priority' ? 'Priority' : priorityFilter}
                    </Text>

                    <Icon
                        name="chevron-down"
                        size={17}
                        color="#4B485B"
                    />
                </TouchableOpacity>
            </View>
        </View>
    </View>
);

/* =========================================================
   LIST EMPTY STATE (top-level — same stability reasoning as header)
========================================================= */

const ListEmpty = () => (
    <View
        style={{
            marginHorizontal: 10,
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingVertical: 45,
            alignItems: 'center',
            borderWidth: 0.6,
            borderColor: '#E6E2F1',
        }}
    >
        <Icon
            name="clipboard-search-outline"
            size={38}
            color="#AAA7B8"
        />

        <Text
            style={{
                fontFamily: Fonts.Bold,
                fontSize: 13,
                color: '#39364A',
                marginTop: 8,
            }}
        >
            No tasks found
        </Text>

        <Text
            style={{
                fontFamily: Fonts.Regular,
                fontSize: 9.5,
                color: '#9290A0',
                marginTop: 3,
            }}
        >
            Try changing your search or filters
        </Text>
    </View>
);

/* =========================================================
   TASK CARD (top-level component — not redefined every render)
========================================================= */

const TaskCard = ({
    item,
    index,
    updatingStatusId,
    setStatusChangeTask,
}) => {
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    const statusStyle = getStatusStyle(item.status);
    const priorityStyle = getPriorityStyle(item.priority);
    const displayStatus = statusDisplayMap[item.status] || item.status;

    const isTaskLong = (item.task || '').length > TASK_TRUNCATE_LIMIT;

    return (
        <View
            style={{
                marginHorizontal: 10,
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
                CLIENT + DUE DATE + BOOKING
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
                        marginRight: 8,
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
                        flex: 1.5,
                        minWidth: 0,
                    }}
                >
                    <Label title="CLIENT" />

                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 12,
                            color: '#29263B',
                            textTransform: 'capitalize',
                        }}
                    >
                        {item.client || '-'}
                    </Text>

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
                        {item.shoot || '-'}
                    </Text>
                </View>

                {/* DUE DATE */}

                <View
                    style={{
                        flex: 0.85,
                        minWidth: 0,
                        alignItems: 'center',
                        marginLeft: 5,
                    }}
                >
                    <Label title="DUE DATE" />

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            maxWidth: '100%',
                        }}
                    >
                        <Icon
                            name="calendar-month-outline"
                            size={11}
                            color="#77748A"
                        />

                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                                flexShrink: 1,
                                fontFamily: Fonts.Bold,
                                fontSize: 9.5,
                                color: '#77748A',
                                marginLeft: 3,
                            }}
                        >
                            {item.due || '-'}
                        </Text>
                    </View>
                </View>

                {/* BOOKING */}

                <View
                    style={{
                        flex: 0.85,
                        minWidth: 0,
                        alignItems: 'flex-end',
                        marginLeft: 5,
                    }}
                >
                    <Label title="BOOKING" />

                    <View
                        style={{
                            backgroundColor: '#F1EFFF',
                            borderRadius: 12,
                            paddingHorizontal: 7,
                            paddingVertical: 5,
                            maxWidth: '100%',
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9,
                                color: '#6366F1',
                            }}
                        >
                            {item.booking || '-'}
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
                TASK + PRIORITY + STATUS
            ====================================================== */}

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* TASK */}

                <View
                    style={{
                        flex: 1.4,
                        minWidth: 0,
                        paddingRight: 6,
                    }}
                >
                    <Label title="TASK" />

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            minWidth: 0,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{
                                flexShrink: 1,
                                fontFamily: Fonts.Bold,
                                fontSize: 11.5,
                                color: '#29263B',
                                textTransform: 'capitalize',
                            }}
                        >
                            {item.task || '-'}
                        </Text>

                        {isTaskLong && (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() =>
                                    setDetailModalVisible(true)
                                }
                                hitSlop={{
                                    top: 6,
                                    bottom: 6,
                                    left: 4,
                                    right: 6,
                                }}
                                style={{
                                    marginLeft: 4,
                                }}
                            >
                                <Icon
                                    name="information-outline"
                                    size={15}
                                    color="#6366F1"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* PRIORITY */}

                <View
                    style={{
                        flex: 0.75,
                        minWidth: 0,
                        alignItems: 'center',
                    }}
                >
                    <Label title="PRIORITY" />

                    <View
                        style={{
                            backgroundColor: priorityStyle.background,
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            maxWidth: '100%',
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9,
                                color: priorityStyle.color,
                            }}
                        >
                            {item.priority || '-'}
                        </Text>
                    </View>
                </View>

                {/* STATUS */}

                <View
                    style={{
                        flex: 0.9,
                        minWidth: 0,
                        alignItems: 'flex-end',
                    }}
                >
                    <Label title="STATUS" />

                    {updatingStatusId === item.task_id ? (
                        <ActivityIndicator
                            size="small"
                            color="#6366F1"
                        />
                    ) : (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() =>
                                setStatusChangeTask(item)
                            }
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor:
                                    statusStyle.background,
                                borderRadius: 12,
                                paddingHorizontal: 7,
                                paddingVertical: 5,
                                maxWidth: '100%',
                            }}
                        >
                            <Icon
                                name={statusStyle.icon}
                                size={11}
                                color={statusStyle.color}
                            />

                            <Text
                                numberOfLines={1}
                                style={{
                                    flexShrink: 1,
                                    fontFamily: Fonts.Bold,
                                    fontSize: 9,
                                    color: statusStyle.color,
                                    marginLeft: 3,
                                }}
                            >
                                {displayStatus}
                            </Text>

                            <Icon
                                name="chevron-down"
                                size={12}
                                color={statusStyle.color}
                                style={{
                                    marginLeft: 1,
                                }}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* =====================================================
                TASK DETAIL MODAL
            ====================================================== */}

            <Modal
                visible={detailModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setDetailModalVisible(false)
                }
            >
                <TouchableWithoutFeedback
                    onPress={() =>
                        setDetailModalVisible(false)
                    }
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor:
                                'rgba(0,0,0,0.35)',
                            justifyContent: 'center',
                            paddingHorizontal: 24,
                        }}
                    >
                        <TouchableWithoutFeedback>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 14,
                                    padding: 18,
                                }}
                            >
                                {/* MODAL HEADER */}

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent:
                                            'space-between',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: Fonts.Bold,
                                            fontSize: 15,
                                            color: '#29263B',
                                        }}
                                    >
                                        Task details
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() =>
                                            setDetailModalVisible(
                                                false
                                            )
                                        }
                                    >
                                        <Icon
                                            name="close"
                                            size={20}
                                            color="#77748A"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* CLIENT */}

                                <Label title="CLIENT" />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 13,
                                        color: '#29263B',
                                        textTransform:
                                            'capitalize',
                                        marginBottom: 10,
                                    }}
                                >
                                    {item.client || '-'}
                                </Text>

                                {/* SHOOT */}

                                <Label title="SHOOT" />

                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Regular,
                                        fontSize: 12,
                                        color: '#77748A',
                                        textTransform:
                                            'capitalize',
                                        marginBottom: 10,
                                    }}
                                >
                                    {item.shoot || '-'}
                                </Text>

                                {/* FULL TASK */}

                                <Label title="TASK" />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 13,
                                        color: '#29263B',
                                        textTransform:
                                            'capitalize',
                                        marginBottom: 10,
                                        lineHeight: 18,
                                    }}
                                >
                                    {item.task || '-'}
                                </Text>

                                {/* DUE DATE + BOOKING */}

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        marginBottom: 10,
                                    }}
                                >
                                    {/* DUE DATE */}

                                    <View
                                        style={{
                                            flex: 1,
                                        }}
                                    >
                                        <Label title="DUE DATE" />

                                        <View
                                            style={{
                                                flexDirection:
                                                    'row',
                                                alignItems:
                                                    'center',
                                            }}
                                        >
                                            <Icon
                                                name="calendar-month-outline"
                                                size={13}
                                                color="#77748A"
                                            />

                                            <Text
                                                style={{
                                                    fontFamily:
                                                        Fonts.Bold,
                                                    fontSize: 12,
                                                    color: '#29263B',
                                                    marginLeft: 4,
                                                }}
                                            >
                                                {item.due ||
                                                    '-'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* BOOKING */}

                                    <View
                                        style={{
                                            flex: 1,
                                        }}
                                    >
                                        <Label title="BOOKING" />

                                        <Text
                                            style={{
                                                fontFamily:
                                                    Fonts.Bold,
                                                fontSize: 12,
                                                color: '#29263B',
                                            }}
                                        >
                                            {item.booking ||
                                                '-'}
                                        </Text>
                                    </View>
                                </View>

                                {/* PRIORITY + STATUS */}

                                <View
                                    style={{
                                        flexDirection: 'row',
                                    }}
                                >
                                    {/* PRIORITY */}

                                    <View
                                        style={{
                                            flex: 1,
                                        }}
                                    >
                                        <Label title="PRIORITY" />

                                        <View
                                            style={{
                                                backgroundColor:
                                                    priorityStyle.background,
                                                borderRadius: 12,
                                                paddingHorizontal: 9,
                                                paddingVertical: 5,
                                                alignSelf:
                                                    'flex-start',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily:
                                                        Fonts.Bold,
                                                    fontSize: 9.5,
                                                    color: priorityStyle.color,
                                                }}
                                            >
                                                {item.priority ||
                                                    '-'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* STATUS */}

                                    <View
                                        style={{
                                            flex: 1,
                                        }}
                                    >
                                        <Label title="STATUS" />

                                        <View
                                            style={{
                                                flexDirection:
                                                    'row',
                                                alignItems:
                                                    'center',
                                                backgroundColor:
                                                    statusStyle.background,
                                                borderRadius: 12,
                                                paddingHorizontal: 9,
                                                paddingVertical: 5,
                                                alignSelf:
                                                    'flex-start',
                                            }}
                                        >
                                            <Icon
                                                name={
                                                    statusStyle.icon
                                                }
                                                size={12}
                                                color={
                                                    statusStyle.color
                                                }
                                            />

                                            <Text
                                                style={{
                                                    fontFamily:
                                                        Fonts.Bold,
                                                    fontSize: 9.5,
                                                    color: statusStyle.color,
                                                    marginLeft: 4,
                                                }}
                                            >
                                                {
                                                    displayStatus
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

/* =========================================================
   MAIN
========================================================= */

const MyEditingTask = () => {
    const navigation = useNavigation();

    /* =====================================================
       FILTER STATE
    ===================================================== */

    const [search, setSearch] = useState('');

    const [statusFilter, setStatusFilter] =
        useState('All Status');

    const [priorityFilter, setPriorityFilter] =
        useState('All Priority');

    const [modalType, setModalType] = useState(null);

    /* =====================================================
       STATUS CHANGE MODAL
    ===================================================== */

    const [statusChangeTask, setStatusChangeTask] = useState(null);

    /* =====================================================
       API STATE
    ===================================================== */

    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [apiError, setApiError] =
        useState('');

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loadingMore, setLoadingMore] = useState(false);

    /* =====================================================
       STATUS UPDATE
    ===================================================== */

    const [updatingStatusId, setUpdatingStatusId] =
        useState(null);

    const [statusUpdateError, setStatusUpdateError] =
        useState('');

    /* =====================================================
       FETCH USER TYPE
    ===================================================== */

    const fetchUserType = useCallback(async () => {
        try {
            const userId =
                await AsyncStorage.getItem('id');

            if (!userId) {
                return {
                    uid: '',
                    role: '',
                };
            }

            const response = await fetch(
                API.list_usertype,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify({
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

            let role = '';

            if (
                result?.payload &&
                Array.isArray(result.payload) &&
                result.payload.length > 0
            ) {
                role =
                    result.payload[0]?.user_type ||
                    result.payload[0]?.role ||
                    '';
            }

            return {
                uid: userId,
                role,
            };
        } catch (error) {
            console.log(
                'USER TYPE ERROR:',
                error
            );

            return {
                uid:
                    await AsyncStorage.getItem(
                        'id'
                    ),
                role: '',
            };
        }
    }, []);

    /* =====================================================
       GET API PAYLOAD
    ===================================================== */

    const getTaskPayload = result => {
        if (
            Array.isArray(result?.payload)
        ) {
            return result.payload;
        }

        if (
            Array.isArray(result?.data)
        ) {
            return result.data;
        }

        if (
            Array.isArray(result?.tasks)
        ) {
            return result.tasks;
        }

        if (
            Array.isArray(result?.result)
        ) {
            return result.result;
        }

        return [];
    };

    /* =====================================================
       CHECK API SUCCESS
    ===================================================== */

    const isApiSuccess = result => {
        return (
            result?.status === true ||
            result?.status === 'true' ||
            result?.status === 1 ||
            result?.status === '1' ||
            result?.success === true ||
            result?.success === 'true' ||
            result?.code == 200
        );
    };

    /* =====================================================
       FETCH EDITING TASKS
    ===================================================== */

    const fetchTasks = useCallback(
        async (
            showLoader = true,
            customStatus = statusFilter,
            customPriority = priorityFilter,
            customSearch = search
        ) => {
            try {
                if (showLoader) {
                    setLoading(true);
                }

                setApiError('');

                const {
                    uid,
                    role,
                } = await fetchUserType();

                if (!uid) {
                    setTasks([]);

                    setApiError(
                        'User ID not found. Please login again.'
                    );

                    return;
                }

                /* =========================================
                   FILTER VALUE FOR API
                ========================================= */

                // Convert display status to backend status
                let apiStatus = 'All';
                if (customStatus !== 'All Status') {
                    apiStatus = statusBackendMap[customStatus] || customStatus;
                }

                const apiPriority =
                    customPriority ===
                        'All Priority'
                        ? 'All'
                        : customPriority;

                const apiSearch =
                    customSearch?.trim() || '';

                const requestBody = {
                    uid: Number(uid),
                    role: role || '',
                    status: apiStatus,
                    priority: apiPriority,
                    search: apiSearch,
                };

                console.log(
                    'EDITOR TASK REQUEST:',
                    requestBody
                );

                const response = await fetch(
                    API.editor_tasks,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                            Accept:
                                'application/json',
                        },
                        body: JSON.stringify(
                            requestBody
                        ),
                    }
                );

                const result =
                    await response.json();

                console.log(
                    'EDITOR TASKS RESPONSE:',
                    result
                );

                /* =========================================
                   GET ARRAY FROM RESPONSE
                ========================================= */

                const taskPayload =
                    getTaskPayload(result);

                console.log(
                    'EDITOR TASK PAYLOAD:',
                    taskPayload
                );

                if (
                    isApiSuccess(result) ||
                    taskPayload.length > 0
                ) {
                    const normalized =
                        taskPayload.map(
                            (item, index) =>
                                normalizeEditingTask(
                                    item,
                                    index
                                )
                        );

                    console.log(
                        'NORMALIZED TASKS:',
                        normalized
                    );

                    setTasks(normalized);

                    if (
                        normalized.length === 0
                    ) {
                        setApiError('');
                    }
                } else {
                    setTasks([]);

                    setApiError(
                        result?.message ||
                        result?.error ||
                        'Unable to load tasks.'
                    );
                }
            } catch (error) {
                console.log(
                    'EDITOR TASKS ERROR:',
                    error
                );

                setTasks([]);

                setApiError(
                    'Something went wrong. Please try again.'
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            fetchUserType,
            statusFilter,
            priorityFilter,
            search,
        ]
    );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {
        fetchTasks(
            true,
            'All Status',
            'All Priority',
            ''
        );
    }, []);

    /* =====================================================
       REFRESH
    ===================================================== */

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        fetchTasks(
            false,
            statusFilter,
            priorityFilter,
            search
        );
    }, [
        fetchTasks,
        statusFilter,
        priorityFilter,
        search,
    ]);

    /* =====================================================
       UPDATE STATUS
    ===================================================== */

    const updateTaskStatus = useCallback(
        async (task, newStatus) => {
            if (
                task.status === newStatus
            ) {
                return;
            }

            try {
                setStatusUpdateError('');

                setUpdatingStatusId(
                    task.task_id
                );

                const {
                    uid,
                    role,
                } = await fetchUserType();

                if (!uid) {
                    setStatusUpdateError(
                        'User ID not found.'
                    );

                    return;
                }

                const requestBody = {
                    uid: Number(uid),
                    role: role || '',
                    task_id: task.task_id,
                    status: newStatus,  // newStatus is backend value
                };

                console.log(
                    'STATUS CHANGE REQUEST:',
                    requestBody
                );

                const response =
                    await fetch(
                        API.status_change,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type':
                                    'application/json',
                                Accept:
                                    'application/json',
                            },
                            body: JSON.stringify(
                                requestBody
                            ),
                        }
                    );

                const result =
                    await response.json();

                console.log(
                    'STATUS CHANGE RESPONSE:',
                    result
                );

                if (
                    result?.status === true ||
                    result?.status === 'true' ||
                    result?.status === 1 ||
                    result?.code == 200
                ) {
                    setTasks(prev =>
                        prev.map(t =>
                            String(
                                t.task_id
                            ) ===
                                String(
                                    task.task_id
                                )
                                ? {
                                    ...t,
                                    status:
                                        newStatus,
                                }
                                : t
                        )
                    );
                } else {
                    setStatusUpdateError(
                        result?.message ||
                        'Unable to update status.'
                    );
                }
            } catch (error) {
                console.log(
                    'STATUS CHANGE ERROR:',
                    error
                );

                setStatusUpdateError(
                    'Something went wrong. Please try again.'
                );
            } finally {
                setUpdatingStatusId(null);
                setStatusChangeTask(null); // close modal
            }
        },
        [fetchUserType]
    );

    /* =====================================================
       FILTER TASKS LOCALLY
    ===================================================== */

    const filteredTasks = useMemo(() => {
        const q =
            search
                .trim()
                .toLowerCase();

        return tasks.filter(item => {
            const searchMatch =
                !q ||
                String(
                    item.booking || ''
                )
                    .toLowerCase()
                    .includes(q) ||
                String(
                    item.client || ''
                )
                    .toLowerCase()
                    .includes(q) ||
                String(
                    item.task || ''
                )
                    .toLowerCase()
                    .includes(q) ||
                String(
                    item.description || ''
                )
                    .toLowerCase()
                    .includes(q) ||
                String(
                    item.type || ''
                )
                    .toLowerCase()
                    .includes(q) ||
                String(
                    item.stage || ''
                )
                    .toLowerCase()
                    .includes(q);

            const statusMatch =
                statusFilter ===
                'All Status' ||
                // compare display status
                statusDisplayMap[item.status] === statusFilter;

            const priorityMatch =
                priorityFilter ===
                'All Priority' ||
                item.priority ===
                priorityFilter;

            return (
                searchMatch &&
                statusMatch &&
                priorityMatch
            );
        });
    }, [
        tasks,
        search,
        statusFilter,
        priorityFilter,
    ]);

    const visibleTasks = useMemo(() => {
        return filteredTasks.slice(0, visibleCount);
    }, [filteredTasks, visibleCount]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search, statusFilter, priorityFilter]);

    /* =====================================================
       FILTER MODAL
    ===================================================== */

    const modalData =
        modalType === 'status'
            ? STATUS_OPTIONS
            : PRIORITY_OPTIONS;

    const modalTitle =
        modalType === 'status'
            ? 'Select Status'
            : 'Select Priority';

    /* =====================================================
       SELECT FILTER
    ===================================================== */

    const selectFilter =
        async value => {
            if (
                modalType === 'status'
            ) {
                setStatusFilter(value);

                setModalType(null);

                await fetchTasks(
                    true,
                    value,
                    priorityFilter,
                    search
                );
            } else {
                setPriorityFilter(value);

                setModalType(null);

                await fetchTasks(
                    true,
                    statusFilter,
                    value,
                    search
                );
            }
        };

    /* =====================================================
       STATUS CHANGE HANDLER
    ===================================================== */

    const handleStatusChange = (displayStatus) => {
        if (!statusChangeTask) return;
        const backendStatus = statusBackendMap[displayStatus] || displayStatus;
        updateTaskStatus(statusChangeTask, backendStatus);
    };

    /* =====================================================
       LOAD MORE (pagination)
    ===================================================== */

    const loadMoreTasks = () => {
        if (loadingMore) return;
        if (visibleCount >= filteredTasks.length) return;

        setLoadingMore(true);

        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredTasks.length));
            setLoadingMore(false);
        }, 400); // chhota delay taaki loader dikhe
    };

    const renderListFooter = () => {
        if (!loadingMore) return null;

        return (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
            </View>
        );
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: '#F7F6FB',
                }}
            >
                <StatusBar
                    backgroundColor={Colors.buttonbgcolor}
                    barStyle="light-content"
                />

                <View
                    style={{
                        backgroundColor: Colors.buttonbgcolor,
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom: 16,
                        borderBottomLeftRadius: 18,
                        borderBottomRightRadius: 18,
                        position: 'relative',
                    }}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 36,
                            height: 36,
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            name="arrow-left"
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <View
                        style={{
                            position: 'absolute',
                            left: 55,
                            right: 55,
                            top: 16,
                            bottom: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 17,
                                color: '#fff',
                            }}
                        >
                            My Editing Tasks
                        </Text>

                    </View>
                </View>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <ActivityIndicator
                        size="large"
                        color={Colors.buttonbgcolor}
                    />

                    <Text
                        style={{
                            marginTop: 10,
                            fontFamily: Fonts.Medium,
                            fontSize: 12,
                            color: '#64748b',
                        }}
                    >
                        Loading tasks...
                    </Text>
                </View>
            </View>
        );
    }

    /* =====================================================
       RETURN
    ===================================================== */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#F7F6FB',
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
                    backgroundColor: Colors.buttonbgcolor,
                    paddingHorizontal: 14,
                    paddingTop: 13,
                    paddingBottom: 13,
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                    position: 'relative',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* BACK */}

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 32,
                            height: 32,
                            justifyContent: 'center',
                            zIndex: 2,
                        }}
                    >
                        <Icon
                            name="arrow-left"
                            size={21}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    {/* COUNT */}

                </View>

                {/* CENTER TITLE */}

                <View
                    style={{
                        position: 'absolute',
                        left: 55,
                        right: 55,
                        top: 13,
                        bottom: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 17,
                            color: '#fff',
                            textAlign: 'center',
                        }}
                    >
                        My Editing Tasks
                    </Text>


                </View>
            </View>

            {/* =================================================
                BODY — FlatList (pagination + windowing)
            ================================================= */}

            <FlatList
                data={visibleTasks}
                keyboardShouldPersistTaps="handled"
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                    <TaskCard
                        item={item}
                        index={index}
                        updatingStatusId={updatingStatusId}
                        setStatusChangeTask={setStatusChangeTask}
                    />
                )}
                ListHeaderComponent={
                    <ListHeader
                        apiError={apiError}
                        onRetry={() =>
                            fetchTasks(
                                true,
                                statusFilter,
                                priorityFilter,
                                search
                            )
                        }
                        tasks={tasks}
                        search={search}
                        setSearch={setSearch}
                        statusFilter={statusFilter}
                        priorityFilter={priorityFilter}
                        setModalType={setModalType}
                    />
                }
                ListEmptyComponent={<ListEmpty />}
                ListFooterComponent={renderListFooter}
                onEndReached={loadMoreTasks}
                onEndReachedThreshold={0.4}
                showsVerticalScrollIndicator={false}

                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.buttonbgcolor]}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: 25,
                }}
            />

            {/* =====================================================
                FILTER MODAL (Status / Priority)
            ===================================================== */}

            <Modal
                visible={modalType !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setModalType(null)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setModalType(null)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        justifyContent: 'center',
                        paddingHorizontal: 25,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
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
                                    {modalTitle}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setModalType(null)}
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

                        {/* FILTER OPTIONS */}

                        <FlatList
                            data={modalData}
                            keyExtractor={item => item}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const selected =
                                    modalType === 'status'
                                        ? statusFilter === item
                                        : priorityFilter === item;

                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() =>
                                            selectFilter(item)
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
                                                fontFamily: Fonts.Medium,
                                                fontSize: 12,
                                                color: selected
                                                    ? Colors.buttonbgcolor
                                                    : '#39364A',
                                            }}
                                        >
                                            {item}
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
                            }}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* =====================================================
                STATUS CHANGE MODAL (for a single task)
            ===================================================== */}

            <Modal
                visible={statusChangeTask !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setStatusChangeTask(null)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setStatusChangeTask(null)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        justifyContent: 'center',
                        paddingHorizontal: 25,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
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
                                        backgroundColor: Colors.buttonbgcolor,
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
                                onPress={() => setStatusChangeTask(null)}
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

                        <FlatList
                            data={STATUS_OPTIONS.filter(
                                s => s !== 'All Status'
                            )}
                            keyExtractor={item => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const currentDisplay = statusChangeTask
                                    ? statusDisplayMap[
                                    statusChangeTask.status
                                    ]
                                    : '';

                                const selected =
                                    currentDisplay === item;

                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() =>
                                            handleStatusChange(item)
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
                                                fontFamily: Fonts.Medium,
                                                fontSize: 12,
                                                color: selected
                                                    ? Colors.buttonbgcolor
                                                    : '#39364A',
                                            }}
                                        >
                                            {item}
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
                            }}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default MyEditingTask;
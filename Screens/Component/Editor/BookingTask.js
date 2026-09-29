import React, { memo, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StatusBar,
    Modal,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

const PAGE_SIZE = 20; // client-side pagination size — API se pura data ek baar mein aata hai, hum ise chunks mein dikhate hain

/* =========================================================
   STATUS BADGE (top-level — modal aur card dono mein use hota hai)
========================================================= */

const StatusBadge = ({ status }) => {
    let color = '#77748a';
    let background = '#f2f1f6';

    if (status === 'Pending') {
        color = '#D98200';
        background = '#FFF2DC';
    }

    if (status === 'In Progress') {
        color = '#2563EB';
        background = '#EAF2FF';
    }

    if (status === 'Review') {
        color = '#7C3AED';
        background = '#F0EAFE';
    }

    if (status === 'Done') {
        color = '#16A34A';
        background = '#E5F8EF';
    }

    return (
        <View
            style={{
                backgroundColor: background,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                alignSelf: 'flex-start',
            }}
        >
            <Text
                style={{
                    fontFamily: Fonts.Bold,
                    fontSize: 8,
                    color,
                    textTransform: 'capitalize'
                }}
            >
                {status || 'No Task'}
            </Text>
        </View>
    );
};

/* =========================================================
   TASK TYPE BADGE (top-level)
========================================================= */

const TaskTypeBadge = ({ type }) => {
    const isPhoto = type === 'Photo';

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isPhoto ? '#EEECFF' : '#EAF2FF',
                borderRadius: 12,
                paddingHorizontal: 7,
                paddingVertical: 4,
            }}
        >
            <Icon
                name={isPhoto ? 'image-outline' : 'video-outline'}
                size={12}
                color={isPhoto ? '#6366F1' : '#2563EB'}
            />

            <Text
                style={{
                    fontFamily: Fonts.Bold,
                    fontSize: 7.5,
                    color: isPhoto ? '#6366F1' : '#2563EB',
                    marginLeft: 3,
                }}
            >
                {type}
            </Text>
        </View>
    );
};

/* =========================================================
   TASK CARD (top-level, memoized — FlatList renderItem ke liye)
========================================================= */

const TaskCard = memo(({ item, index }) => {
    const photoTask = item?.photo_task;
    const videoTask = item?.video_task;

    const hasPhoto = !!photoTask;
    const hasVideo = !!videoTask;

    return (
        <View
            style={{
                backgroundColor: '#fff',
                marginHorizontal: 12,
                marginBottom: 7,
                borderRadius: 10,
                borderWidth: 0.5,
                borderColor: '#e5e3ed',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: 1,
                overflow: 'hidden',
            }}
        >
            {/* TOP */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 9,
                    paddingTop: 8,
                    paddingBottom: 6,
                }}
            >
                {/* NUMBER */}
                <View
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        backgroundColor: '#EEECFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 9,
                            color: '#6366F1',
                        }}
                    >
                        {index + 1}
                    </Text>
                </View>

                {/* BOOKING */}
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 12,
                            color: '#29263b',
                            textTransform: 'capitalize'
                        }}
                        numberOfLines={1}
                    >
                        #{item?.order_no || '-'} · {item?.client_name || '-'}
                        {' - '}
                        {item?.mobile_no || '-'}
                    </Text>
                </View>

                {/* STATUS — sirf tab dikhega jab koi task na ho */}
                {!hasPhoto && !hasVideo && <StatusBadge />}
            </View>

            {/* DIVIDER */}
            <View
                style={{
                    height: 0.5,
                    backgroundColor: '#eeeaf5',
                }}
            />

            {/* TASK CONTENT */}
            <View
                style={{
                    paddingHorizontal: 9,
                    paddingVertical: 8,
                }}
            >
                {/* CLIENT REQUIREMENTS */}
                {!!item?.client_requirements && (
                    <View
                        style={{
                            backgroundColor: '#FFF8E7',
                            borderRadius: 8,
                            padding: 8,
                            marginBottom: 7,
                            borderWidth: 0.5,
                            borderColor: '#F3E7C4',
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                        }}
                    >
                        <Icon
                            name="text-box-outline"
                            size={13}
                            color="#B8860B"
                            style={{ marginTop: 1 }}
                        />

                        <View style={{ marginLeft: 7, flex: 1 }}>
                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    fontSize: 9,
                                    color: '#B8860B',
                                    marginBottom: 2,
                                }}
                            >
                                CLIENT REQUIREMENTS
                            </Text>

                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 11,
                                    color: '#6b5a1f',
                                    lineHeight: 14,
                                    textTransform: 'capitalize'
                                }}
                            >
                                {item.client_requirements}
                            </Text>
                        </View>
                    </View>
                )}

                {/* PHOTO TASK */}
                {hasPhoto && (
                    <View
                        style={{
                            backgroundColor: '#faf9ff',
                            borderRadius: 8,
                            padding: 8,
                            marginBottom: hasVideo ? 6 : 0,
                            borderWidth: 0.5,
                            borderColor: '#eeeaf5',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 4,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TaskTypeBadge type="Photo" />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 10.5,
                                        color: '#302d42',
                                        marginLeft: 6,
                                    }}
                                >
                                    Photo Editing
                                </Text>
                            </View>

                            <StatusBadge status={photoTask.status} />
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 5,
                            }}
                        >
                            <Icon
                                name="account-outline"
                                size={13}
                                color="#706c80"
                            />

                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 11,
                                    color: '#666275',
                                    marginLeft: 4,
                                    flex: 1,
                                    textTransform: 'capitalize'
                                }}
                                numberOfLines={1}
                            >
                                {photoTask.assigned_name || 'Not Assigned'}
                            </Text>
                        </View>

                        {photoTask.due_date_display && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 4,
                                }}
                            >
                                <Icon
                                    name="calendar-outline"
                                    size={12}
                                    color={photoTask.is_overdue ? '#EF233C' : '#77748a'}
                                />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        fontSize: 11,
                                        color: photoTask.is_overdue ? '#EF233C' : '#77748a',
                                        marginLeft: 4,
                                    }}
                                >
                                    Due: {photoTask.due_date_display}
                                    {photoTask.is_overdue ? ' · Overdue' : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* VIDEO TASK */}
                {hasVideo && (
                    <View
                        style={{
                            backgroundColor: '#faf9ff',
                            borderRadius: 8,
                            padding: 8,
                            borderWidth: 0.5,
                            borderColor: '#eeeaf5',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 4,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TaskTypeBadge type="Video" />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 10.5,
                                        color: '#302d42',
                                        marginLeft: 6,
                                    }}
                                >
                                    Video Editing
                                </Text>
                            </View>

                            <StatusBadge status={videoTask.status} />
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 5,
                            }}
                        >
                            <Icon
                                name="account-outline"
                                size={13}
                                color="#706c80"
                            />

                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 11,
                                    color: '#666275',
                                    marginLeft: 4,
                                    flex: 1,
                                    textTransform: 'capitalize'
                                }}
                                numberOfLines={1}
                            >
                                {videoTask.assigned_name || 'Not Assigned'}
                            </Text>
                        </View>

                        {videoTask.due_date_display && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 4,
                                }}
                            >
                                <Icon
                                    name="calendar-outline"
                                    size={12}
                                    color={videoTask.is_overdue ? '#EF233C' : '#77748a'}
                                />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Regular,
                                        fontSize: 11,
                                        color: videoTask.is_overdue ? '#EF233C' : '#77748a',
                                        marginLeft: 4,
                                    }}
                                >
                                    Due: {videoTask.due_date_display}
                                    {videoTask.is_overdue ? ' · Overdue' : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* NO TASK */}
                {!hasPhoto && !hasVideo && (
                    <View
                        style={{
                            backgroundColor: '#faf9ff',
                            borderRadius: 8,
                            padding: 9,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 11,
                                color: '#302d42',
                            }}
                        >
                            No editor task assigned
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
});

/* =========================================================
   LIST HEADER — search bar (top-level, stable identity so the
   TextInput never remounts/loses focus on re-render)
========================================================= */

const ListHeader = ({ search, setSearch }) => (
    <View
        style={{
            flexDirection: 'row',
            marginHorizontal: 12,
            marginTop: 12,
            marginBottom: 10,
        }}
    >
        <View
            style={{
                flex: 1,
                height: 40,
                backgroundColor: '#fff',
                borderRadius: 20,
                borderWidth: 0.6,
                borderColor: '#e1ddf0',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
            }}
        >
            <Icon name="magnify" size={18} color="#6366F1" />

            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search booking, client, task..."
                placeholderTextColor="#9997a8"
                style={{
                    flex: 1,
                    marginLeft: 7,
                    padding: 0,
                    fontFamily: Fonts.Regular,
                    fontSize: 9.5,
                    color: '#2c2940',
                }}
                returnKeyType="search"
                blurOnSubmit={false}
            />

            {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                    <Icon name="close-circle" size={16} color="#aaa7b8" />
                </TouchableOpacity>
            )}
        </View>
    </View>
);

/* =========================================================
   LIST FOOTER — load more indicator (top-level)
========================================================= */

const ListFooter = ({ hasMore }) => {
    if (!hasMore) return null;

    return (
        <View
            style={{
                paddingVertical: 16,
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
                Loading more...
            </Text>
        </View>
    );
};

/* =========================================================
   EMPTY STATE (top-level)
========================================================= */

const ListEmpty = ({ loading }) => {
    if (loading) return null;

    return (
        <View
            style={{
                backgroundColor: '#fff',
                marginHorizontal: 12,
                borderRadius: 11,
                paddingVertical: 45,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: '#e5e3ed',
            }}
        >
            <Icon name="clipboard-search-outline" size={38} color="#aaa7b8" />

            <Text
                style={{
                    fontFamily: Fonts.Bold,
                    fontSize: 13,
                    color: '#39364a',
                    marginTop: 8,
                }}
            >
                No tasks found
            </Text>

            <Text
                style={{
                    fontFamily: Fonts.Regular,
                    fontSize: 9.5,
                    color: '#9290a0',
                    marginTop: 3,
                }}
            >
                Try another search
            </Text>
        </View>
    );
};

/* =========================================================
   MAIN
========================================================= */

const BookingTask = () => {
    const navigation = useNavigation();

    const [search, setSearch] = useState('');
    const [bookingTasks, setBookingTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(false);

    // client-side pagination state
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    /* =====================================================
       FETCH API — poora data ek hi baar aata hai, koi API-side
       page/offset param nahi bheja jaata
    ===================================================== */

    const fetchBookingTasks = async () => {
        try {
            setLoading(true);

            const adminId = await AsyncStorage.getItem('id');

            const formData = new FormData();
            formData.append('admin_id', adminId || '');

            const response = await fetch(API.booking_task, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            console.log('booking_task RESPONSE:', JSON.stringify(result, null, 2));

            if (result?.status === true) {
                setBookingTasks(
                    Array.isArray(result?.payload) ? result.payload : []
                );
            } else {
                setBookingTasks([]);
            }
        } catch (error) {
            console.log('booking_task ERROR:', error);

            setBookingTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingTasks();
    }, []);

    /* =====================================================
       SEARCH — poore fetched data par locally filter hota hai
    ===================================================== */

    const filteredTasks = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) {
            return bookingTasks;
        }

        return bookingTasks.filter(item => {
            return (
                String(item?.order_no || '').toLowerCase().includes(q) ||
                String(item?.client_name || '').toLowerCase().includes(q) ||
                String(item?.mobile_no || '').toLowerCase().includes(q) ||
                String(item?.client_requirements || '').toLowerCase().includes(q) ||
                String(item?.photo_task?.assigned_name || '').toLowerCase().includes(q) ||
                String(item?.video_task?.assigned_name || '').toLowerCase().includes(q)
            );
        });
    }, [search, bookingTasks]);

    /* =====================================================
       CLIENT-SIDE PAGINATED SLICE
       Search change hote hi visibleCount reset ho jayega
    ===================================================== */

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search]);

    const visibleTasks = useMemo(
        () => filteredTasks.slice(0, visibleCount),
        [filteredTasks, visibleCount]
    );

    const hasMore = visibleCount < filteredTasks.length;

    const loadMore = () => {
        if (!hasMore) return;
        setVisibleCount(prev => prev + PAGE_SIZE);
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
                    backgroundColor: Colors.buttonbgcolor,
                    paddingHorizontal: 14,
                    paddingTop: 13,
                    paddingBottom: 14,
                    borderBottomLeftRadius: 17,
                    borderBottomRightRadius: 17,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        position: 'relative',
                    }}
                >
                    {/* BACK */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 32,
                            height: 32,
                            justifyContent: 'center',
                            zIndex: 2,
                        }}
                    >
                        <Icon name="arrow-left" size={21} color="#fff" />
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
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 18,
                                color: '#fff',
                                textAlign: 'center',
                            }}
                        >
                            Booking Tasks
                        </Text>


                    </View>
                </View>
            </View>

            {/* =================================================
                BODY — FlatList with client-side pagination
            ================================================= */}

            {loading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />

                    <Text
                        style={{
                            fontFamily: Fonts.Regular,
                            fontSize: 12,
                            color: '#888497',
                            marginTop: 8,
                        }}
                    >
                        Loading booking tasks...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={visibleTasks}
                    keyExtractor={(item, index) =>
                        `${item?.client_id}-${item?.order_no}-${index}`
                    }
                    renderItem={({ item, index }) => (
                        <TaskCard item={item} index={index} />
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 25 }}
                    ListHeaderComponent={
                        <ListHeader search={search} setSearch={setSearch} />
                    }
                    ListFooterComponent={<ListFooter hasMore={hasMore} />}
                    ListEmptyComponent={<ListEmpty loading={loading} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    initialNumToRender={PAGE_SIZE}
                    maxToRenderPerBatch={PAGE_SIZE}
                    windowSize={7}
                    removeClippedSubviews={true}
                />
            )}

            {/* =================================================
                TASK DETAIL MODAL
            ================================================= */}

            <Modal
                visible={selectedTask !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedTask(null)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        justifyContent: 'flex-end',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            paddingHorizontal: 15,
                            paddingTop: 12,
                            paddingBottom: 25,
                        }}
                    >
                        {/* HANDLE */}
                        <View
                            style={{
                                width: 38,
                                height: 4,
                                borderRadius: 4,
                                backgroundColor: '#ddd9e8',
                                alignSelf: 'center',
                                marginBottom: 14,
                            }}
                        />

                        {/* HEADER */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 16,
                                        color: '#29263b',
                                    }}
                                >
                                    Task Details
                                </Text>

                                {selectedTask && (
                                    <Text
                                        style={{
                                            fontFamily: Fonts.Regular,
                                            fontSize: 9,
                                            color: '#77748a',
                                            marginTop: 2,
                                        }}
                                    >
                                        Booking #{selectedTask.order_no}
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={() => setSelectedTask(null)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: '#f4f2fa',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon name="close" size={18} color="#666276" />
                            </TouchableOpacity>
                        </View>

                        {selectedTask && (
                            <View style={{ marginTop: 15 }}>
                                {/* CLIENT */}
                                <View
                                    style={{
                                        backgroundColor: '#f7f5ff',
                                        borderRadius: 10,
                                        padding: 11,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: Fonts.Regular,
                                            fontSize: 8.5,
                                            color: '#77748a',
                                        }}
                                    >
                                        CLIENT
                                    </Text>

                                    <Text
                                        style={{
                                            fontFamily: Fonts.Bold,
                                            fontSize: 12,
                                            color: '#302d42',
                                            marginTop: 4,
                                        }}
                                    >
                                        {selectedTask.client_name}
                                    </Text>
                                </View>

                                {/* DETAILS */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        marginTop: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#faf9ff',
                                            borderRadius: 9,
                                            padding: 10,
                                            marginRight: 5,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 8,
                                                color: '#858194',
                                            }}
                                        >
                                            BOOKING NO
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 10,
                                                color: '#3b384b',
                                                marginTop: 3,
                                            }}
                                        >
                                            #{selectedTask.order_no}
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#faf9ff',
                                            borderRadius: 9,
                                            padding: 10,
                                            marginLeft: 5,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 8,
                                                color: '#858194',
                                            }}
                                        >
                                            MOBILE
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 10,
                                                color: '#3b384b',
                                                marginTop: 3,
                                            }}
                                        >
                                            {selectedTask.mobile_no || '-'}
                                        </Text>
                                    </View>
                                </View>

                                {/* PHOTO TASK */}
                                {selectedTask.photo_task && (
                                    <View
                                        style={{
                                            marginTop: 8,
                                            borderWidth: 0.6,
                                            borderColor: '#e5e1ef',
                                            borderRadius: 10,
                                            padding: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: Fonts.Bold,
                                                    fontSize: 10,
                                                    color: '#39364a',
                                                }}
                                            >
                                                Photo Task
                                            </Text>

                                            <StatusBadge status={selectedTask.photo_task.status} />
                                        </View>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 9,
                                                color: '#77748a',
                                            }}
                                        >
                                            Assigned To
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 9,
                                                color: '#39364a',
                                                marginTop: 3,
                                            }}
                                        >
                                            {selectedTask.photo_task.assigned_name}
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 9,
                                                color: '#77748a',
                                                marginTop: 7,
                                            }}
                                        >
                                            Due Date
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 9,
                                                color: selectedTask.photo_task.is_overdue
                                                    ? '#EF233C'
                                                    : '#39364a',
                                                marginTop: 3,
                                            }}
                                        >
                                            {selectedTask.photo_task.due_date_display}
                                        </Text>
                                    </View>
                                )}

                                {/* VIDEO TASK */}
                                {selectedTask.video_task && (
                                    <View
                                        style={{
                                            marginTop: 8,
                                            borderWidth: 0.6,
                                            borderColor: '#e5e1ef',
                                            borderRadius: 10,
                                            padding: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: Fonts.Bold,
                                                    fontSize: 10,
                                                    color: '#39364a',
                                                }}
                                            >
                                                Video Task
                                            </Text>

                                            <StatusBadge status={selectedTask.video_task.status} />
                                        </View>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 9,
                                                color: '#77748a',
                                            }}
                                        >
                                            Assigned To
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 9,
                                                color: '#39364a',
                                                marginTop: 3,
                                            }}
                                        >
                                            {selectedTask.video_task.assigned_name}
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 9,
                                                color: '#77748a',
                                                marginTop: 7,
                                            }}
                                        >
                                            Due Date
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 9,
                                                color: selectedTask.video_task.is_overdue
                                                    ? '#EF233C'
                                                    : '#39364a',
                                                marginTop: 3,
                                            }}
                                        >
                                            {selectedTask.video_task.due_date_display}
                                        </Text>
                                    </View>
                                )}

                                {/* REQUIREMENTS */}
                                {selectedTask.client_requirements ? (
                                    <View
                                        style={{
                                            marginTop: 8,
                                            borderWidth: 0.6,
                                            borderColor: '#e5e1ef',
                                            borderRadius: 10,
                                            padding: 10,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 8,
                                                color: '#77748a',
                                            }}
                                        >
                                            CLIENT REQUIREMENTS
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 9,
                                                color: '#39364a',
                                                marginTop: 5,
                                                lineHeight: 15,
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {selectedTask.client_requirements}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default BookingTask;
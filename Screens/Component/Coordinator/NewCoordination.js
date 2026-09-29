import React, { useState, useEffect, memo, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, ActivityIndicator, } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import Toast from 'react-native-toast-message';
import Shimmer from '../Shimmer/Coordinator/Shimmer';


/*
=========================================================
IMPORTANT
=========================================================
Agar aapke project mein API ka import already kisi aur
file/path se hai to neeche wali API import line ko apne
actual path ke according change karna.

Example:
import API from '../Commoncomponent/API';

Ya agar named export hai:
import { API } from '../Commoncomponent/API';

=========================================================
YE FILE MEIN NAYA API ADD KARNA HOGA (Constants.js mein):
=========================================================
coordination_booking_detail: `${BASE_URL}coordination/coordination_booking_detail.php`,

Iske alawa "update_stage" aur "assign_photographer" API keys
pehle se maan li gayi hain (jaisa purani file mein thi).
=========================================================
*/


/* =========================================================
   STAGES
   NOTE: stage_no (API) 1-6 seedha is array ke index se
   match hota hai (1 = concept ... 6 = done). Agar backend
   mein order kabhi badle to yahan bhi update karna.
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


/* =========================================================
   PREPARATION STAGES (CHECKBOXES)
   NOTE: "Preparation Stages" ab dropdown nahi hai — sirf yeh
   3 stages checkbox ke through select hote hain. Jab tak
   teeno checked na ho, stageNotes API me null jayega
   (update_stage payload me).
========================================================= */

const PREP_STAGES = STAGES.filter(item =>
    ['concept', 'outfit', 'props'].includes(item.key)
);


/* =========================================================
   DEFAULT/FALLBACK PHOTOGRAPHERS
   Real "photographers" array API se fetch hone tak dropdown
   khaali rehta hai — koi bhi dummy/fake naam yahan nahi
   dikhna chahiye.
========================================================= */

const DEFAULT_PHOTOGRAPHERS = [];


const NOTES_MAX = 300;


/* =========================================================
   DATE FORMAT
========================================================= */

const fmtDisplay = (d) => {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
        return '';
    }

    return `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;
};

const fmtDueDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month} ${d.getFullYear()}`;
};

/* =========================================================
   ACTIVITY HELPERS
========================================================= */

const getDisplayAction = (action = '') => {
    if (action.trim().toLowerCase() === 'coordinator -> editor assigned' ||
        action.trim().toLowerCase() === 'coordinator → editor assigned') {
        return 'Coordinator Post Production Assigned';
    }
    return action;
};

const getActivityMeta = (action = '') => {
    const a = action.toLowerCase();

    if (a.includes('assigned')) {
        return { icon: 'camera-outline', color: '#0284C7', bg: '#e0f2fe' };
    }
    if (a.includes('stage updated')) {
        return { icon: 'flag-variant', color: '#16A34A', bg: '#dcfce7' };
    }
    if (a.includes('status updated')) {
        return { icon: 'progress-clock', color: '#F59E0B', bg: '#fef3c7' }; // 👈 fixed
    }
    if (a === 'photographer') {
        return { icon: 'check-decagram-outline', color: '#16A34A', bg: '#dcfce7' };
    }
    return { icon: 'information-outline', color: '#64748b', bg: '#f1f5f9' };
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';

    const date = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;

    const diffMonth = Math.floor(diffDay / 30);
    return `${diffMonth}mo ago`;
};

const fmtActivityDate = (dateStr) => {
    if (!dateStr) return '';

    const date = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year} · ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};


/* =========================================================
   SAFE DATE
========================================================= */

const getSafeDate = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;
};


/* =========================================================
   INFO ROW
========================================================= */

const InfoRow = memo(({ icon, label, value }) => {
    return (
        <View style={st.infoRowGrid}>

            <View style={st.infoIconWrap}>
                <Icon
                    name={icon}
                    size={14}
                    color={Colors.buttonbgcolor}
                />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>

                <Text style={st.infoLabel} numberOfLines={1}>
                    {label}
                </Text>

                <Text
                    numberOfLines={2}
                    style={st.infoValue}
                >
                    {value || '--'}
                </Text>

            </View>

        </View>
    );
});


/* =========================================================
   SELECT ROW
========================================================= */

const SelectRow = memo(
    ({
        label,
        required,
        value,
        placeholder,
        leftIcon,
        onPress,
        disabled,
        disabledHint,
    }) => {

        return (
            <View>

                <Text style={st.fieldLabel}>
                    {label}

                    {required && (
                        <Text style={st.req}> *</Text>
                    )}
                </Text>

                <TouchableOpacity
                    style={[
                        st.selectBox,
                        disabled && st.selectBoxDisabled,
                    ]}
                    onPress={disabled ? undefined : onPress}
                    activeOpacity={disabled ? 1 : 0.8}
                >

                    <View style={st.selectBoxInner}>

                        {leftIcon ? (
                            <Icon
                                name={leftIcon}
                                size={17}
                                color={
                                    disabled
                                        ? '#94a3b8'
                                        : Colors.buttonbgcolor
                                }
                                style={{ marginRight: 7 }}
                            />
                        ) : null}

                        <Text
                            style={[
                                st.selectText,
                                disabled
                                    ? st.selectTextDisabled
                                    : !value
                                        ? st.selectTextPlaceholder
                                        : null,
                            ]}
                        >
                            {value || placeholder}
                        </Text>

                    </View>

                    <Icon
                        name={
                            disabled
                                ? 'lock-outline'
                                : 'chevron-down'
                        }
                        size={17}
                        color="#94a3b8"
                    />

                </TouchableOpacity>

                {disabled && disabledHint ? (
                    <Text style={st.disabledHint}>
                        {disabledHint}
                    </Text>
                ) : null}

            </View>
        );
    }
);


/* =========================================================
   SELECT MODAL
========================================================= */

const SelectModal = memo(
    ({
        visible,
        onClose,
        title,
        data,
        selected,
        onSelect,
    }) => {

        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >

                <TouchableOpacity
                    style={st.modalOverlay}
                    activeOpacity={1}
                    onPress={onClose}
                >

                    <View
                        style={st.modalBox}
                        onStartShouldSetResponder={() => true}
                    >

                        <Text style={st.modalTitle}>
                            {title}
                        </Text>
                        <TouchableOpacity style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 10,
                            padding: 6,
                        }} onPress={onClose}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>

                        <FlatList
                            data={data || []}
                            keyExtractor={(item, index) =>
                                String(item?.value ?? index)
                            }
                            style={st.modalList}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            initialNumToRender={10}
                            windowSize={5}
                            renderItem={({ item }) => {

                                const isSelected =
                                    selected === item.value;

                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            onSelect(item.value);
                                            onClose();
                                        }}
                                        style={[
                                            st.modalItem,
                                            isSelected &&
                                            st.modalItemSel,
                                        ]}
                                    >

                                        <Text
                                            style={[
                                                st.modalItemText,
                                                isSelected &&
                                                st.modalItemTextSel,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>

                                        {isSelected && (
                                            <Icon
                                                name="check"
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

                    </View>

                </TouchableOpacity>

            </Modal>
        );
    }
);


/* =========================================================
   PIPELINE ITEM
========================================================= */

const PipelineItem = memo(
    ({
        item,
        index,
        currentStageIndex,
        completedStageKeys,   // ⬅ NEW
        onPress,
    }) => {

        const isExplicitlyDone = completedStageKeys?.includes(item.key);   // ⬅ NEW
        const done = isExplicitlyDone || index < currentStageIndex;         // ⬅ CHANGED
        const active = index === currentStageIndex && !isExplicitlyDone;    // ⬅ CHANGED
        const isLast = index === STAGES.length - 1;

        return (
            <View
                style={{
                    width: 80,
                    alignItems: 'center',
                    position: 'relative',
                }}
            >

                {/* ================= LINE ================= */}
                {!isLast && (
                    <View
                        style={{
                            position: 'absolute',

                            // Circle ke center se line
                            top: 17,

                            // Circle ke right edge se start
                            left: 40,

                            // Next circle tak
                            width: 40 + 40,

                            height: 2,

                            backgroundColor: done
                                ? Colors.buttonbgcolor
                                : '#e2e8f0',

                            zIndex: 0,
                        }}
                    />
                )}

                {/* ================= ICON ================= */}
                <TouchableOpacity
                    onPress={() => onPress(item.key)}
                    activeOpacity={0.8}
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,

                        backgroundColor: done
                            ? '#22c55e'
                            : active
                                ? Colors.buttonbgcolor
                                : '#f1f5f9',

                        borderWidth: 1,

                        borderColor: done
                            ? '#22c55e'
                            : active
                                ? Colors.buttonbgcolor
                                : '#e2e8f0',

                        alignItems: 'center',
                        justifyContent: 'center',

                        zIndex: 2,
                    }}
                >
                    <Icon
                        name={done ? 'check' : item.icon}
                        size={15}
                        color={
                            done || active
                                ? '#fff'
                                : '#94a3b8'
                        }
                    />
                </TouchableOpacity>

                {/* ================= LABEL ================= */}
                <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    style={{
                        width: 60,

                        marginTop: 4,

                        textAlign: 'center',

                        fontSize: 9,
                        lineHeight: 11,

                        color:
                            done || active
                                ? Colors.buttonbgcolor
                                : '#64748b',

                        fontFamily:
                            done || active
                                ? Fonts.Bold
                                : Fonts.Regular,
                    }}
                >
                    {item.label}
                </Text>

            </View>
        );
    }
);

/* =========================================================
   ACTIVITY ITEM
========================================================= */
/* =========================================================
   ACTIVITY ITEM
========================================================= */

const ActivityItem = memo(({ item, isLast }) => {

    const meta = getActivityMeta(item.action);
    const displayAction = getDisplayAction(item.action);

    return (
        <View style={st.activityRow}>

            <View style={st.activityIconCol}>
                <View style={[st.activityIconWrap, { backgroundColor: meta.bg }]}>
                    <Icon name={meta.icon} size={14} color={meta.color} />
                </View>

                {!isLast && <View style={st.activityConnector} />}
            </View>

            <View style={{ flex: 1, paddingBottom: isLast ? 4 : 16 }}>

                <View style={st.activityTopRow}>
                    <Text style={st.activityAction} numberOfLines={1}>
                        {displayAction}
                    </Text>

                    <Text style={st.activityTimeAgo}>
                        {timeAgo(item.time)}
                    </Text>
                </View>

                <View style={st.activityBottomRow}>
                    <Text style={st.activityDetails} numberOfLines={2}>
                        {item.details}
                    </Text>

                    {!!item.user && (
                        <View style={st.userChip}>
                            <Icon name="account-outline" size={10} color="#64748b" />
                            <Text style={st.userChipText}>{item.user}</Text>
                        </View>
                    )}
                </View>

                <Text style={st.activityFullTime}>
                    {fmtActivityDate(item.time)}
                </Text>

            </View>

        </View>
    );
});


/* =========================================================
   ACTIVITY ITEM — SHIMMER (loading state)
========================================================= */

const ActivityItemShimmer = memo(({ isLast }) => {

    return (
        <View style={st.activityRow}>

            <View style={st.activityIconCol}>
                <Shimmer width={26} height={26} style={{ borderRadius: 13 }} />
                {!isLast && <View style={st.activityConnector} />}
            </View>

            <View style={{ flex: 1, paddingBottom: isLast ? 4 : 16 }}>
                <Shimmer width="55%" height={11} style={{ marginBottom: 6 }} />
                <Shimmer width="75%" height={10} style={{ marginBottom: 6 }} />
                <Shimmer width="30%" height={9} />
            </View>

        </View>
    );
});

/* =========================================================
   MAIN SCREEN
========================================================= */

const NewCoordination = () => {

    const navigation = useNavigation();
    const route = useRoute();

    const bookingData = route?.params?.bookingData;
    // console.log("booking Data", bookingData);

    const isEdit = !!bookingData;

    /*
     * admin_id = login ke waqt AsyncStorage mein save kiya
     * gaya logged-in user ka id (handleLogin -> AsyncStorage.
     * setItem('id', ...)). Isko neeche useEffect mein load
     * karke state mein set kiya jaata hai.
     */
    const [adminId, setAdminId] = useState(0);
    const [userType, setUserType] = useState('');
    const [userTypeLoaded, setUserTypeLoaded] = useState(false);

    const [editorTasks, setEditorTasks] = useState([]);
    const [taskProgress, setTaskProgress] = useState({ total: 0, completed: 0, percent: 0 });

    /* =====================================================
       INITIAL STAGE
    ===================================================== */

    const getInitialStage = () => {

        if (!bookingData) {
            return 'concept';
        }

        const incomingStage =
            bookingData.stage_key ||
            bookingData.stageKey ||
            bookingData.current_stage_key ||
            bookingData.currentStage;

        if (
            incomingStage &&
            STAGES.some(
                item => item.key === incomingStage
            )
        ) {
            return incomingStage;
        }

        /*
         If backend is sending label instead of key
        */
        const incomingLabel =
            bookingData.stage ||
            bookingData.stage_name ||
            bookingData.current_stage;

        const matchedStage = STAGES.find(
            item =>
                item.label === incomingLabel
        );

        if (matchedStage) {
            return matchedStage.key;
        }

        return 'concept';
    };

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');
            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId }),
            });
            const result = await res.json();
            if (result.code == 200 && result.payload.length > 0) {
                setUserType(result.payload[0].user_type);
            } else {
                setUserType('');
            }
        } catch (e) {
            setUserType('');
        } finally {
            setUserTypeLoaded(true);
        }
    };


    const [stage, setStage] = useState(
        getInitialStage()
    );

    const [photographer, setPhotographer] =
        useState(
            bookingData?.photographer_name || ''
        );

    const [photographerId, setPhotographerId] =
        useState(
            Number(
                bookingData?.photographer_id || 0
            )
        );

    const [photographersList, setPhotographersList] =
        useState(DEFAULT_PHOTOGRAPHERS);

    const [stageNotes, setStageNotes] =
        useState(
            bookingData?.stageNotes || ''
        );

    /*
     Preparation Stages checkboxes (Concept Finalized,
     Outfit Finalized, Props Ready). Value = array of
     selected stage labels.
     Agar bookingData/API se already selected stages aaye
     hain (e.g. bookingData.stages array of labels), unhe
     yahan prefill karte hain — warna khaali array.
    */
    const [selectedPrepStages, setSelectedPrepStages] =
        useState(() => {
            const incoming =
                bookingData?.stages ||
                bookingData?.preparation_stages ||
                [];

            if (!Array.isArray(incoming)) {
                return [];
            }

            return PREP_STAGES
                .map(item => item.label)
                .filter(label => incoming.includes(label));
        });

    const [confirmedPrepStages, setConfirmedPrepStages] = useState([]);

    const [completedStageKeys, setCompletedStageKeys] = useState([]);   // ⬅ NEW

    const [photographerNotes, setPhotographerNotes] =
        useState(
            bookingData?.photographerNotes || ''
        );

    const [shootDate, setShootDate] =
        useState(
            getSafeDate(
                bookingData?.shoot_date ||
                bookingData?.shootDate ||
                bookingData?.booking_date
            )
        );

    const [shootMonth, setShootMonth] =
        useState(
            bookingData?.shoot_month ||
            ''
        );


    const [salesPerson, setSalesPerson] =
        useState(
            bookingData?.coordinator_name || ''
        );

    const [activities, setActivities] =
        useState([]);

    const [apiBooking, setApiBooking] =
        useState(null);

    const [showDatePicker, setShowDatePicker] =
        useState(false);

    const [stageModal, setStageModal] =
        useState(false);

    const [photographerModal, setPhotographerModal] =
        useState(false);

    const [updatingStage, setUpdatingStage] =
        useState(false);

    const [assigningPhotographer, setAssigningPhotographer] =
        useState(false);

    const [loadingDetail, setLoadingDetail] =
        useState(false);



    const [showAllActivities, setShowAllActivities] = useState(false);

    const ACTIVITY_PREVIEW_COUNT = 5;

    const visibleActivities = showAllActivities
        ? activities
        : activities.slice(0, ACTIVITY_PREVIEW_COUNT);

    /* =====================================================
       FETCH BOOKING / COORDINATION DETAIL
    ===================================================== */
    const getClientId = (data) => data?.client_id ?? data?.clientId ?? null;

    useEffect(() => {
        const init = async () => {
            const storedId = await AsyncStorage.getItem('id');
            const loggedInAdminId = storedId ? Number(storedId) : 0;
            setAdminId(loggedInAdminId);

            fetchUserType();

            if (getClientId(bookingData)) {          // 👈 change
                fetchBookingDetail(loggedInAdminId);
            }
        };
        init();
    }, []);


    const fetchBookingDetail = async (adminIdParam) => {

        const effectiveAdminId = adminIdParam ?? adminId;

        console.log('fetchBookingDetail CALLED — client_id:', bookingData?.client_id, '| admin_id:', effectiveAdminId);

        try {

            setLoadingDetail(true);

            const payload = {
                client_id: getClientId(bookingData),   // 👈 change (pehle bookingData.client_id tha)
                admin_id: effectiveAdminId,
            };
            console.log('FETCH BOOKING DETAIL PAYLOAD:', payload);

            const res = await fetch(
                API.coordination_booking_detail,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await res.json();


            if (
                result?.code == 200 ||
                result?.status === true
            ) {
                applyBookingDetail(result?.data, result?.login_type);
            } else {

                Toast.show({
                    type: 'error',
                    text1:
                        result?.message ||
                        'Failed to load booking detail',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            }

        } catch (error) {

            console.log(
                'Fetch Booking Detail Error:',
                error
            );

            Toast.show({
                type: 'error',
                text1: 'Network Error',
                text2:
                    'Unable to load booking detail',
                position: 'bottom',
                bottomOffset: 60,
            });

        } finally {

            setLoadingDetail(false);
        }
    };


    const applyBookingDetail = (data, loginType) => {

        if (!data) {
            return;
        }

        const b = data.booking || {};
        const coord = data.coordination || {};
        const assign = data.photographer_assignment || {};
        const photogList = data.photographers || [];
        const activityList = data.activities || [];

        const taskData = data.tasks || {};   // ✅ naam consistent kar diya

        setEditorTasks(
            (taskData.items || []).map(t => ({
                id: t.id,
                title: t.title || '',
                description: t.description || '',
                assignedName: t.assigned_name || '-',
                taskType: t.task_type || '',
                priority: t.priority || '',
                dueDate: t.due_date || null,
                status: t.status || 'Pending',
                isOverdue: !!t.is_overdue,
            }))
        );

        setTaskProgress({
            total: Number(taskData.total) || 0,
            completed: Number(taskData.completed) || 0,
            percent: Number(taskData.progress_percent) || 0,
        });

        setApiBooking(b);

        /*
         Stage: API stage_no (1-6) STAGES array ke index se
         seedha match hota hai. Fallback stage_name/label match.
        */
        /*
    stage_notes array se actual completed stages count karke
    current stage nikaalte hain — b.stage_no kabhi kabhi backend
    se stale/purana aa sakta hai (jaise Client Requirements +
    Shoot Assignment complete hone ke baad bhi stage_no=3 aana).
   */
        const apiCurrentStage =
            (coord.current_stage || b.stage_name || '').trim().toLowerCase();

        const apiSaysDone = apiCurrentStage === 'done';

        const photographerDone =
            apiSaysDone ||
            String(assign.assignment_status || '').toLowerCase() === 'completed' ||
            !!assign.completed_at;

        const stageNotesForIndex = (
            Array.isArray(coord.stage_notes) ? coord.stage_notes : []
        ).map(n =>
            n.stage === 'Shoot Assignment' && !photographerDone
                ? { ...n, status: 'Pending' }
                : n
        );

        const completedKeys = STAGES
            .filter(s => {
                const note = stageNotesForIndex.find(
                    n => n.stage === s.label
                );

                return note && note.status === 'Completed';
            })
            .map(s => s.key);


        // ✅ API agar current stage / stage name "Done" bhejti hai
        // to Done ko bhi completed mark karo


        if (apiCurrentStage === 'done' && photographerDone && !completedKeys.includes('done')) {
            completedKeys.push('done');
        }

        setCompletedStageKeys(completedKeys);

        let computedIndex = null;

        if (stageNotesForIndex.length) {
            let idx = 0;

            for (let i = 0; i < STAGES.length; i++) {
                const note = stageNotesForIndex.find(
                    n => n.stage === STAGES[i].label
                );

                if (note && note.status === 'Completed') {
                    idx = i + 1;   // agla stage current ban jayega
                } else {
                    break;   // pehla incomplete stage mila, ruk jao
                }
            }

            computedIndex = Math.min(idx, STAGES.length - 1);
        }

        // const isCoordinator =
        //     (loginType || '').trim().toLowerCase() === 'coordinator';

        // const shootIdx = STAGES.findIndex(item => item.key === 'shoot');

        // if (
        //     computedIndex !== null &&
        //     !isCoordinator &&
        //     computedIndex > shootIdx
        // ) {
        //     computedIndex = shootIdx;
        // }

        if (computedIndex !== null) {
            setStage(STAGES[computedIndex].key);
        } else if (b.stage_no && STAGES[b.stage_no - 1]) {
            setStage(STAGES[b.stage_no - 1].key);
        } else if (coord.current_stage || b.stage_name) {

            const matched = STAGES.find(
                item =>
                    item.label === (coord.current_stage || b.stage_name)
            );

            if (matched) {
                setStage(matched.key);
            }
        }

        if (photogList.length) {

            setPhotographersList(
                photogList.map(p => ({
                    label: p.name,
                    value: Number(p.id),
                }))
            );
        }

        setPhotographer(b.photographer_name || '');
        setPhotographerId(Number(b.photographer_id) || 0);

        const shootAssignmentStageNote = (coord.stage_notes || []).find(
            n => n.stage === 'Shoot Assignment'
        );

        // 🔧 FIX: agar "Shoot Assignment" entry stage_notes me mil gayi,
        // to uska notes hi use karo (empty string bhi valid value hai).
        // assign.notes sirf tab use karo jab stage_notes me entry hi na ho.
        setPhotographerNotes(
            shootAssignmentStageNote
                ? (shootAssignmentStageNote.notes || '')
                : (assign.notes || '')
        );

        const assignedDate =
            assign.booking_date ||
            b.shoot_date ||
            b.shootDate ||
            null;

        setShootDate(getSafeDate(assignedDate));

        setShootMonth(
            b.shoot_month ||
            ''
        );

        /*
         Current stage ke notes coordination.stage_notes
         array se prefill karte hain (agar mil jaye).
        */
        const currentStageLabel =
            (STAGES[(b.stage_no || 1) - 1] || STAGES[0]).label;

        const matchedNote = (coord.stage_notes || []).find(
            n => n.stage === currentStageLabel
        );

        /*
         * Priority:
         * 1. booking.remark
         * 2. current stage ka stage_notes
         * 3. empty
         */
        setStageNotes(
            b.remark?.trim()
                ? b.remark
                : matchedNote?.notes || ''
        );

        /*
         Preparation stage checkboxes prefill.
         NOTE: agar API "coordination.stages" (ya kisi aur
         key) me already-selected stage labels bhejti hai to
         yahan uska naam according adjust kar lena — abhi
         coord.stages fallback maan ke chal rahe hain.
        */
        // Preparation stages API se stage_notes ke status ke according
        // checked honge.
        const stageNotesList = Array.isArray(coord.stage_notes)
            ? coord.stage_notes
            : [];

        const completedPrepStages = stageNotesList
            .filter(item => item?.status === 'Completed')
            .map(item => item?.stage)
            .filter(Boolean);

        console.log(
            'COMPLETED PREPARATION STAGES:',
            completedPrepStages
        );

        setSelectedPrepStages(
            PREP_STAGES
                .map(item => item.label)
                .filter(label =>
                    completedPrepStages.includes(label)
                )
        );
        setConfirmedPrepStages(
            PREP_STAGES
                .map(item => item.label)
                .filter(label =>
                    completedPrepStages.includes(label)
                )
        );

        setSalesPerson(b.coordinator_name || '');

        setActivities(
            activityList.map((a, index) => ({
                id: String(index),
                action: a.action || 'Activity',
                details: a.details || '',
                user: a.user_name || '',
                time: a.created_at || '',
            }))
        )
    };


    /* =====================================================
       CURRENT STAGE
    ===================================================== */

    const currentStageIndex = useMemo(() => {

        const index = STAGES.findIndex(
            item => item.key === stage
        );

        return index >= 0 ? index : 0;

    }, [stage]);

    const editorWorkflowStatus = useMemo(() => {
        if (!editorTasks.length) {
            return { label: 'Pending Editor Assignment', color: '#D98200', bg: '#fff2dc' };
        }
        const allDone = editorTasks.every(t => t.status === 'Done');
        if (allDone) {
            return { label: 'Editor Work Completed', color: '#16A34A', bg: '#dcfce7' };
        }
        return { label: 'Editor In Progress', color: '#6366F1', bg: '#eeecff' };
    }, [editorTasks]);


    const currentStageObj =
        STAGES[currentStageIndex] || STAGES[0];


    const requirementsIndex =
        STAGES.findIndex(
            item => item.key === 'requirements'
        );


    // NAYA:
    const photographerEnabled = useMemo(
        () =>
            PREP_STAGES.every(item =>
                confirmedPrepStages.includes(item.label)
            ),
        [confirmedPrepStages]
    );


    /* =====================================================
       PREPARATION STAGES CHECKBOX HELPERS
    ===================================================== */

    const togglePrepStage = (label) => {
        // Server se already confirmed/completed stage ko uncheck nahi kar sakte
        if (confirmedPrepStages.includes(label)) {
            return;
        }

        // Client Requirements ke baad stage update locked
        if (currentStageIndex >= requirementsIndex) {
            return;
        }

        setSelectedPrepStages(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)   // 👈 ab uncheck bhi ho sakega
                : [...prev, label]
        );
    };

    const allPrepStagesChecked = useMemo(
        () =>
            PREP_STAGES.every(item =>
                selectedPrepStages.includes(item.label)
            ),
        [selectedPrepStages]
    );

    const isPrepStageDisabled = (label) => {
        // Sirf server-confirmed stage disabled/locked rahegi
        if (confirmedPrepStages.includes(label)) {
            return true;
        }

        if (currentStageIndex >= requirementsIndex) {
            return true;
        }

        return false;
    };

    const stageUpdateDisabled = useMemo(() => {
        return currentStageIndex >= requirementsIndex;
    }, [currentStageIndex, requirementsIndex]);

    /* =====================================================
       BOOKING DATA
       (API se aaya apiBooking pehle use hota hai, uske baad
       navigation param bookingData, uske baad hi hardcoded
       fallback dikhta hai.)
    ===================================================== */

    const originalBooking = useMemo(() => {

        const b = apiBooking || bookingData || {};

        const eventDate = getSafeDate(b.booking_date);

        const venueLine = [b.purpose, b.client_address]
            .filter(Boolean)
            .join(' - ');

        return {
            bookingNo: b.order_no || b.id || '',
            client: b.client_name || '',
            clientContact: b.mobile_no || '',           // 👈 naya
            coordinatorName: b.coordinator_name || 'Not Assigned',   // 👈 naya
            photographerName: b.photographer_name || 'Not Assigned', // 👈 naya
            editorCoordinatorName: b.editor_coordinator_name || 'Not Assigned', // 👈 naya

            eventType: b.purpose || '',
            eventDate: (eventDate && fmtDisplay(eventDate)) || '',
            venue: venueLine || '',
            package: b.remark || '',
            totalAmount: (b.booking_amount && `₹${b.booking_amount}`) || '',
            advancePaid: '',
            balance: '',
        };

    }, [apiBooking, bookingData]);


    /* =====================================================
       HANDLE STAGE CHANGE
    ===================================================== */

    const handleStageChange = (newStage) => {

        if (
            !STAGES.some(
                item => item.key === newStage
            )
        ) {
            return;
        }

        setStage(newStage);

        /*
         * If user moves back before requirements,
         * photographer assignment should be cleared
         * from UI because it is locked again.
         */
        const newIndex = STAGES.findIndex(
            item => item.key === newStage
        );

        if (newIndex < requirementsIndex) {
            setPhotographer('');
            setPhotographerId(0);
            setShootDate(null);
            setPhotographerNotes('');
        }
    };


    /* =====================================================
       UPDATE STAGE API
    ===================================================== */
    /* =====================================================
    COMBINED UPDATE (stage + photographer, ek hi button se)
 ===================================================== */
    const handleUpdate = async () => {

        if (!getClientId(bookingData)) {
            Toast.show({
                type: 'error',
                text1: 'Booking ID not found',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }

        if (updatingStage || assigningPhotographer) return;

        // Client Requirements stage cross ho chuka ho to prep stages ki zaroorat
        // nahi — sirf usi case mein empty selection ka error dikhana hai.


        try {
            setUpdatingStage(true);

            /* ---- 1) UPDATE STAGE API ----
               Sirf tab hit hogi jab koi naya (abhi tak confirm na kiya gaya)
               prep stage checked ho. Warna skip — lekin function yahan ruk
               nahi jaata, Photographer API neeche fir bhi chalegi. */
            const newlyCheckedStages = selectedPrepStages.filter(
                label => !confirmedPrepStages.includes(label)
            );

            let stageOk = true;
            let stageResult = null;

            if (newlyCheckedStages.length) {

                const stagePayload = {
                    client_id: Number(getClientId(bookingData)),
                    admin_id: adminId,
                    stages: newlyCheckedStages.map(label => ({
                        stage: label,
                        notes: '',
                    })),
                    notes: '',
                };

                console.log('UPDATE STAGE PAYLOAD:', JSON.stringify(stagePayload, null, 2));

                const stageRes = await fetch(API.update_stage, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(stagePayload),
                });
                stageResult = await stageRes.json();
                console.log('UPDATE STAGE RESPONSE:', JSON.stringify(stageResult, null, 2));

                stageOk = stageResult?.code == 200 && stageResult?.status === true;
            }

            /* ---- 2) ASSIGN PHOTOGRAPHER API ----
               Photographer select kiya ho YA sirf Client Requirements notes
               likhe/change kiye ho — dono cases mein yeh API chalni chahiye. */
            let photographerOk = true;
            let photographerResult = null;

            const trimmedNotes = photographerNotes?.trim() || '';
            const shouldCallPhotographerApi = photographerId || trimmedNotes;   // 🔧 photographerEnabled hataya

            if (shouldCallPhotographerApi) {
                setAssigningPhotographer(true);

                const bookingDate = shootDate
                    ? `${shootDate.getFullYear()}-${String(shootDate.getMonth() + 1).padStart(2, '0')}-${String(shootDate.getDate()).padStart(2, '0')}`
                    : '';

                const photographerPayload = {
                    client_id: Number(getClientId(bookingData)),
                    photographer_id: Number(photographerId) || 0,
                    booking_date: bookingDate,
                    shoot_month: shootDate ? '' : (shootMonth || ''),
                    notes: trimmedNotes,
                    admin_id: Number(adminId),
                };

                console.log('ASSIGN PHOTOGRAPHER PAYLOAD:', photographerPayload);

                const photographerRes = await fetch(API.assign_photographer, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(photographerPayload),
                });
                photographerResult = await photographerRes.json();
                console.log('ASSIGN PHOTOGRAPHER RESPONSE:', photographerResult);

                photographerOk =
                    photographerResult?.status === true ||
                    photographerResult?.status == 200 ||
                    photographerResult?.code == 200;

                setAssigningPhotographer(false);
            }

            // Agar dono hi API mein se koi bhi call nahi hui (koi nayi cheez update
            // hi nahi ki gayi), tabhi yeh "kuch nahi hua" wala case hai.
            if (!newlyCheckedStages.length && !shouldCallPhotographerApi) {
                Toast.show({
                    type: 'error',
                    text1: 'Nothing to update',
                    position: 'bottom',
                    bottomOffset: 60,
                });
                setUpdatingStage(false);
                return;
            }

            /* ---- TOAST ---- */
            if (stageOk && photographerOk) {
                Toast.show({
                    type: 'success',
                    text1: 'Updated Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            } else if (!stageOk) {
                Toast.show({
                    type: 'error',
                    text1: stageResult?.message || 'Failed to update stage',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            } else if (!photographerOk) {
                Toast.show({
                    type: 'error',
                    text1: photographerResult?.message || 'Failed to assign photographer',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            }

            await fetchBookingDetail(adminId);

        } catch (error) {
            console.log('Update Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Network Error',
                text2: 'Unable to update',
                position: 'bottom',
                bottomOffset: 60,
            });
        } finally {
            setUpdatingStage(false);
            setAssigningPhotographer(false);
        }
    };


    /* =====================================================
       ASSIGN PHOTOGRAPHER API
    ===================================================== */

    const handleAssignPhotographer = async () => {

        if (!photographerEnabled) {
            Toast.show({
                type: 'error',
                text1: 'Photographer Assignment Locked',
                text2: 'Please complete Client Requirements first.',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }

        if (!getClientId(bookingData)) {
            Toast.show({
                type: 'error',
                text1: 'Booking ID not found',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }

        if (!photographerId) {
            Toast.show({
                type: 'error',
                text1: 'Please select a Photographer',
                position: 'bottom',
                bottomOffset: 60,
            });
            return;
        }

        if (assigningPhotographer) return;

        try {

            setAssigningPhotographer(true);

            // API format => YYYY-MM-DD
            const bookingDate = shootDate
                ? `${shootDate.getFullYear()}-${String(shootDate.getMonth() + 1).padStart(2, '0')}-${String(shootDate.getDate()).padStart(2, '0')}`
                : '';

            const payload = {
                client_id: Number(getClientId(bookingData)),
                photographer_id: Number(photographerId),
                booking_date: bookingDate,
                shoot_month: shootDate ? '' : (shootMonth || ''),
                notes: photographerNotes?.trim() || '',
                admin_id: Number(adminId),
            };

            console.log('ASSIGN PHOTOGRAPHER PAYLOAD:', payload);

            const res = await fetch(API.assign_photographer, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            console.log('ASSIGN PHOTOGRAPHER RESPONSE:', result);

            if (
                result?.status === true ||
                result?.status == 200 ||
                result?.code == 200
            ) {

                Toast.show({
                    type: 'success',
                    text1: 'Photographer Assigned Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                });

                // Back nahi jana, detail API refresh karni hai
                await fetchBookingDetail(adminId);

            } else {

                Toast.show({
                    type: 'error',
                    text1: result?.message || 'Failed to assign photographer',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            }

        } catch (error) {

            console.log('Assign Photographer Error:', error);

            Toast.show({
                type: 'error',
                text1: 'Network Error',
                text2: 'Unable to assign photographer',
                position: 'bottom',
                bottomOffset: 60,
            });

        } finally {

            setAssigningPhotographer(false);
        }
    };


    /* =====================================================
       RENDER INFO ITEM
    ===================================================== */

    const renderInfoItem = ({
        item,
    }) => {

        return (
            <InfoRow
                icon={item.icon}
                label={item.label}
                value={item.value}
            />
        );
    };


    const bookingInfoData = useMemo(() => {

        return [
            {
                id: 'client',
                icon: 'account-outline',
                label: 'Client',
                value: originalBooking.client,
            },
            {
                id: 'client_contact',
                icon: 'phone-outline',
                label: 'Client Contact',
                value: originalBooking.clientContact,
            },
            {
                id: 'coordinator',
                icon: 'account-tie-outline',
                label: 'Coordinator',
                value: originalBooking.coordinatorName,
            },
            {
                id: 'photographer',
                icon: 'camera-outline',
                label: 'Photographer',
                value: originalBooking.photographerName,
            },
            {
                id: 'editor_coordinator',
                icon: 'movie-edit-outline',
                label: 'Coordinator Post Production',
                value: originalBooking.editorCoordinatorName,
            },

            {
                id: 'total',
                icon: 'cash-multiple',
                label: 'Booking Amount',
                value: originalBooking.totalAmount,
            },
        ];

    }, [originalBooking]);


    /* =====================================================
       MAIN UI
    ===================================================== */

    const type = userType?.trim();

    return (

        <KeyboardAvoidingView
            style={st.flexBg}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
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

            <View style={st.header}>

                <TouchableOpacity
                    onPress={() =>
                        navigation.goBack()
                    }
                    style={st.headerBackBtn}
                >
                    <Icon
                        name="arrow-left"
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>


                <View style={st.headerCenter}>

                    <Text
                        numberOfLines={1}
                        style={st.headerTitle}
                    >
                        {isEdit
                            ? 'Booking Process'
                            : 'New Manual Coordination'}
                    </Text>


                    {isEdit && (
                        <Text
                            numberOfLines={1}
                            style={st.headerSub}
                        >
                            {originalBooking.client}
                            {originalBooking.eventType
                                ? ` · ${originalBooking.eventType}`
                                : ''}
                        </Text>
                    )}

                </View>


                <View style={{ width: 40 }} />

            </View>


            {/* =================================================
               MAIN CONTENT
            ================================================= */}
            {!userTypeLoaded ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={
                        st.scrollContent
                    }
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >


                    {/* =================================================
                   BOOKING DETAILS
                ================================================= */}

                    <View style={st.card}>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                        }}>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Icon
                                    name="information-outline"
                                    size={17}
                                    color={Colors.buttonbgcolor}
                                />

                                <Text style={st.cardHeaderText}>
                                    Booking Details
                                </Text>
                            </View>

                            {originalBooking.bookingNo ? (
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: Fonts.Bold,
                                        color: Colors.buttonbgcolor,
                                    }}
                                >
                                    #{originalBooking.bookingNo}
                                </Text>
                            ) : null}

                        </View>


                        <FlatList
                            data={bookingInfoData}
                            keyExtractor={(item) => item.id}
                            key="grid-2col"          // 👈 numColumns change hone par FlatList ko naya key chahiye
                            numColumns={2}
                            scrollEnabled={false}
                            columnWrapperStyle={st.infoColumnWrapper}
                            renderItem={renderInfoItem}
                        />

                    </View>


                    {/* =================================================
                   PIPELINE PROGRESS
                ================================================= */}

                    <Text style={st.sectionLabel}>
                        Pipeline Progress
                    </Text>


                    <FlatList
                        data={STAGES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) =>
                            item.key
                        }
                        contentContainerStyle={
                            st.stageScroll
                        }
                        renderItem={({
                            item,
                            index,
                        }) => (
                            <PipelineItem
                                item={item}
                                index={index}
                                currentStageIndex={currentStageIndex}
                                completedStageKeys={completedStageKeys}
                                onPress={
                                    handleStageChange
                                }
                            />
                        )}
                    />




                    {/* =================================================
                   UPDATE STAGE
                ================================================= */}
                    {type !== 'Photographer' && (
                        <View style={st.card}>

                            <View
                                style={
                                    st.cardHeaderRow
                                }
                            >

                                <Icon
                                    name="progress-check"
                                    size={17}
                                    color={
                                        Colors.buttonbgcolor
                                    }
                                />

                                <Text
                                    style={
                                        st.cardHeaderText
                                    }
                                >
                                    Coordination Stages
                                </Text>

                            </View>




                            <Text style={st.fieldLabel}>
                                Preparation Stages
                                <Text style={st.req}> *</Text>
                            </Text>

                            <View style={st.prepCheckboxGroup}>
                                {PREP_STAGES.map(item => {
                                    const checked =
                                        selectedPrepStages.includes(item.label);

                                    const isConfirmed =
                                        confirmedPrepStages.includes(item.label);   // 👈 pura done (server se confirm)

                                    const disabled =
                                        isPrepStageDisabled(item.label);

                                    return (
                                        <TouchableOpacity
                                            key={item.key}
                                            style={[
                                                st.prepCheckboxRow,
                                                checked && !isConfirmed && {
                                                    backgroundColor: Colors.buttonbgcolor + '12',
                                                    borderLeftWidth: 3,
                                                    borderLeftColor: Colors.buttonbgcolor,
                                                },
                                                isConfirmed && {
                                                    backgroundColor: '#E8F8EE',
                                                    borderLeftWidth: 3,
                                                    borderLeftColor: '#16A34A',
                                                },
                                                disabled && st.prepCheckboxRowDisabled,
                                            ]}
                                            activeOpacity={disabled ? 1 : 0.7}
                                            onPress={() =>
                                                !disabled && togglePrepStage(item.label)
                                            }
                                        >
                                            <Checkbox
                                                status={
                                                    checked
                                                        ? 'checked'
                                                        : 'unchecked'
                                                }
                                                disabled={disabled}
                                                onPress={() =>
                                                    !disabled && togglePrepStage(item.label)
                                                }
                                                color={
                                                    isConfirmed
                                                        ? '#16A34A'
                                                        : Colors.buttonbgcolor
                                                }
                                            />

                                            <Text
                                                style={[
                                                    st.prepCheckboxLabel,
                                                    checked && !isConfirmed && {
                                                        color: Colors.buttonbgcolor,
                                                        fontFamily: Fonts.Bold,
                                                    },
                                                    isConfirmed && {
                                                        color: '#16A34A',
                                                        fontFamily: Fonts.Bold,
                                                    },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>

                                            {isConfirmed && (
                                                <Icon
                                                    name="check-circle"
                                                    size={16}
                                                    color="#16A34A"
                                                    style={{ marginLeft: 'auto' }}
                                                />
                                            )}

                                            {checked && !isConfirmed && (
                                                <Icon
                                                    name="lock-outline"
                                                    size={14}
                                                    color="#94a3b8"
                                                    style={{ marginLeft: 'auto' }}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* {!allPrepStagesChecked ? (
                        <Text style={st.disabledHint}>
                            Notes will be saved only once all 3 stages are checked.
                        </Text>
                    ) : null} */}


                            <Text style={st.fieldLabelTop}>
                                Stage Notes/ Requirements — Package
                            </Text>

                            <TextInput
                                value={stageNotes}
                                placeholder="Add notes related to this stage..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={6}
                                editable={false}
                                style={[st.textArea, st.textAreaLarge, st.selectBoxDisabled]}
                            />

                            <Text style={st.charCount}>
                                {stageNotes.length}/{NOTES_MAX}
                            </Text>

                            {/* 👇 yahan naya paste karna hai */}
                            <Text style={st.fieldLabelTop}>
                                Client Requirements
                            </Text>

                            <TextInput
                                value={photographerNotes}
                                onChangeText={(text) => setPhotographerNotes(text.slice(0, NOTES_MAX))}
                                placeholder="Add photographer instructions, location details, special requirements..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={5}
                                maxLength={NOTES_MAX}
                                editable={true}
                                style={[
                                    st.textArea,
                                    { height: 100 },

                                ]}
                            />

                            <Text style={st.charCount}>
                                {photographerNotes.length}/{NOTES_MAX}
                            </Text>


                            <Text
                                style={
                                    st.fieldLabelTop
                                }
                            >
                                Sales Person{' '}
                                <Text
                                    style={
                                        st.lockedHint
                                    }
                                >
                                    (Locked)
                                </Text>
                            </Text>


                            <View
                                style={st.lockedBox}
                            >

                                <Text
                                    style={
                                        st.lockedText
                                    }
                                >
                                    {salesPerson || 'Arjun'}
                                </Text>

                                <Icon
                                    name="lock-outline"
                                    size={15}
                                    color="#94a3b8"
                                />

                            </View>

                            {/* PHOTOGRAPHER (merged from separate card) */}


                            <SelectRow
                                label="Assign Photographer"
                                value={photographer}
                                placeholder="Select Photographer"
                                leftIcon="camera-outline"
                                onPress={() => setPhotographerModal(true)}
                                disabled={!photographerEnabled}
                                disabledHint="Complete all 4 preparation stages (Concept, Outfit, Props, Package) first."
                            />

                            <Text style={st.fieldLabelTop}>
                                Shoot Date{' '}

                            </Text>

                            <View style={st.lockedBox}>
                                <View style={st.selectBoxInner}>
                                    <Icon
                                        name="calendar-blank-outline"
                                        size={17}
                                        color="#94a3b8"
                                        style={{ marginRight: 7 }}
                                    />
                                    <Text style={st.lockedText}>
                                        {shootDate
                                            ? fmtDisplay(shootDate)
                                            : shootMonth
                                                ? shootMonth
                                                : apiBooking?.booking_date
                                                    ? fmtDisplay(getSafeDate(apiBooking.booking_date))
                                                    : 'Not set'
                                        }
                                    </Text>
                                </View>
                                <Icon name="lock-outline" size={15} color="#94a3b8" />
                            </View>



                            <TouchableOpacity
                                style={[
                                    st.saveBtn,
                                    (updatingStage || assigningPhotographer) && st.saveBtnDisabled,
                                ]}
                                onPress={handleUpdate}
                                disabled={updatingStage || assigningPhotographer}
                                activeOpacity={0.85}
                            >
                                <Icon
                                    name={(updatingStage || assigningPhotographer) ? 'loading' : 'content-save-outline'}
                                    size={17}
                                    color="#fff"
                                />
                                <Text style={st.saveBtnText}>
                                    {(updatingStage || assigningPhotographer) ? 'Updating...' : 'Update'}
                                </Text>
                            </TouchableOpacity>

                        </View>
                    )}


                    {/* =================================================
                   PHOTOGRAPHER ASSIGNMENT
                ================================================= */}
                    {/* 
{type !== 'Photographer' && (
    <View style={st.card}>

        <View style={st.cardHeaderRow}>
            <Icon
                name="camera-outline"
                size={17}
                color={Colors.buttonbgcolor}
            />

            <Text style={st.cardHeaderText}>
                Photographer Assignment
            </Text>
        </View>

        <SelectRow
            label="Assign Photographer"
            value={photographer}
            placeholder="Select Photographer"
            leftIcon="camera-outline"
            onPress={() => setPhotographerModal(true)}
            disabled={!photographerEnabled}
            disabledHint="Unlocks once stage reaches Client Requirements."
        />

        <Text style={st.fieldLabelTop}>
            Shoot Date{' '}
            <Text style={st.lockedHint}>(From Booking)</Text>
        </Text>

        <View style={st.lockedBox}>
            <View style={st.selectBoxInner}>
                <Icon
                    name="calendar-blank-outline"
                    size={17}
                    color="#94a3b8"
                    style={{ marginRight: 7 }}
                />

                <Text style={st.lockedText}>
                    {shootDate
                        ? fmtDisplay(shootDate)
                        : 'Not set'}
                </Text>
            </View>

            <Icon
                name="lock-outline"
                size={15}
                color="#94a3b8"
            />
        </View>

        <Text style={st.fieldLabelTop}>
            Shoot Notes
        </Text>

        <TextInput
            value={photographerNotes}
            onChangeText={(text) =>
                setPhotographerNotes(
                    text.slice(0, NOTES_MAX)
                )
            }
            placeholder="Add photographer instructions, location details, special requirements..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            maxLength={NOTES_MAX}
            editable={photographerEnabled}
            style={[
                st.textArea,
                { height: 100 },
                !photographerEnabled &&
                    st.selectBoxDisabled,
            ]}
        />

        <Text style={st.charCount}>
            {photographerNotes.length}/{NOTES_MAX}
        </Text>

        <TouchableOpacity
            disabled={
                !photographerEnabled ||
                !photographerId ||
                assigningPhotographer
            }
            onPress={handleAssignPhotographer}
            style={[
                st.assignBtn,
                photographerEnabled &&
                photographerId &&
                !assigningPhotographer
                    ? st.assignBtnActive
                    : st.assignBtnDisabled,
            ]}
            activeOpacity={0.85}
        >
            <View style={st.assignBtnInner}>

                <Icon
                    name={
                        assigningPhotographer
                            ? 'loading'
                            : 'camera'
                    }
                    size={19}
                    color="#fff"
                    style={{ marginRight: 7 }}
                />

                <Text style={st.saveBtnText}>
                    {assigningPhotographer
                        ? 'Assigning...'
                        : 'Assign Photographer'}
                </Text>

            </View>
        </TouchableOpacity>

    </View>
)}
*/}

                    <View style={st.card}>

                        <View style={st.cardHeaderRow}>
                            <Icon name="history" size={17} color={Colors.buttonbgcolor} />
                            <Text style={st.cardHeaderText}>Activity History</Text>
                        </View>

                        {loadingDetail ? (

                            <>
                                <ActivityItemShimmer />
                                <ActivityItemShimmer />
                                <ActivityItemShimmer isLast />
                            </>

                        ) : (

                            <>
                                <FlatList
                                    data={visibleActivities}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                    renderItem={({ item, index }) => (
                                        <ActivityItem
                                            item={item}
                                            isLast={index === visibleActivities.length - 1}
                                        />
                                    )}
                                    ListEmptyComponent={
                                        <Text style={st.emptyText}>No activity found.</Text>
                                    }
                                />

                                {activities.length > ACTIVITY_PREVIEW_COUNT && (
                                    <TouchableOpacity
                                        onPress={() => setShowAllActivities(prev => !prev)}
                                        style={st.showMoreBtn}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={st.showMoreText}>
                                            {showAllActivities
                                                ? 'Show less'
                                                : `Show ${activities.length - ACTIVITY_PREVIEW_COUNT} more`}
                                        </Text>
                                        <Icon
                                            name={showAllActivities ? 'chevron-up' : 'chevron-down'}
                                            size={15}
                                            color={Colors.buttonbgcolor}
                                        />
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                    </View>

                    <View style={st.card}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <View style={st.cardHeaderRow}>
                                <Icon name="movie-edit-outline" size={17} color={Colors.buttonbgcolor} />
                                <Text style={st.cardHeaderText}>Editor Workflow</Text>
                            </View>

                            <View style={{ backgroundColor: editorWorkflowStatus.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                                <Text style={{ color: editorWorkflowStatus.color, fontSize: 9, fontFamily: Fonts.Bold }}>
                                    {editorWorkflowStatus.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={{ fontSize: 11, fontFamily: Fonts.Regular, color: '#64748b', marginBottom: 10 }}>
                            After Photographer Done, The Booking Remains Available For Photo/Video Editor Assignment.
                        </Text>

                        {/* ================= TASK PROGRESS ================= */}
                        {editorTasks.length > 0 && (
                            <View style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="chart-box-outline" size={14} color="#1e293b" />
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 11.5, color: '#1e293b', marginLeft: 6 }}>
                                            Task Progress
                                        </Text>
                                    </View>
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 11.5, color: Colors.buttonbgcolor }}>
                                        {taskProgress.percent}%
                                    </Text>
                                </View>

                                <View style={{ height: 6, borderRadius: 3, backgroundColor: '#ECE9F7', overflow: 'hidden' }}>
                                    <View
                                        style={{
                                            height: '100%',
                                            width: `${Math.min(100, Math.max(0, taskProgress.percent))}%`,
                                            backgroundColor: Colors.buttonbgcolor,
                                            borderRadius: 3,
                                        }}
                                    />
                                </View>
                            </View>
                        )}

                        {/* ================= TASK LIST ================= */}
                        {editorTasks.length === 0 ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, padding: 10 }}>
                                <Icon name="information-outline" size={16} color="#94a3b8" />
                                <Text style={{ fontSize: 11, fontFamily: Fonts.Regular, color: '#64748b', marginLeft: 7 }}>
                                    No Editor Tasks Created Yet.
                                </Text>
                            </View>
                        ) : (
                            <View>
                                {editorTasks.map((task, idx) => {
                                    const dueLabel = fmtDueDate(task.dueDate);
                                    const statusColors =
                                        task.status === 'Done'
                                            ? { bg: '#e5f8ef', color: '#0FA968' }
                                            : task.status === 'In Progress'
                                                ? { bg: '#eeecff', color: '#6366F1' }
                                                : { bg: '#fff2dc', color: '#D98200' };

                                    return (
                                        <View
                                            key={task.id || idx}
                                            style={{
                                                backgroundColor: '#fff',
                                                borderRadius: 10,
                                                borderWidth: 0.5,
                                                borderColor: '#e4e1f1',
                                                padding: 10,
                                                marginTop: idx === 0 ? 0 : 8,
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: '#eeecff', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icon
                                                        name={String(task.taskType).toLowerCase() === 'video' ? 'video-outline' : 'image-outline'}
                                                        size={15}
                                                        color={Colors.buttonbgcolor}
                                                    />
                                                </View>

                                                <View style={{ flex: 1, marginLeft: 9 }}>
                                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 11, color: '#1e293b' }} numberOfLines={1}>
                                                        {task.title || `${task.taskType} Editor`}
                                                    </Text>
                                                    <Text style={{ fontFamily: Fonts.Regular, fontSize: 9.5, color: '#64748b', marginTop: 2 }} numberOfLines={1}>
                                                        {task.assignedName} · {task.taskType} · {task.priority}
                                                    </Text>
                                                </View>

                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <View style={{ backgroundColor: statusColors.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
                                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 8.5, color: statusColors.color }}>
                                                            {task.status}
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            backgroundColor: '#f1f5f9',
                                                            borderRadius: 8,
                                                            paddingHorizontal: 7,
                                                            paddingVertical: 4,
                                                            marginTop: 5,
                                                        }}
                                                    >
                                                        {dueLabel && (
                                                            <Icon name="calendar-outline" size={9} color="#64748b" style={{ marginRight: 3 }} />
                                                        )}
                                                        <Text style={{ fontFamily: Fonts.Regular, fontSize: 8.5, color: '#64748b' }}>
                                                            {dueLabel || 'No Due Date'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {!!task.description && (
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginTop: 8,
                                                        paddingTop: 7,
                                                        borderTopWidth: 0.5,
                                                        borderTopColor: '#f1f5f9',
                                                    }}
                                                >
                                                    <Icon name="text-box-outline" size={12} color="#94a3b8" />
                                                    <Text
                                                        style={{ fontFamily: Fonts.Regular, fontSize: 9.5, color: '#64748b', marginLeft: 6, flex: 1 }}
                                                        numberOfLines={2}
                                                    >
                                                        {task.description}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* =================================================
                   ACTIVITY HISTORY
                ================================================= */}




                </ScrollView>
            )}

            {/* =================================================
               STAGE MODAL
            ================================================= */}

            <SelectModal
                visible={stageModal}
                onClose={() => setStageModal(false)}
                title="Select Stage"
                data={STAGES.map(item => ({
                    label: item.label,
                    value: item.key,
                }))}
                selected={stage}
                onSelect={handleStageChange}
            />


            {/* =================================================
               PHOTOGRAPHER MODAL
            ================================================= */}

            <SelectModal
                visible={
                    photographerModal
                }
                onClose={() =>
                    setPhotographerModal(
                        false
                    )
                }
                title="Select Photographer"
                data={photographersList}
                selected={
                    photographerId
                }
                onSelect={(id) => {

                    const selected =
                        photographersList.find(
                            item =>
                                item.value === id
                        );

                    setPhotographerId(id);

                    setPhotographer(
                        selected?.label || ''
                    );
                }}
            />

        </KeyboardAvoidingView>
    );
};


export default NewCoordination;


/* =========================================================
   STYLES
========================================================= */

const st = StyleSheet.create({

    flexBg: {
        flex: 1,
        backgroundColor: '#f5f6f8',
    },

    infoColumnWrapper: {
        justifyContent: 'space-between',
    },

    infoRowGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        paddingVertical: 8,
        marginBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
    },


    /* HEADER */

    header: {
        height: 60,
        backgroundColor:
            Colors.buttonbgcolor,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
    },

    headerBackBtn: {
        width: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    headerCenter: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 8,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 17,
        fontFamily: Fonts.Bold,
    },

    headerSub: {
        color: '#e2e8f0',
        fontSize: 11,
        fontFamily: Fonts.Regular,
        marginTop: 2,
    },

    scrollContent: {
        paddingHorizontal: 12,
        paddingBottom: 30,
    },

    sectionLabel: {
        fontSize: 14,
        fontFamily: Fonts.Bold,
        color: '#0f172a',
        marginBottom: 5,
        marginTop: 10
    },

    stageScroll: {
        paddingVertical: 3,
        paddingRight: 10,
    },

    stageItem: {
        alignItems: 'center',
        width: 67,
    },

    stageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    stageCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#fff',
        borderWidth: 1.3,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    stageCircleDone: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },

    stageCircleActive: {
        backgroundColor:
            Colors.buttonbgcolor,
        borderColor:
            Colors.buttonbgcolor,
    },

    stageLine: {
        width: 15,
        height: 2,
        backgroundColor: '#e2e8f0',
    },

    stageLineDone: {
        backgroundColor: '#16A34A',
    },

    stageLabel: {
        fontSize: 9,
        lineHeight: 11,
        fontFamily: Fonts.Regular,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 5,
        width: 64,
    },

    stageLabelActive: {
        fontFamily: Fonts.Bold,
        color: '#1e293b',
    },


    /* CARD */

    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: {
            width: 0,
            height: 1,
        },
    },

    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },

    cardHeaderText: {
        fontSize: 13.5,
        fontFamily: Fonts.Bold,
        color: '#1e293b',
        marginLeft: 6,
    },


    /* INFO */

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
    },

    infoIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor:
            Colors.buttonbgcolor + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },

    infoLabel: {
        fontSize: 9.5,
        fontFamily: Fonts.Regular,
        color: '#94a3b8',
    },

    infoValue: {
        fontSize: 12,
        fontFamily: Fonts.Bold,
        color: '#1e293b',
        marginTop: 1,
        textTransform: 'capitalize',
    },


    /* FORM */

    fieldLabel: {
        marginTop: 10,
        fontSize: 12,
        fontFamily: Fonts.Bold,
        color: '#2c3e50',
    },

    fieldLabelTop: {
        marginTop: 10,
        fontSize: 12,
        fontFamily: Fonts.Bold,
        color: '#2c3e50',
    },

    req: {
        color: 'red',
        fontFamily: Fonts.Bold,
    },


    /* PREPARATION STAGE CHECKBOXES */

    prepCheckboxGroup: {
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },

    prepCheckboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
    },

    prepCheckboxLabel: {
        fontSize: 13,
        fontFamily: Fonts.Regular,
        color: '#000',
        flexShrink: 1,
    },


    selectBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 44,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    selectBoxDisabled: {
        backgroundColor: '#f1f5f9',
    },

    selectBoxInner: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    selectText: {
        fontSize: 13,
        fontFamily: Fonts.Regular,
        color: '#000',
        textTransform: 'capitalize'
    },

    selectTextDisabled: {
        color: '#94a3b8',
    },

    selectTextPlaceholder: {
        color: '#999',
    },

    disabledHint: {
        fontSize: 10,
        fontFamily: Fonts.Regular,
        color: '#94a3b8',
        marginTop: 4,
    },


    /* DATE */

    dateBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 44,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },


    /* TEXT AREA */

    textArea: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 70,          // 👈 ye chhota reh sakta hai (Shoot Notes ke liye)
        paddingHorizontal: 10,
        paddingTop: 8,
        paddingBottom: 6,
        backgroundColor: '#fff',
        marginTop: 4,
        color: '#000',
        fontFamily: Fonts.Regular,
        textAlignVertical: 'top',
        fontSize: 12.5,
    },

    textAreaLarge: {
        height: 130,          // 👈 naya — sirf Stage Notes ke liye bada
    },
    charCount: {
        fontSize: 9,
        fontFamily: Fonts.Regular,
        color: '#94a3b8',
        textAlign: 'right',
        marginTop: 2,
    },


    /* LOCKED */

    lockedHint: {
        color: '#94a3b8',
        fontFamily: Fonts.Regular,
        fontSize: 10,
    },

    lockedBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 44,
        paddingHorizontal: 10,
        backgroundColor: '#f1f5f9',
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    lockedText: {
        fontSize: 13,
        fontFamily: Fonts.Regular,
        color: '#64748b',
        textTransform: 'capitalize'
    },


    /* BUTTON */

    saveBtn: {
        flexDirection: 'row',
        backgroundColor:
            Colors.buttonbgcolor,
        height: 46,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },

    saveBtnDisabled: {
        opacity: 0.65,
    },

    saveBtnText: {
        color: '#fff',
        fontSize: 13.5,
        fontFamily: Fonts.Bold,
        marginLeft: 7,
    },


    /* PHOTOGRAPHER */

    assignBtn: {
        height: 46,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },

    assignBtnActive: {
        backgroundColor:
            Colors.buttonbgcolor,
    },

    assignBtnDisabled: {
        backgroundColor: '#cbd5e1',
    },

    assignBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },


    /* ACTIVITY */

    /* ACTIVITY */

    activityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    activityIconCol: {
        width: 30,
        alignItems: 'center',
    },

    activityIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },

    activityConnector: {
        width: 1.5,
        flex: 1,
        minHeight: 20,
        backgroundColor: '#e2e8f0',
        marginTop: 4,
    },

    activityTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    activityAction: {
        flex: 1,
        fontSize: 12.5,
        fontFamily: Fonts.Bold,
        color: '#1e293b',
        marginRight: 6,
    },

    activityTimeAgo: {
        fontSize: 10,
        fontFamily: Fonts.Regular,
        color: '#94a3b8',
    },

    activityBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 2,
    },

    activityDetails: {
        fontSize: 11.5,
        fontFamily: Fonts.Regular,
        color: '#64748b',
        marginRight: 6,
    },

    userChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 2,
    },

    userChipText: {
        fontSize: 9.5,
        fontFamily: Fonts.Regular,
        color: '#64748b',
        marginLeft: 3,
    },

    activityFullTime: {
        fontSize: 9,
        fontFamily: Fonts.Regular,
        color: '#cbd5e1',
        marginTop: 3,
    },

    showMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginTop: 4,
    },

    showMoreText: {
        fontSize: 12,
        fontFamily: Fonts.Bold,
        color: Colors.buttonbgcolor,
        marginRight: 3,
    },


    /* EMPTY */

    emptyText: {
        fontSize: 11,
        fontFamily: Fonts.Regular,
        color: '#94a3b8',
        textAlign: 'center',
        paddingVertical: 12,
    },


    /* MODAL */

    modalOverlay: {
        flex: 1,
        backgroundColor:
            'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        width: '80%',
        maxHeight: '70%',
        overflow: 'hidden',
    },

    modalTitle: {
        fontSize: 15,
        fontFamily: Fonts.Bold,
        color: '#1e293b',
        textAlign: 'center',
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },

    modalList: {
        maxHeight: 360,
    },

    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#fff',
    },

    modalItemSel: {
        backgroundColor: '#f0fdf4',
    },

    modalItemText: {
        fontSize: 14,
        fontFamily: Fonts.Regular,
        color: '#1e293b',
        textTransform: 'capitalize'
    },

    modalItemTextSel: {
        fontFamily: Fonts.Bold,
        color: Colors.buttonbgcolor,
    },

});
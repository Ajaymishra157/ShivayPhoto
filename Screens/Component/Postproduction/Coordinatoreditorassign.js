import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Pressable,
    Animated,
    Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';




const Coordinatoreditorassign = () => {
    const navigation = useNavigation();

    /* =========================================================
       TABS  ('pending' | 'assigned') — same values are sent as
       the `type` param to list_post_production
    ========================================================= */

    const [activeTab, setActiveTab] = useState('assigned');

    /* =========================================================
       EXPANDED ASSIGNED CARDS
    ========================================================= */

    const [expandedTask, setExpandedTask] = useState(null);

    // Animated values — har card ka apna smooth open/close animation
    const pendingAnimRefs = useRef({}).current;
    const assignedAnimRefs = useRef({}).current;

    const getPendingAnim = id => {
        if (!pendingAnimRefs[id]) {
            pendingAnimRefs[id] = new Animated.Value(0);
        }
        return pendingAnimRefs[id];
    };

    const getAssignedAnim = id => {
        if (!assignedAnimRefs[id]) {
            assignedAnimRefs[id] = new Animated.Value(0);
        }
        return assignedAnimRefs[id];
    };

    const animateOpen = animValue => {
        Animated.timing(animValue, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    const animateClose = animValue => {
        Animated.timing(animValue, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start();
    };

    /* =========================================================
       SEARCH
    ========================================================= */

    const [search, setSearch] = useState('');

    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const PAGE_SIZE = 20;

    // Pending tab ke filters
    const [selectedPhotographer, setSelectedPhotographer] = useState({ label: 'All Photographers', value: 0 });
    const [selectedCoordinator, setSelectedCoordinator] = useState({ label: 'All Coordinators', value: 0 });

    // Assigned tab ka filter
    const [selectedEditor2, setSelectedEditor2] = useState({ label: 'All Editors', value: 0 });
    // (naam alag rakhna kyunki selectedEditor already assign-modal ke liye use ho raha hai)

    const [photographerModal, setPhotographerModal] = useState(false);
    const [coordinatorModal, setCoordinatorModal] = useState(false);
    const [editorFilterModal, setEditorFilterModal] = useState(false);

    const [photographerOptions, setPhotographerOptions] = useState([]);
    const [coordinatorOptions, setCoordinatorOptions] = useState([]);


    /* =========================================================
       DATE HELPERS
    ========================================================= */

    const formatDateTime = dateStr => {
        if (!dateStr) return '';
        const d = new Date(dateStr.replace(' ', 'T'));
        if (isNaN(d)) return dateStr;

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const formatDueDate = dateStr => {
        if (!dateStr) return 'No due date';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];

        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const isOverdue = (dueRaw, status) => {
        if (!dueRaw) return false;

        // Done / Completed task overdue nahi maana jayega
        const s = (status || '').toLowerCase();
        if (s === 'done' || s === 'completed') return false;

        const due = new Date(dueRaw);
        if (isNaN(due)) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);

        return due < today; // aaj se pehle ki date = overdue
    };

    /* =========================================================
       MAP API ITEM -> CARD SHAPE
    ========================================================= */

    const mapItem = item => ({
        id: `${item.client_id}`,
        client_id: item.client_id,
        booking: `#${item.order_no}`,
        client: item.client_name,
        mobile: item.mobile_no,
        coordinator:
            (item.coordinator_name || item.editor_coordinator_name || '').trim() ||
            'Unassigned',
        photographer: (item.photographer_name || '').trim() || 'N/A',
        shootDate: item.booking_date
            ? formatDueDate(item.booking_date)
            : (item.shoot_month || 'N/A'),
        added: formatDateTime(item.entry_date),
        taskCount: Number(item.task_count) || 0,
        completedTaskCount: Number(item.completed_task_count) || 0,
        tasks: (item.tasks || []).map(t => ({
            id: `${t.id}`,
            task: t.title,
            editor: t.assigned_name,
            type: t.task_type,
            priority: t.priority,
            status: t.status,
            due: formatDueDate(t.due_date),
            dueRaw: t.due_date,
            entryDate: formatDateTime(t.created_at),
            description: t.description,

        })),
    });

    /* =========================================================
       PENDING ASSIGNMENTS  (fetched)
    ========================================================= */

    const [pendingAssignments, setPendingAssignments] = useState([]);


    /* =========================================================
       ASSIGNED QUEUE  (fetched)
    ========================================================= */

    const [assignedQueue, setAssignedQueue] = useState([]);

    const [pendingCount, setPendingCount] = useState(0);
    const [assignedCount, setAssignedCount] = useState(0);

    const [completeCount, setCompleteCount] = useState(0);
    const [totalProjects, setTotalProjects] = useState(0);
    const [totalTasks, setTotalTasks] = useState(0);
    const [pendingTaskCount, setPendingTaskCount] = useState(0);
    const [inProgressTaskCount, setInProgressTaskCount] = useState(0);
    const [reviewTaskCount, setReviewTaskCount] = useState(0);
    const [doneTaskCount, setDoneTaskCount] = useState(0);
    const [completedProjectsCount, setCompletedProjectsCount] = useState(0);

    const [completeQueue, setCompleteQueue] = useState([]);

    const [loadingList, setLoadingList] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [listError, setListError] = useState('');

    const fetchList = async (type, { silent = false } = {}) => {
        if (!silent) setLoadingList(true);
        setListError('');

        try {
            const adminId = await AsyncStorage.getItem('id');
            const body = {
                admin_id: adminId,
                type,
                photographer_id: type === 'pending' ? Number(selectedPhotographer.value || 0) : 0,
                coordinator_id: type === 'pending' ? Number(selectedCoordinator.value || 0) : 0,
                editor_coordinator_id: type !== 'pending' ? Number(selectedEditor2.value || 0) : 0,
            };
            console.log("body", body);

            const res = await fetch(API.list_post_production, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const json = await res.json();

            if (json?.code == 200) {
                const mapped = (json.payload || []).map(mapItem);

                setPendingCount(Number(json.pending_count) || 0);
                setAssignedCount(Number(json.assigned_count) || 0);
                setCompleteCount(Number(json.complete_count) || 0);

                setTotalProjects(Number(json.total_projects) || 0);
                setTotalTasks(Number(json.total_tasks) || 0);
                setPendingTaskCount(Number(json.pending_task) || 0);
                setInProgressTaskCount(Number(json.in_progress_task) || 0);
                setReviewTaskCount(Number(json.review_task) || 0);
                setDoneTaskCount(Number(json.done_task) || 0);
                setCompletedProjectsCount(Number(json.completed_projects) || 0);

                if (type === 'pending') {
                    setPendingAssignments(mapped);
                } else if (type === 'assigned') {
                    setAssignedQueue(mapped);
                } else {
                    setCompleteQueue(mapped);
                }
            } else {
                setListError(json?.message || 'Could not load data.');
                if (type === 'pending') setPendingAssignments([]);
                else if (type === 'assigned') setAssignedQueue([]);
                else setCompleteQueue([]);
            }
        } catch (error) {
            console.log('List fetch error:', error);
            setListError('Unable to load data. Please check your connection.');
            if (type === 'pending') setPendingAssignments([]);
            else if (type === 'assigned') setAssignedQueue([]);
            else setCompleteQueue([]);
        } finally {
            setLoadingList(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchList(activeTab);
    }, [activeTab, selectedPhotographer, selectedCoordinator, selectedEditor2]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchList(activeTab, { silent: true });
    };

    const handleLoadMore = () => {
        if (loadingMore) return;
        const currentList =
            activeTab === 'pending' ? filteredPending :
                activeTab === 'assigned' ? filteredAssigned :
                    filteredComplete;
        const currentVisible =
            activeTab === 'pending' ? visiblePending :
                activeTab === 'assigned' ? visibleAssigned :
                    visibleComplete;
        if (currentVisible.length >= currentList.length) return;

        setLoadingMore(true);
        setTimeout(() => {
            setPage(prev => prev + 1);
            setLoadingMore(false);
        }, 400);
    };


    useEffect(() => {
        const fetchFilterUsers = async () => {
            const [photoRes, coordRes] = await Promise.all([
                fetch(API.list_user_typewise, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'photographer' }) }),
                fetch(API.list_user_typewise, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'coordinator' }) }),
            ]);
            const photoJson = await photoRes.json();
            const coordJson = await coordRes.json();
            if (photoJson?.code == 200) setPhotographerOptions(photoJson.payload.map(u => ({ label: u.user_name, value: Number(u.id) })));
            if (coordJson?.code == 200) setCoordinatorOptions(coordJson.payload.map(u => ({ label: u.user_name, value: Number(u.id) })));
        };
        fetchFilterUsers();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('blur', () => {
            setAssignModal(false);
            setPhotographerModal(false);
            setCoordinatorModal(false);
            setEditorFilterModal(false);
            setViewModal(false);
            setAssignError('');
            setSelectedEditor(null);
        });
        return unsubscribe;
    }, [navigation]);

    /* =========================================================
       ASSIGN MODAL
    ========================================================= */

    const [assignModal, setAssignModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] =
        useState(null);

    const [expandedPendingId, setExpandedPendingId] = useState(null);
    const [editorPickerModal, setEditorPickerModal] = useState(false);
    const [editorSearch, setEditorSearch] = useState('');
    const [selectedEditor, setSelectedEditor] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');

    /* =========================================================
       VIEW MODAL
    ========================================================= */

    const [viewModal, setViewModal] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    /* =========================================================
       EDITOR OPTIONS — fetched from API.list_user_typewise,
       type: 'editor'
    ========================================================= */

    const [editorOptions, setEditorOptions] = useState([]);
    const [editorsLoading, setEditorsLoading] = useState(true);
    const [editorsError, setEditorsError] = useState('');

    const fetchEditors = async () => {
        setEditorsLoading(true);
        setEditorsError('');

        try {
            const res = await fetch(API.list_user_typewise, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'Coordinator → Editor',
                }),
            });

            const json = await res.json();

            if (json?.code == 200) {
                setEditorOptions(
                    (json.payload || []).map(u => ({
                        label: u.user_name,
                        value: Number(u.id),
                    })),
                );
            } else {
                setEditorOptions([]);
                setEditorsError(
                    json?.message || 'Could not load editors.',
                );
            }
        } catch (error) {
            console.log('Editor list error:', error);
            setEditorOptions([]);
            setEditorsError(
                'Unable to load editors. Please check your connection.',
            );
        } finally {
            setEditorsLoading(false);
        }
    };

    useEffect(() => {
        fetchEditors();
    }, []);

    /* =========================================================
       SEARCH FILTER
    ========================================================= */

    const filteredPending = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) return pendingAssignments;

        return pendingAssignments.filter(item =>
            `${item.booking} ${item.client} ${item.mobile} ${item.coordinator}`
                .toLowerCase()
                .includes(q),
        );
    }, [search, pendingAssignments]);

    const filteredAssigned = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) return assignedQueue;

        return assignedQueue.filter(item =>
            `${item.booking} ${item.client} ${item.mobile} ${item.coordinator}`
                .toLowerCase()
                .includes(q),
        );
    }, [search, assignedQueue]);

    const visiblePending = useMemo(
        () => filteredPending.slice(0, page * PAGE_SIZE),
        [filteredPending, page]
    );

    const visibleAssigned = useMemo(
        () => filteredAssigned.slice(0, page * PAGE_SIZE),
        [filteredAssigned, page]
    );

    const filteredComplete = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return completeQueue;
        return completeQueue.filter(item =>
            `${item.booking} ${item.client} ${item.mobile} ${item.coordinator}`
                .toLowerCase()
                .includes(q),
        );
    }, [search, completeQueue]);

    const visibleComplete = useMemo(
        () => filteredComplete.slice(0, page * PAGE_SIZE),
        [filteredComplete, page]
    );

    useEffect(() => {
        setPage(1);
    }, [search, activeTab, selectedPhotographer, selectedCoordinator, selectedEditor2]);




    useEffect(() => {
        if (activeTab === 'pending') {
            setSelectedEditor2({ label: 'All Editors', value: 0 });
            setEditorFilterModal(false);
        } else {
            setSelectedPhotographer({ label: 'All Photographers', value: 0 });
            setSelectedCoordinator({ label: 'All Coordinators', value: 0 });
            setPhotographerModal(false);
            setCoordinatorModal(false);
        }
    }, [activeTab]);

    const FilterButton = ({ icon, label, onPress }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={{
                flex: 1,
                height: 40,
                backgroundColor: '#fff',
                borderRadius: 10,
                borderWidth: 0.6,
                borderColor: '#E1DDF7',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 7,
            }}
        >
            <Icon
                name={icon}
                size={14}
                color={Colors.buttonbgcolor}
            />

            <Text
                numberOfLines={1}
                style={{
                    flex: 1,
                    marginLeft: 4,
                    fontFamily: Fonts.Regular,
                    fontSize: 8.5,
                    color: '#334155',
                }}
            >
                {label}
            </Text>

            <Icon
                name="chevron-down"
                size={15}
                color="#94a3b8"
            />
        </TouchableOpacity>
    );


    const FilterModal = ({
        visible,
        title,
        data,
        selectedValue,
        onSelect,
        onClose,
        icon,
    }) => (
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
                    backgroundColor:
                        'rgba(0,0,0,0.35)',
                    justifyContent: 'flex-end',
                }}
            >
                <Pressable
                    onPress={e =>
                        e.stopPropagation()
                    }
                    style={{
                        backgroundColor: '#fff',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        maxHeight: '72%',
                        paddingBottom: 20,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent:
                                'space-between',
                            paddingHorizontal: 18,
                            paddingTop: 16,
                            paddingBottom: 12,
                            borderBottomWidth: 0.5,
                            borderBottomColor: '#eee',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon
                                name={icon}
                                size={22}
                                color={
                                    Colors.buttonbgcolor
                                }
                            />

                            <Text
                                style={{
                                    marginLeft: 8,
                                    fontFamily: Fonts.Bold,
                                    fontSize: 16.5,
                                    color: '#172033',
                                }}
                            >
                                {title}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                        >
                            <Icon
                                name="close"
                                size={24}
                                color="#64748b"
                            />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={data}
                        keyExtractor={item =>
                            String(item.value)
                        }
                        showsVerticalScrollIndicator={
                            false
                        }
                        keyboardShouldPersistTaps="handled"
                        renderItem={({
                            item,
                        }) => {
                            const selected =
                                selectedValue ===
                                item.value;

                            return (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() =>
                                        onSelect(
                                            item
                                        )
                                    }
                                    style={{
                                        flexDirection:
                                            'row',
                                        alignItems:
                                            'center',
                                        paddingHorizontal:
                                            18,
                                        paddingVertical:
                                            13,
                                        borderBottomWidth:
                                            0.5,
                                        borderBottomColor:
                                            '#f1f5f9',
                                        backgroundColor:
                                            selected
                                                ? '#f5f3ff'
                                                : '#fff',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 17,
                                            backgroundColor:
                                                selected
                                                    ? '#ede9fe'
                                                    : '#f8fafc',
                                            justifyContent:
                                                'center',
                                            alignItems:
                                                'center',
                                        }}
                                    >
                                        <Icon
                                            name={
                                                item.icon ||
                                                icon
                                            }
                                            size={19}
                                            color={
                                                selected
                                                    ? Colors.buttonbgcolor
                                                    : '#64748b'
                                            }
                                        />
                                    </View>

                                    <Text
                                        style={{
                                            flex: 1,
                                            marginLeft: 10,
                                            fontFamily:
                                                selected
                                                    ? Fonts.Bold
                                                    : Fonts.Regular,
                                            fontSize: 14.5,
                                            color:
                                                selected
                                                    ? Colors.buttonbgcolor
                                                    : '#334155',
                                        }}
                                    >
                                        {item.label}
                                    </Text>

                                    {selected && (
                                        <Icon
                                            name="check-circle"
                                            size={22}
                                            color={
                                                Colors.buttonbgcolor
                                            }
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </Pressable>
            </Pressable>
        </Modal>


    );

    /* =========================================================
       OPEN ASSIGN MODAL
    ========================================================= */

    const openAssignModal = item => {
        setSelectedAssignment(item);
        setSelectedEditor(null);
        setAssignError('');
        setAssignModal(true);

        if (!editorsLoading && editorOptions.length === 0) {
            fetchEditors();
        }
    };

    /* =========================================================
       HANDLE ASSIGN — calls assign_editor_workflow, then
       refetches both lists so UI reflects server state
    ========================================================= */

    const handleAssign = async () => {
        if (!selectedAssignment || !selectedEditor || assigning) {
            return;
        }

        setAssigning(true);
        setAssignError('');

        try {
            const adminId = await AsyncStorage.getItem('id');

            const res = await fetch(API.assign_editor_workflow, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: adminId,
                    client_id: `${selectedAssignment.client_id}`,
                    editor_coordinator_id: `${selectedEditor.value}`,
                }),
            });

            const json = await res.json();

            if (json?.code == 200) {

                setExpandedPendingId(null);


                setSelectedAssignment(null);
                setSelectedEditor(null);
                setActiveTab('assigned');

                await Promise.all([
                    fetchList('pending', { silent: true }),
                    fetchList('assigned', { silent: true }),
                ]);
            } else {
                setAssignError(
                    json?.message || 'Assign failed, please try again.',
                );
            }
        } catch (error) {
            console.log('Assign error:', error);
            setAssignError(
                'Unable to assign. Please check your connection.',
            );
        } finally {
            setAssigning(false);
        }
    };

    /* =========================================================
       TOGGLE ASSIGNED CARD
    ========================================================= */

    const toggleAssignedCard = item => {
        if (!item.tasks || item.tasks.length === 0) {
            return;
        }

        const isSame = expandedTask === item.id;
        const anim = getAssignedAnim(item.id);

        if (isSame) {
            animateClose(anim);
        } else {
            anim.setValue(0);
            animateOpen(anim);
        }

        setExpandedTask(isSame ? null : item.id);
    };

    /* =========================================================
       PROGRESS
    ========================================================= */

    const getProgress = (item, forceComplete = false) => {
        if (!item.tasks || item.tasks.length === 0) {
            return { completed: 0, total: 0, percentage: 0 };
        }

        const total = item.tasks.length;

        if (forceComplete) {
            return { completed: total, total, percentage: 100 };
        }

        const completed = item.tasks.filter(
            x => x.status === 'Completed' || x.status === 'Done',
        ).length;

        return {
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
        };
    };

    /* =========================================================
       STATUS STYLE
    ========================================================= */

    const getStatusStyle = status => {
        switch (status) {
            case 'Pending':
            case 'pending':
                return {
                    color: '#F59E0B',
                    background: '#FEF3C7',
                    icon: 'timer-sand-empty',
                };

            case 'In Progress':
            case 'in_progress':
                return {
                    color: '#0EA5E9',
                    background: '#E0F2FE',
                    icon: 'sync',
                };

            case 'Review':
            case 'review':
                return {
                    color: '#14B8A6',
                    background: '#CCFBF1',
                    icon: 'eye-outline',
                };

            case 'Done':
            case 'done':
            case 'Completed':
                return {
                    color: '#16A34A',
                    background: '#DCFCE7',
                    icon: 'check-circle',
                };

            default:
                return {
                    color: '#64748B',
                    background: '#F1F5F9',
                    icon: 'help-circle-outline',
                };
        }
    };

    /* =========================================================
       LABEL
    ========================================================= */

    const Label = ({ title }) => (
        <Text
            style={{
                fontFamily: Fonts.Bold,
                fontSize: 7.5,
                color: '#9692A5',
                letterSpacing: 0.5,
                marginBottom: 2,
            }}
        >
            {title}
        </Text>
    );


    const OverviewStat = ({ icon, color, value, label, style }) => (
        <View
            style={[
                {
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
                },
                style,
            ]}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    backgroundColor: color,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon name={icon} size={18} color="#fff" />
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: Fonts.Bold, fontSize: 20, color: '#111827' }}>{value}</Text>
                <Text numberOfLines={1} style={{ fontFamily: Fonts.Regular, fontSize: 9.5, color: '#6B7280', marginTop: 2 }}>
                    {label}
                </Text>
            </View>
        </View>
    );

    /* =========================================================
        PENDING CARD
        Fields: # · Client · Photographer · Coordinator ·
                Shoot Date · Added
     ========================================================= */

    const PendingCard = ({ item, index }) => {
        return (
            <View
                style={{
                    marginHorizontal: 10,
                    marginBottom: 10,
                    backgroundColor: '#fff',
                    borderRadius: 13,
                    borderWidth: 0.6,
                    borderColor: '#E5E1F4',
                    padding: 13,
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.03,
                    shadowRadius: 3,
                    shadowOffset: {
                        width: 0,
                        height: 1,
                    },
                }}
            >
                {/* TOP */}

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    {/* NUMBER */}

                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
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
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 13,
                                color: '#29263B',
                            }}
                        >
                            {item.booking} · {item.client}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 3,
                            }}
                        >
                            <Icon
                                name="phone-outline"
                                size={12}
                                color="#77748A"
                            />

                            <Text
                                style={{
                                    fontFamily:
                                        Fonts.Regular,
                                    fontSize: 9.5,
                                    color: '#77748A',
                                    marginLeft: 4,
                                }}
                            >
                                {item.mobile}
                            </Text>
                        </View>
                    </View>

                    {/* PHOTOGRAPHER badge */}

                    <View
                        style={{
                            alignItems: 'flex-end',
                            maxWidth: 120,
                        }}
                    >
                        <Label title="PHOTOGRAPHER" />

                        <View
                            style={{
                                backgroundColor: '#FFF2E4',
                                borderRadius: 13,
                                paddingHorizontal: 9,
                                paddingVertical: 5,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily:
                                        Fonts.Bold,
                                    fontSize: 9,
                                    color: '#D9822B',
                                    textTransform: 'capitalize'
                                }}
                                numberOfLines={1}

                            >
                                {item.photographer || 'N/A'}
                            </Text>
                        </View>
                    </View>
                    {/* EXPAND / ASSIGN ARROW */}

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            const isSame = expandedPendingId === item.id;
                            const anim = getPendingAnim(item.id);

                            if (isSame) {
                                animateClose(anim);
                            } else {
                                anim.setValue(0);
                                animateOpen(anim);
                            }

                            setExpandedPendingId(isSame ? null : item.id);
                            setSelectedAssignment(item);
                            setSelectedEditor(null);
                            setAssignError('');
                        }}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            backgroundColor: expandedPendingId === item.id ? '#EEECFF' : '#F5F3FA',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 8,
                        }}
                    >
                        <Icon
                            name={expandedPendingId === item.id ? 'chevron-up' : 'chevron-down'}
                            size={19}
                            color={expandedPendingId === item.id ? '#6366F1' : '#858196'}
                        />
                    </TouchableOpacity>
                </View>

                {/* DIVIDER */}

                <View
                    style={{
                        height: 0.6,
                        backgroundColor: '#ECE9F3',
                        marginVertical: 10,
                    }}
                />

                {/* INFO: COORDINATOR · SHOOT DATE · ADDED */}

                <View
                    style={{
                        flexDirection: 'row',
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                        }}
                    >
                        <Label title="COORDINATOR" />

                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9.5,
                                color: '#555265',
                                textTransform: 'capitalize'
                            }}
                            numberOfLines={1}

                        >
                            {item.coordinator}
                        </Text>
                    </View>

                    <View
                        style={{
                            flex: 1,
                            borderLeftWidth: 0.5,
                            borderLeftColor: '#ECE9F3',
                            paddingLeft: 11,
                        }}
                    >
                        <Label title="SHOOT DATE" />

                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9.5,
                                color: '#555265',
                            }}
                            numberOfLines={1}
                        >
                            {item.shootDate || 'N/A'}
                        </Text>
                    </View>

                    <View
                        style={{
                            flex: 1,
                            alignItems: 'flex-end',
                        }}
                    >
                        <Label title="ADDED" />

                        <Text
                            style={{
                                fontFamily:
                                    Fonts.Regular,
                                fontSize: 9,
                                color: '#77748A',
                            }}
                        >
                            {item.added}
                        </Text>
                    </View>
                </View>

                {/* EXPANDED ASSIGN SECTION */}

                {expandedPendingId === item.id && (
                    <Animated.View
                        style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTopWidth: 0.6,
                            borderTopColor: '#ECE9F3',
                            opacity: getPendingAnim(item.id),
                            transform: [{
                                translateY: getPendingAnim(item.id).interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-14, 0],
                                }),
                            }],
                        }}
                    >
                        <Label title="ASSIGN COORDINATOR POST PRODUCTION" />

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setEditorPickerModal(true)}
                            style={{
                                height: 44,
                                borderWidth: 0.7,
                                borderColor: '#E1DDF7',
                                borderRadius: 10,
                                paddingHorizontal: 11,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#FAF9FF',
                                marginTop: 5,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 11,
                                    color: selectedEditor ? '#29263B' : '#9996A6',
                                    texttransform: 'capitalize'
                                }}
                                numberOfLines={1}
                            >
                                {selectedEditor ? selectedEditor.label : 'Select Coordinator Post Production'}
                            </Text>

                            <Icon name="chevron-down" size={18} color="#6366F1" />
                        </TouchableOpacity>

                        {assignError !== '' && (
                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    color: '#EF4444',
                                    marginTop: 7,
                                }}
                            >
                                {assignError}
                            </Text>
                        )}

                        <View style={{ flexDirection: 'row', marginTop: 10 }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                disabled={!selectedEditor || assigning}
                                onPress={handleAssign}
                                style={{
                                    flex: 1,
                                    height: 42,
                                    borderRadius: 9,
                                    backgroundColor: selectedEditor ? Colors.buttonbgcolor : '#D8D5E3',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 8,
                                }}
                            >
                                {assigning ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Icon name="account-check-outline" size={16} color="#fff" />
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 10, color: '#fff', marginLeft: 6 }}>
                                            Assign
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* VIEW BUTTON */}
                            <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => {
                                    setAssignModal(false);
                                    navigation.navigate('NewCoordination', {
                                        bookingData: item,
                                    });
                                }}
                                style={{
                                    marginLeft: 8,
                                    backgroundColor: '#e5e3f5',
                                    borderRadius: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 0.6,
                                    borderColor: '#D6D2F0',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 9,
                                        color: '#6366F1',
                                    }}
                                >
                                    Detail
                                </Text>

                                <Icon
                                    name="arrow-right"
                                    size={13}
                                    color="#6366F1"
                                    style={{ marginLeft: 5 }}
                                />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            </View>
        );
    };

    /* =========================================================
       ASSIGNED CARD
       Fields: # · Client · Coordinator → Editor · Task Progress ·
               Added · Action (tap card / chevron to expand tasks)
       COLLAPSED BY DEFAULT
    ========================================================= */

    const AssignedCard = ({ item, index, forceComplete = false }) => {
        const progress = getProgress(item, forceComplete);
        const hasTasks = item.tasks && item.tasks.length > 0;
        const isExpanded = expandedTask === item.id;
        const hasOverdue = (item.tasks || []).some(t => isOverdue(t.dueRaw, t.status));

        return (
            <View
                style={{
                    marginHorizontal: 10,
                    marginBottom: 10,
                    backgroundColor: '#fff',
                    borderRadius: 13,
                    borderWidth: 0.6,
                    borderColor: '#E5E1F4',
                    overflow: 'hidden',
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.03,
                    shadowRadius: 3,
                    shadowOffset: {
                        width: 0,
                        height: 1,
                    },
                }}
            >
                <TouchableOpacity
                    activeOpacity={hasTasks ? 0.75 : 1}
                    disabled={!hasTasks}
                    onPress={() =>
                        toggleAssignedCard(item)
                    }
                    style={{
                        padding: 13,
                        backgroundColor: isExpanded
                            ? '#FBFAFF'
                            : '#fff',
                    }}
                >
                    {/* MAIN HEADER */}

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        {/* NUMBER */}

                        <View
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 9,
                                backgroundColor:
                                    '#EEECFF',
                                alignItems: 'center',
                                justifyContent:
                                    'center',
                                marginRight: 9,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily:
                                        Fonts.Bold,
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
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily:
                                        Fonts.Bold,
                                    fontSize: 13,
                                    color: '#29263B',
                                }}
                            >
                                {item.booking} ·{' '}
                                {item.client}
                            </Text>

                            <View
                                style={{
                                    flexDirection:
                                        'row',
                                    alignItems:
                                        'center',
                                    marginTop: 3,
                                }}
                            >
                                <Icon
                                    name="phone-outline"
                                    size={12}
                                    color="#77748A"
                                />

                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Regular,
                                        fontSize: 9.5,
                                        color: '#77748A',
                                        marginLeft: 4,
                                    }}
                                >
                                    {item.mobile}
                                </Text>
                            </View>
                        </View>

                        {/* COORDINATOR -> EDITOR badge */}

                        <View
                            style={{
                                alignItems:
                                    'flex-end',
                                maxWidth: 125,
                            }}
                        >
                            <Label title="COORDINATOR POST PRODUCTION" />

                            <View
                                style={{
                                    backgroundColor:
                                        '#EEECFF',
                                    borderRadius: 13,
                                    paddingHorizontal:
                                        10,
                                    paddingVertical:
                                        5,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Bold,
                                        fontSize: 9,
                                        color: '#6366F1',
                                    }}
                                    numberOfLines={1}
                                    texttransform="capitalize"
                                >
                                    {item.coordinator}
                                </Text>
                            </View>
                        </View>

                        {/* ACTION: expand/collapse arrow, only when task exists */}

                        {hasTasks && (
                            <View
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    backgroundColor:
                                        isExpanded
                                            ? '#EEECFF'
                                            : '#F5F3FA',
                                    alignItems:
                                        'center',
                                    justifyContent:
                                        'center',
                                    marginLeft: 8,
                                }}
                            >
                                <Icon
                                    name={
                                        isExpanded
                                            ? 'chevron-up'
                                            : 'chevron-down'
                                    }
                                    size={19}
                                    color={
                                        isExpanded
                                            ? '#6366F1'
                                            : '#858196'
                                    }
                                />
                            </View>
                        )}

                    </View>

                    {/* SMALL INFO ROW: TASK PROGRESS · ADDED */}

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 11,
                        }}
                    >
                        {/* TASK COUNT */}

                        {/* TASK COUNT */}

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: hasTasks ? '#F1EFFF' : '#F5F4F8',
                                borderRadius: 9,
                                paddingHorizontal: 9,
                                paddingVertical: 6,
                            }}
                        >
                            <Icon
                                name="clipboard-text-outline"
                                size={13}
                                color={hasTasks ? '#6366F1' : '#9996A7'}
                            />

                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    fontSize: 9,
                                    color: hasTasks ? '#6366F1' : '#9996A7',
                                    marginLeft: 5,
                                }}
                            >
                                {hasTasks
                                    ? `${item.tasks.length} Task${item.tasks.length > 1 ? 's' : ''}`
                                    : 'No Tasks'}
                            </Text>

                            {/* ✅ YAHAN ADD KARO */}
                            {hasOverdue && (
                                <Icon name="alert-circle" size={15} color="#DC2626" style={{ marginLeft: 6 }} />
                            )}
                        </View>

                        {/* PROGRESS */}
                        <View
                            style={{
                                flex: 1,
                                marginLeft: 9,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 8,
                                        color: '#8A8799',
                                    }}
                                >
                                    {progress.completed} / {progress.total} COMPLETED
                                </Text>

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 9,
                                        color:
                                            progress.percentage === 100
                                                ? '#16A36A'
                                                : '#6366F1',
                                    }}
                                >
                                    {progress.percentage}%
                                </Text>
                            </View>

                            <View
                                style={{
                                    height: 6,
                                    backgroundColor: '#E8E5F4',
                                    borderRadius: 6,
                                    marginTop: 4,
                                    overflow: 'hidden',
                                }}
                            >
                                <View
                                    style={{
                                        width: `${progress.percentage}%`,
                                        height: 6,
                                        backgroundColor:
                                            progress.percentage === 100
                                                ? '#16A36A'
                                                : '#6366F1',
                                        borderRadius: 6,
                                    }}
                                />
                            </View>
                        </View>
                        {/* ADDED */}

                        <View
                            style={{
                                marginLeft: 9,
                                alignItems: 'flex-end',
                            }}
                        >
                            <Label title="ADDED" />

                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 8.5,
                                    color: '#77748A',
                                }}
                            >
                                {item.added}
                            </Text>
                        </View>

                        {/* VIEW BUTTON */}
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => {
                                setAssignModal(false);
                                navigation.navigate('NewCoordination', {
                                    bookingData: item,
                                });
                            }}
                            style={{
                                marginLeft: 9,
                                backgroundColor: '#e5e3f5',
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 0.6,
                                borderColor: '#D6D2F0',
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    fontSize: 9,
                                    color: '#6366F1',
                                }}
                            >
                                Detail
                            </Text>

                            <Icon
                                name="arrow-right"
                                size={13}
                                color="#6366F1"
                                style={{ marginLeft: 5 }}
                            />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {hasTasks && isExpanded && (
                    <Animated.View
                        style={{
                            paddingHorizontal: 11,
                            paddingBottom: 11,
                            paddingTop: 3,
                            backgroundColor: '#FBFAFF',
                            opacity: getAssignedAnim(item.id),
                            transform: [{
                                translateY: getAssignedAnim(item.id).interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-14, 0],
                                }),
                            }],
                        }}
                    >
                        <View
                            style={{
                                flexDirection:
                                    'row',
                                alignItems:
                                    'center',
                                marginBottom: 9,
                            }}
                        >
                            <View
                                style={{
                                    width: 19,
                                    height: 2,
                                    borderRadius: 2,
                                    backgroundColor:
                                        Colors.buttonbgcolor,
                                    marginRight: 6,
                                }}
                            />

                            <Text
                                style={{
                                    fontFamily:
                                        Fonts.Bold,
                                    fontSize: 9,
                                    color: '#6366F1',
                                    letterSpacing:
                                        0.5,
                                }}
                            >
                                {forceComplete ? 'COMPLETED TASKS' : 'ASSIGNED TASKS'}
                            </Text>
                        </View>

                        {item.tasks.map(
                            (
                                task,
                                taskIndex,
                            ) => {
                                const statusStyle =
                                    getStatusStyle(
                                        task.status,
                                    );

                                return (
                                    <View
                                        key={
                                            task.id
                                        }
                                        style={{
                                            backgroundColor:
                                                '#fff',
                                            borderWidth:
                                                0.6,
                                            borderColor:
                                                '#E5E1F4',
                                            borderRadius:
                                                11,
                                            padding: 11,
                                            marginBottom: taskIndex < item.tasks.length - 1 ? 8 : 0,
                                        }}
                                    >
                                        {/* TASK TOP */}

                                        <View
                                            style={{
                                                flexDirection:
                                                    'row',
                                                alignItems:
                                                    'center',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius:
                                                        9,
                                                    backgroundColor:
                                                        '#EEECFF',
                                                    alignItems:
                                                        'center',
                                                    justifyContent:
                                                        'center',
                                                }}
                                            >
                                                <Icon
                                                    name={
                                                        task.type ===
                                                            'Photo'
                                                            ? 'image-outline'
                                                            : 'video-outline'
                                                    }
                                                    size={
                                                        17
                                                    }
                                                    color="#6366F1"
                                                />
                                            </View>

                                            <View
                                                style={{
                                                    flex: 1,
                                                    marginLeft:
                                                        8,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily:
                                                            Fonts.Bold,
                                                        fontSize:
                                                            11,
                                                        color:
                                                            '#29263B',
                                                    }}
                                                    numberOfLines={
                                                        1
                                                    }
                                                >
                                                    {task.type === 'Photo' ? 'Photo Editing' : 'Video Editing'}
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontFamily:
                                                            Fonts.Regular,
                                                        fontSize:
                                                            8.5,
                                                        color:
                                                            '#77748A',
                                                        marginTop:
                                                            2,
                                                    }}
                                                >
                                                    {
                                                        task.editor
                                                    }{' '}
                                                    ·{' '}
                                                    {
                                                        task.type
                                                    }{' '}
                                                    ·{' '}
                                                    {
                                                        task.priority
                                                    }
                                                </Text>
                                            </View>

                                            {/* STATUS */}

                                            <View
                                                style={{
                                                    alignItems:
                                                        'flex-end',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection:
                                                            'row',
                                                        alignItems:
                                                            'center',
                                                        backgroundColor:
                                                            statusStyle.background,
                                                        borderRadius:
                                                            13,
                                                        paddingHorizontal:
                                                            9,
                                                        paddingVertical:
                                                            5,
                                                    }}
                                                >
                                                    <Icon
                                                        name={
                                                            statusStyle.icon
                                                        }
                                                        size={
                                                            12
                                                        }
                                                        color={
                                                            statusStyle.color
                                                        }
                                                    />

                                                    <Text
                                                        style={{
                                                            fontFamily:
                                                                Fonts.Bold,
                                                            fontSize:
                                                                9,
                                                            color:
                                                                statusStyle.color,
                                                            marginLeft:
                                                                4,
                                                        }}
                                                    >
                                                        {
                                                            task.status
                                                        }
                                                    </Text>
                                                </View>

                                                <Text
                                                    style={{
                                                        fontFamily: Fonts.Regular,
                                                        fontSize: 8,
                                                        color: '#77748A',
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    Entry: {task.entryDate || '--'}
                                                </Text>

                                                {(() => {
                                                    const overdue = isOverdue(task.dueRaw, task.status);
                                                    return (
                                                        <>
                                                            <Text
                                                                style={{
                                                                    fontFamily: overdue ? Fonts.Bold : Fonts.Regular,
                                                                    fontSize: 8,
                                                                    color: overdue ? '#DC2626' : '#77748A',
                                                                    marginTop: 2,
                                                                }}
                                                            >
                                                                Due: {task.due}
                                                            </Text>

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
                                                                            fontFamily: Fonts.Bold,
                                                                            fontSize: 8,
                                                                            color: '#DC2626',
                                                                            marginLeft: 3,
                                                                        }}
                                                                    >
                                                                        Overdue
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </View>
                                        </View>

                                        {/* DIVIDER */}

                                        <View
                                            style={{
                                                height:
                                                    0.5,
                                                backgroundColor:
                                                    '#ECE9F3',
                                                marginVertical:
                                                    8,
                                            }}
                                        />

                                        {/* DESCRIPTION */}

                                        <View
                                            style={{
                                                flexDirection:
                                                    'row',
                                                alignItems:
                                                    'flex-start',
                                            }}
                                        >
                                            <Icon
                                                name="text-box-outline"
                                                size={
                                                    12
                                                }
                                                color="#77748A"
                                            />

                                            <Text
                                                style={{
                                                    flex: 1,
                                                    fontFamily:
                                                        Fonts.Regular,
                                                    fontSize:
                                                        8.5,
                                                    color:
                                                        '#77748A',
                                                    marginLeft:
                                                        5,
                                                    lineHeight:
                                                        13,
                                                    textTransform:
                                                        'capitalize',
                                                }}
                                            >
                                                {
                                                    task.description
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                );
                            },
                        )}
                    </Animated.View>
                )}
            </View>
        );
    };

    /* =========================================================
       RETURN
    ========================================================= */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#F7F6FB',
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

            <View
                style={{
                    backgroundColor: Colors.buttonbgcolor,
                    paddingHorizontal: 14,
                    paddingTop: 13,
                    paddingBottom: 13,
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
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
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 34,
                            height: 34,
                            justifyContent: 'center',
                            zIndex: 2,
                        }}
                    >
                        <Icon
                            name="arrow-left"
                            size={23}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    {/* CENTER TEXT */}
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
                                fontSize: 16,
                                color: '#fff',
                            }}
                        >
                            Coordinator Post Production
                        </Text>


                    </View>


                </View>
            </View>

            {/* =================================================
                BODY
            ================================================= */}
            <FlatList
                data={
                    loadingList
                        ? []
                        : activeTab === 'pending' ? visiblePending :
                            activeTab === 'assigned' ? visibleAssigned :
                                visibleComplete
                }
                keyExtractor={item => item.id}

                renderItem={({ item, index }) =>
                    activeTab === 'pending' ? (
                        <PendingCard item={item} index={index} />
                    ) : activeTab === 'assigned' ? (
                        <AssignedCard item={item} index={index} />
                    ) : (
                        <AssignedCard item={item} index={index} forceComplete />
                    )
                }
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.buttonbgcolor]}
                        tintColor={Colors.buttonbgcolor}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: 30,
                }}
                ListHeaderComponent={
                    <View>
                        {/* =================================================
                TABS
            ================================================= */}

                        <View style={{ marginHorizontal: 10, marginTop: 10, marginBottom: 4 }}>
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 9.5, letterSpacing: 1, color: '#6366F1', marginBottom: 8 }}>
                                PROJECT OVERVIEW
                            </Text>

                            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                <OverviewStat icon="folder-multiple-outline" color="#6366F1" value={totalProjects} label="Total Projects" style={{ marginRight: 8 }} />
                                <OverviewStat icon="clipboard-list-outline" color="#0EA5E9" value={totalTasks} label="Total Tasks" />
                            </View>

                            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                <OverviewStat icon="timer-sand" color="#F59E0B" value={pendingTaskCount} label="Pending Tasks" style={{ marginRight: 8 }} />
                                <OverviewStat icon="sync" color="#8B5CF6" value={inProgressTaskCount} label="In Progress" />
                            </View>

                            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                                <OverviewStat icon="eye-check-outline" color="#EC4899" value={reviewTaskCount} label="In Review" style={{ marginRight: 8 }} />
                                <OverviewStat icon="check-circle-outline" color="#16A34A" value={doneTaskCount} label="Done Tasks" />
                            </View>

                            <OverviewStat icon="check-decagram-outline" color="#0F9F68" value={completedProjectsCount} label="Completed Projects" />
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: '#fff',
                                marginTop: 9,
                                borderBottomWidth: 0.6,
                                borderBottomColor: '#E3E0EF',
                            }}
                        >
                            {[
                                { key: 'pending', label: 'Pending', count: pendingCount },
                                { key: 'assigned', label: 'Assigned', count: assignedCount },
                                { key: 'complete', label: 'Completed', count: completeCount },
                            ].map(tab => {
                                const active = activeTab === tab.key;
                                return (
                                    <TouchableOpacity
                                        key={tab.key}
                                        activeOpacity={0.8}
                                        onPress={() => setActiveTab(tab.key)}
                                        style={{
                                            flex: 1,
                                            height: 52,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderBottomWidth: active ? 2 : 0,
                                            borderBottomColor: Colors.buttonbgcolor,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text
                                                numberOfLines={1}
                                                style={{
                                                    fontFamily: Fonts.Bold,
                                                    fontSize: 9.5,
                                                    color: active ? Colors.buttonbgcolor : '#77748A',
                                                }}
                                            >
                                                {tab.label}
                                            </Text>

                                            <View
                                                style={{
                                                    minWidth: 18,
                                                    height: 18,
                                                    borderRadius: 10,
                                                    backgroundColor: active ? Colors.buttonbgcolor : '#EEECFF',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginLeft: 4,
                                                    paddingHorizontal: 3,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: Fonts.Bold,
                                                        fontSize: 8,
                                                        color: active ? '#fff' : '#6366F1',
                                                    }}
                                                >
                                                    {tab.count}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* =================================================
                SEARCH
            ================================================= */}

                        <View
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 7,
                            }}
                        >
                            <View
                                style={{
                                    flex: activeTab === 'pending' ? 1.1 : 1.4,
                                    height: 40,
                                    backgroundColor: '#fff',
                                    borderRadius: 20,
                                    borderWidth: 0.6,
                                    borderColor: '#E1DDF7',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Icon name="magnify" size={17} color="#6366F1" />

                                <TextInput
                                    value={search}
                                    onChangeText={setSearch}
                                    placeholder="Search..."
                                    placeholderTextColor="#9997A8"
                                    style={{
                                        flex: 1,
                                        marginLeft: 6,
                                        padding: 0,
                                        fontFamily: Fonts.Regular,
                                        fontSize: 9.5,
                                        color: '#2C2940',
                                    }}
                                />

                                {search.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearch('')}>
                                        <Icon name="close-circle" size={15} color="#AAA7B8" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {activeTab === 'pending' && (
                                <>
                                    <FilterButton icon="camera-outline" label={selectedPhotographer.label} onPress={() => setPhotographerModal(true)} />
                                    <FilterButton icon="account-group-outline" label={selectedCoordinator.label} onPress={() => setCoordinatorModal(true)} />
                                </>
                            )}

                            {(activeTab === 'assigned' || activeTab === 'complete') && (
                                <FilterButton icon="account-edit-outline" label={selectedEditor2.label} onPress={() => setEditorFilterModal(true)} />
                            )}
                        </View>

                        {/* =================================================
                LIST TITLE
            ================================================= */}

                        <View
                            style={{
                                paddingHorizontal: 12,
                                marginTop: 12,
                                marginBottom: 7,
                            }}
                        >
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 9.5, letterSpacing: 1, color: '#6366F1' }}>
                                {activeTab === 'pending' ? 'PENDING ASSIGNMENTS' : activeTab === 'assigned' ? 'ASSIGNED EDITOR QUEUE' : 'COMPLETED PROJECTS'}
                            </Text>

                            <Text style={{ fontFamily: Fonts.Regular, fontSize: 9.5, color: '#8A8799', marginTop: 3 }}>
                                {activeTab === 'pending'
                                    ? `${filteredPending.length} assignments waiting for editor`
                                    : activeTab === 'assigned'
                                        ? `${filteredAssigned.length} assigned projects`
                                        : `${filteredComplete.length} completed projects`}
                            </Text>
                        </View>

                        {/* LOADING / ERROR states as header-inline (only when true) */}



                        {!loadingList && listError !== '' && (
                            <View
                                style={{
                                    marginHorizontal: 10,
                                    backgroundColor: '#fff',
                                    borderRadius: 12,
                                    paddingVertical: 40,
                                    alignItems: 'center',
                                    borderWidth: 0.6,
                                    borderColor: '#E6E2F1',
                                }}
                            >
                                <Icon name="alert-circle-outline" size={34} color="#EF4444" />

                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 11.5,
                                        color: '#39364A',
                                        marginTop: 8,
                                        textAlign: 'center',
                                        paddingHorizontal: 20,
                                    }}
                                >
                                    {listError}
                                </Text>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => fetchList(activeTab)}
                                    style={{
                                        marginTop: 10,
                                        backgroundColor: Colors.buttonbgcolor,
                                        borderRadius: 8,
                                        paddingHorizontal: 18,
                                        paddingVertical: 9,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontFamily: Fonts.Bold, fontSize: 10 }}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    loadingList ? (
                        <View style={{ paddingVertical: 100, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 11,
                                    color: '#8A8799',
                                    marginTop: 10,
                                }}
                            >
                                Loading...
                            </Text>
                        </View>
                    ) : listError === '' ? (
                        activeTab === 'pending' ? (
                            <View style={{ marginHorizontal: 10, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 45, alignItems: 'center', borderWidth: 0.6, borderColor: '#E6E2F1' }}>
                                <Icon name="clipboard-check-outline" size={40} color="#AAA7B8" />
                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 14.5, color: '#39364A', marginTop: 8 }}>No pending assignments</Text>
                            </View>
                        ) : activeTab === 'assigned' ? (
                            <View style={{ marginHorizontal: 10, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 45, alignItems: 'center', borderWidth: 0.6, borderColor: '#E6E2F1' }}>
                                <Icon name="account-multiple-outline" size={40} color="#AAA7B8" />
                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 14.5, color: '#39364A', marginTop: 8 }}>No assigned projects</Text>
                            </View>
                        ) : (
                            <View style={{ marginHorizontal: 10, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 45, alignItems: 'center', borderWidth: 0.6, borderColor: '#E6E2F1' }}>
                                <Icon name="check-decagram-outline" size={40} color="#AAA7B8" />
                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 14.5, color: '#39364A', marginTop: 8 }}>No completed projects</Text>
                            </View>
                        )
                    ) : null
                }
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                        </View>
                    ) : null
                }
            />

            {/* =====================================================
                ASSIGN EDITOR MODAL
            ===================================================== */}

            <Modal
                visible={assignModal}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    setAssignModal(false)
                }
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor:
                            'rgba(20,18,40,0.45)',
                        justifyContent:
                            'flex-end',
                    }}
                >
                    <View
                        style={{
                            backgroundColor:
                                '#fff',
                            borderTopLeftRadius:
                                20,
                            borderTopRightRadius:
                                20,
                            paddingHorizontal:
                                16,
                            paddingTop: 16,
                            paddingBottom: 18,
                            maxHeight: '82%',
                            minHeight: 300,
                        }}
                    >
                        {/* HEADER */}

                        <View
                            style={{
                                flexDirection:
                                    'row',
                                alignItems:
                                    'center',
                                justifyContent:
                                    'space-between',
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    paddingRight: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Bold,
                                        fontSize: 17,
                                        color: '#29263B',
                                    }}
                                    numberOfLines={
                                        1
                                    }
                                >
                                    Assign Coordinator
                                    → Editor
                                </Text>

                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Regular,
                                        fontSize: 9.5,
                                        color: '#8A8799',
                                        marginTop: 3,
                                    }}
                                >
                                    Select an editor for
                                    this assignment
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setAssignModal(
                                        false,
                                    );
                                    setSelectedEditor(
                                        null,
                                    );
                                }}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    backgroundColor:
                                        '#F3F1F8',
                                    alignItems:
                                        'center',
                                    justifyContent:
                                        'center',
                                }}
                            >
                                <Icon
                                    name="close"
                                    size={19}
                                    color="#77748A"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* CLIENT */}

                        {selectedAssignment && (
                            <View
                                style={{
                                    marginTop: 12,
                                    padding: 11,
                                    borderRadius: 10,
                                    backgroundColor: '#F7F6FF',
                                    borderWidth: 0.6,
                                    borderColor: '#E2DFFF',
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
                                            width: 30,
                                            height: 30,
                                            borderRadius: 8,
                                            backgroundColor: '#EEECFF',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 9,
                                        }}
                                    >
                                        <Icon
                                            name="account-outline"
                                            size={16}
                                            color="#6366F1"
                                        />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 11.5,
                                                color: '#29263B',
                                            }}
                                            numberOfLines={1}
                                        >
                                            {selectedAssignment.booking} · {selectedAssignment.client}
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Regular,
                                                fontSize: 9,
                                                color: '#77748A',
                                                marginTop: 2,
                                            }}
                                            numberOfLines={1}
                                        >
                                            Mobile: {selectedAssignment.mobile}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() =>
                                            navigation.navigate('NewCoordination', {
                                                bookingData: item,
                                            })
                                        }
                                        style={{
                                            backgroundColor: Colors.buttonbgcolor,
                                            borderRadius: 8,
                                            paddingHorizontal: 11,
                                            paddingVertical: 7,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginLeft: 8,
                                        }}
                                    >
                                        <Icon
                                            name="eye-outline"
                                            size={13}
                                            color="#fff"
                                        />

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 9,
                                                color: '#fff',
                                                marginLeft: 4,
                                            }}
                                        >
                                            View
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* LABEL */}

                        <View
                            style={{
                                flexDirection:
                                    'row',
                                alignItems:
                                    'center',
                                justifyContent:
                                    'space-between',
                                marginTop: 13,
                                marginBottom: 6,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily:
                                        Fonts.Bold,
                                    fontSize: 9.5,
                                    color: '#77748A',
                                }}
                            >
                                SELECT COORDINATOR POSTPRODUCTION
                            </Text>

                            <View
                                style={{
                                    backgroundColor:
                                        '#EEECFF',
                                    paddingHorizontal:
                                        8,
                                    paddingVertical:
                                        4,
                                    borderRadius:
                                        10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Bold,
                                        fontSize: 8.5,
                                        color: '#6366F1',
                                    }}
                                >
                                    {
                                        editorOptions.length
                                    }{' '}
                                    Editors
                                </Text>
                            </View>
                        </View>

                        {/* EDITOR LIST */}

                        <View
                            style={{
                                maxHeight: 250,
                            }}
                        >
                            {editorsLoading ? (
                                <View
                                    style={{
                                        paddingVertical: 40,
                                        alignItems: 'center',
                                    }}
                                >
                                    <ActivityIndicator
                                        size="small"
                                        color={Colors.buttonbgcolor}
                                    />

                                    <Text
                                        style={{
                                            fontFamily: Fonts.Regular,
                                            fontSize: 9.5,
                                            color: '#8A8799',
                                            marginTop: 8,
                                        }}
                                    >
                                        Loading editors...
                                    </Text>
                                </View>
                            ) : editorsError ? (
                                <View
                                    style={{
                                        paddingVertical: 30,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Icon
                                        name="alert-circle-outline"
                                        size={28}
                                        color="#EF4444"
                                    />

                                    <Text
                                        style={{
                                            fontFamily: Fonts.Bold,
                                            fontSize: 10.5,
                                            color: '#39364A',
                                            marginTop: 6,
                                            textAlign: 'center',
                                            paddingHorizontal: 20,
                                        }}
                                    >
                                        {editorsError}
                                    </Text>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={fetchEditors}
                                        style={{
                                            marginTop: 10,
                                            backgroundColor: Colors.buttonbgcolor,
                                            borderRadius: 8,
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: '#fff',
                                                fontFamily: Fonts.Bold,
                                                fontSize: 9.5,
                                            }}
                                        >
                                            Retry
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : editorOptions.length === 0 ? (
                                <View
                                    style={{
                                        paddingVertical: 30,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Icon
                                        name="account-off-outline"
                                        size={28}
                                        color="#AAA7B8"
                                    />

                                    <Text
                                        style={{
                                            fontFamily: Fonts.Regular,
                                            fontSize: 10,
                                            color: '#77748A',
                                            marginTop: 6,
                                        }}
                                    >
                                        No editors found
                                    </Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={
                                        editorOptions
                                    }
                                    keyExtractor={item =>
                                        `${item.value}`
                                    }
                                    showsVerticalScrollIndicator={
                                        false
                                    }
                                    nestedScrollEnabled={
                                        true
                                    }
                                    keyboardShouldPersistTaps="handled"
                                    renderItem={({
                                        item,
                                        index,
                                    }) => {
                                        const selected =
                                            selectedEditor?.value ===
                                            item.value;

                                        return (
                                            <TouchableOpacity
                                                activeOpacity={
                                                    0.8
                                                }
                                                onPress={() =>
                                                    setSelectedEditor(
                                                        item,
                                                    )
                                                }
                                                style={{
                                                    minHeight: 46,
                                                    borderWidth:
                                                        0.7,
                                                    borderColor:
                                                        selected
                                                            ? Colors.buttonbgcolor
                                                            : '#E3E0EF',
                                                    borderRadius: 9,
                                                    marginBottom: 6,
                                                    paddingHorizontal: 10,
                                                    flexDirection:
                                                        'row',
                                                    alignItems:
                                                        'center',
                                                    justifyContent:
                                                        'space-between',
                                                    backgroundColor:
                                                        selected
                                                            ? '#F1EFFF'
                                                            : '#FAF9FF',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection:
                                                            'row',
                                                        alignItems:
                                                            'center',
                                                        flex: 1,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: 30,
                                                            height: 30,
                                                            borderRadius: 8,
                                                            backgroundColor:
                                                                selected
                                                                    ? Colors.buttonbgcolor
                                                                    : '#EEECFF',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'center',
                                                            marginRight: 8,
                                                        }}
                                                    >
                                                        <Icon
                                                            name="account-edit-outline"
                                                            size={16}
                                                            color={
                                                                selected
                                                                    ? '#fff'
                                                                    : '#6366F1'
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
                                                                fontFamily:
                                                                    Fonts.Bold,
                                                                fontSize: 10.5,
                                                                color: selected
                                                                    ? Colors.buttonbgcolor
                                                                    : '#39364A',
                                                            }}
                                                            numberOfLines={
                                                                1
                                                            }
                                                        >
                                                            {
                                                                item.label
                                                            }
                                                        </Text>

                                                        <Text
                                                            style={{
                                                                fontFamily:
                                                                    Fonts.Regular,
                                                                fontSize: 8,
                                                                color: '#9A97A8',
                                                                marginTop: 1,
                                                            }}
                                                        >
                                                            Editor #
                                                            {
                                                                index +
                                                                1
                                                            }
                                                        </Text>
                                                    </View>
                                                </View>

                                                {selected && (
                                                    <Icon
                                                        name="check-circle"
                                                        size={
                                                            19
                                                        }
                                                        color={
                                                            Colors.buttonbgcolor
                                                        }
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            )}
                        </View>

                        {/* SELECTED */}

                        {selectedEditor && (
                            <View
                                style={{
                                    flexDirection:
                                        'row',
                                    alignItems:
                                        'center',
                                    backgroundColor:
                                        '#F0FBF6',
                                    borderRadius: 8,
                                    paddingHorizontal:
                                        10,
                                    paddingVertical:
                                        7,
                                    marginTop: 7,
                                    borderWidth:
                                        0.5,
                                    borderColor:
                                        '#D6F1E4',
                                }}
                            >
                                <Icon
                                    name="check-circle-outline"
                                    size={16}
                                    color="#0F9F68"
                                />

                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Bold,
                                        fontSize: 9.5,
                                        color: '#0F9F68',
                                        marginLeft: 5,
                                        flex: 1,
                                    }}
                                    numberOfLines={
                                        1
                                    }
                                >
                                    Selected:{' '}
                                    {
                                        selectedEditor.label
                                    }
                                </Text>
                            </View>
                        )}

                        {/* ASSIGN ERROR */}

                        {assignError !== '' && (
                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    color: '#EF4444',
                                    marginTop: 7,
                                }}
                            >
                                {assignError}
                            </Text>
                        )}

                        {/* ASSIGN */}

                        <TouchableOpacity
                            activeOpacity={0.8}
                            disabled={
                                !selectedEditor || assigning
                            }
                            onPress={
                                handleAssign
                            }
                            style={{
                                height: 46,
                                marginTop: 9,
                                borderRadius: 10,
                                backgroundColor:
                                    selectedEditor
                                        ? Colors.buttonbgcolor
                                        : '#D8D5E3',
                                flexDirection:
                                    'row',
                                alignItems:
                                    'center',
                                justifyContent:
                                    'center',
                            }}
                        >
                            {assigning ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#fff"
                                />
                            ) : (
                                <>
                                    <Icon
                                        name="account-check-outline"
                                        size={18}
                                        color="#fff"
                                    />

                                    <Text
                                        style={{
                                            fontFamily:
                                                Fonts.Bold,
                                            fontSize: 10.5,
                                            color: '#fff',
                                            marginLeft: 5,
                                        }}
                                        numberOfLines={
                                            1
                                        }
                                    >
                                        {selectedEditor
                                            ? `Assign to ${selectedEditor.label}`
                                            : 'Select Editor First'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* =====================================================
                VIEW DETAILS MODAL
            ===================================================== */}

            <Modal
                visible={viewModal}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    setViewModal(false)
                }
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor:
                            'rgba(20,18,40,0.45)',
                        justifyContent:
                            'flex-end',
                    }}
                >
                    <View
                        style={{
                            maxHeight: '82%',
                            backgroundColor:
                                '#fff',
                            borderTopLeftRadius:
                                20,
                            borderTopRightRadius:
                                20,
                            padding: 16,
                        }}
                    >
                        <View
                            style={{
                                flexDirection:
                                    'row',
                                alignItems:
                                    'center',
                                justifyContent:
                                    'space-between',
                            }}
                        >
                            <View>
                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Bold,
                                        fontSize: 17,
                                        color: '#29263B',
                                    }}
                                >
                                    Assignment Details
                                </Text>

                                {viewItem && (
                                    <Text
                                        style={{
                                            fontFamily:
                                                Fonts.Regular,
                                            fontSize: 9.5,
                                            color: '#77748A',
                                            marginTop: 3,
                                        }}
                                    >
                                        {
                                            viewItem.booking
                                        }{' '}
                                        ·{' '}
                                        {
                                            viewItem.client
                                        }
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={() =>
                                    setViewModal(
                                        false,
                                    )
                                }
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    backgroundColor:
                                        '#F3F1F8',
                                    alignItems:
                                        'center',
                                    justifyContent:
                                        'center',
                                }}
                            >
                                <Icon
                                    name="close"
                                    size={19}
                                    color="#77748A"
                                />
                            </TouchableOpacity>
                        </View>

                        {viewItem && (
                            <ScrollView
                                showsVerticalScrollIndicator={
                                    false
                                }
                                style={{
                                    marginTop: 13,
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor:
                                            '#F8F7FD',
                                        borderRadius:
                                            11,
                                        padding: 12,
                                    }}
                                >
                                    <Label title="COORDINATOR POST PRODUCTION" />

                                    <Text
                                        style={{
                                            fontFamily:
                                                Fonts.Bold,
                                            fontSize: 11.5,
                                            color: '#6366F1',
                                        }}
                                    >
                                        {
                                            viewItem.coordinator
                                        }
                                    </Text>

                                    <View
                                        style={{
                                            flexDirection:
                                                'row',
                                            marginTop: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            <Label title="MOBILE" />

                                            <Text
                                                style={{
                                                    fontFamily:
                                                        Fonts.Bold,
                                                    fontSize: 9.5,
                                                    color: '#555265',
                                                }}
                                            >
                                                {
                                                    viewItem.mobile
                                                }
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            <Label title="ADDED" />

                                            <Text
                                                style={{
                                                    fontFamily:
                                                        Fonts.Regular,
                                                    fontSize: 9,
                                                    color: '#77748A',
                                                }}
                                            >
                                                {
                                                    viewItem.added
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <Text
                                    style={{
                                        fontFamily:
                                            Fonts.Bold,
                                        fontSize: 9.5,
                                        color: '#6366F1',
                                        letterSpacing:
                                            0.7,
                                        marginTop: 15,
                                        marginBottom: 7,
                                    }}
                                >
                                    ASSIGNED TASKS
                                </Text>

                                {viewItem.tasks?.length >
                                    0 ? (
                                    viewItem.tasks.map(
                                        task => {
                                            const style =
                                                getStatusStyle(
                                                    task.status,
                                                );

                                            return (
                                                <View
                                                    key={
                                                        task.id
                                                    }
                                                    style={{
                                                        borderWidth:
                                                            0.6,
                                                        borderColor:
                                                            '#E5E1F4',
                                                        borderRadius:
                                                            10,
                                                        padding: 11,
                                                        marginBottom:
                                                            7,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            flexDirection:
                                                                'row',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <Icon
                                                            name="clipboard-text-outline"
                                                            size={
                                                                19
                                                            }
                                                            color="#6366F1"
                                                        />

                                                        <Text
                                                            style={{
                                                                flex: 1,
                                                                fontFamily:
                                                                    Fonts.Bold,
                                                                fontSize: 10.5,
                                                                color: '#29263B',
                                                                marginLeft: 7,
                                                            }}
                                                        >
                                                            {
                                                                task.task
                                                            }
                                                        </Text>

                                                        <View
                                                            style={{
                                                                backgroundColor:
                                                                    style.background,
                                                                borderRadius:
                                                                    12,
                                                                paddingHorizontal:
                                                                    8,
                                                                paddingVertical:
                                                                    5,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontFamily:
                                                                        Fonts.Bold,
                                                                    fontSize: 8.5,
                                                                    color:
                                                                        style.color,
                                                                }}
                                                            >
                                                                {
                                                                    task.status
                                                                }
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    <Text
                                                        style={{
                                                            fontFamily:
                                                                Fonts.Regular,
                                                            fontSize: 9,
                                                            color: '#77748A',
                                                            marginTop: 7,
                                                        }}
                                                    >
                                                        Editor:{' '}
                                                        {
                                                            task.editor
                                                        }
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontFamily: Fonts.Regular,
                                                            fontSize: 9,
                                                            color: '#77748A',
                                                            marginTop: 3,
                                                        }}
                                                    >
                                                        Entry: {task.entryDate || '--'}
                                                    </Text>

                                                    <Text
                                                        style={{
                                                            fontFamily:
                                                                Fonts.Regular,
                                                            fontSize: 9,
                                                            color: '#77748A',
                                                            marginTop: 3,
                                                        }}
                                                    >
                                                        {
                                                            task.description
                                                        }
                                                    </Text>
                                                </View>
                                            );
                                        },
                                    )
                                ) : (
                                    <View
                                        style={{
                                            paddingVertical:
                                                30,
                                            alignItems:
                                                'center',
                                        }}
                                    >
                                        <Icon
                                            name="clipboard-outline"
                                            size={
                                                37
                                            }
                                            color="#AAA7B8"
                                        />

                                        <Text
                                            style={{
                                                fontFamily:
                                                    Fonts.Regular,
                                                fontSize: 9.5,
                                                color: '#77748A',
                                                marginTop: 6,
                                            }}
                                        >
                                            No tasks assigned
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <FilterModal visible={photographerModal} title="Select Photographer" icon="camera-outline"
                data={[{ label: 'All Photographers', value: 0, icon: 'camera-outline' }, ...photographerOptions]}
                selectedValue={selectedPhotographer.value}
                onSelect={(item) => { setSelectedPhotographer({ label: item.label, value: item.value }); setPhotographerModal(false); }}
                onClose={() => setPhotographerModal(false)}
            />

            <FilterModal visible={coordinatorModal} title="Select Coordinator" icon="account-group-outline"
                data={[{ label: 'All Coordinators', value: 0, icon: 'account-group-outline' }, ...coordinatorOptions]}
                selectedValue={selectedCoordinator.value}
                onSelect={(item) => { setSelectedCoordinator({ label: item.label, value: item.value }); setCoordinatorModal(false); }}
                onClose={() => setCoordinatorModal(false)}
            />

            <FilterModal visible={editorFilterModal} title="Select Coordinator Post Production" icon="account-edit-outline"
                data={[{ label: 'All Editors', value: 0, icon: 'account-edit-outline' }, ...editorOptions]}
                selectedValue={selectedEditor2.value}
                onSelect={(item) => { setSelectedEditor2({ label: item.label, value: item.value }); setEditorFilterModal(false); }}
                onClose={() => setEditorFilterModal(false)}
            />
            <Modal
                visible={editorPickerModal}
                transparent
                animationType="fade"
                onRequestClose={() => setEditorPickerModal(false)}
            >
                <Pressable
                    onPress={() => setEditorPickerModal(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                    }}
                >
                    <Pressable
                        onPress={e => e.stopPropagation()}
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 18,
                            width: '100%',
                            maxHeight: '70%',
                            paddingBottom: 14,
                            overflow: 'hidden',
                        }}
                    >
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
                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 16.5, color: '#172033' }}>
                                Select Coordinator Post Production
                            </Text>

                            <TouchableOpacity onPress={() => setEditorPickerModal(false)}>
                                <Icon name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* SEARCH */}
                        <View
                            style={{
                                marginHorizontal: 18,
                                marginTop: 12,
                                height: 44,
                                backgroundColor: '#F7F6FB',
                                borderRadius: 10,
                                borderWidth: 0.6,
                                borderColor: '#E1DDF7',
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 11,
                            }}
                        >
                            <Icon name="magnify" size={18} color="#6366F1" />

                            <TextInput
                                value={editorSearch}
                                onChangeText={setEditorSearch}
                                placeholder="Search editor..."
                                placeholderTextColor="#9997A8"
                                style={{ flex: 1, marginLeft: 7, padding: 0, fontFamily: Fonts.Regular, fontSize: 13, color: '#2C2940' }}
                            />

                            {editorSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setEditorSearch('')}>
                                    <Icon name="close-circle" size={16} color="#AAA7B8" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={editorOptions.filter(e =>
                                e.label.toLowerCase().includes(editorSearch.trim().toLowerCase())
                            )}
                            keyExtractor={item => `${item.value}`}
                            style={{ marginTop: 8 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={() => (
                                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                    <Icon name="account-off-outline" size={28} color="#AAA7B8" />
                                    <Text style={{ fontFamily: Fonts.Regular, fontSize: 10, color: '#77748A', marginTop: 6 }}>
                                        No editor found
                                    </Text>
                                </View>
                            )}
                            renderItem={({ item }) => {
                                const selected = selectedEditor?.value === item.value;

                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            setSelectedEditor(item);
                                            setEditorPickerModal(false);
                                            setEditorSearch('');
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 18,
                                            paddingVertical: 14,
                                            borderBottomWidth: 0.5,
                                            borderBottomColor: '#f1f5f9',
                                            backgroundColor: selected ? '#f5f3ff' : '#fff',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 17,
                                                backgroundColor: selected ? '#ede9fe' : '#f8fafc',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Icon name="account-edit-outline" size={19} color={selected ? Colors.buttonbgcolor : '#64748b'} />
                                        </View>

                                        <Text
                                            style={{
                                                flex: 1,
                                                marginLeft: 10,
                                                fontFamily: selected ? Fonts.Bold : Fonts.Regular,
                                                fontSize: 14.5,
                                                color: selected ? Colors.buttonbgcolor : '#334155',
                                            }}
                                        >
                                            {item.label}
                                        </Text>

                                        {selected && <Icon name="check-circle" size={22} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

export default Coordinatoreditorassign;

const styles = {};
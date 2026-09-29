import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Modal,
    Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FILTERS = [
    { key: 'all', label: 'All', icon: 'format-list-bulleted', color: '#6366F1' },
    { key: 'pending', label: 'Pending', icon: 'timer-sand', color: '#F59E0B' },
    { key: 'in progress', label: 'In Progress', icon: 'sync', color: '#8B5CF6' },
    { key: 'review', label: 'In Review', icon: 'eye-check-outline', color: '#EC4899' },
];

const normalizeStatus = status =>
    (status || '').toString().toLowerCase().replace(/_/g, ' ').trim();

const formatDate = dateStr => {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const isOverdue = (dateStr, status) => {
    if (!dateStr) return false;
    const s = (status || '').toLowerCase();
    if (s === 'done' || s === 'completed') return false;
    const due = new Date(dateStr);
    if (isNaN(due)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
};

const getStatusStyle = status => {
    switch ((status || '').toLowerCase()) {
        case 'pending':
            return { color: '#F59E0B', bg: '#FEF3C7', icon: 'timer-sand-empty' };
        case 'in progress':
        case 'in_progress':
            return { color: '#0EA5E9', bg: '#E0F2FE', icon: 'sync' };
        case 'review':
            return { color: '#14B8A6', bg: '#CCFBF1', icon: 'eye-outline' };
        case 'done':
        case 'completed':
            return { color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle' };
        default:
            return { color: '#64748B', bg: '#F1F5F9', icon: 'help-circle-outline' };
    }
};

const Stat = ({ icon, color, value, label, style }) => (
    <View
        style={[
            {
                flex: 1,
                backgroundColor: '#fff',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 11,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
            },
            style,
        ]}
    >
        <View
            style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Icon name={icon} size={17} color="#fff" />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: Fonts.Bold, fontSize: 18, color: '#111827' }}>{value}</Text>
            <Text numberOfLines={1} style={{ fontFamily: Fonts.Regular, fontSize: 9.5, color: '#6B7280', marginTop: 1 }}>
                {label}
            </Text>
        </View>
    </View>
);

const EditingSummary = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [counts, setCounts] = useState({
        active_projects: 0,
        total_tasks: 0,
        pending: 0,
        in_progress: 0,
        review: 0,
        done: 0,
    });
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [filterOpen, setFilterOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const adminId = await AsyncStorage.getItem('id');

            const res = await fetch(API.dashboard_api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: adminId, tab: 'editing' }),
            });

            const json = await res.json();

            if (json?.code == 200) {
                const c = json.counts || {};
                const n = k => Number(c[k]) || 0;
                setCounts({
                    active_projects: n('active_projects'),
                    total_tasks: n('total_tasks'),
                    pending: n('pending'),
                    in_progress: n('in_progress'),
                    review: n('review'),
                    done: n('done'),
                });
                setProjects(json.payload?.projects || []);
                setTasks(json.payload?.tasks || []);
            } else {
                setProjects([]);
                setTasks([]);
                const msg = (json?.message || '').toLowerCase();
                if (msg.includes('access') || msg.includes('denied')) {
                    setError('');
                } else {
                    setError(json?.message || 'Could not load data.');
                }
            }
        } catch (e) {
            console.log('Editing summary error:', e);
            setProjects([]);
            setTasks([]);
            setError('Unable to load data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Search + status filter tasks par lagta hai
    const filteredTasks = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tasks.filter(t => {
            if (statusFilter !== 'all' && normalizeStatus(t.status) !== statusFilter) {
                return false;
            }
            if (!q) return true;
            return `${t.order_no} ${t.client_name} ${t.title} ${t.description} ${t.assigned_name} ${t.priority} ${t.status}`
                .toLowerCase()
                .includes(q);
        });
    }, [tasks, search, statusFilter]);

    const tasksByClient = useMemo(() => {
        const map = {};
        filteredTasks.forEach(t => {
            const key = String(t.client_id);
            if (!map[key]) map[key] = [];
            map[key].push(t);
        });
        return map;
    }, [filteredTasks]);

    // Sirf woh projects jinke andar (filter ke baad) task hai
    const visibleProjects = useMemo(
        () => projects.filter(p => (tasksByClient[String(p.client_id)] || []).length > 0),
        [projects, tasksByClient],
    );

    const isFiltering = search.trim() !== '' || statusFilter !== 'all';
    const activeFilter = FILTERS.find(f => f.key === statusFilter) || FILTERS[0];

    return (
        <View>
            <Text
                style={{
                    fontSize: 17,
                    fontFamily: 'Inter-Bold',
                    color: '#0F172A',
                    marginBottom: 9.4,
                    marginLeft: 2,
                }}
            >
                Editing Summary
            </Text>

            {/* COUNTS */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Stat icon="folder-multiple-outline" color="#6366F1" value={counts.active_projects} label="Active Projects" style={{ marginRight: 8 }} />
                <Stat icon="clipboard-list-outline" color="#0EA5E9" value={counts.total_tasks} label="Total Tasks" />
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Stat icon="timer-sand" color="#F59E0B" value={counts.pending} label="Pending" style={{ marginRight: 8 }} />
                <Stat icon="sync" color="#8B5CF6" value={counts.in_progress} label="In Progress" />
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <Stat icon="eye-check-outline" color="#EC4899" value={counts.review} label="In Review" style={{ marginRight: 8 }} />
                <Stat icon="check-circle-outline" color="#16A34A" value={counts.done} label="Done" />
            </View>

            {/* SEARCH + FILTER */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                    style={{
                        flex: 1,
                        height: 42,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        borderWidth: 0.6,
                        borderColor: '#E1DDF7',
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 11,
                    }}
                >
                    <Icon name="magnify" size={18} color="#6366F1" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search booking, client, task..."
                        placeholderTextColor="#9997A8"
                        style={{
                            flex: 1,
                            marginLeft: 7,
                            padding: 0,
                            fontFamily: Fonts.Regular,
                            fontSize: 11.5,
                            color: '#2C2940',
                        }}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Icon name="close-circle" size={16} color="#AAA7B8" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setFilterOpen(true)}
                    style={{
                        height: 42,
                        minWidth: 42,
                        marginLeft: 8,
                        paddingHorizontal: statusFilter !== 'all' ? 10 : 0,
                        borderRadius: 12,
                        borderWidth: 0.6,
                        borderColor: statusFilter !== 'all' ? activeFilter.color : '#E1DDF7',
                        backgroundColor: statusFilter !== 'all' ? `${activeFilter.color}18` : '#fff',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon
                        name="filter-variant"
                        size={20}
                        color={statusFilter !== 'all' ? activeFilter.color : '#6366F1'}
                    />
                    {statusFilter !== 'all' && (
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 10,
                                color: activeFilter.color,
                                marginLeft: 5,
                            }}
                        >
                            {activeFilter.label}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* FILTER MODAL */}
            <Modal
                visible={filterOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterOpen(false)}
            >
                <Pressable
                    onPress={() => setFilterOpen(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(15,23,42,0.35)',
                        justifyContent: 'center',
                        paddingHorizontal: 30,
                    }}
                >
                    <Pressable
                        onPress={() => { }}
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 14,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 14,
                                color: '#0F172A',
                                marginBottom: 10,
                                marginLeft: 2,
                            }}
                        >
                            Filter by status
                        </Text>

                        {FILTERS.map(f => {
                            const selected = statusFilter === f.key;
                            return (
                                <TouchableOpacity
                                    key={f.key}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setStatusFilter(f.key);
                                        setFilterOpen(false);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 10,
                                        paddingHorizontal: 10,
                                        borderRadius: 10,
                                        marginBottom: 6,
                                        borderWidth: 0.6,
                                        borderColor: selected ? f.color : '#EEF0F2',
                                        backgroundColor: selected ? `${f.color}14` : '#FAFAFB',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            backgroundColor: f.color,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                        }}
                                    >
                                        <Icon name={f.icon} size={15} color="#fff" />
                                    </View>
                                    <Text
                                        style={{
                                            flex: 1,
                                            fontFamily: selected ? Fonts.Bold : Fonts.Regular,
                                            fontSize: 12,
                                            color: selected ? f.color : '#39364A',
                                        }}
                                    >
                                        {f.label}
                                    </Text>
                                    {selected && <Icon name="check" size={16} color={f.color} />}
                                </TouchableOpacity>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* LIST */}
            {loading ? (
                <View style={{ paddingVertical: 50, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : error !== '' ? (
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingVertical: 30,
                        alignItems: 'center',
                        borderWidth: 0.6,
                        borderColor: '#E6E2F1',
                    }}
                >
                    <Icon name="alert-circle-outline" size={32} color="#EF4444" />
                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 12,
                            color: '#39364A',
                            marginTop: 8,
                            textAlign: 'center',
                            paddingHorizontal: 20,
                        }}
                    >
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={fetchData}
                        style={{
                            marginTop: 10,
                            backgroundColor: Colors.buttonbgcolor,
                            borderRadius: 8,
                            paddingHorizontal: 18,
                            paddingVertical: 8,
                        }}
                    >
                        <Text style={{ color: '#fff', fontFamily: Fonts.Bold, fontSize: 11 }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : visibleProjects.length === 0 ? (
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingVertical: 40,
                        alignItems: 'center',
                        borderWidth: 0.6,
                        borderColor: '#E6E2F1',
                    }}
                >
                    <Icon name="clipboard-text-outline" size={38} color="#AAA7B8" />
                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#39364A', marginTop: 8 }}>
                        {isFiltering ? 'No results found' : 'No tasks available'}
                    </Text>
                </View>
            ) : (
                visibleProjects.map((p, index) => {
                    const pTasks = tasksByClient[String(p.client_id)] || [];
                    const total = Number(p.task_count) || pTasks.length;
                    const done = Number(p.done_count) || 0;
                    const pct = total ? Math.round((done / total) * 100) : 0;

                    return (
                        <View
                            key={`${p.client_id}-${index}`}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 13,
                                borderWidth: 0.6,
                                borderColor: '#E5E1F4',
                                padding: 12,
                                marginBottom: 10,
                                elevation: 1,
                                shadowColor: '#000',
                                shadowOpacity: 0.03,
                                shadowRadius: 3,
                                shadowOffset: { width: 0, height: 1 },
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 9,
                                        backgroundColor: '#EEECFF',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 9,
                                    }}
                                >
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 10, color: '#6366F1' }}>
                                        {index + 1}
                                    </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#29263B', textTransform: 'capitalize' }}
                                        numberOfLines={1}
                                    >
                                        #{p.order_no} · {p.client_name}
                                    </Text>
                                </View>

                                <View style={{ backgroundColor: '#F1EFFF', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 }}>
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 9, color: '#6366F1' }}>
                                        {`${total} Task${total > 1 ? 's' : ''}`}
                                    </Text>
                                </View>
                            </View>

                            {/* PROGRESS */}
                            <View style={{ marginTop: 10 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 8.5, color: '#8A8799' }}>
                                        {done} / {total} COMPLETED
                                    </Text>
                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 9, color: pct === 100 ? '#16A36A' : '#6366F1' }}>
                                        {pct}%
                                    </Text>
                                </View>
                                <View style={{ height: 6, backgroundColor: '#E8E5F4', borderRadius: 6, marginTop: 4, overflow: 'hidden' }}>
                                    <View
                                        style={{
                                            width: `${pct}%`,
                                            height: 6,
                                            backgroundColor: pct === 100 ? '#16A36A' : '#6366F1',
                                            borderRadius: 6,
                                        }}
                                    />
                                </View>
                            </View>

                            {/* TASKS */}
                            {pTasks.map(t => {
                                const s = getStatusStyle(t.status);
                                const overdue = isOverdue(t.due_date, t.status);
                                return (
                                    <View
                                        key={`${t.id}`}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 8,
                                            backgroundColor: '#FBFAFF',
                                            borderWidth: 0.6,
                                            borderColor: overdue ? '#FCA5A5' : '#E5E1F4',
                                            borderRadius: 10,
                                            padding: 9,
                                        }}
                                    >
                                        <Icon
                                            name={t.task_type === 'Photo' ? 'image-outline' : 'video-outline'}
                                            size={17}
                                            color="#6366F1"
                                        />
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 10.5, color: '#29263B' }} numberOfLines={1}>
                                                {t.title || (t.task_type === 'Photo' ? 'Photo Editing' : 'Video Editing')}
                                            </Text>

                                            {!!t.description && (
                                                <Text
                                                    style={{ fontFamily: Fonts.Regular, fontSize: 9.5, color: '#4B5563', marginTop: 2 }}
                                                    numberOfLines={2}
                                                >
                                                    {t.description}
                                                </Text>
                                            )}

                                            <Text
                                                style={{ fontFamily: Fonts.Regular, fontSize: 9, color: '#77748A', marginTop: 2, textTransform: 'capitalize' }}
                                                numberOfLines={1}
                                            >
                                                {t.assigned_name} · {t.priority}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontFamily: overdue ? Fonts.Bold : Fonts.Regular,
                                                    fontSize: 9,
                                                    color: overdue ? '#DC2626' : '#77748A',
                                                    marginTop: 2,
                                                }}
                                            >
                                                Due: {formatDate(t.due_date)}{overdue ? ' · Overdue' : ''}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: s.bg,
                                                borderRadius: 12,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                            }}
                                        >
                                            <Icon name={s.icon} size={11} color={s.color} />
                                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 8.5, color: s.color, marginLeft: 3 }}>
                                                {t.status}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })
            )}
        </View>
    );
};

export default EditingSummary;
import React, { useState } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../Commoncomponent/Constants';
import { useFocusEffect } from '@react-navigation/native';
import Tasklistshimmer from '../Shimmer/Task/Tasklistshimmer';

/* ── STATIC DATA (API baad me connect karna) ── */
const TASKS = [
    {
        id: '1',
        title: 'today worlk',
        description: 'dsd',
        assigned_to: 'Admin User',
        due_date: '2026-08-20',
        entry_date: '2026-08-18T10:30:00',
        priority: 'Medium',
        status: 'Completed',
    },
    {
        id: '2',
        title: 'Edit wedding album',
        description: 'Finish color correction for ORD-007',
        assigned_to: 'Riya',
        due_date: '2026-08-27',
        entry_date: '2026-08-22T14:15:00',
        priority: 'High',
        status: 'Pending',
    },
    {
        id: '3',
        title: 'Client call follow-up',
        description: 'Confirm shoot location with client',
        assigned_to: 'Myself',
        due_date: '2026-08-26',
        entry_date: '2026-08-24T09:00:00',
        priority: 'Low',
        status: 'In Progress',
    },
];

const STATUS_COLORS = {
    Completed: { bg: '#dcfce7', text: '#15803D' },
    Pending: { bg: '#fef9c3', text: '#A16207' },
    'In Progress': { bg: '#dbeafe', text: '#1D4ED8' },
};

const PRIORITY_COLORS = {
    High: '#DC2626',
    Medium: '#EAB308',
    Low: '#16A34A',
};

const fmtDate = (dateString) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
};

const fmtDateTime = (dateString) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const ListTask = ({ navigation }) => {
    const [search, setSearch] = useState('');
    const [filtered, setFiltered] = useState(TASKS);
    const [loading, setLoading] = useState(false);
    const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);
    const fetchTasks = async () => {
        setLoading(true);

        // TODO: API ready hone par yaha fetch(API.list_task) call karna
        setTimeout(() => {
            setFiltered(TASKS);
            setIsFirstLoadDone(true);
            setLoading(false);
        }, 600);
    };

    useFocusEffect(
        React.useCallback(() => {
            if (search === '') fetchTasks();
        }, [search])
    );

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();
        setFiltered(
            TASKS.filter(t =>
                (t.title || '').toLowerCase().includes(q) ||
                (t.assigned_to || '').toLowerCase().includes(q)
            )
        );
    };

    const renderItem = ({ item, index }) => {
        const statusStyle = STATUS_COLORS[item.status] || { bg: '#f1f5f9', text: '#64748b' };
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Taskdetail', { taskdata: item })}
                style={{
                    backgroundColor: '#fff',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    marginVertical: 7,
                    borderWidth: 1,
                    borderColor: '#eee',
                    position: 'relative',
                }}
            >
                {/* STATUS TOP RIGHT */}
                <View style={{
                    position: 'absolute', top: 0, right: 0,
                    backgroundColor: statusStyle.bg,
                    paddingHorizontal: 10, paddingVertical: 3,
                    borderBottomLeftRadius: 8, borderTopRightRadius: 10,
                }}>
                    <Text style={{ fontSize: 10, fontFamily: Fonts.Bold, color: statusStyle.text }}>
                        {item.status}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <View style={{
                        width: 8, height: 8, borderRadius: 4,
                        backgroundColor: PRIORITY_COLORS[item.priority] || '#94a3b8',
                        marginRight: 6,
                    }} />
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontFamily: Fonts.Regular }}>
                        #{index + 1} · {item.priority} Priority
                    </Text>
                </View>

                {/* TITLE */}
                <Text style={{ fontSize: 15, color: '#1e293b', fontFamily: Fonts.Bold, marginTop: 6 }}>
                    {item.title}
                </Text>

                {/* DESCRIPTION */}
                {!!item.description && (
                    <Text style={{ fontSize: 12, color: '#7f8c8d', fontFamily: Fonts.Regular, marginTop: 3 }} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="account-outline" size={14} color="#94a3b8" />
                        <Text style={{ fontSize: 12, color: '#475569', fontFamily: Fonts.Regular }}>
                            {item.assigned_to}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="calendar-outline" size={14} color="#94a3b8" />
                        <Text style={{ fontSize: 12, color: '#475569', fontFamily: Fonts.Regular }}>
                            {fmtDate(item.due_date)}
                        </Text>
                    </View>
                </View>

                {/* ENTRY ON */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Icon name="calendar-check-outline" size={14} color="#94a3b8" />
                    <Text style={{ fontSize: 12, color: '#475569', fontFamily: Fonts.Regular }}>
                        Entry On: {fmtDateTime(item.entry_date)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View style={{
                height: 52, flexDirection: 'row', alignItems: 'center',
                backgroundColor: Colors.buttonbgcolor, paddingHorizontal: 12,
            }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ width: 36, justifyContent: 'center', alignItems: 'flex-start' }}
                >
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{
                    flex: 1, textAlign: 'center', fontSize: 17,
                    fontFamily: Fonts.Bold, color: '#fff',
                }}>
                    Tasks
                </Text>
                <View style={{ width: 36 }} />
            </View>

            {/* SEARCH */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                borderRadius: 12, margin: 14, paddingHorizontal: 12, height: 44,
                borderWidth: 0.5, borderColor: '#e2e8f0', gap: 8,
            }}>
                <Icon name="magnify" size={18} color="#94a3b8" />
                <TextInput
                    placeholder="Search by title, assignee..."
                    value={search}
                    onChangeText={handleSearch}
                    style={{ flex: 1, fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b' }}
                    placeholderTextColor="#c0ccd8"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Icon name="close-circle" size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                )}
            </View>

            {/* COUNT */}
            <Text style={{
                fontSize: 12, fontFamily: Fonts.Regular, color: '#94a3b8',
                marginLeft: 16, marginBottom: 4,
            }}>
                {filtered.length} task{filtered.length !== 1 ? 's' : ''} found
            </Text>

            {/* LIST */}
            {/* LIST */}
            {loading ? (
                <Tasklistshimmer />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{
                        paddingBottom: 100,
                        paddingTop: 4,
                        paddingHorizontal: 12,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 220 }}>
                            <Icon
                                name="clipboard-off-outline"
                                size={48}
                                color="#cbd5e1"
                            />

                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: Fonts.Regular,
                                    color: '#94a3b8',
                                    marginTop: 12,
                                }}
                            >
                                No Tasks Found
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                onPress={() => navigation.navigate('Addtask')}
                style={{
                    position: 'absolute', bottom: 25, right: 20,
                    backgroundColor: Colors.buttonbgcolor,
                    width: 60, height: 60, borderRadius: 30,
                    justifyContent: 'center', alignItems: 'center',
                    elevation: 10, zIndex: 999,
                    shadowColor: '#000', shadowOpacity: 0.3,
                    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
                }}
            >
                <Icon name="plus" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ListTask;

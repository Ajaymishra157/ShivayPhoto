import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView, StatusBar,
    ScrollView, Modal, TextInput, FlatList, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDateForAPI = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
};

const formatDateDisplay = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};



const MixReport = ({ navigation }) => {
    const today = new Date();

    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('Select Staff');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [staffModal, setStaffModal] = useState(false);
    const [staffSearch, setStaffSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('');
    const userTypeRef = useRef('');

    const onDateChange = async (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            if (userTypeRef.current?.trim() === 'Sales-Person') {
                const userId = await AsyncStorage.getItem('id');
                fetchReport(date, userId);
            } else {
                fetchReport(date, selectedUser || '');
            }
        }
    };

    const copyReport = (title, rows, totalCount, selectedDate) => {
        const date = formatDateDisplay(selectedDate);

        let text = `Date - ${date} *(${title})*\n\n`;

        rows.forEach((row, index) => {
            text += `${index + 1}\t*${row.label || 'Unknown'}*\t${row.total_enquiries}\n`;
        });

        text += `*Total:*\t\t*${totalCount}*`;

        // Copy to clipboard
        Clipboard.setString(text);



        // Toast.show({
        //     type: 'success',
        //     text1: 'Copied to clipboard ✅',
        //     position: 'bottom',
        //     bottomOffset: 60,
        //     visibilityTime: 2000
        // });
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(API.list_user);
            const result = await response.json();
            if (result.code == 200) {
                setUsers(result.payload);
                setFilteredUsers(result.payload);
            } else {
                setUsers([]);
                setFilteredUsers([]);
            }
        } catch (e) {
            setUsers([]);
            setFilteredUsers([]);
        }
    };

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');
            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId })
            });
            const result = await res.json();
            if (result.code == 200 && result.payload.length > 0) {
                const type = result.payload[0].user_type;
                userTypeRef.current = type;
                setUserType(type);
                // Sales-Person ki apni id se fetch karo
                if (type?.trim() === 'Sales-Person') {
                    fetchReport(today, userId);
                } else {
                    fetchReport(today, '');
                }
            } else {
                fetchReport(today, '');
            }
        } catch (e) {
            setUserType('');
            fetchReport(today, '');
        }
    };


    const fetchReport = async (date, userId) => {
        setLoading(true);
        try {
            const res = await fetch(API.mix_report, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: formatDateForAPI(date),
                    user_id: userId || ''
                })
            });
            const json = await res.json();
            if (json.code == 200) {
                setReportData(json.payload);
            } else {
                setReportData(null);
            }
        } catch (e) {
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
            fetchUserType();
            fetchReport(today, '');
        }, [])
    );

    const changeDate = async (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
        if (userTypeRef.current?.trim() === 'Sales-Person') {
            const userId = await AsyncStorage.getItem('id');
            fetchReport(newDate, userId);
        } else {
            fetchReport(newDate, selectedUser || '');
        }
    };

    const handleStaffSelect = (user) => {
        setSelectedUser(user.id);
        setSelectedUserName(user.user_name || user.name || 'Staff');
        setStaffModal(false);
        fetchReport(selectedDate, user.id);
    };

    const handleStaffSearch = (text) => {
        setStaffSearch(text);
        const q = text.toLowerCase();
        setFilteredUsers(
            users.filter(u => (u.user_name || u.name || '').toLowerCase().includes(q))
        );
    };

    const renderTable = (title, columns, rows, totalCount, emptyText) => (
        <View style={{

            backgroundColor: '#fff',
            borderRadius: 10,
            borderWidth: 0.8,
            borderColor: '#d0d3d8',
            overflow: 'hidden',
            minWidth: 220,
            marginBottom: 10
        }}>
            {/* Table Title */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: '#e2e8f0',
                gap: 6,
            }}>
                <Text style={{
                    fontSize: 13,
                    fontFamily: Fonts.Bold,
                    color: '#1e293b',
                }}>
                    {title}
                </Text>
                {/* 👇 COPY ICON */}
                <TouchableOpacity onPress={() => copyReport(title, rows, totalCount, selectedDate)}>
                    <Icon name="content-copy" size={16} color="#94a3b8" />
                </TouchableOpacity>

            </View>

            {/* Column Headers */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc' }}>
                <View style={{ width: 36, paddingVertical: 8, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11, fontFamily: Fonts.Bold, color: '#64748b', textAlign: 'center' }}>#</Text>
                </View>
                <View style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11, fontFamily: Fonts.Bold, color: '#64748b', textAlign: 'center' }}>{columns[0]}</Text>
                </View>
                <View style={{ width: 60, paddingVertical: 8, paddingHorizontal: 6 }}>
                    <Text style={{ fontSize: 11, fontFamily: Fonts.Bold, color: '#64748b', textAlign: 'center' }}>LEADS</Text>
                </View>
            </View>

            {/* 👇 ONLY YEH CHANGE HAI */}
            {rows.length === 0 ? (
                <View style={{
                    paddingVertical: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontFamily: Fonts.Regular,
                        color: '#94a3b8',
                    }}>
                        {emptyText}
                    </Text>
                </View>
            ) : (
                rows.map((row, index) => (
                    <View key={index} style={{
                        flexDirection: 'row',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                        borderTopWidth: 0.5,
                        borderTopColor: '#e2e8f0',
                    }}>
                        <View style={{ width: 36, paddingVertical: 9, paddingHorizontal: 6, borderRightWidth: 0.5, borderRightColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontFamily: Fonts.Regular, color: '#64748b', textAlign: 'center' }}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 8, borderRightWidth: 0.5, borderRightColor: '#e2e8f0', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 12, fontFamily: Fonts.Regular, color: '#475569' }}>
                                {row.label || 'Unknown'}
                            </Text>
                        </View>
                        <View style={{ width: 60, paddingVertical: 9, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: Colors.buttonbgcolor, textAlign: 'center' }}>
                                {row.total_enquiries}
                            </Text>
                        </View>
                    </View>
                ))
            )}

            {/* ✅ TOTAL ROW SAME AS IT IS */}
            <View style={{
                flexDirection: 'row',
                borderTopWidth: 1.5,
                borderTopColor: Colors.buttonbgcolor,
                backgroundColor: '#f1f5f9',
            }}>
                <View style={{
                    width: 36 + 1,
                    paddingVertical: 9,
                    paddingHorizontal: 6,
                    borderRightWidth: 0,
                }} />
                <View style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 8 }}>
                    <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: '#1e293b' }}>Total:</Text>
                </View>
                <View style={{ width: 60, paddingVertical: 9, paddingHorizontal: 6, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: '#1e293b' }}>
                        {totalCount}
                    </Text>
                </View>
            </View>
        </View>
    );

    const cityRows = reportData?.city?.map(r => ({ label: r.city_name || 'Unknown', total_enquiries: r.total_enquiries })) || [];
    const sourceRows = reportData?.source?.map(r => ({ label: r.source || 'Unknown', total_enquiries: r.total_enquiries })) || [];
    const purposeRows = reportData?.purpose?.map(r => ({ label: r.purpose || 'Unknown', total_enquiries: r.total_enquiries })) || [];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View style={{
                height: 52,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.buttonbgcolor,
                paddingHorizontal: 12,
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 17,
                    fontFamily: Fonts.Bold,
                    color: '#fff'
                }}>
                    Mix Report
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={{
                flexDirection: 'row',
                paddingTop: 16,
                paddingHorizontal: 12,
                gap: 10,
            }}>

                {/* DATE BLOCK (BIG) */}
                <View style={{
                    flex: 1.5,   // 👈 ज्यादा space
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                }}>
                    {/* Prev */}
                    <TouchableOpacity onPress={() => changeDate(-1)}>
                        <Icon name="chevron-left" size={22} color={Colors.buttonbgcolor} />
                    </TouchableOpacity>

                    {/* Date */}
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={{
                            flex: 1,   // 👈 full stretch
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            borderWidth: 0.5,
                            borderColor: '#e2e8f0',
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text style={{
                            fontSize: 14,   // 👈 thoda bada
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                        }}>
                            {formatDateDisplay(selectedDate)}
                        </Text>

                        <Icon name="calendar-month-outline" size={18} color="#64748b" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}

                    {/* Next */}
                    <TouchableOpacity onPress={() => changeDate(1)}>
                        <Icon name="chevron-right" size={22} color={Colors.buttonbgcolor} />
                    </TouchableOpacity>
                </View>

                {/* STAFF (SMALL) */}
                {userTypeRef.current?.trim() !== 'Sales-Person' && (
                    <TouchableOpacity
                        onPress={() => {
                            setStaffSearch('');
                            setFilteredUsers(users);
                            setStaffModal(true);
                        }}
                        style={{
                            flex: 0.9,   // 👈 छोटा किया
                            height: 44,
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            borderWidth: 0.5,
                            borderColor: '#e2e8f0',
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            justifyContent: 'space-between',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 12,   // 👈 थोड़ा छोटा
                                fontFamily: Fonts.Regular,
                                color: selectedUser ? '#1e293b' : '#94a3b8',
                                flex: 1,
                            }}
                            numberOfLines={1}
                        >
                            {selectedUserName}
                        </Text>

                        <Icon name="chevron-down" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                )}

            </View>

            {/* TABLES */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : (
                <ScrollView
                    style={{ marginTop: 16, }}
                    contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20, }}
                    showsVerticalScrollIndicator={false}
                >

                    {renderTable('City Report', ['CITY NAME'], cityRows, reportData?.city_total || 0, 'No Lead')}
                    {renderTable('Source Report', ['SOURCE NAME'], sourceRows, reportData?.source_total || 0, 'No Source')}
                    {renderTable('Purpose Report', ['PURPOSE NAME'], purposeRows, reportData?.purpose_total || 0, 'No Purpose')}

                </ScrollView>
            )
            }

            {/* STAFF MODAL */}
            <Modal transparent visible={staffModal} animationType="fade">
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => setStaffModal(false)}
                >
                    <View
                        style={{ backgroundColor: '#fff', borderRadius: 14, width: '85%', maxHeight: 460 }}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={{
                            fontSize: 15,
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                            textAlign: 'center',
                            paddingVertical: 12,
                            borderBottomWidth: 0.5,
                            borderBottomColor: '#e2e8f0',
                        }}>
                            Select Staff
                        </Text>

                        {/* Search */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            margin: 10,
                            paddingHorizontal: 12,
                            height: 40,
                            backgroundColor: '#f1f5f9',
                            borderRadius: 8,
                            gap: 8,
                        }}>
                            <Icon name="magnify" size={18} color="#94a3b8" />
                            <TextInput
                                value={staffSearch}
                                onChangeText={handleStaffSearch}
                                placeholder="Search staff..."
                                placeholderTextColor="#94a3b8"
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontFamily: Fonts.Regular,
                                    color: '#1e293b',
                                }}
                            />
                        </View>

                        <FlatList
                            data={filteredUsers}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleStaffSelect(item)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 13,
                                        paddingHorizontal: 20,
                                        borderBottomWidth: 0.5,
                                        borderBottomColor: '#f1f5f9',
                                        backgroundColor: selectedUser === item.id ? '#f0fdf4' : '#fff',
                                    }}
                                >
                                    <Text style={{
                                        flex: 1,
                                        fontSize: 14,
                                        fontFamily: selectedUser === item.id ? Fonts.Bold : Fonts.Regular,
                                        color: selectedUser === item.id ? Colors.buttonbgcolor : '#1e293b',
                                    }}>
                                        {item.user_name || item.name}
                                    </Text>
                                    {selectedUser === item.id && (
                                        <Icon name="check" size={18} color={Colors.buttonbgcolor} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <Text style={{ fontSize: 13, color: '#94a3b8', fontFamily: Fonts.Regular }}>
                                        No staff found
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView >
    );
};

export default MixReport;
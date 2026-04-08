import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView, StatusBar,
    ScrollView, Modal, TextInput, FlatList, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';

const MONTHS = [
    { id: '1', name: 'January' },
    { id: '2', name: 'February' },
    { id: '3', name: 'March' },
    { id: '4', name: 'April' },
    { id: '5', name: 'May' },
    { id: '6', name: 'June' },
    { id: '7', name: 'July' },
    { id: '8', name: 'August' },
    { id: '9', name: 'September' },
    { id: '10', name: 'October' },
    { id: '11', name: 'November' },
    { id: '12', name: 'December' },
];

const COLUMNS = ['#', 'DATE', 'TOTAL', 'PENDING', 'UNRESPONSIVE', 'FOLLOW-UP', 'QUOTATION SENT', 'CONVERTED', 'END'];
const COL_WIDTHS = [40, 110, 70, 80, 120, 100, 150, 110, 60];

const formatDate = (dateStr) => {
    if (!dateStr) return '--';

    const d = new Date(dateStr);

    const day = String(d.getDate()).padStart(2, '0');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const month = months[d.getMonth()]; // 👈 dynamic month

    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
};

const MonthReport = ({ navigation }) => {
    const currentMonth = String(new Date().getMonth() + 1);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('Select Staff');

    const [monthModal, setMonthModal] = useState(false);
    const [staffModal, setStaffModal] = useState(false);
    const [staffSearch, setStaffSearch] = useState('');

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState(null);
    const userTypeRef = useRef('');

    const YEARS = [
        { label: '2025', value: '2025' },
        { label: '2026', value: '2026' },
    ];
    const [selectedYear, setSelectedYear] = useState('2026');

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

                // Sales-Person ki apni id se report fetch karo
                if (type?.trim() === 'Sales-Person') {
                    fetchReport(currentMonth, userId);
                } else {
                    fetchReport(currentMonth, '');
                }
            }
        } catch (e) {
            setUserType('');
            fetchReport(currentMonth, '');
        }
    };



    const fetchReport = async (month, userId, yearParam) => {
        const yearToUse = yearParam || selectedYear;
        console.log('Fetching report for month:', month, 'userId:', userId, 'year', yearToUse);
        setLoading(true);
        try {
            const res = await fetch(API.month_report, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: month,
                    year: yearToUse,
                    user_id: userId || ''
                })
            });
            const json = await res.json();
            if (json.code == 200) {
                setReportData(json.payload || []);
                setTotals(json.total || null);
            } else {
                setReportData([]);
                setTotals(null);
            }
        } catch (e) {
            setReportData([]);
            setTotals(null);
        } finally {
            setLoading(false);
        }
    };



    useFocusEffect(
        useCallback(() => {
            fetchUserType();
            fetchUsers();
            // fetchReport(currentMonth, '');
        }, [])
    );


    // const handleMonthSelect = (m) => {
    //     setSelectedMonth(m.id);
    //     setMonthModal(false);
    //     fetchReport(m.id, selectedUser || '');
    // };

    const handleMonthSelect = async (m) => {
        setSelectedMonth(m.id);
        setMonthModal(false);
        // if (userTypeRef.current?.trim() === 'Sales-Person') {
        //     const userId = await AsyncStorage.getItem('id');
        //     fetchReport(m.id, userId);
        // } else {
        //     fetchReport(m.id, selectedUser || '');
        // }
    };

    const handleStaffSelect = (user) => {
        setSelectedUser(user.id);
        setSelectedUserName(user.user_name || user.name || 'Staff');
        setStaffModal(false);
        // fetchReport(selectedMonth, user.id);
    };

    const handleStaffSearch = (text) => {
        setStaffSearch(text);
        const q = text.toLowerCase();
        setFilteredUsers(
            users.filter(u => (u.user_name || u.name || '').toLowerCase().includes(q))
        );
    };

    const getMonthName = (id) => MONTHS.find(m => m.id === id)?.name || 'Month';
    const type = userType?.trim();

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
                    Month Report
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* DROPDOWNS */}
            <View style={{
                flexDirection: 'row',
                padding: 12,
                gap: 8,
            }}>

                {/* YEAR DROPDOWN */}
                <Dropdown
                    data={YEARS}
                    labelField="label"
                    valueField="value"
                    value={selectedYear}
                    placeholder="Year"
                    onChange={item => {
                        setSelectedYear(item.value);
                        // fetchReport(selectedMonth, selectedUser || '', item.value);
                    }}

                    dropdownPosition="auto"

                    renderItem={item => {
                        const isSelected = item.value === selectedYear;

                        return (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                backgroundColor: isSelected ? '#f0fdf4' : '#fff',
                            }}>
                                <Text style={{
                                    fontSize: 14,
                                    fontFamily: isSelected ? Fonts.Bold : Fonts.Regular,
                                    color: isSelected ? Colors.buttonbgcolor : '#1e293b',
                                }}>
                                    {item.label}
                                </Text>

                                {isSelected && (
                                    <Icon name="check" size={16} color={Colors.buttonbgcolor} />
                                )}
                            </View>
                        );
                    }}

                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        height: 40,
                        width: 90
                    }}

                    placeholderStyle={{
                        color: '#999',
                        fontSize: 13,
                        fontFamily: Fonts.Regular
                    }}

                    selectedTextStyle={{
                        color: '#000',   // 👈 closed dropdown text BLACK
                        fontSize: 13,
                        fontFamily: Fonts.Bold
                    }}

                    containerStyle={{
                        borderRadius: 10,
                        borderWidth: 0.5,
                        borderColor: '#e2e8f0',
                        backgroundColor: '#fff',   // 👈 VERY IMPORTANT (white dropdown bg)
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        marginTop: 6,
                        shadowOffset: { width: 0, height: 4 },
                    }}

                    itemTextStyle={{
                        color: '#000'   // 👈 fallback fix (white text issue solve)
                    }}

                    activeColor="#f0fdf4"

                    renderRightIcon={() => (
                        <Icon name="chevron-down" size={16} color="black" />
                    )}
                />

                {/* MONTH */}
                <TouchableOpacity
                    onPress={() => setMonthModal(true)}
                    style={{
                        flex: 1,
                        height: 40,
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
                    <Text style={{ fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b' }}>
                        {getMonthName(selectedMonth)}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                </TouchableOpacity>

                {/* Staff Dropdown */}
                {userType !== null && type !== 'Sales-Person' && (
                    <TouchableOpacity
                        onPress={() => { setStaffSearch(''); setFilteredUsers(users); setStaffModal(true); }}
                        style={{
                            flex: 1,
                            height: 40,
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
                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: selectedUser ? '#1e293b' : '#94a3b8',
                            flex: 1,
                        }} numberOfLines={1}>
                            {selectedUserName}
                        </Text>
                        <Icon name="chevron-down" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={async () => {
                        if (userTypeRef.current?.trim() === 'Sales-Person') {
                            const userId = await AsyncStorage.getItem('id');
                            fetchReport(selectedMonth, userId, selectedYear);
                        } else {
                            fetchReport(selectedMonth, selectedUser || '', selectedYear);
                        }
                    }}
                    style={{
                        height: 40,
                        width: 40,
                        backgroundColor: Colors.buttonbgcolor,
                        borderRadius: 10,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Icon name="magnify" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* TABLE */}
            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                        <Text style={{ marginTop: 10, fontSize: 13, color: '#64748b', fontFamily: Fonts.Regular }}>
                            Loading report...
                        </Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} keyboardShouldPersistTaps="handled">
                        <View>
                            {/* Table Header */}
                            <View style={{ flexDirection: 'row', backgroundColor: Colors.buttonbgcolor }}>
                                {COLUMNS.map((col, i) => (
                                    <View key={i} style={{
                                        width: COL_WIDTHS[i],
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRightWidth: i < COLUMNS.length - 1 ? 0.5 : 0,
                                        borderRightColor: 'rgba(255,255,255,0.3)',
                                    }}>
                                        <Text style={{
                                            fontSize: 11,
                                            fontFamily: Fonts.Bold,
                                            color: '#fff',
                                            textAlign: 'center',
                                        }}>
                                            {col}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Table Rows */}
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" >
                                {reportData.length === 0 ? (
                                    <View style={{ width: COL_WIDTHS.reduce((a, b) => a + b, 0), alignItems: 'center', paddingVertical: 40 }}>
                                        <Icon name="file-document-outline" size={40} color="#cbd5e1" />
                                        <Text style={{ fontSize: 13, color: '#94a3b8', fontFamily: Fonts.Regular, marginTop: 8 }}>
                                            No Data Found
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        {reportData.map((row, index) => (
                                            <View key={index} style={{
                                                flexDirection: 'row',
                                                backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                                                borderBottomWidth: 0.5,
                                                borderBottomColor: '#e2e8f0',
                                            }}>
                                                {[
                                                    index + 1,
                                                    formatDate(row.enquiry_date),
                                                    row.total_enquiries,
                                                    row.pending,
                                                    row.unresponsive,
                                                    row.followup,
                                                    row.quotation_sent,
                                                    row.converted,
                                                    row.end,
                                                ].map((val, i) => (
                                                    <View key={i} style={{
                                                        width: COL_WIDTHS[i],
                                                        paddingVertical: 10,
                                                        paddingHorizontal: 8,
                                                        borderRightWidth: i < COLUMNS.length - 1 ? 0.5 : 0,
                                                        borderRightColor: '#e2e8f0',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 12,
                                                            fontFamily: i === 2 ? Fonts.Bold : Fonts.Regular,
                                                            color: i === 2 ? Colors.buttonbgcolor : '#475569',
                                                            textAlign: 'center',
                                                        }}>
                                                            {val}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        ))}

                                        {/* Total Row */}
                                        {totals && (
                                            <View style={{
                                                flexDirection: 'row',
                                                backgroundColor: '#f1f5f9',
                                                borderTopWidth: 1.5,
                                                borderBottomWidth: 1.5,
                                                borderColor: '#e6e6e8'
                                            }}>

                                                {/* # + DATE merged cell */}
                                                <View style={{
                                                    width: COL_WIDTHS[0] + COL_WIDTHS[1],  // 40 + 110 = 150
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 8,
                                                    borderRightWidth: 0.5,
                                                    borderRightColor: '#e2e8f0',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}>
                                                    <Text style={{
                                                        fontSize: 12,
                                                        fontFamily: Fonts.Bold,
                                                        color: '#1e293b',
                                                        textAlign: 'center',
                                                    }}>
                                                        Total:
                                                    </Text>
                                                </View>

                                                {/* Baaki columns index 2 se */}
                                                {[
                                                    totals.total_enquiries,
                                                    totals.pending,
                                                    totals.unresponsive,
                                                    totals.followup,
                                                    totals.quotation_sent,
                                                    totals.converted,
                                                    totals.end,
                                                ].map((val, i) => (
                                                    <View key={i} style={{
                                                        width: COL_WIDTHS[i + 2],
                                                        paddingVertical: 10,
                                                        paddingHorizontal: 8,
                                                        borderRightWidth: i < 6 ? 0.5 : 0,
                                                        borderRightColor: '#e2e8f0',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}>
                                                        <Text style={{
                                                            fontSize: 12,
                                                            fontFamily: Fonts.Bold,
                                                            color: '#1e293b',
                                                            textAlign: 'center',
                                                        }}>
                                                            {val}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* MONTH MODAL */}
            <Modal transparent visible={monthModal} animationType="fade">
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => setMonthModal(false)}
                >
                    <View
                        style={{ backgroundColor: '#fff', borderRadius: 14, width: '80%', maxHeight: 420, paddingVertical: 8 }}
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
                            Select Month
                        </Text>
                        <FlatList
                            data={MONTHS}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleMonthSelect(item)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 13,
                                        paddingHorizontal: 20,
                                        borderBottomWidth: 0.5,
                                        borderBottomColor: '#f1f5f9',
                                        backgroundColor: selectedMonth === item.id ? '#f0fdf4' : '#fff',
                                    }}
                                >
                                    <Text style={{
                                        flex: 1,
                                        fontSize: 14,
                                        fontFamily: selectedMonth === item.id ? Fonts.Bold : Fonts.Regular,
                                        color: selectedMonth === item.id ? Colors.buttonbgcolor : '#1e293b',
                                    }}>
                                        {item.name}
                                    </Text>
                                    {selectedMonth === item.id && (
                                        <Icon name="check" size={18} color={Colors.buttonbgcolor} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

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

        </SafeAreaView>
    );
};

export default MonthReport;
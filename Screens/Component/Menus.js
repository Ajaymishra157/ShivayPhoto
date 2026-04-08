import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, StatusBar, SafeAreaView, Animated } from 'react-native';
import React, { useState, useRef, useCallback } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors } from './Commoncomponent/Constants';

const Menus = () => {
    const navigation = useNavigation();
    const [logoutModal, setLogoutModal] = useState(false);
    const [leadsOpen, setLeadsOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);
    const [BookingOpen, setBookingOpen] = useState(false);
    const [userType, setUserType] = useState('');

    const menuItems = [
        {
            name: 'User',
            icon: 'account-circle-outline',
            color: '#7C3AED',
            screen: 'UsersList'
        },
        {
            name: 'Source',
            icon: 'source-branch',
            color: '#0284C7',
            screen: 'SourceList'
        },
        {
            name: 'Purpose',
            icon: 'target',
            color: '#16A34A',
            screen: 'PurposeList'
        },
        {
            name: 'Lead Transfer',
            icon: 'swap-horizontal',
            color: '#F59E0B',
            screen: 'LeadTransferList'
        },

    ];

    const logoutItem = { name: 'Logout', icon: 'power', color: '#EF4444', action: 'logout' };

    const handlePress = (item) => {
        if (item.action === 'logout') {
            setLogoutModal(true);
        } else {
            navigation.navigate(item.screen);
        }
    };

    const confirmLogout = async () => {
        await AsyncStorage.removeItem('id');
        setLogoutModal(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: userId
                })
            });

            const result = await res.json();

            if (result.code == 200 && result.payload.length > 0) {
                setUserType(result.payload[0].user_type);
            } else {
                setUserType('');
            }

        } catch (e) {
            setUserType('');
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUserType();
        }, [])
    );

    const renderSubItem = (label, screen) => (
        <TouchableOpacity
            key={label}
            onPress={() => navigation.navigate(screen)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingLeft: 56,
                paddingRight: 16,
                borderBottomWidth: 1,
                borderColor: '#E5E7EB',
                backgroundColor: '#F8FAFC',
            }}
        >
            <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#94A3B8',
                marginRight: 10,
            }} />
            <Text style={{
                flex: 1,
                fontSize: 14,
                color: '#475569',
                fontFamily: 'Inter-Regular',
            }}>
                {label}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );
    const type = userType?.trim();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* Header */}
            <View style={{
                height: 50,
                backgroundColor: Colors.buttonbgcolor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 4
            }}>
                <Text style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 18,
                    fontFamily: 'Inter-Regular',
                    fontWeight: 'bold',
                    color: '#fff'
                }}>
                    Menus
                </Text>
                <TouchableOpacity
                    style={{ position: 'absolute', right: 10 }}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <MaterialCommunityIcons name="close" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

                {/* Normal Menu Items */}
                {menuItems
                    .filter(item => {
                        if (type === 'Sales-Person') {
                            return !['User', 'Source', 'Purpose'].includes(item.name);
                        }
                        if (type === 'Booking-Person') {
                            return false;
                        }
                        return true;
                    })
                    .map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() => handlePress(item)}
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
                            </View>
                            <Text style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#000',
                                fontFamily: 'Inter-Regular'
                            }}>
                                {item.name}
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                        </TouchableOpacity>
                    ))}

                {/* ── LEADS ACCORDION ── */}
                {type !== 'Booking-Person' && (
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderColor: '#E5E7EB',
                            // backgroundColor: leadsOpen ? '#F1F5F9' : '#fff',
                            backgroundColor: '#F1F5F9'
                        }}
                        onPress={() => setLeadsOpen(!leadsOpen)}
                    >
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="account-multiple-plus-outline" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#000',
                            fontFamily: 'Inter-Regular'
                        }}>
                            Leads
                        </Text>
                        <MaterialCommunityIcons
                            name={leadsOpen ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color="#999"
                        />
                    </TouchableOpacity>
                )}

                {leadsOpen && (
                    <>
                        {renderSubItem('Manage Leads', 'ManageLeads')}
                        {renderSubItem('Add Leads', 'AddLeads')}
                        {renderSubItem('Pending / Pre Enquiry', 'PendingLeadList')}
                    </>
                )}

                {/* ── REPORTS ACCORDION ── */}
                {type !== 'Booking-Person' && (
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderColor: '#E5E7EB',
                            // backgroundColor: reportsOpen ? '#fff' : '#F1F5F9',
                            backgroundColor: '#F1F5F9'
                        }}
                        onPress={() => setReportsOpen(!reportsOpen)}
                    >
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="calendar-check-outline" size={24} color="#DC2626" />
                        </View>
                        <Text style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#000',
                            fontFamily: 'Inter-Regular'
                        }}>
                            Reports
                        </Text>
                        <MaterialCommunityIcons
                            name={reportsOpen ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color="#999"
                        />
                    </TouchableOpacity>
                )}

                {reportsOpen && (
                    <>
                        {renderSubItem('Month Report', 'MonthReport')}
                        {renderSubItem('Mix Report', 'MixReport')}
                    </>
                )}

                {/* ── MANAGE BOOKING ── */}
                {(type === 'Admin' || type === 'Sales-Person' || type === 'Booking-Person') && (
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderColor: '#E5E7EB',
                            // backgroundColor: reportsOpen ? '#fff' : '#F1F5F9',
                            backgroundColor: '#F1F5F9'
                        }}
                        onPress={() => setBookingOpen(!BookingOpen)}
                    >
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <MaterialCommunityIcons name="chart-box-outline" size={24} color="#DC2626" />
                        </View>
                        <Text style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#000',
                            fontFamily: 'Inter-Regular'
                        }}>
                            Manage Booking
                        </Text>
                        <MaterialCommunityIcons
                            name={BookingOpen ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color="#999"
                        />
                    </TouchableOpacity>
                )}

                {BookingOpen && (
                    <>
                        {renderSubItem('Booking', 'Bookinglist')}
                        {renderSubItem('Calendar', 'Calendarlist')}
                    </>
                )}

                {/* ── CHANGE PASSWORD (LAST) ── */}
                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                        borderColor: '#E5E7EB'
                    }}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <View style={{ width: 40, alignItems: 'center' }}>
                        <MaterialCommunityIcons name="lock-reset" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={{
                        flex: 1,
                        fontSize: 16,
                        color: '#000',
                        fontFamily: 'Inter-Regular'
                    }}>
                        Change Password
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />
                <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />

                {/* Logout */}
                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                    }}
                    onPress={() => handlePress(logoutItem)}
                >
                    <View style={{ width: 40, alignItems: 'center' }}>
                        <MaterialCommunityIcons name={logoutItem.icon} size={24} color={logoutItem.color} />
                    </View>
                    <Text style={{
                        flex: 1,
                        fontSize: 16,
                        color: '#000',
                        fontFamily: 'Inter-Regular'
                    }}>
                        {logoutItem.name}
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Logout Confirmation Modal */}
            <Modal
                transparent
                visible={logoutModal}
                animationType="fade"
                onRequestClose={() => setLogoutModal(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    activeOpacity={1}
                    onPress={() => setLogoutModal(false)}
                >
                    <View
                        style={{
                            width: '85%',
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 20,
                            elevation: 4
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={{
                            fontFamily: 'Inter-Bold',
                            fontSize: 16,
                            color: '#0F172A',
                            textAlign: 'center',
                            marginBottom: 8
                        }}>
                            Confirm Logout
                        </Text>
                        <Text style={{
                            fontFamily: 'Inter-Regular',
                            fontSize: 14,
                            color: '#475569',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to logout?
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setLogoutModal(false)}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#F1F5F9',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{
                                    fontFamily: 'Inter-Medium',
                                    fontSize: 13,
                                    color: '#334155'
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmLogout}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#EF4444',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{
                                    fontFamily: 'Inter-Medium',
                                    fontSize: 13,
                                    color: '#fff'
                                }}>
                                    Logout
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
};

export default Menus;
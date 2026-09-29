import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, StatusBar, SafeAreaView, Animated, ActivityIndicator, Image } from 'react-native';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors } from './Commoncomponent/Constants';

const Menus = () => {
    const navigation = useNavigation();
    const [logoutModal, setLogoutModal] = useState(false);
    // const [leadsOpen, setLeadsOpen] = useState(false);
    // const [reportsOpen, setReportsOpen] = useState(false);
    // const [BookingOpen, setBookingOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [userType, setUserType] = useState('');
    const [userName, setUserName] = useState('');
    const [userTypeLoaded, setUserTypeLoaded] = useState(false);

    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Good Morning');
        else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
        else if (hour >= 17 && hour < 21) setGreeting('Good Evening');
        else setGreeting('Good Night');
    }, []);

    // 👇 display-friendly label for user_type
    const getDisplayUserType = type => {
        if (type === 'Coordinator → Editor') return 'Coordinator Post Production';
        return type;
    };

    const menuItems = [
        {
            name: 'User',
            icon: 'account-circle-outline',
            color: '#7C3AED',
            screen: 'UsersList'
        },

        // 👇 ye naya add karo
        {
            name: 'Packages',
            icon: 'package-variant-closed',
            color: '#EA580C',
            screen: 'Listpackages'
        },

        {
            name: 'Branch',
            icon: 'store-marker-outline',
            color: '#0EA5E9',
            screen: 'ListBranch'
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
        await AsyncStorage.removeItem('user_name');
        setLogoutModal(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');
            const storedName = await AsyncStorage.getItem('user_name');   // 👈 ye line add karo
            setUserName(storedName || '');                                // 👈 ye line add karo

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
        finally {
            setUserTypeLoaded(true);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setUserTypeLoaded(false);
            fetchUserType();
        }, [])
    );
    const renderSubItem = (label, screen, icon, color) => (
        <TouchableOpacity
            key={label}
            onPress={() => navigation.navigate(screen)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingLeft: icon ? 40 : 56,   // icon ho to thoda kam indent
                paddingRight: 16,
                borderBottomWidth: 1,
                borderColor: '#E5E7EB',
                backgroundColor: '#F8FAFC',
            }}
        >
            {icon ? (
                <View style={{ width: 32, alignItems: 'center', marginRight: 8 }}>
                    <MaterialCommunityIcons name={icon} size={22} color={color || '#94A3B8'} />
                </View>
            ) : (
                <View
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#94A3B8',
                        marginRight: 10,
                    }}
                />
            )}
            <Text
                style={{
                    flex: 1,
                    fontSize: 14,
                    color: '#475569',
                    fontFamily: 'Inter-Regular',
                }}
            >
                {label}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );
    const type = userType?.trim();

    const visibleMenuItems = menuItems.filter(item => {
        if (type === 'Sales-Person') {
            return !['User', 'Packages', 'Branch', 'Source', 'Purpose'].includes(item.name);
        }
        if (
            type === 'Booking-Person' ||
            type === 'Coordinator' ||
            type === 'Photographer' ||
            type === 'Coordinator → Editor' ||
            type === 'Photo Editor' ||
            type === 'Video Editor'
        ) {
            return false;
        }
        return true;
    });

    // 👇 NEW — single normal row (dobara use hoga)
    const renderMenuRow = (item, index) => (
        <TouchableOpacity
            key={index}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderColor: '#E5E7EB',
            }}
            onPress={() => handlePress(item)}
        >
            <View style={{ width: 40, alignItems: 'center' }}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                {item.name}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
    );

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
            {!userTypeLoaded ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    {/* GREETING HEADER — only for Coordinator / Photographer / Coordinator → Editor */}

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Profile')}   // 👈 profile open
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            backgroundColor: '#fff',
                            borderBottomWidth: 1,
                            borderColor: '#E5E7EB',
                        }}
                    >
                        <View
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                backgroundColor: Colors.buttonbgcolor + '22',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                                overflow: 'hidden',
                            }}
                        >
                            <Image
                                source={require('../assets/shivayoriginal.png')}
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 26,
                                }}
                                resizeMode="cover"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'Inter-Bold',
                                    color: '#0F172A',
                                }}
                            >
                                {greeting} 👋
                            </Text>

                            <Text
                                style={{
                                    marginTop: 2,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'Inter-Regular',
                                        color: Colors.buttonbgcolor,
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {userName || '-'}
                                </Text>

                                {type ? (
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontFamily: 'Inter-Regular',
                                            color: '#64748B',
                                        }}
                                    >
                                        {' '}({getDisplayUserType(type)})
                                    </Text>
                                ) : null}
                            </Text>

                            <Text
                                style={{
                                    fontSize: 12,
                                    fontFamily: 'Inter-Regular',
                                    color: '#64748B',
                                    marginTop: 2,
                                }}
                            >
                                Welcome to Shivay Dashboard
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
                    </TouchableOpacity>




                    {/* ── PROFILE (hidden for coordinator/photographer/editor types — arrow in header handles it) ── */}
                    {/* {!(type === 'Coordinator' ||
                        type === 'Photographer' ||
                        type === 'Coordinator → Editor' ||
                        type === 'Photo Editor' ||
                        type === 'Video Editor') && (
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() => navigation.navigate('Profile')}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="account-circle-outline" size={24} color="#0EA5E9" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                                    Profile
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>
                        )} */}
                    {/* Normal Menu Items */}
                    {/* ── MASTER ── */}
                    {visibleMenuItems.length > 1 ? (
                        <>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB',
                                    backgroundColor: '#F1F5F9',
                                }}
                                onPress={() => setOpenMenu(openMenu === 'master' ? null : 'master')}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="database-cog-outline" size={24} color="#7C3AED" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                                    Master
                                </Text>
                                <MaterialCommunityIcons
                                    name={openMenu === 'master' ? 'chevron-up' : 'chevron-down'}
                                    size={24}
                                    color="#999"
                                />
                            </TouchableOpacity>

                            {openMenu === 'master' &&
                                visibleMenuItems.map(item =>
                                    renderSubItem(item.name, item.screen, item.icon, item.color)
                                )}
                        </>
                    ) : (
                        // sirf 1 item bacha (Sales-Person → Lead Transfer) to dropdown nahi, seedha item
                        visibleMenuItems.map((item, index) => renderMenuRow(item, index))
                    )}



                    {/* ── LEADS ACCORDION ── */}
                    {type !== 'Booking-Person' &&
                        type !== 'Coordinator' &&
                        type !== 'Photographer' &&
                        type !== 'Coordinator → Editor' &&
                        type !== 'Photo Editor' &&
                        type !== 'Video Editor' && (
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
                                onPress={() => setOpenMenu(openMenu === 'leads' ? null : 'leads')} // ✅ CHANGE
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
                                    name={openMenu === 'leads' ? 'chevron-up' : 'chevron-down'} // 
                                    size={24}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        )}

                    {openMenu === 'leads' && (
                        <>
                            {renderSubItem('Manage Leads', 'ManageLeads', 'account-search-outline', '#8B5CF6')}
                            {renderSubItem('Add Leads', 'AddLeads', 'account-plus-outline', '#16A34A')}
                            {renderSubItem('Pending / Pre Enquiry', 'PendingLeadList', 'clock-alert-outline', '#F59E0B')}
                        </>
                    )}

                    {/* ── REPORTS ACCORDION ── */}
                    {type !== 'Booking-Person' &&
                        type !== 'Coordinator' &&
                        type !== 'Photographer' &&
                        type !== 'Coordinator → Editor' &&
                        type !== 'Photo Editor' &&
                        type !== 'Video Editor' && (
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
                                onPress={() => setOpenMenu(openMenu === 'reports' ? null : 'reports')}
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
                                    name={openMenu === 'reports' ? 'chevron-up' : 'chevron-down'}
                                    size={24}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        )}

                    {openMenu === 'reports' && (
                        <>
                            {renderSubItem('Month Report', 'MonthReport', 'calendar-month-outline', '#DC2626')}
                            {renderSubItem('Mix Report', 'MixReport', 'chart-pie', '#0EA5E9')}
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
                            onPress={() => setOpenMenu(openMenu === 'booking' ? null : 'booking')}
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
                                name={openMenu === 'booking' ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color="#999"
                            />
                        </TouchableOpacity>
                    )}

                    {openMenu === 'booking' && (
                        <>
                            {renderSubItem('Booking', 'Bookinglist', 'book-open-page-variant-outline', '#2563EB')}
                            {renderSubItem('Calendar', 'Calendarlist', 'calendar-month-outline', '#7C3AED')}
                        </>
                    )}

                    {/* ── PHOTOGRAPHY MANAGEMENT DIVIDER ── */}
                    {(type === 'Admin' ||
                        type === 'Coordinator' ||
                        type === 'Coordinator → Editor' ||
                        type === 'Photo Editor' ||
                        type === 'Video Editor') && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    backgroundColor: '#EEF2F7',
                                }}
                            >
                                <View
                                    style={{
                                        flex: 1,
                                        height: 1,
                                        backgroundColor: '#CBD5E1',
                                    }}
                                />

                                <Text
                                    style={{
                                        marginHorizontal: 10,
                                        fontSize: 11,
                                        fontFamily: 'Inter-Bold',
                                        color: '#64748B',
                                        letterSpacing: 0.8,
                                    }}
                                >
                                    PHOTOGRAPHY MANAGEMENT
                                </Text>

                                <View
                                    style={{
                                        flex: 1,
                                        height: 1,
                                        backgroundColor: '#CBD5E1',
                                    }}
                                />
                            </View>
                        )}

                    {/* ── COORDINATOR DASHBOARD ── */}
                    {/* ── COORDINATOR / ADMIN DASHBOARD ── */}
                    {(type === 'Admin' || type === 'Coordinator') && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() =>
                                navigation.navigate('CoordinatorDashboard', {
                                    hideBack: type === 'Coordinator',   // 👈 Coordinator = true, Admin = false
                                })
                            }
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name="clipboard-flow-outline"
                                    size={24}
                                    color="#0EA5E9"
                                />
                            </View>

                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 16,
                                    color: '#000',
                                    fontFamily: 'Inter-Regular'
                                }}
                            >
                                {type === 'Coordinator'
                                    ? 'Dashboard'
                                    : 'Coordinator Dashboard'}
                            </Text>

                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={24}
                                color="#999"
                            />
                        </TouchableOpacity>
                    )}
                    {/* ── TODAY'S PENDING PHOTOGRAPHER ── */}
                    {/* {type === 'Coordinator' && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() => navigation.navigate('Todayspendingphotographer')}
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="camera-off-outline" size={24} color="#EF4444" />
                            </View>
                            <Text style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#000',
                                fontFamily: 'Inter-Regular'
                            }}>
                                Today's Pending Photographer
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                        </TouchableOpacity>
                    )} */}
                    {/* ── PHOTOGRAPHER ASSIGNMENT ── */}
                    {(type === 'Admin' || type === 'Coordinator') && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() => navigation.navigate('Photographerassignment')}
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="camera-account" size={24} color="#0284C7" />
                            </View>
                            <Text style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#000',
                                fontFamily: 'Inter-Regular'
                            }}>
                                Photographer Assignment
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                        </TouchableOpacity>
                    )}

                    {/* ── CALENDAR ── */}
                    {type === 'Coordinator' && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() => navigation.navigate('Calendarlist')}
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons
                                    name="calendar-month-outline"
                                    size={24}
                                    color="#7C3AED"
                                />
                            </View>

                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 16,
                                    color: '#000',
                                    fontFamily: 'Inter-Regular'
                                }}
                            >
                                Calendar
                            </Text>

                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={24}
                                color="#999"
                            />
                        </TouchableOpacity>
                    )}

                    {/* ── POST PRODUCTION ── */}
                    {(type === 'Admin') && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() => navigation.navigate('Coordinatoreditorassign')}
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="movie-edit-outline" size={24} color="#2563EB" />
                            </View>
                            <Text style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#000',
                                fontFamily: 'Inter-Regular'
                            }}>
                                Post Production
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                        </TouchableOpacity>
                    )}



                    {/* ── PHOTOGRAPHER MENU ── */}
                    {type === 'Photographer' && (
                        <>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() =>
                                    navigation.navigate('PhotographerDashboard', { hideBack: true })
                                }
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="view-dashboard-outline" size={24} color="#0EA5E9" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                                    Dashboard
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() => navigation.navigate('Myassignments')}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="camera-account" size={24} color="#0284C7" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                                    My Assignments
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() => navigation.navigate('Calendarlist')}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons
                                        name="calendar-month-outline"
                                        size={24}
                                        color="#7C3AED"
                                    />
                                </View>

                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 16,
                                        color: '#000',
                                        fontFamily: 'Inter-Regular'
                                    }}
                                >
                                    Calendar
                                </Text>

                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={24}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── EDITOR MENU ── */}
                    {type === 'Coordinator → Editor' && (
                        <>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() =>
                                    navigation.navigate('Editordashboard', { hideBack: true })   // 👈 drawer wanted
                                }
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="view-dashboard-outline" size={24} color="#0EA5E9" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                                    Dashboard
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() => navigation.navigate('BookingTask')}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="movie-edit-outline" size={24} color="#2563EB" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                                    Booking Task
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>
                        </>
                    )}
                    {/* ── PHOTO / VIDEO EDITOR MENU ── */}
                    {/* ── PHOTO / VIDEO EDITOR MENU ── */}
                    {(type === 'Photo Editor' || type === 'Video Editor') && (
                        <>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() =>
                                    navigation.navigate('photovideodashboard', { hideBack: true })
                                }
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="view-dashboard-outline" size={24} color="#0EA5E9" />
                                </View>
                                <Text style={{ flex: 1, fontSize: 16, color: '#000', fontFamily: 'Inter-Regular' }}>
                                    Dashboard
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderColor: '#E5E7EB'
                                }}
                                onPress={() => navigation.navigate('MyEditingTask')}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons
                                        name="movie-edit-outline"
                                        size={24}
                                        color="#2563EB"
                                    />
                                </View>

                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 16,
                                        color: '#000',
                                        fontFamily: 'Inter-Regular'
                                    }}
                                >
                                    My Editing Tasks
                                </Text>

                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={24}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </>
                    )}



                    {/* ── TASKS ── */}
                    {/* {type !== 'Booking-Person' &&
                    type !== 'Coordinator' &&
                    type !== 'Photographer' &&
                    type !== 'Coordinator → Editor' &&
                    type !== 'Photo Editor' &&
                    type !== 'Video Editor' && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() => navigation.navigate('ListTask')}
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#7C3AED" />
                            </View>
                            <Text style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#000',
                                fontFamily: 'Inter-Regular'
                            }}>
                                Tasks
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                        </TouchableOpacity>
                    )} */}

                    {/* ── PENALTY ── */}
                    {/* {type !== 'Booking-Person' &&
                    type !== 'Coordinator' &&
                    type !== 'Photographer' &&
                    type !== 'Coordinator → Editor' &&
                    type !== 'Photo Editor' &&
                    type !== 'Video Editor' && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderBottomWidth: 1,
                                borderColor: '#E5E7EB'
                            }}
                            onPress={() => navigation.navigate('ListPenalty')}
                        >
                            <View style={{ width: 40, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="alert-decagram-outline" size={24} color="#DC2626" />
                            </View>
                            <Text style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#000',
                                fontFamily: 'Inter-Regular'
                            }}>
                                Penalty
                            </Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
                        </TouchableOpacity>
                    )} */}



                    {/* ── CHANGE PASSWORD (LAST) ── */}
                    {/* {type !== 'Booking-Person' &&
                        type !== 'Coordinator' &&
                        type !== 'Photographer' &&
                        type !== 'Coordinator → Editor' &&
                        type !== 'Photo Editor' &&
                        type !== 'Video Editor' && (
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
                        )} */}

                    <View style={{ flex: 1 }} />
                    <View style={{ height: 1, backgroundColor: '#E2E8F0' }} />

                    {/* Logout */}
                    {/* <TouchableOpacity
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
                    </TouchableOpacity> */}

                </ScrollView>
            )
            }
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

        </SafeAreaView >
    );
};

export default Menus;
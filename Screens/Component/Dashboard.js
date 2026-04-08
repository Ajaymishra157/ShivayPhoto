import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, TouchableOpacity, Image, BackHandler, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API, Colors, Fonts } from './Commoncomponent/Constants';
import RNExitApp from 'react-native-exit-app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';



const menuItems = [
    // {
    //     name: 'User',
    //     icon: 'account-circle-outline',
    //     color: '#7C3AED',
    //     screen: 'UsersList'
    // },
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
        icon: 'swap-horizontal', // or 'arrow-right-left'
        color: '#F59E0B',        // yellow/orange
        screen: 'LeadTransferList'    // target screen
    },
    {
        name: 'Leads',
        icon: 'account-multiple-plus-outline',
        color: '#8B5CF6',
        screen: 'LeadsDashboard'
    },
    {
        name: 'Reports',
        icon: 'chart-box-outline',
        color: '#DC2626', // red tone
        screen: 'ReportsDashboard'
    },

    {
        name: 'Manage Booking',
        icon: 'calendar-check-outline', // 📅 best for booking
        color: '#DC2626',
        screen: 'managebookingdashboard' // 👈 apna screen name dalna
    },

];

const statsItems = [
    { label: 'Today Follow Up', value: 51 },
    { label: 'Hot', value: 2 },
    { label: 'Warm', value: 1 },
    { label: 'Cold', value: 48 },
    { label: 'Total Leads', value: 4824 },
    { label: 'Pending Pre/Enquiry', value: 1 },
    { label: 'Unresponsive', value: 0 },
    { label: 'Follow-up', value: 554 },
    { label: 'Quotation Sent', value: 1 },
    { label: 'Converted to Client', value: 261 },
    { label: 'End', value: 4008 },
];




const Dashboard = ({ navigation }) => {
    const [confirmModal, setConfirmModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);
    const [exitModal, setExitModal] = useState(false);
    const [userType, setUserType] = useState('');

    const ITEM_WIDTH = '32%';
    // Dashboard component ke andar, return se pehle yeh add karo:
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting('Good Morning');
        } else if (hour >= 12 && hour < 17) {
            setGreeting('Good Afternoon');
        } else if (hour >= 17 && hour < 21) {
            setGreeting('Good Evening');
        } else {
            setGreeting('Good Night');
        }
    }, []);



    // Open/close logout modal
    const openLogoutModal = () => setLogoutModal(true);
    const closeLogoutModal = () => setLogoutModal(false);

    // Open/close exit modal
    const openExitModal = () => setExitModal(true);
    const closeExitModal = () => setExitModal(false);

    // Logout logic
    const handleLogout = async () => {
        await AsyncStorage.removeItem('id');
        setLogoutModal(false);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    // Confirm exit
    const confirmExit = () => RNExitApp.exitApp();

    // Handle Android back press
    useFocusEffect(
        useCallback(() => {
            const backAction = () => {
                openExitModal(); // Your function to open exit confirmation
                return true;     // prevent default back
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                backAction
            );

            // Cleanup when screen loses focus
            return () => backHandler.remove();
        }, [])
    );

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

    const getFilteredMenu = () => {
        if (userType === 'Sales-Person') {
            return menuItems.filter(item =>
                ['Lead Transfer', 'Leads', 'Reports', 'Manage Booking'].includes(item.name)
            );
        }

        if (userType === 'Booking-Person') {
            return menuItems.filter(item =>
                item.name === 'Manage Booking'
            );
        }

        // Admin ya koi aur → sab dikhega
        return menuItems;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            <View
                style={{
                    height: 50,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.buttonbgcolor,
                    paddingHorizontal: 12,
                }}
            >
                {/* Left Menu */}
                <TouchableOpacity
                    style={{
                        width: 40,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                    }}
                    onPress={() => navigation.navigate('Menus')}
                >
                    <Icon name="menu" size={26} color="#fff" />
                </TouchableOpacity>

                {/* Center Title */}
                <Text
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 18,
                        fontFamily: 'Inter-Bold',
                        color: Colors.btntext,
                    }}
                >
                    Dashboard
                </Text>

                {/* Right Spacer */}
                <View style={{ width: 40 }} />
            </View>



            <View
                style={{
                    backgroundColor: Colors.buttonbgcolor,
                    paddingHorizontal: 20,
                    paddingVertical: 20,
                    borderBottomLeftRadius: 30,
                    borderBottomRightRadius: 30,
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 14,
                }}
            >
                {/* Circle Image */}
                <View
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        borderWidth: 2.5,
                        borderColor: '#ffffff60',
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                    }}
                >
                    <Image
                        source={require('../assets/shivayoriginal.png')}
                        style={{
                            width: '100%',
                            height: '100%',
                            resizeMode: 'cover',
                        }}
                    />
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            color: '#ffffffb0',
                            fontFamily: Fonts.Regular,
                            marginBottom: 2,
                        }}
                    >
                        {greeting} 👋
                    </Text>
                    <Text
                        style={{
                            fontSize: 18,
                            color: '#FFFFFF',
                            fontFamily: 'Inter-Bold',
                        }}
                    >
                        {userType || 'User'}

                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: '#ffffff80',
                            fontFamily: Fonts.Regular,
                            marginTop: 2,
                        }}
                    >
                        Welcome to Shivay Dashboard
                    </Text>
                </View>

                {/* Bell Icon */}
                <TouchableOpacity
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: '#ffffff20',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Icon name="bell-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>


            <View
                style={{
                    marginTop: 0,
                    backgroundColor: '#f5f3f3',
                    flex: 1,
                    borderRadius: 18,
                    paddingVertical: 20,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                }}
            >
                <ScrollView contentContainerStyle={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    paddingHorizontal: 12,
                }}>
                    {getFilteredMenu().map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.85}
                            onPress={() => {
                                if (item.screen) {
                                    navigation.navigate(item.screen);
                                } else if (item.action === 'logout') {
                                    openLogoutModal();
                                }
                            }}
                            style={{
                                width: '30%',
                                backgroundColor: '#FFFFFF',
                                borderRadius: 14,
                                paddingVertical: 18,
                                alignItems: 'center',
                                marginBottom: 18,
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOpacity: 0.06,
                                shadowRadius: 6,
                            }}
                        >
                            {item.image ? (
                                <Image
                                    source={item.image}
                                    tintColor={item.color}
                                    style={{ width: 32, height: 32, resizeMode: 'contain' }}
                                />
                            ) : (
                                <Icon name={item.icon} size={32} color={item.color} />
                            )}

                            <Text
                                style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    textAlign: 'center',
                                    color: Colors.listtext,
                                    fontFamily: Fonts.Regular, // ⬅️ tumhara font SAME
                                }}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {/* Stats Section */}
                    <View style={{ paddingHorizontal: 14, marginTop: 14 }}>

                        {/* Heading */}
                        <Text style={{
                            fontSize: 17,
                            fontFamily: 'Inter-Bold',
                            color: '#0F172A',
                            marginBottom: 14,
                            marginLeft: 2
                        }}>
                            Leads Summary
                        </Text>

                        <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 6.64 // 👈 IMPORTANT
                        }}>
                            {statsItems.map((item, index) => (
                                <View
                                    key={index}
                                    style={{
                                        width: ITEM_WIDTH, // 👈 3 perfect items
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 14,
                                        paddingVertical: 16,
                                        paddingHorizontal: 8,
                                        marginBottom: 14,
                                        alignItems: 'center',

                                        shadowColor: '#000',
                                        shadowOpacity: 0.06,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 3 },
                                        elevation: 3,
                                    }}
                                >
                                    {/* Label */}
                                    <Text style={{
                                        fontSize: 11,
                                        textAlign: 'center',
                                        color: '#64748B',
                                        fontFamily: 'Inter-Regular',
                                    }}>
                                        {item.label}
                                    </Text>

                                    {/* Value */}
                                    <Text style={{
                                        fontSize: 18,
                                        marginTop: 6,
                                        fontFamily: 'Inter-Bold',
                                        color: '#0F172A',
                                    }}>
                                        {item.value}
                                    </Text>



                                </View>
                            ))}
                        </View>

                    </View>
                </ScrollView>



            </View>




            {/* Logout Modal */}
            <Modal
                transparent
                visible={logoutModal}
                animationType="fade"
                onRequestClose={closeLogoutModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={closeLogoutModal}
                >
                    <View
                        style={{
                            width: '85%',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            padding: 20,
                            elevation: 4,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        {/* Title */}
                        <Text
                            style={{
                                fontFamily: 'Inter-Bold',
                                fontSize: 16,
                                color: '#0F172A',
                                textAlign: 'center',
                                marginBottom: 8,
                            }}
                        >
                            Confirm Logout
                        </Text>

                        {/* Message */}
                        <Text
                            style={{
                                fontFamily: 'Inter-Regular',
                                fontSize: 14,
                                color: '#475569',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            Are you sure you want to logout?
                        </Text>

                        {/* Buttons */}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                        >
                            {/* Cancel */}
                            <TouchableOpacity
                                onPress={closeLogoutModal}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#F1F5F9',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 13,
                                        color: '#334155',
                                    }}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            {/* Logout */}
                            <TouchableOpacity
                                onPress={handleLogout}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#EF4444',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 13,
                                        color: '#FFFFFF',
                                    }}
                                >
                                    Logout
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableOpacity>
            </Modal>


            {/* Exit Modal */}
            <Modal
                transparent
                visible={exitModal}
                animationType="fade"
                onRequestClose={closeExitModal}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={closeExitModal}
                >
                    <View
                        style={{
                            width: '85%',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            padding: 20,
                            elevation: 4,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        {/* Title */}
                        <Text
                            style={{
                                fontFamily: 'Inter-Bold',
                                fontSize: 16,
                                color: '#0F172A',
                                textAlign: 'center',
                                marginBottom: 8,
                            }}
                        >
                            Confirm Exit
                        </Text>

                        {/* Message */}
                        <Text
                            style={{
                                fontFamily: 'Inter-Regular',
                                fontSize: 14,
                                color: '#475569',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            Are you sure you want to exit the app?
                        </Text>

                        {/* Buttons */}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                        >
                            {/* Cancel */}
                            <TouchableOpacity
                                onPress={closeExitModal}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#F1F5F9',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 13,
                                        color: '#334155',
                                    }}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            {/* Exit */}
                            <TouchableOpacity
                                onPress={confirmExit}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#EF4444',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 13,
                                        color: '#FFFFFF',
                                    }}
                                >
                                    Exit
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>



        </SafeAreaView>
    );
};

export default Dashboard;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.appcolor,

    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.Bold,
        color: Colors.text,
    },
    Title: {
        fontSize: 14,
        fontFamily: Fonts.Regular,
        color: Colors.text,
    },
    subHeader: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    brand: {
        color: Colors.text,
        fontSize: 16,
        fontFamily: Fonts.Bold,
    },
    updateText: {
        color: '#000',
        marginTop: 4,
    },
    scrollWrapper: {
        flex: 1,
        marginTop: -80,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 20,
        paddingHorizontal: 5,
        paddingTop: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    menuItem: {
        width: '24%',  // adjusted to allow spacing for 4 in a row
        margin: 1.5,
        alignItems: 'center',
        marginBottom: 20,
    },

    menuLabel: {
        fontSize: 12,
        textAlign: 'center',
        color: Colors.listtext,
        fontFamily: Fonts.Regular
    },

    stickyButtonContainer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        right: 20,
    },

    stickyButton: {
        flexDirection: 'row',
        backgroundColor: Colors.buttonbgcolor,
        paddingVertical: 14,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },

    stickyButtonText: {
        color: 'black',
        fontSize: 15,
        fontFamily: Fonts.Medium,
        marginLeft: 8,
    },

});

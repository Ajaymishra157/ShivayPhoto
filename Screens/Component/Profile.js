import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    StatusBar,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from 'react-native';
import React, { useState, useCallback } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors } from './Commoncomponent/Constants';

const formatDateTime = date => {
    if (!date) return '-';
    const d = new Date(String(date).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return date;
    const datePart = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    return `${datePart}, ${timePart}`;
};

const getInitials = name => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// 👇 display-friendly label for user_type
const getDisplayUserType = type => {
    if (type === 'Coordinator → Editor') return 'Coordinator Post Production';
    return type;
};

const InfoRow = ({ icon, label, value, color = '#0EA5E9', rightElement }) => (
    <View
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderColor: '#E5E7EB',
            backgroundColor: '#fff',
        }}
    >
        <View
            style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: color + '18',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
            }}
        >
            <MaterialCommunityIcons name={icon} size={19} color={color} />
        </View>

        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: '#94A3B8' }}>
                {label}
            </Text>
            <Text
                style={{
                    fontSize: 14,
                    fontFamily: 'Inter-Regular',
                    color: '#0F172A',
                    marginTop: 2,
                }}
            >
                {value || '-'}
            </Text>
        </View>

        {rightElement}
    </View>
);

const Profile = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);   // 👈 NEW


    const [logoutModal, setLogoutModal] = useState(false);

    const confirmLogout = async () => {
        await AsyncStorage.removeItem('id');
        await AsyncStorage.removeItem('user_name');

        setLogoutModal(false);

        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const fetchUserDetail = async () => {
        setLoading(true);
        try {
            const user_id = await AsyncStorage.getItem('id');

            const response = await fetch(API.detail_user, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user_id }),
            });
            const result = await response.json();

            if (result.code == 200) {
                setUserData(
                    Array.isArray(result.payload) ? result.payload[0] : result.payload
                );
            } else {
                setUserData(null);
            }
        } catch (e) {
            console.log('Profile fetch error:', e);
            setUserData(null);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            setShowPassword(false);   // 👈 screen re-open hone par password wapas hidden
            fetchUserDetail();
        }, [])
    );

    const isActive = String(userData?.user_status || '').toLowerCase() === 'active';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* Header */}
            <View
                style={{
                    height: 50,
                    backgroundColor: Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    elevation: 4,
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
                    style={{ width: 28 }}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 18,
                        fontFamily: 'Inter-Regular',
                        fontWeight: 'bold',
                        color: '#fff',
                        marginRight: 28,
                    }}
                >
                    Profile
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : !userData ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <MaterialCommunityIcons name="account-alert-outline" size={40} color="#94A3B8" />
                    <Text style={{ marginTop: 10, fontFamily: 'Inter-Regular', color: '#64748B' }}>
                        Unable to load profile details.
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                    {/* Avatar / Name card */}
                    <View
                        style={{
                            alignItems: 'center',
                            paddingVertical: 26,
                            backgroundColor: '#fff',
                            borderBottomWidth: 1,
                            borderColor: '#E5E7EB',
                        }}
                    >
                        <View
                            style={{
                                width: 78,
                                height: 78,
                                borderRadius: 39,
                                backgroundColor: Colors.buttonbgcolor,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ fontSize: 28, fontFamily: 'Inter-Bold', color: '#fff' }}>
                                {getInitials(userData.user_name)}
                            </Text>
                        </View>

                        <Text
                            style={{
                                fontSize: 17,
                                fontFamily: 'Inter-Bold',
                                color: '#0F172A',
                                textTransform: 'capitalize',
                            }}
                        >
                            {userData.user_name}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 8,
                                gap: 8,
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: Colors.buttonbgcolor + '18',
                                    borderRadius: 20,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: 'Inter-Regular',
                                        color: Colors.buttonbgcolor,
                                    }}
                                >
                                    {getDisplayUserType(userData.user_type)}
                                </Text>
                            </View>

                            {/* <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
                                    borderRadius: 20,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                }}
                            >
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: isActive ? '#16A34A' : '#DC2626',
                                        marginRight: 5,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: 'Inter-Regular',
                                        color: isActive ? '#16A34A' : '#DC2626',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {userData.user_status}
                                </Text>
                            </View> */}
                        </View>
                    </View>

                    {/* Details */}
                    <View style={{ marginTop: 14 }}>
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: 'Inter-Bold',
                                color: '#94A3B8',
                                letterSpacing: 0.6,
                                paddingHorizontal: 16,
                                marginBottom: 6,
                            }}
                        >
                            CONTACT DETAILS
                        </Text>

                        <InfoRow
                            icon="phone-outline"
                            label="Mobile Number"
                            value={userData.user_mobile}
                            color="#0EA5E9"
                        />

                        <InfoRow
                            icon="email-outline"
                            label="Email Address"
                            value={userData.user_email}
                            color="#8B5CF6"
                        />

                        {/* 👇 PASSWORD with eye toggle */}
                        <InfoRow
                            icon="lock-outline"
                            label="Password"
                            value={showPassword ? userData.user_password : '••••••••'}
                            color="#F97316"
                            rightElement={
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setShowPassword(prev => !prev)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <MaterialCommunityIcons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={21}
                                        color="#64748B"
                                    />
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    <View style={{ marginTop: 18 }}>
                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: 'Inter-Bold',
                                color: '#94A3B8',
                                letterSpacing: 0.6,
                                paddingHorizontal: 16,
                                marginBottom: 6,
                            }}
                        >
                            ACCOUNT INFO
                        </Text>

                        <InfoRow
                            icon="calendar-account-outline"
                            label="Joined On"
                            value={formatDateTime(userData.entry_date)}
                            color="#16A34A"
                        />
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            marginHorizontal: 12,
                            marginTop: 14,
                            gap: 8,
                        }}
                    >
                        {/* CHANGE PASSWORD */}
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => navigation.navigate('ChangePassword')}
                            style={{
                                flex: 1,
                                height: 46,
                                borderRadius: 10,
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                            }}
                        >
                            <MaterialCommunityIcons
                                name="lock-reset"
                                size={18}
                                color={Colors.buttonbgcolor}
                            />

                            <Text
                                style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    fontFamily: 'Inter-Bold',
                                    fontSize: 12,
                                    color: '#334155',
                                }}
                                numberOfLines={1}
                            >
                                Change Password
                            </Text>

                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={18}
                                color="#94A3B8"
                            />
                        </TouchableOpacity>

                        {/* LOGOUT */}
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => setLogoutModal(true)}
                            style={{
                                flex: 1,
                                height: 46,
                                borderRadius: 10,
                                backgroundColor: '#fff',
                                borderWidth: 1,
                                borderColor: '#FECACA',
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                            }}
                        >
                            <MaterialCommunityIcons
                                name="logout"
                                size={18}
                                color="#EF4444"
                            />

                            <Text
                                style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    fontFamily: 'Inter-Bold',
                                    fontSize: 12,
                                    color: '#EF4444',
                                }}
                                numberOfLines={1}
                            >
                                Logout
                            </Text>

                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={18}
                                color="#FCA5A5"
                            />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
            {/* LOGOUT CONFIRMATION MODAL */}
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
                        alignItems: 'center',
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
                            elevation: 4,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
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

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                        >
                            {/* CANCEL */}
                            <TouchableOpacity
                                onPress={() => setLogoutModal(false)}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#F1F5F9',
                                    paddingVertical: 10,
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

                            {/* LOGOUT */}
                            <TouchableOpacity
                                onPress={confirmLogout}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#EF4444',
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter-Medium',
                                        fontSize: 13,
                                        color: '#fff',
                                    }}
                                >
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

export default Profile;

const styles = StyleSheet.create({});
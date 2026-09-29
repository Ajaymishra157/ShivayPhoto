import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    ScrollView, Modal, SafeAreaView, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import UserDetailShimmer from '../Shimmer/Users/UserDetailShimmer';

const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    const dateObj = new Date(dateString);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const getDisplayUserType = (type) => {
    if (type === 'Coordinator → Editor') {
        return 'Coordinator Post Production';
    }

    return type;
};

const InfoRow = ({ icon, label, value }) => (
    <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
        gap: 12,
    }}>
        <View style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: Colors.buttonbgcolor + '12',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <Icon name={icon} size={16} color={Colors.buttonbgcolor} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={{
                fontSize: 11,
                fontFamily: Fonts.Regular,
                color: '#94a3b8',
                marginBottom: 2,
            }}>
                {label}
            </Text>
            <Text style={{
                fontSize: 13,
                fontFamily: 'Inter-Bold',
                color: '#1e293b',
                textTransform: 'capitalize',
            }}>
                {value || '--'}
            </Text>
        </View>
    </View>
);

const UsersDetail = ({ navigation, route }) => {
    const { user_id } = route.params;
    console.log("Received user_id:", user_id); // Debug log

    const [userData, setUserData] = useState(null);

    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
    const [statusLoading, setStatusLoading] = useState(false);

    const fetchUserDetail = async () => {
        setLoading(true);
        try {
            const response = await fetch(API.detail_user, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user_id }),
            });
            const result = await response.json();

            if (result.code == 200) {
                setUserData(result.payload[0] || result.payload);
            } else {
                setUserData(null);
            }
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchUserDetail();
        }, [])
    );

    const handleDelete = async () => {
        try {
            const response = await fetch(API.delete_user, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user_id }),
            });

            const result = await response.json();

            if (result.code == 200) {
                Toast.show({
                    type: 'success',
                    text1: 'Deleted Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                });

                setTimeout(() => navigation.goBack(), 500);
            } else {
                Toast.show({ type: 'error', text1: 'Delete Failed' });
            }
        } catch (e) {
            console.log(e);
        }
    };


    const handleStatusToggle = async () => {
        try {
            setStatusLoading(true);

            const newStatus = userData.user_status === "active" ? "deactive" : "active";
            console.log("Updating status to:", newStatus); // Debug log

            const response = await fetch(API.status_update, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user_id,
                    user_status: newStatus
                }),
            });

            const result = await response.json();
            console.log("Status update response:", result); // Debug log

            if (result.code == 200) {

                // UI update
                setUserData(prev => ({
                    ...prev,
                    user_status: newStatus
                }));

                Toast.show({
                    type: 'success',
                    text1: `User ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000,
                });

            } else {
                Toast.show({
                    type: 'error', text1: 'Status update failed', position: 'bottom',
                    bottomOffset: 60, visibilityTime: 2000,
                });
            }

        } catch (e) {
            Toast.show({ type: 'error', text1: 'Network Error' });
        } finally {
            setStatusLoading(false);
        }
    };
    return (
        <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>

            {/* HEADER */}
            <View style={{
                backgroundColor: Colors.buttonbgcolor,
                flexDirection: 'row',
                height: 50,
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={{
                    color: '#FFF',
                    fontFamily: 'Inter-Bold',
                    fontSize: 16
                }}>
                    User Detail
                </Text>

                <TouchableOpacity
                    onPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent;

                        setModalPosition({
                            top: pageY + 5,
                            right: 15, // right fixed rakhenge (safe)
                        });

                        setModalVisible(true);
                    }}
                >
                    <Icon name="dots-vertical" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            {loading ? (
                <UserDetailShimmer />
            ) : userData ? (
                <ScrollView contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps='handled'>

                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#ddd',
                    }}>



                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 16
                        }}>

                            {/* NAME LEFT */}
                            <Text style={{
                                fontSize: 16,
                                fontFamily: 'Inter-Bold',
                                color: Colors.buttonbgcolor,
                                flex: 1,
                                textTransform: 'capitalize',
                            }}>
                                {userData.user_name}
                            </Text>

                            {/* TOGGLE RIGHT */}
                            <TouchableOpacity
                                onPress={handleStatusToggle}
                                disabled={statusLoading}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor:
                                        userData.user_status === "active" ? '#d4edda' : '#f8d7da',
                                    paddingVertical: 6,
                                    paddingHorizontal: 10,
                                    borderRadius: 20,
                                    marginLeft: 10
                                }}
                            >
                                {statusLoading ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <>
                                        <Icon
                                            name={userData.user_status === "active"
                                                ? "toggle-switch"
                                                : "toggle-switch-off-outline"}
                                            size={20}
                                            color={userData.user_status === "active" ? '#155724' : '#721c24'}
                                        />
                                        <Text style={{
                                            marginLeft: 4,
                                            fontSize: 12,
                                            fontFamily: Fonts.Bold,
                                            color:
                                                userData.user_status === "active" ? '#155724' : '#721c24'
                                        }}>
                                            {userData.user_status === "active" ? "Active" : "deactive"}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                        </View>

                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12 }} />

                        <InfoRow icon="phone-outline" label="Mobile" value={userData.user_mobile} />
                        <InfoRow icon="email-outline" label="Email" value={userData.user_email} />
                        <InfoRow
                            icon="account-outline"
                            label="User Type"
                            value={getDisplayUserType(userData.user_type)}
                        />
                        <InfoRow icon="calendar-outline" label="Entry On" value={formatDateTime(userData.entry_date)} />

                    </View>

                </ScrollView>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>No data found</Text>
                </View>
            )}

            {/* 🔹 THREE DOT MENU */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1 }}
                    activeOpacity={1}
                >
                    <View style={{
                        position: 'absolute',
                        top: modalPosition.top,
                        right: modalPosition.right,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingVertical: 10,
                        width: 110, // 🔥 width badhaya
                        elevation: 8,
                    }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('AddUser', { userdata: userData });
                            }}
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                            }}
                        >
                            <Text style={{
                                fontFamily: Fonts.Bold,
                                color: Colors.buttonbgcolor,
                                fontSize: 14
                            }}>
                                Edit
                            </Text>
                        </TouchableOpacity>

                        <View style={{ height: 0.5, backgroundColor: '#eee' }} />

                        <TouchableOpacity
                            onPress={() => {
                                setModalVisible(false);
                                setDeleteModal(true);
                            }}
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 16
                            }}
                        >
                            <Text style={{
                                fontFamily: Fonts.Bold,
                                color: '#D9534F',
                                fontSize: 14
                            }}>
                                Delete
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 🔴 DELETE MODAL */}
            <Modal visible={deleteModal} transparent animationType="fade">
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onPress={() => setDeleteModal(false)}
                >
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 14,
                        padding: 22,
                        width: '85%', // 🔥 width increase
                        alignItems: 'center',
                    }}
                        onStartShouldSetResponder={() => true}>
                        <Text style={{
                            fontSize: 16,
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                            marginBottom: 8
                        }}>
                            Delete User
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to delete "{userData?.user_name}"?
                        </Text>

                        <View style={{ flexDirection: 'row', width: '100%' }}>
                            <TouchableOpacity
                                onPress={() => setDeleteModal(false)}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#f1f5f9',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginRight: 5,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{
                                    fontFamily: Fonts.Bold,
                                    color: '#475569'
                                }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setDeleteModal(false);
                                    handleDelete();
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#ef4444',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginLeft: 5,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{
                                    color: '#fff',
                                    fontFamily: Fonts.Bold
                                }}>
                                    Delete
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

        </View>
    );
};

export default UsersDetail;
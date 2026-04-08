import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    ScrollView, Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import BookingDetailShimmer from '../Shimmer/Booking/BookingDetailShimmer';

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

const formatBookingValue = (val) => {
    if (!val) return '';

    // Agar date format hai (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [year, month, day] = val.split('-');
        return `${day}-${month}-${year}`;
    }

    // Agar already month name hai (January, Feb etc.)
    return val;
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
            }}>
                {value || '--'}
            </Text>
        </View>
    </View>
);



const BookingDetail = ({ navigation, route }) => {

    const { client_id } = route.params;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const response = await fetch(API.detail_booking, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id }),
            });

            const result = await response.json();

            if (result.code == 200) {
                setData(result.payload[0]);
            } else {
                setData(null);
            }
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchDetail();
        }, [])
    );

    const handleDelete = async () => {
        try {
            const response = await fetch(API.delete_booking, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id }),
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
                    Booking Detail
                </Text>

                <TouchableOpacity
                    onPress={(e) => {
                        const { pageY } = e.nativeEvent;
                        setModalPosition({ top: pageY + 5, right: 15 });
                        setModalVisible(true);
                    }}
                >
                    <Icon name="dots-vertical" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            {loading ? (
                <BookingDetailShimmer />
            ) : data ? (
                <ScrollView contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">

                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#ddd',
                    }}>

                        {/* NAME */}
                        <Text style={{
                            fontSize: 16,
                            fontFamily: 'Inter-Bold',
                            color: Colors.buttonbgcolor,
                            marginBottom: 10
                        }}>
                            {data.client_name}
                        </Text>

                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12 }} />

                        <InfoRow icon="phone-outline" label="Mobile" value={data.client_mobile} />
                        <InfoRow icon="map-marker-outline" label="Address" value={data.client_address} />
                        <InfoRow icon="email-outline" label="Email" value={data.client_email} />
                        <InfoRow icon="city" label="City" value={data.client_city} />
                        <InfoRow icon="note-text-outline" label="Purpose" value={data.client_purpose} />
                        <InfoRow icon="comment-text-outline" label="Remark" value={data.client_remark} />
                        <InfoRow icon="account-outline" label="Added By" value={data.added_by_name} />
                        <InfoRow icon="calendar-outline" label="Booking Month" value={formatBookingValue(data.booking)} />
                        <InfoRow icon="check-circle-outline" label="Status" value={data.booking_status} />
                        <InfoRow icon="clock-outline" label="Entry On" value={formatDateTime(data.entry_date)} />

                    </View>

                </ScrollView>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>No data found</Text>
                </View>
            )}

            {/* MENU */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)}>
                    <View style={{
                        position: 'absolute',
                        top: modalPosition.top,
                        right: modalPosition.right,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        paddingVertical: 10,
                        width: 110,
                        elevation: 8,
                    }}>
                        <TouchableOpacity
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('AddBooking', { clientdata: data });
                            }}
                            style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                        >
                            <Text style={{
                                fontFamily: Fonts.Bold,
                                color: Colors.buttonbgcolor
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
                            style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                        >
                            <Text style={{
                                fontFamily: Fonts.Bold,
                                color: '#D9534F'
                            }}>
                                Delete
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* DELETE MODAL */}
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
                        width: '85%',
                        alignItems: 'center',
                    }}
                        onStartShouldSetResponder={() => true}>

                        <Text style={{
                            fontSize: 16,
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                            marginBottom: 8
                        }}>
                            Delete Booking
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to delete "{data?.client_name}"?
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
                                <Text style={{ fontFamily: Fonts.Bold, color: '#475569' }}>
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
                                <Text style={{ color: '#fff', fontFamily: Fonts.Bold }}>
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

export default BookingDetail;
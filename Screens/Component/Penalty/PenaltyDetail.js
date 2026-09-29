import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors, Fonts } from '../Commoncomponent/Constants';
import Penaltydetailshimmer from '../Shimmer/Penalty/Penaltydetailshimmer';

/* ── STATIC DATA (API baad me connect karna) ── */
const STATIC_PENALTY = {
    id: '1',
    staff: 'Shahrukh Khan',
    amount: '500',
    reason: 'Late arrival at shoot location',
    penalty_date: '2026-08-18',
    entry_date: '2026-08-18T11:20:00',
    status: 'Pending',
};

const STATUS_COLORS = {
    Paid: { bg: '#d4edda', text: '#155724' },
    Pending: { bg: '#fff3cd', text: '#856404' },
    Waived: { bg: '#e2e3e5', text: '#41464b' },
};

const formatDate = (dateString) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
};

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

const PenaltyDetail = ({ navigation, route }) => {
    const penalty_id = route?.params?.penalty_id;

    const [penaltyData, setPenaltyData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });

    const fetchPenaltyDetail = async () => {
        setLoading(true);
        // TODO: API ready hone par yaha fetch(API.detail_penalty, { id: penalty_id }) call karna
        setTimeout(() => {
            setPenaltyData(STATIC_PENALTY);
            setLoading(false);
        }, 500);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchPenaltyDetail();
        }, [])
    );

    const handleDelete = async () => {
        // TODO: API ready hone par yaha fetch(API.delete_penalty) call karna
        Toast.show({
            type: 'success',
            text1: 'Deleted Successfully',
            position: 'bottom',
            bottomOffset: 60,
        });
        setTimeout(() => navigation.goBack(), 500);
    };

    const statusStyle = STATUS_COLORS[penaltyData?.status] || { bg: '#e2e3e5', text: '#41464b' };

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
                    Penalty Detail
                </Text>

                <TouchableOpacity
                    onPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent;
                        setModalPosition({ top: pageY + 5, right: 15 });
                        setModalVisible(true);
                    }}
                >
                    <Icon name="dots-vertical" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            {loading ? (
                <Penaltydetailshimmer />
            ) : penaltyData ? (
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
                            marginTop: 4
                        }}>

                            {/* STAFF NAME LEFT */}
                            <Text style={{
                                fontSize: 16,
                                fontFamily: 'Inter-Bold',
                                color: Colors.buttonbgcolor,
                                flex: 1
                            }}>
                                {penaltyData.staff}
                            </Text>

                            {/* READ-ONLY STATUS BADGE (no toggle) */}
                            <View style={{
                                backgroundColor: statusStyle.bg,
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                                borderRadius: 20,
                                marginLeft: 10
                            }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontFamily: Fonts.Bold,
                                    color: statusStyle.text
                                }}>
                                    {penaltyData.status}
                                </Text>
                            </View>
                        </View>

                        {/* AMOUNT HIGHLIGHT */}
                        <Text style={{
                            fontSize: 26,
                            fontFamily: Fonts.Bold,
                            color: '#DC2626',
                            marginTop: 6,
                        }}>
                            ₹{penaltyData.amount}
                        </Text>

                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12 }} />
                        <InfoRow
                            icon="text-box-outline"
                            label="Reason"
                            value={penaltyData.reason}
                        />

                        <InfoRow
                            icon="calendar"
                            label="Penalty Date"
                            value={formatDate(penaltyData.penalty_date)}
                        />

                        <InfoRow
                            icon="calendar-check"
                            label="Entry On"
                            value={formatDateTime(penaltyData.entry_date)}
                        />

                        <InfoRow
                            icon="checkbox-marked-circle-outline"
                            label="Status"
                            value={penaltyData.status}
                        />
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
                        width: 110,
                        elevation: 8,
                    }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('AddPenalty', { penaltydata: penaltyData });
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
                            Delete Penalty
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to delete penalty for "{penaltyData?.staff}"?
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

export default PenaltyDetail;
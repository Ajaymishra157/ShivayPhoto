import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    ScrollView, Modal, TextInput,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import BookingDetailShimmer from '../Shimmer/Booking/BookingDetailShimmer';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
                textTransform: 'capitalize'
            }}>
                {value || '--'}
            </Text>
        </View>
    </View>
);
const HalfRow = ({ icon, label, value }) => (
    <View style={{ width: '50%', paddingRight: 8, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
                width: 28, height: 28, borderRadius: 8,
                backgroundColor: Colors.buttonbgcolor + '12',
                justifyContent: 'center', alignItems: 'center',
            }}>
                <Icon name={icon} size={13} color={Colors.buttonbgcolor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontFamily: Fonts.Regular, color: '#94a3b8' }}>
                    {label}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Inter-Bold', color: '#1e293b', textTransform: 'capitalize' }}>
                    {value || '--'}
                </Text>
            </View>
        </View>
    </View>
);

const SectionCard = ({ title, children }) => (
    <View style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
    }}>
        <Text style={{
            fontSize: 12,
            fontFamily: Fonts.Bold,
            color: Colors.buttonbgcolor,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        }}>
            {title}
        </Text>
        {children}
    </View>
);



const BookingDetail = ({ navigation, route }) => {

    const { client_id } = route.params;

    const [data, setData] = useState(null);
    console.log("data", data);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
    const [coordinators, setCoordinators] = useState([]);
    const [coordinatorId, setCoordinatorId] = useState('');
    const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');   // ⬅ NEW — temp selection
    const [coordinatorModal, setCoordinatorModal] = useState(false);
    const [coordinatorSearch, setCoordinatorSearch] = useState('');
    const [filteredCoordinators, setFilteredCoordinators] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [confirmAssignModal, setConfirmAssignModal] = useState(false);
    const [userType, setUserType] = useState('');
    console.log("usertype", userType);
    const [userTypeLoaded, setUserTypeLoaded] = useState(false);
    const [loggedInUserId, setLoggedInUserId] = useState('');




    const fetchLoggedInUser = async () => {
        try {
            const id = await AsyncStorage.getItem('id');
            setLoggedInUserId(String(id || ''));
        } catch (e) {
            console.log('Login user id error:', e);
            setLoggedInUserId('');
        }
    };

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userId,
                }),
            });

            const result = await res.json();

            if (result.code == 200 && result.payload?.length > 0) {
                setUserType(result.payload[0].user_type);
            } else {
                setUserType('');
            }
        } catch (e) {
            console.log('User Type Error:', e);
            setUserType('');
        } finally {
            setUserTypeLoaded(true);
        }
    };

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
                setCoordinatorId(result.payload[0].coordinator_id || '');
            } else {
                setData(null);
            }
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };


    const fetchCoordinators = async () => {
        try {
            const res = await fetch(API.list_user_typewise, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'coordinator' }),
            });
            const json = await res.json();
            if (json.code == 200) {
                setCoordinators((json.payload || []).map(u => ({
                    label: u.user_name,
                    value: u.id,
                })));
            }
        } catch (_) { }
    };

    useFocusEffect(
        useCallback(() => {
            setUserTypeLoaded(false);

            fetchLoggedInUser();
            fetchDetail();
            fetchCoordinators();
            fetchUserType();

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

    const handleAssignCoordinator = async (newCoordinatorId) => {
        setUpdating(true);
        try {
            const body = {
                client_id: String(client_id),
                client_name: data.client_name,
                client_address: data.client_address,
                client_city: data.client_city,
                client_mobile: data.client_mobile,
                client_email: data.client_email,
                client_purpose: data.client_purpose,
                client_remark: data.client_remark,
                booking_amount: data.booking_amount,
                receive_amount: data.receive_amount,
                coordinator_id: newCoordinatorId,
                added_by: data.added_by,
                booking_status: data.booking_status,
                booking_date: data.booking_status === 'Check' ? '' : data.booking,
                shoot_month: data.booking_status === 'Check' ? data.booking : '',
            };

            const res = await fetch(API.update_booking, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();

            if (result.code == 200) {
                setCoordinatorId(newCoordinatorId);
                setCoordinatorModal(false);
                Toast.show({ type: 'success', text1: 'Coordinator Assigned', position: 'bottom', bottomOffset: 60 });
                fetchDetail();
            } else {
                Toast.show({ type: 'error', text1: result.message || 'Update Failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally {
            setUpdating(false);
        }
    };
    useEffect(() => {
        if (!coordinatorSearch.trim()) {
            setFilteredCoordinators(coordinators);
        } else {
            const filtered = coordinators.filter(c =>
                c.label.toLowerCase().includes(coordinatorSearch.toLowerCase())
            );
            setFilteredCoordinators(filtered);
        }
    }, [coordinatorSearch, coordinators]);


    const type = userType?.trim();
    const isOwner =
        String(data?.added_by || '') === String(loggedInUserId || '');

    const canEditDelete =
        type === 'Admin' ||
        (type === 'Sales-Person' && isOwner);
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
                {canEditDelete && (
                    <TouchableOpacity
                        onPress={(e) => {
                            const { pageY } = e.nativeEvent;
                            setModalPosition({
                                top: pageY + 5,
                                right: 15
                            });
                            setModalVisible(true);
                        }}
                    >
                        <Icon name="dots-vertical" size={22} color="#fff" />
                    </TouchableOpacity>
                )}

                {!canEditDelete && <View style={{ width: 24 }} />}
            </View>

            {/* CONTENT */}
            {loading ? (
                <BookingDetailShimmer />
            ) : data ? (
                <ScrollView contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">

                    {/* NAME HEADER CARD */}
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#eee',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <View style={{
                            width: 46, height: 46, borderRadius: 23,
                            backgroundColor: Colors.buttonbgcolor + '15',
                            justifyContent: 'center', alignItems: 'center',
                        }}>
                            <Icon name="account-outline" size={22} color={Colors.buttonbgcolor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: '#1e293b', textTransform: 'capitalize' }}>
                                {data.client_name}
                            </Text>

                        </View>
                    </View>

                    {/* CONTACT INFO — 2-column grid */}
                    <SectionCard title="Contact Info">
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            <HalfRow icon="phone-outline" label="Mobile" value={data.client_mobile} />
                            <HalfRow icon="city" label="City" value={data.client_city} />
                            <HalfRow icon="email-outline" label="Email" value={data.client_email} />
                            <HalfRow icon="note-text-outline" label="Purpose" value={data.client_purpose} />
                        </View>
                        <InfoRow icon="map-marker-outline" label="Address" value={data.client_address} />
                        <InfoRow icon="comment-text-outline" label="Package" value={data.client_remark} />
                    </SectionCard>

                    {/* BOOKING INFO — 2-column grid */}
                    <SectionCard title="Booking Info">
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            <HalfRow icon="account-outline" label="Added By" value={data.added_by_name} />
                            <HalfRow
                                icon="calendar-outline"
                                label={
                                    /^\d{4}-\d{2}-\d{2}$/.test(data.booking || '')
                                        ? 'Booking Date'
                                        : 'Booking Month'
                                }
                                value={formatBookingValue(data.booking)}
                            />
                            <HalfRow icon="check-circle-outline" label="Status" value={data.booking_status} />
                            <HalfRow icon="clock-outline" label="Entry On" value={formatDateTime(data.entry_date)} />
                        </View>
                    </SectionCard>



                    {/* COORDINATOR — apni alag card, kyunki tappable hai */}
                    <SectionCard title="Coordinator">
                        <TouchableOpacity
                            onPress={() => {
                                setCoordinatorSearch('');
                                setSelectedCoordinatorId(coordinatorId);
                                // setCoordinatorModal(true);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <View style={{
                                width: 34, height: 34, borderRadius: 10,
                                backgroundColor: Colors.buttonbgcolor + '12',
                                justifyContent: 'center', alignItems: 'center',
                            }}>
                                <Icon name="account-tie-outline" size={16} color={Colors.buttonbgcolor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontFamily: 'Inter-Bold', color: '#1e293b', textTransform: 'capitalize' }}>
                                    {data.coordinator_name || 'Not Assigned'}
                                </Text>
                            </View>
                            {/* ASSIGN BUTTON */}
                            {/* <TouchableOpacity
                                activeOpacity={0.75}
                                onPress={() => {
                                    setCoordinatorSearch('');
                                    setSelectedCoordinatorId(coordinatorId);
                                    setCoordinatorModal(true);
                                }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: Colors.buttonbgcolor,
                                    borderRadius: 7,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                }}
                            >
                                <Icon
                                    name="account-plus-outline"
                                    size={13}
                                    color="#fff"
                                />

                                <Text
                                    style={{
                                        fontSize: 9.5,
                                        fontFamily: Fonts.Bold,
                                        color: '#fff',
                                        marginLeft: 4,
                                    }}
                                >
                                    Assign
                                </Text>
                            </TouchableOpacity> */}
                        </TouchableOpacity>
                    </SectionCard>

                    {/* FINANCIAL INFO — 2-column grid */}
                    <SectionCard title="Financial Info">
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            <HalfRow icon="currency-inr" label="Booking Amount" value={data.booking_amount ? `₹ ${data.booking_amount}` : '--'} />
                            <HalfRow icon="currency-inr" label="Receive Amount" value={data.receive_amount ? `₹ ${data.receive_amount}` : '--'} />
                            <HalfRow
                                icon="currency-inr"
                                label="Due Amount"
                                value={
                                    data.due_amount !== null &&
                                        data.due_amount !== undefined &&
                                        data.due_amount !== ''
                                        ? `₹ ${data.due_amount}`
                                        : '--'
                                }
                            />
                        </View>
                    </SectionCard>
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

            <Modal visible={coordinatorModal} transparent animationType="fade">
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setCoordinatorModal(false)}
                >
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, width: '80%', overflow: 'hidden' }} onStartShouldSetResponder={() => true}>
                        <Text style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b', textAlign: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' }}>
                            Select Coordinator
                        </Text>
                        <TouchableOpacity style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 10,
                            padding: 6,
                        }} onPress={() => setCoordinatorModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center', margin: 10, paddingHorizontal: 12, height: 40, backgroundColor: '#f1f5f9', borderRadius: 8, gap: 8 }}>
                            <Icon name="magnify" size={18} color="#94a3b8" />
                            <TextInput
                                value={coordinatorSearch}
                                onChangeText={setCoordinatorSearch}
                                placeholder="Search coordinator..."
                                placeholderTextColor="#94a3b8"
                                style={{ flex: 1, fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b' }}
                            />
                        </View>

                        <FlatList
                            data={filteredCoordinators}
                            keyExtractor={(item, index) => index.toString()}
                            style={{ maxHeight: 360 }}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const sel = selectedCoordinatorId === item.value;
                                return (
                                    <TouchableOpacity
                                        onPress={() => setSelectedCoordinatorId(item.value)}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center',
                                            paddingVertical: 13, paddingHorizontal: 20,
                                            borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
                                            backgroundColor: sel ? '#f0fdf4' : '#fff',
                                        }}
                                    >
                                        <Text style={{ flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' }}>
                                            {item.label}
                                        </Text>
                                        {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                setCoordinatorModal(false);      // ⬅ NEW — purana modal band
                                setConfirmAssignModal(true);
                            }}
                            disabled={!selectedCoordinatorId || updating}
                            style={{
                                backgroundColor: selectedCoordinatorId
                                    ? Colors.buttonbgcolor
                                    : '#cbd5e1',
                                margin: 12,
                                height: 44,
                                borderRadius: 10,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {updating ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#fff"
                                />
                            ) : (
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 14,
                                        fontFamily: Fonts.Bold
                                    }}
                                >
                                    Update
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>


            {/* ── CONFIRM ASSIGN COORDINATOR MODAL ── */}
            <Modal visible={confirmAssignModal} transparent animationType="fade">
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 14,
                        padding: 22,
                        width: '85%',
                        alignItems: 'center',
                    }}>

                        <View style={{
                            width: 60, height: 60, borderRadius: 30,
                            backgroundColor: Colors.buttonbgcolor + '12',
                            justifyContent: 'center', alignItems: 'center',
                            marginBottom: 14,
                        }}>
                            <Icon name="account-tie-outline" size={28} color={Colors.buttonbgcolor} />
                        </View>

                        <Text style={{
                            fontSize: 16,
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            Assign Coordinator
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20,
                        }}>
                            Are you sure you want to assign{' '}
                            <Text style={{ fontFamily: Fonts.Bold, color: '#1e293b' }}>
                                {coordinators.find(c => c.value === selectedCoordinatorId)?.label || 'this coordinator'}
                            </Text>
                            {' '}to this booking?
                        </Text>

                        <View style={{ flexDirection: 'row', width: '100%' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setConfirmAssignModal(false);
                                    setCoordinatorModal(true);   // ⬅ optional — wapas selection modal khol do
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#f1f5f9',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginRight: 5,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontFamily: Fonts.Bold, color: '#475569' }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setConfirmAssignModal(false);
                                    handleAssignCoordinator(selectedCoordinatorId);
                                }}
                                disabled={updating}
                                style={{
                                    flex: 1,
                                    backgroundColor: Colors.buttonbgcolor,
                                    padding: 12,
                                    borderRadius: 8,
                                    marginLeft: 5,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: '#fff', fontFamily: Fonts.Bold }}>
                                    Yes, Assign
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default BookingDetail;
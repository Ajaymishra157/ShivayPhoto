import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../Commoncomponent/Constants';
import Taskdetailshimmer from '../Shimmer/Task/Taskdetailshimmer';

const STATUS_COLORS = {
    Completed: { bg: '#dcfce7', text: '#15803D' },
    Pending: { bg: '#fef9c3', text: '#A16207' },
    'In Progress': { bg: '#dbeafe', text: '#1D4ED8' },
};

const PRIORITY_COLORS = {
    High: '#DC2626',
    Medium: '#EAB308',
    Low: '#16A34A',
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
const fmtDate = (dateString) => {
    if (!dateString) return '--';

    const dateObj = new Date(dateString);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}-${month}-${year}`;
};

const InfoRow = ({ icon, label, value, valueColor }) => (
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
                fontFamily: Fonts.Bold,
                color: valueColor || '#1e293b',
            }}>
                {value || '--'}
            </Text>
        </View>
    </View>
);

const Taskdetail = ({ navigation, route }) => {
    /* ── STATIC DATA (API baad me connect karna) ──
       List se { taskdata: item } navigate ho ke aa raha hai */
    const { taskdata } = route.params;

    const [taskData, setTaskData] = useState(taskdata);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });


    useEffect(() => {
        setLoading(true);

        // TODO: API ready hone par yaha task detail API call karna
        setTimeout(() => {
            setTaskData(taskdata);
            setLoading(false);
        }, 600);
    }, [taskdata]);

    const handleDelete = () => {
        // API baad me yaha lagayenge (API.delete_task)
        setDeleteModal(false);
        navigation.goBack();
    };

    const statusStyle = STATUS_COLORS[taskData?.status] || { bg: '#f1f5f9', text: '#64748b' };
    const priorityColor = PRIORITY_COLORS[taskData?.priority] || '#94a3b8';

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
                    fontFamily: Fonts.Bold,
                    fontSize: 16
                }}>
                    Task Detail
                </Text>

                <TouchableOpacity
                    onPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent;

                        setModalPosition({
                            top: pageY + 5,
                            right: 15,
                        });

                        setModalVisible(true);
                    }}
                >
                    <Icon name="dots-vertical" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* CONTENT */}
            {loading ? (
                <Taskdetailshimmer />
            ) : taskData ? (
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
                        }}>

                            {/* TITLE LEFT */}
                            <Text style={{
                                fontSize: 16,
                                fontFamily: Fonts.Bold,
                                color: Colors.buttonbgcolor,
                                flex: 1
                            }}>
                                {taskData.title}
                            </Text>

                            {/* STATUS BADGE RIGHT */}
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
                                    {taskData.status}
                                </Text>
                            </View>

                        </View>

                        {!!taskData.description && (
                            <Text style={{
                                fontSize: 13,
                                fontFamily: Fonts.Regular,
                                color: '#7f8c8d',
                                marginTop: 8,
                            }}>
                                {taskData.description}
                            </Text>
                        )}

                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 12 }} />

                        <InfoRow icon="account-outline" label="Assigned To" value={taskData.assigned_to} />
                        <InfoRow
                            icon="calendar-outline"
                            label="Due Date"
                            value={fmtDate(taskData.due_date)}
                        />
                        <InfoRow icon="calendar-check-outline" label="Entry On" value={formatDateTime(taskData.entry_date)} />
                        <InfoRow
                            icon="flag-outline"
                            label="Priority"
                            value={taskData.priority}
                            valueColor={priorityColor}
                        />
                        <InfoRow
                            icon="progress-check"
                            label="Status"
                            value={taskData.status}
                            valueColor={statusStyle.text}
                        />

                    </View>

                </ScrollView>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>No data found</Text>
                </View>
            )}

            {/* THREE DOT MENU */}
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
                                navigation.navigate('Addtask', { taskdata: taskData });
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

            {/* DELETE CONFIRM MODAL */}
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
                            Delete Task
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to delete "{taskData?.title}"?
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

export default Taskdetail;
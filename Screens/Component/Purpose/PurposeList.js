import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, StatusBar, RefreshControl, Modal,
    Switch, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import PurposeListShimmer from '../Shimmer/Purpose/PurposeListShimmer';

const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    const dateObj = new Date(dateString);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const PurposeList = ({ navigation }) => {

    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const [selectedItem, setSelectedItem] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const [isFirstPurposeDone, setIsFirstPurposeDone] = useState(false);

    const fetchPurposes = async () => {
        setLoading(true);
        try {
            const res = await fetch(API.list_purpose);
            const json = await res.json();

            if (json.code == 200) {
                setData(json.payload);
                setFiltered(json.payload);
            } else {
                setData([]);
                setFiltered([]);
            }
        } catch (e) {
            setData([]);
            setFiltered([]);
        } finally {
            setIsFirstPurposeDone(true);
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPurposes();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPurposes();
        setRefreshing(false);
    };

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();
        setFiltered(
            data.filter(i =>
                (i.purpose_name || '').toLowerCase().includes(q)
            )
        );
    };

    const handleToggle = async (item) => {
        const newStatus = item.purpose_status === "active" ? "deactive" : "active";
        setLoadingId(item.purpose_id);

        try {
            await fetch(API.purpose_status_update, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purpose_id: item.purpose_id,
                    purpose_status: newStatus
                })
            });

            setData(prev =>
                prev.map(i =>
                    i.purpose_id === item.purpose_id
                        ? { ...i, purpose_status: newStatus }
                        : i
                )
            );
            setFiltered(prev =>
                prev.map(i =>
                    i.purpose_id === item.purpose_id
                        ? { ...i, purpose_status: newStatus }
                        : i
                )
            );

        } catch (e) {
            console.log(e);
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async () => {
        try {
            await fetch(API.delete_purpose, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    purpose_id: selectedItem.purpose_id
                })
            });
            fetchPurposes();
        } catch (e) {
            console.log(e);
        }
    };

    const renderItem = ({ item, index }) => {
        return (
            <View style={{
                backgroundColor: '#fff',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                marginVertical: 6,
                borderWidth: 0.5,
                borderColor: '#e2e8f0',
            }}>

                {/* ROW 1: #Index + Toggle + 3-dot */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Text style={{
                        fontSize: 11,
                        fontFamily: Fonts.Bold,
                        color: '#94a3b8',
                    }}>
                        #{index + 1}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {loadingId === item.purpose_id ? (
                            <ActivityIndicator size="small" color="#555" />
                        ) : (
                            <Switch
                                value={item.purpose_status === "active"}
                                onValueChange={() => handleToggle(item)}
                                trackColor={{ false: "#f5b7b1", true: "#a3e4d7" }}
                                thumbColor={
                                    item.purpose_status === "active" ? "#2ecc71" : "#e74c3c"
                                }
                                ios_backgroundColor="#ccc"
                            />
                        )}

                        <TouchableOpacity
                            onPress={(e) => {
                                const { pageY } = e.nativeEvent;
                                setMenuPosition({ top: pageY + 9, right: 35 });
                                setSelectedItem(item);
                                setMenuVisible(true);
                            }}
                            style={{
                                padding: 5,
                                borderRadius: 8,
                                backgroundColor: '#f1f5f9',
                                borderWidth: 0.5,
                                borderColor: '#e2e8f0',
                            }}
                        >
                            <Icon name="dots-vertical" size={18} color="#2c3e50" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* DIVIDER */}
                <View style={{ height: 0.5, backgroundColor: '#e2e8f0', marginVertical: 7 }} />

                {/* NAME ROW */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={{
                        fontSize: 12,
                        fontFamily: Fonts.Bold,
                        color: '#2c3e50',
                        width: 40
                    }}>
                        Name:
                    </Text>
                    <Text style={{
                        flex: 1,
                        fontSize: 12,
                        fontFamily: Fonts.Regular,
                        color: '#7f8c8d'
                    }}>
                        {item.purpose_name || '--'}
                    </Text>
                </View>

                {/* ENTRY DATE */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                        Entry On:
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: Fonts.Regular, color: '#7f8c8d' }}>
                        {formatDateTime(item.entry_date)}
                    </Text>
                </View>

            </View>
        );
    };

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
                    Purpose List
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* SEARCH */}
            {(!isFirstPurposeDone || data.length > 0 || search.length > 0) && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    margin: 14,
                    paddingHorizontal: 12,
                    height: 44,
                    borderWidth: 0.5,
                    borderColor: '#e2e8f0',
                    gap: 8,
                }}>
                    <Icon name="magnify" size={18} color="#94a3b8" />
                    <TextInput
                        placeholder="Search purpose..."
                        value={search}
                        onChangeText={handleSearch}
                        style={{
                            flex: 1,
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#1e293b',
                        }}
                        placeholderTextColor="#c0ccd8"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Icon name="close-circle" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* COUNT */}
            {(!isFirstPurposeDone || data.length > 0 || search.length > 0) && (
                <Text style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginLeft: 16,
                    marginBottom: 4,
                }}>
                    {filtered.length} purpose{filtered.length !== 1 ? 's' : ''} found
                </Text>
            )}

            {/* LIST */}
            {loading ? (
                <PurposeListShimmer />
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.purpose_id}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 4, paddingHorizontal: 12 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.buttonbgcolor]} />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 220 }}>
                            <Icon name="clipboard-outline" size={48} color="#cbd5e1" />
                            <Text style={{
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#94a3b8',
                                marginTop: 12,
                            }}>
                                No Purposes Found
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FLOAT BUTTON */}
            <TouchableOpacity
                onPress={() => navigation.navigate('AddPurpose')}
                style={{
                    position: 'absolute',
                    bottom: 25,
                    right: 20,
                    backgroundColor: Colors.buttonbgcolor,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Icon name="plus" size={28} color="#fff" />
            </TouchableOpacity>

            {/* MENU MODAL */}
            <Modal transparent visible={menuVisible} animationType="fade">
                <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={{
                        position: 'absolute',
                        top: menuPosition.top,
                        right: menuPosition.right,
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        paddingVertical: 8,
                        width: 110,
                        elevation: 8
                    }}>
                        <TouchableOpacity
                            onPress={() => {
                                setMenuVisible(false);
                                navigation.navigate('AddPurpose', { purposeData: selectedItem });
                            }}
                        >
                            <Text style={{
                                padding: 10,
                                fontFamily: Fonts.Bold,
                                color: Colors.buttonbgcolor
                            }}>
                                Edit
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setMenuVisible(false);
                                setDeleteModal(true);
                            }}
                        >
                            <Text style={{
                                padding: 10,
                                fontFamily: Fonts.Bold,
                                color: '#ef4444'
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
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={{
                            fontSize: 16,
                            fontFamily: Fonts.Bold,
                            color: '#1e293b',
                            marginBottom: 8
                        }}>
                            Delete Purpose
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to delete "{selectedItem?.purpose_name}"?
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

        </SafeAreaView>
    );
};

export default PurposeList;
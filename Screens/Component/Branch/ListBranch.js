import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, StatusBar, RefreshControl, Modal,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors, Fonts, API } from '../Commoncomponent/Constants';
import Branchlistshimmer from '../Shimmer/Branch/Branchlistshimmer';

const PAGE_SIZE = 20;

const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    const dateObj = new Date(dateString.replace(' ', 'T'));
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

const ListBranch = ({ navigation }) => {

    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const [selectedItem, setSelectedItem] = useState(null);
    const [isFirstBranchDone, setIsFirstBranchDone] = useState(false);

    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const visibleData = filtered.slice(0, page * PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [search, data]);

    /* ================= FETCH (API se) ================= */
    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await fetch(API.list_branch, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const json = await res.json();

            if (json?.status && Array.isArray(json.payload)) {
                setData(json.payload);
                setFiltered(json.payload);
            } else {
                setData([]);
                setFiltered([]);
            }
        } catch (e) {
            setData([]);
            setFiltered([]);
            Toast.show({
                type: 'error',
                text1: 'Failed to load branches',
                position: 'bottom',
                bottomOffset: 60,
            });
        } finally {
            setIsFirstBranchDone(true);
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBranches();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBranches();
        setRefreshing(false);
    };

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();
        setFiltered(
            data.filter(i =>
                (i.branch_name || '').toLowerCase().includes(q)
            )
        );
    };

    const handleLoadMore = () => {
        if (loadingMore) return;
        if (visibleData.length >= filtered.length) return;

        setLoadingMore(true);
        setTimeout(() => {
            setPage(prev => prev + 1);
            setLoadingMore(false);
        }, 400);
    };

    /* ================= DELETE (API se) ================= */
    const handleDelete = async () => {
        if (!selectedItem) return;
        setDeleting(true);
        try {
            const res = await fetch(API.delete_branch, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ branch_id: selectedItem.branch_id }),
            });
            const json = await res.json();

            if (json?.status) {
                const remaining = data.filter(i => i.branch_id !== selectedItem.branch_id);
                setData(remaining);
                setFiltered(remaining.filter(i => (i.branch_name || '').toLowerCase().includes(search.toLowerCase())));

                Toast.show({
                    type: 'success',
                    text1: json?.message || 'Branch Deleted Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: json?.message || 'Failed to delete branch',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            }
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Something went wrong',
                position: 'bottom',
                bottomOffset: 60,
            });
        } finally {
            setDeleting(false);
            setDeleteModal(false);
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

                {/* ROW 1: #Index + 3-dot */}
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
                        color: '#7f8c8d',
                        textTransform: 'capitalize'
                    }}>
                        {item.branch_name || '--'}
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
                    Branch List
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* SEARCH */}
            {(!isFirstBranchDone || data.length > 0 || search.length > 0) && (
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
                        placeholder="Search branch..."
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
            {(!isFirstBranchDone || data.length > 0 || search.length > 0) && (
                <Text style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginLeft: 16,
                    marginBottom: 4,
                }}>
                    {filtered.length} branch{filtered.length !== 1 ? 'es' : ''} found
                </Text>
            )}

            {/* LIST */}
            {loading ? (
                <Branchlistshimmer />
            ) : (
                <FlatList
                    data={visibleData}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.branch_id)}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 4, paddingHorizontal: 12 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.buttonbgcolor]} />
                    }
                    onEndReachedThreshold={0.4}
                    onEndReached={handleLoadMore}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 220 }}>
                            <Icon name="office-building-outline" size={48} color="#cbd5e1" />
                            <Text style={{
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#94a3b8',
                                marginTop: 12,
                            }}>
                                No Branches Found
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FLOAT BUTTON */}
            <TouchableOpacity
                onPress={() => navigation.navigate('AddBranch')}
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
                                navigation.navigate('AddBranch', { branchData: selectedItem });
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
                            Delete Branch
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to delete "{selectedItem?.branch_name}"?
                        </Text>

                        <View style={{ flexDirection: 'row', width: '100%' }}>
                            <TouchableOpacity
                                onPress={() => setDeleteModal(false)}
                                disabled={deleting}
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
                                onPress={handleDelete}
                                disabled={deleting}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#ef4444',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginLeft: 5,
                                    alignItems: 'center'
                                }}
                            >
                                {deleting
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={{
                                        color: '#fff',
                                        fontFamily: Fonts.Bold
                                    }}>
                                        Delete
                                    </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
};

export default ListBranch;
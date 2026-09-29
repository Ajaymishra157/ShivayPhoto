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
import Listpackageshimmer from '../Shimmer/Packages/Listpackageshimmer';

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

/* 2 line tak dikhata hai, zyada ho to onTruncate(true) call karta hai */
const ClampText = ({ text, style, onTruncate }) => (
    <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={style}>{text}</Text>
        {/* hidden measure text (full length) */}
        <Text
            style={[style, { position: 'absolute', left: 0, right: 0, opacity: 0 }]}
            pointerEvents="none"
            onTextLayout={(e) => onTruncate(e.nativeEvent.lines.length > 2)}
        >
            {text}
        </Text>
    </View>
);

const PackageCard = ({ item, index, onMenu, onInfo }) => {
    const [nameLong, setNameLong] = useState(false);
    const [branchLong, setBranchLong] = useState(false);
    const isActive = item.status === 'Active';

    const InfoBtn = () => (
        <TouchableOpacity
            onPress={() => onInfo(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
                marginLeft: 6,
                padding: 2,
                borderRadius: 6,
                backgroundColor: '#eef6ff',
                borderWidth: 0.5,
                borderColor: '#bfdbfe',
            }}
        >
            <Icon name="information-outline" size={13} color="#2563eb" />
        </TouchableOpacity>
    );

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

            {/* ROW 1: #Index + status + 3-dot */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, fontFamily: Fonts.Bold, color: '#94a3b8' }}>
                    #{index + 1}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        backgroundColor: isActive ? '#e6f7ec' : '#fdeaea',
                        marginRight: 8
                    }}>
                        <Text style={{
                            fontSize: 10,
                            fontFamily: Fonts.Bold,
                            color: isActive ? '#1e9e4a' : '#d33'
                        }}>
                            {item.status || '--'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={(e) => onMenu(e, item)}
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

            {/* PACKAGE NAME */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: '#2c3e50', width: 62 }}>
                    Package:
                </Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <ClampText
                            text={item.package_name || '--'}
                            onTruncate={setNameLong}
                            style={{ fontSize: 12, fontFamily: Fonts.Regular, color: '#7f8c8d', textTransform: 'capitalize' }}
                        />
                    </View>
                    {nameLong && <InfoBtn />}
                </View>
            </View>

            {/* BRANCH NAME */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: Fonts.Bold, color: '#2c3e50', width: 62 }}>
                    Branch:
                </Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <ClampText
                            text={item.branch_name || '--'}
                            onTruncate={setBranchLong}
                            style={{ fontSize: 12, fontFamily: Fonts.Regular, color: '#7f8c8d', textTransform: 'capitalize' }}
                        />
                    </View>
                    {branchLong && <InfoBtn />}
                </View>
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

const Listpackages = ({ navigation }) => {

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
    const [infoModal, setInfoModal] = useState(false);
    const [infoItem, setInfoItem] = useState(null);
    const [isFirstDone, setIsFirstDone] = useState(false);

    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const visibleData = filtered.slice(0, page * PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [search, data]);

    const matches = (i, q) =>
        (i.package_name || '').toLowerCase().includes(q) ||
        (i.branch_name || '').toLowerCase().includes(q);

    /* ================= FETCH ================= */
    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await fetch(API.list_package, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // branch_id khali = puri list
                body: JSON.stringify({ branch_id: '' }),
            });
            const json = await res.json();

            if (json?.status && Array.isArray(json.payload)) {
                setData(json.payload);
                setFiltered(json.payload.filter(i => matches(i, search.toLowerCase())));
            } else {
                setData([]);
                setFiltered([]);
            }
        } catch (e) {
            setData([]);
            setFiltered([]);
            Toast.show({
                type: 'error',
                text1: 'Failed to load packages',
                position: 'bottom',
                bottomOffset: 60,
            });
        } finally {
            setIsFirstDone(true);
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPackages();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPackages();
        setRefreshing(false);
    };

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();
        setFiltered(data.filter(i => matches(i, q)));
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

    /* ================= DELETE ================= */
    const handleDelete = async () => {
        if (!selectedItem) return;
        setDeleting(true);
        try {
            const res = await fetch(API.delete_package, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ package_id: Number(selectedItem.package_id) }),
            });
            const json = await res.json();

            if (json?.status) {
                const remaining = data.filter(i => i.package_id !== selectedItem.package_id);
                setData(remaining);
                setFiltered(remaining.filter(i => matches(i, search.toLowerCase())));

                Toast.show({
                    type: 'success',
                    text1: json?.message || 'Package Deleted Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: json?.message || 'Failed to delete package',
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

    const openMenu = (e, item) => {
        const { pageY } = e.nativeEvent;
        setMenuPosition({ top: pageY + 9, right: 35 });
        setSelectedItem(item);
        setMenuVisible(true);
    };

    const openInfo = (item) => {
        setInfoItem(item);
        setInfoModal(true);
    };

    const InfoRow = ({ label, value }) => (
        <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontFamily: Fonts.Bold, color: '#94a3b8', marginBottom: 2 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b' }}>
                {value || '--'}
            </Text>
        </View>
    );

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
                    Package List
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* SEARCH */}
            {(!isFirstDone || data.length > 0 || search.length > 0) && (
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
                        placeholder="Search package or branch..."
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
            {(!isFirstDone || data.length > 0 || search.length > 0) && (
                <Text style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginLeft: 16,
                    marginBottom: 4,
                }}>
                    {filtered.length} package{filtered.length !== 1 ? 's' : ''} found
                </Text>
            )}

            {/* LIST */}
            {loading && !refreshing ? (
                <Listpackageshimmer />
            ) : (
                <FlatList
                    data={visibleData}
                    renderItem={({ item, index }) => (
                        <PackageCard item={item} index={index} onMenu={openMenu} onInfo={openInfo} />
                    )}
                    keyExtractor={(item) => String(item.package_id)}
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
                            <Icon name="package-variant" size={48} color="#cbd5e1" />
                            <Text style={{
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#94a3b8',
                                marginTop: 12,
                            }}>
                                No Packages Found
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FLOAT BUTTON */}
            <TouchableOpacity
                onPress={() => navigation.navigate('AddPackages')}
                style={{
                    position: 'absolute',
                    bottom: 25,
                    right: 20,
                    backgroundColor: Colors.buttonbgcolor,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 5
                }}
            >
                <Icon name="plus" size={28} color="#fff" />
            </TouchableOpacity>

            {/* MENU MODAL (3 dot ke paas) */}
            <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
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
                                navigation.navigate('AddPackages', { packageData: selectedItem });
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

            {/* INFO MODAL */}
            <Modal visible={infoModal} transparent animationType="fade" onRequestClose={() => setInfoModal(false)}>
                <TouchableOpacity
                    activeOpacity={1}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onPress={() => setInfoModal(false)}
                >
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 14,
                            padding: 20,
                            width: '88%',
                            maxHeight: '75%',
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 14
                        }}>
                            <Text style={{ fontSize: 16, fontFamily: Fonts.Bold, color: '#1e293b' }}>
                                Package Details
                            </Text>
                            <TouchableOpacity onPress={() => setInfoModal(false)}>
                                <Icon name="close" size={22} color="#334155" />
                            </TouchableOpacity>
                        </View>

                        <InfoRow label="Package Name" value={infoItem?.package_name} />
                        <InfoRow label="Branch" value={infoItem?.branch_name} />
                        <InfoRow label="Status" value={infoItem?.status} />
                        <InfoRow label="Entry On" value={formatDateTime(infoItem?.entry_date)} />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* DELETE MODAL */}
            <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
                <TouchableOpacity
                    activeOpacity={1}
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
                            Delete Package
                        </Text>

                        <Text style={{
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#64748b',
                            textAlign: 'center',
                            marginBottom: 20
                        }}>
                            Are you sure you want to delete "{selectedItem?.package_name}"?
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
                                <Text style={{ fontFamily: Fonts.Bold, color: '#475569' }}>
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
                                    : <Text style={{ color: '#fff', fontFamily: Fonts.Bold }}>
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

export default Listpackages;
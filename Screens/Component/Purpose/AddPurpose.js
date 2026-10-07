import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList,
    StyleSheet, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

/* ─────────────────────────────────────────────
   PICKER MODAL (center, search + close)
───────────────────────────────────────────── */
const PickerModal = ({
    visible, onClose, title, data, selected, onSelect,
    keyField, labelField, loading
}) => {
    const [q, setQ] = useState('');
    const filtered = data.filter(d =>
        (d[labelField] || '').toLowerCase().includes(q.toLowerCase())
    );

    useEffect(() => { if (!visible) setQ(''); }, [visible]);

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalCard} onStartShouldSetResponder={() => true}>

                    <View style={styles.modalTitleRow}>
                        <Text style={styles.modalTitleNew}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchRow}>
                        <Icon name="magnify" size={18} color="#94a3b8" />
                        <TextInput
                            value={q}
                            onChangeText={setQ}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            placeholderTextColor="#94a3b8"
                            style={styles.searchInput}
                        />
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ padding: 30 }} color={Colors.buttonbgcolor} />
                    ) : (
                        <FlatList
                            data={filtered}
                            keyExtractor={item => String(item[keyField])}
                            style={{ maxHeight: 300 }}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const isSelected = String(selected) === String(item[keyField]);
                                return (
                                    <TouchableOpacity
                                        onPress={() => { onSelect(item); onClose(); }}
                                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                    >
                                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                            {item[labelField]}
                                        </Text>
                                        {isSelected && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <Text style={{ fontSize: 13, color: '#94a3b8', fontFamily: Fonts.Regular }}>
                                        No results found
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
const AddPurpose = ({ navigation, route }) => {

    const purposeData = route?.params?.purposeData;
    const isEdit = !!purposeData;

    const [purposeName, setPurposeName] = useState(isEdit ? purposeData.purpose_name : '');
    const [selectedBranch, setSelectedBranch] = useState(
        isEdit && purposeData.branch_id
            ? { branch_id: purposeData.branch_id, branch_name: purposeData.branch_name }
            : null
    );

    const [branches, setBranches] = useState([]);
    const [branchModal, setBranchModal] = useState(false);
    const [branchLoading, setBranchLoading] = useState(false);

    const [errors, setErrors] = useState({ branch: '', name: '' });
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    const showToast = (type, text1) => {
        Toast.show({ type, text1, position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        setBranchLoading(true);
        try {
            const res = await fetch(API.list_branch, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            const list = json?.status && Array.isArray(json.payload) ? json.payload : [];
            setBranches(list);

            // Edit mode mein agar sirf branch_id aayi hai (naam nahi), to naam list se nikal lo
            if (isEdit && purposeData?.branch_id && !purposeData?.branch_name) {
                const found = list.find(
                    b => String(b.branch_id) === String(purposeData.branch_id)
                );
                if (found) setSelectedBranch(found);
            }
        } catch (e) {
            setBranches([]);
            showToast('error', 'Failed to load branches');
        } finally {
            setBranchLoading(false);
        }
    };

    const validate = () => {
        const e = { branch: '', name: '' };
        if (!selectedBranch) e.branch = 'Please Select Branch';
        if (!purposeName.trim()) e.name = 'Please Enter Purpose Name';
        setErrors(e);
        return !e.branch && !e.name;
    };

    const handleSave = async () => {

        if (savingRef.current) return;   // 🆕 pehle se save chal raha hai to ignore
        if (!validate()) return;

        savingRef.current = true;        // 🆕
        setSaving(true);
        let success = false;

        try {
            const url = isEdit ? API.update_purpose : API.add_purpose;

            const body = isEdit
                ? {
                    purpose_id: purposeData.purpose_id,
                    purpose_name: purposeName.trim(),
                    branch_id: Number(selectedBranch.branch_id),
                }
                : {
                    purpose_name: purposeName.trim(),
                    branch_id: Number(selectedBranch.branch_id),
                };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();

            if (result.code == 200 || result.status === true) {
                showToast('success', isEdit ? 'Purpose Updated Successfully' : 'Purpose Added Successfully');
                setTimeout(() => navigation.goBack(), 500);
                return;                          // 🆕 success par saving true hi rehne do, screen band hone tak
            } else {
                showToast('error', result.message || 'Something went wrong');
            }
        } catch (e) {
            showToast('error', 'Network Error');
        } finally {
            if (!success) {            // sirf fail hone par button wapas khulega
                savingRef.current = false;
                setSaving(false);
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#f5f6f8' }}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
        >
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Update Purpose' : 'Add Purpose'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

                {/* BRANCH */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                    Branch<Text style={{ color: 'red' }}> *</Text>
                </Text>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setBranchModal(true)}
                    style={[styles.dropdown, errors.branch ? styles.inputError : null]}
                >
                    <Text
                        numberOfLines={1}
                        style={[styles.dropdownText, !selectedBranch && { color: '#999' }]}
                    >
                        {selectedBranch?.branch_name || 'Select Branch'}
                    </Text>
                    <Icon name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
                {!!errors.branch && <Text style={styles.errText}>{errors.branch}</Text>}

                {/* PURPOSE NAME */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                    Purpose Name<Text style={{ color: 'red' }}> *</Text>
                </Text>

                <TextInput
                    value={purposeName}
                    onChangeText={(t) => {
                        setPurposeName(t);
                        if (t) setErrors(p => ({ ...p, name: '' }));
                    }}
                    placeholder="Enter Purpose Name"
                    placeholderTextColor="#999"
                    style={[styles.input, errors.name ? styles.inputError : null]}
                />
                {!!errors.name && <Text style={styles.errText}>{errors.name}</Text>}

                {/* BUTTON */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveBtn, { marginTop: 30 }]}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.saveBtnText}>{isEdit ? 'Update Purpose' : 'Add Purpose'}</Text>
                    }
                </TouchableOpacity>

            </ScrollView>

            {/* BRANCH PICKER */}
            <PickerModal
                visible={branchModal}
                onClose={() => setBranchModal(false)}
                title="Select Branch"
                data={branches}
                loading={branchLoading}
                selected={selectedBranch?.branch_id}
                onSelect={item => {
                    setSelectedBranch(item);
                    setErrors(p => ({ ...p, branch: '' }));
                }}
                keyField="branch_id"
                labelField="branch_name"
            />
        </KeyboardAvoidingView>
    );
};

export default AddPurpose;

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = StyleSheet.create({
    header: {
        height: 50,
        backgroundColor: Colors.buttonbgcolor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.Bold,
    },
    fieldLabel: {
        fontSize: 13,
        fontFamily: Fonts.Bold,
        color: '#2c3e50',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        height: 48,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        color: '#000',
        fontFamily: Fonts.Regular,
        fontSize: 14,
    },
    inputError: {
        borderColor: 'red',
    },
    errText: {
        color: 'red',
        fontSize: 11,
        fontFamily: Fonts.Regular,
        marginTop: 3,
    },
    dropdown: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        height: 48,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: {
        flex: 1,
        fontSize: 14,
        color: '#000',
        fontFamily: Fonts.Regular,
    },
    saveBtn: {
        backgroundColor: Colors.buttonbgcolor,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: Fonts.Bold,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        width: '85%',
        overflow: 'hidden',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingLeft: 16,
        paddingRight: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    modalTitleNew: {
        fontSize: 15,
        fontFamily: Fonts.Bold,
        color: '#1e293b',
        flex: 1,
    },
    modalCloseBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10,
        paddingHorizontal: 12,
        height: 40,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.Regular,
        color: '#1e293b',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#fff',
    },
    modalItemSelected: {
        backgroundColor: '#f0fdf4',
    },
    modalItemText: {
        flex: 1,
        fontSize: 14,
        fontFamily: Fonts.Regular,
        color: '#1e293b',
    },
    modalItemTextSelected: {
        fontFamily: Fonts.Bold,
        color: Colors.buttonbgcolor,
    },
});
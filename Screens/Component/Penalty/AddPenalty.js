import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts } from '../Commoncomponent/Constants';

/* ── STATIC DATA (API baad me connect karna) ── */
const STAFF_OPTIONS = [
    { label: 'Shahrukh Khan', value: 'Shahrukh Khan' },
    { label: 'Riya', value: 'Riya' },
    { label: 'Gopika', value: 'Gopika' },
    { label: 'Admin User', value: 'Admin User' },
];

const fmtDisplay = (d) => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const AddPenalty = ({ navigation, route }) => {

    const penaltyData = route?.params?.penaltydata;
    const isEdit = !!penaltyData;

    const [staff, setStaff] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [penaltyDate, setPenaltyDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && penaltyData) {
            setStaff(penaltyData.staff || '');
            setAmount(penaltyData.amount ? String(penaltyData.amount) : '');
            setReason(penaltyData.reason || '');
            setPenaltyDate(penaltyData.penalty_date ? new Date(penaltyData.penalty_date) : new Date());
        }
    }, []);

    const clearErr = (key) => setErrors(prev => ({ ...prev, [key]: '' }));

    const validate = () => {
        const err = {};
        if (!staff) err.staff = 'Please Select Staff';
        if (!amount.trim()) err.amount = 'Please Enter Amount';
        if (!reason.trim()) err.reason = 'Please Enter Reason';
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        // TODO: API ready hone par yaha fetch(API.add_penalty / API.update_penalty) call karna
        setTimeout(() => {
            setLoading(false);
            Toast.show({
                type: 'success',
                text1: isEdit ? 'Penalty Updated Successfully' : 'Penalty Added Successfully',
                position: 'bottom', bottomOffset: 60, visibilityTime: 2000,
            });
            setTimeout(() => navigation.goBack(), 500);
        }, 600);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f5f6f8' }} behavior={Platform.OS === 'ios' ? 'padding' : null}>

            {/* HEADER */}
            <View style={{
                height: 50, backgroundColor: Colors.buttonbgcolor,
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', paddingHorizontal: 12,
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 16, fontFamily: Fonts.Bold }}>
                    {isEdit ? 'Update Penalty' : 'Add Penalty'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                {/* STAFF */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Staff<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>
                <Dropdown
                    data={STAFF_OPTIONS}
                    labelField="label"
                    valueField="value"
                    value={staff}
                    placeholder="Select Staff"
                    onChange={item => { setStaff(item.value); clearErr('staff'); }}
                    dropdownPosition="auto"
                    renderItem={item => {
                        const isSelected = item.value === staff;
                        return (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                paddingHorizontal: 14, paddingVertical: 12,
                                backgroundColor: isSelected ? '#f0fdf4' : '#fff',
                            }}>
                                <Text style={{
                                    fontSize: 14,
                                    fontFamily: isSelected ? Fonts.Bold : Fonts.Regular,
                                    color: isSelected ? Colors.buttonbgcolor : '#1e293b',
                                }}>
                                    {item.label}
                                </Text>
                                {isSelected && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                            </View>
                        );
                    }}
                    style={{
                        borderWidth: 1, borderColor: errors.staff ? 'red' : '#ddd', borderRadius: 10,
                        paddingHorizontal: 10, height: 50, marginTop: 5, backgroundColor: '#fff',
                    }}
                    placeholderStyle={{ color: '#999', fontFamily: Fonts.Regular }}
                    selectedTextStyle={{ color: '#000', fontFamily: Fonts.Regular }}
                    containerStyle={{
                        borderRadius: 10, borderWidth: 0.5, borderColor: '#e2e8f0',
                        elevation: 10, shadowColor: '#000', shadowOpacity: 0.1,
                        shadowRadius: 8, marginTop: 6, shadowOffset: { width: 0, height: 4 },
                    }}
                />
                {errors.staff ? <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>{errors.staff}</Text> : null}

                {/* AMOUNT */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Amount<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>
                <TextInput
                    value={amount}
                    keyboardType="decimal-pad"
                    onChangeText={(t) => { setAmount(t.replace(/[^0-9.]/g, '')); if (t) clearErr('amount'); }}
                    placeholder="Enter Amount"
                    placeholderTextColor="#999"
                    style={{
                        borderWidth: 1, borderColor: errors.amount ? 'red' : '#ddd',
                        borderRadius: 10, height: 48, paddingHorizontal: 12,
                        backgroundColor: '#fff', marginTop: 5, color: '#000',
                        fontFamily: Fonts.Regular,
                    }}
                />
                {errors.amount ? <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>{errors.amount}</Text> : null}

                {/* REASON */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Reason<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>
                <TextInput
                    value={reason}
                    onChangeText={(t) => { setReason(t); if (t) clearErr('reason'); }}
                    placeholder="Enter Reason"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    style={{
                        borderWidth: 1, borderColor: errors.reason ? 'red' : '#ddd', borderRadius: 10,
                        height: 100, paddingHorizontal: 12, paddingTop: 10,
                        backgroundColor: '#fff', marginTop: 5, color: '#000',
                        fontFamily: Fonts.Regular, textAlignVertical: 'top',
                    }}
                />
                {errors.reason ? <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>{errors.reason}</Text> : null}

                {/* PENALTY DATE */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Penalty Date
                </Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                    style={{
                        borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
                        height: 48, paddingHorizontal: 12, backgroundColor: '#fff',
                        marginTop: 5, flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text style={{ fontSize: 14, fontFamily: Fonts.Regular, color: '#000' }}>
                        {fmtDisplay(penaltyDate)}
                    </Text>
                    <Icon name="calendar" size={18} color="#94a3b8" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={penaltyDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selected) => {
                            setShowDatePicker(false);
                            if (selected) setPenaltyDate(selected);
                        }}
                    />
                )}

                {/* BUTTON */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    style={{
                        backgroundColor: Colors.buttonbgcolor, height: 52,
                        borderRadius: 12, justifyContent: 'center', alignItems: 'center',
                        marginTop: 30,
                    }}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontSize: 15, fontFamily: Fonts.Bold }}>
                            {isEdit ? 'Update Penalty' : 'Add Penalty'}
                        </Text>
                    }
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default AddPenalty;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    FlatList,
    Modal
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

const AddUser = ({ navigation, route }) => {

    const userData = route?.params?.userdata;
    const isEdit = !!userData;

    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [typeModal, setTypeModal] = useState(false);

    const userTypes = [
        { label: 'Admin', value: 'Admin' },
        { label: 'Management', value: 'Management' },
        { label: 'Sales-Person', value: 'Sales-Person' },
        // { label: 'Booking-Person', value: 'Booking-Person' },
        { label: 'Coordinator', value: 'Coordinator' },
        { label: 'Photographer', value: 'Photographer' },
        { label: 'Coordinator Post Production', value: 'Coordinator → Editor' },
        { label: 'Photo Editor', value: 'Photo Editor' },
        { label: 'Video Editor', value: 'Video Editor' },
    ];
    const selectedTypeLabel = userTypes.find(t => t.value === type)?.label || '';   // ⬅ NEW
    useEffect(() => {
        if (isEdit && userData) {
            setName(userData.user_name);
            setMobile(userData.user_mobile);
            setEmail(userData.user_email);
            setPassword(userData.user_password);
            setType(userData.user_type);
        }
    }, []);

    const validate = () => {
        let err = {};

        if (!name.trim()) err.name = "Please Enter Name";

        if (!mobile.trim()) err.mobile = "Please Enter Mobile";
        else if (mobile.length !== 10) err.mobile = "Mobile must be 10 digits";

        if (!password.trim()) err.password = "Please Enter Password";
        if (!type) err.type = "Please Select Type";

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSave = async () => {

        if (!validate()) return;

        try {
            setLoading(true);

            const url = isEdit ? API.update_user : API.add_user;

            const body = isEdit
                ? { id: userData.id, user_name: name, user_mobile: mobile, user_email: email, user_password: password, user_type: type }
                : { user_name: name, user_mobile: mobile, user_email: email, user_password: password, user_type: type };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await res.json();

            if (result.code == 200) {
                Toast.show({
                    type: 'success',
                    text1: isEdit ? 'User Updated Successfully' : 'User Added Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000
                });

                setTimeout(() => navigation.goBack(), 500);

            } else if (result.code == 409) {

                setErrors({ ...errors, mobile: 'Mobile already exists' });
            }
            else {
                Toast.show({
                    type: 'error',
                    text1: result.message || 'Failed',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000

                });
            }

        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Network Error',
                position: 'bottom',
                bottomOffset: 60,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#f5f6f8' }}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
        >

            {/* HEADER */}
            <View style={{
                height: 50,
                backgroundColor: Colors.buttonbgcolor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 12
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontFamily: Fonts.Bold
                }}>
                    {isEdit ? "Update User" : "Add User"}
                </Text>

                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

                {/* NAME */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Name<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>
                <TextInput
                    value={name}
                    onChangeText={(t) => {
                        setName(t);
                        if (t) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="Enter Name"
                    placeholderTextColor="#999"
                    style={{
                        borderWidth: 1,
                        borderColor: errors.name ? 'red' : '#ddd',
                        borderRadius: 10,
                        height: 48,
                        paddingHorizontal: 12,
                        backgroundColor: '#fff',
                        marginTop: 5,
                        color: '#000',
                        fontFamily: Fonts.Regular
                    }}
                />
                {errors.name && <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>{errors.name}</Text>}

                {/* MOBILE */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Mobile<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>
                <TextInput
                    value={mobile}
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                        const onlyNums = t.replace(/[^0-9]/g, '');
                        setMobile(onlyNums);
                        if (onlyNums.length === 10) setErrors({ ...errors, mobile: '' });
                    }}
                    placeholder="Enter Mobile"
                    placeholderTextColor="#999"
                    style={{
                        borderWidth: 1,
                        borderColor: errors.mobile ? 'red' : '#ddd',
                        borderRadius: 10,
                        height: 48,
                        paddingHorizontal: 12,
                        backgroundColor: '#fff',
                        marginTop: 5,
                        color: '#000',
                        fontFamily: Fonts.Regular
                    }}
                />
                {errors.mobile && <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>{errors.mobile}</Text>}

                {/* EMAIL */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Email
                </Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter Email"
                    placeholderTextColor="#999"
                    style={{
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 10,
                        height: 48,
                        paddingHorizontal: 12,
                        backgroundColor: '#fff',
                        marginTop: 5,
                        color: '#000',
                        fontFamily: Fonts.Regular
                    }}
                />

                {/* PASSWORD */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Password<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>
                <View style={{
                    borderWidth: 1,
                    borderColor: errors.password ? 'red' : '#ddd',
                    borderRadius: 10,
                    height: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    marginTop: 5,
                }}>
                    <TextInput
                        value={password}
                        secureTextEntry={!showPassword}
                        onChangeText={(t) => {
                            setPassword(t);
                            if (t) setErrors({ ...errors, password: '' });
                        }}
                        placeholder="Enter Password"
                        placeholderTextColor="#999"
                        style={{
                            flex: 1,
                            paddingHorizontal: 12,
                            color: '#000',
                            fontFamily: Fonts.Regular
                        }}
                    />

                    {/* 👁 Eye Icon */}
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ paddingHorizontal: 10 }}
                    >
                        <Icon
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#94a3b8"
                        />
                    </TouchableOpacity>
                </View>

                {errors.password && (
                    <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>
                        {errors.password}
                    </Text>
                )}
                {/* USER TYPE */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    User Type<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>

                <TouchableOpacity
                    onPress={() => setTypeModal(true)}
                    activeOpacity={0.8}
                    style={{
                        borderWidth: 1,
                        borderColor: errors.type ? 'red' : '#ddd',
                        borderRadius: 10,
                        height: 50,
                        paddingHorizontal: 12,
                        marginTop: 5,
                        backgroundColor: '#fff',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text style={{
                        fontSize: 14,
                        fontFamily: Fonts.Regular,
                        color: selectedTypeLabel ? '#000' : '#999',
                    }}>
                        {selectedTypeLabel || 'Select User Type'}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                </TouchableOpacity>
                {errors.type && <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>{errors.type}</Text>}

                {/* ── USER TYPE MODAL — NEW ── */}
                <Modal visible={typeModal} transparent animationType="fade">
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        activeOpacity={1}
                        onPress={() => setTypeModal(false)}
                    >
                        <View
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 14,
                                width: '80%',
                                overflow: 'hidden',
                            }}
                            onStartShouldSetResponder={() => true}
                        >
                            <Text style={{
                                fontSize: 15,
                                fontFamily: Fonts.Bold,
                                color: '#1e293b',
                                textAlign: 'center',
                                paddingVertical: 14,
                                borderBottomWidth: 0.5,
                                borderBottomColor: '#e2e8f0',
                            }}>
                                Select User Type
                            </Text>
                            <TouchableOpacity style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                zIndex: 10,
                                padding: 6,
                            }} onPress={() => setTypeModal(false)}>
                                <Icon name="close" size={20} color="#64748b" />
                            </TouchableOpacity>

                            <FlatList
                                data={userTypes}
                                keyExtractor={(item, index) => index.toString()}
                                style={{ maxHeight: 360 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const sel = type === item.value;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setType(item.value);
                                                setErrors({ ...errors, type: '' });
                                                setTypeModal(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 13,
                                                paddingHorizontal: 20,
                                                borderBottomWidth: 0.5,
                                                borderBottomColor: '#f1f5f9',
                                                backgroundColor: sel ? '#f0fdf4' : '#fff',
                                            }}
                                        >
                                            <Text style={{
                                                flex: 1,
                                                fontSize: 14,
                                                fontFamily: sel ? Fonts.Bold : Fonts.Regular,
                                                color: sel ? Colors.buttonbgcolor : '#1e293b',
                                            }}>
                                                {item.label}
                                            </Text>
                                            {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>
                {/* BUTTON */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    style={{
                        backgroundColor: Colors.buttonbgcolor,
                        height: 52,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 30
                    }}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontSize: 15, fontFamily: Fonts.Bold }}>
                            {isEdit ? "Update User" : "Add User"}
                        </Text>
                    }
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default AddUser;
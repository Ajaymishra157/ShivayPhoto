import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView,
    StatusBar
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from './Commoncomponent/Constants';

const ChangePassword = ({ navigation }) => {

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};

        if (!oldPassword.trim()) {
            e.oldPassword = 'Please Enter Old Password';
        }

        if (!newPassword.trim()) {
            e.newPassword = 'Please Enter New Password';
        } else if (newPassword.length < 6) {
            e.newPassword = 'Password must be at least 6 characters';
        }

        if (!confirmPassword.trim()) {
            e.confirmPassword = 'Please Enter Confirm Password';
        } else if (confirmPassword.length < 6) {
            e.confirmPassword = 'Password must be at least 6 characters';
        } else if (newPassword !== confirmPassword) {
            e.confirmPassword = 'Passwords do not match';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.change_password, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    old_password: oldPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const result = await res.json();

            if (result.code == 200) {
                Toast.show({
                    type: 'success',
                    text1: 'Password Changed Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000
                });
                setTimeout(() => navigation.goBack(), 500);

            } else {
                // 👇 IMPORTANT CHANGE
                if (result.message === "Old Password Is Wrong") {
                    setErrors(prev => ({
                        ...prev,
                        oldPassword: 'Old Password is incorrect'
                    }));
                } else {
                    Toast.show({
                        type: 'error',
                        text1: result.message || 'Something went wrong',
                        position: 'bottom',
                        bottomOffset: 60,
                    });
                }
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

    const renderInput = (label, value, setValue, show, setShow, errorKey, placeholder) => (
        <>
            <Text style={{
                marginTop: 14,
                fontSize: 13,
                fontFamily: Fonts.Bold,
                color: '#2c3e50'
            }}>
                {label}<Text style={{ color: 'red' }}>*</Text>
            </Text>

            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: errors[errorKey] ? 'red' : '#ddd',
                borderRadius: 10,
                height: 48,
                paddingHorizontal: 12,
                backgroundColor: '#fff',
                marginTop: 5,
            }}>
                <TextInput
                    value={value}
                    onChangeText={(t) => {
                        setValue(t);
                        if (t) setErrors(prev => ({ ...prev, [errorKey]: '' }));
                    }}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    secureTextEntry={!show}
                    style={{
                        flex: 1,
                        color: '#000',
                        fontFamily: Fonts.Regular,
                        fontSize: 13,
                    }}
                />
                <TouchableOpacity onPress={() => setShow(!show)}>
                    <Icon name={show ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {errors[errorKey] ? (
                <Text style={{
                    color: 'red',
                    fontSize: 11,
                    fontFamily: Fonts.Regular,
                    marginTop: 2
                }}>
                    {errors[errorKey]}
                </Text>
            ) : null}
        </>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
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
                        Change Password
                    </Text>

                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 16 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderInput(
                        'Old Password',
                        oldPassword,
                        setOldPassword,
                        showOld,
                        setShowOld,
                        'oldPassword',
                        'Enter Old Password'
                    )}

                    {renderInput(
                        'New Password',
                        newPassword,
                        setNewPassword,
                        showNew,
                        setShowNew,
                        'newPassword',
                        'Enter New Password'
                    )}

                    {renderInput(
                        'Confirm Password',
                        confirmPassword,
                        setConfirmPassword,
                        showConfirm,
                        setShowConfirm,
                        'confirmPassword',
                        'Enter Confirm Password'
                    )}

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
                            : <Text style={{
                                color: '#fff',
                                fontSize: 15,
                                fontFamily: Fonts.Bold
                            }}>
                                Change Password
                            </Text>
                        }
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChangePassword;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

const AddPurpose = ({ navigation, route }) => {

    const purposeData = route?.params?.purposeData;
    const isEdit = !!purposeData;

    const [purposeName, setPurposeName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEdit && purposeData) {
            setPurposeName(purposeData.purpose_name);
        }
    }, []);

    const validate = () => {
        if (!purposeName.trim()) {
            setError("Please Enter Purpose Name");
            return false;
        }
        setError('');
        return true;
    };

    const handleSave = async () => {

        if (!validate()) return;

        try {
            setLoading(true);

            const url = isEdit ? API.update_purpose : API.add_purpose;

            const body = isEdit
                ? {
                    purpose_id: purposeData.purpose_id,
                    purpose_name: purposeName
                }
                : {
                    purpose_name: purposeName
                };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await res.json();

            if (result.code == 200) {
                Toast.show({
                    type: 'success',
                    text1: isEdit ? 'Purpose Updated Successfully' : 'Purpose Added Successfully',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000
                });

                setTimeout(() => navigation.goBack(), 500);

            } else {
                Toast.show({
                    type: 'error',
                    text1: result.message || 'Something went wrong',
                    position: 'bottom',
                    bottomOffset: 60,
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
                    {isEdit ? "Update Purpose" : "Add Purpose"}
                </Text>

                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

                {/* PURPOSE NAME */}
                <Text style={{
                    marginTop: 14,
                    fontSize: 13,
                    fontFamily: Fonts.Bold,
                    color: '#2c3e50'
                }}>
                    Purpose Name<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>

                <TextInput
                    value={purposeName}
                    onChangeText={(t) => {
                        setPurposeName(t);
                        if (t) setError('');
                    }}
                    placeholder="Enter Purpose Name"
                    placeholderTextColor="#999"
                    style={{
                        borderWidth: 1,
                        borderColor: error ? 'red' : '#ddd',
                        borderRadius: 10,
                        height: 48,
                        paddingHorizontal: 12,
                        backgroundColor: '#fff',
                        marginTop: 5,
                        color: '#000',
                        fontFamily: Fonts.Regular
                    }}
                />

                {error ? (
                    <Text style={{
                        color: 'red',
                        fontSize: 11,
                        fontFamily: Fonts.Regular
                    }}>
                        {error}
                    </Text>
                ) : null}

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
                            {isEdit ? "Update Purpose" : "Add Purpose"}
                        </Text>
                    }
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default AddPurpose;
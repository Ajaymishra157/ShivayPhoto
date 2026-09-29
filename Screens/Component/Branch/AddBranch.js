import React, { useState } from 'react';
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
import { Colors, Fonts, API } from '../Commoncomponent/Constants';

const AddBranch = ({ navigation, route }) => {

    const branchData = route?.params?.branchData;
    const isEdit = !!branchData;

    const [branchName, setBranchName] = useState(isEdit ? branchData.branch_name : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validate = () => {
        if (!branchName.trim()) {
            setError("Please Enter Branch Name");
            return false;
        }
        setError('');
        return true;
    };

    const handleSave = async () => {

        if (!validate()) return;

        setLoading(true);

        try {
            const url = isEdit ? API.update_branch : API.add_branch;

            const body = isEdit
                ? { branch_id: Number(branchData.branch_id), branch_name: branchName.trim() }
                : { branch_name: branchName.trim() };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const json = await res.json();

            setLoading(false);

            if (json?.status) {
                Toast.show({
                    type: 'success',
                    text1: json?.message || (isEdit ? 'Branch Updated Successfully' : 'Branch Added Successfully'),
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000
                });

                setTimeout(() => navigation.goBack(), 500);
            } else {
                Toast.show({
                    type: 'error',
                    text1: json?.message || 'Something went wrong',
                    position: 'bottom',
                    bottomOffset: 60,
                    visibilityTime: 2000
                });
            }
        } catch (e) {
            setLoading(false);
            Toast.show({
                type: 'error',
                text1: 'Something went wrong',
                position: 'bottom',
                bottomOffset: 60,
                visibilityTime: 2000
            });
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
                    {isEdit ? "Update Branch" : "Add Branch"}
                </Text>

                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

                {/* BRANCH NAME */}
                <Text style={{
                    marginTop: 14,
                    fontSize: 13,
                    fontFamily: Fonts.Bold,
                    color: '#2c3e50'
                }}>
                    Branch Name<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>

                <TextInput
                    value={branchName}
                    onChangeText={(t) => {
                        setBranchName(t);
                        if (t) setError('');
                    }}
                    placeholder="Enter Branch Name"
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
                            {isEdit ? "Update Branch" : "Add Branch"}
                        </Text>
                    }
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default AddBranch;
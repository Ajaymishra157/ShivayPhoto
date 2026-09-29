import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Fonts } from '../Commoncomponent/Constants';

/* ── STATIC DATA (API baad me connect karna) ── */
const ASSIGN_TO_OPTIONS = [
    { label: 'Myself', value: 'Myself' },
    { label: 'Admin User', value: 'Admin User' },
    { label: 'Riya', value: 'Riya' },
    { label: 'Gopika', value: 'Gopika' },
    { label: 'Shahrukh Khan', value: 'Shahrukh Khan' },
];

const PRIORITY_OPTIONS = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
];

const fmtDisplay = (d) => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const Addtask = ({ navigation, route }) => {

    const taskData = route?.params?.taskdata;
    const isEdit = !!taskData;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignTo, setAssignTo] = useState('Myself');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    /* ── MODALS (react-native-element-dropdown ki jagah — double-tap overlay bug avoid karne ke liye) ── */
    const [assignToModal, setAssignToModal] = useState(false);
    const [priorityModal, setPriorityModal] = useState(false);

    useEffect(() => {
        if (isEdit && taskData) {
            setTitle(taskData.title || '');
            setDescription(taskData.description || '');
            setAssignTo(taskData.assigned_to || 'Myself');
            setPriority(taskData.priority || 'Medium');
            setDueDate(taskData.due_date ? new Date(taskData.due_date) : null);
        }
    }, []);

    const clearErr = (key) => setErrors(prev => ({ ...prev, [key]: '' }));

    const validate = () => {
        const err = {};
        if (!title.trim()) err.title = 'Please Enter Title';
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        // TODO: API ready hone par yaha fetch(API.add_task / API.update_task) call karna
        setTimeout(() => {
            setLoading(false);
            Toast.show({
                type: 'success',
                text1: isEdit ? 'Task Updated Successfully' : 'Task Added Successfully',
                position: 'bottom', bottomOffset: 60, visibilityTime: 2000,
            });
            setTimeout(() => navigation.goBack(), 500);
        }, 600);
    };

    /* ── Reusable select row (jaise dropdown dikhta tha) ── */
    const SelectField = ({ value, placeholder, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
                borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
                height: 50, paddingHorizontal: 12, backgroundColor: '#fff',
                marginTop: 5, flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <Text style={{ fontSize: 14, fontFamily: Fonts.Regular, color: value ? '#000' : '#999' }}>
                {value || placeholder}
            </Text>
            <Icon name="chevron-down" size={18} color="#94a3b8" />
        </TouchableOpacity>
    );

    /* ── Reusable select modal (only one renders/opens at a time — no overlay conflict) ── */
    const SelectModal = ({ visible, onClose, title, data, selected, onSelect }) => (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={{
                flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
                justifyContent: 'center', alignItems: 'center',
            }} activeOpacity={1} onPress={onClose}>
                <View style={{ backgroundColor: '#fff', borderRadius: 14, width: '80%', overflow: 'hidden' }}
                    onStartShouldSetResponder={() => true}>
                    <Text style={{
                        fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b',
                        textAlign: 'center', paddingVertical: 14,
                        borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
                    }}>
                        {title}
                    </Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        style={{ maxHeight: 360 }}
                        renderItem={({ item }) => {
                            const isSelected = item.value === selected;
                            return (
                                <TouchableOpacity
                                    onPress={() => { onSelect(item.value); onClose(); }}
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                        paddingHorizontal: 20, paddingVertical: 13,
                                        borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
                                        backgroundColor: isSelected ? '#f0fdf4' : '#fff',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontFamily: isSelected ? Fonts.Bold : Fonts.Regular,
                                        color: isSelected ? Colors.buttonbgcolor : '#1e293b',
                                    }}>
                                        {item.label}
                                    </Text>
                                    {isSelected && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

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
                    {isEdit ? 'Update Task' : 'Add Task'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                {/* TITLE */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Title<Text style={{ color: 'red', fontFamily: Fonts.Bold }}>*</Text>
                </Text>
                <TextInput
                    value={title}
                    onChangeText={(t) => { setTitle(t); if (t) clearErr('title'); }}
                    placeholder="Enter Title"
                    placeholderTextColor="#999"
                    style={{
                        borderWidth: 1, borderColor: errors.title ? 'red' : '#ddd',
                        borderRadius: 10, height: 48, paddingHorizontal: 12,
                        backgroundColor: '#fff', marginTop: 5, color: '#000',
                        fontFamily: Fonts.Regular,
                    }}
                />
                {errors.title ? <Text style={{ color: 'red', fontSize: 11, fontFamily: Fonts.Regular }}>{errors.title}</Text> : null}

                {/* DESCRIPTION */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Description
                </Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter Description"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    style={{
                        borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
                        height: 100, paddingHorizontal: 12, paddingTop: 10,
                        backgroundColor: '#fff', marginTop: 5, color: '#000',
                        fontFamily: Fonts.Regular, textAlignVertical: 'top',
                    }}
                />

                {/* ASSIGN TO */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Assign To
                </Text>
                <SelectField
                    value={assignTo}
                    placeholder="Select Assignee"
                    onPress={() => setAssignToModal(true)}
                />

                {/* PRIORITY */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Priority
                </Text>
                <SelectField
                    value={priority}
                    placeholder="Select Priority"
                    onPress={() => setPriorityModal(true)}
                />

                {/* DUE DATE */}
                <Text style={{ marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' }}>
                    Due Date
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
                    <Text style={{
                        fontSize: 14, fontFamily: Fonts.Regular,
                        color: dueDate ? '#000' : '#999',
                    }}>
                        {dueDate ? fmtDisplay(dueDate) : 'dd/mm/yyyy'}
                    </Text>
                    <Icon name="calendar" size={18} color="#94a3b8" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={dueDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selected) => {
                            setShowDatePicker(false);
                            if (selected) setDueDate(selected);
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
                            {isEdit ? 'Update Task' : 'Add Task'}
                        </Text>
                    }
                </TouchableOpacity>

            </ScrollView>

            <SelectModal
                visible={assignToModal}
                onClose={() => setAssignToModal(false)}
                title="Select Assignee"
                data={ASSIGN_TO_OPTIONS}
                selected={assignTo}
                onSelect={setAssignTo}
            />
            <SelectModal
                visible={priorityModal}
                onClose={() => setPriorityModal(false)}
                title="Select Priority"
                data={PRIORITY_OPTIONS}
                selected={priority}
                onSelect={setPriority}
            />

        </KeyboardAvoidingView>
    );
};

export default Addtask;
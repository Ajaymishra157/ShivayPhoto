import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList,
    StyleSheet,
    StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

/* ─────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────── */
const LEAD_STATUS_OPTIONS = [
    { label: 'Pending / Pre Enquiry', value: 'Pending' },
    { label: 'Unresponsive', value: 'Unresponsive' },
    { label: 'Follow-up', value: 'Follow-up' },
    { label: 'Quotation Sent / Meeting Lined Up', value: 'Quotation Sent' },
    { label: 'Converted to Client', value: 'Converted to Client' },
    { label: 'End', value: 'End' },
];

const LEAD_TYPE_OPTIONS = [
    { label: 'Cold', value: 'Cold' },
    { label: 'Warm', value: 'Warm' },
    { label: 'Hot', value: 'Hot' },
];

/* ─────────────────────────────────────────────
   SMALL REUSABLE MODAL (generic list picker)
───────────────────────────────────────────── */
const PickerModal = ({
    visible, onClose, title, data, selected, onSelect,
    keyField, labelField, searchEnabled = true,
    footerLabel, onFooterPress,
}) => {
    const [q, setQ] = useState('');
    const filtered = searchEnabled
        ? data.filter(d => (d[labelField] || '').toLowerCase().includes(q.toLowerCase()))
        : data;

    useEffect(() => { if (!visible) setQ(''); }, [visible]);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>{title}</Text>

                    {searchEnabled && (
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
                    )}

                    <FlatList
                        data={filtered}
                        keyExtractor={item => String(item[keyField])}
                        style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => {
                            const isSelected = selected === item[keyField];
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
                                <Text style={{ fontSize: 13, color: '#94a3b8', fontFamily: Fonts.Regular }}>No results found</Text>
                            </View>
                        }
                    />

                    {footerLabel && (
                        <TouchableOpacity onPress={onFooterPress} style={styles.modalFooterBtn}>
                            <Icon name="plus-circle-outline" size={18} color={Colors.buttonbgcolor} />
                            <Text style={styles.modalFooterText}>{footerLabel}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

/* ─────────────────────────────────────────────
   ADD INLINE MODAL (Source / Purpose)
───────────────────────────────────────────── */
const AddInlineModal = ({ visible, onClose, title, onAdd, loading }) => {
    const [name, setName] = useState('');
    const [err, setErr] = useState('');

    const handleAdd = () => {
        if (!name.trim()) { setErr(`Please enter ${title} name`); return; }
        onAdd(name.trim(), () => { setName(''); setErr(''); });
    };

    useEffect(() => { if (!visible) { setName(''); setErr(''); } }, [visible]);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.modalCard, { paddingHorizontal: 16, paddingBottom: 20 }]}
                    onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>Add {title}</Text>

                    <Text style={styles.fieldLabel}>{title} Name <Text style={{ color: 'red' }}>*</Text></Text>
                    <TextInput
                        value={name}
                        onChangeText={t => { setName(t); if (t) setErr(''); }}
                        placeholder={`Enter ${title} Name`}
                        placeholderTextColor="#999"
                        style={[styles.input, err ? styles.inputError : null]}
                    />
                    {!!err && <Text style={styles.errText}>{err}</Text>}

                    <TouchableOpacity
                        onPress={handleAdd}
                        disabled={loading}
                        style={[styles.saveBtn, { marginTop: 16 }]}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.saveBtnText}>Add {title}</Text>
                        }
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

/* ─────────────────────────────────────────────
   FIELD WRAPPER
───────────────────────────────────────────── */
const Field = ({ label, required, children, error }) => (
    <View style={{ marginTop: 14 }}>
        <Text style={styles.fieldLabel}>
            {label}{required && <Text style={{ color: 'red' }}> *</Text>}
        </Text>
        {children}
        {!!error && <Text style={styles.errText}>{error}</Text>}
    </View>
);

/* ─────────────────────────────────────────────
   DROPDOWN TRIGGER BUTTON
───────────────────────────────────────────── */
const DropdownBtn = ({ label, value, onPress, disabled, error }) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
            styles.dropdown,
            disabled && { opacity: 0.5 },
            error && { borderColor: 'red' } // ✅ yahi magic hai
        ]}
    >
        <Text style={[styles.dropdownText, !value && { color: '#999' }]} numberOfLines={1}>
            {value || label}
        </Text>
        <Icon name="chevron-down" size={20} color="#94a3b8" />
    </TouchableOpacity>
);



/* ─────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────── */
const AddLeads = ({ navigation, route }) => {
    const editLead = route?.params?.lead || null;
    const isEdit = route?.params?.isEdit || false;

    // Form fields
    const [name, setName] = useState(editLead?.name || '');
    const [email, setEmail] = useState(editLead?.email || '');
    const [mobile, setMobile] = useState(editLead?.mobile || '')
    const [address, setAddress] = useState(editLead?.address || '');
    const [destination, setDestination] = useState(editLead?.destination || '');
    const [remark, setRemark] = useState(editLead?.remark || '');

    // Source
    const [sources, setSources] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null); // { source_id, source_name }
    const [sourceModal, setSourceModal] = useState(false);
    const [addSourceModal, setAddSourceModal] = useState(false);
    const [addSourceLoading, setAddSourceLoading] = useState(false);

    // Purpose
    const [purposes, setPurposes] = useState([]);
    const [selectedPurpose, setSelectedPurpose] = useState(null);
    const [purposeModal, setPurposeModal] = useState(false);
    const [addPurposeModal, setAddPurposeModal] = useState(false);
    const [addPurposeLoading, setAddPurposeLoading] = useState(false);

    // State / City
    const [stateList, setStateList] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [stateModal, setStateModal] = useState(false);

    const [cityList, setCityList] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [cityModal, setCityModal] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);

    // Lead Status / Type
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [statusModal, setStatusModal] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [typeModal, setTypeModal] = useState(false);

    // Date pickers
    const [eventDate, setEventDate] = useState(null);
    const [eventDate2, setEventDate2] = useState(null);
    const [showPicker1, setShowPicker1] = useState(false);
    const [showPicker2, setShowPicker2] = useState(false);

    // Errors
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    /* ── Fetch on mount ── */
    useEffect(() => {
        fetchSources();
        fetchPurposes();
        fetchStates();
    }, []);

    useEffect(() => {
        if (isEdit && editLead) {

            setName(editLead.name || '');
            setEmail(editLead.email || '');
            setMobile(editLead.mobile || '');
            setAddress(editLead.address || '');
            setDestination(editLead.destination || '');
            setRemark(editLead.remark || '');

            // Source
            if (editLead.source) {
                setSelectedSource({ source_name: editLead.source });
            }

            // Purpose
            if (editLead.purpose) {
                setSelectedPurpose({ purpose_name: editLead.purpose });
            }

            // State FIX
            if (editLead.state && editLead.state_name) {
                setSelectedState({
                    state_id: editLead.state,
                    state_name: editLead.state_name
                });
            }

            // City FIX
            if (editLead.city && editLead.city_name) {
                setSelectedCity({
                    city_id: editLead.city,
                    city_name: editLead.city_name
                });
            }

            // Status
            if (editLead.status) {
                const st = LEAD_STATUS_OPTIONS.find(s => s.value === editLead.status);
                if (st) setSelectedStatus(st);
            }

            // Lead Type
            if (editLead.lead_type) {
                const lt = LEAD_TYPE_OPTIONS.find(l => l.value === editLead.lead_type);
                if (lt) setSelectedType(lt);
            }

            // Dates
            if (editLead.event_date) {
                setEventDate(new Date(editLead.event_date));
            }

            if (editLead.event_date2) {
                setEventDate2(new Date(editLead.event_date2));
            }
        }
    }, [editLead]);

    useEffect(() => {
        if (isEdit && editLead && sources.length > 0) {
            const src = sources.find(s => s.source_name === editLead.source);
            if (src) setSelectedSource(src);
        }
    }, [sources]);

    useEffect(() => {
        if (isEdit && editLead && purposes.length > 0) {
            const pur = purposes.find(p => p.purpose_name === editLead.purpose);
            if (pur) setSelectedPurpose(pur);
        }
    }, [purposes]);
    useEffect(() => {
        if (isEdit && editLead && cityList.length > 0) {
            const city = cityList.find(c => c.city_id == editLead.city);
            if (city) setSelectedCity(city);
        }
    }, [cityList]);
    useEffect(() => {
        if (isEdit && editLead && stateList.length > 0) {
            const st = stateList.find(s => s.state_id == editLead.state);
            if (st) setSelectedState(st);
        }
    }, [stateList]);

    /* ── Fetch cities when state changes ── */
    useEffect(() => {
        if (selectedState) {
            fetchCities(selectedState.state_id);
        } else {
            setCityList([]);
            if (!isEdit) { // 👈 IMPORTANT
                setSelectedCity(null);
            }
        }
    }, [selectedState]);

    const fetchSources = async () => {
        try {
            const res = await fetch(API.active_source_list);
            const json = await res.json();
            if (json.code == 200) setSources(json.payload || []);
        } catch (_) { }
    };

    const fetchPurposes = async () => {
        try {
            const res = await fetch(API.active_purpose_list);
            const json = await res.json();
            if (json.code == 200) setPurposes(json.payload || []);
        } catch (_) { }
    };

    const fetchStates = async () => {
        try {
            const res = await fetch(API.state_list);
            const json = await res.json();
            if (json.code == 200) setStateList(json.payload || []);
        } catch (_) { }
    };

    const fetchCities = async (stateId) => {
        if (!stateId) return;
        setCityLoading(true);
        try {
            const res = await fetch(API.city_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state_id: stateId }),
            });
            const json = await res.json();
            if (json.code === 200) {
                setCityList(json.payload || []);
            } else {
                setCityList([]);
            }
        } catch (error) {
            console.error('Fetch cities error:', error);
            setCityList([]);
        } finally {
            setCityLoading(false);
        }
    };

    /* ── Add Source inline ── */
    const handleAddSource = async (sourceName, reset) => {
        setAddSourceLoading(true);

        try {
            const res = await fetch(API.add_source, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_name: sourceName }),
            });
            const json = await res.json();
            if (json.code == 200) {
                await fetchSources();
                reset();
                setAddSourceModal(false);
                Toast.show({ type: 'success', text1: 'Source Added', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
            } else {
                Toast.show({ type: 'error', text1: json.message || 'Failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setAddSourceLoading(false); }
    };

    /* ── Add Purpose inline ── */
    const handleAddPurpose = async (purposeName, reset) => {
        setAddPurposeLoading(true);
        try {
            const res = await fetch(API.add_purpose, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ purpose_name: purposeName }),
            });
            const json = await res.json();
            if (json.code == 200) {
                await fetchPurposes();
                reset();
                setAddPurposeModal(false);
                Toast.show({ type: 'success', text1: 'Purpose Added', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
            } else {
                Toast.show({ type: 'error', text1: json.message || 'Failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setAddPurposeLoading(false); }
    };

    /* ── Format date ── */
    const formatDate = (d) => {
        if (!d) return null;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
    };

    const displayDate = (d) => {
        if (!d) return null;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    };

    /* ── Validate ── */
    const validate = () => {
        const e = {};

        // Mobile validation
        const mobileTrimmed = mobile.trim();
        if (!mobileTrimmed) {
            e.mobile = 'Please enter contact number';
        } else if (!/^\d{10}$/.test(mobileTrimmed)) {
            e.mobile = 'Mobile number must be 10 digits';
        }

        // City validation
        if (!selectedCity) e.city = 'Please select city';

        // Purpose / Status
        if (!selectedPurpose) e.purpose = 'Please select purpose';
        if (!selectedStatus) e.status = 'Please enter lead status';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ── Submit ── */
    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const url = isEdit ? API.update_lead : API.add_lead;

            const body = {
                enquiry_id: editLead?.enquiry_id, // 👈 VERY IMPORTANT
                name: name.trim(),
                mobile: mobile.trim(),
                email: email.trim(),
                source: selectedSource?.source_name || '',
                purpose: selectedPurpose?.purpose_name || '',
                city: selectedCity?.city_id ? String(selectedCity.city_id) : '',
                state: selectedState?.state_id ? String(selectedState.state_id) : '',
                address: address.trim(),
                destination: destination.trim(),
                function_date: formatDate(eventDate) || '',
                function_datetwo: formatDate(eventDate2) || '',
                remark: remark.trim(),
                lead_type: selectedType?.value || '',
                status: selectedStatus?.value || '',
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();

            if (result.code == 200) {
                Toast.show({ type: 'success', text1: isEdit ? 'Lead Updated Successfully' : 'Lead Added Successfully', position: 'bottom', bottomOffset: 60, visibilityTime: 2000 });
                setTimeout(() => navigation.goBack(), 500);
            } else {
                Toast.show({ type: 'error', text1: result.message || 'Something went wrong', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setSaving(false); }
    };

    /* ─────────────────────────────────────────────
       RENDER
    ───────────────────────────────────────────── */
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f5f6f8' }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Update Lead' : 'Add Lead'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                {/* ROW: Name */}
                <Field label="Name">
                    <TextInput value={name} onChangeText={setName} placeholder="Enter Your Name"
                        placeholderTextColor="#999" style={styles.input} />
                </Field>

                {/* ROW: Email */}
                <Field label="Email">
                    <TextInput value={email} onChangeText={setEmail} placeholder="Enter Your Email"
                        placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                </Field>

                {/* ROW: Contact Number */}
                <Field label="Contact Number" required error={errors.mobile}>
                    <TextInput
                        value={mobile}
                        onChangeText={t => { setMobile(t); if (t) setErrors(p => ({ ...p, mobile: '' })); }}
                        placeholder="Enter Contact Number"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        maxLength={15}
                        style={[styles.input, errors.mobile ? styles.inputError : null]}
                    />
                </Field>

                {/* SOURCE */}
                <Field label="Source">
                    <DropdownBtn
                        label="Select Source"
                        value={selectedSource?.source_name}
                        onPress={() => setSourceModal(true)}
                    />
                </Field>

                {/* PURPOSE */}
                <Field label="Purpose" required error={errors.purpose}>
                    <DropdownBtn
                        label="Select Purpose"
                        value={selectedPurpose?.purpose_name}
                        onPress={() => setPurposeModal(true)}
                        error={errors.purpose} // ✅ IMPORTANT
                    />
                </Field>

                {/* STATE */}
                <Field label="State">
                    <DropdownBtn
                        label="Select State"
                        value={selectedState?.state_name}
                        onPress={() => setStateModal(true)}
                    />
                </Field>

                {/* CITY */}
                <Field label="City" required error={errors.city}>
                    <DropdownBtn
                        label={cityLoading ? "Loading cities..." : "Select City"}
                        value={selectedCity?.city_name}
                        onPress={() => { if (selectedState) setCityModal(true); }}
                        disabled={!selectedState || cityLoading}
                        error={errors.city} // ✅ ADD THIS
                    />
                </Field>

                {/* ADDRESS */}
                <Field label="Address">
                    <TextInput value={address} onChangeText={setAddress} placeholder="Enter Address"
                        placeholderTextColor="#999" style={styles.input} />
                </Field>

                {/* DESTINATION */}
                <Field label="Destination">
                    <TextInput value={destination} onChangeText={setDestination} placeholder="Enter Destination"
                        placeholderTextColor="#999" style={styles.input} />
                </Field>

                {/* EVENT DATE */}
                <Field label="Event Date">
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker1(true)}>
                        <Text style={[styles.dropdownText, !eventDate && { color: '#999' }]}>
                            {eventDate ? displayDate(eventDate) : 'dd-mm-yyyy'}
                        </Text>
                        <Icon name="calendar-outline" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                    {showPicker1 && (
                        <DateTimePicker
                            value={eventDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={(e, d) => { setShowPicker1(false); if (d) setEventDate(d); }}
                        />
                    )}
                </Field>

                {/* EVENT DATE 2 */}
                <Field label="Event Date 2">
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker2(true)}>
                        <Text style={[styles.dropdownText, !eventDate2 && { color: '#999' }]}>
                            {eventDate2 ? displayDate(eventDate2) : 'dd-mm-yyyy'}
                        </Text>
                        <Icon name="calendar-outline" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                    {showPicker2 && (
                        <DateTimePicker
                            value={eventDate2 || new Date()}
                            mode="date"
                            display="default"
                            onChange={(e, d) => { setShowPicker2(false); if (d) setEventDate2(d); }}
                        />
                    )}
                </Field>

                {/* LEAD STATUS */}
                <Field label="Lead Status" required error={errors.status}>
                    <DropdownBtn
                        label="Select Lead Status"
                        value={selectedStatus?.label}
                        onPress={() => setStatusModal(true)}
                        error={errors.status} // ✅ IMPORTANT
                    />
                </Field>

                {/* LEAD TYPE */}
                <Field label="Lead Type">
                    <DropdownBtn
                        label="Select Lead Type"
                        value={selectedType?.label}
                        onPress={() => setTypeModal(true)}
                    />
                </Field>

                {/* REMARK */}
                <Field label="Remark">
                    <TextInput value={remark} onChangeText={setRemark} placeholder="Enter Remark"
                        placeholderTextColor="#999" style={styles.input} />
                </Field>

                {/* SAVE BUTTON */}
                <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { marginTop: 30 }]}>
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.saveBtnText}>{isEdit ? 'Update Lead' : 'Add Lead'}</Text>
                    }
                </TouchableOpacity>

            </ScrollView>

            {/* ─── MODALS ─── */}

            {/* Source Picker */}
            <PickerModal
                visible={sourceModal}
                onClose={() => setSourceModal(false)}
                title="Select Source"
                data={sources}
                selected={selectedSource?.source_id}
                onSelect={item => setSelectedSource(item)}
                keyField="source_id"
                labelField="source_name"
                footerLabel="Add Source"
                onFooterPress={() => {
                    //  setSourceModal(false); 
                    setTimeout(() => setAddSourceModal(true), 300);
                }}
            />

            {/* Purpose Picker */}
            <PickerModal
                visible={purposeModal}
                onClose={() => setPurposeModal(false)}
                title="Select Purpose"
                data={purposes}
                selected={selectedPurpose?.purpose_id}
                onSelect={item => {
                    setSelectedPurpose(item);
                    setErrors(p => ({ ...p, purpose: '' })); // ✅ remove red border
                }}
                keyField="purpose_id"
                labelField="purpose_name"
                footerLabel="Add Purpose"
                onFooterPress={() => {
                    //  setPurposeModal(false);
                    setTimeout(() => setAddPurposeModal(true), 300);
                }}
            />

            {/* State Picker */}
            <PickerModal
                visible={stateModal}
                onClose={() => setStateModal(false)}
                title="Select State"
                data={stateList}
                selected={selectedState?.state_id}
                onSelect={item => { setSelectedState(item); setSelectedCity(null); }}
                keyField="state_id"
                labelField="state_name"
            />

            {/* City Picker */}
            <PickerModal
                visible={cityModal}
                onClose={() => setCityModal(false)}
                title="Select City"
                data={cityList}
                selected={selectedCity?.city_id}
                onSelect={item => { setSelectedCity(item); setErrors(p => ({ ...p, city: '' })); }}
                keyField="city_id"
                labelField="city_name"
            />

            {/* Lead Status */}
            <PickerModal
                visible={statusModal}
                onClose={() => setStatusModal(false)}
                title="Select Lead Status"
                data={LEAD_STATUS_OPTIONS}
                selected={selectedStatus?.value}
                onSelect={item => {
                    setSelectedStatus(item);
                    setErrors(p => ({ ...p, status: '' })); // ✅ remove red border
                }}
                keyField="value"
                labelField="label"
                searchEnabled={false}
            />

            {/* Lead Type */}
            <PickerModal
                visible={typeModal}
                onClose={() => setTypeModal(false)}
                title="Select Lead Type"
                data={LEAD_TYPE_OPTIONS}
                selected={selectedType?.value}
                onSelect={item => setSelectedType(item)}
                keyField="value"
                labelField="label"
                searchEnabled={false}
            />

            {/* Add Source */}
            <AddInlineModal
                visible={addSourceModal}
                onClose={() => setAddSourceModal(false)}
                title="Source"
                onAdd={handleAddSource}
                loading={addSourceLoading}
            />

            {/* Add Purpose */}
            <AddInlineModal
                visible={addPurposeModal}
                onClose={() => setAddPurposeModal(false)}
                title="Purpose"
                onAdd={handleAddPurpose}
                loading={addPurposeLoading}
            />

        </KeyboardAvoidingView>
    );
};

export default AddLeads;

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
    dateBtn: {
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
    modalTitle: {
        fontSize: 15,
        fontFamily: Fonts.Bold,
        color: '#1e293b',
        textAlign: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
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
    modalFooterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        gap: 8,
    },
    modalFooterText: {
        fontSize: 14,
        fontFamily: Fonts.Bold,
        color: Colors.buttonbgcolor,
    },
});
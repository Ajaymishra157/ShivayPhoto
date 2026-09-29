import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList,
    StyleSheet,
    StatusBar,
    BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';




const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];



const toApiDate = (d) => {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtDisplay = (d) => {
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const AddBooking = ({ navigation, route }) => {

    const clientData = route?.params?.clientdata;
    console.log('Client Data:', clientData);   // ⬅ NEW
    const isEdit = !!clientData;

    /* ── FIELDS ── */
    const [clientName, setClientName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [shootDate, setShootDate] = useState(null);
    const [isTentative, setIsTentative] = useState(false);
    const [shootMonth, setShootMonth] = useState('');
    const [purpose, setPurpose] = useState('');
    const [remark, setRemark] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [addedBy, setAddedBy] = useState('');
    const [purposeSearch, setPurposeSearch] = useState('');
    const [filteredPurposes, setFilteredPurposes] = useState([]);

    const [bookingAmount, setBookingAmount] = useState('');
    const [receiveAmount, setReceiveAmount] = useState('');



    const [coordinator, setCoordinator] = useState('');
    const [coordinators, setCoordinators] = useState([]);
    const [coordinatorLoading, setCoordinatorLoading] = useState(false);
    const [coordinatorModal, setCoordinatorModal] = useState(false);
    const [coordinatorSearch, setCoordinatorSearch] = useState('');
    const [filteredCoordinators, setFilteredCoordinators] = useState([]);   // ⬅ COORDINATORS ki jagah []


    const [packages, setPackages] = useState([]);
    const [packagesLoading, setPackagesLoading] = useState(false);
    const [packageModal, setPackageModal] = useState(false);
    const [packageSearch, setPackageSearch] = useState('');

    // selected branch ke packages + search
    const packageOptions = packages.filter(p =>
        (!city || p.branch_name === city) &&
        (p.package_name || '').toLowerCase().includes(packageSearch.toLowerCase())
    );
    const [cityModal, setCityModal] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);   // 🔧 CITIES ki jagah []

    const [cities, setCities] = useState([]);              // 🆕 API se aayi list
    const [citiesLoading, setCitiesLoading] = useState(false);  // 🆕

    /* ── DATE PICKER ── */
    const [showDatePicker, setShowDatePicker] = useState(false);

    /* ── MONTH MODAL ── */
    const [monthModal, setMonthModal] = useState(false);

    /* ── PURPOSE ── */
    const [purposes, setPurposes] = useState([]);
    const [purposeLoading, setPurposeLoading] = useState(false);
    const [purposeModal, setPurposeModal] = useState(false);

    /* ── 409 CONFIRM MODAL ── */
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [attemptedMobile, setAttemptedMobile] = useState('');
    const [staticNumber, setStaticNumber] = useState('');

    /* ── OTP MODAL ── */
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const otpRefs = useRef([]);
    const selectedCoordinatorLabel = coordinators.find(c => c.value === coordinator)?.label || '';
    const dueAmount = (Number(bookingAmount) || 0) - (Number(receiveAmount) || 0);   // ⬅ NEW

    /* ── MOUNT ── */
    useEffect(() => {
        loadUser();
        fetchPurposes();
        fetchCoordinators();
        fetchBranches();
        fetchPackages();
        if (isEdit && clientData) {
            setClientName(clientData.client_name || '');
            setAddress(clientData.client_address || '');
            setCity(clientData.client_city || '');
            setMobile(clientData.client_mobile || '');
            setEmail(clientData.client_email || '');
            setPurpose(clientData.client_purpose || '');
            setRemark(clientData.client_remark || '');

            setPurpose(clientData.client_purpose || '');
            setRemark(clientData.client_remark || '');
            setBookingAmount(clientData.booking_amount ? String(clientData.booking_amount) : '');
            setReceiveAmount(
                (clientData.receive_amount ?? clientData.paid_amount)
                    ? String(clientData.receive_amount ?? clientData.paid_amount)
                    : ''
            );   // ⬅ NEW
            setCoordinator(clientData.coordinator_id || '');


            const bookingVal = clientData.booking || clientData.shoot_month || clientData.booking_date || '';
            const isMonthName = MONTHS.includes(bookingVal);

            if (isMonthName) {
                // Tentative — month name aaya hai (e.g. "September")
                setIsTentative(true);
                setShootMonth(bookingVal);
                setShootDate(null);
            } else if (bookingVal) {
                // Actual date aaya hai
                const parsed = new Date(bookingVal);
                if (!isNaN(parsed)) {
                    setIsTentative(false);
                    setShootDate(parsed);
                    setShootMonth('');
                } else {
                    // safety fallback
                    setIsTentative(false);
                    setShootDate(null);
                }
            }

        }
    }, []);

    useEffect(() => {
        if (!purposeSearch.trim()) {
            setFilteredPurposes(purposes);
        } else {
            const filtered = purposes.filter(p =>
                p.label.toLowerCase().includes(purposeSearch.toLowerCase())
            );
            setFilteredPurposes(filtered);
        }
    }, [purposeSearch, purposes]);

    useEffect(() => {
        if (!coordinatorSearch.trim()) {
            setFilteredCoordinators(coordinators);
        } else {
            const filtered = coordinators.filter(c =>
                c.label.toLowerCase().includes(coordinatorSearch.toLowerCase())
            );
            setFilteredCoordinators(filtered);
        }
    }, [coordinatorSearch, coordinators]);

    useEffect(() => {
        if (!citySearch.trim()) {
            setFilteredCities(cities);   // 🔧 CITIES → cities
        } else {
            const filtered = cities.filter(c =>   // 🔧 CITIES → cities
                c.label.toLowerCase().includes(citySearch.toLowerCase())
            );
            setFilteredCities(filtered);
        }
    }, [citySearch, cities]);   // 🔧 dependency mein cities add


    /* ── ANDROID BACK BUTTON : CLOSE MODALS FIRST ── */
    // useEffect(() => {
    //     const backAction = () => {

    //         // OTP Modal
    //         if (showOtpModal) {
    //             setShowOtpModal(false);
    //             setOtpError('');
    //             return true;
    //         }

    //         // 409 Confirmation Modal
    //         if (showConfirmModal) {
    //             setShowConfirmModal(false);
    //             return true;
    //         }

    //         // Coordinator Modal
    //         if (coordinatorModal) {
    //             setCoordinatorModal(false);
    //             setCoordinatorSearch('');
    //             return true;
    //         }

    //         // City Modal
    //         if (cityModal) {
    //             setCityModal(false);
    //             setCitySearch('');
    //             return true;
    //         }

    //         // Purpose Modal
    //         if (purposeModal) {
    //             setPurposeModal(false);
    //             setPurposeSearch('');
    //             return true;
    //         }

    //         // Month Modal
    //         if (monthModal) {
    //             setMonthModal(false);
    //             return true;
    //         }

    //         // Date Picker
    //         if (showDatePicker) {
    //             setShowDatePicker(false);
    //             return true;
    //         }

    //         // Koi modal open nahi hai
    //         return false;
    //     };

    //     const backHandler = BackHandler.addEventListener(
    //         'hardwareBackPress',
    //         backAction
    //     );

    //     return () => backHandler.remove();
    // }, [
    //     showOtpModal,
    //     showConfirmModal,
    //     coordinatorModal,
    //     cityModal,
    //     purposeModal,
    //     monthModal,
    //     showDatePicker,
    // ]);

    const fetchCoordinators = async () => {
        setCoordinatorLoading(true);
        try {
            const res = await fetch(API.list_user_typewise, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'coordinator' }),
            });
            const json = await res.json();
            if (json.code == 200) {
                setCoordinators((json.payload || []).map(u => ({
                    label: u.user_name,
                    value: u.id,
                })));
            }
        } catch (_) { }
        finally { setCoordinatorLoading(false); }
    };

    const fetchBranches = async () => {
        setCitiesLoading(true);
        try {
            const res = await fetch(API.list_branch, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();

            if (json?.status && Array.isArray(json.payload)) {
                setCities(
                    json.payload.map(b => ({
                        label: b.branch_name,
                        value: b.branch_name,   // 🔧 city field mein naam hi store ho raha hai, isliye value bhi naam
                    }))
                );
            } else {
                setCities([]);
            }
        } catch (e) {
            console.log('Branch fetch error:', e);
            setCities([]);
        } finally {
            setCitiesLoading(false);
        }
    };

    const fetchPackages = async () => {
        setPackagesLoading(true);
        try {
            const res = await fetch(API.list_package, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branch_id: '' }),   // khali = puri list
            });
            const json = await res.json();
            setPackages(json?.status && Array.isArray(json.payload) ? json.payload : []);
        } catch (e) {
            setPackages([]);
        } finally {
            setPackagesLoading(false);
        }
    };

    const loadUser = async () => {
        try {
            const id = await AsyncStorage.getItem('id');
            if (id) setAddedBy(id);
        } catch (_) { }
    };

    const fetchPurposes = async () => {
        setPurposeLoading(true);
        try {
            const res = await fetch(API.list_purpose);
            const json = await res.json();
            if (json.code == 200) {
                setPurposes((json.payload || []).map(p => ({
                    label: p.purpose_name,
                    value: p.purpose_name,
                })));
            }
        } catch (_) { }
        finally { setPurposeLoading(false); }
    };

    /* ── VALIDATE ── */
    const validate = () => {
        const err = {};
        if (!clientName.trim()) err.clientName = 'Please Enter Client Name.';
        if (!city) err.city = 'Please Select Branch.';
        if (!mobile.trim()) err.mobile = 'Please Enter Valid Mobile No.';
        else if (mobile.length !== 10) err.mobile = 'Please Enter Valid Mobile No.';
        if (!isTentative && !shootDate) err.shootDate = 'Please enter Shoot Date.';
        if (isTentative && !shootMonth) err.shootDate = 'Please enter Shoot Date.';
        if (!purpose) err.purpose = 'Please select purpose.';
        if (!remark.trim()) err.remark = 'Please Enter Package.';   // ⬅ NEW
        if (!coordinator) err.coordinator = 'Please select coordinator.';

        if (!bookingAmount.trim()) err.bookingAmount = 'Please Enter Booking Amount.';

        // 👇 NAYA — Receive Amount, Booking Amount se zyada nahi ho sakta
        if (Number(receiveAmount) > Number(bookingAmount)) {
            err.receiveAmount = 'Receive Amount cannot be more than Booking Amount.';
        }


        setErrors(err);
        return Object.keys(err).length === 0;
    };

    /* ── booking body helper ── */
    const buildBookingBody = () => ({
        ...(isEdit && { client_id: String(clientData.client_id) }),
        client_name: clientName,
        client_address: address,
        client_city: city,
        client_mobile: mobile,
        client_email: email,
        client_purpose: purpose,
        client_remark: remark,

        booking_amount: bookingAmount,
        receive_amount: receiveAmount,
        coordinator_id: coordinator,

        added_by: addedBy,
        booking_status: isTentative ? 'Check' : 'Uncheck',
        booking_date: isTentative ? '' : toApiDate(shootDate),
        shoot_month: isTentative ? shootMonth : '',
    });

    console.log('Booking Payload:', JSON.stringify(buildBookingBody(), null, 2));   // ⬅ NEW

    /* ── SAVE ── */
    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const url = isEdit ? API.update_booking : API.add_booking;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildBookingBody()),
            });
            const result = await res.json();
            console.log('Booking Payload:', JSON.stringify(buildBookingBody(), null, 2));   // ⬅ NEW

            if (result.code == 200) {
                Toast.show({
                    type: 'success',
                    text1: isEdit ? 'Booking Updated Successfully' : 'Booking Added Successfully',
                    position: 'bottom', bottomOffset: 60, visibilityTime: 2000,
                });
                setTimeout(() => navigation.goBack(), 500);

            } else if (result.code == 409) {
                // 4 bookings already exist — show confirmation modal
                setAttemptedMobile(result.attempted_mobile || '');
                setStaticNumber(result.static_number || '');
                setShowConfirmModal(true);

            } else {
                Toast.show({ type: 'error', text1: result.message || 'Failed', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setLoading(false); }
    };

    /* ── SEND OTP (called when user presses YES in confirm modal) ── */
    const handleSendOtp = async () => {
        setShowConfirmModal(false);
        setOtpLoading(true);
        try {
            const res = await fetch(API.sent_otp, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile_no_sent: staticNumber,
                    mobile_no: attemptedMobile,
                }),
            });
            const result = await res.json();
            console.log('OTP Result:', result);
            if (result.code == 200) {
                setOtp(['', '', '', '', '', '']);
                setShowOtpModal(true);
                setTimeout(() => otpRefs.current[0]?.focus(), 300);
            } else {
                Toast.show({ type: 'error', text1: result.message || 'Failed to send OTP', position: 'bottom', bottomOffset: 60 });
            }
        } catch (_) {
            Toast.show({ type: 'error', text1: 'Network Error', position: 'bottom', bottomOffset: 60 });
        } finally { setOtpLoading(false); }
    };

    /* ── VERIFY OTP ── */
    const handleVerifyOtp = async () => {
        const otpStr = otp.join('');
        if (otpStr.length < 6) {
            setOtpError('Please enter a valid code.');
            return;
        }
        setOtpLoading(true);
        try {
            const body = {
                otp: otpStr,
                ...buildBookingBody(),
            };
            const res = await fetch(API.verify_otp || 'booking/verify_otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (result.code == 200) {
                setOtpError('');
                setShowOtpModal(false);
                Toast.show({
                    type: 'success',
                    text1: 'Booking Added Successfully',
                    position: 'bottom', bottomOffset: 60, visibilityTime: 2000,
                });
                setTimeout(() => navigation.goBack(), 500);
            } else {
                setOtpError(result.message || 'Please enter a valid code.');
            }
        } catch (_) {
            setOtpError('Network error. Please try again.');
        } finally { setOtpLoading(false); }
    };

    /* ── OTP input handler ── */
    const handleOtpChange = (text, index) => {
        const val = text.replace(/[^0-9]/g, '');
        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);
        if (otpError) setOtpError(''); // clear error on any input
        if (val && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const clearErr = (key) => setErrors(prev => ({ ...prev, [key]: '' }));

    /* ── RENDER ── */
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f5f6f8' }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />
            {/* HEADER */}
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={st.headerTitle}>{isEdit ? 'Update Booking' : 'Add Booking'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

                {/* CLIENT NAME */}
                <Text style={st.label}>Client Name<Text style={st.req}>*</Text></Text>
                <TextInput
                    value={clientName}
                    onChangeText={t => { setClientName(t); if (t) clearErr('clientName'); }}
                    placeholder="Enter Client Name"
                    placeholderTextColor="#999"
                    style={[st.input, errors.clientName && st.inputErr]}
                />
                {errors.clientName ? <Text style={st.errTxt}>{errors.clientName}</Text> : null}

                {/* ADDRESS */}
                <Text style={st.label}>Address</Text>
                <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter Address"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    style={[st.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                />

                {/* CITY */}
                <Text style={st.label}>Branch<Text style={st.req}>*</Text></Text>
                <TouchableOpacity
                    style={[st.input, st.dateBtn, errors.city && st.inputErr]}
                    onPress={() => {
                        setCityModal(true);
                        setCitySearch('');
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[st.dateTxt, !city && { color: '#999' }]}>
                        {city || 'Select Branch'}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                </TouchableOpacity>
                {errors.city ? <Text style={st.errTxt}>{errors.city}</Text> : null}

                {/* MOBILE */}
                <Text style={st.label}>Mobile No<Text style={st.req}>*</Text></Text>
                <TextInput
                    value={mobile}
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={t => {
                        const n = t.replace(/[^0-9]/g, '');
                        setMobile(n);
                        if (n.length === 10) clearErr('mobile');
                    }}
                    placeholder="Enter Mobile No"
                    placeholderTextColor="#999"
                    style={[st.input, errors.mobile && st.inputErr]}
                />
                {errors.mobile ? <Text style={st.errTxt}>{errors.mobile}</Text> : null}

                {/* EMAIL */}
                <Text style={st.label}>Email</Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    style={st.input}
                />

                {/* SHOOT DATE */}
                <Text style={st.label}>Shoot Date<Text style={st.req}>*</Text></Text>
                <View style={st.checkRow}>
                    <TouchableOpacity
                        style={[st.checkbox, isTentative && st.checkboxChecked]}
                        onPress={() => {
                            setIsTentative(prev => !prev);
                            setShootDate(null);
                            setShootMonth('');
                            clearErr('shootDate');
                        }}
                        activeOpacity={0.8}
                    >
                        {isTentative && <Icon name="check" size={13} color="#fff" />}
                    </TouchableOpacity>
                    <Text style={st.checkLabel}>Tentative Date</Text>
                </View>

                {!isTentative ? (
                    <TouchableOpacity
                        style={[st.input, st.dateBtn, errors.shootDate && st.inputErr]}
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={[st.dateTxt, !shootDate && { color: '#999' }]}>
                            {shootDate ? fmtDisplay(shootDate) : 'Select Shoot Date'}
                        </Text>
                        <Icon name="calendar" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[st.input, st.dateBtn, errors.shootDate && st.inputErr]}
                        onPress={() => setMonthModal(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={[st.dateTxt, !shootMonth && { color: '#999' }]}>
                            {shootMonth || 'Select Month'}
                        </Text>
                        <Icon name="chevron-down" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                )}
                {errors.shootDate ? <Text style={st.errTxt}>{errors.shootDate}</Text> : null}

                {showDatePicker && (
                    <DateTimePicker
                        value={shootDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selected) => {
                            setShowDatePicker(false);
                            if (selected) { setShootDate(selected); clearErr('shootDate'); }
                        }}
                    />
                )}

                {/* PURPOSE */}
                <Text style={st.label}>Purpose<Text style={st.req}>*</Text></Text>
                {/* {purposeLoading ? (
                    <View style={[st.input, { justifyContent: 'center', alignItems: 'center' }]}>
                        <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                    </View>
                ) : ( */}
                <TouchableOpacity
                    style={[st.input, st.dateBtn, errors.purpose && st.inputErr]}
                    onPress={() => {
                        setPurposeModal(true);
                        setPurposeSearch('');
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[st.dateTxt, !purpose && { color: '#999' }]}>
                        {purpose || 'Select Purpose'}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                </TouchableOpacity>
                {/* )} */}
                {errors.purpose ? <Text style={st.errTxt}>{errors.purpose}</Text> : null}

                {/* BOOKING AMOUNT */}
                <Text style={st.label}>Booking Amount<Text style={st.req}>*</Text></Text>
                <TextInput
                    value={bookingAmount}
                    onChangeText={t => {
                        setBookingAmount(t.replace(/[^0-9.]/g, ''));
                        if (errors.bookingAmount) clearErr('bookingAmount');
                    }}
                    placeholder="Enter Booking Amount"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    style={[st.input, errors.bookingAmount && st.inputErr]}
                />
                {errors.bookingAmount ? <Text style={st.errTxt}>{errors.bookingAmount}</Text> : null}


                {/* RECEIVE AMOUNT — NEW */}
                {/* RECEIVE AMOUNT — NEW */}
                <Text style={st.label}>Receive Amount</Text>
                <TextInput
                    value={receiveAmount}
                    onChangeText={t => {
                        const cleaned = t.replace(/[^0-9.]/g, '');
                        setReceiveAmount(cleaned);
                        if (errors.receiveAmount) clearErr('receiveAmount');
                    }}
                    placeholder="Enter Receive Amount"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    style={[st.input, errors.receiveAmount && st.inputErr]}
                />
                {errors.receiveAmount ? <Text style={st.errTxt}>{errors.receiveAmount}</Text> : null}
                {dueAmount > 0 ? (
                    <Text style={{ color: 'red', fontSize: 12, fontFamily: Fonts.Bold, marginTop: 4 }}>
                        Due: {dueAmount}
                    </Text>
                ) : null}

                {/* DUE AMOUNT — NEW, read-only, calculated */}
                {/* <Text style={st.label}>Due Amount</Text>
                <View style={[st.input, { justifyContent: 'center', backgroundColor: '#f1f5f9' }]}>
                    <Text style={st.dateTxt}>{dueAmount}</Text>
                </View> */}
                {/* ASSIGN COORDINATOR */}
                <Text style={st.label}>Assign Coordinator<Text style={st.req}>*</Text></Text>
                <TouchableOpacity
                    style={[st.input, st.dateBtn, errors.coordinator && st.inputErr]}
                    onPress={() => {
                        setCoordinatorModal(true);
                        setCoordinatorSearch('');
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[st.dateTxt, !coordinator && { color: '#999' }]}>
                        {selectedCoordinatorLabel || 'Select Coordinator'}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#94a3b8" />
                </TouchableOpacity>
                {errors.coordinator ? <Text style={st.errTxt}>{errors.coordinator}</Text> : null}

                {/* PACKAGE */}
                <Text style={st.label}>Package<Text style={st.req}>*</Text></Text>
                <View>
                    <TextInput
                        value={remark}
                        onChangeText={t => { setRemark(t); if (t.trim()) clearErr('remark'); }}
                        placeholder="Enter Package"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={5}
                        style={[
                            st.input,
                            { height: 120, textAlignVertical: 'top', paddingTop: 10, paddingRight: 44 },
                            errors.remark && st.inputErr
                        ]}
                    />
                    <TouchableOpacity
                        onPress={() => { setPackageSearch(''); setPackageModal(true); }}
                        style={{ position: 'absolute', top: 14, right: 10, padding: 4 }}
                    >
                        <Icon name="chevron-down" size={22} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
                {errors.remark ? <Text style={st.errTxt}>{errors.remark}</Text> : null}

                {/* SAVE BUTTON */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    style={st.saveBtn}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={st.saveBtnTxt}>{isEdit ? 'Update Booking' : 'Add Booking'}</Text>
                    }
                </TouchableOpacity>

            </ScrollView>

            {/* ── MONTH MODAL ── */}
            <Modal visible={monthModal} transparent animationType="fade">
                <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setMonthModal(false)}>
                    <View style={st.monthModal} onStartShouldSetResponder={() => true}>
                        <Text style={st.monthModalTitle}>Select Month</Text>
                        <TouchableOpacity style={st.modalCloseBtn} onPress={() => setMonthModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                        <FlatList
                            data={MONTHS}

                            keyExtractor={item => item}
                            style={{ maxHeight: 360 }}
                            keyboardShouldPersistTaps='handled'
                            renderItem={({ item }) => {
                                const sel = shootMonth === item;
                                return (
                                    <TouchableOpacity
                                        onPress={() => { setShootMonth(item); clearErr('shootDate'); setMonthModal(false); }}
                                        style={[st.monthItem, sel && st.monthItemSel]}
                                    >
                                        <Text style={[st.monthItemTxt, sel && st.monthItemTxtSel]}>{item}</Text>
                                        {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── PURPOSE MODAL ── */}
            <Modal visible={purposeModal} transparent animationType="fade">
                <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setPurposeModal(false)}>
                    <View style={st.monthModal} onStartShouldSetResponder={() => true}>
                        <Text style={st.monthModalTitle}>Select Purpose</Text>

                        <TouchableOpacity style={st.modalCloseBtn} onPress={() => setPurposeModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                        {/* 🔍 SEARCH SAME DESIGN */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            margin: 10,
                            paddingHorizontal: 12,
                            height: 40,
                            backgroundColor: '#f1f5f9',
                            borderRadius: 8,
                            gap: 8,
                        }}>
                            <Icon name="magnify" size={18} color="#94a3b8" />
                            <TextInput
                                value={purposeSearch}
                                onChangeText={setPurposeSearch}
                                placeholder="Search purpose..."
                                placeholderTextColor="#94a3b8"
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontFamily: Fonts.Regular,
                                    color: '#1e293b',
                                }}
                            />
                        </View>

                        <FlatList
                            // data={purposes}
                            data={filteredPurposes}
                            keyExtractor={(item, index) => index.toString()}
                            style={{ maxHeight: 360 }}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const sel = purpose === item.value;
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setPurpose(item.value); clearErr('purpose'); setPurposeModal(false);
                                            setPurposeSearch('');
                                        }}
                                        style={[st.monthItem, sel && st.monthItemSel]}
                                    >
                                        <Text style={[st.monthItemTxt, sel && st.monthItemTxtSel]}>{item.label}</Text>
                                        {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── 409 CONFIRM MODAL ── */}
            <Modal visible={showConfirmModal} transparent animationType="fade">
                <View style={st.modalOverlay}>
                    <View style={st.confirmModal}>

                        <TouchableOpacity style={st.modalCloseBtn} onPress={() => setShowConfirmModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                        {/* Icon */}
                        <View style={st.confirmIconWrap}>
                            <Icon name="alert-circle-outline" size={40} color={Colors.buttonbgcolor} />
                        </View>

                        <Text style={st.confirmTitle}>Booking Limit Reached</Text>
                        <Text style={st.confirmMsg}>
                            This city and date already has <Text style={st.confirmBold}>4 bookings</Text>.{'\n'}
                            Do you still want to proceed with the 5th booking?
                        </Text>

                        <View style={st.confirmBtnRow}>
                            <TouchableOpacity
                                style={[st.confirmBtn, st.confirmBtnNo]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={st.confirmBtnNoTxt}>No</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[st.confirmBtn, st.confirmBtnYes]}
                                onPress={handleSendOtp}
                                disabled={otpLoading}
                            >
                                {otpLoading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={st.confirmBtnYesTxt}>Yes, Proceed</Text>
                                }
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>

            {/* ── COORDINATOR MODAL ── */}
            <Modal visible={coordinatorModal} transparent animationType="fade">
                <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setCoordinatorModal(false)}>
                    <View style={st.monthModal} onStartShouldSetResponder={() => true}>
                        <Text style={st.monthModalTitle}>Select Coordinator</Text>

                        <TouchableOpacity style={st.modalCloseBtn} onPress={() => setCoordinatorModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            margin: 10,
                            paddingHorizontal: 12,
                            height: 40,
                            backgroundColor: '#f1f5f9',
                            borderRadius: 8,
                            gap: 8,
                        }}>
                            <Icon name="magnify" size={18} color="#94a3b8" />
                            <TextInput
                                value={coordinatorSearch}
                                onChangeText={setCoordinatorSearch}
                                placeholder="Search coordinator..."
                                placeholderTextColor="#94a3b8"
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontFamily: Fonts.Regular,
                                    color: '#1e293b',
                                }}
                            />
                        </View>

                        <FlatList
                            data={filteredCoordinators}
                            keyExtractor={(item, index) => index.toString()}
                            style={{ maxHeight: 360 }}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => {
                                const sel = coordinator === item.value;
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setCoordinator(item.value);
                                            clearErr('coordinator');
                                            setCoordinatorModal(false);
                                            setCoordinatorSearch('');
                                        }}
                                        style={[st.monthItem, sel && st.monthItemSel]}
                                    >
                                        <Text style={[st.monthItemTxt, sel && st.monthItemTxtSel]}>{item.label}</Text>
                                        {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── OTP MODAL ── */}
            <Modal visible={showOtpModal} transparent animationType="fade">
                <View style={st.modalOverlay}>
                    <View style={st.otpModal}>

                        {/* Close */}
                        <TouchableOpacity style={st.otpClose} onPress={() => setShowOtpModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View style={st.confirmIconWrap}>
                            <Icon name="message-text-outline" size={38} color={Colors.buttonbgcolor} />
                        </View>

                        <Text style={st.confirmTitle}>OTP Verification</Text>
                        <Text style={st.otpSubtitle}>
                            {/* OTP sent to <Text style={st.confirmBold}>{attemptedMobile}</Text> */}
                            Enter the OTP sent to your WhatsApp
                        </Text>

                        {/* 6-box OTP input */}
                        <View style={st.otpRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => (otpRefs.current[index] = ref)}
                                    value={digit}
                                    onChangeText={text => handleOtpChange(text, index)}
                                    onKeyPress={e => handleOtpKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    style={[
                                        st.otpBox,
                                        digit && !otpError ? st.otpBoxFilled : null,
                                        otpError ? st.otpBoxError : null,
                                    ]}
                                    textAlign="center"
                                    selectTextOnFocus
                                />
                            ))}
                        </View>
                        {otpError ? (
                            <Text style={st.otpErrTxt}>{otpError}</Text>
                        ) : null}

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[st.saveBtn, { marginTop: 20 }]}
                            onPress={handleVerifyOtp}
                            disabled={otpLoading}
                        >
                            {otpLoading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={st.saveBtnTxt}>Verify & Add Booking</Text>
                            }
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

            {/* ── CITY MODAL ── */}
            <Modal visible={cityModal} transparent animationType="fade">
                <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setCityModal(false)}>
                    <View style={st.monthModal} onStartShouldSetResponder={() => true}>
                        <Text style={st.monthModalTitle}>Select Branch</Text>
                        <TouchableOpacity style={st.modalCloseBtn} onPress={() => setCityModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>

                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            margin: 10,
                            paddingHorizontal: 12,
                            height: 40,
                            backgroundColor: '#f1f5f9',
                            borderRadius: 8,
                            gap: 8,
                        }}>
                            <Icon name="magnify" size={18} color="#94a3b8" />
                            <TextInput
                                value={citySearch}
                                onChangeText={setCitySearch}
                                placeholder="Search Branch..."
                                placeholderTextColor="#94a3b8"
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontFamily: Fonts.Regular,
                                    color: '#1e293b',
                                }}
                            />
                        </View>
                        {citiesLoading ? (
                            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredCities}
                                keyExtractor={(item, index) => index.toString()}
                                style={{ maxHeight: 360 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const sel = city === item.value;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setCity(item.value);
                                                clearErr('city');
                                                setCityModal(false);
                                                setCitySearch('');
                                            }}
                                            style={[st.monthItem, sel && st.monthItemSel]}
                                        >
                                            <Text style={[st.monthItemTxt, sel && st.monthItemTxtSel]}>{item.label}</Text>
                                            {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                        </TouchableOpacity>
                                    );
                                }}

                                ListEmptyComponent={
                                    <Text style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontFamily: Fonts.Regular }}>
                                        No branches found
                                    </Text>
                                }
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>


            {/* ── PACKAGE MODAL ── */}
            <Modal visible={packageModal} transparent animationType="fade" onRequestClose={() => setPackageModal(false)}>
                <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setPackageModal(false)}>
                    <View style={st.monthModal} onStartShouldSetResponder={() => true}>
                        <Text style={st.monthModalTitle}>Select Package</Text>
                        <TouchableOpacity style={st.modalCloseBtn} onPress={() => setPackageModal(false)}>
                            <Icon name="close" size={20} color="#64748b" />
                        </TouchableOpacity>

                        <View style={{
                            flexDirection: 'row', alignItems: 'center', margin: 10,
                            paddingHorizontal: 12, height: 40, backgroundColor: '#f1f5f9',
                            borderRadius: 8, gap: 8,
                        }}>
                            <Icon name="magnify" size={18} color="#94a3b8" />
                            <TextInput
                                value={packageSearch}
                                onChangeText={setPackageSearch}
                                placeholder="Search package..."
                                placeholderTextColor="#94a3b8"
                                style={{ flex: 1, fontSize: 13, fontFamily: Fonts.Regular, color: '#1e293b' }}
                            />
                        </View>

                        {packagesLoading ? (
                            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                            </View>
                        ) : (
                            <FlatList
                                data={packageOptions}
                                keyExtractor={(item) => String(item.package_id)}
                                style={{ maxHeight: 360 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => {
                                    const sel = remark === item.package_name;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setRemark(item.package_name);
                                                clearErr('remark');
                                                setPackageModal(false);
                                            }}
                                            style={[st.monthItem, sel && st.monthItemSel]}
                                        >
                                            <Text style={[st.monthItemTxt, sel && st.monthItemTxtSel]}>
                                                {item.package_name}
                                            </Text>
                                            {sel && <Icon name="check" size={18} color={Colors.buttonbgcolor} />}
                                        </TouchableOpacity>
                                    );
                                }}
                                ListEmptyComponent={
                                    <Text style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontFamily: Fonts.Regular }}>
                                        No packages found
                                    </Text>
                                }
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};

export default AddBooking;

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const st = StyleSheet.create({
    header: {
        height: 50, backgroundColor: Colors.buttonbgcolor,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingHorizontal: 12,
    },
    headerTitle: { color: '#fff', fontSize: 16, fontFamily: Fonts.Bold },

    label: { marginTop: 14, fontSize: 13, fontFamily: Fonts.Bold, color: '#2c3e50' },
    req: { color: 'red', fontFamily: Fonts.Bold },
    errTxt: { color: 'red', fontSize: 11, fontFamily: Fonts.Regular, marginTop: 2 },

    input: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
        height: 48, paddingHorizontal: 12, backgroundColor: '#fff',
        marginTop: 5, color: '#000', fontFamily: Fonts.Regular,
    },
    inputErr: { borderColor: 'red' },

    dropdown: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
        paddingHorizontal: 10, height: 50, marginTop: 5, backgroundColor: '#fff',
    },
    dropdownPlaceholder: { color: '#999', fontFamily: Fonts.Regular },
    dropdownSelected: { color: '#000', fontFamily: Fonts.Regular },
    dropdownContainer: {
        borderRadius: 10, borderWidth: 0.5, borderColor: '#e2e8f0',
        elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, marginTop: 6,
        shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    dropdownItemRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    dropdownItemSelected: { backgroundColor: '#f0fdf4' },
    dropdownItemText: { fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    dropdownItemTextSelected: { color: Colors.buttonbgcolor, fontFamily: Fonts.Bold },

    checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6, gap: 8 },
    checkbox: {
        width: 20, height: 20, borderRadius: 5,
        borderWidth: 1.5, borderColor: '#94a3b8',
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
    },
    checkboxChecked: { backgroundColor: Colors.buttonbgcolor, borderColor: Colors.buttonbgcolor },
    checkLabel: { fontSize: 13, fontFamily: Fonts.Regular, color: '#475569' },

    dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateTxt: { fontSize: 14, fontFamily: Fonts.Regular, color: '#000' },

    saveBtn: {
        backgroundColor: Colors.buttonbgcolor, height: 52, paddingHorizontal: 20,
        borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30,
    },
    saveBtnTxt: { color: '#fff', fontSize: 15, fontFamily: Fonts.Bold },

    /* ── Shared Modal ── */
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center', alignItems: 'center',
    },
    monthModal: {
        backgroundColor: '#fff', borderRadius: 14,
        width: '80%', overflow: 'hidden',
    },
    monthModalTitle: {
        fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b',
        textAlign: 'center', paddingVertical: 14,
        borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
    },
    monthItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, paddingHorizontal: 20,
        borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9',
    },
    monthItemSel: { backgroundColor: '#f0fdf4' },
    monthItemTxt: { flex: 1, fontSize: 14, fontFamily: Fonts.Regular, color: '#1e293b' },
    monthItemTxtSel: { fontFamily: Fonts.Bold, color: Colors.buttonbgcolor },

    /* ── 409 Confirm Modal ── */
    confirmModal: {
        backgroundColor: '#fff', borderRadius: 20,
        width: '85%', paddingHorizontal: 24, paddingVertical: 28,
        alignItems: 'center',
    },

    confirmIconWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#fff3f3',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 17, fontFamily: Fonts.Bold,
        color: '#1e293b', textAlign: 'center', marginBottom: 10,
    },
    confirmMsg: {
        fontSize: 13, fontFamily: Fonts.Regular, color: '#475569',
        textAlign: 'center', lineHeight: 20, marginBottom: 24,
    },
    confirmBold: { fontFamily: Fonts.Bold, color: '#1e293b' },
    confirmBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    confirmBtn: {
        flex: 1, height: 46, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    confirmBtnNo: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    confirmBtnNoTxt: { fontSize: 14, fontFamily: Fonts.Bold, color: '#64748b' },
    confirmBtnYes: { backgroundColor: Colors.buttonbgcolor },
    confirmBtnYesTxt: { fontSize: 14, fontFamily: Fonts.Bold, color: '#fff' },

    /* ── OTP Modal ── */
    otpModal: {
        backgroundColor: '#fff', borderRadius: 20,
        width: '88%', paddingHorizontal: 24, paddingVertical: 28,
        alignItems: 'center',
    },
    otpClose: {
        position: 'absolute', top: 14, right: 14,
        padding: 4,
    },
    otpSubtitle: {
        fontSize: 13, fontFamily: Fonts.Regular,
        color: '#475569', textAlign: 'center', marginTop: 6, marginBottom: 24,
    },
    otpRow: {
        flexDirection: 'row', gap: 10, justifyContent: 'center',
    },
    otpBox: {
        width: 44, height: 52, borderRadius: 10,
        borderWidth: 1.5, borderColor: '#cbd5e1',
        fontSize: 20, fontFamily: Fonts.Bold, color: '#1e293b',
        backgroundColor: '#f8fafc',
    },
    otpBoxFilled: {
        borderColor: Colors.buttonbgcolor,
        backgroundColor: '#fff',
    },
    otpBoxError: {
        borderColor: '#ef4444',
        backgroundColor: '#fff5f5',
    },
    otpErrTxt: {
        color: '#ef4444', fontSize: 12,
        fontFamily: Fonts.Regular, marginTop: 10,
        textAlign: 'center',
    },

    modalCloseBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        padding: 6,
    },
});
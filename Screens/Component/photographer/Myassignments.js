import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Modal,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    RefreshControl,
    Alert,
    FlatList,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';

/* =========================================================
   STATUS
========================================================= */

const STATUS_CONFIG = {
    Accepted: {
        color: '#6366F1',
        bg: '#EEF2FF',
        icon: 'check-circle-outline',
    },

    Done: {
        color: '#16A34A',
        bg: '#E8F8EF',
        icon: 'check-circle',
    },

    Pending: {
        color: '#F59E0B',
        bg: '#FFF7E6',
        icon: 'clock-outline',
    },

    Assigned: {
        color: '#F59E0B',
        bg: '#FFF7E6',
        icon: 'clock-outline',
    },

    Rejected: {
        color: '#EF4444',
        bg: '#FEF2F2',
        icon: 'close-circle-outline',
    },
};

const PAYMENT_TYPES = ['Cash', 'Online'];

/* =========================================================
   MONEY FORMAT
========================================================= */

const formatMoney = value => {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/* =========================================================
   DATE FORMAT (for display in DD-MM-YYYY, used by pickers)
========================================================= */

const formatDate = date => {
    if (!date) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

/* =========================================================
   DATE FORMAT (for API submission, YYYY-MM-DD)
========================================================= */

const formatDateForApi = date => {
    if (!date) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${year}-${month}-${day}`;
};

/* =========================================================
   DATE FORMAT (for booking_date coming from API, "01 Jan 2026")
========================================================= */

const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatApiDate = dateStr => {
    if (!dateStr) return null;

    const d = new Date(dateStr);

    if (isNaN(d.getTime())) return null;

    return `${String(d.getDate()).padStart(2, '0')} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/* =========================================================
   DATE FORMAT (payment_date "YYYY-MM-DD" -> "DD-MM-YYYY", for history rows)
========================================================= */

const formatDateDDMMYYYY = dateStr => {
    if (!dateStr) return '-';
    const parts = String(dateStr).split('-'); // ['2026','09','03']
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
};

/* =========================================================
   PARSE "YYYY-MM-DD" (or "YYYY-MM-DD HH:mm:ss") API date -> Date obj
========================================================= */

const parseApiDateToDateObj = dateStr => {
    if (!dateStr) return new Date();

    const datePart = String(dateStr).split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    if (!year || !month || !day) return new Date();

    return new Date(year, month - 1, day);
};

/* =========================================================
   PAYMENT MODAL — full CRUD (Add / Edit / Delete + History)
   IMPORTANT:
   This component is OUTSIDE Myassignments.
   This prevents modal remount while typing.
========================================================= */

const PaymentModal = ({
    visible,
    item,
    onClose,

    history,
    historyLoading,

    amount,
    setAmount,
    date,
    setDate,
    remark,
    setRemark,

    paymentType,        // 👈 NEW
    setPaymentType,      // 👈 NEW
    paymentTypeError,

    showDatePicker,
    setShowDatePicker,

    amountError,
    dateError,
    remarkError,

    maxAllowed,
    editingId,

    onStartEdit,
    onCancelEdit,
    onSubmit,
    onDelete,

    submitting,
    deletingId,
}) => {
    if (!item) return null;

    const paidSoFar = Math.max(Number(item.bookingAmount || 0) - maxAllowed, 0);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center',
                        paddingHorizontal: 12,
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            justifyContent: 'center',
                            paddingHorizontal: 12,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 16,
                                maxHeight: '90%',
                                overflow: 'hidden',
                            }}
                        >
                            {/* HEADER */}
                            <View
                                style={{
                                    backgroundColor: Colors.buttonbgcolor,
                                    paddingHorizontal: 16,
                                    paddingTop: 13,
                                    paddingBottom: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 17, color: '#fff' }}>
                                            #{item.id}
                                        </Text>
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Medium,
                                                fontSize: 11,
                                                color: '#ddd9ff',
                                                marginTop: 2,
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {item.client}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={onClose}
                                        style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 10,
                                            backgroundColor: 'rgba(255,255,255,0.16)',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon name="close" size={21} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <ScrollViewLike>
                                {/* SUMMARY */}
                                <View style={{ flexDirection: 'row', marginTop: 14, paddingHorizontal: 14 }}>
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#f7f5ff',
                                            borderRadius: 11,
                                            borderWidth: 0.6,
                                            borderColor: '#e4e0ff',
                                            paddingHorizontal: 10,
                                            paddingVertical: 9,
                                            marginRight: 5,
                                        }}
                                    >
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 8, color: '#6366F1' }}>
                                            BOOKING
                                        </Text>
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#202235', marginTop: 3 }}>
                                            {formatMoney(item.bookingAmount)}
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#f4fbf7',
                                            borderRadius: 11,
                                            borderWidth: 0.6,
                                            borderColor: '#d8f1e2',
                                            paddingHorizontal: 10,
                                            paddingVertical: 9,
                                            marginHorizontal: 2.5,
                                        }}
                                    >
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 8, color: '#16A34A' }}>
                                            PAID
                                        </Text>
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#16A34A', marginTop: 3 }}>
                                            {formatMoney(paidSoFar)}
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#fff5f5',
                                            borderRadius: 11,
                                            borderWidth: 0.6,
                                            borderColor: '#ffdcdc',
                                            paddingHorizontal: 10,
                                            paddingVertical: 9,
                                            marginLeft: 5,
                                        }}
                                    >
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 8, color: '#EF233C' }}>
                                            DUE
                                        </Text>
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 13, color: '#EF233C', marginTop: 3 }}>
                                            {formatMoney(maxAllowed)}
                                        </Text>
                                    </View>
                                </View>

                                {/* ADD / EDIT PAYMENT */}
                                <View style={{ paddingHorizontal: 14, marginTop: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View
                                            style={{
                                                flex: 1,
                                                height: 0.5,
                                                backgroundColor: '#ddd9f8',
                                                marginRight: 9,
                                            }}
                                        />

                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 10,
                                                color: editingId ? '#EF4444' : '#4f46b5',
                                                letterSpacing: 0.5,
                                            }}
                                        >
                                            {editingId ? 'EDIT PAYMENT' : 'ADD PAYMENT'}
                                        </Text>

                                        <View
                                            style={{
                                                flex: 1,
                                                height: 0.5,
                                                backgroundColor: '#ddd9f8',
                                                marginLeft: 9,
                                            }}
                                        />
                                    </View>

                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ flex: 1, marginRight: 7 }}>
                                            <Text style={{ fontFamily: Fonts.Medium, fontSize: 9.5, color: '#596078', marginBottom: 6 }}>
                                                Amount <Text style={{ color: '#EF233C' }}>*</Text>
                                            </Text>

                                            <View
                                                style={{
                                                    height: 44,
                                                    borderRadius: 10,
                                                    backgroundColor: '#f7f5ff',
                                                    borderWidth: amountError ? 1 : 0.6,
                                                    borderColor: amountError ? '#EF233C' : '#e1def8',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 10,
                                                }}
                                            >
                                                <Text style={{ fontFamily: Fonts.Bold, fontSize: 15, color: '#6366F1' }}>₹</Text>
                                                <TextInput
                                                    value={amount}
                                                    onChangeText={setAmount}
                                                    placeholder="e.g. 5000"
                                                    placeholderTextColor="#a5a6b5"
                                                    keyboardType="decimal-pad"
                                                    returnKeyType="done"
                                                    onSubmitEditing={Keyboard.dismiss}
                                                    style={{
                                                        flex: 1,
                                                        marginLeft: 8,
                                                        padding: 0,
                                                        fontFamily: Fonts.Regular,
                                                        fontSize: 11,
                                                        color: '#202235',
                                                    }}
                                                />
                                            </View>

                                            {amountError ? (
                                                <Text style={{ fontFamily: Fonts.Medium, fontSize: 8.5, color: '#EF233C', marginTop: 5 }}>
                                                    {amountError}
                                                </Text>
                                            ) : (
                                                <Text style={{ fontFamily: Fonts.Regular, fontSize: 8, color: '#9b9dac', marginTop: 5 }}>
                                                    Max: {formatMoney(maxAllowed)}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={{ flex: 1, marginLeft: 7 }}>
                                            <Text style={{ fontFamily: Fonts.Medium, fontSize: 9.5, color: '#596078', marginBottom: 6 }}>
                                                Date <Text style={{ color: '#EF233C' }}>*</Text>
                                            </Text>

                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    Keyboard.dismiss();
                                                    setShowDatePicker(true);
                                                }}
                                                style={{
                                                    height: 44,
                                                    borderRadius: 10,
                                                    backgroundColor: '#f7f5ff',
                                                    borderWidth: dateError ? 1 : 0.6,
                                                    borderColor: dateError ? '#EF233C' : '#e1def8',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 10,
                                                }}
                                            >
                                                <Icon name="calendar-outline" size={17} color="#6366F1" />
                                                <Text
                                                    style={{
                                                        flex: 1,
                                                        fontFamily: Fonts.Regular,
                                                        fontSize: 10.5,
                                                        color: '#4b5062',
                                                        marginLeft: 7,
                                                    }}
                                                >
                                                    {formatDate(date)}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {showDatePicker && (
                                        <View
                                            style={{
                                                marginTop: 8,
                                                backgroundColor: '#f7f5ff',
                                                borderRadius: 12,
                                                borderWidth: 0.6,
                                                borderColor: '#e1def8',
                                                alignItems: 'center',
                                                paddingVertical: Platform.OS === 'ios' ? 5 : 0,
                                            }}
                                        >
                                            <DateTimePicker
                                                value={date || new Date()}
                                                mode="date"
                                                display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                                                maximumDate={new Date()}
                                                onChange={(event, selectedDate) => {
                                                    if (event?.type === 'dismissed') {
                                                        setShowDatePicker(false);
                                                        return;
                                                    }
                                                    if (Platform.OS === 'android') setShowDatePicker(false);
                                                    if (selectedDate) setDate(selectedDate);
                                                }}
                                                accentColor="#6366F1"
                                            />
                                        </View>
                                    )}

                                    {/* PAYMENT TYPE */}
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={{ fontFamily: Fonts.Medium, fontSize: 9.5, color: '#596078', marginBottom: 6 }}>
                                            Payment Type
                                        </Text>

                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {PAYMENT_TYPES.map(type => {
                                                const selected = paymentType === type;
                                                return (
                                                    <TouchableOpacity
                                                        key={type}
                                                        activeOpacity={0.75}
                                                        onPress={() => setPaymentType(type)}
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            height: 32,
                                                            borderRadius: 8,
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginRight: 8,
                                                            marginBottom: 8,
                                                            backgroundColor: selected ? Colors.buttonbgcolor : '#f7f5ff',
                                                            borderWidth: 0.6,
                                                            borderColor: selected ? Colors.buttonbgcolor : '#e1def8',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontFamily: Fonts.Bold,
                                                                fontSize: 9.5,
                                                                color: selected ? '#fff' : '#4b5062',
                                                            }}
                                                        >
                                                            {type}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>

                                        {paymentTypeError ? (
                                            <Text style={{ fontFamily: Fonts.Medium, fontSize: 8.5, color: '#EF233C', marginTop: 2 }}>
                                                {paymentTypeError}
                                            </Text>
                                        ) : null}
                                    </View>

                                    <View style={{ marginTop: 12 }}>
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Medium,
                                                fontSize: 9.5,
                                                color: '#596078',
                                                marginBottom: 6,
                                            }}
                                        >
                                            Remark{' '}
                                            <Text
                                                style={{
                                                    fontFamily: Fonts.Regular,
                                                    fontSize: 8,
                                                    color: '#9b9dac',
                                                }}
                                            >
                                                (optional)
                                            </Text>
                                        </Text>

                                        <TextInput
                                            value={remark}
                                            onChangeText={setRemark}
                                            placeholder="e.g. Advance received in cash"
                                            placeholderTextColor="#a5a6b5"
                                            maxLength={100}
                                            multiline={true}
                                            textAlignVertical="top"
                                            style={{
                                                height: 75,
                                                borderRadius: 10,
                                                backgroundColor: '#f7f5ff',
                                                borderWidth: remarkError ? 1 : 0.6,
                                                borderColor: remarkError ? '#EF233C' : '#e1def8',
                                                paddingHorizontal: 10,
                                                paddingVertical: 10,
                                                fontFamily: Fonts.Regular,
                                                fontSize: 10.5,
                                                color: '#202235',
                                            }}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 10,
                                            marginTop: 15,
                                        }}
                                    >
                                        {/* Add / Update Payment */}
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={onSubmit}
                                            disabled={submitting}
                                            style={{
                                                flex: 1,
                                                height: 43,
                                                borderRadius: 10,
                                                backgroundColor: Colors.buttonbgcolor,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'row',
                                                opacity: submitting ? 0.7 : 1,
                                            }}
                                        >
                                            {submitting ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Icon
                                                        name={editingId ? 'content-save-outline' : 'plus'}
                                                        size={17}
                                                        color="#fff"
                                                    />

                                                    <Text
                                                        style={{
                                                            fontFamily: Fonts.Bold,
                                                            fontSize: 11,
                                                            color: '#fff',
                                                            marginLeft: 5,
                                                        }}
                                                    >
                                                        {editingId ? 'Update Payment' : 'Add Payment'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        {/* Cancel Edit */}
                                        {editingId && (
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                onPress={onCancelEdit}
                                                style={{
                                                    flex: 0.5,
                                                    height: 43,
                                                    borderRadius: 10,
                                                    backgroundColor: '#FEF2F2',
                                                    borderWidth: 1,
                                                    borderColor: '#FCA5A5',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <Icon
                                                    name="close"
                                                    size={16}
                                                    color="#DC2626"
                                                />

                                                <Text
                                                    style={{
                                                        fontFamily: Fonts.Bold,
                                                        fontSize: 10,
                                                        color: '#DC2626',
                                                        marginLeft: 4,
                                                    }}
                                                >
                                                    Cancel Edit
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>

                                {/* HISTORY */}
                                <View style={{ paddingHorizontal: 14, marginTop: 20, marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9 }}>
                                        <Text style={{ fontFamily: Fonts.Bold, fontSize: 11, color: '#4f46b5' }}>
                                            PAYMENT HISTORY
                                        </Text>
                                        <View style={{ flex: 1, height: 0.5, backgroundColor: '#ddd9f8', marginLeft: 9 }} />
                                    </View>

                                    {historyLoading ? (
                                        <ActivityIndicator size="small" color={Colors.buttonbgcolor} style={{ marginVertical: 20 }} />
                                    ) : history.length === 0 ? (
                                        <View
                                            style={{
                                                alignItems: 'center',
                                                paddingVertical: 25,
                                                backgroundColor: '#fafaff',
                                                borderWidth: 0.6,
                                                borderColor: '#e7e5f3',
                                                borderRadius: 10,
                                            }}
                                        >
                                            <Icon name="cash-remove" size={20} color="#7774df" />
                                            <Text style={{ fontFamily: Fonts.Bold, fontSize: 10.5, color: '#55596a', marginTop: 7 }}>
                                                No payments yet
                                            </Text>
                                        </View>
                                    ) : (
                                        history.map(payment => (
                                            <View
                                                key={payment.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingVertical: 9,
                                                    paddingHorizontal: 9,
                                                    backgroundColor: '#fff',
                                                    borderWidth: 0.6,
                                                    borderColor: '#e7e5f3',
                                                    borderRadius: 9,
                                                    marginBottom: 6,
                                                }}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontFamily: Fonts.Bold, fontSize: 10.5, color: '#16A34A' }}>
                                                        {formatMoney(payment.amount)}
                                                    </Text>
                                                    <Text style={{ fontFamily: Fonts.Medium, fontSize: 8.5, color: '#626779', marginTop: 2 }}>
                                                        {formatDateDDMMYYYY(payment.date)}
                                                        {payment.remark ? `  •  ${payment.remark}` : ''}

                                                    </Text>
                                                    <Text style={{ fontFamily: Fonts.Medium, fontSize: 8.5, color: '#6366F1', marginTop: 2 }}>
                                                        {payment.paymentType || '-'}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontFamily: Fonts.Medium,
                                                            fontSize: 8.5,
                                                            color: '#626779',
                                                            marginTop: 2,
                                                            textTransform: 'capitalize',  // 👈 addedBy ko capitalize karne ke liye
                                                        }}
                                                    >
                                                        Added By: {payment.addedBy || '-'}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    onPress={() => onStartEdit(payment)}
                                                    style={{ padding: 6 }}
                                                >
                                                    <Icon name="pencil-outline" size={16} color="#6366F1" />
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => onDelete(payment)}
                                                    disabled={deletingId === payment.id}
                                                    style={{ padding: 6 }}
                                                >
                                                    {deletingId === payment.id ? (
                                                        <ActivityIndicator size="small" color="#EF4444" />
                                                    ) : (
                                                        <Icon name="trash-can-outline" size={16} color="#EF4444" />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </ScrollViewLike>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

/* small helper so payment modal content scrolls */
const ScrollViewLike = ({ children }) => (
    <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
    </ScrollView>
);

/* =========================================================
   MARK DONE MODAL
========================================================= */

const MarkDoneModal = ({
    visible,
    assignment,
    onClose,
    amount,
    setAmount,
    date,
    showDatePicker,
    setShowDatePicker,
    onDateChange,
    onSubmit,
    submitting,
}) => {
    if (!assignment) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center',
                        paddingHorizontal: 18,
                    }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 16,
                                padding: 18,
                            }}
                        >
                            <Icon
                                name="help-circle-outline"
                                size={40}
                                color="#0284C7"
                                style={{ alignSelf: 'center', marginBottom: 8 }}
                            />

                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    fontSize: 15,
                                    color: '#202235',
                                    textAlign: 'center',
                                }}
                            >
                                Mark Shoot Done?
                            </Text>

                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 10.5,
                                    color: '#7b8090',
                                    textAlign: 'center',
                                    marginTop: 6,
                                    lineHeight: 15,
                                }}
                            >
                                This will mark the photographer assignment and booking as Final Done. If the client paid you, enter the payment below — leave it blank to skip.
                            </Text>

                            <View
                                style={{
                                    backgroundColor: '#f7f5ff',
                                    borderRadius: 10,
                                    marginTop: 14,
                                    overflow: 'hidden',
                                }}
                            >
                                {[
                                    ['Booking Amount', assignment.bookingAmount],
                                    ['Already Paid', assignment.paid],
                                    ['Due', assignment.due],
                                ].map(([label, val], idx) => (
                                    <View
                                        key={label}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            paddingHorizontal: 12,
                                            paddingVertical: 9,
                                            borderTopWidth: idx === 0 ? 0 : 0.5,
                                            borderTopColor: '#e6e2fa',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Medium,
                                                fontSize: 10.5,
                                                color: '#4b5062',
                                            }}
                                        >
                                            {label}
                                        </Text>
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 10.5,
                                                color: '#202235',
                                            }}
                                        >
                                            {formatMoney(val)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <Text
                                style={{
                                    fontFamily: Fonts.Medium,
                                    fontSize: 9.5,
                                    color: '#596078',
                                    marginTop: 14,
                                    marginBottom: 6,
                                }}
                            >
                                Payment Amount Received (optional)
                            </Text>

                            <View
                                style={{
                                    height: 44,
                                    borderRadius: 10,
                                    backgroundColor: '#f7f5ff',
                                    borderWidth: 0.6,
                                    borderColor: '#e1def8',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 15,
                                        color: '#6366F1',
                                    }}
                                >
                                    ₹
                                </Text>

                                <TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="e.g. 5000"
                                    placeholderTextColor="#a5a6b5"
                                    keyboardType="decimal-pad"
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                    style={{
                                        flex: 1,
                                        marginLeft: 8,
                                        padding: 0,
                                        fontFamily: Fonts.Regular,
                                        fontSize: 11,
                                        color: '#202235',
                                    }}
                                />
                            </View>

                            <Text
                                style={{
                                    fontFamily: Fonts.Medium,
                                    fontSize: 9.5,
                                    color: '#596078',
                                    marginTop: 14,
                                    marginBottom: 6,
                                }}
                            >
                                Payment Date
                            </Text>

                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setShowDatePicker(true);
                                }}
                                style={{
                                    height: 44,
                                    borderRadius: 10,
                                    backgroundColor: '#f7f5ff',
                                    borderWidth: 0.6,
                                    borderColor: '#e1def8',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 10,
                                }}
                            >
                                <Icon name="calendar-outline" size={17} color="#6366F1" />
                                <Text
                                    style={{
                                        flex: 1,
                                        fontFamily: Fonts.Regular,
                                        fontSize: 10.5,
                                        color: '#4b5062',
                                        marginLeft: 7,
                                    }}
                                >
                                    {formatDate(date)}
                                </Text>
                                <Icon name="calendar-month-outline" size={15} color="#7774df" />
                            </TouchableOpacity>

                            {showDatePicker && (
                                <View
                                    style={{
                                        marginTop: 8,
                                        backgroundColor: '#f7f5ff',
                                        borderRadius: 12,
                                        borderWidth: 0.6,
                                        borderColor: '#e1def8',
                                        overflow: 'hidden',
                                        alignItems: 'center',
                                        paddingVertical: Platform.OS === 'ios' ? 5 : 0,
                                    }}
                                >
                                    <DateTimePicker
                                        value={date || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                                        maximumDate={new Date()}
                                        onChange={onDateChange}
                                        accentColor="#6366F1"
                                    />
                                </View>
                            )}

                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginTop: 18,
                                }}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={onClose}
                                    disabled={submitting}
                                    style={{
                                        flex: 1,
                                        height: 43,
                                        borderRadius: 10,
                                        backgroundColor: '#F1F5F9',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 8,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: Fonts.Bold,
                                            fontSize: 12,
                                            color: '#334155',
                                        }}
                                    >
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={onSubmit}
                                    disabled={submitting}
                                    style={{
                                        flex: 1,
                                        height: 43,
                                        borderRadius: 10,
                                        backgroundColor: Colors.buttonbgcolor,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: 8,
                                        opacity: submitting ? 0.7 : 1,
                                    }}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 12,
                                                color: '#fff',
                                            }}
                                        >
                                            Mark Done
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};


/* =========================================================
   CONFIRM ACTION MODAL (Approve / Reject)
========================================================= */

const ConfirmActionModal = ({
    visible,
    action,       // { item, status } | null
    onClose,
    onConfirm,
    submitting,
}) => {
    if (!action) return null;

    const isApprove = action.status === 'Accepted';

    const config = isApprove
        ? {
            icon: 'check-circle-outline',
            iconColor: '#16A34A',
            title: 'Accept this booking?',
            desc: `Accept the assignment for "${action.item.client}"?`,
            confirmLabel: 'Yes, Accept',
            confirmBg: '#16A34A',
        }
        : {
            icon: 'close-circle-outline',
            iconColor: '#EF4444',
            title: 'Reject this booking?',
            desc: `Reject the assignment for "${action.item.client}"?`,
            confirmLabel: 'Yes, Reject',
            confirmBg: '#EF4444',
        };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableOpacity
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    justifyContent: 'center',
                    paddingHorizontal: 22,
                }}
                onPress={onClose}
            >
                <View
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: 16,
                        padding: 18,
                    }}
                    onStartShouldSetResponder={() =>
                        true
                    }
                >
                    <Icon
                        name={config.icon}
                        size={40}
                        color={config.iconColor}
                        style={{ alignSelf: 'center', marginBottom: 8 }}
                    />

                    <Text
                        style={{
                            fontFamily: Fonts.Bold,
                            fontSize: 15,
                            color: '#202235',
                            textAlign: 'center',
                        }}
                    >
                        {config.title}
                    </Text>

                    <Text
                        style={{
                            fontFamily: Fonts.Regular,
                            fontSize: 10.5,
                            color: '#7b8090',
                            textAlign: 'center',
                            marginTop: 6,
                            lineHeight: 15,
                        }}
                    >
                        {config.desc}
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 18,
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onClose}
                            disabled={submitting}
                            style={{
                                flex: 1,
                                height: 43,
                                borderRadius: 10,
                                backgroundColor: '#F1F5F9',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 8,
                                opacity: submitting ? 0.6 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    fontSize: 12,
                                    color: '#334155',
                                }}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onConfirm}
                            disabled={submitting}
                            style={{
                                flex: 1,
                                height: 43,
                                borderRadius: 10,
                                backgroundColor: config.confirmBg,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 8,
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 12,
                                        color: '#fff',
                                    }}
                                >
                                    {config.confirmLabel}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

/* =========================================================
   MAIN
========================================================= */

const Myassignments = () => {
    const navigation = useNavigation();

    const [searchQuery, setSearchQuery] = useState('');

    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const PAGE_SIZE = 20;

    const [assignments, setAssignments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    /* =====================================================
       PAYMENT MANAGEMENT (CRUD) STATES
    ===================================================== */

    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentItem, setPaymentItem] = useState(null);

    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

    const [payAmount, setPayAmount] = useState('');
    const [payDate, setPayDate] = useState(new Date());
    const [payRemark, setPayRemark] = useState('');
    const [payShowDatePicker, setPayShowDatePicker] = useState(false);

    const [payAmountError, setPayAmountError] = useState('');
    const [payDateError, setPayDateError] = useState('');
    const [payRemarkError, setPayRemarkError] = useState('');

    const [payType, setPayType] = useState('Cash');
    const [payTypeError, setPayTypeError] = useState('');

    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [deletingPaymentId, setDeletingPaymentId] = useState(null);

    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);

    const maxAllowedAmount = useMemo(() => {
        if (!paymentItem) return 0;
        const paidExcludingEditing = paymentHistory.reduce((sum, p) => {
            if (editingPaymentId && String(p.id) === String(editingPaymentId)) return sum;
            return sum + Number(p.amount || 0);
        }, 0);
        return Math.max(Number(paymentItem.bookingAmount || 0) - paidExcludingEditing, 0);
    }, [paymentItem, paymentHistory, editingPaymentId]);

    /* =====================================================
       APPROVE / REJECT — inline pill buttons on the card,
       no more 3-dot menu / modal. submittingStatusId tracks
       which card's Approve/Reject button is in-flight.
    ===================================================== */

    // stores "<item.id>-<newStatus>" e.g. "12-Accepted" so Approve and
    // Reject loaders on the same card never spin together
    const [submittingStatusId, setSubmittingStatusId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);



    /* =====================================================
       MARK DONE STATES
    ===================================================== */

    const [markDoneAssignment, setMarkDoneAssignment] = useState(null);
    const [markDoneAmount, setMarkDoneAmount] = useState('');
    const [markDoneDate, setMarkDoneDate] = useState(new Date());
    const [markDoneShowDatePicker, setMarkDoneShowDatePicker] = useState(false);
    const [markDoneSubmitting, setMarkDoneSubmitting] = useState(false);

    const [doneConfirmItem, setDoneConfirmItem] = useState(null);
    const [doneConfirmSubmitting, setDoneConfirmSubmitting] = useState(false);
    const [pendingDoneData, setPendingDoneData] = useState(null);
    // shape: { assignment, amount, date }

    /* =====================================================
       FETCH ASSIGNMENTS
    ===================================================== */

    const fetchAssignments = async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            setErrorMsg('');

            const userId = await AsyncStorage.getItem('id');

            if (!userId) {
                setErrorMsg('User ID not found. Please login again.');
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const res = await fetch(API.my_assignments, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            const json = await res.json();

            if (json?.status && Array.isArray(json.payload)) {
                const mapped = json.payload.map(item => ({
                    id: String(item.order_no ?? ''),
                    clientId: String(item.client_id ?? ''),
                    client: item.client_name ?? '-',
                    phone: item.mobile_no ?? '',
                    event: item.event ?? '-',
                    shootDate: item.booking_date
                        ? formatApiDate(item.booking_date)
                        : (item.shoot_month ?? null),

                    shootDateLabel: item.booking_date
                        ? 'Shoot Date'
                        : (item.shoot_month ? 'Shoot Month' : 'Shoot Date'),
                    bookingAmount: Number(item.booking_amount) || 0,
                    paid: Number(item.paid_amount) || 0,
                    due: Number(item.due_amount) || 0,
                    coordinator: item.coordinator_name ?? '-',
                    status: item.assignment_status ?? 'Assigned',
                    paymentHistory: [],
                }));

                setAssignments(mapped);
            } else {
                setAssignments([]);
                setErrorMsg(json?.message || 'Something went wrong.');
            }
        } catch (e) {
            console.log('my_assignments error:', e);
            setErrorMsg('Unable to load assignments. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAssignments();
        }, [])
    );

    const onRefresh = () => fetchAssignments(true);

    const handleLoadMore = () => {
        if (loadingMore) return;
        if (visibleAssignments.length >= filteredAssignments.length) return;

        setLoadingMore(true);
        setTimeout(() => {
            setPage(prev => prev + 1);
            setLoadingMore(false);
        }, 400);
    };

    /* =====================================================
       FILTER
    ===================================================== */

    const filteredAssignments = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        if (!q) {
            return assignments;
        }

        return assignments.filter(item =>
            item.client.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            item.event.toLowerCase().includes(q) ||
            item.coordinator.toLowerCase().includes(q)
        );
    }, [searchQuery, assignments]);

    const visibleAssignments = useMemo(
        () => filteredAssignments.slice(0, page * PAGE_SIZE),
        [filteredAssignments, page]
    );

    useEffect(() => {
        setPage(1);
    }, [searchQuery, assignments]);

    /* =====================================================
       STATS
    ===================================================== */

    const total = assignments.length;

    const accepted = assignments.filter(
        item => item.status === 'Accepted'
    ).length;

    const done = assignments.filter(
        item => item.status === 'Done'
    ).length;

    const pending = assignments.filter(
        item => item.status === 'Assigned'
    ).length;

    /* =====================================================
       PAYMENT — OPEN / CLOSE / FETCH / CRUD
    ===================================================== */

    const resetPaymentForm = () => {
        setPayAmount('');
        setPayDate(new Date());
        setPayRemark('');
        setPayType('Cash');
        setPayShowDatePicker(false);
        setPayAmountError('');
        setPayDateError('');
        setPayRemarkError('');
        setPayTypeError('');
        setEditingPaymentId(null);
    };

    const fetchPaymentHistory = async item => {
        try {
            setPaymentHistoryLoading(true);

            const res = await fetch(API.payment_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: item.clientId,
                }),
            });

            const json = await res.json();

            if (json?.status && Array.isArray(json?.payload)) {
                setPaymentHistory(
                    json.payload.map(p => ({
                        id: p.id,
                        clientId: p.client_id,
                        amount: Number(p.amount) || 0,
                        paymentType: p.payment_method || '',
                        remark: p.remark || '',
                        date: p.payment_date || '',
                        collectedBy: p.collected_by || '',
                        notes: p.notes || '',
                        addedBy: p.added_by || '',
                        createdAt: p.created_at || '',
                        updatedAt: p.updated_at || '',
                    }))
                );
            } else {
                setPaymentHistory([]);
            }
        } catch (e) {
            console.log('payment_list error:', e);
            setPaymentHistory([]);
        } finally {
            setPaymentHistoryLoading(false);
        }
    };

    const openPaymentModal = item => {
        Keyboard.dismiss();
        setPaymentItem(item);
        resetPaymentForm();
        setPaymentModalVisible(true);
        fetchPaymentHistory(item);
    };

    const closePaymentModal = () => {
        if (paymentSubmitting) return;
        setPaymentModalVisible(false);
        setPaymentItem(null);
        setPaymentHistory([]);
        resetPaymentForm();
    };

    const handlePayAmountChange = text => {
        let cleaned = text.replace(/[^0-9.]/g, '');
        const firstDot = cleaned.indexOf('.');
        if (firstDot !== -1) {
            cleaned = cleaned.substring(0, firstDot + 1) + cleaned.substring(firstDot + 1).replace(/\./g, '');
        }
        if (cleaned.includes('.')) {
            const [whole, decimal] = cleaned.split('.');
            cleaned = whole + '.' + decimal.substring(0, 2);
        }
        setPayAmount(cleaned);
        if (payAmountError) setPayAmountError('');
    };

    const startEditPayment = payment => {
        setEditingPaymentId(payment.id);
        setPayAmount(String(payment.amount));

        setPayDate(parseApiDateToDateObj(payment.date));

        setPayRemark(payment.remark || '');
        setPayType(payment.paymentType || 'Cash');
        setPayAmountError('');
        setPayDateError('');
        setPayRemarkError('');
        setPayTypeError('');
    };

    const cancelEditPayment = () => resetPaymentForm();

    const submitPayment = async () => {
        Keyboard.dismiss();

        let hasError = false;
        const amountText = payAmount.trim();
        const amountNum = Number(amountText);

        if (!amountText) {
            setPayAmountError('Amount is required');
            hasError = true;
        } else if (isNaN(amountNum) || amountNum <= 0) {
            setPayAmountError('Enter a valid amount');
            hasError = true;
        } else if (amountNum > maxAllowedAmount) {
            setPayAmountError(`Amount cannot be more than due ${formatMoney(maxAllowedAmount)}`);
            hasError = true;
        }

        if (!payDate) {
            setPayDateError('Date is required');
            hasError = true;
        }

        if (payRemark.length > 100) {
            setPayRemarkError('Remark should not exceed 100 characters');
            hasError = true;
        }

        if (hasError || !paymentItem) return;

        try {
            setPaymentSubmitting(true);
            const adminId = await AsyncStorage.getItem('id');

            const payload = {
                client_id: paymentItem.clientId,
                order_no: paymentItem.id,
                amount: amountNum,
                payment_method: payType,
                remark: payRemark.trim(),
                payment_date: formatDateForApi(payDate),
                collected_by: Number(adminId || 0),
                notes: payRemark.trim(),
                added_by: String(adminId || ''),
            };

            if (editingPaymentId) {
                payload.id = editingPaymentId;
            }

            const url = editingPaymentId ? API.payment_update : API.payment_add;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (json?.status) {
                await fetchPaymentHistory(paymentItem);

                const newPaid = paymentHistory.reduce((sum, p) => {
                    if (editingPaymentId && String(p.id) === String(editingPaymentId)) return sum;
                    return sum + Number(p.amount || 0);
                }, 0) + amountNum;

                setAssignments(prev =>
                    prev.map(s =>
                        s.id === paymentItem.id
                            ? {
                                ...s,
                                paid: newPaid,
                                due: Math.max(Number(s.bookingAmount || 0) - newPaid, 0),
                            }
                            : s
                    )
                );

                resetPaymentForm();
            } else {
                Alert.alert('Error', json?.message || 'Could not save payment. Please try again.');
            }
        } catch (e) {
            console.log('payment save error:', e);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const deletePayment = payment => {
        setPaymentToDelete(payment);
        setDeleteConfirmModal(true);
    };

    const confirmDeletePayment = async () => {
        if (!paymentToDelete) return;
        const payment = paymentToDelete;

        setDeleteConfirmModal(false);

        try {
            setDeletingPaymentId(payment.id);

            const res = await fetch(API.payment_delete, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    id: payment.id,
                }),
            });

            const json = await res.json();

            if (json?.status) {
                const remaining = paymentHistory.filter(p => p.id !== payment.id);
                setPaymentHistory(remaining);

                const newPaid = remaining.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                setAssignments(prev =>
                    prev.map(s =>
                        s.id === paymentItem.id
                            ? {
                                ...s,
                                paid: newPaid,
                                due: Math.max(Number(s.bookingAmount || 0) - newPaid, 0),
                            }
                            : s
                    )
                );

                if (editingPaymentId === payment.id) resetPaymentForm();
            } else {
                Alert.alert('Error', json?.message || 'Could not delete payment.');
            }
        } catch (e) {
            console.log('payment delete error:', e);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setDeletingPaymentId(null);
            setPaymentToDelete(null);
        }
    };

    /* =====================================================
       APPROVE / REJECT (direct inline buttons, no modal)
       NOTE: console.log added below so you can see exactly
       what is being sent to and received from the API.
       Check Metro/adb logcat terminal after tapping
       Approve/Reject.
    ===================================================== */

    const updateAssignmentStatus = async (item, newStatus) => {
        if (!item) return;

        try {
            setSubmittingStatusId(`${item.id}-${newStatus}`);

            const adminId = await AsyncStorage.getItem('id');

            const formData = new FormData();
            formData.append('client_id', item.clientId);
            // formData.append('order_no', item.id);
            formData.append('admin_id', adminId || '');
            formData.append('status', newStatus);

            // ---- DEBUG LOG: request payload ----
            console.log('====== photographer_status API CALL ======');
            console.log('URL:', API.photographer_status);
            console.log('order_no (item.id):', item.id);
            console.log('client_id:', item.clientId);
            console.log('admin_id:', adminId);
            console.log('status being sent:', newStatus);
            console.log('============================================');

            const res = await fetch(API.photographer_status, {
                method: 'POST',
                body: formData,
            });

            const json = await res.json();

            // ---- DEBUG LOG: raw API response ----
            console.log('====== photographer_status API RESPONSE ======');
            console.log('HTTP status code:', res.status);
            console.log('Response JSON:', JSON.stringify(json, null, 2));
            console.log('================================================');

            if (json?.status) {
                setAssignments(prev =>
                    prev.map(a =>
                        a.id === item.id
                            ? { ...a, status: newStatus }
                            : a
                    )
                );

                console.log(`Local state updated -> order #${item.id} status set to "${newStatus}"`);
            } else {
                console.log('photographer_status FAILED. Message from API:', json?.message);
                Alert.alert('Error', json?.message || 'Could not update status. Please try again.');
            }
        } catch (e) {
            console.log('photographer_status error:', e);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setSubmittingStatusId(null);
        }
    };

    // ✅ Naya
    const handleApprove = item => setConfirmAction({ item, status: 'Accepted' });
    const handleReject = item => setConfirmAction({ item, status: 'Rejected' });

    const closeConfirmModal = () => {
        if (submittingStatusId) return;   // API chal rahi ho to close mat hone do
        setConfirmAction(null);
    };

    const proceedConfirmAction = async () => {
        if (!confirmAction) return;
        await updateAssignmentStatus(confirmAction.item, confirmAction.status);
        setConfirmAction(null);
    };

    /* =====================================================
       MARK DONE
    ===================================================== */

    const openMarkDoneModal = item => {
        Keyboard.dismiss();
        setMarkDoneAssignment(item);
        setMarkDoneAmount('');
        setMarkDoneDate(new Date());
        setMarkDoneShowDatePicker(false);
    };

    const closeDoneConfirm = () => {
        if (doneConfirmSubmitting) return;
        setDoneConfirmItem(null);
        setPendingDoneData(null);   // 👈 data discard, kuch nahi hoga
    };

    const proceedDoneConfirm = async () => {
        if (!pendingDoneData) return;

        try {
            setDoneConfirmSubmitting(true);

            const adminId = await AsyncStorage.getItem('id');

            const formData = new FormData();
            formData.append('client_id', pendingDoneData.assignment.clientId);
            formData.append('payment_amount', pendingDoneData.amount ? pendingDoneData.amount.trim() : '');
            formData.append('payment_date', formatDateForApi(pendingDoneData.date));
            formData.append('admin_id', adminId || '');

            const res = await fetch(API.photographer_mark_done, {
                method: 'POST',
                body: formData,
            });

            const json = await res.json();

            if (json?.status) {
                const amountPaid = Number(pendingDoneData.amount) || 0;

                setAssignments(prev =>
                    prev.map(item => {
                        if (item.id !== pendingDoneData.assignment.id) {
                            return item;
                        }

                        const newPaid = Number(item.paid || 0) + amountPaid;
                        const newDue = Math.max(Number(item.bookingAmount || 0) - newPaid, 0);

                        return {
                            ...item,
                            status: 'Done',
                            paid: newPaid,
                            due: newDue,
                        };
                    })
                );

                setDoneConfirmItem(null);
                setPendingDoneData(null);
                setMarkDoneAmount('');
                setMarkDoneDate(new Date());
            } else {
                Alert.alert('Error', json?.message || 'Could not mark as done. Please try again.');
            }
        } catch (e) {
            console.log('mark done (confirm) error:', e);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setDoneConfirmSubmitting(false);
        }
    };

    const closeMarkDoneModal = () => {
        if (markDoneSubmitting) return;

        Keyboard.dismiss();
        setMarkDoneShowDatePicker(false);
        setMarkDoneAssignment(null);
        setMarkDoneAmount('');
        setMarkDoneDate(new Date());
    };

    const onMarkDoneDateChange = (event, selectedDate) => {
        if (event?.type === 'dismissed') {
            setMarkDoneShowDatePicker(false);
            return;
        }

        if (Platform.OS === 'android') {
            setMarkDoneShowDatePicker(false);
        }

        if (selectedDate) {
            setMarkDoneDate(selectedDate);
        }
    };
    const submitMarkDone = () => {
        if (!markDoneAssignment) return;

        // MarkDoneModal band karo, data ko confirm step ke liye save karo
        setPendingDoneData({
            assignment: markDoneAssignment,
            amount: markDoneAmount,
            date: markDoneDate,
        });

        setMarkDoneShowDatePicker(false);
        setMarkDoneAssignment(null);   // MarkDoneModal band

        setDoneConfirmItem(markDoneAssignment);   // confirmation popup kholo
    };

    /* =====================================================
       STAT ITEM
    ===================================================== */

    const StatItem = ({
        label,
        value,
        color,
    }) => (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
            }}
        >
            <Text
                style={{
                    fontFamily: Fonts.Regular,
                    fontSize: 9,
                    color: '#7b8090',
                }}
            >
                {label}
            </Text>

            <Text
                style={{
                    fontFamily: Fonts.Bold,
                    fontSize: 15,
                    color: color,
                    marginTop: 2,
                }}
            >
                {value}
            </Text>
        </View>
    );

    /* =====================================================
       ASSIGNMENT CARD
    ===================================================== */

    const AssignmentCard = ({ item }) => {
        const status =
            STATUS_CONFIG[item.status] ||
            STATUS_CONFIG.Pending;

        const isApproving = submittingStatusId === `${item.id}-Accepted`;
        const isRejecting = submittingStatusId === `${item.id}-Rejected`;
        const isSubmitting = isApproving || isRejecting;

        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 11,
                    marginBottom: 8,
                    borderWidth: 0.6,
                    borderColor: '#e6e7f5',
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                }}
            >
                {/* TOP */}

                <View
                    style={{
                        paddingHorizontal: 10,
                        paddingTop: 9,
                        paddingBottom: 7,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            minWidth: 27,
                            height: 27,
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            backgroundColor: '#f5f3ff',
                            borderWidth: 0.5,
                            borderColor: '#ddd9ff',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 9,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 9,
                                color: Colors.buttonbgcolor,
                            }}
                            numberOfLines={1}
                        >
                            #{item.id}
                        </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 12,
                                color: '#202235',
                                textTransform: 'capitalize'
                            }}
                            numberOfLines={1}
                        >
                            {item.client}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 2,
                            }}
                        >
                            <Icon name="phone-outline" size={10} color="#9aa0ae" />
                            <Text
                                style={{
                                    fontFamily: Fonts.Regular,
                                    fontSize: 9,
                                    color: '#9298a7',
                                    marginLeft: 3,
                                }}
                            >
                                {item.phone}
                            </Text>
                        </View>
                    </View>

                    {/* STATUS BADGE — 3-dot removed, no more action menu */}

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: status.bg,
                            borderRadius: 15,
                            paddingHorizontal: 7,
                            paddingVertical: 4,
                        }}
                    >
                        <Icon name={status.icon} size={11} color={status.color} />
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                                color: status.color,
                                marginLeft: 3,
                            }}
                        >
                            {item.status}
                        </Text>
                    </View>
                </View>

                {/* EVENT + SHOOT DATE + COORDINATOR — coordinator moved up here */}

                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderTopWidth: 0.5,
                        borderBottomWidth: 0.5,
                        borderColor: '#f0f0f5',
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 8.5,
                                color: '#999eab',
                            }}
                        >
                            Event
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 3,
                            }}
                        >
                            <Icon name="tag-outline" size={11} color="#6366F1" />
                            <Text
                                style={{
                                    fontFamily: Fonts.Medium,
                                    fontSize: 10,
                                    color: '#4b5062',
                                    marginLeft: 4,
                                    textTransform: 'capitalize',
                                }}
                                numberOfLines={1}
                            >
                                {item.event}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 8.5,
                                color: '#999eab',
                            }}
                        >
                            {item.shootDateLabel}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 3,
                            }}
                        >
                            {item.shootDate && (
                                <>
                                    <Icon
                                        name="calendar-outline"
                                        size={11}
                                        color="#6366F1"
                                    />

                                    <Text
                                        style={{
                                            fontFamily: Fonts.Medium,
                                            fontSize: 10,
                                            color: '#626779',
                                            marginLeft: 4,
                                        }}
                                    >
                                        {item.shootDate}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 8.5,
                                color: '#999eab',
                            }}
                        >
                            Coordinator
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 3,
                            }}
                        >
                            <Icon name="account-outline" size={11} color="#6366F1" />
                            <Text
                                style={{
                                    fontFamily: Fonts.Medium,
                                    fontSize: 10,
                                    color: '#4b5062',
                                    marginLeft: 4,
                                    textTransform: 'capitalize'
                                }}
                                numberOfLines={1}
                            >
                                {item.coordinator}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* AMOUNT ROW */}

                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: 10,
                        paddingTop: 7,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 8.5,
                                color: '#999eab',
                            }}
                        >
                            Booking Amount
                        </Text>
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 10.5,
                                color: '#202235',
                                marginTop: 2,
                            }}
                        >
                            {formatMoney(item.bookingAmount)}
                        </Text>
                    </View>

                    <View style={{ flex: 0.75 }}>
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 8.5,
                                color: '#999eab',
                            }}
                        >
                            Paid
                        </Text>
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 10.5,
                                color: '#16A34A',
                                marginTop: 2,
                            }}
                        >
                            {formatMoney(item.paid)}
                        </Text>
                    </View>

                    <View style={{ flex: 0.75 }}>
                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 8.5,
                                color: '#999eab',
                            }}
                        >
                            Due
                        </Text>
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 10.5,
                                color: item.due > 0 ? '#EF233C' : '#16A34A',
                                marginTop: 2,
                            }}
                        >
                            {formatMoney(item.due)}
                        </Text>
                    </View>
                </View>

                {/* BOTTOM — action pill buttons: Approve / Reject / Done / Payment / Details */}

                <View
                    style={{
                        marginTop: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        backgroundColor: '#fafaff',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                    }}
                >
                    {/* ── APPROVE / REJECT — only when Assigned (pending review) ── */}

                    {item.status === 'Assigned' && (
                        <>
                            <TouchableOpacity
                                activeOpacity={0.75}
                                disabled={isSubmitting}
                                onPress={() => handleApprove(item)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 28,
                                    paddingHorizontal: 8,
                                    borderRadius: 8,
                                    backgroundColor: '#E8F8EF',
                                    borderWidth: 0.8,
                                    borderColor: '#16A34A',
                                    marginRight: 6,
                                    marginBottom: 4,
                                    opacity: isApproving ? 0.6 : 1,
                                }}
                            >
                                {isApproving ? (
                                    <ActivityIndicator size="small" color="#16A34A" />
                                ) : (
                                    <>
                                        <Icon
                                            name="check-circle-outline"
                                            size={12}
                                            color="#16A34A"
                                        />
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 8.5,
                                                color: '#16A34A',
                                                marginLeft: 3,
                                            }}
                                        >
                                            Accept
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* <TouchableOpacity
                                activeOpacity={0.75}
                                disabled={isSubmitting}
                                onPress={() => handleReject(item)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 28,
                                    paddingHorizontal: 8,
                                    borderRadius: 8,
                                    backgroundColor: '#FEF2F2',
                                    borderWidth: 0.8,
                                    borderColor: '#EF4444',
                                    marginRight: 6,
                                    marginBottom: 4,
                                    opacity: isRejecting ? 0.6 : 1,
                                }}
                            >
                                {isRejecting ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <>
                                        <Icon
                                            name="close-circle-outline"
                                            size={12}
                                            color="#EF4444"
                                        />
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 8.5,
                                                color: '#EF4444',
                                                marginLeft: 3,
                                            }}
                                        >
                                            Reject
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity> */}
                        </>
                    )}

                    {/* ── DONE — only when Accepted ── */}



                    {item.status === 'Accepted' && (
                        <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => openMarkDoneModal(item)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 28,
                                paddingHorizontal: 8,
                                borderRadius: 8,
                                backgroundColor: '#E8F8EF',
                                borderWidth: 0.8,
                                borderColor: '#16A34A',
                                marginRight: 6,
                                marginBottom: 4,
                            }}
                        >
                            <Icon
                                name="check-circle-outline"
                                size={12}
                                color="#16A34A"
                            />

                            <Text
                                style={{
                                    fontFamily: Fonts.Bold,
                                    fontSize: 8.5,
                                    color: '#16A34A',
                                    marginLeft: 3,
                                }}
                            >
                                Shoot Done
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* PAYMENT — left of Details */}

                    <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => openPaymentModal(item)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 0.6,
                            borderColor: '#d8d4ff',
                            borderRadius: 15,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            backgroundColor: '#f7f5ff',
                            marginRight: 6,
                            marginBottom: 4,
                        }}
                    >
                        <Icon name="cash-multiple" size={12} color="#6366F1" />
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                                color: '#6366F1',
                                marginLeft: 3,
                            }}
                        >
                            Payment
                        </Text>
                    </TouchableOpacity>

                    {/* DETAILS */}

                    {/* <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() =>
                            navigation.navigate('NewCoordination', {
                                bookingData: { ...item, client_id: item.clientId },
                            })
                        }
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 0.6,
                            borderColor: '#ddd9f8',
                            borderRadius: 15,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            backgroundColor: '#fff',
                            marginBottom: 4,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                                color: '#6366F1',
                            }}
                        >
                            Details
                        </Text>

                        <Icon name="chevron-right" size={12} color="#6366F1" style={{ marginLeft: 3 }} />
                    </TouchableOpacity> */}
                </View>
            </View>
        );
    };

    /* =====================================================
       EMPTY
    ===================================================== */

    const EmptyBox = () => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                paddingVertical: 40,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: '#e8e8f2',
            }}
        >
            <View
                style={{
                    width: 55,
                    height: 55,
                    borderRadius: 28,
                    backgroundColor:
                        '#f5f3ff',
                    justifyContent:
                        'center',
                    alignItems: 'center',
                }}
            >
                <Icon
                    name="camera-off-outline"
                    size={29}
                    color="#6366F1"
                />
            </View>

            <Text
                style={{
                    fontFamily: Fonts.Bold,
                    fontSize: 13,
                    color: '#202235',
                    marginTop: 10,
                }}
            >
                No assignments found
            </Text>

            <Text
                style={{
                    fontFamily: Fonts.Regular,
                    fontSize: 10,
                    color: '#9aa0ae',
                    marginTop: 4,
                }}
            >
                Try searching with another client or
                booking no.
            </Text>
        </View>
    );

    /* =====================================================
       ERROR
    ===================================================== */

    const ErrorBox = () => (
        <View
            style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                paddingVertical: 40,
                alignItems: 'center',
                borderWidth: 0.5,
                borderColor: '#e8e8f2',
            }}
        >
            <Icon name="alert-circle-outline" size={30} color="#EF4444" />

            <Text
                style={{
                    fontFamily: Fonts.Bold,
                    fontSize: 12,
                    color: '#202235',
                    marginTop: 10,
                    textAlign: 'center',
                    paddingHorizontal: 20,
                }}
            >
                {errorMsg}
            </Text>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => fetchAssignments()}
                style={{
                    marginTop: 14,
                    backgroundColor: Colors.buttonbgcolor,
                    borderRadius: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                }}
            >
                <Text
                    style={{
                        color: '#fff',
                        fontFamily: Fonts.Bold,
                        fontSize: 12,
                    }}
                >
                    Retry
                </Text>
            </TouchableOpacity>
        </View>
    );

    /* =====================================================
       RETURN
    ===================================================== */

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#f7f7fb',
            }}
        >
            <StatusBar
                backgroundColor={
                    Colors.buttonbgcolor
                }
                barStyle="light-content"
            />

            {/* HEADER */}

            <View
                style={{
                    height: 52,
                    backgroundColor:
                        Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    position: 'relative',
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                        navigation.goBack()
                    }
                    style={{
                        width: 34,
                        height: 34,
                        justifyContent:
                            'center',
                        alignItems:
                            'center',
                        zIndex: 2,
                    }}
                >
                    <Icon
                        name="arrow-left"
                        size={22}
                        color="#fff"
                    />
                </TouchableOpacity>

                <View
                    style={{
                        position: 'absolute',
                        left: 50,
                        right: 50,
                        top: 0,
                        bottom: 0,
                        alignItems:
                            'center',
                        justifyContent:
                            'center',
                    }}
                >
                    <Text
                        style={{
                            fontFamily:
                                Fonts.Bold,
                            fontSize: 15,
                            color: '#fff',
                            textAlign:
                                'center',
                        }}
                        numberOfLines={1}
                    >
                        My Assignments
                    </Text>


                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.buttonbgcolor} />
                </View>
            ) : (
                /* LIST */

                <FlatList
                    data={errorMsg ? [] : visibleAssignments}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <AssignmentCard item={item} />}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        padding: 12,
                        paddingBottom: 25,
                    }}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.buttonbgcolor]}
                            tintColor={Colors.buttonbgcolor}
                        />
                    }
                    ListHeaderComponent={
                        errorMsg ? (
                            <ErrorBox />
                        ) : (
                            <View>
                                {/* SEARCH */}
                                <View
                                    style={{
                                        height: 40,
                                        backgroundColor: '#fff',
                                        borderRadius: 10,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 10,
                                        borderWidth: 0.5,
                                        borderColor: '#e3e2f2',
                                        marginBottom: 10,
                                    }}
                                >
                                    <Icon name="magnify" size={18} color="#7774df" />

                                    <TextInput
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        placeholder="Search client, booking, purpose..."
                                        placeholderTextColor="#9999a8"
                                        style={{
                                            flex: 1,
                                            marginLeft: 7,
                                            padding: 0,
                                            fontFamily: Fonts.Regular,
                                            fontSize: 10.5,
                                            color: '#202235',
                                        }}
                                    />

                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <Icon name="close-circle" size={16} color="#c4c5d0" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* SECTION TITLE */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginBottom: 8,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 3,
                                            height: 15,
                                            borderRadius: 3,
                                            backgroundColor: Colors.buttonbgcolor,
                                            marginRight: 6,
                                        }}
                                    />

                                    <Text
                                        style={{
                                            fontFamily: Fonts.Bold,
                                            fontSize: 13,
                                            color: '#202235',
                                        }}
                                    >
                                        My Assignments
                                    </Text>

                                    <View
                                        style={{
                                            marginLeft: 6,
                                            paddingHorizontal: 7,
                                            paddingVertical: 2,
                                            borderRadius: 10,
                                            backgroundColor: '#eeecff',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: Fonts.Bold,
                                                fontSize: 9,
                                                color: '#6366F1',
                                            }}
                                        >
                                            {filteredAssignments.length}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )
                    }
                    ListEmptyComponent={
                        !errorMsg ? <EmptyBox /> : null
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={Colors.buttonbgcolor} />
                            </View>
                        ) : null
                    }
                />
            )}

            {/* =================================================
                PAYMENT MODAL — full CRUD
            ================================================= */}

            <PaymentModal
                visible={paymentModalVisible}
                item={paymentItem}
                onClose={closePaymentModal}
                history={paymentHistory}
                historyLoading={paymentHistoryLoading}
                amount={payAmount}
                setAmount={handlePayAmountChange}
                date={payDate}
                setDate={setPayDate}
                remark={payRemark}
                setRemark={text => {
                    setPayRemark(text);
                    if (payRemarkError) setPayRemarkError('');
                }}
                paymentType={payType}                                     // 👈 NEW
                setPaymentType={type => {                                  // 👈 NEW
                    setPayType(type);
                    if (payTypeError) setPayTypeError('');
                }}
                paymentTypeError={payTypeError}
                showDatePicker={payShowDatePicker}
                setShowDatePicker={setPayShowDatePicker}
                amountError={payAmountError}
                dateError={payDateError}
                remarkError={payRemarkError}
                maxAllowed={maxAllowedAmount}
                editingId={editingPaymentId}
                onStartEdit={startEditPayment}
                onCancelEdit={cancelEditPayment}
                onSubmit={submitPayment}
                onDelete={deletePayment}
                submitting={paymentSubmitting}
                deletingId={deletingPaymentId}
            />

            {/* =================================================
                DELETE PAYMENT CONFIRM MODAL
            ================================================= */}

            <Modal
                transparent
                visible={deleteConfirmModal}
                animationType="fade"
                onRequestClose={() => setDeleteConfirmModal(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setDeleteConfirmModal(false)}
                >
                    <View
                        style={{
                            width: '85%',
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 20,
                            elevation: 4,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 16,
                                color: '#0F172A',
                                textAlign: 'center',
                                marginBottom: 8,
                            }}
                        >
                            Delete Payment
                        </Text>

                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 14,
                                color: '#475569',
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            Delete this payment of {formatMoney(paymentToDelete?.amount || 0)}?
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setDeleteConfirmModal(false)}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#F1F5F9',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontFamily: Fonts.Medium, fontSize: 13, color: '#334155' }}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={confirmDeletePayment}
                                style={{
                                    minWidth: 100,
                                    backgroundColor: '#EF4444',
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontFamily: Fonts.Medium, fontSize: 13, color: '#FFFFFF' }}>
                                    Delete
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* =================================================
                MARK DONE MODAL
            ================================================= */}

            <MarkDoneModal
                visible={!!markDoneAssignment}
                assignment={markDoneAssignment}
                onClose={closeMarkDoneModal}
                amount={markDoneAmount}
                setAmount={setMarkDoneAmount}
                date={markDoneDate}
                showDatePicker={markDoneShowDatePicker}
                setShowDatePicker={setMarkDoneShowDatePicker}
                onDateChange={onMarkDoneDateChange}
                onSubmit={submitMarkDone}
                submitting={markDoneSubmitting}
            />

            {/* =================================================
    CONFIRM APPROVE / REJECT MODAL
================================================= */}

            <ConfirmActionModal
                visible={!!confirmAction}
                action={confirmAction}
                onClose={closeConfirmModal}
                onConfirm={proceedConfirmAction}
                submitting={!!submittingStatusId}
            />

            {/* =================================================
    DONE CONFIRMATION MODAL — asks before opening
    the full Mark Done (payment) form
================================================= */}

            <Modal
                visible={!!doneConfirmItem}
                transparent
                animationType="fade"
                onRequestClose={closeDoneConfirm}
                statusBarTranslucent
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center',
                        paddingHorizontal: 22,
                    }}
                    onPress={closeDoneConfirm}
                >
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 16,
                            padding: 18,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        <Icon
                            name="check-circle-outline"
                            size={40}
                            color="#16A34A"
                            style={{ alignSelf: 'center', marginBottom: 8 }}
                        />

                        <Text
                            style={{
                                fontFamily: Fonts.Bold,
                                fontSize: 15,
                                color: '#202235',
                                textAlign: 'center',
                            }}
                        >
                            Mark this shoot as Done?
                        </Text>

                        <Text
                            style={{
                                fontFamily: Fonts.Regular,
                                fontSize: 10.5,
                                color: '#7b8090',
                                textAlign: 'center',
                                marginTop: 6,
                                lineHeight: 15,
                            }}
                        >
                            {pendingDoneData
                                ? `Mark "${pendingDoneData.assignment.client}" as Final Done${pendingDoneData.amount ? ` with payment of ${formatMoney(pendingDoneData.amount)}` : ''}?`
                                : ''}
                        </Text>

                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 18,
                            }}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={closeDoneConfirm}
                                disabled={doneConfirmSubmitting}
                                style={{
                                    flex: 1,
                                    height: 43,
                                    borderRadius: 10,
                                    backgroundColor: '#F1F5F9',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 8,
                                    opacity: doneConfirmSubmitting ? 0.6 : 1,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: Fonts.Bold,
                                        fontSize: 12,
                                        color: '#334155',
                                    }}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={proceedDoneConfirm}
                                disabled={doneConfirmSubmitting}
                                style={{
                                    flex: 1,
                                    height: 43,
                                    borderRadius: 10,
                                    backgroundColor: '#16A34A',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: 8,
                                    opacity: doneConfirmSubmitting ? 0.7 : 1,
                                }}
                            >
                                {doneConfirmSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text
                                        style={{
                                            fontFamily: Fonts.Bold,
                                            fontSize: 12,
                                            color: '#fff',
                                        }}
                                    >
                                        Yes, Continue
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default Myassignments;

const styles = {};
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StatusBar,
    Modal,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform,
    Keyboard,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import Photographershimmer from '../Shimmer/photogrpher/Photographershimmer';

const STATUS_COLORS = {
    Confirmed: '#16A34A',
    Pending: '#F59E0B',
    Cancelled: '#EF4444',
};

const ASSIGNMENT_OPTIONS = ['Assigned', 'Accepted', 'Pending', 'Done'];

const ASSIGNMENT_COLORS = {
    Accepted: '#16A34A',
    Assigned: '#0284C7',
    Pending: '#F59E0B',
    Done: '#16A34A',
    Rejected: '#EF4444',       // 👈 ye line add karo
    'Not Assigned': '#64748b',
}

const STATUS_OPTIONS = ['Confirmed', 'Pending', 'Cancelled'];

const PAYMENT_TYPES = ['Cash', 'Online'];

const PAGE_SIZE = 20; // 👈 pagination size


/* =========================================================
   PAYMENT MODAL — full CRUD (Add / Edit / Delete)
========================================================= */

const formatMoney = value =>
    `₹${Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDateDDMMYYYY = dateStr => {
    if (!dateStr) return '-';
    const parts = String(dateStr).split('-');   // ['2026','09','03']
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
};

const formatDateDisplay = date => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const formatDateForApi = date => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

const parseApiDateToDateObj = dateStr => {
    if (!dateStr) return new Date();

    // API se "YYYY-MM-DD" ya "YYYY-MM-DD HH:mm:ss" format aata hai
    const datePart = String(dateStr).split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    if (!year || !month || !day) return new Date();

    return new Date(year, month - 1, day);   // 👈 explicit order: year, month(0-indexed), day
};

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
                                                {formatDateDisplay(date)}
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
                                                if (selectedDate) setDate(selectedDate);
                                                if (Platform.OS === 'android') setShowDatePicker(false);
                                            }}
                                            accentColor="#6366F1"
                                        />
                                    </View>
                                )}

                                {/* PAYMENT TYPE */}
                                <View style={{ marginTop: 12 }}>
                                    <Text style={{ fontFamily: Fonts.Medium, fontSize: 9.5, color: '#596078', marginBottom: 6 }}>
                                        Payment Type <Text style={{ color: '#EF233C' }}>*</Text>
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
                                                <Text
                                                    style={{
                                                        fontFamily: Fonts.Medium,
                                                        fontSize: 8.5,
                                                        color: '#626779',
                                                        marginTop: 2,
                                                    }}
                                                >
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

/* ── SHOOT CARD (bahar nikala + memo kiya — perf fix) ── */
const ShootCard = memo(
    ({ item, userType, onView, onStatusPress, onAssignmentPress, onCoordinatorView, onManagePayment }) => {

        const isAdmin = userType == 'Admin';
        const isCoordinator = userType == 'Coordinator';
        const isPhotographer = userType == 'Photographer';

        // 👇 payment row sirf Admin + Photographer ko dikhega, Coordinator ko kabhi nahi
        const showPaymentRow = isAdmin || isPhotographer;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                // onPress={() => onView(item)}
                style={{
                    backgroundColor: '#fff',
                    marginBottom: 7,
                    borderRadius: 11,
                    padding: 9,
                    borderLeftWidth: 3,
                    borderLeftColor: Colors.buttonbgcolor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                }}
            >
                {/* TOP */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                        style={{
                            width: 31,
                            height: 31,
                            borderRadius: 8,
                            backgroundColor: Colors.buttonbgcolor + '12',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 7,
                        }}
                    >
                        <Icon name="camera-outline" size={15} color={Colors.buttonbgcolor} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                minWidth: 0,
                            }}
                        >
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: '#172033',
                                    fontFamily: Fonts.Bold,
                                    fontSize: 12.5,
                                    flexShrink: 1,
                                    textTransform: 'capitalize',  // 👈 client name capitalize karne ke liye
                                }}
                            >
                                {item.client}
                            </Text>

                            {!!item.mobile_no && (
                                <>
                                    <Text
                                        style={{
                                            color: '#94a3b8',
                                            fontFamily: Fonts.Regular,
                                            fontSize: 10,
                                            marginHorizontal: 4,
                                        }}
                                    >
                                        -
                                    </Text>

                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            color: '#64748b',
                                            fontFamily: Fonts.Regular,
                                            fontSize: 9.5,
                                            flexShrink: 1,
                                        }}
                                    >
                                        {item.mobile_no}
                                    </Text>
                                </>
                            )}
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 2,
                            }}
                        >
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: Colors.buttonbgcolor,
                                    fontFamily: Fonts.Bold,
                                    fontSize: 9.5,
                                    maxWidth: '60%',
                                    textTransform: 'capitalize',  // 👈 purpose capitalize karne ke liye
                                }}
                            >
                                {item.purpose}
                            </Text>
                        </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', marginLeft: 7 }}>
                        <View
                            style={{
                                backgroundColor: '#f1f5f9',
                                borderRadius: 5,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                            }}
                        >
                            <Text style={{ color: '#475569', fontFamily: Fonts.Bold, fontSize: 8.5 }}>
                                #{item.id}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                            {item.hasBookingDate && item.date !== '-' && (
                                <Icon
                                    name="calendar-outline"
                                    size={9}
                                    color="#94a3b8"
                                />
                            )}
                            <Text
                                style={{
                                    color: '#94a3b8',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 8.5,
                                    marginLeft: (item.hasBookingDate && item.date !== '-') ? 2 : 0,
                                }}
                            >
                                {item.date}
                            </Text>
                        </View>
                    </View>
                </View>


                {/* PAYMENT ROW — sirf Admin & Photographer ko, Coordinator ko kabhi nahi */}
                {showPaymentRow && (
                    <>
                        <View
                            style={{
                                height: 0.5,
                                backgroundColor: '#eef2f6',
                                marginTop: 8,
                                marginBottom: 6,
                            }}
                        />

                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: '#a0aab8',
                                        fontFamily: Fonts.Regular,
                                        fontSize: 7.5,
                                    }}
                                >
                                    Booking Amount
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: '#334155',
                                        fontFamily: Fonts.Bold,
                                        fontSize: 10.5,
                                        marginTop: 1,
                                    }}
                                >
                                    ₹{Number(item.bookingAmount || 0).toLocaleString('en-IN')}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: '#a0aab8',
                                        fontFamily: Fonts.Regular,
                                        fontSize: 7.5,
                                    }}
                                >
                                    Paid Amount
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: '#16A34A',
                                        fontFamily: Fonts.Bold,
                                        fontSize: 10.5,
                                        marginTop: 1,
                                    }}
                                >
                                    ₹{Number(item.paidAmount || 0).toLocaleString('en-IN')}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: '#a0aab8',
                                        fontFamily: Fonts.Regular,
                                        fontSize: 7.5,
                                    }}
                                >
                                    Due Amount
                                </Text>
                                <Text
                                    numberOfLines={1}
                                    style={{
                                        color: Number(item.dueAmount) > 0 ? '#EF4444' : '#334155',
                                        fontFamily: Fonts.Bold,
                                        fontSize: 10.5,
                                        marginTop: 1,
                                    }}
                                >
                                    ₹{Number(item.dueAmount || 0).toLocaleString('en-IN')}
                                </Text>
                            </View>
                        </View>
                    </>
                )}
                {/* DIVIDER */}
                <View
                    style={{
                        height: 0.5,
                        backgroundColor: '#eef2f6',
                        marginTop: 7,
                        marginBottom: 6,
                    }}
                />

                {/* DETAILS + ACTIONS */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 1 }}>
                    {/* COORDINATOR NAME */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: '#a0aab8', fontFamily: Fonts.Regular, fontSize: 8 }}>
                            Coordinator
                        </Text>
                        <Text
                            numberOfLines={1}
                            style={{
                                color: '#334155',
                                fontFamily: Fonts.Bold,
                                fontSize: 10,
                                marginTop: 1,
                                textTransform: 'capitalize',  // 👈 coordinator name capitalize karne ke liye
                            }}
                        >
                            {item.coordinator}
                        </Text>
                    </View>

                    {/* ASSIGNMENT — Admin & Coordinator sirf view karenge, Photographer change kar sakta hai */}
                    {(isCoordinator || isAdmin) ? (
                        <View
                            style={{
                                marginLeft: 7,
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#94a3b8',
                                    fontFamily: Fonts.Regular,
                                    textAlign: 'center',
                                    fontSize: 8,
                                    marginBottom: 3,
                                    padding: 0,
                                }}
                            >
                                Status
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    alignSelf: 'flex-start',
                                    backgroundColor:
                                        ASSIGNMENT_COLORS[item.assignment] || '#64748b',
                                    borderRadius: 13,
                                    paddingHorizontal: 9,
                                    paddingVertical: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontFamily: Fonts.Bold,
                                        fontSize: 8.5,
                                        padding: 0,
                                        margin: 0,
                                    }}
                                >
                                    {item.assignment}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => onAssignmentPress(item)}
                            style={{
                                marginLeft: 7,
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#94a3b8',
                                    fontFamily: Fonts.Regular,
                                    fontSize: 8,
                                    marginBottom: 3,
                                    textAlign: 'center',
                                    padding: 0,
                                }}
                            >
                                Status
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    alignSelf: 'flex-start',
                                    backgroundColor:
                                        ASSIGNMENT_COLORS[item.assignment] || '#64748b',
                                    borderRadius: 13,
                                    paddingHorizontal: 9,
                                    paddingVertical: 4,
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontFamily: Fonts.Bold,
                                        fontSize: 8.5,
                                        padding: 0,
                                        margin: 0,
                                    }}
                                >
                                    {item.assignment}
                                </Text>

                                <Icon
                                    name="chevron-down"
                                    size={10}
                                    color="#fff"
                                    style={{
                                        marginLeft: 3,
                                    }}
                                />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* MANAGE PAYMENT — Admin only, status ke baju mein */}
                    {isAdmin && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => onManagePayment(item)}
                            style={{
                                borderRadius: 13,
                                paddingHorizontal: 9,
                                paddingVertical: 4,
                                backgroundColor: Colors.buttonbgcolor + '15',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 5,
                            }}
                        >
                            <Text
                                style={{
                                    color: Colors.buttonbgcolor,
                                    fontFamily: Fonts.Bold,
                                    fontSize: 8.5,
                                    marginRight: 3,
                                }}
                            >
                                Payment
                            </Text>
                            <Icon name="cash-multiple" size={10} color={Colors.buttonbgcolor} />
                        </TouchableOpacity>
                    )}

                    {/* PHOTOGRAPHER → DONE button */}
                    {isPhotographer && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={{
                                height: 28,
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                backgroundColor: Colors.buttonbgcolor,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 5,
                            }}
                        >
                            <Icon name="check-bold" size={10} color="#fff" />
                            <Text
                                style={{
                                    color: '#fff',
                                    fontFamily: Fonts.Bold,
                                    fontSize: 9,
                                    marginLeft: 4,
                                }}
                            >
                                Done
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* COORDINATOR → VIEW button (NewCoordination pe navigate) */}
                    {/* COORDINATOR → VIEW button (NewCoordination pe navigate) */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onCoordinatorView(item)}
                        style={{
                            borderRadius: 13,
                            paddingHorizontal: 9,
                            paddingVertical: 4,
                            backgroundColor: Colors.buttonbgcolor + '15',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 5,
                        }}
                    >
                        <Text
                            style={{
                                color: Colors.buttonbgcolor,
                                fontFamily: Fonts.Bold,
                                fontSize: 8.5,
                                marginRight: 3,
                            }}
                        >
                            Details
                        </Text>
                        <Icon name="arrow-right" size={10} color={Colors.buttonbgcolor} />
                    </TouchableOpacity>
                </View>


            </TouchableOpacity>
        );
    }
);

const Photographerassignment = () => {
    const navigation = useNavigation();

    const [shoots, setShoots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [userType, setUserType] = useState('');

    const [searchQuery, setSearchQuery] = useState('');

    // 👇 pagination — sirf itne items render honge, scroll pe aur badhega
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);



    const [userTypeLoaded, setUserTypeLoaded] = useState(false);

    /* =====================================================
   PAYMENT MANAGEMENT (CRUD)
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


    const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);   // 👈 add
    const [paymentToDelete, setPaymentToDelete] = useState(null);          // 👈 add

    const maxAllowedAmount = useMemo(() => {
        if (!paymentItem) return 0;
        const paidExcludingEditing = paymentHistory.reduce((sum, p) => {
            if (editingPaymentId && String(p.id) === String(editingPaymentId)) return sum;
            return sum + Number(p.amount || 0);
        }, 0);
        return Math.max(Number(paymentItem.bookingAmount || 0) - paidExcludingEditing, 0);
    }, [paymentItem, paymentHistory, editingPaymentId]);

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
                    client_id: item.client_id,
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
                client_id: paymentItem.client_id,
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

            console.log('========== PAYMENT SUBMIT ==========');
            console.log('URL:', url);
            console.log('Payload:', JSON.stringify(payload, null, 2));
            console.log('=====================================');

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            console.log('========== PAYMENT RESPONSE ==========');
            console.log(JSON.stringify(json, null, 2));
            console.log('=======================================');

            if (json?.status) {
                await fetchPaymentHistory(paymentItem);

                const newPaid = paymentHistory.reduce((sum, p) => {
                    if (editingPaymentId && String(p.id) === String(editingPaymentId)) return sum;
                    return sum + Number(p.amount || 0);
                }, 0) + amountNum;

                setShoots(prev =>
                    prev.map(s =>
                        s.id === paymentItem.id
                            ? {
                                ...s,
                                paidAmount: newPaid,
                                dueAmount: Math.max(Number(s.bookingAmount || 0) - newPaid, 0),
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

                setShoots(prev =>
                    prev.map(s =>
                        s.id === paymentItem.id
                            ? {
                                ...s,
                                paidAmount: newPaid,
                                dueAmount: Math.max(Number(s.bookingAmount || 0) - newPaid, 0),
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

    const fetchUserType = async () => {
        try {
            const userId = await AsyncStorage.getItem('id');

            const res = await fetch(API.list_usertype, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId }),
            });

            const result = await res.json();

            if (result.code == 200 && result.payload.length > 0) {
                setUserType(result.payload[0].user_type?.trim());
            } else {
                setUserType('');
            }
        } catch (e) {
            setUserType('');
        } finally {
            setUserTypeLoaded(true);
        }
    };

    useEffect(() => {
        fetchUserType();
    }, []);

    const formatDate = dateStr => {
        if (!dateStr || dateStr === '0000-00-00') return '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        return `${day} ${month} ${d.getFullYear()}`;
    };

    const mapRow = row => ({
        id: row.order_no,
        date: row.booking_date
            ? formatDate(row.booking_date)
            : (row.shoot_month || '-'),

        hasBookingDate: !!row.booking_date,
        purpose: row.purpose || '-',
        city: row.city,
        client: row.client_name,
        client_id: row.client_id,
        mobile_no: row.mobile_no,
        coordinator: row.coordinator_name || '-',
        status:
            row.booking_final_status === 'Done'
                ? 'Confirmed'
                : row.booking_final_status === 'In Process'
                    ? 'Pending'
                    : row.booking_final_status || 'Pending',
        assignment: row.assignment_status || 'Not Assigned',
        // 👇 amount modal hata diya — ab card pe hi Admin + Photographer ko dikhega
        bookingAmount: row.booking_amount,
        paidAmount: row.paid_amount,
        dueAmount: row.due_amount,
        raw: row, // 👈 poora original row bhi rakh liya, NewCoordination ko chahiye ho sakta hai
    });

    const fetchAssignments = useCallback(async (query = '') => {
        try {
            setErrorMsg('');
            const adminId = await AsyncStorage.getItem('id');

            const payload = { admin_id: adminId, search: query || '' };

            const res = await fetch(API.photographer_assignments_list, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const responseText = await res.text();

            let json;
            try {
                json = JSON.parse(responseText);
            } catch (parseError) {
                setErrorMsg('Invalid API response.');
                return;
            }

            const list = json?.data?.items || [];
            const mappedList = Array.isArray(list) ? list.map(mapRow) : [];

            setShoots(mappedList);
            setVisibleCount(PAGE_SIZE); // 👈 naya fetch hone pe pagination reset
        } catch (err) {
            setErrorMsg('Something went wrong. Pull to refresh.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAssignments(searchQuery);
    };

    const filteredShoots = shoots.filter(item => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            (item.client || '').toLowerCase().includes(q) ||
            (item.purpose || '').toLowerCase().includes(q) ||
            (item.id || '').toLowerCase().includes(q)
        );
    });

    // 👇 jitna visibleCount utna hi slice — baki lazy load hoga scroll pe
    const pagedShoots = filteredShoots.slice(0, visibleCount);

    const loadMore = () => {
        if (visibleCount < filteredShoots.length) {
            setVisibleCount(prev => prev + PAGE_SIZE);
        }
    };

    const openViewModal = item => {
        setSelectedItem(item);
        setViewModalVisible(true);
    };

    const openStatusModal = item => {
        setSelectedItem(item);
        setStatusModalVisible(true);
    };

    const openAssignmentModal = item => {
        setSelectedItem(item);
        setAssignmentModalVisible(true);
    };

    const goToCoordination = item => {
        navigation.navigate('NewCoordination', {
            bookingData: item,
        });
    };

    const changeAssignment = newAssignment => {
        setShoots(prev =>
            prev.map(s => (s.id === selectedItem.id ? { ...s, assignment: newAssignment } : s))
        );
        setAssignmentModalVisible(false);
    };

    const changeStatus = newStatus => {
        setShoots(prev =>
            prev.map(s => (s.id === selectedItem.id ? { ...s, status: newStatus } : s))
        );
        setStatusModalVisible(false);
    };

    const renderItem = useCallback(
        ({ item }) => (
            <ShootCard
                item={item}
                userType={userType}
                onView={openViewModal}
                onStatusPress={openStatusModal}
                onAssignmentPress={openAssignmentModal}
                onCoordinatorView={goToCoordination}
                onManagePayment={openPaymentModal}
            />
        ),
        [userType]
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View
                style={{
                    height: 50,
                    backgroundColor: Colors.buttonbgcolor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ width: 38, height: 50, justifyContent: 'center', alignItems: 'center' }}
                >
                    <Icon name="arrow-left" size={23} color="#fff" />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 14.5,
                            fontFamily: Fonts.Bold,
                            textAlign: 'center',
                        }}
                    >
                        Photographer Assignments
                    </Text>
                </View>

                <View style={{ width: 38 }} />
            </View>

            {/* CONTENT */}
            <View style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
                {/* SEARCH BAR */}
                <View
                    style={{
                        marginHorizontal: 12,
                        marginTop: 10,
                        backgroundColor: '#fff',
                        borderRadius: 11,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 11,
                        height: 40,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                    }}
                >
                    <Icon name="magnify" size={18} color="#94a3b8" />

                    <TextInput
                        value={searchQuery}
                        onChangeText={text => {
                            setSearchQuery(text);
                            setVisibleCount(PAGE_SIZE); // 👈 search karte hi pagination reset
                        }}
                        placeholder="Search by client, purpose or booking no."
                        placeholderTextColor="#94a3b8"
                        style={{
                            flex: 1,
                            marginLeft: 8,
                            fontFamily: Fonts.Regular,
                            fontSize: 11.5,
                            color: '#1e293b',
                            padding: 0,
                        }}
                    />

                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchQuery('');
                                setVisibleCount(PAGE_SIZE);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Icon name="close-circle" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* SECTION HEADER */}
                <View
                    style={{
                        paddingHorizontal: 12,
                        paddingTop: 10,
                        paddingBottom: 7,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="camera-outline" size={17} color={Colors.buttonbgcolor} />
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: Fonts.Bold,
                                color: '#0f172a',
                                marginLeft: 6,
                            }}
                        >
                            Active Shoots
                        </Text>

                        <View
                            style={{
                                backgroundColor: '#dbeafe',
                                borderRadius: 15,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                marginLeft: 6,
                            }}
                        >
                            <Text style={{ fontSize: 10, fontFamily: Fonts.Bold, color: '#0284C7' }}>
                                {filteredShoots.length}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flex: 1 }} />

                    <View
                        style={{
                            backgroundColor: Colors.buttonbgcolor + '12',
                            borderRadius: 15,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#16A34A',
                                marginRight: 5,
                            }}
                        />
                        <Text
                            style={{ fontSize: 8.5, fontFamily: Fonts.Bold, color: Colors.buttonbgcolor }}
                        >
                            Assigned / Accepted / Pending
                        </Text>
                    </View>
                </View>

                {/* LIST */}
                {loading ? (
                    <Photographershimmer count={6} />
                ) : filteredShoots.length === 0 ? (
                    <View
                        style={{
                            marginHorizontal: 12,
                            marginTop: 4,
                            backgroundColor: '#fff',
                            borderRadius: 12,
                            paddingVertical: 30,
                            alignItems: 'center',
                            elevation: 1,
                        }}
                    >
                        <View
                            style={{
                                width: 55,
                                height: 55,
                                borderRadius: 28,
                                backgroundColor: '#f1f5f9',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 10,
                            }}
                        >
                            <Icon
                                name={searchQuery ? 'text-box-search-outline' : 'camera-off-outline'}
                                size={30}
                                color="#94a3b8"
                            />
                        </View>

                        <Text style={{ fontSize: 13, fontFamily: Fonts.Bold, color: '#1e293b' }}>
                            {errorMsg ? errorMsg : searchQuery ? 'No matching shoots' : 'No active shoots'}
                        </Text>

                        <Text
                            style={{
                                fontSize: 11,
                                fontFamily: Fonts.Regular,
                                color: '#94a3b8',
                                marginTop: 3,
                            }}
                        >
                            {searchQuery
                                ? 'Try a different client, purpose or booking no.'
                                : 'Assignments will appear here.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={pagedShoots}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={{
                            paddingHorizontal: 10,
                            paddingTop: 2,
                            paddingBottom: 20,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[Colors.buttonbgcolor]}
                            />
                        }
                        // 👇 pagination + perf tuning
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.4}
                        initialNumToRender={PAGE_SIZE}
                        maxToRenderPerBatch={PAGE_SIZE}
                        windowSize={7}
                        removeClippedSubviews
                        ListFooterComponent={
                            visibleCount < filteredShoots.length ? (
                                <ActivityIndicator
                                    size="small"
                                    color={Colors.buttonbgcolor}
                                    style={{ marginVertical: 14 }}
                                />
                            ) : null
                        }
                    />
                )}
            </View>

            {/* VIEW DETAILS MODAL */}
            <Modal
                visible={viewModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setViewModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setViewModalVisible(false)}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(15,23,42,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 18,
                        }}
                    >
                        <TouchableWithoutFeedback>
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#fff',
                                    borderRadius: 15,
                                    padding: 16,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 8,
                                    }}
                                >
                                    <Text
                                        style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}
                                    >
                                        Shoot Details
                                    </Text>

                                    <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                                        <Icon name="close" size={21} color="#64748b" />
                                    </TouchableOpacity>
                                </View>

                                {selectedItem && (
                                    <>
                                        {[
                                            ['Booking ID', selectedItem.id],
                                            ['Date', selectedItem.date],
                                            ['Purpose', selectedItem.purpose],
                                            ['City', selectedItem.city],
                                            ['Client', selectedItem.client],
                                            ['Coordinator', selectedItem.coordinator],
                                        ].map(([label, value]) => (
                                            <View
                                                key={label}
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    paddingVertical: 8,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#f1f5f9',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        fontFamily: Fonts.Regular,
                                                        color: '#94a3b8',
                                                    }}
                                                >
                                                    {label}
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: Fonts.Bold,
                                                        color: '#1e293b',
                                                    }}
                                                >
                                                    {value}
                                                </Text>
                                            </View>
                                        ))}

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                paddingVertical: 8,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontFamily: Fonts.Regular,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                Status
                                            </Text>

                                            <View
                                                style={{
                                                    backgroundColor:
                                                        STATUS_COLORS[selectedItem.status] || '#64748b',
                                                    borderRadius: 15,
                                                    paddingHorizontal: 9,
                                                    paddingVertical: 4,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 10,
                                                        fontFamily: Fonts.Bold,
                                                        color: '#fff',
                                                    }}
                                                >
                                                    {selectedItem.status}
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                paddingTop: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontFamily: Fonts.Regular,
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                Assignment
                                            </Text>

                                            <View
                                                style={{
                                                    backgroundColor:
                                                        ASSIGNMENT_COLORS[selectedItem.assignment] ||
                                                        '#64748b',
                                                    borderRadius: 15,
                                                    paddingHorizontal: 9,
                                                    paddingVertical: 4,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 10,
                                                        fontFamily: Fonts.Bold,
                                                        color: '#fff',
                                                    }}
                                                >
                                                    {selectedItem.assignment}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* STATUS MODAL */}
            <Modal
                visible={statusModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setStatusModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(15,23,42,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 18,
                        }}
                    >
                        <TouchableWithoutFeedback>
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#fff',
                                    borderRadius: 15,
                                    padding: 16,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 5,
                                    }}
                                >
                                    <Text
                                        style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}
                                    >
                                        Change Status
                                    </Text>

                                    <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                                        <Icon name="close" size={21} color="#64748b" />
                                    </TouchableOpacity>
                                </View>

                                {STATUS_OPTIONS.map(opt => {
                                    const isSelected = selectedItem?.status === opt;
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 11,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#f1f5f9',
                                            }}
                                            onPress={() => changeStatus(opt)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View
                                                    style={{
                                                        width: 9,
                                                        height: 9,
                                                        borderRadius: 5,
                                                        backgroundColor: STATUS_COLORS[opt],
                                                        marginRight: 9,
                                                    }}
                                                />
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: Fonts.Bold,
                                                        color: '#1e293b',
                                                    }}
                                                >
                                                    {opt}
                                                </Text>
                                            </View>

                                            {isSelected && (
                                                <Icon
                                                    name="check-circle"
                                                    size={18}
                                                    color={STATUS_COLORS[opt]}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* ASSIGNMENT MODAL */}
            <Modal
                visible={assignmentModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAssignmentModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setAssignmentModalVisible(false)}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(15,23,42,0.5)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 18,
                        }}
                    >
                        <TouchableWithoutFeedback>
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#fff',
                                    borderRadius: 15,
                                    padding: 16,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 5,
                                    }}
                                >
                                    <Text
                                        style={{ fontSize: 15, fontFamily: Fonts.Bold, color: '#1e293b' }}
                                    >
                                        Change Assignment
                                    </Text>

                                    <TouchableOpacity onPress={() => setAssignmentModalVisible(false)}>
                                        <Icon name="close" size={21} color="#64748b" />
                                    </TouchableOpacity>
                                </View>

                                {ASSIGNMENT_OPTIONS.map(opt => {
                                    const isSelected = selectedItem?.assignment === opt;
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 11,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#f1f5f9',
                                            }}
                                            onPress={() => changeAssignment(opt)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View
                                                    style={{
                                                        width: 9,
                                                        height: 9,
                                                        borderRadius: 5,
                                                        backgroundColor:
                                                            ASSIGNMENT_COLORS[opt] || '#64748b',
                                                        marginRight: 9,
                                                    }}
                                                />
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: Fonts.Bold,
                                                        color: '#1e293b',
                                                    }}
                                                >
                                                    {opt}
                                                </Text>
                                            </View>

                                            {isSelected && (
                                                <Icon
                                                    name="check-circle"
                                                    size={18}
                                                    color={ASSIGNMENT_COLORS[opt] || '#64748b'}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

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
        </View>
    );
};

export default Photographerassignment;
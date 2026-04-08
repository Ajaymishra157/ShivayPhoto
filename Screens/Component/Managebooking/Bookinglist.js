import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, StatusBar, RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { API, Colors, Fonts } from '../Commoncomponent/Constants';
import ListBookingShimmer from '../Shimmer/Booking/ListBookingShimmer';


const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    const dateObj = new Date(dateString);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const Bookinglist = ({ navigation }) => {
    const [bookings, setBookings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isFirstBookingDone, setIsFirstBookingDone] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await fetch(API.list_booking);
            const result = await response.json();

            if (result.code == 200) {
                setBookings(result.payload);
                setFiltered(result.payload);
            } else {
                setBookings([]);
                setFiltered([]);
            }
        } catch (e) {
            setBookings([]);
            setFiltered([]);
        }
        setIsFirstBookingDone(true);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            if (search === '') {
                fetchBookings();
            }
        }, [search])
    );

    const handleSearch = (text) => {
        setSearch(text);
        const q = text.toLowerCase();

        setFiltered(
            bookings.filter(b =>
                (b.client_name || '').toLowerCase().includes(q) ||
                (b.client_mobile || '').toLowerCase().includes(q) ||
                (b.client_address || '').toLowerCase().includes(q)
            )
        );
    };

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('BookingDetail', {
                client_id: item.client_id
            })}
            style={{
                backgroundColor: '#fff',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 6,
                marginVertical: 7,
                borderWidth: 1,
                borderColor: '#ddd',
                position: 'relative'
            }}
        >

            {/* STATUS */}
            <View style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#d4edda',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderBottomLeftRadius: 6,
                borderTopRightRadius: 6,
                zIndex: 2
            }}>
                <Text style={{
                    fontSize: 10,
                    fontFamily: 'Inter-Bold',
                    color: '#155724'
                }}>
                    {item.status || '--'}
                </Text>
            </View>

            {/* RIGHT ARROW */}
            <View style={{
                position: 'absolute',
                right: 5,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                padding: 6
            }}>
                <View style={{
                    borderRadius: 30,
                    borderWidth: 0.6,
                    borderColor: '#c1c2c4',
                    padding: 6,
                    backgroundColor: '#fff'
                }}>
                    <Icon name="chevron-right" size={20} color="#2c3e50" />
                </View>
            </View>

            {/* INDEX */}
            <Text style={{
                fontSize: 11,
                color: '#2c3e50',
                marginBottom: 4,
                fontFamily: 'Inter-Bold'
            }}>
                #{index + 1}
            </Text>

            {/* NAME */}
            <Text>
                <Text style={{
                    fontSize: 13,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Name :
                </Text>
                <Text style={{
                    fontSize: 13,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.client_name || '--'}
                </Text>
            </Text>

            {/* MOBILE */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Mobile :
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.client_mobile || '--'}
                </Text>
            </Text>

            {/* ADDRESS */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Address :
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{item.client_address || '--'}
                </Text>
            </Text>

            {/* ENTRY DATE */}
            <Text style={{ marginTop: 5 }}>
                <Text style={{
                    fontSize: 12,
                    color: '#2c3e50',
                    fontFamily: 'Inter-Bold'
                }}>
                    Entry On :
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: '#7f8c8d',
                    fontFamily: 'Inter-Regular'
                }}>
                    {" "}{formatDateTime(item.entry_date)}
                </Text>
            </Text>

        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6f8' }}>
            <StatusBar backgroundColor={Colors.buttonbgcolor} barStyle="light-content" />

            {/* HEADER */}
            <View style={{
                height: 52,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.buttonbgcolor,
                paddingHorizontal: 12,
            }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ width: 36 }}
                >
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 17,
                    fontFamily: 'Inter-Bold',
                    color: '#fff',
                }}>
                    Bookings
                </Text>

                <View style={{ width: 36 }} />
            </View>

            {/* SEARCH */}
            {(!isFirstBookingDone || bookings.length > 0 || search.length > 0) && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    margin: 14,
                    paddingHorizontal: 12,
                    height: 44,
                    borderWidth: 0.5,
                    borderColor: '#e2e8f0',
                    gap: 8,
                }}>
                    <Icon name="magnify" size={18} color="#94a3b8" />
                    <TextInput
                        placeholder="Search by name, mobile, address..."
                        value={search}
                        onChangeText={handleSearch}
                        style={{
                            flex: 1,
                            fontSize: 13,
                            fontFamily: Fonts.Regular,
                            color: '#1e293b',
                        }}
                        placeholderTextColor="#c0ccd8"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Icon name="close-circle" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* COUNT */}
            {(!isFirstBookingDone || bookings.length > 0 || search.length > 0) && (
                <Text style={{
                    fontSize: 12,
                    fontFamily: Fonts.Regular,
                    color: '#94a3b8',
                    marginLeft: 16,
                    marginBottom: 4,
                }}>
                    {filtered.length} booking{filtered.length !== 1 ? 's' : ''} found
                </Text>
            )}

            {/* LIST */}
            {loading ? (
                <ListBookingShimmer />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, index) => item.client_id?.toString() || index.toString()}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 4, paddingHorizontal: 12 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.buttonbgcolor]} />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 220 }}>
                            <Icon name="calendar-remove-outline" size={48} color="#cbd5e1" />
                            <Text style={{
                                fontSize: 14,
                                fontFamily: Fonts.Regular,
                                color: '#94a3b8',
                                marginTop: 12,
                            }}>
                                No Bookings Found
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FLOATING + BUTTON */}
            <TouchableOpacity
                onPress={() => navigation.navigate('AddBooking')}
                style={{
                    position: 'absolute',
                    bottom: 25,
                    right: 20,
                    backgroundColor: Colors.buttonbgcolor,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 10,
                }}
            >
                <Icon name="plus" size={28} color="#fff" />
            </TouchableOpacity>

        </SafeAreaView>
    );
};

export default Bookinglist;
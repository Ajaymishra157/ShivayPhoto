// managebookingdashboard.js
import React from 'react';
import { SafeAreaView, ScrollView, TouchableOpacity, Text, StatusBar, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../Commoncomponent/Constants';

const bookingMenuItems = [
    {
        name: 'Booking',
        icon: 'clipboard-text-clock-outline', // 📋 booking list
        color: '#0284C7',
        screen: 'Bookinglist',
    },
    {
        name: 'Calendar',
        icon: 'calendar-month-outline', // 📅 calendar view
        color: '#16A34A',
        screen: 'Calendarlist',
    },
];

const ManageBookingDashboard = ({ navigation }) => {
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
                    style={{ width: 36, justifyContent: 'center', alignItems: 'flex-start' }}
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
                    Booking Dashboard
                </Text>

                <View style={{ width: 36 }} />
            </View>

            {/* MENU */}
            <ScrollView
                contentContainerStyle={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 45,
                    padding: 12,
                }}
                style={{ marginTop: 12 }}
                keyboardShouldPersistTaps="handled"
            >
                {bookingMenuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate(item.screen)}
                        style={{
                            width: '30%',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 14,
                            paddingVertical: 18,
                            alignItems: 'center',
                            marginBottom: 18,
                            elevation: 2,
                            shadowColor: '#000',
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                        }}
                    >
                        <Icon name={item.icon} size={34} color={item.color} />

                        <Text
                            style={{
                                marginTop: 10,
                                fontSize: 13,
                                textAlign: 'center',
                                color: Colors.listtext,
                                fontFamily: Fonts.Regular,
                            }}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ManageBookingDashboard;
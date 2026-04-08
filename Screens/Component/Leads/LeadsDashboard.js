// LeadsDashboard.js
import React from 'react';
import { SafeAreaView, ScrollView, TouchableOpacity, Text, StatusBar, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../Commoncomponent/Constants';

const leadsMenuItems = [
    {
        name: 'Manage Leads',
        icon: 'clipboard-list-outline',
        color: '#0284C7',
        screen: 'ManageLeads',
    },
    {
        name: 'Add Leads',
        icon: 'plus-box-outline',
        color: '#16A34A',
        screen: 'AddLeads',
    },
    {
        name: 'Pending / Pre Inquiry',
        icon: 'clock-outline',
        color: '#F59E0B',
        screen: 'PendingLeadList',
    },
];

const LeadsDashboard = ({ navigation }) => {
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
                    Leads Dashboard
                </Text>
                <View style={{ width: 36 }} />
            </View>
            <ScrollView
                contentContainerStyle={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    padding: 12,
                }}
                style={{ marginTop: 12 }}
                keyboardShouldPersistTaps="handled"
            >
                {leadsMenuItems.map((item, index) => (
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
                        <Icon name={item.icon} size={32} color={item.color} />

                        <Text
                            style={{
                                marginTop: 8,
                                fontSize: 12,
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

export default LeadsDashboard;